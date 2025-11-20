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

## Active Station

**Station 18.x1 – Repository & Documentation Cleanup (abgeschlossen):** Dateien konsolidiert, obsolete Artefakte archiviert (`archive/station18x-obsolete/`), MASTER/BASELINE/STATUS/README/DOMAIN_MODEL auf Vite-only Setup, Clean Hash Router, statisches Layout, zentralisierte Mock-DB (`modules/shared/api/db/index.js`) und dev-only Integrity Check abgestimmt. Abschlussprüfung bestätigt keine offenen Widersprüche; Station 19 kann vorbereitet werden.
