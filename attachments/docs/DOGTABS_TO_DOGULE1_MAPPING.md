# DogTabs to Dogule1 Mapping Plan (Station 73)

This document defines the mapping strategy from DogTabs legacy data to the Dogule1 schema. It is a planning artifact; field-level mappings are informed by the Access DB schema extraction.

## Source of truth

- Primary: Access database in `migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/`.
- Secondary: XLSX snapshots in `dogtaps_80_Datenbank_Save/` (use latest date for canonical row counts and QA checks).
- Supplementary: older exports in `dogtaps_00a_Export_Dateien/` for cross-checking email/phone data.

## Access DB schema extraction (results)

Schema was extracted with `mdb-schema` from `delete dogtaps_Datenbank.accdr.ORG`. Notable tables:

- Customers: `$_kundenstamm`
- Dogs: `$_kunden_hunde`
- Course catalog: `$_seminarstamm`
- Course instances: `$_seminardaten`
- Course enrollment: `$_kunden_seminare`
- Invoices: `$_rechnung_kopf`, `$_rechnung_detail`
- Pension/rooms: `$_kunden_zimmer`
- Payments: `$_kunden_zahlungsangaben`
- Company data: `$_kunden_firma_angaben`
- Calendar/Outlook mirror: `$_termin_OlAppoints`

Schema files captured outside the repo in `/tmp/dogtaps_schema.sql`.

Column headers (via `mdb-export`):

`$_kundenstamm`

```
kundennummer,name,vorname,adr_zusatz1,adr_zusatz2,adr_strasse,adr_plz,adr_ort,adr_land,anrede,geburtsdatum,heimatort,telefon_privat,telefon_geschaeft,telefon_natel,sprache,status,kundentyp,kundenkategorie,kd_rabatt_proz,kd_rabatt_seminare,bemerkung,email_news_nein,email,www_adresse,kontaktperson,skn_ausbildner,person_bild,markiert,erf_dat,erf_userid,mut_dat,mut_userid,end_dat,end_userid,P,TK,D,URS,ND,S1,S2,S3,S4,A,HF,TB,Z,kd_unterlagen_per_email,kd_extern_erfasst_status,kd_titel,kd_gewerbekunde,kd_steuerfrei,kd_ust_nr,kd_rabatt_hp_proz
```

`$_kunden_hunde`

```
hund_nummer,hund_kundennummer,hund_name,hund_rasse,hund_gebdatum,hund_geschlecht,hund_kastriert_ja,hund_kastriert_nein,hund_chipnummer,hund_ferien,hund_bemerkung,hund_bild,erf_dat,erf_userid,mut_dat,mut_userid,end_dat,end_userid,hund_gewicht,hund_farbe,hund_kastriert_wann,hund_kontaktperson,hund_tierarzt,hund_impfdatum_standard,hund_impfdatum_standard_ja,hund_impfdatum_spez,hund_impfdatum_spez_ja,hund_schutz_ja,hund_biss_ja,hund_problemhund_ja,hund_merkmale,hund_fuetterung,hund_krankheiten,hund_medikamente,hund_history,hund_rufname,hund_klasse,hund_fell,hund_hormonchip_dat,hund_hormonchip_ja,hund_hinweis_intern,hund_kontakt_mit,hund_wurf_zuordnung,hund_tiergruppe,hund_hormonchip_ablauf_mm,hund_groesse_klasse,hund_wurf_zuchtbuchnr,hund_hp_ohne_verrechnung
```

`$_seminardaten`

