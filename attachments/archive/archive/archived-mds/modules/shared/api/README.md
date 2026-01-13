# Shared API & Storage Notes

- Storage/PII/ID rules are defined centrally in `DOGULE1_SYSTEM_BASELINE_V2.md` (uuidv7 IDs with cosmetic prefixes, PII residency, invariants, migration).
- Mock data lives in `modules/shared/api/db/index.js`; align fields and PII tags with the baseline. Add `version`/`schemaVersion` defaults when extending data.
- Integrity/ID mapping/migration tooling should hook here; do not introduce module-local mock arrays.
