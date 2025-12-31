#!/usr/bin/env node
/* eslint-env node */
/* global process, console */
import { runDryRun, runIngest } from "./runner.js";
import { runCustomersCsvImport } from "./customersCsvImport.js";

async function main() {
  const cmd = process.argv[2] || "dry-run";
  const args = process.argv.slice(3);
  const modulesArg = args.find((entry) => entry.startsWith("--modules="));
  const modules = modulesArg?.split("=")[1] || process.env.DOGTABS_MODULES || undefined;
  try {
    if (cmd === "dry-run") {
      const result = await runDryRun();
      console.log(`DogTabs dry-run report written to ${result.reportPath}`);
      const blockers = Object.values(result.report.issues || {})
        .flat()
        .filter((issue) => issue.severity === "BLOCKER");
      if (blockers.length > 0) {
        console.error(`Dry-run completed with ${blockers.length} blockers`);
        process.exit(1);
      }
      process.exit(0);
    }
    if (cmd === "ingest") {
      const result = await runIngest({ moduleFilter: modules });
      console.log(`DogTabs ingest report written to ${result.reportPath}`);
      if (result.report?.blocked) {
        console.error(`Ingest blocked by ${result.report.blockerCount} blockers`);
        process.exit(1);
      }
      process.exit(0);
    }
    if (cmd === "customers-csv") {
      const result = await runCustomersCsvImport({ sourcePath: process.argv[3] });
      console.log(`DogTabs customers CSV report written to ${result.reportPath}`);
      process.exit(0);
    }
    console.error(`Unknown command ${cmd}`);
    process.exit(1);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
