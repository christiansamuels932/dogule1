#!/usr/bin/env node
const { spawnSync } = require("child_process");

function runGit(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(`git ${args.join(" ")} failed${stderr ? `: ${stderr}` : ""}`);
  }
  return (result.stdout || "").trim();
}

function refExists(ref) {
  try {
    runGit(["rev-parse", "--verify", ref]);
    return true;
  } catch {
    return false;
  }
}

function pickBaseRef() {
  for (const ref of ["origin/main", "main"]) {
    if (refExists(ref)) {
      return runGit(["merge-base", "HEAD", ref]);
    }
  }
  return runGit(["rev-list", "--max-parents=0", "HEAD"]);
}

function loadBaseCaptures(baseRef) {
  try {
    const output = runGit([
      "ls-tree",
      "-d",
      "--name-only",
      `${baseRef}:migration/legacy/station61`,
    ]);
    if (!output) return new Set();
    return new Set(
      output
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => `migration/legacy/station61/${name}`)
    );
  } catch (err) {
    if (err.message && err.message.includes("Not a valid object name")) {
      return new Set();
    }
    throw err;
  }
}

function getEnvCaptures(value) {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => `migration/legacy/station61/${name}`)
  );
}

function parseChangeLine(rawLine) {
  if (!rawLine) return null;
  const line = rawLine.trim();
  if (!line) return null;

  if (line.includes("\t")) {
    const [statusToken, filePath] = line.split("\t");
    return {
      status: (statusToken || "").trim(),
      path: (filePath || "").replace(/^"|"$/g, "").trim(),
    };
  }

  const match = line.match(/^([A-Z\?][0-9]*)\s+(.*)$/);
  if (!match) return null;

  const statusToken = match[1];
  const path = (match[2] || "").replace(/^"|"$/g, "").trim();

  return {
    status: statusToken === "??" ? "A" : statusToken[0],
    path,
  };
}

function main() {
  const injectedDiff = process.env.STATION61_DIFF;
  const injectedStatus = process.env.STATION61_STATUS;
  const injectedBaseRef = process.env.STATION61_BASE_REF;
  const injectedCaptures = process.env.STATION61_BASE_CAPTURES;

  const usingInjected =
    injectedDiff !== undefined || injectedStatus !== undefined;

  let baseRef;
  let baseCaptures;
  const changeLines = [];

  if (usingInjected) {
    baseRef = injectedBaseRef || "env-base";
    baseCaptures = getEnvCaptures(injectedCaptures);
    if (injectedDiff) changeLines.push(...injectedDiff.split("\n"));
    if (injectedStatus) changeLines.push(...injectedStatus.split("\n"));
  } else {
    baseRef = pickBaseRef();
    baseCaptures = loadBaseCaptures(baseRef);

    const diffOutput = runGit([
      "diff",
      "--name-status",
      baseRef,
      "HEAD",
      "--",
      "migration/legacy/station61",
    ]);
    if (diffOutput) changeLines.push(...diffOutput.split("\n"));

    const statusOutput = runGit([
      "status",
      "--porcelain=1",
      "-uall",
      "--",
      "migration/legacy/station61",
    ]);
    if (statusOutput) changeLines.push(...statusOutput.split("\n"));
  }

  const changes = changeLines
    .map(parseChangeLine)
    .filter((entry) => entry && entry.path);

  if (changes.length === 0) {
    console.log("Station 61 guard passed (no changes under station61)");
    return;
  }

  const violations = [];

  for (const change of changes) {
    const status = (change.status || "").trim();
    const firstStatus = status[0] || "";
    const filePath = change.path;

    if (!filePath.startsWith("migration/legacy/station61/")) continue;

    const parts = filePath.split("/");
    if (parts.length < 4) {
      violations.push(`Unexpected path under station61: ${filePath}`);
      continue;
    }

    const captureDir = parts[3];
    const capturePath = parts.slice(0, 4).join("/");

    if (!/^capture_\d{8}_\d{6}Z$/.test(captureDir)) {
      violations.push(`Invalid capture directory name: ${captureDir}`);
    }

    const existsInBase = baseCaptures.has(capturePath);
    if (existsInBase) {
      violations.push(`Existing capture is immutable: ${filePath}`);
      continue;
    }

    if (firstStatus !== "A") {
      violations.push(
        `Only brand-new capture additions are allowed (saw ${status} at ${filePath})`
      );
    }
  }

  if (violations.length) {
    console.error("Station 61 guard failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  const suffix = usingInjected
    ? "(env diff/status)"
    : `(base ${baseRef.slice(0, 7)})`;
  console.log(`Station 61 guard passed ${suffix}`);
}

try {
  main();
} catch (err) {
  console.error(`Station 61 guard error: ${err.message || err}`);
  process.exit(1);
}
