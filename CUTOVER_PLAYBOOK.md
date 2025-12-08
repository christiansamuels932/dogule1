# Cutover Playbook (Draft for Station 56 – Candidate Only)

## Preconditions

- Candidate storage: `storage_candidate/v1/` present, scan green (schema/FK/invariants/PII/checksum/merkle).
- Inputs locked: mock DB (`modules/shared/api/db/index.js`) + registries (`migration/mapping/*.json`); `MIGRATE_RUN_ID` default `run-local`, scans default `scan-all`.
- Registries approved and frozen.
- Downtime/maintenance window agreed.
- Rollback assets prepared: snapshot of current storage + registries.

## Roles

- Operator: runs commands below.
- Reviewer: verifies reports/hashes.

## Steps

1. Freeze writes in source system (mock in this repo: N/A; real env: block writes).
2. Build/refresh candidate (if not already green):
   - Clean previous artifacts: `rm -rf storage_candidate/v1 storage_reports/latest-*`
   - `node tools/migration/cli.js dry-run` (expect 0 BLOCKER)
   - `node tools/migration/cli.js migrate` (writes `storage_candidate/v1`, runId=run-local unless overridden)
3. Validate candidate:
   - `node tools/migration/cli.js scan-all`
   - Confirm `storage_reports/latest-scan/summary.json` shows 0 BLOCKER/WARNING.
   - Optional determinism check: copy `storage_candidate/v1` → `storage_candidate/v1-run1`, rerun step 2, then `diff -r storage_candidate/v1-run1 storage_candidate/v1` (expect no output); remove `v1-run1` after check.
4. Record hashes:
   - Per-module Merkle roots from `storage_candidate/v1/<module>/checksums/merkle.json`.
   - Run metadata from `storage_candidate/v1/checksums/run.json` (runId + module roots).
5. Rollback drill (pre-cutover sanity):
   - Inject failure: `MIGRATE_FAIL_AFTER_MODULE=kurse node tools/migration/cli.js migrate` → expect exit 1, no `storage_candidate/v1` left behind.
   - Rebuild clean candidate via steps 2–3 after drill.
6. Flip pointer/config to use candidate storage (implementation-dependent; not in repo).
7. Smoke-test critical paths (read-only): open app, load modules, confirm no errors.
8. If any blocker is found post-flip: rollback immediately (see below).

## Rollback

- Re-point to previous storage path/symlink.
- Restore previous registry snapshot if mutated (not expected in 53–55 scope).
- Re-run integrity scan on restored storage to confirm health.

## Post-Cutover Validation

- Re-run `scan-all` on live pointer.
- Check monitoring/logs for errors.

## Notes

- This playbook assumes offline candidate storage only; no runtime DB writes in this repo.
- Update with environment-specific commands before real use.
