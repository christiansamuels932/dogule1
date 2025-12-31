This document is the authoritative status log for Dogule1 (replaces dogule1_status.md). Station suffix legend: `R` = lifecycle/retention, `K` = Kommunikation, `E` = Email/Outlook line.
Every station block is wrapped by a visual bracket line: `# - - - - - - - - - - - - - - - - - - - -` before and after.
Each station block uses this structure (read-only):

- Title: `# Station X — <Title>` (for grouped history: `Station 1–17 — <Title>`).
- `## Kontext`: branch names, scope/goal/phase, prerequisites.
- `## Ergebnis (kurz)`: concise implementation summary (UI/data/logic, constraints).
- `## Tests`: commands run with outcomes (e.g., `pnpm lint`, `pnpm test`/`vitest`, `pnpm build`, `runIntegrityCheck`), note any warnings.
- `## Issues` (optional): failed tests/pushes/tooling, lint/build hiccups, and how resolved. Omit if none.
- `## Notizen` (optional): pending manual checks, warnings, risks, decisions.
  Instructions/notes in English; UI text references remain in German when quoted. Chronological order applies.
- READ-ONLY INSTRUCTIONS: All stations (including historical ones) must stay logged in this file; never replace or truncate existing entries when adding new stations. If a truncation occurs, restore the full history before adding new content (the Station 39–41 overwrite was fixed by restoring Stations 1–38 and reappending 39–41).

Branching rule: each station must be developed on its dedicated branch; if the expected branch does not exist yet, create a new one before starting the station.

# - - - - - - - - - - - - - - - - - - - -

# Station 76 — MariaDB Performance & Index Validation (UI Follow-up + Export)

## Kontext

- Branch: `feature/station75-dogtabs-ingestion` (follow-up changes captured here).
- Scope: complete Station-76 manual UI follow-ups, add Hunde Herkunft enum + form fields, add Kunden/Hunde XLSX exports, and add Kunden list column controls with “Hunde, Name” visibility.
- Preconditions: MariaDB socket `/run/mysqld/mysqld.sock`, API server (`tools/server/apiServer.js`), and Vite dev (`pnpm dev`) running with `DOGULE1_STORAGE_MODE=mariadb`.

## Ergebnis (kurz)

- Added Kunden list column configurator with Status fixed first, reorderable remaining columns, and visible “Hunde, Name” column populated from linked Hunde; persisted order via localStorage.
- Added foldable “Spalten anpassen” panel with explicit open/close toggle state and constrained height to reduce distraction.
- Added XLSX export buttons for Kunden- und Hundeübersicht using a shared export helper + `xlsx` dependency; export respects current filters/sort and visible columns.
- Implemented Herkunft as a controlled dropdown (privat/züchter/tierheim/tierschutz/internet/zoohandel) plus display formatting on Hund detail.
- Extended Hunde form to include all detail fields (Status, Kastriert, Felltyp, Fellfarbe, Größe-Typ, Größe (cm), Gewicht (kg), Herkunft, Chip Nummer, Trainingsziele, Notizen) and added Kunden search filter for large lists.
- Updated Hunde API defaults + mock data to include new fields (kastriert, felltyp, fellfarbe, groesseTyp, chipNummer) for UI visibility.

## Tests

- Not run (manual UI verification only).

## Notizen

- Manual checks completed:
  - Kunden: column reorder works with Status fixed; “Hunde, Name” visible; XLSX export works.
  - Hunde: Herkunft dropdown present; Herkunft displays as label in detail view after edit; form shows expanded fields.
  - Kunden search in Hunde form available for large customer list.
- `pnpm install` required after adding `xlsx` dependency.
- Branch mismatch recorded above; follow-up work executed on `feature/station75-dogtabs-ingestion`.

# - - - - - - - - - - - - - - - - - - - -

# Station 76 — MariaDB Performance & Index Validation

## Kontext

- Branch: `feature/station76-mariadb-performance`.
- Scope: define thresholds, enumerate adapter SQL, run EXPLAIN + timed baselines, UI N+1 sanity check, and document findings in `MARIADB_PERF_REPORT.md`.

## Ergebnis (kurz)

- Locked Station 76 performance thresholds and documented MariaDB adapter SQL + EXPLAIN targets in `MARIADB_PERF_REPORT.md`.
- Ran EXPLAIN and profiling on system MariaDB socket (`/run/mysqld/mysqld.sock`) and recorded warm-cache p95 baselines + environment details.
- Ingested Kurse catalog items from `$_seminarstamm` with minimal trainer dependency (1 trainer + 14 kurse inserted) to make baselines representative; no schema/UI changes.
- Decision: no remediation required; PK index scans accepted under bounded dataset and observed sub-millisecond timings; no schema/adapter changes made.
- Manual UI sanity check completed (Kunden list → Kunde detail → Hunde list) with no visible multi-step loading; follow-ups noted in the report.
- Hunde data fidelity fix: normalized DogTabs US-style dates for `geburtsdatum`, mapped `hund_tiergruppe` via `$_codes_tiergruppen` (labels instead of numeric codes), and updated existing Hunde rows.

## Tests

- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 -e "SELECT 'kunden', COUNT(*) FROM kunden; ..."` ✅
- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 <<SQL ... EXPLAIN ... SQL` ✅
- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 < /tmp/mariadb_perf.sql` ✅ (profiling runs)
- `DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran node tools/dogtabs/cli.js ingest --modules=kurse` ✅
- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 -e "SELECT COUNT(*) FROM kurse; SELECT id, status, inventory_flag, portfolio_flag, date, start_time, end_time, notes FROM kurse LIMIT 1;"` ✅
- `DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran node tools/dogtabs/updateHundeFields.js` ✅
- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 -e "SELECT id, code, geburtsdatum, herkunft FROM hunde LIMIT 5;"` ✅

## Notizen

- Deferred validation: kalender/zahlungen/waren are empty; re-run baselines once data exists.
- Follow-ups captured in `MARIADB_PERF_REPORT.md`: Kunde Übersicht “Hund verlinkt” column, post-fix UI check for geburtsdatum/Herkunft.
- Tech-debt: Kurse catalog items use empty strings for date/time fields (schema NOT NULL); acceptable for Station 76, to be revisited in a later station.
- Pending verification checklist (next session):
  - UI sanity check (post-fix): open Kunden list, pick a Kunde, confirm Hunde list shows `Geburtsdatum` values (not blank) and `Herkunft` labels (e.g., `Hund`, not numeric codes).
  - UI detail check: open a Hund detail view and confirm `Geburtsdatum` and `Herkunft` render correctly in the detail list.
  - Data spot-check in MariaDB: `SELECT id, code, geburtsdatum, herkunft FROM hunde LIMIT 5;` confirm ISO dates and label values.
  - Report consistency: ensure `MARIADB_PERF_REPORT.md` reflects the Hunde data fix and that the post-fix UI check is marked complete once verified.
  - Remaining follow-up scope: Kunden Übersicht “Hund verlinkt” column (sortable) still pending; confirm intended sort behavior once implemented.

# - - - - - - - - - - - - - - - - - - - -

# Station 71 — UI Visual Pass & Entity List/Detail Cleanup

## Kontext

- Branch: `station71`.
- Scope: visual cohesion pass, standardized button spacing, and list/detail refinements for Kunden/Hunde/Kurse/Trainer; no backend changes.

## Ergebnis (kurz)

- Applied new visual palette and typography across shared styles; unified button styling and spacing in module action areas.
- Rebuilt Kunden/Hunde/Trainer list views into sortable, scrollable table overviews; aligned detail views with cleaner definition-list layouts.
- Updated Kunden detail/form to include Status select (Aktiv/Deaktiviert), Ausweis-ID, Foto upload (Verfügbar/Keines link), and Begleitpersonen; Hunde detail extended with required fields (Felltyp, Kastriert, Fellfarbe, Größe-Typ, Herkunft, Chip-Nummer).
- Adjusted Kurse list/detail to display created date and Outlook-mirror status in place of direct scheduling; added Kunde/Hund summaries in Kurs overview; normalized trainer availability labels to weekdays.
- Fixed vertical spacing for “Hund hinzufügen” and “Auswahl leeren” buttons; standardized form footer button layout across Kunde/Hund/Kurs/Trainer.
- Updated battleplan to include certificate station and UI requirements for status/photo upload.

## Tests

- Not run (UI/documentation changes only).

## Notizen

- Photo upload is stored as data URL for now (mock storage), surfaced as “Verfügbar” link in details.

# - - - - - - - - - - - - - - - - - - - -

# Station 72 — Alpha Closeout & Beta Readiness Gate

## Kontext

- Branch: `feature/station72-alpha-closeout`.
- Scope: freeze Alpha scope, define Beta entry/exit criteria, and standardize manual test issue logging. Documentation only.

## Ergebnis (kurz)

- Added `BETA_READINESS.md` with Alpha freeze list, Beta entry/exit criteria, and manual test issue log template.
- Captured deferred-to-Beta scope (DogTabs ingestion, MariaDB-only backend, expanded entity fields, performance validation, manual test cycles).

## Tests

- Not run (documentation changes only).

# - - - - - - - - - - - - - - - - - - - -

# Station 73 — DogTabs Data Inventory & Mapping Plan

## Kontext

- Branch: `feature/station73-dogtabs-inventory`.
- Scope: inventory DogTabs legacy capture (read-only), document file formats/counts, and define a mapping plan to Dogule1 schema.

## Ergebnis (kurz)

- Added `DOGTABS_DATA_INVENTORY.md` with file-type counts, directory inventory, snapshot counts, and PII notes for the Station-61 capture.
- Added `DOGTABS_TO_DOGULE1_MAPPING.md` describing target mappings, ID strategy, FK rules, and open questions; embedded Access DB extraction manual.
- Extracted Access DB schema and table list from the DogTabs database and mapped core tables (Kunden, Hunde, Seminare, Rechnungen, Pension/Rooms).
- Captured column headers via `mdb-export` for `$_kundenstamm`, `$_kunden_hunde`, `$_seminardaten`, and `$_rechnung_kopf` and documented them in the mapping plan.

## Tests

- `mdb-tables -1 "migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.accdr.ORG"` — ✅
- `mdb-schema "migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.accdr.ORG" mysql` — ✅ (No MSysRelationships)
- `mdb-export ... "$_kundenstamm"` — ✅ (header capture)
- `mdb-export ... "$_kunden_hunde"` — ✅ (header capture)
- `mdb-export ... "$_seminardaten"` — ✅ (header capture)
- `mdb-export ... "$_rechnung_kopf"` — ✅ (header capture)

## Notizen

- XLSX snapshots appear to have no embedded column headers; Access DB remains the authoritative schema source.
- `mdb-schema` output saved outside the repo in `/tmp/dogtaps_schema.sql`.
- Relationships were not emitted by `mdbtools` (`No MSysRelationships`), so FK rules still need manual validation.

# - - - - - - - - - - - - - - - - - - - -

# Station 74 — MariaDB Schema & Adapter Implementation

## Kontext

- Branch: `feature/station74-mariadb-schema-adapter`.
- Scope: implement MariaDB schema + adapter, switch core CRUD to HTTP-backed API, and hard-require MariaDB for Beta usage.

## Ergebnis (kurz)

- Added MariaDB schema + local setup guide (`tools/mariadb/schema.sql`, `tools/mariadb/README.md`) and initialized local data dir under `/home/ran/codex/.local/mariadb` (socket-only).
- Implemented MariaDB storage adapter (`modules/shared/storage/mariadbAdapter.js`) with CRUD for kunden/hunde/kurse/trainer/kalender/finanzen/waren, uuidv7 defaults, and JSON field handling.
- Added core HTTP API router (`modules/shared/server/coreApiRouter.js`) and combined router export; Vite dev now wires core + Kommunikation via `createApiRouter`.
- UI core modules switched to HTTP in browser with `modules/shared/api/httpClient.js`, while tests stay on mock via a test-environment guard.
- Added Node API server entrypoint (`tools/server/apiServer.js`), MariaDB smoke test (`tools/mariadb/smokeTest.js`), and `.env.example` for local config.
- Storage config supports `mariadb` mode and can enforce it via `DOGULE1_REQUIRE_MARIADB=1`; `.local/` is gitignored.

## Tests

- `pnpm install` ✅ (esbuild build scripts ignored warning)
- `pnpm test` ❌ (HTTP mode tried `http://localhost:3000`, fixed by test-env guard)
- `pnpm test` ✅
- `mariadb-install-db --datadir /home/ran/codex/.local/mariadb --user=ran` ✅ (auth_pam ownership warnings)
- `nohup mariadbd --datadir /home/ran/codex/.local/mariadb --socket=/home/ran/codex/.local/mariadb/mariadb.sock --pid-file=/home/ran/codex/.local/mariadb/mariadb.pid --log-error=/home/ran/codex/.local/mariadb/mariadb.err --skip-networking &` ✅
- `mariadb --protocol=socket --socket /home/ran/codex/.local/mariadb/mariadb.sock --user=ran < tools/mariadb/schema.sql` ✅
- `mariadb --protocol=socket --socket /home/ran/codex/.local/mariadb/mariadb.sock --user=ran -e "SHOW TABLES IN dogule1;"` ✅
- `pnpm run mariadb:smoke` ✅ (uses default socket + user)

