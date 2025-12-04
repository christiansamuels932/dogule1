# DOGULE1_STATUS.md

## Active Station

- Station 36 – Connect Trainer ↔ Kalender (derivations only) — Branch `feature/station35-trainer-finanzen`. Implementierung abgeschlossen, automatisierte Checks grün. Scope: Trainer-Metadaten in Kalender (Tag/Woche/Event-Detail) werden nur abgeleitet, keine Schema-/Persistenzänderungen. Trainer-Detail enthält neue read-only Karte „Kalendereinsätze“ mit abgeleiteten Ereignissen, Links zu Kurs/Ereignis, deutsche Empty/Error States. Tests: `pnpm lint` ✅, `pnpm test --run` ✅, `pnpm build` ✅, `runIntegrityCheck` ✅. Manuelle Restprüfung offen: Kalender Tag/Woche zeigt Trainerzeile bzw. „Kein Trainer zugewiesen.“, Event-Detail mit „Zum Trainer“-Link, Trainer-Detail-Karte „Kalendereinsätze“ listet erwartete Events/Links/Empty/Error.

## Station Log (chronologisch, read-only)

- Station 1 – Tooling Check — Node/pnpm/Git verifiziert, DEV-Setup funktionsfähig.
- Station 2 – GitHub Setup — Repo eingerichtet, Remote-Sync getestet, Baseline-Dateien eingecheckt.
- Station 3 – Tooling & CI — ESLint, Prettier, Husky, Commitlint, CI-Workflows und Workspace-Struktur.
- Station 4 – Module Scaffolding — Alle Module mit Platzhalter-HTML erstellt.
- Station 5 – Navigation & Shared Styles — Grundnavigation + `shared.css`.
- Station 6 – Hash Router — Einfacher Router lädt Module dynamisch.
- Station 7 – Unified Layout — Persistentes Layout mit Header/Navigation/Footer.
- Station 8 – Standard Module Interfaces — `export function initModule(container, routeInfo)` verpflichtend.
- Station 9 – Shared UI Components — Karten, Buttons, Form-Rows, Notices, Empty States.
- Station 10 – Central Mock API — CRUD-Stubs + In-Memory-DB.
- Station 11 – Kunden CRUD — Vollständige Kunden-Flows.
- Station 12 – Mock Data Expansion — Zusätzliche Datensätze (Hunde, Trainer, Finanzen; Waren noch nicht angelegt).
- Station 13 – Hunde CRUD + 13.1 Kunden ↔ Hunde Linking — Hunde-CRUD abgeschlossen, bidirektionale Navigation zu Kunden.
- Station 14 – Kurse/Hunde/Kunden Linking — Verknüpfungen zwischen Kursen, Hunden und Kunden hergestellt.
- Station 15 – Kunden Finanzen — Finanzkarten für Kunden umgesetzt.
- Station 16 – Hunde Finanzen — Hundedetail spiegelt Kundenfinanzen (readonly).
- Station 17 – Kurse Finanzen — Kursdetail zeigt Finanzdaten der Teilnehmer.
- Station 18 – Status Quo Cleanup — Dashboard/Kunden/Hunde/Kurse vereinheitlicht, ID/Code-Regeln dokumentiert, Vite-Build/NAS-Platzhalter.
- Station 18.1 – Router Stabilization — Clean Hash Router mit `import.meta.glob`, Fehlerzustände, Navigation-Highlighting.
- Station 18.2 – Layout Stabilization — Layout-HTML wird einmalig injiziert, Module mounten ausschließlich in `#dogule-main`.
- Station 18.3 – Build Stabilization — Vite-only Dev/Build-Pipeline mit relativen Pfaden, keine hybriden Template-Flows.
- Station 18.4 – Mock DB Consolidation — Alle Mock-Daten in `modules/shared/api/db/index.js`, CRUD-Helper nutzen nur dieses Objekt, Integrity-Check aktiv.
- Phase 1 QA — `PHASE1_QA.md` angelegt; laufende Verifikation bis Abschluss aller Punkte.
- Station 19 – Module Self-Test Preparation — `PHASEA_SELFTEST_CHECKLIST.md` erstellt und in MASTER verankert; Phase-A-Module können nach Checkliste fortgesetzt werden.
- Station 20 – Dashboard Phase A — Dashboard nutzt zentrale Mock-API für Kennzahlen, einheitliche Fallback-Texte, Scroll/Focus beim Laden; Self-Test abgeschlossen. MASTER ergänzt: Module gelten erst nach vollständigem GUI + manueller Freigabe als abgeschlossen.
- Station 24 – Trainer Single-Module Completion — Branch `feature/station24-trainer`. Trainer-Modul Phase-A-fertig: h1/h2-Hierarchie, Shared-Komponenten, IDs sequenziell `t<n>` (UI read-only), Code-Override-Toggle, Verfügbarkeiten-Textarea mit Persistenz, Form-Buttons triggern Submit. CRUD/Validierung/Empty/Error/Navi geprüft. Tests: `pnpm lint` ✅, `pnpm build` ✅.
- Station 25 – Finanzen Phase-A (Listen/Detail/Filter, in Progress) — Branch `feature/station25-finanzen`. Phase-A-Skelett: `initModule` mit Scroll/Fokus, Loading/Error/Empty via Shared Notices, Summary-Karte (Bezahlt/Offen/Saldo), Filter-Karte (Kunde/Typ), Tabelle mit Kundenauflösung + Hash-Details, Detail mit Kunde-Link + Back-Link. Kein CRUD/Deletes (für Station 27). Manuell geprüft `#/finanzen`, `#/finanzen/<id>` console-clean. Tests: `pnpm lint` ✅, `pnpm build` ✅.
- Station 27 – Finanzen Single-Module Completion — Branch `feature/station27-finanzen`. Vollständige CRUD: Routen `#/finanzen`/`new`/`<id>`/`<id>/edit`, ID read-only + Code-Override, Kunde/Typ/Betrag/Datum/Beschreibung, Filter + Summary, Detail mit Edit/Delete + Inline-Confirm, Typen „Bezahlt/Offen“, Kundenlabels zentral. Self-Test manuell ✅ (Listen → Create → Detail → Edit → Delete → Refresh), Console clean. Tests: `pnpm lint` ✅, `pnpm test` ✅, `pnpm build` ✅.
- Station 28 – Waren Single-Module Completion — Branch `feature/station28-waren`. Waren-CRUD Phase-A: Routen `#/waren`/`new`/`<id>`/`<id>/edit`, Listen/Detail/Form/Delete mit Shared Cards/Buttons/Notices/Form-Rows, deutsche UI, Loading/Error/Empty/Not-Found, Fokus/H1/H2 korrekt, kein Routing-/Console-Rauschen. Nutzt zentrale Waren-API. Self-Test ✅ (CRUD inkl. Delete). Tests: `pnpm lint` ✅, `pnpm build` ✅.
- Station 29 – Connect Kunden ↔ Hunde — Branch `feature/station29-kunden-hunde`. Kunden-Detail zeigt verlinkte Hunde (ID/Code), Hunde-Liste/Detail verlinkt Besitzer inkl. Rücksprung nach Delete; Hund-API erzwingt gültige `kundenId` bei Create/Update. Self-Test-Checkliste erweitert. Tests: `runIntegrityCheck` ✅, `pnpm lint` ✅, `pnpm test` ✅, `pnpm build` ✅.
- Station 30 – Connect Kunden ↔ Kurse — Branch `feature/station30-kunden-kurse`. Teilnehmermodell auf Hunde-only, API validiert `hundIds`, Integrity-Check aktualisiert. Kunden-Detail verlinkt Kurse über Hunde; Kurs-UI zeigt Teilnehmerkunden aus Hundebesitzern. Neues Typeahead: Spalten Kunden/Hunde, Kunde-Klick fügt alle Hunde hinzu, Hund-Klick Einzelhund, Chips/Leeren, leere Auswahl erlaubt. Tests: `pnpm lint` ✅, `pnpm vitest run` ✅, `pnpm build` ✅. PR erstellt.
- Station 31 – Connect Hunde ↔ Kurse — Branch `feature/station31-hunde-kurse`. Hunde-Detail listet Kurse inkl. Links; Kurs-Detail listet Hunde inkl. Besitzerinfos. Hundedarstellungen zeigen Besitzer (Code/Name) + Ort; Kurs-Formular-Suche/Chips ebenfalls. Tests: `pnpm lint` ✅, `pnpm vitest run` ✅, `pnpm build` ✅. PR ausstehend.
- Station 32 – Connect Kurse ↔ Trainer — Branch `feature/station31-hunde-kurse`. Kurse laden/prüfen Trainerliste, Trainerkarte im Kursdetail (ID/Code/Kontakt), Trainer-Auswahl validiert. Trainer-Detail listet Kurseinsatz; Trainer-Löschen blockiert bei Zuweisungen (Integrity-Check). Aktionen-Karten mit primärem „Neuer …“-Button vereinheitlicht. Tests: `pnpm lint` ✅, `pnpm vitest run` ✅, `pnpm build` ✅. Manuelle Checks: Kursdetail → Trainer-Link, Trainerdetail → Kurse, Kurs-Create/Edit mit Trainer, Delete-Guard.
- Station 32a – Build-Fix Trainer FK Export — Branch `feature/station31-hunde-kurse`. Export `getKurseForTrainer` ergänzt, Trainer-FK-Checks verschärft; Integrity-Check erweitert. Tests: `pnpm lint` ✅, `pnpm vitest run` ✅, `pnpm build` ✅. Commit `fix: enforce trainer FK and export getKurseForTrainer`.
- Station 33 – Connect Kurse ↔ Kalender — Branch `feature/station33-kurse-kalender`. Kalender wird aus Kursen gespeist (Create/Update/Delete), `syncKalenderWithKurse` räumt Waisen. Event-Payload lokal→ISO, nur MASTER-Felder. UI: Event-Blocks mit Kurs-Link, Event-Detail mit Kurs-Infos + „Zum Kurs/Zum Tag“. Tests: `pnpm lint` ✅, `pnpm vitest run` ✅, `pnpm build` ✅. Manuell: Kurs erstellen → Event erscheint; Zeit ändern → Event verschiebt; Löschen nach Entlinken entfernt Event; Event-Detail-Link ok.
- Station 35 – Connect Trainer ↔ Finanzen (re-scoped von Kunden ↔ Finanzen) — Branch `feature/station35-trainer-finanzen`. Finanzen read-only, optional `kursId` für Laufzeit-Derivation: Liste/Detail zeigen Trainer-Meta/Links; Trainer-Detail Umsatz-Karte (Summen Bezahlt/Offen/Saldo + letzte Einträge) mit Finanzen-Links. Neue API-Helper `resolveFinanzenWithRelations`/`getFinanzenReportForTrainer`, Integrity-Check validiert `kursId` falls vorhanden. Tests: `pnpm lint` ✅, `pnpm vitest run --root . modules/shared/api/finanzen.trainer.test.js` ✅, `pnpm build` ✅; manuell: Kurs-Zahlungen zeigen Trainer, Kurs ohne Trainer Hinweis, nicht kursgebundene Zahlungen unverändert, Trainer-Umsatzkarte leer wenn kein Umsatz.
- Station 35.1 – CI Lint Fix (Trainer ↔ Finanzen) — Branch `feature/station35-trainer-finanzen`. Entfernt ungenutzten Helper `formatScheduleTimeRange`, Lint-Fix. Tests: `pnpm lint` ✅.
- Station 36 – Connect Trainer ↔ Kalender (derivations only) — Branch `feature/station35-trainer-finanzen`. Kalender-Events zeigen abgeleitete Trainer-Metadaten in Tag/Woche + Event-Detail, keine Trainer-Persistenz im Event. Trainer-Detail hat Karte „Kalendereinsätze“ mit abgeleiteten Ereignissen (Links Kurs/Ereignis, deutsche Empty/Error). Tests: `pnpm lint` ✅, `pnpm test --run` ✅, `pnpm build` ✅, `runIntegrityCheck` ✅ (Node Hinweis: `"type": "module"` fehlt in package.json).

## Aktive Branches/PRs

- `feature/station24-trainer` → PR “Station 24 – Trainer Single-Module Completion” → Ziel: `main`
- `feature/station27-finanzen` → PR “Station 27 – Finanzen Single-Module Completion” → Ziel: `main`
- `feature/station28-waren` → PR “Station 28 – Waren Single-Module Completion” → Ziel: `main`
- `feature/station29-kunden-hunde` → PR “Station 29 – Connect Kunden ↔ Hunde” → Ziel: `main`
- `feature/station35-trainer-finanzen` → enthält Stations 35/35.1/36 Änderungen; noch offen bis Merge

## Status-Update-Kadenz

- Nach jedem gemergten PR und zum Ende jeder Station aktualisieren.
- Immer Branch/PR, Zusammenfassung, Testergebnisse (lint/test/build), offene Risiken/Nächste Schritte notieren.
- CODEX_STEP_LOG.md enthält den detaillierten aktuellen Arbeitsstand pro Session.
