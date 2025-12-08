# Station 58 — Storage Access Layer Architecture (E3)

Authoritative specification for the Storage Access Layer (SAL) that will replace the mock DB and provide a unified interface to candidate/real storage. No code changes in this station.

## Dual-Mode Switch (required)

- Env var: `DOGULE1_STORAGE_MODE=mock|real`
- Defaults: dev → `mock`; CI → `real` when candidate fixtures exist (`/storage_candidate/v1`), else fail fast.
- SAL must route **all** storage operations through this flag.
- Real mode uses Station-54/56 atomic write path (temp → fsync → rename).
- Every write in real mode triggers an integrity scan (Station 55). No silent fallback to mock.
- If `DOGULE1_STORAGE_MODE=real` but `/storage/v1` (or `/storage_candidate/v1` for fixtures) is absent → fail fast.

## SAL Configuration Location (single source)

- File: `modules/shared/storage/config.js` (to be created in implementation stations).
- Holds:
  - `DOGULE1_STORAGE_MODE` resolution.
  - Absolute storage paths: real `/storage/v1`, candidate `/storage_candidate/v1`.
  - References to authz/audit injector interfaces (see below).
- All SAL modules import this config; no duplicate env parsing elsewhere.

## AuthZ + Audit Inputs (Station 57 integration)

- SAL does **not** do role logic, but requires these inputs on every call:
  - `actionId` (from Station 57 matrix, e.g., `finanzen.update_entry`).
  - `actorId`, `actorRole`.
- Enforcement at SAL boundary:
  - Deny-by-default: if authz middleware did not provide explicit permission resolution, SAL rejects the call.
  - Audit emission: every write attempt (success, denied, or failed) must trigger an audit entry containing `actionId`, `actorId/actorRole`, target, result, before/after, `hashPrev`, `hashIndex` (required), optional `merkleRoot`, `requestId`, and context (e.g., jobId/ip). Hooks are passed explicitly (arguments), not via globals.

## Migration Order (with rationale)

1. Kunden — root entity; no FK dependencies.
2. Hunde — depends on Kunden.
3. Trainer — independent, required by Kurse.
4. Kurse — depends on Hunde + Trainer.
5. Kalender — derived from Kurse (events sync).
6. Finanzen — depends on Kurs/Trainer, optional Kunden fallback.
7. Waren — weakest dependencies.
8. Kommunikation — waits for auth/session/logging (Stations 59–62).

This order avoids FK invalidation during cutover.

## Storage Layout

- Candidate storage (migration pipeline): `/storage_candidate/v1/...` — produced by Stations 53–56. SAL **never writes** here.
- Real storage: `/storage/v1/<module>/data.jsonl` (+ checksums). Used in real mode only.
- Backups (trigger-only): `/storage/backups/{daily,weekly,manual}/`. SAL raises backup events; actual backup jobs handled in Stations 61 & 63. Backups do not interact with mock mode.

## SAL Responsibilities vs Non-Responsibilities

**Must do:**

- Normalize/validate inputs; enforce `schemaVersion=1`.
- Increment `version` on writes.
- Enforce deny-by-default with provided `actionId/actor`.
- Route errors into typed categories: `NotFound`, `InvalidData`, `InvariantViolation`, `Denied`, `StorageError`.
- Trigger integrity scan on real-mode writes.
- Emit audit hooks for all writes (success/denied/error).

**Must NOT do:**

- Derive business logic (e.g., calendar sync).
- Mutate unrelated modules.
- Perform UI-level validation.
- Manage backups directly.

## Interface Model (baseline)

- Common ops: `getById`, `list`, `query`, `create`, `update`, `delete`.
- Entity helpers: `listByKundenId`, `listByHundId`, `listByTrainerId`, `updateParticipants`, etc., mirroring module needs.
- Real mode reads/writes canonical JSONL as defined in Stations 54–56; never return raw storage objects—only validated entities.

## Contract Tests (must exist before SAL code merges)

6.1 CRUD contract: create→getById byte-identical; update increments version; invalid FK → `InvariantViolation`; delete passes integrity scan.  
6.2 Parity: run CRUD tests in mock and real; compare entity hashes (serialization parity), not just deep equality.  
6.3 Error fidelity: distinct errors for `NotFound`, `InvalidData`, `InvariantViolation`, `Denied`, `StorageError`.  
6.4 Audit-hook: any write attempt emits an audit entry with chain fields (`hashPrev`, `hashIndex`); missing hook = test failure.  
6.5 Performance baseline: list ops stable for <5k rows (document expectation; no tuning yet).

## Ownership Table (incl. system actors)

| Module/Actor                               | SAL functions                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Kunden                                     | create, update, delete, list, getById                                                                      |
| Hunde                                      | create, update, delete, list, getById, listByKundenId                                                      |
| Kurse                                      | create, update, delete, list, getById, listByHundId, updateParticipants                                    |
| Trainer                                    | create, update, delete, list, getById, listByTrainerId (for Finanzen/Kalender)                             |
| Kalender                                   | derived via Kurse: create/update/delete events through course operations                                   |
| Finanzen                                   | create/update/delete/list with invariant checks                                                            |
| Waren                                      | CRUD + optional link to Kunden                                                                             |
| Kommunikation                              | late-stage, read/write threads/messages after auth/logging ready                                           |
| System jobs (imports/backups/config/tasks) | May call SAL in real mode only; must pass `actionId` for the system action, include jobId in audit context |

## Implementation Notes (for future stations)

- SAL default mode: mock for dev; CI real when fixtures exist; production real only. Absence of expected storage → fail fast.
- Integrity scan is an internal SAL hook (not user-triggered) for real writes.
- Config and authz/audit hooks are injectable; no global state.
- Any new module or action must update the machine-readable matrix (Station 57) and SAL config; CI (Station 60) will enforce coverage.
