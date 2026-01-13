# Station 54 — Storage Adapters & Checksums (E2b) Implementation Layout

Purpose: execution blueprint for Station 54. No runtime changes; offline tooling only. Must align with `DOGULE1_SYSTEM_BASELINE_V2.md`, `MIGRATION_TOOLING_PLAN.md`, governance (53→54→55→56 chain), and status (Station 53 must land before persistent writes).

## Target Storage Layout (Candidate Only)

- Root: `storage_candidate/v1/` (override via CLI `--output-dir`).
- Per-module payload: `storage_candidate/v1/<module>/data.jsonl` (one canonical JSON object per line).
- Per-module checksums:
  - `storage_candidate/v1/<module>/checksums/entities.jsonl` — `{ id, hash }` per entity.
  - `storage_candidate/v1/<module>/checksums/merkle.json` — `{ module, ordering: "id", leaves: [{ id, hash }], root }`.
- Run metadata: `storage_candidate/v1/checksums/run.json` — `{ runId, generatedAt, modules: [{ name, root }], globalRoot? }`.
- Empty modules: write empty data.jsonl and merkle.json with `leaves: []` and `root` = SHA-256 of empty string.

## TargetAdapter Contract (54 scope)

- API: `beginBatch({ module, runId, outputDir })`, `writeEntity({ module, entity })`, `commitBatch()`, `abortBatch()`.
- Atomic write: temp file per module → fsync temp → fsync parent dir → rename to final path. Abort cleans temps.
- All writes confined to candidate root; never touch app runtime or mock DB.
- Uses canonical JSON from Station 53 for entity serialization and hashing.

## Checksums (Entity + Merkle)

- Algorithm: SHA-256 over canonical JSON (sorted keys/arrays, LF, UTF-8).
- Entity hash: `hashEntity(canonicalJson(entity))`.
- Merkle ordering: entities sorted by `id` (uuid). Leaves = ordered entity hashes; root computed deterministically. Empty module root = SHA-256 of empty string.
- Global root (optional): Merkle over module roots; include when available in `run.json`.

## Registry & Mapper Integration

- Read registry files only: `migration/mapping/<module>.json`, array `{ legacyId, targetUuid, version }` sorted by `legacyId`.
- No mutations to registry in 54. If gaps detected, emit proposal artifacts under `storage_candidate/v1/registry_candidate/<module>.json` with same shape; do not overwrite real registry.
- Pipeline for `migrate`: SourceAdapter → ValidationPipeline (schema-only) → Mapper → TargetAdapter (+ checksums) → Report.

## CLI Behavior

- Extend Station-53 CLI with `migrate`:
  - Flags: `--all-modules` or `--module <name>` (repeatable), `--output-dir <path>` default `storage_candidate/v1`, `--run-id <string>` (if absent, use deterministic placeholder `run-local`), `--dry-run` retains Station 53 behavior.
- Reports: deterministic paths under `storage_reports/latest-migrate/` (overwrite each run), filenames without timestamps. Report includes: modules processed, entities written, candidate path, per-module roots, optional global root, anomalies (schema/mapping issues).
- No writes outside `output-dir`; registry files remain untouched.

## Validation Scope (Station 54)

- Enforce schema-level checks as in Station 53 (required fields/nullability/types). FK/invariant/PII checks remain stubbed for Station 55.
- Version defaults enforced: `schemaVersion=1`, `version=0`.

## Filesystem & Safety Constraints

- Fsync temp file and parent dir before rename; abort removes temps.
- All candidate output paths added to `.gitignore`.
- No interaction with app runtime storage, CI configs, or production paths.

## Tests & Acceptance (to be executed during Station 54)

- Unit: TargetAdapter temp→fsync→rename, abort cleanup; checksum builder determinism (entity hash/Merkle ordering, empty-module root).
- Integration: `migrate --module kunden --output-dir ./tmp-migrate-test --run-id test` on sample mock data; assert candidate files are valid JSONL, checksums deterministic across two runs, no files outside candidate root.
- Manual: one end-to-end migration of known mock dataset into fresh candidate dir; verify layout, checksum files, report counts vs source.
- Status exit must note: branch/PR, atomic write semantics validated, checksum metadata deterministic, writes confined to candidate storage, runtime untouched.
