# DOGULE1 System Baseline V2 — Storage, Integrity, and Migration

Single source for schemas, IDs, PII/residency, integrity rules, and migration from mock (v0) to real storage (v1).

## Entity Schemas (Mock → Target Storage)

**Base fields (all entities, v1 real):**

- `id` (uuidv7 string, required, immutable; UI prefix cosmetic)
- `code` (string, required, user-facing)
- `version` (int, required, default 0; optimistic concurrency, increments per write)
- `schemaVersion` (int, required, default 1; module schema version; mock rows hydrate with 0 then upgrade to 1)

### Kunden

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1                              |
| ------------- | ------------ | ---- | ----- | ------------ | ------------------------------------------ |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `KND-` only for readability |
| code          | string       | no   | PII-0 | unrestricted | Human-readable, editable                   |
| vorname       | string       | no   | PII-2 | local only   |                                            |
| nachname      | string       | no   | PII-2 | local only   |                                            |
| email         | string       | no   | PII-2 | local only   | Validate format                            |
| telefon       | string       | yes  | PII-2 | local only   |                                            |
| adresse       | string       | yes  | PII-2 | local only   | Street+city                                |
| notizen       | string       | yes  | PII-2 | local only   | Free text                                  |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted | Derived from real create time if missing   |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted | Set on writes                              |
| version       | int          | no   | PII-0 | unrestricted | Optimistic lock                            |
| schemaVersion | int          | no   | PII-0 | unrestricted | Module schema version tag                  |

### Hunde

| Field          | Type         | Null | PII   | Residency    | Notes / v0→v1              |
| -------------- | ------------ | ---- | ----- | ------------ | -------------------------- |
| id             | uuidv7       | no   | PII-0 | unrestricted | Display prefix `HND-` only |
| code           | string       | no   | PII-0 | unrestricted | Editable                   |
| name           | string       | no   | PII-1 | local only   | Registered name            |
| rufname        | string       | yes  | PII-1 | local only   | Call name                  |
| rasse          | string       | yes  | PII-1 | local only   |                            |
| geschlecht     | string       | yes  | PII-1 | local only   | Enum (Rüde/Hündin/?)       |
| geburtsdatum   | date         | yes  | PII-1 | local only   | ISO date                   |
| gewichtKg      | number       | yes  | PII-1 | local only   |                            |
| groesseCm      | number       | yes  | PII-1 | local only   |                            |
| trainingsziele | string       | yes  | PII-1 | local only   |                            |
| notizen        | string       | yes  | PII-1 | local only   |                            |
| kundenId       | uuidv7       | no   | PII-2 | local only   | FK to Kunden.id            |
| createdAt      | ISO datetime | yes  | PII-0 | unrestricted |                            |
| updatedAt      | ISO datetime | yes  | PII-0 | unrestricted |                            |
| version        | int          | no   | PII-0 | unrestricted |                            |
| schemaVersion  | int          | no   | PII-0 | unrestricted |                            |

### Kurse

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1                     |
| ------------- | ------------ | ---- | ----- | ------------ | --------------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `KRS-` only        |
| code          | string       | no   | PII-0 | unrestricted | Editable                          |
| title         | string       | no   | PII-1 | local only   | Course name                       |
| trainerId     | uuidv7       | no   | PII-1 | local only   | FK to Trainer.id                  |
| date          | date         | no   | PII-1 | local only   | ISO date                          |
| startTime     | HH:MM        | no   | PII-1 | local only   |                                   |
| endTime       | HH:MM        | no   | PII-1 | local only   |                                   |
| location      | string       | yes  | PII-1 | local only   |                                   |
| status        | enum         | no   | PII-0 | unrestricted | offen/geplant/ausgebucht/abgesagt |
| capacity      | int          | yes  | PII-0 | unrestricted |                                   |
| bookedCount   | int          | yes  | PII-0 | unrestricted | Derived preferred                 |
| level         | string       | yes  | PII-0 | unrestricted |                                   |
| price         | number       | yes  | PII-2 | local only   | CHF                               |
| notes         | string       | yes  | PII-1 | local only   |                                   |
| hundIds       | uuidv7[]     | yes  | PII-2 | local only   | FK to Hunde.id                    |
| kundenIds     | uuidv7[]     | yes  | PII-2 | local only   | Optional denormalized link        |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted |                                   |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                                   |
| version       | int          | no   | PII-0 | unrestricted |                                   |
| schemaVersion | int          | no   | PII-0 | unrestricted |                                   |

### Trainer

