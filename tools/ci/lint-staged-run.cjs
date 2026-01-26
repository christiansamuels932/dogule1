#!/usr/bin/env node
const { spawnSync } = require("node:child_process");

const args = process.argv.slice(2);
const sepIndex = args.indexOf("--");
if (args.length === 0 || sepIndex === -1) {
  console.error("lint-staged-run requires a command and -- before file list.");
  process.exit(1);
}

const command = args[0];
const fixedArgs = args.slice(1, sepIndex);
const files = args.slice(sepIndex + 1);
const filtered = files.filter((file) => {
  const normalized = String(file).replace(/\\/g, "/");
  if (normalized.includes("/.NAS-Distro/app/")) return false;
  if (normalized.startsWith(".NAS-Distro/app/")) return false;
  if (normalized.startsWith("../app/")) return false;
  return true;
});

if (!filtered.length) {
  process.exit(0);
}

const result = spawnSync(command, [...fixedArgs, ...filtered], { stdio: "inherit" });
process.exit(typeof result.status === "number" ? result.status : 1);
