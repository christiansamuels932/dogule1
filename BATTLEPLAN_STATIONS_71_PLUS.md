# Dogule1 Battleplan — Stations 71+

Codex instruction: when working in this project, this document must be read first.

Purpose: define a clear, sequential plan from late Alpha to Beta with Contabo VPS as the production target.
Each station must be executed on its own branch and logged in `status.md` on completion.

Key design principles (implicit, non-negotiable)

- Deployment last, not first.
- Catalogue before billing.
- Accounts before automation.
- Manual tests before rollout.
- No mixed phases.

Phase: Late Alpha -> Beta Transition (Re-ordered & Expanded)

Station 71 — Visual UI Cohesion (Visual-only)

Branch: `feature/station71-visual-ui-cohesion`

Scope

- Visual cleanup only (spacing, alignment, consistency).
- No logic, data, or schema changes.
- Goal: reduce cognitive noise before heavy data work.

Deliverables

- Updated shared styles and UI layout polish.
- Notes of UX pain points for later structural stations.

Validation

- Manual UI walkthrough (desktop + mobile widths).

Exit criteria

- UI looks coherent without any behavior changes.

Station 72 — Alpha Freeze Definition

Branch: `feature/station72-alpha-freeze`

Scope

- Define Alpha Freeze rules:
  - Allowed: bugfixes, perf, stability.
  - Forbidden: new features, scope expansion.
- Define Beta readiness criteria (explicit checklist).

Deliverables

- Updated `BETA_READINESS.md` with freeze rules and Beta checklist.

Validation

- Document review only.

Exit criteria

- Alpha Freeze rules are explicit and agreed.

Station 73 — DogTabs Data Inventory & Mapping

Branch: `feature/station73-dogtabs-inventory-mapping`

Scope

- Full inventory of DogTabs exports.
- Field-by-field mapping to Dogule1 for:
  - Kunden
  - Hunde
  - Kurse
- Identify gaps, junk fields, and lossy mappings.

Deliverables

- Updated `DOGTABS_DATA_INVENTORY.md` and `DOGTABS_TO_DOGULE1_MAPPING.md`.
- Gap list and mapping decisions recorded.

Validation

- Read-only parsing/inspection; no writes.

Exit criteria

- Mapping is complete enough to implement ingestion without ambiguity.

Station 74 — MariaDB Finalization

Branch: `feature/station74-mariadb-finalization`

Scope

- MariaDB becomes the sole backend (no mockdata/runtime alternatives).
- Harden schema and prepare baseline indexes (not yet tuned).
- Ensure storage adapter parity and removal of mock paths for runtime.

Deliverables

- Finalized MariaDB schema and adapter wiring.
- Mockdata removed from runtime code paths.

Validation

- CRUD smoke tests per core module.

Exit criteria

- App runs only on MariaDB with no mockdata fallback.

Station 75 — Ingestion Pipeline

Branch: `feature/station75-ingestion-pipeline`

Scope

- Deterministic DogTabs -> MariaDB import.
- Validation rules and FK checks.
- Idempotency (re-runs are safe).
- Import logs and summaries.

Deliverables

- Ingestion CLI with dry-run + write modes.
- Import logs and reports.

Validation

- Dry-run and full import on a staging MariaDB.

Exit criteria

- Repeatable import with validated counts and deterministic output.

Station 76 — Performance Baselines

Branch: `feature/station76-performance-baselines`

Scope

- Measure baseline performance for:
  - Kunden list
  - Hunde list
  - Kurse list
- Add indexes where required.
- Record baseline numbers.

Deliverables

- Updated `MARIADB_PERF_REPORT.md` with metrics and index notes.

Validation

- EXPLAIN + timed queries on realistic dataset.

Exit criteria

- Baselines recorded and no major regressions.

Station 77 — Manual Test Round 1 (Baseline)

Branch: `feature/station77-manual-test-1`

Scope

- Manual end-to-end test of:
  - Kunden
  - Hunde
  - Kurse
- Log all issues; no feature work.

Deliverables

- `MANUAL_TEST_REPORT_1.md` with issues + severity.

Validation

- Manual only.

Exit criteria

- All issues logged and triaged.

Station 78 — Fix Round 1

Branch: `feature/station78-fix-round-1`

Scope

- Fix only issues found in Station 77.
- No scope creep.

Deliverables

- Issue fixes and updated report notes.

Validation

- Targeted tests for fixed areas.

Exit criteria

- No open P0/P1 issues from Round 1.

Station 79 — Structural UI for Large Datasets

