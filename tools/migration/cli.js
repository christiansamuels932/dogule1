#!/usr/bin/env node
/* eslint-env node */
/* global process, console */
import { runDryRun } from "./batchRunner.js";
import { writeReport } from "./reporter.js";
import { runScan } from "./scan.js";
import { runMigrate } from "./migrate.js";

async function main() {
  const cmd = process.argv[2] || "dry-run";
  try {
    if (cmd === "dry-run") {
      const report = await runDryRun();
      const file = await writeReport(report);
      const blockers = report.flatMap((m) => m.issues.filter((i) => i.severity === "BLOCKER"));
      console.log(`Dry-run report written to ${file}`);
      if (blockers.length > 0) {
        console.error(`Dry-run completed with ${blockers.length} blockers`);
        process.exit(1);
      }
      process.exit(0);
    }
    if (cmd === "scan-all") {
      const result = await runScan({ mode: "all" });
      process.exit(result.exitCode);
    }
    if (cmd === "scan-module") {
      const modules = process.argv.slice(3).filter(Boolean);
      const result = await runScan({ mode: "module", modules });
      process.exit(result.exitCode);
    }
    if (cmd === "scan-pii") {
      const result = await runScan({ mode: "pii" });
      process.exit(result.exitCode);
    }
    if (cmd === "scan-drift") {
      const result = await runScan({ mode: "drift" });
      process.exit(result.exitCode);
    }
    if (cmd === "verify-checksums") {
      const result = await runScan({ mode: "verify-checksums" });
      process.exit(result.exitCode);
    }
    if (cmd === "migrate") {
      const result = await runMigrate();
      console.log(`Migration candidate written to ${result.outputDir} (runId=${result.runId})`);
      process.exit(0);
    }
    console.error(`Unknown command ${cmd}`);
    process.exit(1);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
