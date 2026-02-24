# Defects

## P1 — Course delete fails with linked certificates

- Item IDs: `B3-001`, `B3-002`
- Route: `DELETE /api/kurse/:id`
- Role: `admin`
- Steps:
  1. Create Kunde/Hund/Kurs/Sub-Kurs/Teilnehmer.
  2. Create Zertifikat linked to the same Kurs.
  3. Delete the Kurs.
- Expected: Kurs deletion succeeds and downstream history remains usable.
- Actual: `500 {"message":"storage_error","code":"STORAGE_ERROR"}` and Kurs remains (`GET /api/kurse/:id` returns `200`).
- Probable root cause:
  - Hard delete in [mariadbAdapter.js](/home/ran/codex/dogule1/modules/shared/storage/mariadbAdapter.js:1563) does not handle FK-protected relations.
  - FK `fk_zertifikate_kurs` is `ON DELETE RESTRICT` in [schema.sql](/home/ran/codex/dogule1/tools/mariadb/schema.sql:280) and [83_2_zertifikate_schema.sql](/home/ran/codex/dogule1/tools/mariadb/migrations/83_2_zertifikate_schema.sql:48).
  - Error translation surfaces generic 500 in [coreApiRouter.js](/home/ran/codex/dogule1/modules/shared/server/coreApiRouter.js:68).
- Regression risk: high (breaks admin data lifecycle and leaves inconsistent operator expectations).

## P2 — Automated test suite failing (7 tests)

- Item ID: `BASE-LOCAL-TEST`
- Scope: `pnpm test`
- Expected: full pass for baseline gate.
- Actual: 7 failed tests (`infochannel` SAL/API route tests, `groupchat` UI tests, `authService` token expiry test).
- Probable root cause: tests not aligned with current role/publisher constraints and/or auth expiration behavior changes.
- Affected references:
  - [apiRoutes.test.js](/home/ran/codex/dogule1/modules/kommunikation/infochannel/apiRoutes.test.js)
  - [sal.test.js](/home/ran/codex/dogule1/modules/kommunikation/infochannel/sal.test.js)
  - [ui.test.js](/home/ran/codex/dogule1/modules/kommunikation/groupchat/ui.test.js)
  - [authService.test.js](/home/ran/codex/dogule1/modules/shared/auth/authService.test.js)
- Regression risk: medium-high (CI signal degraded; risk of hidden behavior drift).

## P2 — VPS restore path not end-to-end testable (missing snapshots)

- Item ID: `VPS-DEV-RESTORE-24H`
- Routes: `GET /api/developer/backups`, `POST /api/developer/restore`
- Role: `developer`
- Expected: at least one slot exists to validate restore+recovery flow.
- Actual: slots `24h` and `72h` both missing; restore returns `404 restore_snapshot_missing`.
- Probable root cause: backup scheduler/pipeline has not produced encrypted slot files yet.
- Regression risk: medium (operational recovery unverified).

## P3 — Trainer role scenario blocked by role model drift

- Item ID: `AUTH-TRAINER-ROLE`
- Route: `GET /api/auth/options`
- Expected: dedicated `trainer` test user available for matrix checks.
- Actual: only `admin`, `developer`, and `trainer_rapport` users are returned.
- Probable root cause: trainer user generation currently maps non-admin trainers to `trainer_rapport` only in [apiRouter.js](/home/ran/codex/dogule1/modules/shared/server/apiRouter.js:380).
- Regression risk: low-medium (test-plan mismatch; trainer-specific checks blocked).