```
seminardat_nummer,seminardat_mandant,seminardat_seminar_id,seminardat_aufgeloest,seminardat_stamm_id,seminardat_datvon,seminardat_datbis,seminardat_dauer,seminardat_thema,seminardat_ressourcen,seminardat_leitung,seminardat_referenten,seminardat_grundpreis_aktiv,seminardat_grundpreis_passiv,seminardat_programm_nein,seminardat_bemerkung,seminardat_druck_inhalt,seminardat_druck_brieftyp,seminardat_skn_kurs_theorie,seminardat_skn_kurs_praxis,seminardat_skn_extern,seminardat_skn_ausbildner,seminardat_anz_lektionen,seminardat_rabatt_mit,seminardat_rabatt_proz,seminardat_mwst,seminardat_kursort,erf_dat,erf_userid,mut_dat,mut_userid,end_dat,end_userid,seminardat_druck_bestaetigungen,seminardat_kursinhalt,seminardat_anz_teilrechnungen,seminardat_periode_re,seminardat_dauerbetrag_individuell,seminardat_dauer_re_jahresuebergreifend,seminardat_dauer_versandprodukt,seminardat_dauer_versandperiode,seminardat_maxpers_aktiv,seminardat_maxpers_passiv,seminardat_steuerfrei,seminardat_tz_anzahl_betrag,seminardat_tz_anzahl_faellig_datum,seminardat_tz_first_rate_faellig_datum,seminardat_history,seminardat_faellig_tage,seminardat_gegenkonto,seminardat_kursinhalt_rechts,seminardat_skn_ausbildner_name,seminardat_skn_ausbildner_vorname,seminardat_skn_ausbildner_bvet_nr,seminardat_hund_obligatorisch,seminardat_skn_ausbildner_huv_nr,seminardat_huv_welpen,seminardat_huv_junghund,seminardat_huv_erziehung,seminardat_firmnr
```

`$_rechnung_kopf`

```
rek_rechnr,rek_mandant,rek_datum,rek_kundennummer,rek_art,rek_typ,rek_status,rek_zahlungsart,rek_betr_tot_brutto,rek_betr_tot_mwst,rek_betr_tot_rabatt,rek_betr_tot_netto,rek_rabatt_proz,rek_betr_tot_bezahlt,rek_betr_tot_bezahlt_datum,rek_bemerkung,rek_rechnung_verbucht,rek_mahn_datum,rek_mahn_status,rek_drucksteuerung,rek_zahleingang_konto,rek_beilage_ja_1,rek_beilage_txt_1,rek_beilage_ja_2,rek_beilage_txt_2,rek_beilage_ja_3,rek_beilage_txt_3,rek_beilage_ja_4,rek_beilage_txt_4,rek_history,rek_re_anrede,rek_re_name_vorname,rek_re_adr_zusatz1,rek_re_adr_zusatz2,rek_re_adr_strasse,rek_re_adr_plz,rek_re_adr_ort,rek_re_adr_land,rek_lief_anrede,rek_lief_name_vorname,rek_lief_adr_zusatz1,rek_lief_adr_zusatz2,rek_lief_adr_strasse,rek_lief_adr_plz,rek_lief_adr_ort,rek_lief_adr_land,rek_anz_lektionen,erf_dat,erf_userid,mut_dat,mut_userid,end_dat,end_userid,rek_periode_re,rek_mit_teilrechnungen,rek_faellig_datum,rek_dauer_re_jahresuebergreifend,rek_gewerbekunde,rek_steuerfrei,rek_periode_von,rek_periode_bis,rek_buchung_intern,rek_betr_skonto,rek_betr_skonto_art,rek_betr_skonto_proz,rek_status_fremdsprache,rek_betr_zahlung_konto_1,rek_betr_zahlung_datum_1,rek_betr_zahlung_1,rek_betr_zahlung_konto_2,rek_betr_zahlung_datum_2,rek_betr_zahlung_2,rek_betr_zahlung_konto_3,rek_betr_zahlung_datum_3,rek_betr_zahlung_3,rek_betr_skonto_letztZahlKto,rek_betr_skonto_datum
```

## ID strategy

- Legacy IDs are preserved in a registry and mapped to new UUIDv7 values.
- Registry format aligns with `migration/mapping/*.json` (id -> uuid + metadata).
- Foreign keys are resolved via the registry; missing FK entries are blockers.

## Mapping overview