## Notizen

- MariaDB runs with `--skip-networking` (socket-only) due to sandbox restrictions; set `DOGULE1_MARIADB_SOCKET` to connect.
- Core UI now expects `/api/*` endpoints in browser; use `createApiRouter` from `modules/shared/server/apiRouter.js` to serve CRUD + Kommunikation.
- `mariadb:smoke` emits MODULE_TYPELESS warning (repo is not ESM); left as-is.

# - - - - - - - - - - - - - - - - - - - -

# Station 75 — DogTabs Data Ingestion Pipeline

## Kontext

- Branch: `feature/station75-dogtabs-ingestion`.
- Scope: DogTabs ingestion + MariaDB wiring + manual-test preparation (Kunden → Hunde → Kurse).
- Station focus: resolve MariaDB adapter mismatch, import Kunden/Hunde into the live MariaDB, and align UI with new status/search requirements.

## Ergebnis (kurz)

- Enforced MariaDB-only mode in storage config + API router (fail-fast `MARIADB_REQUIRED`).
- Aligned MariaDB adapter defaults with smoke test (socket default + OS user), added connection log line.
- Resolved adapter mismatch: confirmed two MariaDB instances; standardized on system socket `/run/mysqld/mysqld.sock`.
- Loaded MariaDB schema on the system instance; created `dogule1` database there.
- Imported DogTabs Kunden CSV into system MariaDB: 1412 inserted.
- Added `kunden.legacy_id` column, then backfilled via `code=DT-<kundennummer>` mapping (1412 updated, 0 skipped).
- Imported DogTabs Hunde from Access DB with FK resolution via `kunden.legacy_id` → `kunden.id`: 386 inserted/linked, 2 unmatched.
- UI updates: Kunden Status added to list (first column) with default sort Aktiv → Passiv → Deaktiviert, and search filter; Hunde list search added; Hunde form now includes Status dropdown.
- Data model updates: `hunde.status` column added to schema and storage adapters; status shown in Hund detail.

## Tests

- `pnpm run lint` — ✅
- `pnpm run test` — ✅
- `pnpm run build` — ✅
- `pnpm run legacy:station61:guard` — ❌ `spawnSync git EPERM` in sandbox.
- `DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran pnpm run mariadb:smoke` — ✅ (kunden=1413).
- `node tools/dogtabs/cli.js dry-run` — ❌ `mdb-export` EPERM in sandbox.
- `node tools/dogtabs/cli.js customers-csv <Dogtabs-Kunden-Export.csv>` — ✅ (system socket; report shows 1412 inserted).
- Hunde import via Access DB + MariaDB writer — ✅ (386 inserted/linked, 2 unmatched).

## Notizen

- Two MariaDB instances were in play: local socket `~/.local/mariadb/mariadb.sock` vs system socket `/run/mysqld/mysqld.sock`. API was using system socket; schema/data initially only existed on local socket.
- Current standard: system MariaDB socket (`/run/mysqld/mysqld.sock`) for API + imports; avoid mixing sockets.
- `kunden.legacy_id` is now the deterministic link for Hunde import (DogTabs `hund_kundennummer` → `kunden.legacy_id`).
- Unmatched Hunde count: 2 (no matching `kunden.legacy_id`); record in next pass before Kurs import.
- CI guard: removed `migration/legacy/station61/capture_20251219_185854Z/Dogtabs-Kunden-Export.csv` from git to keep Station 61 capture immutable.
- Lint/test failures resolved by adding explicit globals in DogTabs tooling and updating storage-mode tests to expect `MARIADB_REQUIRED`.

# Station 71 — From Alpha to Beta Planning & Doc Consolidation

## Kontext

- Branch: `from-alpha-to-beta-planning`.
- Scope: consolidate current docs (excluding `status.md`), archive legacy MDs, and define the Alpha→Beta battleplan with early UI preview pass.

## Ergebnis (kurz)

- Created `DOGULE1_COMBINED.md` as the single consolidated doc and archived existing MDs into `archived-mds/` while preserving relative paths.
- Added and refined `BATTLEPLAN_STATIONS_71_PLUS.md` with reordered stations, single-backend MariaDB rule, performance validation, UI split (visual early vs structural later), and manual-test freeze rules.
- Added instruction to always read the battleplan in `DOGULE1_COMBINED.md` and `BATTLEPLAN_STATIONS_71_PLUS.md`.

## Tests

- Not run (documentation/planning changes only).

## Notizen

- `status.md` remains the continuous log and was not consolidated.

# - - - - - - - - - - - - - - - - - - - -

# Station 70 — Storage & Security Hardening Pass

## Kontext

- Branch: `70`.
- Scope: storage failure-injection + restore drill, audit/log integrity check, secret rotation drill, and permission/rate-limit review after integrations.

## Ergebnis (kurz)

- Ran migration dry-run, failure injection, migrate + scan/verify-checksums; completed a restore drill on `storage_candidate/v1` and re-verified checksums.
- Verified audit/log integrity via test suite (logging schema + audit chain) and ran the mock DB integrity check; reviewed auth matrix and rate-limit config for Kommunikation.
- Performed a secret-rotation drill by reloading auth config with updated env secrets.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅
- `npm run build` — ✅
- `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"` — ✅ (MODULE_TYPELESS warning)
- `node tools/migration/cli.js dry-run` — ✅ (MODULE_TYPELESS warning)
- `MIGRATE_FAIL_AFTER_MODULE=kurse MIGRATE_RUN_ID=station70-fail node tools/migration/cli.js migrate` — ❌ expected (rollback drill)
- `MIGRATE_RUN_ID=station70 node tools/migration/cli.js migrate` — ✅
- `node tools/migration/cli.js scan-all` — ✅
- `node tools/migration/cli.js scan-pii` — ✅
- `node tools/migration/cli.js scan-drift` — ✅
- `node tools/migration/cli.js verify-checksums` — ✅ (pre-restore)
- `node tools/migration/cli.js verify-checksums` — ✅ (post-restore)
- `node --input-type=module -e "import('./modules/shared/auth/config.js').then(m=>{process.env.DOGULE1_AUTH_SECRET='rotate-a'; process.env.DOGULE1_REFRESH_SECRET='rotate-b'; const a=m.resolveAuthConfig({}); process.env.DOGULE1_AUTH_SECRET='rotate-c'; process.env.DOGULE1_REFRESH_SECRET='rotate-d'; const b=m.resolveAuthConfig({}); console.log(a.secrets.access, a.secrets.refresh, b.secrets.access, b.secrets.refresh);})"` — ✅ (MODULE_TYPELESS warning)

## Notizen

- storage reports: `storage_reports/latest-dry-run/`, `storage_reports/latest-scan/` (gitignored).
- storage candidate: `storage_candidate/v1` (gitignored).
- cleanup: removed `storage_reports/` and `storage_candidate/` after drills.

# - - - - - - - - - - - - - - - - - - - -

# Station 67X — Email Feature Removal

## Kontext

- Branch: `67x`.
- Scope: remove email feature across Kommunikation (UI, API, storage validators, tests) and delete email/Outlook planning from governance/baseline/DoR documents; retain historical logs.

## Ergebnis (kurz)

- Removed the email module and API wiring, dropped the Kommunikation emails tab, and stripped email storage validation/code paths.
- Updated governance, master path, DoR, and security baseline to remove email/Outlook stations and rules while keeping logs intact.

## Tests

- Tests not run (not requested).

# - - - - - - - - - - - - - - - - - - - -

# Station 67K — Infochannel with Confirmation Flow

## Kontext

- Branch: `feature/station67k-infochannel-confirmation`.
- Scope: admin-only Infochannel publish, trainer confirmation flow, SLA clock + reminders/escalations, full audit trail, rate limits, and UI wiring; no comments/attachments/edits after send.

## Ergebnis (kurz)

- Added Infochannel storage/SAL (notices, confirmations, SLA reminder/escalation events) with audit chain writes, rate limits, and admin-only publish; confirmations are immutable with late/overdue calculations.
- Implemented Infochannel API handlers + client and wired Kommunikation UI list/detail with confirm UX and SLA status indicators; shared styles extended for Infochannel surfaces.
- Mounted Kommunikation API routes (groupchat/infochannel/email) in the dev HTTP router and added actor/authz header propagation from clients.
- Updated auth matrix with Infochannel view/confirm/SLA actions; added validators for new entities.

## Tests

- `npm test -- modules/kommunikation/infochannel/sal.test.js modules/kommunikation/infochannel/apiRoutes.test.js modules/kommunikation/email/sal.test.js modules/kommunikation/email/apiRoutes.test.js` — ✅

## Notizen

- Manual check: Infochannel publish + trainer confirmation validated in dev; admin view shows confirmation list and SLA metadata.

# - - - - - - - - - - - - - - - - - - - -

# Station 67E — Email Integration MVP (Send-Only)

## Kontext

