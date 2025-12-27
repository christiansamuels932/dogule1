# Beta Readiness Gate

This document defines the Alpha feature freeze, Beta readiness criteria, and a standardized manual test issue log template for Dogule1.

## Alpha feature freeze (done for Alpha)

- Core modules with CRUD: Dashboard, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen, Waren.
- Kommunikation: Groupchat (global room), Infochannel (admin publish, trainer confirmations), system tab placeholder.
- Storage: real-mode file storage for core entities with checksum + audit chain; mock storage remains for Alpha UI flows.
- Tooling: migration dry-run/migrate/scan toolchain for candidate storage; checksums/Merkle and reports.
- UI: visual cohesion pass across lists/details and shared styles (Station 71).

## Deferred to Beta

- DogTabs ingestion: inventory, mapping, and execution on real legacy data.
- MariaDB-only backend: schema + adapter, deprecate file/mock paths for Beta runtime.
- Performance validation for 1500-customer dataset and baseline thresholds.
- Expanded entity fields required by client (address, Ausweis-ID, status, photo reference, rasse, geburtsdatum, etc.).
- Communications enhancements beyond current Groupchat/Infochannel scope (no email; email was removed).
- Full manual test cycle on real data (baseline + post-fix retest) and issue remediation.

## Beta entry criteria

- Alpha scope explicitly frozen (this document) and approved.
- DogTabs data inventory and mapping plan completed.
- MariaDB schema + adapter implemented with CRUD parity.
- Migration tooling ready to ingest DogTabs data into MariaDB.
- Manual test issue log format agreed and ready for use.

## Beta exit criteria

- DogTabs data ingested into MariaDB with validation, FK checks, and deterministic mapping.
- Performance meets defined baseline thresholds for 1500-customer dataset.
- Required expanded fields implemented and validated.
- Manual test cycle completed: baseline, fixes, and retest; all blocking issues resolved.
- Documentation updated: status log, readiness summary, and known risks/assumptions.

## Manual test issue log template

Use one entry per issue. Severity definitions: Blocker (no ship), High (major workflow broken), Medium (workaround exists), Low (minor UX).

```
Issue ID:
Title:
Severity: Blocker | High | Medium | Low
Area/Module:
Environment:
Preconditions:
Steps to Reproduce:
Expected Result:
Actual Result:
Repro Rate:
Attachments/Logs:
Owner:
Status: New | Triage | In Progress | Fixed | Verified | Deferred
Notes:
```
