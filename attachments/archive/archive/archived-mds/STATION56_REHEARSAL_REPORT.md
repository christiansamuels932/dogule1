# Station 56 Rehearsal Report

## Run Metadata

- Run ID: `run-local`
- Candidate path: `storage_candidate/v1/`
- Date: 2025-12-08T16:14:20+01:00
- Operator: Codex
- Inputs: Mock DB (`modules/shared/api/db/index.js`) + registries (`migration/mapping/*.json`)

## Commands Executed

- `node tools/migration/cli.js dry-run`
- `node tools/migration/cli.js migrate`
- `node tools/migration/cli.js scan-all`
- Determinism check: `diff -r storage_candidate/v1-run1 storage_candidate/v1` (second run after clean slate)
- Rollback drill: `MIGRATE_FAIL_AFTER_MODULE=kurse node tools/migration/cli.js migrate` (expected failure; verified cleanup), followed by clean rerun of dry-run → migrate → scan-all

## Findings

- Dry-run blockers: none (report in `storage_reports/latest-dry-run/`)
- Migrate status: success (atomic temp-root → rename, candidate confined to `storage_candidate/v1`)
- Scan summary: BLOCKER=0 / WARNING=0 (`storage_reports/latest-scan/summary.json`)
- Checksums/Merkle: match (per-module entities + merkle roots validated by scan)
- Drift/Orphans: none flagged (drift check part of scan-all)
- PII audit: none flagged in scan-all
- Determinism: yes — two migrations from clean state produced byte-identical trees (`diff -r` empty)
- Rollback drill: injected failure after module `kurse` removed temp root; no `storage_candidate/v1` left behind; subsequent clean rerun succeeded

## Hashes (per module)

- kunden: `e4237d4037d4f4d17abee96a225bf27aa9e12fd6374748221d36d12e5159317d`
- hunde: `66740e0dbc789e1dd1aff25e33715d1aed3be820d9ad77c71a8d099ea5b2c511`
- kurse: `85c4ff570202bced63cd4f039151fea07dbae8e0a5764c081e337d3ef75048dd`
- trainer: `5a797283c0dc99af621de330486eb59fa3633a1edc67a39f7b99ed3308342437`
- kalender: `4003596907966c91f5dbc780d8208f6b720fe22e60b18291ebc632b111a08ef2`
- finanzen: `b27976743b4f76d8287831f4a532957f15b1be63efef7e9efe22179aa015d1aa`
- waren: `297c65996d46baf84ec01c4bc5e77849276702bf9f280f7211c7dcdc83b7e7b0`
- kommunikation: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

## Issues

- None. Known/accepted warning: Node notes missing `"type": "module"` in package.json (unchanged).

## Next Actions

- Keep registries aligned with approved UUIDs before real cutover.
- Finalize cutover playbook with environment-specific pointer flip and validation checklists.