- Branch: `feature/station67e-email-send-mvp`.
- Scope: compose→send flow in Kommunikation → Emails, Outlook send connector (send-only), status surfaced, abuse thresholds + rate limits, audit logging, kill switch + SPF/DKIM/DMARC alignment plan docs.

## Ergebnis (kurz)

- Added email send storage + SAL with queued→sent/failed status updates, Outlook connector stub (token-aware), rate limits/recipient caps, and audit chain writes; CC/BCC gated to admin.
- Implemented email API handlers + client and wired Kommunikation UI compose/list/detail with status/error messaging.
- Documented kill switch + SPF/DKIM/DMARC alignment plan in security baseline; extended auth matrix with email view action and tightened admin-only send policy.

## Tests

- `npm test -- modules/kommunikation/infochannel/sal.test.js modules/kommunikation/infochannel/apiRoutes.test.js modules/kommunikation/email/sal.test.js modules/kommunikation/email/apiRoutes.test.js` — ✅

## Notizen

- Manual check: Email send attempt without Outlook token shows `Fehlgeschlagen` with `missing_token` error as expected.

# - - - - - - - - - - - - - - - - - - - -

# Station 66R — Groupchat Retention Enforcement

## Kontext

- Branch: `feature/station66r-groupchat-retention`.
- Scope: enforce deterministic retention for the global groupchat with pinned cutoff pagination, logical read-marker clamping, gated server-side pruning, and minimal UI notices; no polling/push, no moderation UI, no migrations.

## Ergebnis (kurz)

- Added retention config + validation, pinned cutoff in cursors, query-time filtering, retention-aware unread counts, and optional prune job with caps/time budget and audit events; retention is disabled by default and Station 65 behavior remains unchanged.
- Exposed retention/truncation metadata on list responses and added minimal German UI notices when enabled/truncated.
- Added auth matrix entries for retention prune events; added UI guide placeholder, agents/protocol docs, and archived legacy status/step notes from the planning tidy-up.

## Tests

- `pnpm test -- modules/kommunikation/groupchat/sal.test.js modules/kommunikation/groupchat/ui.test.js` — ✅

## Notizen

- Pruning is gated by `DOGULE1_GROUPCHAT_RETENTION_PRUNE_ENABLED` and rate-limited; async pruning emits start/complete/noop/error audit events with jobId.

# - - - - - - - - - - - - - - - - - - - -

# Station 65 — Groupchat Core (Step 2 — API & UI Wiring)

## Kontext

- Branch: `feature/station65-groupchat-core`.
- Scope: Expose SAL-backed global groupchat via HTTP-style handlers and wire Kommunikation → Chats UI (list badge/preview, detail view, composer with optimistic send/retry, read marker update, offline handling). No polling/push.

## Ergebnis (kurz)

- Added groupchat API handlers (`/api/kommunikation/groupchat/messages`, `/read-marker`) with authz/rate-limit mapping, idempotent sends (clientNonce), cursor pagination, and 429/Retry-After propagation without logging bodies.
- UI now loads real chat summary (preview + unread badge), renders detail with ordered messages, optimistic pending/failed states, retry, and read marker updates on open/send; offline banner surfaces via storage probe.
- Client fetch wrapper and UI tests exercise send→refresh persistence with SAL-backed storage.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅
- `npm run build` — ✅

## Notizen

- Rate limits rely on in-memory limiter; retention still null/no-op. API handlers are framework-agnostic; wire into actual HTTP server in later steps if needed.

# - - - - - - - - - - - - - - - - - - - -

# Station 65 — Groupchat Core (Step 1 — Storage & SAL)

## Kontext

- Branch: `feature/station65-groupchat-core`.
- Scope: Storage + SAL for global group chat (room/message/read marker/dedupe entities, authz, rate limits, audit hooks, ordering/pagination). UI remains untouched.

## Ergebnis (kurz)

- Implemented schemaVersion=1 storage for `kommunikation_groupchat_room`, messages, read markers, and send dedupe with deterministic ordering and base64url cursor pagination (createdAt ASC + id ASC).
- `sendMessage` is idempotent on `(actorId, clientNonce)` for 24h via hashed dedupe table; enforces trimmed/max-length body, authz, rate limits, audit events (no body logged), and atomic message+dedupe writes through `executeWriteContract`.
- Read markers enforce same-room existence and monotonic advance; `listMessages` returns optional readMarker/unreadCount; default room auto-created with retentionDays=null.

## Tests

- `npm test -- modules/kommunikation/groupchat/sal.test.js` — ✅

## Notizen

- Retention enforcement still null/no-op; UI wiring and polling remain out of scope for Step 1. Rate limits use in-memory buckets.

# - - - - - - - - - - - - - - - - - - - -

# Station 64 — Kommunikation Skeleton (Abgeschlossen)

## Kontext

- Branch: `feature/station64-kommunikation-skeleton`.
- Scope: read-only Kommunikation shell with hash-based tabs (Chats, Infochannel, Emails, System), deterministic state machine (loading/empty/error/offline), deny-by-default authz on view actions, SAL-based offline detection only, navigation/view logging without sensitive payloads. No send/notifications/migrations.

## Ergebnis (kurz)

- Kommunikation module now parses deep-link routes (`#/kommunikation/<tab>[/<id>]`), renders tab nav + list/detail placeholders, and drives loading/empty/error/offline states deterministically.
- Authz enforced in-module: default denied; admin shortcut allowed; otherwise requires `allowedActions` to include the tab’s view action (`kommunikation.chat.view|infochannel.view|email.view|system.view`). Blocked state shown when unauthorized.
- Offline handled solely via SAL probe hook (`window.__DOGULE_STORAGE_PROBE__`); lacking a probe yields offline. Client-side logging emits schema-shaped navigation/view events to `window.__DOGULE_LOGGER__`/console (no sensitive payloads).
- Shared styles updated for Kommunikation tabs/cards/detail; no business logic or writes added.

## Tests

- `npm run lint` — ✅ (pnpm/corepack unavailable on host)
- `npm run test` — ✅
- `npm run build` — ✅

## Notizen

- Manual viewing of shells requires providing authz + SAL probe in the runtime context (e.g., `window.__DOGULE_ACTOR__`, `window.__DOGULE_AUTHZ__.allowedActions`, `window.__DOGULE_STORAGE_PROBE__`). Otherwise UI shows blocked/offline by design. No PR yet.

# Station 63 — Real Storage Core Entities (Abgeschlossen)

## Kontext

- Branch: `feature/station63-storage-layer`.
- Scope: implement real-mode storage + audit chain for Kunden/Hunde/Trainer/Kurse with schemaVersion=1 validation, checksum-wrapped JSON files, FK checks (Hund→Kunde, Kurs→Trainer), fail-fast storage root, and contract-first logging/alerts.

## Ergebnis (kurz)

- Real adapter now supports CRUD for all four core entities using canonical JSON + sha256 checksums, tamper-evident audit JSONL with hashPrev/hashIndex/recordHash, and manifest updates; read path verifies checksum and wrapper metadata.
- Validators enforce schemaVersion=1, required fields, UUID ids; FK enforcement for Hund→Kunde and Kurs→Trainer runs inside the write contract; missing storage root raises STORAGE_ROOT_MISSING.
- Logging/alerts now cover all write failures (schema/FK/manifest/IO) via `executeWriteContract`; mock adapter parity preserved.

## Tests

- `npm run lint` — ✅ (pnpm unavailable on host; corepack/pnpm commands missing)
- `npm run test` — ✅
- `npm run build` — ✅

## Notizen

- Audit/manifest writes assume single-process access (no cross-process locking yet); storage root must pre-exist (no auto-create). Station 61 legacy capture remains untouched.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Abgeschlossen)

## Kontext

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: Closing summary after Steps 1–2E delivered (schema, logger, alerts, rate limits, health endpoints).

## Ergebnis (kurz)

- Station 62 implemented canonical logging/alert schema, core logger (fail-fast dev/test, single-drop notice in prod), alert wrapper with throttling, in-memory rate-limit primitive with logging, and `/healthz`/`/readyz` endpoints with internal readiness checks only.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- Limitations: (1) logger schema-violation notice is log-only (no alert signal); (2) alert `result` defaults to `"error"` unless caller sets an explicit outcome; (3) rate-limit buckets are in-memory without TTL cleanup (long-lived keys may accumulate).

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2E — Health Endpoints)

## Kontext

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: add `/healthz` (always 200 ok) and `/readyz` (200 ok vs 503 not_ready) handlers with internal readiness checks; no external deps.

## Ergebnis (kurz)

- Implemented `modules/shared/server/health.js` with `handleHealthz` (always 200, `{status:"ok"}`) and `handleReadyz` (200 ok only when config/logger/rate-limit checks pass; else 503 `{status:"not_ready"}`).
- Readiness failures log a warning via canonical logger (`actionId=system.health.readiness`, `result=error`, `message=READINESS-NOT-READY`); successful checks are not logged. No stack traces or config leakage in responses.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- Readiness scope limited to internal availability (config loaded, logger initialized, rate limiter available); no external service checks.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2D — Rate Limit Primitive)

## Kontext

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: in-memory fixed-window rate limit primitive + rate-limit hit logging helper; no concrete limits yet.

## Ergebnis (kurz)

- Added `modules/shared/ratelimit/limiter.js` with `rateLimit({ actionId, key, limit, windowMs })` returning `{ allowed, remaining, resetAt }` without throwing; fixed window with deterministic resetAt; buckets are per key in-memory.
- Added `logRateLimitHit({ actionId, actor, requestId, key })` emitting warning-level `RATE-LIMIT-HIT` via canonical logger (result=rate_limited, target=ratelimit/key, no new schema).

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- No hardcoded limits; consumers resolve identity keys and call the primitive.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2C — Alert Signals)

## Kontext

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: alert wrapper over central logger with throttling; no new dependencies or schema changes.

## Ergebnis (kurz)

- Added `modules/shared/logging/alerts.js` with `alertEvent(event)`: requires `alertCode` and `throttleKey`, forces `level=alert`/`severity=ALERT`, reuses the canonical schema via `logEvent`, and throttles per (`alertCode`, `throttleKey`) to max 1 emit per 5 minutes (drops silently).
- Dev/Test: throws on missing required fields or schema violations; Prod: never throws, drops invalid/throttled alerts after emitting via logger when valid.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- No new dependencies; schema is reused (no additional schema files).

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2B — Core Logger)

## Kontext

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: central JSONL logger with schema validation + fail-fast/dev-test vs drop-once-in-prod behavior; no new dependencies.

## Ergebnis (kurz)

- Implemented `modules/shared/logging/logger.js` exporting `logEvent(event)` only: applies defaults (ts, level→severity mapping), validates via Station 62 subset schema, enforces meta whitelist/size (<=1024B), and writes exactly one JSON line to stdout on success.
- Environment behavior: dev/test throw immediately on schema violation; prod emits a single `critical` event (`message=LOG-SCHEMA-INVALID`) on first invalid log, then drops subsequent invalid events silently.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- No new dependencies added; console usage limited to the controlled stdout write.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2A — Schema Validation Loader)