Branch: `feature/station79-structural-ui`

Scope

- Filters, pagination, column control, sorting.
- Goal: usable with 1500+ Kunden.

Deliverables

- Structural UI updates (no visual polish).

Validation

- Manual walkthrough on large datasets.

Exit criteria

- Data-heavy screens are usable at scale.

Phase: Feature Completion (Before Production)

Station 80 — Kurse Catalogue System

Branch: `feature/station80-kurse-catalogue`

Scope

- Import and normalize `Kurse Catalogue.txt`.
- Kurse become catalogue items (not ad-hoc entries).
- Kurse selectable from the catalogue everywhere.

Deliverables

- Catalogue import + normalized catalogue model.
- UI selection for catalogue-backed Kurse.

Validation

- Manual create/select flow using catalogue items.

Exit criteria

- Kurse are consistently created from the catalogue.

Station 81 — Accounts & Roles

Branch: `feature/station81-accounts-roles`

Scope

- Logins for all trainers (mandatory per trainer).
- Admin client login.
- Developer super-login.
- Rule: new trainer -> new login.
- RBAC enforced across modules.

Deliverables

- Auth + RBAC implementation with seed/admin setup.

Validation

- Manual login checks for each role.

Exit criteria

- Role-based access works and is enforced.

Station 82 — Billing from Kurse

Branch: `feature/station82-billing`

Scope

- Generate Rechnungen from Kurse -> Kunde.
- Clear linkage: Kunde, Kurs, Zeitraum.
- Accounting-ready output (no automation yet).

Deliverables

- Rechnung generation flow and stored linkage.

Validation

- Manual end-to-end generation on sample data.

Exit criteria

- Rechnungen can be generated reliably from Kurse.

Station 83 — Zertifikate Module (NEW)

Branch: `feature/station83-zertifikate`

Scope

- New module: Zertifikate.
- Link Kunde, Hund, Kurs.
- Enter dates.
- Generate certificate document (PDF or template).
- No email yet.

Deliverables

- Zertifikate module + document generation.

Validation

- Manual generate/export flow.

Exit criteria

- Zertifikate can be created and exported.

Station 84 — Automation & Certificates

Branch: `feature/station84-automation`

Scope

- Birthday automation: Hund birthdate -> Happy-Birthday email.
- Certificate delivery (optional email hook).
- Event-based triggers only (no cron soup).

Deliverables

- Event-triggered automation flows.

Validation

- Manual trigger tests and audit logs.

Exit criteria

- Automation is event-driven and predictable.

Phase: Deployment & Beta

Station 85 — Update & Rollout Workflow

Branch: `feature/station85-update-rollout`

Scope

- Simple, safe update workflow:
  - Pull
  - Migrate (if needed)
  - Restart
  - Rollback path defined
- No heroics, no magic.

Deliverables

- `UPDATE_ROLLOUT.md` with step-by-step commands.

Validation

- Dry-run update steps on staging.

Exit criteria

- Update workflow is documented and testable.

Station 86 — Contabo VPS Production Deployment

Branch: `feature/station86-contabo-deploy`

Scope

- Execute `CONTABO_VPS_SETUP.md`.
- Production-grade hosting on Contabo VPS.
- Only after features complete and manual tests passed.

Deliverables

- Production deployment live on Contabo.

Validation

- Smoke test on public domain with `/api/kunden`.

Exit criteria

- VPS deployment survives reboot and serves production traffic.

Station 87 — Manual Test Round 2 (Regression)

Branch: `feature/station87-manual-test-2`

Scope

- Test on Contabo VPS.
- Focus on auth, performance, and data integrity.
- No feature changes.

Deliverables

- `MANUAL_TEST_REPORT_2.md` with pass/fail and issues.

Validation

- Manual only.

Exit criteria

- No open P0/P1 issues after regression.

Station 88 — Documentation Cleanup

Branch: `feature/station88-docs-cleanup`

Scope

- Archive Alpha docs.
- Publish Beta docs.
- Remove obsolete guidance.

Deliverables

- Updated docs set with archived Alpha materials.

Validation

- Document review only.

Exit criteria

- Docs match Beta scope and current deployment target.

Station 89 — Beta Sign-off

Branch: `feature/station89-beta-signoff`

Scope

- Formal Beta readiness confirmation.
- Freeze scope and handover-ready status.

Deliverables

- `BETA_SIGNOFF.md` with checklist and known risks.

Validation

- Manual review of criteria and test reports.

Exit criteria

- Beta sign-off recorded in `status.md`.