| Field            | Type         | Null | PII   | Residency    | Notes / v0→v1                 |
| ---------------- | ------------ | ---- | ----- | ------------ | ----------------------------- |
| id               | uuidv7       | no   | PII-0 | unrestricted | Display prefix `TRN-` only    |
| code             | string       | no   | PII-0 | unrestricted | Editable                      |
| name             | string       | no   | PII-1 | local only   |                               |
| email            | string       | yes  | PII-2 | local only   |                               |
| telefon          | string       | yes  | PII-2 | local only   |                               |
| notizen          | string       | yes  | PII-1 | local only   |                               |
| verfuegbarkeiten | array        | yes  | PII-0 | unrestricted | [{weekday,startTime,endTime}] |
| createdAt        | ISO datetime | yes  | PII-0 | unrestricted |                               |
| updatedAt        | ISO datetime | yes  | PII-0 | unrestricted |                               |
| version          | int          | no   | PII-0 | unrestricted |                               |
| schemaVersion    | int          | no   | PII-0 | unrestricted |                               |

### Kalender

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1              |
| ------------- | ------------ | ---- | ----- | ------------ | -------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `EVT-` only |
| code          | string       | no   | PII-0 | unrestricted | Editable                   |
| title         | string       | no   | PII-1 | local only   | Event title                |
| start         | ISO datetime | no   | PII-1 | local only   |                            |
| end           | ISO datetime | no   | PII-1 | local only   |                            |
| location      | string       | yes  | PII-1 | local only   |                            |
| notes         | string       | yes  | PII-1 | local only   |                            |
| kursId        | uuidv7       | yes  | PII-1 | local only   | FK to Kurs.id              |
| trainerId     | uuidv7       | yes  | PII-1 | local only   | FK to Trainer.id           |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| version       | int          | no   | PII-0 | unrestricted |                            |
| schemaVersion | int          | no   | PII-0 | unrestricted |                            |

### Finanzen

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1                |
| ------------- | ------------ | ---- | ----- | ------------ | ---------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `FIN-` only   |
| code          | string       | no   | PII-0 | unrestricted |                              |
| kundeId       | uuidv7       | no   | PII-2 | local only   | FK to Kunden.id              |
| kursId        | uuidv7       | yes  | PII-2 | local only   | FK to Kurse.id (optional)    |
| trainerId     | uuidv7       | yes  | PII-2 | local only   | For payouts/expenses         |
| typ           | enum         | no   | PII-0 | unrestricted | income/expense/zahlung/offen |
| betrag        | number       | no   | PII-2 | local only   | CHF                          |
| datum         | date         | no   | PII-2 | local only   |                              |
| beschreibung  | string       | yes  | PII-2 | local only   |                              |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted |                              |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                              |
| version       | int          | no   | PII-0 | unrestricted |                              |
| schemaVersion | int          | no   | PII-0 | unrestricted |                              |

### Waren

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1              |
| ------------- | ------------ | ---- | ----- | ------------ | -------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `WRN-` only |
| code          | string       | no   | PII-0 | unrestricted |                            |
| kundenId      | uuidv7       | no   | PII-2 | local only   | FK to Kunden.id            |
| produktName   | string       | no   | PII-1 | local only   |                            |
| menge         | int          | yes  | PII-0 | unrestricted | Default 1                  |
| preis         | number       | no   | PII-2 | local only   | CHF                        |
| datum         | date         | no   | PII-2 | local only   |                            |
| beschreibung  | string       | yes  | PII-1 | local only   |                            |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| version       | int          | no   | PII-0 | unrestricted |                            |
| schemaVersion | int          | no   | PII-0 | unrestricted |                            |

### Kommunikation (Shell Only)

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1              |
| ------------- | ------------ | ---- | ----- | ------------ | -------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `COM-` only |
| code          | string       | no   | PII-0 | unrestricted |                            |
| channel       | enum         | no   | PII-0 | unrestricted | infochannel/chat/system    |
| title         | string       | no   | PII-1 | local only   | Visible subject            |
| body          | string       | yes  | PII-1 | local only   | Payload placeholder        |
| status        | enum         | no   | PII-0 | unrestricted | draft/sent/archived        |
| createdAt     | ISO datetime | no   | PII-0 | unrestricted |                            |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| version       | int          | no   | PII-0 | unrestricted |                            |
| schemaVersion | int          | no   | PII-0 | unrestricted |                            |

### Inter-Entity Invariants & Compatibility Notes