## Kontext

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: runtime loader + validator for log/alert schema (no UI/storage changes); no new dependencies added; ajv absent, so minimal in-repo validator used.

## Ergebnis (kurz)

- Added `modules/shared/logging/schema.js` to load `tools/ops/log_event.schema.json` at runtime and validate events via a Station-62-aligned subset validator (required fields, enums, lengths/types, meta whitelist).
- Added `modules/shared/logging/schema.test.js` with happy-path and invalid-case coverage (required missing, enum mismatch, type mismatch, meta overage/disallowed key).

## Tests

- `npm run lint` — ✅ (worktrees/\*\* excluded to avoid frozen Station 61 config noise).
- `npm test` — ✅ (vitest suites pass, including `modules/shared/logging/schema.test.js`).

## Notizen

- Minimal validator is a strict subset aligned to Station 62 until an in-repo JSON Schema validator (e.g., ajv) is available.
- No new dependencies added.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Design Step 1)

## Kontext

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: define canonical logging/alert event schema and JSON Schema; boundaries: no UI, no migrations, no storage writes beyond logs.

## Ergebnis (kurz)

- Created `tools/ops/STATION62_LOGGING_ALERTS_EVENT_SCHEMA.md` with canonical event shape (logs + alerts), severity mapping, required/optional fields, privacy rules, and overload/drop policy.
- Added machine-readable schema `tools/ops/log_event.schema.json` (schemaVersion 1.0.0) enforcing required fields, enums, meta whitelist/size caps, and alert extras.

## Tests

- None (design-only step).

## Notizen

- Step 1 complete. Next: implement logger, schema validation, rate limits, alert throttling, health endpoints per plan. Boundaries reaffirmed: no UI changes, no migrations, no storage writes beyond logs.

# - - - - - - - - - - - - - - - - - - - -

# Station 1–17 — Foundations & Early Linking (Historisch)

## Kontext

- Zeitraum: Phase 1 Baseline bis Kurs-Finanzflächen.
- Branches/PRs: diverse, bereits gemergt; keine offenen PRs mehr aus dieser Phase.
- Scope: Tooling, Router/Layout, Shared Components, zentrale Mock-API, CRUD für Kunden/Hunde/Kurse, erste Finanzen-Ansichten, frühe Verknüpfungen (Kunden↔Hunde↔Kurse), Build/NAS-Vorbereitung.

## Ergebnis (kurz)

- Tooling/CI/Husky/Commitlint aufgesetzt, Module scaffolded, Hash-Router + persistentes Layout, Shared UI-Komponenten, zentrale Mock-DB/CRUD.
- CRUD: Kunden, Hunde, Kurse; Finanzen-Karten für Kunden/Hunde/Kurse (readonly).
- Verknüpfungen: Kunden↔Hunde, Hunde↔Kurse, Kunden↔Kurse (teilnehmerbezogen), Kurs-Finanzflächen.
- Build: Vite-only mit relativen Pfaden; NAS-Platzhalter; Integrity-Check etabliert.

## Notizen

- Alle Stationen 1–17 abgeschlossen, keine offenen Issues aus dieser Phase bekannt.

# - - - - - - - - - - - - - - - - - - - -

# Station 58 — Storage Access Layer Architecture (E3)

## Kontext

- Branch: `feature/station57-authorization-matrix`.
- Ziel: Architekturplan für die Storage Access Layer (SAL), dual-mode (mock/real), inkl. AuthZ/Audit-Anforderungen, Migrationsreihenfolge, Storage-Layout, Contract-Tests und Ownership-Tabelle. Keine Code-/Storage-Änderungen.
- Quellen: Governance Station 58, Master-II Path, `SECURITY_AUTHORIZATION_MATRIX.md`, `DOGULE1_SECURITY_BASELINE.md`, Stations 54–57 Outputs.

## Ergebnis (kurz)

- `STATION58_STORAGE_ACCESS_LAYER_ARCHITECTURE.md` hinzugefügt: Dual-Mode-Switch (`DOGULE1_STORAGE_MODE=mock|real`, dev=mock, CI=real wenn Fixtures vorhanden, fehlende Pfade → fail fast), Real-Mode nutzt Station-54/56 Atomic Write + Integrity-Scan bei jedem Write; Candidate-Storage bleibt read-only.
- SAL-Konfiguration definiert für `modules/shared/storage/config.js` (Single Source): Mode-Auflösung, absolute Pfade (`/storage/v1`, `/storage_candidate/v1`), AuthZ/Audit-Hooks.
- AuthZ/Audit-Grenze: SAL verlangt `actionId/actorId/actorRole`, deny-by-default, jede Write-Operation (success/denied/error) erzeugt Audit-Eintrag mit Chain-Feldern (`hashPrev`, `hashIndex`, optional Merkle).
- Migrationsreihenfolge mit Begründung (Kunden → Hunde → Trainer → Kurse → Kalender → Finanzen → Waren → Kommunikation) zur FK-Sicherheit; Storage-Layout für Real vs. Candidate + Backup-Triggers (Stations 61/63).
- Contract-Tests gefordert (vor SAL-Implementation): CRUD + Parität (Mock vs Real, Hash-Vergleich), Error-Fidelity (`NotFound`, `InvalidData`, `InvariantViolation`, `Denied`, `StorageError`), Audit-Hook-Pflicht, Performance-Baseline (<5k rows).
- Ownership-Tabelle inkl. System-Actor (Imports/Backups/Config Jobs) mit Pflicht zu `actionId` + jobId im Audit-Kontext.

## Tests

- Keine (Dokumentationsstation).

## Notizen

- `STATION58_STORAGE_ACCESS_LAYER_ARCHITECTURE.md` ist Vorgabe für zukünftige SAL-Implementationen (Stations 59–63); CI-Gate folgt in Station 60. Keine Runtime-/Storage-/NAS-Änderungen; `storage_candidate/`, `storage_reports/`, `dist-station40.tar.gz`, `dogule1-alpha/` unverändert.

# - - - - - - - - - - - - - - - - - - - -

# Station 59 — Authentication & Sessions MVP Implementation

## Kontext

- Branch: `feature/station59-auth-sessions`.
- Ziel: Auth-/Session-MVP mit lokalem Login (`admin|staff|trainer`), PBKDF2-Hashing, Access/Refresh-Tokens, Lockout, Logout/Revoke, Admin-2FA-Flag (stub), Feature-Flagging; Audit-/AuthZ-Aktions-IDs fest verdrahtet in Baseline/Matrix.

## Ergebnis (kurz)

- `DOGULE1_SECURITY_BASELINE.md` ergänzt um Auth-Parameter: PBKDF2-HMAC-SHA256 (120k, 16B Salt, 32B Key), Access=15m, Refresh=7d, Lockout 5/5m → 15m, Secrets `DOGULE1_AUTH_SECRET`/`DOGULE1_REFRESH_SECRET`, Flags `DOGULE1_AUTH_ENABLED`, `DOGULE1_SESSION_COOKIE_NAME` (HttpOnly/SameSite=Strict/Secure), Admin-2FA-Toggle, Audit-ActionIDs `auth.*`.
- `SECURITY_AUTHORIZATION_MATRIX.md` erweitert um `auth.login|refresh|logout|lockout|denied` Rollenregeln (deny-by-default bleibt).
- Neue Auth-Implementierung (Mock/MVP): `modules/shared/auth/` mit Hashing, HMAC-signed Tokens, Lockout-Tracking, Refresh-Rotation/Revoke, Audit-Hooks (actionId/actor/target/result + Chain-Felder), Feature-Flag `DOGULE1_AUTH_ENABLED` (default off), Admin-2FA-Flag (stub: verweigert, wenn gefordert aber nicht gesetzt). Seed-User mit PBKDF2-Hashes (`admin`, `staff`, `trainer`).
- Config-Resolver (`modules/shared/auth/config.js`) für Secrets/TTLs/Lockout/2FA; Error-Codes gekapselt; ownership bleibt rein in-memory (kein Storage-Write).

## Tests

- `pnpm vitest run modules/shared/auth/authService.test.js` ✅ (nach Vitest-Konfig-Anpassung auf Single-Thread)
- `pnpm vitest run` ✅ (alle 7 Suites: kalender utils, router utils, finanzen.trainer, authService)

## Notizen

- Keine Runtime-/Storage-Änderungen; `storage_candidate/`, `storage_reports/`, NAS/`dist-station40.tar.gz`, `dogule1-alpha/` unverändert.
- Vitest-Konfig auf Single-Thread (`pool: "threads", maxThreads=1`) gesetzt, um den vorherigen Worker-Crash zu beheben; Tests laufen stabil.

# - - - - - - - - - - - - - - - - - - - -

# Station 57 — Authorization Matrix & Audit Plan (F2, F4)

## Kontext

- Branch: `feature/station57-authorization-matrix`.
- Ziel: Station-57 Planung/Dokumentation für Rollen×Aktionen, Audit-/Alert-Konzept, tamper-evidente Logs; erfüllt gleichzeitig die ausstehende Station-52 Security-Baseline-Anforderung.
- Scope: Rollen `admin`, `staff`, `trainer`, plus Pseudo-Rollen `system`, `unauthenticated`; Module: Kommunikation (Chats/Infochannel/Emails/System), Kalender, Imports, Finanzen, Backups, Config. Keine Code-/Storage-Änderungen.

## Ergebnis (kurz)

- `DOGULE1_SECURITY_BASELINE.md` erstellt (Version 0, Station-52+57): Prinzipien (deny-by-default), Rollen, Audit/Alert-Baseline, tamper-evidente Logging-Kette (SHA-256 Chain + optionale Merkle-Roots), CI-Gate-Erwartung für spätere Umsetzung.
- `SECURITY_AUTHORIZATION_MATRIX.md` hinzugefügt: machine-readable YAML für CI (Aktion-IDs wie `module.action` mit allowed/denied/conditional je Rolle), Tabellen-Hinweise, Preconditions, sensitive Domains markiert; System-/Unauthenticated-Rollen abgedeckt.
- Audit-Plan verankert: Pflichtfelder (ts/actor/action/target/result/before-after/requestId/hashPrev/hashIndex/context), keine Secrets/Tokens im Log, PII-Referenz zu Station 51, Pflicht-Audits für Finanzen/Imports/Backups/Config/Kommunikation-Writes.
- Alert-Plan definiert: Schwellen für failed_login, denied_action, finanzen_mutation, imports_failure, backup_failure, config_change; Station 62 muss diese Regeln implementieren.
- Tamper-Evidence aus Station 54–56 wiederverwendet (SHA-256, Chain, Rotation, Verifikationsprozedur); CI-Gate beschrieben (Station 60 muss Enforcement implementieren).

## Tests

- Keine (Dokumentationsstation).

## Notizen

- `DOGULE1_SECURITY_BASELINE.md` schließt die offene Station-52-Baseline-Anforderung und bildet die Grundlage für Station 57–62 (Auth/Authz/Logging/Alerts).
- Keine Runtime-/App-/Storage-Änderungen; `storage_candidate/`, `storage_reports/`, NAS-Artefakte, `dist-station40.tar.gz`, `dogule1-alpha/` unverändert.
- CI-Gate ist als Anforderung für spätere Stationen formuliert; derzeit keine Pipeline-Anpassung erfolgt.

