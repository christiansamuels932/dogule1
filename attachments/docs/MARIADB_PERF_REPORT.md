# MariaDB Performance Report — Station 76

## Thresholds (authoritative baseline)

Scope: worst-case on full dataset (~1500 Kunden), warm cache baseline, local MariaDB over socket.

DB query thresholds (p95):

- Kunden list (paged, filter+sort): <= 120 ms
- Kunde detail (incl. Hunde join): <= 80 ms
- Hunde by Kunde: <= 60 ms
- Kurse by Trainer: <= 60 ms
- Any auxiliary lookup (picklists/status): <= 20 ms
- Full table scans on core entities: 0 allowed (unless explicitly justified)

API thresholds (p95, backend only):

- List endpoints: <= 180 ms
- Detail endpoints: <= 120 ms

UI thresholds (manual sanity):

- First contentful render after navigation: <= 300 ms
- No visible multi-step loading caused by per-row fetches (N+1 = fail)

Rules:

- Measure with exact SQL used by adapters.
- Record warm vs cold cache once; baseline is warm.
- Any breach requires EXPLAIN + remediation.

## Adapter SQL inventory and EXPLAIN targets

Source: `modules/shared/storage/mariadbAdapter.js`

Kunden list (API `GET /api/kunden`):

- SQL: `SELECT * FROM kunden ORDER BY id`
- EXPLAIN target: list scan ordered by PK (verify index usage, avoid full table scan).

Kunde detail (API `GET /api/kunden/:id`):

- SQL: `SELECT * FROM kunden WHERE id = ?`
- EXPLAIN target: PK lookup by `id`.

Hunde list (API `GET /api/hunde`):

- SQL: `SELECT * FROM hunde ORDER BY id`
- EXPLAIN target: list scan ordered by PK (verify index usage, avoid full table scan).

Hunde detail (API `GET /api/hunde/:id`):

- SQL: `SELECT * FROM hunde WHERE id = ?`
- EXPLAIN target: PK lookup by `id`.

Trainer list (API `GET /api/trainer`):

- SQL: `SELECT * FROM trainer ORDER BY id`
- EXPLAIN target: list scan ordered by PK.

Trainer detail (API `GET /api/trainer/:id`):

- SQL: `SELECT * FROM trainer WHERE id = ?`
- EXPLAIN target: PK lookup by `id`.

Kurse list (API `GET /api/kurse`):

- SQL: `SELECT * FROM kurse ORDER BY id`
- EXPLAIN target: list scan ordered by PK.

Kurs detail (API `GET /api/kurse/:id`):

- SQL: `SELECT * FROM kurse WHERE id = ?`
- EXPLAIN target: PK lookup by `id`.

Kalender list (API `GET /api/kalender`):

- SQL: `SELECT * FROM kalender ORDER BY id`
- EXPLAIN target: list scan ordered by PK.

Kalender detail (API `GET /api/kalender/:id`):

- SQL: `SELECT * FROM kalender WHERE id = ?`
- EXPLAIN target: PK lookup by `id`.

Finanzen list (API `GET /api/finanzen`):

- SQL: `SELECT * FROM zahlungen ORDER BY id`
- EXPLAIN target: list scan ordered by PK.

Finanzen detail (API `GET /api/finanzen/:id`):

- SQL: `SELECT * FROM zahlungen WHERE id = ?`
- EXPLAIN target: PK lookup by `id`.

Waren list (API `GET /api/waren`):

- SQL: `SELECT * FROM waren ORDER BY id`
- EXPLAIN target: list scan ordered by PK.

Waren detail (API `GET /api/waren/:id`):

- SQL: `SELECT * FROM waren WHERE id = ?`
- EXPLAIN target: PK lookup by `id`.

Flow-specific usage notes (for Station 76 critical paths):

- Kunden list uses `SELECT * FROM kunden ORDER BY id`; filtering/sorting happens in UI.
- Kunde detail includes Hunde via `SELECT * FROM hunde ORDER BY id` then in-app filter `hunde.kundenId === kunde.id`.
- Hunde by Kunde is the same list query + in-app filter.
- Kurse by Trainer is `SELECT * FROM kurse ORDER BY id` then in-app filter `kurs.trainerId === trainer.id`.
- Auxiliary picklists/status are UI constants; no DB queries.

## Environment & dataset

- MariaDB socket: `/run/mysqld/mysqld.sock`
- Database: `dogule1`
- Dataset counts: kunden=1412, hunde=386, trainer=1, kurse=14, kalender=0, zahlungen=0, waren=0
- Profiling method: `SHOW PROFILES` with 1 cold + 5 warm runs per query (profiling history limit); warm p95 is the baseline.

## EXPLAIN results (representative)

Columns: type, key, rows, extra.

