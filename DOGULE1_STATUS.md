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

## Active Station

**Station 21 – Phase A Folgearbeiten (laufend):**

- **Neue Vorgabe (Pre-Alpha Validierung):** Formulare prüfen nur zwingend nötige Felder; weiche/optionale Checks dürfen nicht blockieren (Ziel: Speichern/Bearbeiten/Löschen bleibt möglich, harte Validierung erfolgt in späteren Stationen).
- **Aktueller Branch/PR:** `feature/kunden-waren` · PR #31 offen gegen `main` (Add Waren handling to Kunden module). Zusätzlich: PR #33 „Station 23 – Kurse Single-Module Completion“ geöffnet.
- **Umgesetzte Arbeiten (Code):**
  - Kunden: Waren-Sektion im Detail (Mock-API), Delete-Guard verhindert Löschen bei verknüpften Hunde/Kurse/Finanzen/Waren; Aktions-Buttons auf Shared Buttons umgestellt; Code-Override-Toggle präzisiert, Pflicht-Kundencode wird bei Auto-Modus generiert; Eyebrow in Liste zeigt Platzhalter statt Fallback-ID; Währungsformatierung und Listen-Styles ergänzt.
  - Hunde (Station 22): ID/Code-Handhabung an Kunden-Pattern angepasst (Detail zeigt id + code, Liste zeigt code/id, Form mit Code-Override, ID read-only), Heading-Hierarchie auf h1/h2 korrigiert, Delete-Flow blockt bei verknüpften Kursen/Finanzen und ruft Integrity-Check, Finanzsektionen mit Guards/Errors/Empty-States wie Kunden, Besitzer-/Kurs-Relationen in Cards mit Codes/Links, Button-UI in Detail vereinheitlicht, Form-Submit warnt bei fehlenden Pflichtfeldern (optional überspringbar).
  - Shared API: neues `waren.js` mit `listWaren`/`listWarenByKundeId`; Export in `modules/shared/api/index.js`.
  - Router: `parseHash` Helper hinzugefügt; Vitest-Coverage unter `apps/web/routerUtils.test.js`.
  - Styles: Shared Empty-State-Typografie und Kunden-Listen/Finanz/Waren-Listen in `components.css`/`shared.css` ergänzt.
  - Docs: `DOMAIN_MODEL.md` wiederhergestellt; MASTER ergänzt Pflichtläufe (lint/test/build) nach jedem Change; `CODEX_STEP_LOG.md` bereinigt (war Station-Log, jetzt leer).
- **Kurse Phase-A Self-Test (Step 9):** Erneut geprüft; frühere FAIL-Punkte (Trainer/Datum/Zeiten/Status/Capacity Pflicht, Kalender-Enforcement) nun als PASS markiert, da Phase-A bewusst optionale Felder zulässt und keine Trainer/Kalender-Verknüpfung erzwingt. Ergebnis: Alle Kurse-Checks PASS.
- **Kurse – Station 23 PR-Inhalte (bereitgestellt):**
  - ID/Code-Overhaul: Detail/Liste/Form zeigen id+code konsistent; Code-Override mit Auto-Backfill.
  - CRUD-Schema-Alignment: Payloads und Mock-DB-Felder harmonisiert; safe parsing (strings/arrays/numbers) verhindert Laufzeitfehler.
  - Teilnehmer-Anzeige: Kunden/Hunde im Kursdetail aus Mock-API; Finanzabschnitte pro Kunde/Hund verlinkt.
  - Heading/Focus/Scroll: h1/h2-Hierarchie, Scroll-to-top, Fokus auf Heading bei View-Wechsel.
  - Delete-Guard: Kurs-Löschen blockiert bei verknüpften Teilnehmern/Finanzen; Notice + Toast.
  - Zero-Validation-Policy: Nur minimale Crash-Prävention (Code auto, Arrays init), keine Soft-Feld-Pflicht.
  - Self-Test: Phase-A erneut durchlaufen → alle Kurse-Checks PASS.
- **Tests (lokal, heute):** `pnpm lint` ✅ (vorher dist-Artefakte entfernt), `pnpm vitest run` ✅ (1 Datei, 4 Tests), `pnpm build` ✅ (dist anschließend gelöscht, Repo wieder clean).
- **Offen/Nächste Schritte:** PR #31 und PR #33 reviewen/mergen; Kunden-Modul in UI gegen Phase-A-Checklist revalidieren (v. a. Waren/Empty/Error States); ähnliche Waren-Verknüpfungen ggf. in Finanzen/Waren-Modul prüfen; weitere Module gemäß Self-Test-Plan (Stations 22–26) durchgehen.
