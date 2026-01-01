# Beta Readiness Gate

This document defines the Alpha freeze rules, Beta entry/exit criteria, and the manual test issue log template for Dogule1.

## Alpha feature freeze (done for Alpha)

- Core modules with CRUD: Dashboard, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen, Waren.
- Kommunikation: Groupchat (global room), Infochannel (admin publish, trainer confirmations), system tab placeholder.
- UI: visual cohesion pass across lists/details and shared styles (Station 71).
- Allowed during freeze: bugfixes, perf, stability.
- Forbidden during freeze: new features or scope expansion.

## Deferred to Beta (planned scope)

- DogTabs ingestion: inventory, mapping, deterministic import.
- MariaDB-only backend: schema + adapter, no mockdata runtime paths.
- Performance baselines for 1500+ Kunden (Kunden/Hunde/Kurse lists).
- Structural UI for large datasets (filters/pagination/columns/sorting).
- Kurse catalogue system (catalogue-backed course selection).
- Accounts & roles (trainer/admin logins, RBAC).
- Billing from Kurse (Rechnungen generation with linkage).
- Zertifikate module (Kunde/Hund/Kurs + document output).
- Automation (birthday email + optional certificate delivery).
- Contabo VPS production deployment and verification.

## Beta entry criteria

- Alpha Freeze rules documented and agreed.
- DogTabs inventory + mapping completed.
- MariaDB finalized as sole backend.
- Ingestion pipeline ready (dry-run + idempotent import).
- Manual test issue log format agreed and ready.

## Beta exit criteria

- DogTabs data ingested into MariaDB with validation and deterministic mappings.
- Performance baselines recorded and acceptable (no major regressions).
- Feature completion (catalogue, accounts/roles, billing, certificates, automation).
- Manual test cycle complete: baseline -> fixes -> regression; no P0/P1 issues.
- Contabo VPS deployment verified and stable.
- Documentation updated with sign-off and known risks.

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