# - - - - - - - - - - - - - - - - - - - -

# Station 18 — Status Quo Cleanup & Router/Layout/Build/Mock DB Konsolidierung

## Kontext

- Phase-1 Abschluss: Vereinheitlichung und Hardening der Basis.
- Scope: UI/ID-Regeln angleichen, Vite-Build stabilisieren, Router/Layout finalisieren, Mock-DB zentralisieren.

## Ergebnis (kurz)

- Dashboard/Kunden/Hunde/Kurse vereinheitlicht; ID/Code-Regeln dokumentiert (id fix, code editierbar).
- Router final: Clean Hash Router mit `import.meta.glob`, Fehlerzustände, Navigation-Highlighting.
- Layout final: Statische Layout-Injektion, Mount nur in `#dogule-main`.
- Build final: Vite-only, relative Pfade, keine Hybrid-Templates.
- Mock-DB: Alle Daten zentral in `modules/shared/api/db/index.js`; Integrity-Check aktiv.
- NAS-Platzhalter/Doku hinterlegt.

## Notizen

- Phase 1 QA-Checkliste angelegt; dient als laufender Prüfanker.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 19 — Module Self-Test Preparation (Phase A)

## Kontext

- Ziel: Pflicht-Checkliste für Phase-A-Module etablieren.
- Artefakt: `PHASEA_SELFTEST_CHECKLIST.md` erstellt und im MASTER verankert.

## Ergebnis (kurz)

- Checkliste deckt Router/Layout/Shared Components/CRUD/Empty/Error/Accessibility/Integrity ab.
- MASTER verweist auf Checkliste als Voraussetzung für alle Phase-A-Stationen.

## Notizen

- Keine Codeänderungen an Modulen; Dokumentationsstation abgeschlossen.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 20 — Dashboard Phase A

## Kontext

- Ziel: Dashboard auf zentrale Mock-API umstellen, Phase-A-Ready.

## Ergebnis (kurz)

- Dashboard-Zählungen nutzen zentrale Kunden/Hunde/Kurse-Daten.
- Fallback-Texte vereinheitlicht, Scroll/Focus beim Laden.
- Status-Karte via Shared Notice; Self-Test für Dashboard abgeschlossen.

## Tests

- `pnpm lint` ✅
- `pnpm build` ✅

## Notizen

- MASTER ergänzt: Module gelten nur nach vollständigem GUI + manueller Freigabe als abgeschlossen.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 24 — Trainer Single-Module Completion (Phase A)

## Kontext

- Branch: `feature/station24-trainer`
- Ziel: Trainer-Modul Phase-A-fertig (CRUD, Validierung, Shared Components).

## Ergebnis (kurz)

- h1/h2-Hierarchie sauber, Router-Mount unverändert.
- IDs sequenziell `t<n>` API-seitig; UI zeigt ID read-only, Code-Override-Toggle in Create/Edit.
- Verfügbarkeiten als interaktives Textarea mit Persistenz.
- Form-Buttons triggern Submit (`requestSubmit`), CRUD wieder funktionsfähig.
- Detail/List zeigen ID/Code/Kontakt/Notizen/Verfügbarkeiten.

## Tests

- `pnpm lint` ✅
- `pnpm build` ✅
- Manuelle UI-Validierung Phase-A: CRUD, Validierung, Empty/Error, Navigation, Shared-Styles ✅

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 25 — Finanzen Phase A (Listen/Detail/Filter – Skeleton)

## Kontext

- Branch: `feature/station25-finanzen`
- Ziel: Phase-A-Skelett für Finanzen (ohne CRUD/Deletes, vorbereitet für Station 27).

## Ergebnis (kurz)

- `initModule` mit Scroll/Fokus/Hash-Segmente.
- Loading/Error/Empty via Shared Notices.
- Summary-Karte (Summe Zahlungen/Offen/Saldo), Filter-Karte (Kunde/Typ).
- Einträge-Tabelle mit Kundenauflösung und Hash-Details.
- Detail-Card mit Kunde-Link + Back-Link.

## Tests

- `pnpm lint` ✅
- `pnpm build` ✅
- Manuell: `#/finanzen`, `#/finanzen/<id>` console-clean.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 27 — Finanzen Single-Module Completion (Phase A)

## Kontext

- Branch: `feature/station27-finanzen`
- Ziel: Finanzen-CRUD komplettieren.

## Ergebnis (kurz)

- Hash-Routen `#/finanzen`/`new`/`<id>`/`<id>/edit`.
- Shared-Formular: ID read-only + Code-Override, Felder Kunde/Typ/Betrag/Datum/Beschreibung.
- Filter + Summary beibehalten; Detail mit Edit/Delete-Actions, Inline-Löschbestätigung.
- Typen vereinheitlicht auf „Bezahlt/Offen“, Kundenlabels aus zentraler Map.
- Shared Notices/Empty, Fokus/Scroll-Reset, deutsche UI.

## Tests

- `pnpm lint` ✅
- `pnpm test` ✅
- `pnpm build` ✅
- Manuelle Self-Test: CRUD end-to-end inkl. Delete ✅, Console clean.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 28 — Waren Single-Module Completion (Phase A)

## Kontext

- Branch: `feature/station28-waren`
- Ziel: Waren-CRUD Phase-A-fertig (keine Relationen).

## Ergebnis (kurz)

- Routen `#/waren`/`new`/`<id>`/`<id>/edit`.
- Listen/Detail/Form/Delete über Shared Cards/Buttons/Notices/Form-Rows.
- Deutsche UI, Loading/Error/Empty/Not-Found, Fokus/H1/H2 korrekt.
- Keine Routing-/Console-Warnungen; nutzt zentrale Waren-API.

## Tests

- `pnpm lint` ✅
- `pnpm build` ✅
- Manuelle Self-Test: CRUD inkl. Delete ✅

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 29 — Connect Kunden ↔ Hunde

## Kontext

- Branch: `feature/station29-kunden-hunde`
- Ziel: Bidirektionale Navigation Kunden↔Hunde, FK-Sicherung.

## Ergebnis (kurz)

- Kunden-Detail zeigt verlinkte Hunde (ID/Code); Hunde-Liste/Detail verlinkt Besitzer, Rücksprung nach Delete.
- Hund-API erzwingt gültige `kundenId` bei Create/Update.
- Self-Test-Checkliste um Station-29-Block ergänzt.

## Tests

- `runIntegrityCheck` ✅
- `pnpm lint` ✅
- `pnpm test` ✅
- `pnpm build` ✅

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 30 — Connect Kunden ↔ Kurse (Hunde-basiert)

## Kontext

- Branch: `feature/station30-kunden-kurse`
- Ziel: Teilnehmermodell auf Hunde-only, abgeleitete Kundenanzeigen.

## Ergebnis (kurz)

- Kurse validieren `hundIds`, `kundenIds` entfernt; Integrity-Check aktualisiert.
- Kunden-Detail verlinkt Kurse über Hunde.
- Kurs-UI zeigt Teilnehmerkunden abgeleitet aus Hundebesitzern.
- Neues Typeahead im Kurs-Formular: Spalten Kunden/Hunde; Kunde-Klick fügt alle eigenen Hunde hinzu, Hund-Klick Einzelhund; Chips/Leeren; leere Auswahl erlaubt.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- PR erstellt (Station abgeschlossen).

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 31 — Connect Hunde ↔ Kurse

## Kontext

- Branch: `feature/station31-hunde-kurse`
- Ziel: Kurse in Hundedetail, Hunde in Kursdetail; Besitzerinfos konsistent.

## Ergebnis (kurz)

- Hunde-Detail listet Kurse inkl. Links; Kurs-Detail listet teilnehmende Hunde inkl. Besitzerinfos.
- Alle Hundedarstellungen zeigen Besitzer (Code/Name) + Ort aus Kundenadresse; Kurs-Formular-Suche/Chips ebenso.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- PR ausstehend.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 32 — Connect Kurse ↔ Trainer

## Kontext

- Branch: `feature/station31-hunde-kurse` (fortgeführt)
- Ziel: Trainer-Zuweisung validieren, Kurse ↔ Trainer Navigation, Delete-Guards.

## Ergebnis (kurz)

- Kurse laden/prüfen Trainerliste, Trainerkarte im Kursdetail (ID/Code/Kontakt), UI-Fehler bei ungültigem Trainer.
- Trainer-Detail listet Kurseinsatz; Trainer-Löschen blockiert bei Zuweisungen und zeigt Kursliste, Integrity-Check im Fehlerfall.
- Aktionen-Karten mit primärem „Neuer …“-Button vereinheitlicht.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- Manuell: Kursdetail → Trainer-Link, Trainerdetail → Kurse, Kurs-Create/Edit mit Trainer, Delete-Guard.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 32a — Build-Fix Trainer FK Export

## Kontext

- Branch: `feature/station31-hunde-kurse`
- Ziel: CI-Build-Fix nach fehlendem Export und FK-Check.

## Ergebnis (kurz)

- `modules/shared/api/kurse.js` exportiert `getKurseForTrainer`.
- Trainer-FK-Checks verschärft; Integrity-Check erweitert.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- Commit: `fix: enforce trainer FK and export getKurseForTrainer`.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 33 — Connect Kurse ↔ Kalender

## Kontext

- Branch: `feature/station33-kurse-kalender`
- Ziel: Kalender-Ereignisse strikt aus Kursen ableiten/synchronisieren.

## Ergebnis (kurz)

- Kalender upsert/remove per Kurs; `syncKalenderWithKurse` räumt Waisen.
- Event-Payload lokal → ISO, nur MASTER-Felder.
- UI: Event-Blocks verlinken zu `#/kurse/<id>`, Event-Detail zeigt Kurs-Infos + „Zum Kurs/Zum Tag“.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- Manuell: Kurs erstellen → Event erscheint; Zeit ändern → Event verschiebt; Löschen nach Entlinken entfernt Event; Event-Detail-Link ok.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 35 — Connect Trainer ↔ Finanzen (re-scoped)

## Kontext

- Branch: `feature/station35-trainer-finanzen`
- Ziel: Trainer-Metadaten in Finanzen (read-only), optional `kursId` in Zahlungen, keine Schemaerweiterung darüber hinaus.

## Ergebnis (kurz)

