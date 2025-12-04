This document is the authoritative status log for Dogule1 (replaces dogule1_status.md).
Every station block is wrapped by a visual bracket line: `# - - - - - - - - - - - - - - - - - - - -` before and after.
Each station block uses this structure (read-only):

- Title: `# Station X — <Title>` (for grouped history: `Station 1–17 — <Title>`).
- `## Kontext`: branch names, scope/goal/phase, prerequisites.
- `## Ergebnis (kurz)`: concise implementation summary (UI/data/logic, constraints).
- `## Tests`: commands run with outcomes (e.g., `pnpm lint`, `pnpm test`/`vitest`, `pnpm build`, `runIntegrityCheck`), note any warnings.
- `## Issues` (optional): failed tests/pushes/tooling, lint/build hiccups, and how resolved. Omit if none.
- `## Notizen` (optional): pending manual checks, warnings, risks, decisions.
  Instructions/notes in English; UI text references remain in German when quoted. Chronological order applies.

Branching rule: each station must be developed on its dedicated branch; if the expected branch does not exist yet, create a new one before starting the station.

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
