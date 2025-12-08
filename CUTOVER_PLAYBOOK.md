# Cutover Playbook (Draft for Station 56)

## Preconditions

- Candidate storage: `storage_candidate/v1/` present, scan green (schema/FK/invariants/PII/checksum/merkle).
- Registries approved and frozen.
- Downtime/maintenance window agreed.
- Rollback assets prepared: snapshot of current storage + registries.

## Roles

- Operator: runs commands below.
- Reviewer: verifies reports/hashes.

## Steps

1. Freeze writes in source system (mock in this repo: N/A; real env: block writes).
2. Run integrity scan on candidate:
   - `node tools/migration/cli.js scan-all`
   - Confirm `storage_reports/latest-scan/summary.json` shows 0 BLOCKER/WARNING.
3. Verify checksums/merkle only:
   - `node tools/migration/cli.js verify-checksums`
4. Record hashes:
   - Per-module Merkle roots from `storage_candidate/v1/<module>/checksums/merkle.json`.
   - Run metadata from `storage_candidate/v1/checksums/run.json`.
5. Flip pointer/config to use candidate storage (implementation-dependent; not in repo).
6. Smoke-test critical paths (read-only): open app, load modules, confirm no errors.
7. If any blocker is found post-flip: rollback immediately (see below).

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