- Kunden 1:N Hunde; Hunde.kundenId required and must resolve.
- Hunde N:M Kurse via Kurse.hundIds; Kunden N:M Kurse via Kurse.kundenIds (optional denorm).
- Trainer 1:N Kurse; Kurse.trainerId required.
- Trainer 1:N Kalender events; Kalender.trainerId optional but validated if present.
- Kalender event must reference either Kurs or Trainer (or both); at least one must resolve.
- Finanzen must reference Kunde; optional Kurs/Trainer must resolve when set.
- Waren must reference Kunde; optional fin/ledger link is deferred.
- v0 mock data maps missing `version`/`schemaVersion` to 0; migration upgrades to 1 while preserving IDs/codes.

## ID Strategy & Versioning

- **Format:** uuidv7 (sortable). Stored raw; UI may display cosmetic prefixes (`KND-`, `HND-`, `KRS-`, `TRN-`, `EVT-`, `FIN-`, `WRN-`, `COM-`) for readability only; never part of the ID.
- **Continuity:** IDs are immutable and never reused; mock IDs preserved via mapping table for legacy ids (`k1` → new uuid) where necessary; prefixes stable across mock → real.
- **Module schema version:** per-module integer; v1 = 1. Stored on each entity (`schemaVersion`) and in module metadata header; increments only on structural change.
- **Entity instance version:** optimistic concurrency integer; default 0, increments per successful write; writes fail on mismatch.
- **Migration tags:** mock rows default `version=0`, `schemaVersion=0`; migration stamps `schemaVersion=1`, `version=0` (preserve default) after integrity check.
- **Compatibility:** additive-only field evolution; removals require deprecation window + migration; IDs stable indefinitely.

## PII Classification & Residency

- **Model:** PII-0 (operational/metadata), PII-1 (soft personal), PII-2 (hard personal/financial).
- **Residency:** PII-2 local only; PII-1 local by default (mirror only if explicitly allowed); PII-0 unrestricted.
- **Field-level table (summary):**

| Field                                                                                                 | Module(s)     | PII     | Residency    | Notes                        |
| ----------------------------------------------------------------------------------------------------- | ------------- | ------- | ------------ | ---------------------------- |
| id, code, version, schemaVersion, createdAt, updatedAt                                                | all           | PII-0   | unrestricted | Metadata                     |
| vorname, nachname                                                                                     | Kunden        | PII-2   | local only   |                              |
| email, telefon, adresse                                                                               | Kunden        | PII-2   | local only   | Contact                      |
| notizen (Kunden)                                                                                      | Kunden        | PII-2   | local only   | Free text                    |
| name, rufname, rasse, geschlecht, geburtsdatum, gewichtKg, groesseCm, trainingsziele, notizen (Hunde) | Hunde         | PII-1   | local only   | Soft personal                |
| kundenId (Hunde)                                                                                      | Hunde         | PII-2   | local only   | Links to person              |
| title, location, level, status, notes                                                                 | Kurse         | PII-1/0 | local only   | Status = PII-0               |
| price                                                                                                 | Kurse         | PII-2   | local only   | Financial                    |
| trainerId, hundIds, kundenIds                                                                         | Kurse         | PII-2   | local only   | References to identities     |
| startTime, endTime, date                                                                              | Kurse         | PII-1   | local only   | Scheduling                   |
| notes (Kurse)                                                                                         | Kurse         | PII-1   | local only   |                              |
| name (Trainer)                                                                                        | Trainer       | PII-1   | local only   |                              |
| email, telefon (Trainer)                                                                              | Trainer       | PII-2   | local only   |                              |
| notizen, verfuegbarkeiten                                                                             | Trainer       | PII-1   | local only   | Availability considered soft |
| titel, ort, beschreibung, start, end                                                                  | Kalender      | PII-1   | local only   |                              |
| kursId, trainerId (Kalender)                                                                          | Kalender      | PII-1   | local only   |                              |
| kundeId, kursId, trainerId, typ, betrag, datum, beschreibung (Finanzen)                               | Finanzen      | PII-2   | local only   | Financial/identity           |
| produktName, menge, preis, datum, beschreibung, kundenId (Waren)                                      | Waren         | PII-1/2 | local only   | preis/kundenId = PII-2       |
| channel, title, body, status (Kommunikation)                                                          | Kommunikation | PII-1/0 | local only   | channel/status = PII-0       |

## Integrity & Consistency Rules

- **Checksums:** entity checksum = SHA-256 over canonical JSON (keys sorted, no whitespace variance); snapshot checksum = Merkle root of entity checksums per module.
- **Invariant checks:** enforce inter-entity list above; additionally ensure dates/time ranges valid (`start < end`), price/betrag non-negative, capacity ≥ bookedCount.
- **Orphan detection:** weekly scan: unresolved FK → mark entity as `invalidRef` flag, write to integrity report; auto-fix options: (a) archive entity, (b) remove broken FK, (c) block write.
- **Validation order:** schema validation → FK resolution → invariant validation → checksum → write.
- **Audit trail:** record checksum + invariant result per write in module metadata (no external system required).

