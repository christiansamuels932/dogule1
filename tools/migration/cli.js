#!/usr/bin/env node
/* eslint-env node */
/* global process, console */
import { runDryRun } from "./batchRunner.js";
import { writeReport } from "./reporter.js";

async function main() {
  const cmd = process.argv[2] || "dry-run";
  if (cmd !== "dry-run") {
    console.error("Only dry-run is supported in Station 53 skeleton.");
    process.exit(1);
  }
  try {
    const report = await runDryRun();
    const file = await writeReport(report);
    const blockers = report.flatMap((m) => m.issues.filter((i) => i.severity === "BLOCKER"));
    console.log(`Dry-run report written to ${file}`);
    if (blockers.length > 0) {
      console.error(`Dry-run completed with ${blockers.length} blockers`);
      process.exit(1);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