| Query            | type  | key     | rows | extra                                               |
| ---------------- | ----- | ------- | ---- | --------------------------------------------------- |
| kunden_list      | index | PRIMARY | 1392 |                                                     |
| kunden_detail    | const | PRIMARY | 1    |                                                     |
| hunde_list       | index | PRIMARY | 386  |                                                     |
| hunde_detail     | const | PRIMARY | 1    |                                                     |
| trainer_list     | index | PRIMARY | 1    |                                                     |
| trainer_detail   | const | PRIMARY | 1    |                                                     |
| kurse_list       | index | PRIMARY | 14   |                                                     |
| kurse_detail     | const | PRIMARY | 1    |                                                     |
| kalender_list    | index | PRIMARY | 1    |                                                     |
| kalender_detail  | NULL  | NULL    | NULL | Impossible WHERE noticed after reading const tables |
| zahlungen_list   | index | PRIMARY | 1    |                                                     |
| zahlungen_detail | NULL  | NULL    | NULL | Impossible WHERE noticed after reading const tables |
| waren_list       | index | PRIMARY | 1    |                                                     |
| waren_detail     | NULL  | NULL    | NULL | Impossible WHERE noticed after reading const tables |

Notes:

- Detail EXPLAIN for kalender/zahlungen/waren reflects empty tables, so MariaDB reports “Impossible WHERE”.
- List queries use `type=index` (full index scan over PK). No `type=ALL` observed.

## Timed executions (ms)

Warm p95 is the baseline; cold is a single first run for cache contrast.

| Query            | Cold (ms) | Warm p95 (ms) | Target (ms) |
| ---------------- | --------- | ------------- | ----------- |
| kunden_list      | 1.066     | 1.006         | 120         |
| kunden_detail    | 0.136     | 0.105         | 80          |
| hunde_list       | 0.471     | 0.386         | 60          |
| hunde_detail     | 0.153     | 0.048         | —           |
| trainer_list     | 0.141     | 0.045         | —           |
| trainer_detail   | 0.122     | 0.039         | —           |
| kurse_list       | 0.149     | 0.063         | 60          |
| kurse_detail     | 0.143     | 0.047         | —           |
| kalender_list    | 0.114     | 0.036         | —           |
| kalender_detail  | 0.117     | 0.042         | —           |
| zahlungen_list   | 0.116     | 0.035         | —           |
| zahlungen_detail | 0.117     | 0.036         | —           |
| waren_list       | 0.113     | 0.035         | —           |
| waren_detail     | 0.116     | 0.034         | —           |

## Kurse write-ingestion (Station 76 targeted)

- Source: `$_seminarstamm` (catalog items only; `$_seminardaten` ignored for Kurse).
- Ingest mode: `node tools/dogtabs/cli.js ingest --modules=kurse` (trainer dependency auto-included).
- Result: 1 trainer + 14 kurse inserted (see `storage_reports/latest-dogtabs-ingest/report.json`).
- Status mapping: `seminar_aufgeloest` -> `deaktiviert`, else `aktiv`.
- Flags: `inventory_flag=1`, `portfolio_flag=0`.

## Step 4 — Remediation Decision

No changes required.

Rationale:

- All measured p95 timings are far below the locked Station 76 thresholds on the full current dataset (kunden=1412, hunde=386).
- EXPLAIN shows `type=index` for list queries, which is a primary-key index scan (not `type=ALL`).
- With the explicitly bounded dataset size in Beta readiness (~1500 Kunden) and observed sub-millisecond timings, PK index scans are acceptable and do not violate Station 76.
- Detail queries use `const` access paths where applicable.
- No N+1 patterns observed at the SQL layer.

Explicit non-actions:

- No pagination, LIMIT, or DB-side filtering refactors in this station.
- No index changes in `tools/mariadb/schema.sql`.
- No adapter query shape changes.

## Deferred Validation

Kalender, Zahlungen, Waren tables are currently empty; performance baselines for these entities are non-representative and must be revalidated once data exists.

## Station 76 tech-debt note

Kurse catalog items use empty strings for `date`, `start_time`, and `end_time` (schema enforces NOT NULL). This is acceptable for Station 76 and avoids fake dates (e.g., `1900-01-01`). In a later station, the schema should either allow NULLs or separate dated instances from catalog items.

## Step 5 — UI N+1 Sanity Check

Manual UI navigation (completed):

- Kunden list -> Kunde detail -> Hunde list
- No visible multi-step loading; no per-row fetch delays observed.

Notes for follow-up:

- Kunde Übersicht: add "Hund verlinkt" column for sorting by linked Hunde.

Post-fix UI check pending:

- Kunde detail -> Hunde list to confirm geburtsdatum + Herkunft render correctly.

## Step 6 — Report Finalization

Environment details and baselines recorded; Station 76 is ready for closure.

## Hunde data fidelity fix (Station 76 follow-up)

- Mapping: `hund_tiergruppe` now resolves via `$_codes_tiergruppen` so `herkunft` stores labels (e.g., `Hund`) instead of numeric codes.
- Date parsing: DogTabs US-style dates (`MM/DD/YY`) are normalized to ISO (`YYYY-MM-DD`) for `geburtsdatum`.
- Corrective update: `node tools/dogtabs/updateHundeFields.js` applied to existing rows (386 updates) using `code=DT-<legacyId>`.