- Finanzen-Liste/Detail zeigen Trainer-Meta/Links für Kurs-Zahlungen; Trainer-Detail Umsatz-Karte (Summen Bezahlt/Offen/Saldo + letzte Einträge) mit Finanzen-Links.
- Neue API-Helper `resolveFinanzenWithRelations`, `getFinanzenReportForTrainer`; Integrity-Check validiert `kursId` falls vorhanden.
- Nicht kursgebundene Zahlungen bleiben unverändert; Kurs ohne Trainer zeigt Hinweis; Trainer-Umsatzkarte leer bei keinem Umsatz.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run --root . modules/shared/api/finanzen.trainer.test.js` ✅
- `pnpm build` ✅
- Manuelle Checks durchgeführt.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 35.1 — CI Lint Fix (Trainer ↔ Finanzen)

## Kontext

- Branch: `feature/station35-trainer-finanzen`
- Ziel: Lint-Fehler (unused helper) beheben.

## Ergebnis (kurz)

- Unbenutzten Helper `formatScheduleTimeRange` entfernt; Aufruf bleibt bei `formatTimeRange`.

## Tests

- `pnpm lint` ✅

## Notizen

- Rein technischer Cleanup, keine funktionalen Änderungen.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 36 — Connect Trainer ↔ Kalender (Derivation-Only)

## Kontext

- Branch: `feature/station35-trainer-finanzen` (weitergeführt für Station 36)
- Ziel: Trainerdaten nur abgeleitet in Kalenderoberflächen anzeigen, keine Schema-/Persistenzänderungen.
- Vorbedingungen: Station 32/32a (Kurse ↔ Trainer, FK-Checks), Station 33 (Kurse ↔ Kalender via kursId, keine Trainerfelder im Event) waren bereits umgesetzt.

## Änderungen (Code)

- `modules/kalender/index.js` (Bestand aus Station 33 weiterverwendet): Event-Blöcke/Details nutzen bereits `attachKursAndTrainer` und zeigen Trainer-Metadaten (Titel, Trainerzeile, „Zum Trainer“-Link im Event-Detail). Keine neuen Persistenzfelder; ableitende Darstellung bleibt intakt.
- `modules/kalender/utils/eventContext.js`: Weiterhin verantwortlich für Kurs/Trainer-Auflösung pro Event (keine Schemaänderung).
- `modules/trainer/index.js`: Neue read-only Karte „Kalendereinsätze“ im Trainer-Detail:
  - Lädt alle Kalender-Events, filtert nach `trainerId`.
  - Zeigt Datum + Zeitspanne (ISO → lokal), Titel/Code, Links zu Kurs (`#/kurse/<id>`) und Event (`#/kalender/event/<id>` Hash via `buildKalenderHash`).
  - Deutsche Empty/Error States, sortiert nach Startzeit.
  - Keine Schreiboperationen; rein abgeleitete Anzeige.
- Hilfsfunktionen ergänzt: Sortierung/Formatierung (`sortEventsByStart`, `formatEventTimeRange`).

## Tests & Qualität

- `pnpm lint` ✅
- `pnpm test --run` ✅ (Vitest-Suite inkl. Kalender-Utils/Routes/Layout und Finanzen-Trainer-Tests)
- `pnpm build` ✅
- `runIntegrityCheck` ✅ (Node Warnung: package.json ohne `"type": "module"`, unverändert)
- Manuelle Checks ✅: Kalender Tag/Woche zeigt Trainerzeile bzw. „Kein Trainer zugewiesen.“; Event-Detail mit Trainerblock + „Zum Trainer“; Trainer-Detail-Karte listet Events inkl. Links/Empty/Error.

## Lint/Build/CI-Folgen

- Keine neuen Lint-Verstöße; Husky/lint-staged liefen bei Commits.
- Node Warnung bei Integrity-Check bleibt bekannt (Type-Flag), bewusst nicht geändert.

## Entscheidungen / Abweichungen

- Keine Schemaänderungen in `kalender` (Events behalten nur `kursId`; Trainer wird immer über Kurs aufgelöst).
- Keine Router/Layout-Anpassungen; nur Moduloberflächen erweitert.
- Keine neuen Mock-Daten; bestehende Kurs→Kalender-Synchronisation reicht für Trainerableitung.

## Issues

- Node-Hinweis beim Integrity-Check (fehlendes `"type": "module"` in package.json) bewusst akzeptiert; keine Aktion.

## Notizen

- Station 36 abgeschlossen. PR “Station 36.X – Update Log” offen: https://github.com/christiansamuels932/dogule1/pull/48.

# - - - - - - - - - - - - - - - - - - - -

# Station 37 — Local Alpha Assembly Prep (Phase C)

## Kontext

- Branch: `feature/station35-trainer-finanzen` (weitergeführt für Station 37).
- Ziel: Alpha-Assembly vorbereiten ohne Scope-Erweiterung; Plan/Doku ergänzen, UX-Konsistenz prüfen, kleine UI-Korrekturen.
- Grenzen: Kommunikation bleibt Placeholder, Waren ↔ Finanzen nicht verknüpft, keine automatischen Kurs/Waren-Umsätze in Finanzen.

## Ergebnis (kurz)

- Plan/Doku: `STATION37_ALPHA_PLAN.md` hinzugefügt (Scope-Guards, Walkthrough, Gaps); README um Alpha-Abschnitt ergänzt (Runs, Verknüpfungen, bekannte Lücken).
- Navigation: Hauptmenü-Reihenfolge angepasst auf `Dashboard, Kunden, Hunde, Kurse, Trainer, Kommunikation, Kalender, Finanzen, Waren`.
- Kunden-Create: Optionaler Hunde-Block im Kundenformular (Mehrfachentwürfe, Name Pflicht, Code auto, Kunde FK gesetzt, Toast mit Erfolg/Fehlschlägen).
- Waren: Listen/Detail zeigen zugehörigen Kunden; Formular erfordert Kunde-Select; „Neu“-Button links ausgerichtet; Codes weiter optional.
- Bekannter Gap dokumentiert: Kein automatischer Waren→Finanzen- oder Kurs→Finanzen-Eintrag (bleibt bewusst offen).

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅ (Vite CJS Node API deprecation notice)
- `pnpm build` ✅
- `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"` ✅ (bekannte `"type": "module"` Warnung akzeptiert)

## Notizen

- Manuelle Alpha-Walkthrough-Schritte erfolgreich (Kunde→Hund→Kurs→Trainer→Kalender, Waren-CRUD, Finanzen-CRUD).
- Station 38 soll bekannte Gaps berücksichtigen (kein Waren/Kurs-Auto-Revenue, Kommunikation weiterhin minimal).

# - - - - - - - - - - - - - - - - - - - -

# Station 38 — Local Alpha Test Script (Phase C)

## Kontext

- Branch: `feature/station38-alpha-test-script` (ab Station-37-Stand fortgeführt).
- Ziel: Deterministisches, schrittweises Alpha-Testskript erstellen, das alle Module (Phase A) und Verknüpfungen (Phase B) abdeckt und bekannte Nicht-Ziele dokumentiert.
- Artefakte: `ALPHA_TEST_SCRIPT.md` (vollständiges Skript mit Aktionen/Erwartungen/Konsolen-Checks).

## Ergebnis (kurz)

- Vollständiges Alpha-Testskript mit festen Testdaten (Alpha Kunde/Hund/Kurs/Trainer/Ware/Finanzbuchung), Aktionen→Erwartung→Konsolen-Triplets, Navigation/Back/Forward/Hash-Checks.
- Deckt Phase-A-Checks je Modul (Focus/Scroll/Shared Components/Empty/Error/Loading) und alle Verknüpfungsketten (Kunden↔Hunde↔Kurse↔Trainer↔Kalender, Trainer↔Finanzen) ab; Kommunikation als Placeholder bestätigt.
- Negative Tests dokumentiert: Keine automatischen Waren→Finanzen- oder Kurs→Finanzen-Einträge.
- Data/Cleanup-Policy und Branch/Commit-Lock festgelegt für deterministische Runs.

## Tests

- Keine Builds/Tests notwendig (Dokumentationsstation); Pre-Run-Befehle im Skript vorgegeben (`pnpm install`, Integrity Check, `pnpm lint`, `pnpm vitest run`, `pnpm build`, `pnpm dev`).

## Notizen

- Bekannte Warnung bleibt akzeptiert: Node-Hinweis zu fehlendem `"type": "module"` beim Integrity Check.
- Branch/Commit-Lock im Skript: `feature/station38-alpha-test-script` @ `621e849`.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 39 — Alpha Hardening (Failure Inventory)

## Kontext

- Branch: `feature/station39-alpha-hardening`.
- Ziel: Alpha-Testskript vollständig ausführen (ohne Codeänderungen), Abweichungen in `STATION39_FAILURE_INVENTORY.txt` dokumentieren.

## Ergebnis (kurz)

- Pre-Run-Kommandos ausgeführt; Lint/Build/IntegrityCheck grün, Vitest bricht ab (Worker exited unexpectedly, keine Tests gesammelt).
- Dev-Server musste mit erhöhten Rechten gestartet werden (Port ::1:5173 EPERM im ersten Versuch, zweiter Start per Escalation). UI-Walkthrough vollständig durchgeführt, keine in-app Abweichungen/Console-Warnungen, kleiner Beobachtungspunkt: Finanzen-Liste initial gelegentlich ~1s Ladezeit, aber innerhalb Erwartung.
- Failure Inventory ergänzt (Environment-Hinweise, Vitest-Failure, Dev-Server-Port, alle Modul-Checks als Pass).

## Tests

- `pnpm install` ✅ (Warnung: husky install deprecated; pnpm approve-builds Hinweis)
- `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"` ✅ (bekannte `"type": "module"` Warnung)
- `pnpm lint` ✅
- `pnpm vitest run` ❌ (Worker exited unexpectedly; 6 unhandled errors, keine Tests)
- `pnpm build` ✅
- `pnpm dev` ⚠️ (erstes Mal EPERM ::1:5173; zweiter Start mit Escalation OK, aber Prozess durch Timeout beendet)

## Issues

- Vitest: Worker-exit/Unhandled errors verhindern Testlauf (keine Suites gesammelt).
- Dev-Server: Port 5173 EPERM ohne Escalation; startete nur mit erhöhten Rechten und lief bis Timeout; Browser/DevTools Lauf erfolgte manuell außerhalb des Timers.

## Notizen

- `STATION39_FAILURE_INVENTORY.txt` enthält detaillierte Beobachtungen (Environment + alle Modul-Schritte als Pass). Keine GUI-Anpassungen oder Codeänderungen vorgenommen.

# - - - - - - - - - - - - - - - - - - - -

# Station 40 — NAS Build Preparation (Completed)

## Kontext

- Branch: `feature/station40-nas-deployment` @ commit `0763e90f77a81abc97b245310eca260fd3119db7`.
- Ziel: NAS-Build vorbereiten, Validierungssequenz erneut ausführen, statisches Hosting prüfen.

## Ergebnis (kurz)

- Vollständige Validierungssequenz auf Branch/Commit Lock erneut ausgeführt (siehe Tests); Build frisch erzeugt.
- Manuelle Alpha-Walkthrough-Tests laut Skript: ✅ (keine In-App-Abweichungen, Konsole clean; entspricht Local Alpha V0.1).
- Static-Hosting-Test per `python3 -m http.server 8000` aus `dist/`: ✅ (alle Module/CRUD, Nav/Back/Forward, keine roten Konsolenfehler oder CORS/MIME/404-Hinweise). `file://`-Aufruf von `index.html` erzeugt erwartete CORS-Fehler für CSS/JS (ESM-Standard) und ist kein Blocker für NAS-HTTP-Hosting.
- NAS-Build-Artefakt erstellt: `dist-station40.tar.gz` (untracked) mit SHA256 `5a473e409dffaf662417b33177781d3578a0e5e4e90121f750637dcd0d504dee` aus dem frisch erzeugten `dist/`.