### Kunden (DogTabs Kunden) -> Dogule1 Kunden

- Target module: `kunden`
- Source table: `$_kundenstamm`
- Required fields (Dogule1 baseline + Station 74 expansion):
  - `id` (UUIDv7; from legacy mapping)
  - `legacyId` (DogTabs customer id; keep for traceability)
  - `name`, `vorname`
  - `adresse` (street, postal code, city)
  - `telefon`, `email`
  - `status` (aktiv/passiv/deaktiviert)
  - `ausweisId`
  - `fotoRef` (path or reference; no binary data in DB)
  - `notizen`
  - `begleitpersonen` (name/vorname + linked dog references)
- Mapping rules:
  - Trim whitespace and normalize casing.
  - Normalize phone numbers to digits + country code where possible.
  - Emails lowercased; invalid emails flagged for review.
  - Address normalization (separate street/postal/city if combined).
  - Map `kundennummer` -> `legacyId`.
  - Map `adr_strasse`, `adr_plz`, `adr_ort`, `adr_land` -> address fields.
  - Map `telefon_privat`, `telefon_geschaeft`, `telefon_natel` -> phone fields (store primary + extras).
  - Map `email`, `www_adresse`, `bemerkung` -> contact + notes.
  - Map `status` -> Dogule1 status (normalize to aktiv/passiv/deaktiviert).

### Hunde (DogTabs Hunde) -> Dogule1 Hunde

- Target module: `hunde`
- Source table: `$_kunden_hunde`
- Required fields:
  - `id` (UUIDv7)
  - `legacyId`
  - `kundeId` (FK to Kunden)
  - `name`
  - `rasse` (picklist mapping)
  - `geburtsdatum` (ISO date)
  - `felltyp`, `kastriert`, `fellfarbe`, `groesseTyp`, `herkunft`
  - `chipNummer`
  - `geschlecht`
  - `notizen`
- Mapping rules:
  - Map legacy breed labels into Dogule1 picklist; unknown -> `Sonstige` or flagged.
  - Boolean fields normalized to true/false; unknown stays null.
  - Missing `kundeId` is a blocker.
  - Map `hund_nummer` -> `legacyId`.
  - Map `hund_kundennummer` -> `kundeId` (FK).
  - Map `hund_name`, `hund_rasse`, `hund_gebdatum`, `hund_geschlecht`, `hund_chipnummer`.
  - Map `hund_farbe`, `hund_fell`, `hund_groesse_klasse`, `hund_klasse` -> color/fell/size/class fields.
  - `hund_kastriert_ja`/`hund_kastriert_nein` -> `kastriert` (resolve conflicts).
  - `hund_bemerkung`, `hund_merkmale`, `hund_history` -> notes.

### Seminare (DogTabs Seminare) -> Dogule1 Kurse

- Target module: `kurse`
- Source tables: `$_seminarstamm`, `$_seminardaten`
- Required fields:
  - `id` (UUIDv7)
  - `legacyId`
  - `titel` / `beschreibung`
  - `createdAt` (required)
  - `startAt`, `endAt`
  - `trainerId` (FK)
  - `capacity`, `bookedCount`
  - `location`
  - `outlookMirror` fields (if present in legacy or populated later)
- Mapping rules:
  - Seminar records map 1:1 to Kurse.
  - If no trainer reference exists, set null and flag for review.
  - Duration inferred when only one timestamp exists (flag if ambiguous).
  - Map `seminar_id`/`seminardat_nummer` -> `legacyId` (separate for catalog vs instance).
  - Use `seminar_bezeichnung`, `seminardat_thema`, `seminardat_programm` fields for title/description.
  - Map `seminardat_datvon`/`seminardat_datbis` -> start/end.
  - Map `seminardat_maxpers_*` and `seminardat_grundpreis_*` -> capacity/pricing.

### Rechnungen (DogTabs Rechnungen) -> Dogule1 Finanzen

