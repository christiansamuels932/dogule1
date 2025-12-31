# Dogule1 Battleplan — Stations 71+

Codex instruction: when working in this project, this document must be read first.

Purpose: define a thorough, sequential plan to move from Alpha-complete to Beta-ready with real DogTabs data, MariaDB persistence, UI polish, expanded functionality, and verified manual testing. Each station must be executed on its own branch and logged in `status.md` on completion.

Assumptions

- Alpha is functionally complete but still mock-backed; remaining work is primarily integration, polish, and additional straightforward features.
- DogTabs legacy data is available as a large folder and is the authoritative source for production migration.
- MariaDB is required for a 1500-customer dataset with acceptable performance and durability.
- Manual testing is required twice: initial baseline to surface issues, then re-test after fixes.

Non-goals

- No deep algorithmic R&D; features added are expected to be standard CRUD or workflow extensions.
- No new domain scope beyond what is necessary for Beta readiness.

Station 71 — UI Visual Preview Pass (Early)

Branch: `feature/station71-ui-visual-preview`

Scope

- Apply visual-only UI cleanup so the app feels coherent for early ideation.
- No structural/data-driven changes (no pagination/filters/columns changes).
- No backend or data changes.

Deliverables

- Visual polish across key screens (layout consistency, typography, spacing).
- Document any UX pain points observed for later structural work (no fixes yet).

Validation

- Manual UI walkthrough on desktop and mobile widths.

Exit criteria

- UI feels cohesive enough for product ideation without altering data flows.

Station 72 — Alpha Closeout & Beta Readiness Gate

Branch: `feature/station72-alpha-closeout`

Scope

- Freeze the Alpha feature set; explicitly list what is "done" and what is "deferred to Beta".
- Define Beta success criteria, data readiness prerequisites, and MariaDB adoption criteria.
- Establish a standardized issue log format for upcoming manual tests.

Deliverables

- `BETA_READINESS.md` with:
  - Alpha feature freeze list.
  - Beta entry criteria and exit criteria.
  - Manual test issue log template (fields, severity levels, repro format).
- `status.md` entry documenting Alpha closure and Beta gate criteria.

Validation

- Document review only; no code changes.

Exit criteria

- Beta readiness criteria are explicit and signed off in `status.md`.

Station 73 — DogTabs Data Inventory & Mapping Plan

Branch: `feature/station73-dogtabs-inventory`

Scope

- Analyze the DogTabs data folder structure, file formats, schema, and known inconsistencies.
- Produce a mapping from DogTabs entities to Dogule1 schema (including IDs, foreign keys, and required transformations).
- Define rules for data cleaning, rejection, and exception handling.

Deliverables

- `DOGTABS_DATA_INVENTORY.md`:
  - File types, sizes, entity counts, and schema samples.
  - PII fields and residency considerations.
- `DOGTABS_TO_DOGULE1_MAPPING.md`:
  - Field-level mapping tables.
  - ID strategy (legacy IDs, new UUIDs, lookup/registry rules).
  - FK and invariant rules, plus conflict resolution.

Validation

- If safe to do in the workspace: read-only parsing scripts to count entities and validate shape (no writes).

Exit criteria

- Mapping is complete enough to implement ingestion without guesswork.

Station 74 — MariaDB Schema & Adapter Implementation (Single Backend)

Branch: `feature/station74-mariadb-schema-adapter`

Scope

- Define MariaDB schema aligned to Dogule1 storage baseline.
- Implement MariaDB adapter(s) with CRUD parity to existing storage/SAL paths.
- Remove or hard-disable mock/file adapters; MariaDB is the only supported backend for Beta.
- Implement migration hooks needed for DogTabs ingestion.
- Expand schema for client-required fields:
  - Kunde: full address, Ausweis-ID, status (aktiv/passiv/deaktiviert), photo reference, notes, and Begleitpersonen (name/vorname + Hund reference).
  - Hund: rasse (picklist), geburtsdatum, felltyp, kastriert, fellfarbe, größe typ (1/2/3), herkunft, chip-nummer, geschlecht, notizen.
  - Kurs: createdAt required, Outlook mirror fields (event id/date/time/location), inventory/portfolio flags.
  - Trainer: ausbildungshistorie, stundenerfassung, lohnabrechnung (optional).