## Concurrency & Locking

- **Single-writer contract:** only one writer (UI thread) mutates a module at a time; background readers allowed.
- **Optimistic concurrency:** writes include `version`; reject on mismatch and re-read before retry.
- **Lock boundary:** module-level atomic writes (per-entity collection file). No cross-module locks.
- **Multi-tab:** no guarantee; UI warns on multiple open tabs when a write occurs; last-writer wins only if invariants still satisfied.

## Atomicity, Durability & Rollback

- **Write flow:** write to temp file → fsync temp → checksum verify → atomic rename over module file → fsync parent dir.
- **Cross-module changes:** stage to shadow copies; validate combined invariants; commit all-or-revert by replacing both files only if all succeed.
- **Durability guarantee:** after success, data survives crash/power loss; checksum stored alongside payload.
- **Rollback:** on invariant failure or checksum mismatch, revert to last valid snapshot; keep rolling snapshots (see cadence).

## Failure-Injection Plan (Storage)

| Failure Type              | Injection Point                | Expected Detection                   | Expected Recovery                                          |
| ------------------------- | ------------------------------ | ------------------------------------ | ---------------------------------------------------------- |
| Write interruption        | After temp write before rename | Missing checksum or incomplete file  | Retry from last snapshot; keep partial for forensics       |
| Corrupted partial file    | After rename bypass            | Checksum mismatch on read            | Restore prior snapshot; log incident                       |
| Checksum mismatch         | Post-write verification        | Verification step fails              | Abort commit; retain prior file; alert                     |
| Broken FK                 | During validation              | FK resolver flags missing target     | Block write; offer auto-clean (archive/remove FK)          |
| Snapshot creation failure | While copying                  | Missing snapshot checksum            | Retry; if persistent, pause writes                         |
| Migration corruption      | During field mapping           | Schema/PII mismatch or checksum fail | Abort migration batch; roll back to pre-migration snapshot |

**Cadence:** Phase E weekly manual injection; Phase F scripted on each release candidate (pre-merge).

## Mock → Real Migration Mapping

- **ID continuity:** preserve existing IDs where possible; for short mock IDs (`k1`) generate uuidv7 and store mapping table {legacyId → uuidv7}; references rewrite using mapping.
- **Field rules:** undefined mock fields hydrate to defaults/null; required real fields synthesized (timestamps = migration time if absent).
- **Sanitization:** strip debug keys; normalize dates to ISO; ensure UTF-8; recompute checksums post-migration.

**Per-module mapping:**

- Kunden: {id→uuidv7 (map), code→code, vorname, nachname, email, telefon?, adresse?, notizen?, createdAt?, updatedAt?}. Add `version=1`, `schemaVersion=1`.
- Hunde: same pattern; ensure `kundenId` remapped via legacy table; add `version/schemaVersion`, backfill timestamps.
- Kurse: map `trainerId`, `hundIds`, optional `kundenIds`; backfill `status` default `offen` if missing; price default 0; timestamps added.
- Trainer: map core fields; `verfuegbarkeiten` normalized to array; timestamps added.
- Kalender: rename `title`→`titel`; `location`→`ort`; `notes`→`beschreibung`; remap `kursId`/`trainerId`; add timestamps/version tags.
- Finanzen: `zahlungen` table → Finanzen; map `kursId` optional; add `trainerId` null; ensure `betrag` number; add timestamps/version tags.
- Waren: direct mapping; default `menge=1` if missing; add timestamps/version tags.
- Kommunikation: hydrate empty shell with schema only; no legacy data.

## Backup / Checksum / Scan Cadence

| Activity                  | Cadence                                | Scope            | Notes                                                        |
| ------------------------- | -------------------------------------- | ---------------- | ------------------------------------------------------------ |
| Backup snapshot           | Daily; pre-migration; pre-version bump | All modules      | Rolling 7-day window; keep pre-migration snapshot separately |
| Write-time checksum       | Every write                            | Entity + module  | Fail write on mismatch                                       |
| Weekly deep checksum      | Weekly                                 | All modules      | Recompute Merkle roots; compare to last baseline             |
| Orphan scan               | Weekly                                 | FK relationships | Report + auto-clean options                                  |
| PII exposure scan         | Weekly                                 | All modules      | Ensure residency flags respected; no PII in logs             |
| Schema version drift scan | Weekly                                 | All modules      | Detect mixed schemaVersion; block writes until reconciled    | 
