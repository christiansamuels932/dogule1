# Migration & Integrity Tooling Plan (Stations 53–56)

## 1. Purpose & Scope

Canonical contract for mock→real migration (v0→v1) and integrity tooling. This plan cannot override `DOGULE1_SYSTEM_BASELINE_V2.md`; on conflict, baseline wins. Governs implementation for Stations 53–56 (technical sequence). Planning only; no live storage manipulation.

## 2. Sources of Truth & Inputs

- `DOGULE1_SYSTEM_BASELINE_V2.md` — schemas, invariants, ID rules, PII classification, atomicity, checksums, mock→real mapping.
- `status.md` — current station context, environment caveats, logging conventions.
- `DOGULE1_GOVERNANCE.md` — gating, conflicts, station naming.
- `DOGULE1_PROTOCOL.md` + `agents.md` — agent behavior and role contract (execution rules only).
- `Master-II-Path.md` — E/F roadmap context.
- Rule: this plan adds operational detail only; baseline remains the source of truth.

## 3. Migration Engine Architecture

Offline Node CLI (never browser/UI).

Components:

- **SourceAdapter:** strict v0 reader/validator for mock data (schema check).
- **Mapper:** pure functions per module.
- **LegacyIdRegistry:** deterministic mapping; never mutated by dry-run.
- **TargetAdapter:** atomic writes (temp → fsync → rename), checksum stamping.
- **ValidationPipeline:** schema → FK → invariants → checksum.
- **BatchRunner:** idempotent, resumable with progress logging.
- **CLI:** `dry-run`, `migrate`, `verify`, `rollback-preview`.

Constraints:

- Deterministic: same inputs + same mapping registry → identical outputs.
- Obeys baseline atomicity and write ordering.

## 4. Field-Mapping Rules (Per Module)

- Derived strictly from baseline “Mock → Real Migration Mapping”; no new mappings invented here.
- Contracts per module: `validateV0(record)`, `mapToV1(record, ctx)`, `postMapValidate(entity)`.
- No fields beyond baseline. Missing timestamps may be synthesized at migration time (document exact algorithm). No synthetic PII; only defaults permitted by baseline.

## 5. ID Continuity & Legacy-ID Mapping

- One mapping store per module (e.g., `kunden.legacyIds.json`, `hunde.legacyIds.json`, etc.).
- Raw IDs are uuidv7 only; UI prefixes are cosmetic, never part of IDs.
- Dry-run never mutates mapping stores.
- Migrate mutates mapping only when legacy→uuidv7 is needed.
- Deterministic: same registry → same outputs; FKs rewritten only via registry (no heuristics).

## 6. Version & Schema Defaults

- Each migrated entity: `schemaVersion = 1`, `version = 0`.
- Migration must not bump versions; versioning is for future storage mutations only.

## 7. Staging, Cutover & Rollback

- **Pre-migration:** full snapshot of v0 mock DB + mapping stores; prepare isolated target dir (e.g., `storage_v1_candidate/`).
- **Migration:** `dry-run` (validate, no mutations) → `migrate` (atomic writes, checksum stamping, integrity report).
- **Cutover:** allowed only when deep checksum scan (Merkle), orphan scan, and schema drift scan are green per baseline. Flip single pointer/symlink/config to v1.
- **Rollback:** flip pointer back + restore snapshot + mapping stores if any blocking failure after cutover.

## 8. Checksum Tooling Contract

- Canonical JSON: sorted keys, UTF-8, no whitespace variability.
- Entity checksum: SHA-256 over canonical JSON.
- Module checksum: Merkle root of entity checksums.
- Metadata files: `kunden.checksums.json`, `hunde.checksums.json`, etc., containing `{ entityId, hash, merkleRoot, generatedAt }`.
- Use on every write (entity) and weekly (Merkle/deep scan), matching baseline cadence.

## 9. Integrity Scanner

- Subcommands: `scan-all`, `scan-module`, `scan-pii`, `scan-drift`.
- Checks: schema validator (v1 spec), FK validator (null only if allowed), invariant validator (baseline), schema drift detector, PII-residency audit (PII-2 leakage = BLOCKER; PII-1 violations = WARNING/BLOCKER per baseline).
- Exit codes: BLOCKER → non-zero; WARNING → zero but printed.

## 10. Failure-Handling Strategy

- Severity: INFO < WARNING < BLOCKER.
- `dry-run`: no writes; no mapping mutations.
- `migrate`: abort batch on schema/PII/ID mismatch or checksum mismatch.
- Auto-fixes: only safe defaults allowed by baseline; no silent FK repair/deletion/PII modification.
- Idempotent: re-running migrate on identical state yields identical output.

## 11. Execution Order for E → F (Technical Mapping to Future Stations)

- Governance currently assigns 53–56 to auth/alert work → governance update required before implementing this sequence.
- Proposed technical sequence:
  - Technical 53: migration engine skeleton + mapper stubs + dry-run.
  - Technical 54: real storage adapters + atomic write + checksum tooling.
  - Technical 55: integrity scanner (schema/FK/invariants/PII) + CI integration.
  - Technical 56: full migration rehearsal + rollback drills + cutover playbook.

## 12. Testing & Failure-Injection Protocol

- Unit: mappers, validators, invariants, checksum functions.
- Contract tests: broken FKs, corrupted checksums, mixed schemaVersions, mapping stability (reruns consistent).
- Failure injection: mid-batch interruption → rollback → clean re-run; tampered checksum metadata → scan rejects cutover; PII-residency violations → BLOCKER.
- All scenarios must pass before any real migration.

## 13. Operational Runbook & Report Retention

- Operator role: Ops/Admin; required environment: dev, NAS-like before production.
- Reports stored under `storage_reports/<timestamp>/`: `dry-run.json`, `migration-summary.json`, `integrity-summary.json`, `checksum-report.json`; retain at least last 10 runs.
- Status logging format: `## Tests` → migrated modules + integrity outcomes; `## Issues` → BLOCKER/WARNING summary.