Deliverables

- SQL schema file(s) and migrations in `tools/migration` or `modules/shared/api/db` (aligned with existing structure).
- Adapter layer that uses MariaDB only; any non-MariaDB paths are removed or dev-only and not used for Beta.
- Connection configuration and pooling rules (including sane defaults for 1500 customers).

Validation

- Unit tests for adapter behavior parity.
- Smoke test: create/read/update/delete for each core entity.

Exit criteria

- MariaDB adapter passes tests and is the sole backend path used by the app.

Station 75 — DogTabs Data Ingestion Pipeline

Branch: `feature/station75-dogtabs-ingestion`

Scope

- Implement ingestion pipeline from DogTabs data folder into MariaDB.
- Enforce validation, FK checks, and deterministic mapping rules from Station 72.
- Provide dry-run mode and a detailed ingestion report.
- Declare one-way migration: DogTabs is read-only legacy; Dogule1 is authoritative after ingestion.
- Map DogTabs fields into the expanded Kunde/Hund/Trainer/Kurs schema (including status, picklists, and Outlook mirror fields).

Deliverables

- CLI ingestion command (dry-run and write modes).
- Reports: counts, rejects, and transformation summaries.
- Checksums or audit logging for ingestion runs.

Validation

- Dry-run against DogTabs dataset.
- Full run into a staging MariaDB instance.

Exit criteria

- A complete ingestion run succeeds with a known set of accepted/rejected records.

Station 76 — MariaDB Performance & Index Validation

Branch: `feature/station76-mariadb-performance`

Scope

- Verify key query paths: list customers, dogs per customer, courses per trainer, and any heavy list/detail screens.
- Confirm indexes exist and are used by MariaDB query planner.
- Measure worst-case load times on the full dataset and document baseline thresholds.

Deliverables

- `MARIADB_PERF_REPORT.md` with query list, index verification, and timings.
- Any schema/index adjustments required to meet thresholds.

Validation

- Run representative queries with explain plans and measured timings.
- UI sanity pass on large datasets.

Exit criteria

- No N+1 query patterns.
- No baseline violations beyond thresholds defined in Station 72.

Station 76.5 — NAS Deployment (Staging for Manual Test)

Branch: `feature/station76.5-nas-deployment`

Scope

- Deploy the MariaDB-backed app to NAS as a staging environment for manual testing.
- Record environment configuration and deployment path.

NAS profile

- Device: Synology DS218play
- Server name: SAN
- DSM: 7.3.2-86009
- QuickConnect ID: A4c31
- CPU: Realtek RTD1296 (4 cores @ 1.4 GHz)
- RAM: 1 GB

Deliverables

- NAS deployment report with target path, build version, and access URL.
- `status.md` entry confirming staging availability for manual tests.

Validation

- Smoke test on NAS (load app, navigate core modules, check MariaDB connectivity).

Exit criteria

- NAS staging environment is live and stable for Station 77 manual tests.

Station 77 — Manual Test Round 1 (Baseline)

Branch: `feature/station77-manual-test-1`

Scope

- Execute a full manual test pass on the MariaDB-backed app using real data.
- Capture issues with reproducible steps and severity.
- Test freeze: no feature work, refactors, or UI polish during the manual test window.

Deliverables

- `MANUAL_TEST_REPORT_1.md` with:
  - Test plan coverage list.
  - Issue log (severity, steps, environment, expected vs actual).
  - Blockers called out explicitly.

Validation

- Manual only.

Exit criteria

- All issues are logged, triaged, and assigned to a fix station.

Station 78 — Issue Fixes from Manual Test 1

Branch: `feature/station78-fix-manual-test-1`

Scope

- Fix all issues from Station 75 that are in-scope for Beta.
- Update tests as needed and document any deferrals.

Deliverables

- Code fixes.
- `MANUAL_TEST_REPORT_1.md` updated with resolution notes and deferrals.

Validation

- Targeted unit tests and smoke tests covering fixed areas.

Exit criteria

- No open P0/P1 issues from Station 75.

Station 79 — Structural UI Corrections (Data-Driven)

Branch: `feature/station79-ui-structure`