## Tests

- `pnpm install` ✅
- `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"` ✅ (nur bekannte Warning zu fehlendem `"type": "module"`)
- `pnpm lint` ✅
- `pnpm vitest run` ❌ (gleiches Worker-Exit/no-tests-collected-Muster wie Station 39; Umweltproblem, kein Regression)
- `rm -rf dist` → `pnpm build` ✅ (frische hashed Assets in `dist/assets`; Basis für Paket)
- Manuelles Alpha-Skript: ✅
- Static-Hosting-Smoke (lokal, HTTP auf `dist/`): ✅ (siehe Ergebnis)

## Offene Punkte/Risiken

- Vitest-Worker-Exit bleibt ungefixt (Umweltproblem).
- Dev-Server kann Port-EPERM auf ::1:5173 auslösen; bei Bedarf mit Escalation starten (siehe Station 39).
- `file://`-Zugriff auf `dist/index.html` erzeugt erwartete ESM-CORS-Fehler; NAS/HTTP-Hosting nicht betroffen.

## Nächste Schritte / Migration

- Station 41 – NAS Deployment: `dist/` bzw. `dist-station40.tar.gz` nach NAS-Zielpfad laut `NAS_ALPHA_DEPLOY.md` kopieren, statischen Hosting-Smoke-Test durchführen und Ergebnisse loggen.
- Ready for migration zu Station 41.

# - - - - - - - - - - - - - - - - - - - -

# Station 41 — NAS Deployment (Completed)

## Kontext

- Branch: `feature/station41-nas-deployment` @ commit `0763e90f77a81abc97b245310eca260fd3119db7`.
- Ziel: NAS Deployment des Alpha-Builds durchführen und verifizieren.

## Ergebnis (kurz)

- Deployment auf NAS-Pfad `/volume1/web/dogule1-alpha/` abgeschlossen; Struktur top-level `index.html` + `assets/` ohne zusätzliche Verschachtelung.
- Smoke-Test (HTTP) erfolgreich: App lädt vollständig, alle Module (Dashboard, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen, Waren) funktionieren mit Mock-API, CRUD und Back/Forward ok, keine roten Konsolenfehler oder CORS/MIME/404-Warnungen.
- Verhalten identisch zum Station-40-Static-Build.

## Tests

- Deployment-Integrationstest: ✅ (Statische Auslieferung über NAS-HTTP geprüft)
- Hinweise: Favicon 404 erwartet/irrelevant; Mock-DB bleibt nicht persistent (Design).

## Offene Punkte/Risiken

- Vitest-Worker-Exit (Umweltproblem) weiterhin bekannt, nicht blocker für NAS.

## Nächste Schritte

- Station 42 – NAS Smoke Test (formale Abnahme).

# - - - - - - - - - - - - - - - - - - - -

# Station 41.1 — Status Log Restoration & Guardrail

## Kontext

- Branch: `feature/station41.1-status-log-fix`.
- Ziel: Vollständige Stationshistorie in `status.md` wiederherstellen und Guardrail-Instruktion ergänzen, damit keine Stationseinträge mehr überschrieben/entfernt werden.

## Ergebnis (kurz)

- `status.md` aus Commit `d6343be` (Stand Station 38) wiederhergestellt, anschließend Station 39–41 Einträge erneut angefügt.
- Neue READ-ONLY-Instruktion oben ergänzt: alle Stationen müssen erhalten bleiben; bei Trunkierungen ist die Historie vor neuen Einträgen wiederherzustellen (fix dokumentiert für den vorherigen Station-39–41-Overwrite).

## Tests

- Keine Builds/Tests notwendig (Dokumentationsstation).

## Notizen

- Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) bewusst unverändert belassen.

# - - - - - - - - - - - - - - - - - - - -

# Station 42 — NAS Smoke Test

## Kontext

- Branch: `feature/station42-nas-smoketest`.
- Ziel: Formale NAS-Smoketest-Abnahme des statischen Builds (HTTP, keine Codeänderungen), Protokollierung in `NAS_SMOKE_TEST_REPORT.md` und `status.md`.

## Ergebnis (kurz)

- NAS-App über HTTP geladen; alle Module (Dashboard, Kunden, Hunde, Kurse, Trainer, Kommunikation/Placeholder, Kalender, Finanzen, Waren) gerendert ohne Fehler (nur erwartetes `favicon.ico` 404).
- CRUD für Kunden/Hunde/Kurse/Trainer/Finanzen/Waren erfolgreich (Create/Edit/Delete). Kalender Tag/Woche + Event-Linking funktionieren; Back/Forward/Hash stabil.

## Tests

- Manuelle NAS-Smoketests per Browser (HTTP auf NAS-Pfad) ✅
- Keine Build/Lint/Test-Läufe (Validierungsstation, kein Code geändert).

## Issues

- Erwartetes `favicon.ico` 404 im NAS-Serving (als bekannt/benign dokumentiert).

## Notizen

- `NAS_SMOKE_TEST_REPORT.md` ergänzt mit Metadaten/Ergebnissen. Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert belassen.

# - - - - - - - - - - - - - - - - - - - -

# Station 50 — Roadmap Governance & Definitions of Ready

## Kontext

- Branch: `feature/station50-governance`.
- Ziel: Governance und DoR-Artefakte für Stationen 50–70 erstellen (nur Dokumentation, keine Builds/Tests).

## Ergebnis (kurz)

- `DOGULE1_GOVERNANCE.md` angelegt: Stationen 50–70 restated mit Validierung (2025-12-08, gültig), Gating-Regeln, Branch/PR-Governance, Rollen, Änderungsregeln, Blocker-Protokollierung.
- `DOR_PHASES_E_TO_I.md` angelegt: DoR-Templates für Phasen E–I mit Pflichtfeldern (Scope, Dependencies, Risiken/Annahmen, Artefakte, Testbarkeit, Reviewer, Timebox, Boundaries, Exit-Kriterien) und Vorgabe, Risiken/Annahmen in PR + `status.md` zu loggen.

## Tests

- Keine (Dokumentationsstation).

## Notizen

- Keine Codeänderungen. Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert belassen.

# - - - - - - - - - - - - - - - - - - - -

# Station 51 — Storage Baseline V2 Formalization

## Kontext

- Branch: `feature/station51-storage-baseline`.
- Ziel: Speicher-Baseline V2 dokumentieren (Schemas, IDs, PII/Residency, Integrität, Migration).

## Ergebnis (kurz)

- `DOGULE1_SYSTEM_BASELINE_V2.md` angelegt (Schema-Tabellen für alle Module inkl. Kommunikation-Shell, PII/Residency, ID/Version-Policy, Invarianten, Checksums, Concurrency/Atomicity, Failure-Injection, Mock→Real-Mapping, Backup/Scan-Cadence).
- Governance verweist nun auf die Baseline; `modules/shared/api/README.md` hinzugefügt als Pointer für Mock-Daten/Storage-Arbeiten.
- Keine Codeänderungen an Runtime; Migration/Tooling noch ausstehend.

## Tests

- Keine (Dokumentationsstation).

## Notizen

- Migration-/Integrity-Tooling folgt in späteren Schritten; PII/Prefix/Version Defaults sind im Dokument fixiert.

# - - - - - - - - - - - - - - - - - - - -

# Station 52 — Migration & Integrity Tooling Plan (Phase E2)

## Kontext

- Branch: `feature/station52-migration-tooling-plan`.
- PR: https://github.com/christiansamuels932/dogule1/pull/58
- Ziel: Plan für Migration/Integrity-Tooling auf Basis der Storage-Baseline erstellen (keine Implementierung/Storage-Manipulation).

## Ergebnis (kurz)

- `MIGRATION_TOOLING_PLAN.md` angelegt: Scope/Out-of-scope, Engine-Architektur (CLI, Source/Target-Adapter, Mapper, Legacy-ID-Registry, Validation, BatchRunner), ID/Version/Prefix-Regeln, Mapping/Checksum/Integrity-Scanner/Fallback-Strategien, Staging/Cutover/Rollback, Test- und Failure-Injection-Protokoll, Runbook/Reports.
- Plan bindet strikt an `DOGULE1_SYSTEM_BASELINE_V2.md` (Baseline gewinnt bei Konflikt) und nennt Governance-Namenskonflikt (Stations 53–56) als vorgelagerte Governance-Aktion.
- Keine Runtime-Codeänderungen; reine Dokumentation/Planung.

## Tests

- Keine (Dokumentationsstation, keine Codeänderungen).

## Notizen

- Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert belassen. Governance-Update erforderlich, bevor technische Schritte 53–56 umgesetzt werden.
- Governance wurde nach Station 52 angepasst: Stationen 53–56 sind jetzt Migration/Integrity (siehe PR `feature/station52-migration-tooling-plan`); nachgelagerte Stationen wurden entsprechend renummeriert.

# - - - - - - - - - - - - - - - - - - - -

# Station 54 — Storage Adapters & Checksums (Plan, Phase E2b)

## Kontext

- Branch: `feature/station54-storage-adapters-checksums`.
- PR: https://github.com/christiansamuels932/dogule1/pull/60
- Ziel: Implementierungs-Layout für Storage-Adapter und Checksumms festlegen (Candidate-Only), keine Runtime-/Storage-Schreiboperationen.

## Ergebnis (kurz)

- `tools/migration/STATION54_IMPLEMENTATION_PLAN.md` ergänzt: Ziel-Layout `storage_candidate/v1/<module>/data.jsonl` + Checksums, TargetAdapter-API (temp→fsync→rename, abort cleanup), SHA-256-Hashes mit kanonischem JSON, Merkle-Regeln (id-sortiert, Empty-Root = SHA-256("")), CLI-Migrate-Flags/Defaults, read-only Registry-Nutzung (Proposals nur in registry_candidate), Report-Pfade deterministisch, Validierungs-Scope = Schema-only (FK/Invariant/PII in 55), Safety-Guidelines (nur Candidate-Root).
- `.gitignore` erweitert um `storage_candidate/` (Candidate-Ausgaben werden nicht eingecheckt).

## Tests

- Keine (Dokumentationsstation, keine Codeänderungen).

## Notizen

- Station 53 (dry-run) muss landen, bevor 54 Schreibpfade nutzt; 54 bleibt candidate-only/offline. Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert.

# - - - - - - - - - - - - - - - - - - - -

# Station 55 — Integrity Scanner & CI Integration (Phase E2c)

## Kontext

- Branch: `feature/station55-integrity-scanner-plan`.
- PR: https://github.com/christiansamuels932/dogule1/pull/61
- Ziel: Read-only Integrity-Scanner + CLI-Befehle (scan-all/module/pii/drift/verify-checksums) für Candidate-Storage, CI-ready; keine Migration-Writes oder Registry-Mutationen.

## Ergebnis (kurz)