- Target module: `finanzen`
- Source tables: `$_rechnung_kopf`, `$_rechnung_detail`
- Required fields (planned):
  - `id` (UUIDv7)
  - `legacyId`
  - `kundeId` (FK)
  - `betrag`, `waehrung`
  - `status` (offen/bezahlt/ueberfaellig)
  - `faelligAm`, `bezahltAm`
  - `referenz` (invoice number)
- Mapping rules:
  - Amounts normalized to numeric values; negative amounts flagged.
  - Dates normalized to ISO; invalid dates flagged.
  - Map `rek_rechnr` -> `legacyId`.
  - Map `rek_kundennummer` -> `kundeId` (FK).
  - Map `rek_datum`, `rek_faellig_datum`, `rek_betr_tot_*` -> invoice dates and totals.
  - Link detail rows via `red_rechnr` -> invoice, `red_artikel_bezeichnung` -> line item.

### Pension (DogTabs Pension) -> Dogule1 TBD

- Source table: `$_kunden_zimmer` (room/boarding).
- Current hypothesis: boarding entries belong in Finanzen + Kalender, or a future "Pension" module.
- Action: confirm Dogule1 target schema before mapping.
- Interim: store in a staging table during ingestion, do not drop data.

### Trainer (DogTabs Trainer) -> Dogule1 Trainer

- Source location unknown in current capture; expected in Access DB (possible lookup via `seminar_leitung` or other tables).
- Target module: `trainer`
- Required fields (planned):
  - `id` (UUIDv7)
  - `name`, `vorname`
  - `ausbildungshistorie`, `stundenerfassung`, `lohnabrechnung`
  - `verfuegbarkeit` (weekday normalization)
- Action: locate trainer table and columns in Access DB.

## Data quality rules

- Dedupe strategy: prefer the most recent snapshot when duplicates exist; keep historical duplicates only if they represent distinct records.
- Missing required fields (name, id, FK) -> reject row and log as blocker.
- Date parsing failures -> flag with issue log entry.
- PII handling: no PII in logs or reports; masked samples only.

## Open questions

- Identify explicit trainer table or mapping source in Access DB.
- Confirm DogTabs module coverage (trainer, kalender, waren) beyond the known snapshots.
- Decide whether Pension is a new module or a projection into existing modules.

## Access DB schema extraction (manual)

This manual describes how to extract DogTabs Access database schema in read-only mode using `mdbtools`. No data is modified.

### Preconditions

- The Access database files are present under:
  - `migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/`
- Tools available:
  - `mdbtools` (for example: `mdb-tables`, `mdb-schema`, `mdb-export`)

### Files to target

- Primary: `delete dogtaps_Datenbank.accdr.ORG`
- Secondary: `delete dogtaps_Datenbank.bak`
- Ignore: `dogtaps_Datenbank.laccdb` (lock file, not data)

### Step 1: Install mdbtools

Use your system package manager:

```
sudo apt-get update
sudo apt-get install mdbtools
```

### Step 2: Identify tables

```
mdb-tables -1 "migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.accdr.ORG"
```

If the file fails to open, try the `.bak` file:

```
mdb-tables -1 "migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.bak"
```

### Step 3: Dump schema (DDL)

```
mdb-schema "migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.accdr.ORG" mysql > dogtaps_schema.sql
```

If needed, repeat with the `.bak` file to compare:

```
mdb-schema "migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.bak" mysql > dogtaps_schema_bak.sql
```

### Step 4: Export a sample table (optional)

Use this to inspect column order and data types for a specific table:

```
mdb-export -H -D '%Y-%m-%d %H:%M:%S' \
  "migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.accdr.ORG" \
  "<TABLE_NAME>" | head -n 5
```

### Step 5: Record results

- Save schema output alongside Station 73 notes (or attach to the PR).
- Use the table and column list to finalize mappings.

### Troubleshooting

- If `mdbtools` errors on the `.accdr.ORG`, try the `.bak` file.
- If both fail, use Access on Windows to export schema tables, then import the table/column list into the mapping plan.
