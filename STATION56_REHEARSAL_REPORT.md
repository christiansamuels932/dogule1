# Station 56 Rehearsal Report (Draft Template)

## Run Metadata

- Run ID: <run-id>
- Candidate path: storage_candidate/v1/
- Date: <date>
- Operator: <name>

## Commands Executed

- `node tools/migration/cli.js dry-run`
- `node tools/migration/cli.js migrate`
- `node tools/migration/cli.js scan-all`
- `node tools/migration/cli.js verify-checksums`
- Determinism check: `diff -r <run1> <run2>`
- Rollback drill: `MIGRATE_FAIL_AFTER_MODULE=kurse node tools/migration/cli.js migrate`

## Findings

- Dry-run blockers: <list or "none">
- Migrate status: success/fail
- Scan summary: BLOCKER=0/WARNING=0 (expected)
- Checksums/Merkle: match (yes/no)
- Drift/Orphans: <notes>
- PII audit: <notes>
- Determinism: identical outputs? <yes/no>
- Rollback drill: temp cleaned? <yes/no>

## Hashes (per module)

- kunden: <root>
- hunde: <root>
- kurse: <root>
- trainer: <root>
- kalender: <root>
- finanzen: <root>
- waren: <root>
- kommunikation: <root>

## Issues

- <list blockers/warnings>

## Next Actions

- Replace placeholder registries with approved UUIDs.
- Add fsync for temp files/dirs if required by ops policy.
- Expand playbook with environment-specific pointer flip.