Scope

- Address data-driven UX needs exposed by real datasets: pagination, filters, column visibility, grouping, and density.
- Ensure large datasets remain usable and navigable without cosmetic polish work.
- Align list/detail layouts with new fields for Kunde/Hund/Kurs/Trainer (lists: minimal columns; details: full metadata).
- Kunde UI: status must be selectable (Aktiv/Deaktiviert) and photo upload must be available (displayed as Verfügbar/Keines with link).

Deliverables

- Structural UI changes across affected modules (no visual polish in this station).

Validation

- Manual walkthrough on large datasets to confirm usability improvements.

Exit criteria

- Data-heavy screens are usable at scale with required controls.

Station 80 — Certificate Generation (Course Completion)

Branch: `feature/station80-certificate`

Scope

- Add a certificate flow for completed courses with a query-style input: Kunde, Hund, Kurs, Datum.
- Generate a printable PDF certificate (single-page) from the selected data.
- Store certificate metadata (who/what/when) for audit/reference.
- Certificate must support Bewilligungsnummer and optional additional fields.

Deliverables

- Certificate UI entry in the appropriate module (likely Kurse or Kunden detail) with query form.
- PDF render/print path (client-side print-to-PDF or server-side PDF generation based on final backend plan).
- Minimal data validation and confirmation flow.

Validation

- Manual test: generate a certificate for an existing course and print to PDF.

Exit criteria

- Certificate can be generated, printed, and re-generated reliably.

Station 81 — Additional Feature Completion (Straightforward)

Branch: `feature/station81-feature-fillin`

Scope

- Implement the remaining "not difficult" features required for Beta.
- Confirm each feature has data persistence, basic validation, and minimal tests.
- Outlook calendar is source of truth: Dogule1 calendar mirrors Outlook entries (read-only).
- Kurse are created as inventory/portfolio items and then distributed/assigned.
- Birthday email automation (template + scheduling + opt-in rules).

Deliverables

- Feature list and checkboxes in `BETA_READINESS.md`.
- Code changes with minimal tests per feature area.

Validation

- Targeted tests per feature; smoke test for end-to-end flows.

Exit criteria

- All Beta-required features implemented or explicitly deferred.

Station 82 — Manual Test Round 2 (Regression)

Branch: `feature/station82-manual-test-2`

Scope

- Execute full regression manual test after fixes, UI work, and feature fill-in.
- Confirm MariaDB-backed flows are stable with real data.
- Test freeze: no feature work, refactors, or UI polish during the manual test window.

Deliverables

- `MANUAL_TEST_REPORT_2.md` with pass/fail, new issues, and exit recommendation.

Validation

- Manual only.

Exit criteria

- No P0/P1 defects; Beta readiness confirmed in `status.md`.

Station 83 — Guidance Docs Archival & Beta Docs

Branch: `feature/station83-beta-docs`

Scope

- Archive all existing guidance docs that are Alpha-focused.
- Create new Beta-phase guidance documentation.

Deliverables

- Move Alpha guidance docs to `archived-mds/` with `archived-` prefix.
- New Beta guidance docs (paths to be defined in Station 71).
- Update references in `DOGULE1_MASTER.md`, `DOGULE1_GOVERNANCE.md`, and `README.md`.

Validation

- Documentation review only.

Exit criteria

- Beta docs are in place and referenced; Alpha docs are archived.

Station 84 — Beta Readiness Sign-Off

Branch: `feature/station84-beta-signoff`

Scope

- Final verification of readiness criteria, data integrity, and manual test results.
- Lock Beta baseline versions and document open risks.

Deliverables

- `BETA_SIGNOFF.md` with:
  - Criteria checklist.
  - MariaDB readiness confirmation.
  - Known risks and mitigations.

Validation

- Document review and final manual smoke test summary.

Exit criteria

- Beta sign-off recorded in `status.md` with clear readiness statement.

Station 85 — Update/Rollout Workflow (TBD)

Branch: TBD

Scope

- Define a secure, uncomplicated workflow to edit, update, and roll out changes without breaking the NAS deployment. (Needs to be done; definition pending.)

Deliverables

- TBD

Validation

- TBD

Exit criteria

- TBD
