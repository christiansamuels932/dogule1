# Station 55 — Integrity Scanner & CI Integration (E2c) Implementation Layout

Purpose: execution blueprint for Station 55. Offline integrity scanner plus CI wiring, aligned with `DOGULE1_SYSTEM_BASELINE_V2.md`, `MIGRATION_TOOLING_PLAN.md`, and governance chain (53 → 54 → 55 → 56). No migration writes, no cutover.

## Scope

- Read-only scanner over candidate v1 storage produced by Station 54 (default `storage_candidate/v1/`).
- Checks: schema validation (v1), FK resolution, invariants, PII-residency audit, schema drift, checksum verification (entity + Merkle).
- CLI commands with deterministic outputs and exit codes; CI job fails on BLOCKER.
- Reports only; no registry or storage mutation.

## CLI & Commands

- Entry extends existing migration CLI with:
  - `scan-all` (all modules).
  - `scan-module --module <name>` (repeatable).
  - `scan-pii` (PII audit only).
  - `scan-drift` (schemaVersion drift only).
  - `verify-checksums` (recompute entity/Merkle and compare to stored sidecars).
- Flags:
  - `--input-dir <path>` default `storage_candidate/v1`.
  - `--modules <list>` optional, else all modules.
  - `--run-id <string>` optional; default deterministic `scan-local`.
- Outputs: deterministic report directory `storage_reports/latest-scan/` (overwrite per run), files:
  - `scan.json` machine-readable: entries `{ module, entityId?, checkType, severity, message, autoFixPossible }`.
  - `summary.json` with counts per severity/module + checksum status.
  - Optional `pii.json`, `drift.json` for filtered runs.
- No timestamps in filenames; use ISO string inside reports if needed.

## Validation Rules

- Schema: enforce required fields/types/nullability per baseline; `schemaVersion` must equal 1; `version` present (>=0).
- FK: resolve via registry mapping (target UUIDs) and candidate data:
  - kundenId/hundIds/kundenIds/kursId/trainerId as per module rules.
  - Missing target = BLOCKER unless field is optional in baseline.
- Invariants: from baseline (non-negative betrag/preis, start < end, capacity ≥ bookedCount, required associations like course requires trainer, calendar requires kurs or trainer).
- PII residency: PII-2 fields must only appear in approved modules/files; no PII in logs/checksum metadata; leak = BLOCKER. PII-1 violations → WARNING unless baseline marks stricter.
- Schema drift: any entity with `schemaVersion` ≠ 1 → BLOCKER; mixed versions flagged.
- Checksums: recompute entity hashes (canonical JSON, SHA-256) and Merkle roots (sorted by id). Mismatch = BLOCKER.

## Severity & Exit Codes

- Severity: INFO < WARNING < BLOCKER.
- Exit codes:
  - BLOCKER present → non-zero.
  - WARNING only → zero (printed).
  - INFO only → zero.

## CI Integration (Station 55 scope)

- Add CI job that runs `node tools/migration/cli.js scan-all --input-dir <path>` against a known candidate fixture (path configurable).
- CI fails on BLOCKER; warnings surfaced in logs.
- No writes in CI except reports in workspace; ensure reports path ignored by git.

## Data & Paths

- Default input: `storage_candidate/v1/` (read-only).
- Reports: `storage_reports/latest-scan/` (overwrite per run, gitignored).
- Registry: `migration/mapping/<module>.json` read-only; no proposals written in 55.
- No touching app runtime storage or mock DB.

## Tests (to execute in Station 55)

- Unit:
  - Schema validator (required fields, nullability, schemaVersion).
  - FK validator with registries and candidate data.
  - Invariant checker (date/time ordering, numeric constraints).
  - Checksum verifier (entity/Merkle determinism; empty module root).
  - PII audit (flag PII-2 leak to non-allowed files).
- Integration:
  - Scan over sample candidate tree produced from mock data; expect zero BLOCKER when data is consistent.
  - Tamper checksum sidecar → expect BLOCKER on `verify-checksums`.
  - Introduce FK break → BLOCKER; mixed schemaVersion → BLOCKER.
- Determinism: identical runs produce identical reports given same input.

## Non-Goals (defer to Station 56)

- No migration writes or registry mutation.
- No cutover/rollback drills or playbook.
- No changes to app runtime consumption of v1 storage.

## Status/Logging Expectations

- `status.md` entry should record branch/PR, commands run, summary of findings (BLOCKER/WARNING counts), and confirm reports confined to `storage_reports/latest-scan/` with no runtime storage touched.
