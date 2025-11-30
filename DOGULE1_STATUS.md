# DOGULE1_STATUS.md

## History (read-only)

- **Station 1 – Tooling Check:** Node/pnpm/Git verifiziert, DEV-Setup funktionsfähig.
- **Station 2 – GitHub Setup:** Repo eingerichtet, Remote-Sync getestet, Baseline-Dateien eingecheckt.
- **Station 3 – Tooling & CI:** ESLint, Prettier, Husky, Commitlint, CI-Workflows und Workspace-Struktur.
- **Station 4 – Module Scaffolding:** Alle Module mit Platzhalter-HTML erstellt.
- **Station 5 – Navigation & Shared Styles:** Grundnavigation + `shared.css`.
- **Station 6 – Hash Router:** Einfacher Router lädt Module dynamisch.
- **Station 7 – Unified Layout:** Persistentes Layout mit Header/Navigation/Footer.
- **Station 8 – Standard Module Interfaces:** `export function initModule(container, routeInfo)` als Pflicht.
- **Station 9 – Shared UI Components:** Karten, Buttons, Form-Rows, Notices, Empty States.
- **Station 10 – Central Mock API:** CRUD-Stubs + In-Memory-DB.
- **Station 11 – Kunden CRUD:** Vollständige Kunden-Flows.
- **Station 12 – Mock Data Expansion:** Zusätzliche Datensätze (Hunde, Trainer, Finanzen; Waren noch nicht angelegt).
- **Station 13 – Hunde CRUD** + **13.1 Kunden ↔ Hunde Linking.**
- **Station 14 – Kurse/Hunde/Kunden Linking.**
- **Station 15 – Kunden Finanzen.**
- **Station 16 – Hunde Finanzen.**
- **Station 17 – Kurse Finanzen.**
- **Station 18 – Status Quo Cleanup:** Dashboard/Kunden/Hunde/Kurse vereinheitlicht, ID/Code-Regeln dokumentiert, Vite-Build/NAS-Platzhalter gesetzt.
- **Station 18.1 – Router Stabilization:** Clean Hash Router mit `import.meta.glob`, Fehlerzustände, Navigation-Highlighting.
- **Station 18.2 – Layout Stabilization:** Layout-HTML wird einmalig injiziert, Module mounten ausschließlich in `#dogule-main`.
- **Station 18.3 – Build Stabilization:** Vite-only Dev/Build-Pipeline mit relativen Pfaden, keine hybriden Template-Flows.
- **Station 18.4 – Mock DB Consolidation:** Alle Mock-Daten in `modules/shared/api/db/index.js`, CRUD-Helper nutzen nur dieses Objekt, Integrity-Check aktiv.
- **Phase 1 QA:** Checklist in `PHASE1_QA.md` angelegt; wird fortlaufend gepflegt, bis alle Punkte verifiziert sind.
- **Station 19 – Module Self-Test Preparation:** `PHASEA_SELFTEST_CHECKLIST.md` erstellt und als Pflichtgrundlage in MASTER verankert; Station 19 beendet, Phase A Module können in Station 20 ff. nach den Self-Tests fortgesetzt werden.
- **Station 20 – Dashboard Phase A:** Dashboard auf Daten aus der zentralen Mock-API umgestellt (Kunden/Hunde/Kurse-Zählungen), Fallback-Texte vereinheitlicht, Scroll/Focus beim Laden, Status-Karte via Shared Notice, Phase-A-Selftest für Dash abgeschlossen; MASTER ergänzt, dass Module nur nach vollständigem GUI + manueller Freigabe des Nutzers als abgeschlossen gelten.
- **Station 24 – Trainer Single-Module Completion:** Branch `feature/station24-trainer`. Trainer-Modul auf Phase-A-Stand gebracht: saubere h1/h2-Hierarchie, Router-Mount bleibt unverändert, Shared-Komponenten durchgängig genutzt. ID-System am Master ausgerichtet (Trainer-IDs nun API-seitig sequenziell `t<n>`, UI nur read-only Vorschau), Code-Override-Toggle auf Create/Edit, Verfügbarkeiten-Eingabe als interaktives Textarea mit Persistenz. Formular-Buttons an die Form gebunden (`requestSubmit`), sodass CRUD (Create/Edit/Delete) wieder auslösbar ist; Detail/List zeigen ID/Code/Kontakt/Notizen/Verfügbarkeiten. Manual UI validation bestätigt 100 % Phase-A-Readiness (CRUD, Validierung, Empty/Error States, Navigation, Shared-Styles). Lint/Build laufen grün.
- **Station 25 – Finanzen Phase-A (Listen/Detail/Filter) in Progress:** Branch `feature/station25-finanzen`. Finanzen-Modul mit Phase-A-Skelett ergänzt: `initModule` mit Scroll/Fokus/Hash-Segmente, Loading/Error/Empty via Shared Notices, Summary-Karte (Summe Zahlungen/Offen/Saldo), Filter-Karte (Kunde/Typ), Einträge-Tabelle mit Kundenauflösung und Hash-Details, Detail-Card mit Kunde-Link + Back-Link. Keine CRUD-Formulare/Deletes (für Station 27 vorgesehen). Manuell geprüft: `#/finanzen` und `#/finanzen/<id>` laden ohne Console-Errors. `pnpm lint` ✅, `pnpm build` ✅.

## Active Station

**Station 26 – Kalender Phase-A Completion (Restart):** Branch `feature/station26-kalender-restart`. Kalender-Modul komplett neu aufgebaut: neue Date- und Routen-Helper, Overlap-Engine, Toolbar-Navigation, 30-Minuten-Slot-Grid mit Zeitachse, Event-Blocks mit Scroll-to-first-event, vollständiges CSS-Gridsystem, Tag/Woche/Monat/Jahr/Event-Detail-Views, German headings/ARIA, Empty/Error-Handling, Fokus auf h1. Tests/Built: `pnpm lint` ✅, `pnpm test` ✅, `pnpm build` ✅. Modul erfüllt die Phase-A-Kriterien aus `kalender.md` und ist bereit für Phase B (Integration/Verknüpfungen) später.

### Status-Update-Kadenz

- Nach jedem gemergten PR und zum Ende jeder Station `DOGULE1_STATUS.md` ergänzen.
- Immer Branch/PR, Zusammenfassung, Testergebnisse (lint/test/build), offene Risiken/Nächste Schritte notieren.
- Der detaillierte aktuelle Arbeitsstand liegt zusätzlich in `CODEX_STEP_LOG.md`.

### Aktive Branches/PRs

- `feature/station24-trainer` → PR “Station 24 – Trainer Single-Module Completion” → Ziel: `main`
- `feature/station25-finanzen` → Finanzen Phase-A Listen/Detail/Filter (PR ausstehend)
