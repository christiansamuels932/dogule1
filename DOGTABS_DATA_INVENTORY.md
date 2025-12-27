# DogTabs Data Inventory (Station 73)

## Source location

- Root: `migration/legacy/station61/capture_20251219_185854Z/raw/`
- Capture metadata: `migration/legacy/station61/capture_20251219_185854Z/manifest.json`

## Summary

- Total files: 165
- Total size: 34,696,485 bytes (~33.1 MiB)
- Top-level contents:
  - `dogtaps_00a_Export_Dateien/` (472K)
  - `dogtaps_80_Datenbank_Save/` (13M)
  - `dogtaps_90_Datenbank/` (21M)
  - `Kursbestätigung.pdf` (312K)

## File types (count)

- xlsx: 150
- xls: 5
- txt: 3
- pdf: 1
- jpg: 1
- ico: 1
- laccdb: 1
- bak: 1
- org: 1
- directory metadata: 1 (`.directory`)

## Directory inventory

### `dogtaps_90_Datenbank/`

- Purpose (per ReadMe): production backend database.
- Files:
  - `delete dogtaps_Datenbank.accdr.ORG` (Access runtime database, .ORG suffix)
  - `delete dogtaps_Datenbank.bak` (backup)
  - `dogtaps_Datenbank.laccdb` (Access lock file)
  - `dogtaps_Signet_Anwendung.ico` (app icon)
  - `ReadMe.txt`
- Notes:
  - Access DB is likely the authoritative schema and data source.
  - `.laccdb` is a transient lock file, not a data source.

### `dogtaps_80_Datenbank_Save/`

- Purpose (per ReadMe): periodic saves of the production database.
- Files: 150 xlsx snapshots, dated 2025-11-09 through 2025-12-09.
- Snapshot sets (30 each):
  - `Save_Daten_Kunden_*.xlsx`
  - `Save_Daten_Hunde_*.xlsx`
  - `Save_Daten_Seminare_*.xlsx`
  - `Save_Daten_Rechnungen_*.xlsx`
  - `Save_Daten_Pension_*.xlsx`
- Sample row counts from latest snapshot (2025-12-09):
  - Kunden: 1,413 rows (row 1 empty, data starts row 2)
  - Hunde: 1,525 rows (row 1 empty)
  - Seminare: 1,983 rows (row 1 empty)
  - Rechnungen: 12 rows (row 1 empty)
  - Pension: 16 rows (row 1 empty)
- Notes:
  - XLSX files appear numeric-only with no header row or shared strings.
  - Column names are not embedded; schema must be recovered from Access DB.

### `dogtaps_00a_Export_Dateien/`

- Purpose (per ReadMe): exports from DogTabs.
- Files:
  - `dogtaps_Kundenselektion_Email_2011-12-16_16-08.xls`
  - `dogtaps_Kundenselektion_Email_2024-02-09_17-14.xls`
  - `Fontanas DogWorld_Praxis_2011-08-10_15-16.xls`
  - `Kundenliste_2017-01-23 21-47.xls`
  - `Kundenliste_2017-01-31 22-45.xls`
  - `Natel 092.JPG`
  - `ReadMe.txt`
- Notes:
  - These exports are likely supplementary (older customer/email lists).

### `Kursbestätigung.pdf`

- Course confirmation PDF template (likely for customer-facing documents).

## PII and residency considerations

- Likely PII: customer names, addresses, phone numbers, email addresses, dog details, invoices.
- Access DB is assumed to contain full PII; exports include customer selections and lists.
- Residency handling must follow Dogule1 baseline policy (see `DOGULE1_SYSTEM_BASELINE_V2.md`).

## Open questions / blockers

- Access DB schema (tables, columns, relationships) must be extracted to define mappings.
- XLSX snapshots lack headers, so column meanings must be derived from Access DB or DogTabs metadata.
- Confirm whether Pension data maps to an existing Dogule1 module or requires a new domain entity.