- CLI erweitert um Scan-Kommandos (schema/FK/invariants/PII/drift + separate verify-checksums) mit deterministischen Reports (`storage_reports/latest-scan/`); Exit-Regel: BLOCKER → exit 1, sonst 0.
- Validatoren implementiert: Schema (schemaVersion=1, version vorhanden), FK-Auflösung gegen Candidate-Daten, Invarianten (Zeitspanne, capacity>=bookedCount, non-negative price/betrag, Kurs/Trainer-Erfordernisse), Checksums (SHA-256 + Merkle, empty-root = SHA-256("")), Schema-Drift, PII-Leak-Check (kein PII in Checksums/Reports).
- Registry bleibt read-only; keine Runtime-/Mock-DB-Schreibzugriffe; Reports gitignored.

## Tests

- `pnpm exec eslint tools/migration` ✅
- Scan-Läufe nicht ausgeführt (Tooling-Implementierung ohne Ausführung).

## Notizen

- Läufe sollen auf `storage_candidate/v1` erfolgen; CI-Jobs folgen in dieser Station. Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert.

# - - - - - - - - - - - - - - - - - - - -

# Station 53–55 — Migration Tooling Execution (Dry-Run, Migrate, Scan)

## Kontext

- Branch: `53-55-Code`
- Ziel: Station-53–55 Tooling tatsächlich ausführen/härten (Dry-Run + Migrate + Scan) mit deterministischen Outputs, Atomik via Temp-Root→Rename, Checksum/Merkle, Registry-gestützte FK-Rewrites.
- Registry: synthetische Platzhalter (`migration/mapping/*.json`) erstellt für alle Module; finale UUID-Zuweisungen müssen noch planerisch bestätigt/ersetzt werden.

## Ergebnis (kurz)

- `migrate.js` implementiert: liest Mock-DB, wendet Registry auf IDs/FKs an, erzwingt `schemaVersion=1`/`version=0`, schreibt Kandidat nur unter `storage_candidate/v1` via temp-root + atomic rename, erzeugt Entity-Checksums + Merkle (`checksums/entities.jsonl`, `merkle.json`) und deterministisches `checksums/run.json` (`runId`, `generatedAt` fix).
- CLI erweitert (`node tools/migration/cli.js migrate`), Dry-Run/Scan bleiben bestehen; Scan toleriert leere Registry nur bei leeren Modulen.
- Determinismus belegt: zwei `migrate` Läufe mit identischem `MIGRATE_RUN_ID=run-1` erzeugen byte-identische Trees (`diff -r` leer).
- Rollback-Drill: `MIGRATE_FAIL_AFTER_MODULE=kurse` → erwarteter Abbruch, Temp-Root wird entfernt, bestehender Kandidat bleibt unverändert.
- Kandidat + Checksums aktuell unter `storage_candidate/v1`; `run.json` nutzt `generatedAt: "00000000T000000Z"`.
- Mappings abgeleitet aus Mock-DB (Option A = Mock als Legacy): `migration/mapping/*.json` jetzt deterministisch aus Mock-IDs → uuidv7 (per Hash-Seeding).

## Tests

- `node tools/migration/cli.js dry-run` ✅ (0 BLOCKER)
- `node tools/migration/cli.js migrate` ✅ (kandidat geschrieben, checksums/merkle)
- `node tools/migration/cli.js scan-all` ✅ (0 BLOCKER/WARNING)
- Determinismus: zwei Läufe (`MIGRATE_RUN_ID=run-1`) + `diff -r storage_candidate/v1_run1 storage_candidate/v1_run2` → keine Unterschiede
- Rollback-Injection: `MIGRATE_FAIL_AFTER_MODULE=kurse MIGRATE_RUN_ID=fail-test node tools/migration/cli.js migrate` ❌ erwartet; Temp-Verzeichnis bereinigt
- `pnpm lint` ✅ (nach Ignore-Erweiterung für build/output/reports)

## Issues

- UUID-Mappings leiten sich deterministisch aus Mock-IDs ab; falls echte Legacy-Daten auftauchen, müssen sie ersetzt werden.
- Fsync-Pfad (temp→fsync→rename) fehlt noch; aktuell rename-atomik ohne fsync.
- Vitest nicht erneut ausgeführt (vorbekanntes Worker-Exit-Problem bleibt offen).
- Node-Warnung zu fehlendem `"type": "module"` weiter vorhanden (bewusst unverändert).

## Notizen

- Kandidat-/Report-Pfade gitignored (`storage_candidate/`, `storage_reports/`).
- CUTOVER-Playbook/Station-56-Report noch zu schreiben; wird in Station 56 erwartet.

# - - - - - - - - - - - - - - - - - - - -

# 53-55-Code — Migration Tooling Execution & Remediation (Guardrail)

## Kontext

- Branch: `53-55-Code`.
- Hintergrund: Stationen 53–55 waren zuvor nur geplant, nicht ausgeführt; dieser Eintrag dokumentiert die nachgeholte Ausführung/Härtung. Guardrail: Keine künftige Station darf als erledigt gelten, ohne tatsächliche Ausführung + Status-Log.
- Legacy-Quelle: Option A (Mock-DB als Legacy). Mappings deterministisch aus Mock-IDs abgeleitet.

## Ergebnis (kurz)

- Mappings generiert via `tools/migration/generateMappings.js`: Mock-ID → uuidv7 (hash-seeded), abgelegt unter `migration/mapping/*.json`.
- `migrate` gehärtet: Temp-Root + fsync auf Dateien/Verzeichnisse vor Rename; schreibt Kandidat nur nach `storage_candidate/v1`, erzeugt Checksums/Merkle + deterministisches `run.json` (`generatedAt` fixiert).
- Pipeline ausgeführt: `dry-run` → `migrate` → `scan-all` mit 0 BLOCKER/WARNING; Kandidat + Checksums aktuell unter `storage_candidate/v1`.
- Determinismus bereits validiert (identische Outputs bei gleichem `MIGRATE_RUN_ID`); Rollback-Drill via `MIGRATE_FAIL_AFTER_MODULE` bereinigt Temp-Root wie erwartet.
- Docs/Templates ergänzt: `CUTOVER_PLAYBOOK.md`, `STATION56_REHEARSAL_REPORT.md`.
- Qualität: `pnpm lint` ✅, `pnpm vitest run` ✅.

## Tests

- `node tools/migration/cli.js dry-run` ✅
- `node tools/migration/cli.js migrate` ✅
- `node tools/migration/cli.js scan-all` ✅
- `pnpm vitest run` ✅
- `pnpm lint` ✅

## Issues

- Mappings basieren auf Mock-IDs; bei echter Legacy-Datenquelle müssen sie ersetzt + Pipeline erneut ausgeführt werden.
- Bekannte Warnung beibehalten: Node-Hinweis zu fehlendem `"type": "module"` in package.json.
- Untracked Artefakte unverändert: `dist-station40.tar.gz`, `dogule1-alpha/`.

## Notizen

- Guardrail: Ausführung + Status-Log sind Pflicht vor Abschluss eines Stationslogs.
- Bei Eintreffen echter Daten: neue Mappings generieren, `migrate` + `scan-all` erneut laufen lassen und Hashes protokollieren.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 56 — Migration Rehearsal & Cutover Prep (E2d)

## Kontext

- Branch: `53-55-Code`.
- Ziel: End-to-end Rehearsal der Station-53–55 Toolchain (dry-run → migrate → scan, Checksums/Merkle, FK/Invariant/PII), Determinismusbeweis, Rollback-Drill, Playbook-Aktualisierung.
- Inputs: Mock-DB (`modules/shared/api/db/index.js`) + Registries (`migration/mapping/*.json`) fixiert; Candidate-Root `storage_candidate/v1/`; `MIGRATE_RUN_ID=run-local`.

## Ergebnis (kurz)

- Rehearsal auf sauberem Workspace ausgeführt: `dry-run` → `migrate` → `scan-all` → 0 BLOCKER/WARNING; Candidate + Reports unter `storage_candidate/v1` und `storage_reports/latest-*`.
- Determinismus bestätigt: Candidate gelöscht, erneut `dry-run`/`migrate`/`scan-all`, `diff -r storage_candidate/v1-run1 storage_candidate/v1` leer (byte-identisch).
- Rollback-Drill: `MIGRATE_FAIL_AFTER_MODULE=kurse node tools/migration/cli.js migrate` bricht wie erwartet ab, Temp-Root entfernt, kein `storage_candidate/v1` hinterlassen; anschließender Clean-Run wieder grün.
- Hashes dokumentiert (`run.json`): kunden `e4237d40…317d`, hunde `66740e0d…511`, kurse `85c4ff57…8dd`, trainer `5a797283…437`, kalender `40035969…ef2`, finanzen `b2797674…1aa`, waren `297c6599…7b0`, kommunikation `e3b0c442…b855`.
- `CUTOVER_PLAYBOOK.md` und `STATION56_REHEARSAL_REPORT.md` auf Station-56-Rehearsal-Stand aktualisiert (Determinismus- und Rollback-Schritte aufgenommen).

## Tests

- `node tools/migration/cli.js dry-run` ✅
- `node tools/migration/cli.js migrate` ✅ (run-local)
- `node tools/migration/cli.js scan-all` ✅
- `diff -r storage_candidate/v1-run1 storage_candidate/v1` ✅ (Determinismus)
- `MIGRATE_FAIL_AFTER_MODULE=kurse node tools/migration/cli.js migrate` ❌ erwartet (Rollback-Drill; hinterließ kein `storage_candidate/v1`)

## Notizen

- Artefakte gitignored: `storage_candidate/v1/`, `storage_reports/latest-*`.
- Bekannte Warnung unverändert akzeptiert: Node-Hinweis zu fehlendem `"type": "module"` in package.json.
- Registries weiter Platzhalter aus Mock-IDs; echte UUID-Freigabe vor realem Cutover notwendig.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 61 — Legacy Data Capture

## Kontext

- Branch: `feature/station61-legacy-capture`.
- Scope: Station 61 forensic capture of DogTabs legacy data; freeze raw inputs only (no parsing/mapping/cleanup).

## Ergebnis (kurz)

- Raw DogTabs payload copied byte-for-byte into `migration/legacy/station61/capture_20251219_185854Z` (capturedAt 2025-12-19T18:58:54Z UTC) with `raw/`, `README.md`, `manifest.json`, and `checksums.sha256`.
- Checksums cover all files except the checksum file itself; manifest lists size/hash per raw file; capture naming follows `capture_YYYYMMDD_HHMMSSZ`.
- CI guard `tools/ci/legacyStation61Guard.js` added and wired into the lint workflow (fetch-depth 0) to forbid modifications to existing `capture_*` directories; guard run locally using env-fed git status output (Node child_process blocked here) → pass.
- Legacy data remains unfiltered/unsorted; reserved for later mapping/cleanup stations.

## Tests

- `node tools/ci/legacyStation61Guard.js` with env-provided git status output ✅ (pnpm unavailable locally)

## Notizen

- Dogtaps raw payload parked in `migration/legacy/station61/capture_20251219_185854Z/raw/`; folder is gitignored and only stored for reference (no processing / no per-file listing here).

- Repo-doc gap: `agents.md` remains missing; Station 61 directory is input-only/immutable after commit.

# - - - - - - - - - - - - - - - - - - - -
