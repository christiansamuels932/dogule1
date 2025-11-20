# Dogule1 — Master Blueprint

## Purpose

Dogule1 ist eine modulare Verwaltungs-App für Hundeschulen. Die Anwendung liefert ein konsistentes Dashboard mit eigenständigen Modulen für Kommunikation, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen und Waren. Ziel ist eine lokale Alpha-Version (V0.1), die später auf einen NAS-Server ausgerollt wird und schließlich in einen produktiven Kundentest übergeht.

## Core Principles

1. Planner/Builder communication and documentation stay in English, while all in-app UI copy remains in German.
2. Keine ideologischen Inhalte – Fokus auf sachliche Verwaltungsfunktionen.
3. Module bleiben klar getrennt, nutzen aber gemeinsame Layout-, Router- und Komponenten-Stacks.
4. Jede Entität besitzt eine sichtbare `id` (intern, unveränderbar) und einen editierbaren `code`; das Override-Toggle wirkt nur auf `code`.
5. Mock-Daten bilden die Realität ab, bis eine echte Persistenz folgt.
6. Das Modul-Layout folgt der „Core Module Map – Phase 0“ (Dashboard als Rahmen, farbcodierte Kacheln, definierte Pfeile zwischen Modulen).

## Modules & Colors

- **Dashboard** (transparent) – Einstieg, Aggregationen, Navigation zu allen Modulen.
- **Kommunikation** (schwarz) – Nachrichten & Automationen (Platzhalter bis spätere Phase).
- **Kurse** (rot) – Kursverwaltung mit Teilnehmern, Trainern, Terminen.
- **Kunden** (violett) – Stammdaten, verknüpfte Hunde, Kurse, Finanzen.
- **Hunde** (ultramarin) – Hundedaten inkl. Besitzern, Kurszuordnung, Finanzen.
- **Kalender** (cyan) – Terminübersicht, Kurs- und Trainerplanung.
- **Trainer** (grün) – Trainerprofile, Kurseinsätze, Verfügbarkeiten.
- **Finanzen** (gelb) – Zahlungen, offene Posten, Warenbuchungen.
- **Waren** (grau) – Produktverwaltung und Verkaufsverknüpfungen.

## Architecture Baseline

- Hash-basierter Router lädt pro Route `modules/<name>/index.js` mit der verbindlichen Signatur `export function initModule(container, routeInfo)`.
- Persistentes Layout (`modules/shared/layout.html`) liefert Header, Navigation, Footer und `#dogule-main` als Mount-Target.
- Gemeinsame Komponenten (`modules/shared/components`) stellen Karten, Buttons, Notices, Empty States und Form-Rows bereit.
- Mock-APIs (`modules/shared/api`) kapseln CRUD-Stubs inkl. künstlicher Latenz; **sämtliche Mock-Daten liegen zentral in `modules/shared/api/db/index.js`** – Module dürfen keine eigenen Mock-Arrays pflegen.
- Module müssen beim Mount scrollen, Container säubern und konsistente Fehler-/Leermeldungen anzeigen.
- Beziehungen zwischen Modulen folgen der Moduleoverview-Grafik (z. B. Kunden ↔ Hunde ↔ Kurse, Kurse ↔ Trainer ↔ Kalender, Finanzen ↔ Waren).
- Jede Entität zeigt ihre ID in Detail-/Formansichten und bietet einen abgesicherten „ID manuell ändern“-Toggle.
- NAS-Builds nutzen den Vite-Output (`pnpm build` → `dist/` mit relativen Pfaden), damit die Anwendung als reine statische Seite laufen kann.

### Canonical Repository Layout

```text
dogule1/
  apps/
    web/
  modules/
    <moduleName>/
    shared/
  DOGULE1_MASTER.md
  DOGULE1_STATUS.md
  DOGULE1_PROTOCOL.md
  agents.md
  RISKS.md
  MIGRATION_CHECKLIST.md
  UI_GUIDE.md
```

Alle weiteren Dateien (README, BASELINE etc.) ergänzen diese Grundstruktur, ändern sie aber nicht.

### Module Interface

Jedes Modul muss exakt folgende Signatur exportieren:

```js
export function initModule(container, routeInfo) {
  if (!container) return;
  container.innerHTML = "";
  // render content based on routeInfo.segments …
}
```

Weitere Exporte sind optional, aber `initModule(container, routeInfo)` ist Pflicht, damit der Router deterministisch funktioniert.

### Station 18.1–18.4 Final Decisions

- **Router:** Endgültiges Modell = Clean Hash Router; Einstieg nur über `apps/web/index.html`; Modul-Lader erfolgt ausschließlich via `import.meta.glob`.
- **Layout:** Statisches Layout laden, in den DOM einfügen und anschließend Module in `#dogule-main` montieren – keine gemischten Template-Fetch-Flows.
- **Build:** Vite-Static-Build mit relativen Pfaden; keine Template-Fetches oder Hybrid-Injektion im Buildprozess.
- **Mock API:** Sämtliche Mock-Daten leben in `modules/shared/api/db/index.js` und werden von allen CRUD-Helpern importiert.

### Canonical Data Model

Der vollständige Entitäts-/Beziehungsplan steht in `DOMAIN_MODEL.md` und überschreibt ältere implizite Annahmen.  
**ID-Regel:** Jede Entität hat `id` (intern, vom System generiert, unveränderbar) und `code` (menschenlesbar, durch den Nutzer editierbar). Relationen basieren ausschließlich auf `id`; das Override-Toggle wirkt nur auf `code`.

### Non-Functional Requirements

- **Target Environment:** Desktop-first, Chrome + Edge (jeweils aktuelle Version); Mobile-Support wird später adressiert.
- **Data Scale:** Eine einzelne Hundeschule mit ca. 200–500 Kunden, 200–500 Hunden und 50–150 Kursen.
- **Usage Model:** Lokale Single-User-Verwaltung in V0.1, keine Concurrency-Garantien.
- **NAS Expectations:** Einfache File-basierte Bereitstellung; manuelles Backup/Restore des `dist/`-Ordners reicht für die Alpha.

- **Testing & CI:** Stations, die Routing, Modulverhalten oder Datenstruktur anfassen, müssen Vitest-Coverage (router/hash parsing, initModule-Verhalten, Mock-DB-Integrität) liefern. CI (GitHub Actions) führt `pnpm lint`, `pnpm build`, `pnpm test` aus.

#### Authentication & Roles (V0.1)

- V0.1 läuft als einzelner vertrauenswürdiger lokaler Admin-User – kein Login, keine Rollen/Permissions.
- Zukünftige Erweiterung: Trainer-Self-Service o. Ä. ist möglich; Module dürfen sich nicht unwiderruflich auf einen globalen Admin verlassen.

### Module Colors & Phase Behavior

- Dashboard `#FFFFFF` (transparent/weiß)
- Kunden `#6A1B9A` (violett)
- Hunde `#1E3A8A` (ultramarin)
- Kurse `#B91C1C` (rot)
- Trainer `#15803D` (grün)
- Kommunikation `#111827` (schwarz)
- Kalender `#0891B2` (cyan)
- Finanzen `#FACC15` (gelb)
- Waren `#6B7280` (grau)

Die Beziehungen aus der Core Module Map sind in den Phasen 1 und A **nur logisch**. Reale Navigation/Datenverknüpfungen dürfen erst in Phase B (Stationen 29–36) umgesetzt werden.

## Phases & Stations (1–42)

> **Warnung:** Bevor irgendeine Station umgesetzt wird, muss der Planner einen detaillierten Plan (Teilaufgaben, Tests, Übergaben) erstellen und mit dem Builder abstimmen. Keine Station darf ohne vorherige Planung gestartet werden.

### Phase 1 — Foundations & Basic App Structure

1. **Station 1 – Tooling Check**
   - Node/pnpm/Git Versionen dokumentiert.
   - `pnpm install` funktioniert fehlerfrei.
   - Ergebnis in STATUS notiert.
2. **Station 2 – GitHub Repository Setup**
   - Repo + Branchschutz aktiv.
   - Erfolgreicher Push/Pull per SSH/Token.
   - Baseline-Dateien committed.
3. **Station 3 – Tooling & CI Pipeline**
   - ESLint, Prettier, Husky, Commitlint konfiguriert.
   - CI-Workflows (Lint/Build) laufen grün.
   - Workspace-Struktur definiert.
4. **Station 4 – Module Scaffolding**
   - Jeder Modulordner enthält `index.html`.
   - Farben + Grundlayout laut Baseline.
   - Lint/Format weiterhin grün.
5. **Station 5 – Navigation Shell & Shared Styles**
   - Navigationsleiste mit Links zu allen Modulen.
   - `shared.css` steuert Basistypografie/Spacing.
   - Aktiver Link wird hervorgehoben.
6. **Station 6 – Functional Router**
   - Hash-Router tauscht Module im Content-Bereich.
   - Fehler-Handling (UI + Konsole) vorhanden.
   - Navigation per Klick/Hash funktioniert.
7. **Station 7 – Unified Layout Frame**
   - Persistentes Layout (Header/Footer).
   - Router mountet Module in `#dogule-main`.
   - Layout-Dateien zentral gehalten.
8. **Station 8 – Standard Module Interfaces**
   - `export function initModule(container, routeInfo)` verpflichtend.
   - Router validiert Exporte, loggt Fehler sauber.
   - `routeInfo.segments` dokumentiert.
9. **Station 9 – Shared UI Components**
   - Karten, Buttons, Notices, Empty States, Form-Rows in `modules/shared/components`.
   - Dashboard/Kunden nutzen ausschließlich Shared-Komponenten.
   - Komponenten-Doku vorhanden.
10. **Station 10 – Central Mock API**
    - CRUD-Helpers mit Latenz (`delay.js`).
    - Datenbasis = `modules/shared/api/db/index.js`.
    - Kunden/Kurse nutzen nur das API.
11. **Station 11 – Kunden CRUD**
    - Liste/Detail nutzt Shared Cards + Empty/Error States.
    - Create/Edit-Formulare mit Validierung und ID/Code-Anzeige.
    - Delete erfolgt mit Bestätigung + Feedback.
12. **Station 12 – Mock Data Expansion**
    - Hunde/Trainer/Waren/Finanzen Datensätze ergänzt.
    - Struktur folgt DOMAIN_MODEL.
    - CRUD-Helper kennen neue Tabellen.
13. **Station 13 – Hunde CRUD**
    - Hunde-Liste, Formulare, Detailansicht stabil.
    - Kundenrelation sichtbar, Navigation beidseitig.
    - ID/Code-Regeln umgesetzt.  
      13.1. **Station 13.1 – Kunden ↔ Hunde Linking**
    - Kunden-Detail listet Hunde.
    - Hunde-Detail verlinkt zum Besitzer.
    - Empty/Error States konsistent.
14. **Station 14 – Kurse/Hunde/Kunden Linking**
    - Kursdetail zeigt Hunde/Kunden-Teilnehmer.
    - Kundenliste weist gebuchte Kurse aus.
    - Hash-Links verbinden Ansichten.
15. **Station 15 – Kunden Finanzen**
    - Karten: Übersicht, offene Posten, Zahlungen.
    - Daten via `listFinanzenByKundeId`.
    - Empty/Error States umgesetzt.
16. **Station 16 – Hunde Finanzen**
    - Hunddetail spiegelt Kundenfinanzen (readonly).
    - Layout entspricht Kunden-Finanzkarten.
    - Fehlerbehandlung vorhanden.
17. **Station 17 – Kurse Finanzen**
    - Kursdetail zeigt Finanzdaten der Teilnehmer.
    - Fokus auf Rohdaten pro Kunde.
    - Konsistente Empty/Error States.
18. **Station 18 – Status Quo Cleaning Up**  
     - Dashboard/Kunden/Hunde/Kurse vereinheitlicht.  
     - ID/Code-Regeln dokumentiert (`id` fix, `code` editierbar).  
     - Vite-Build + NAS-Platzhalter vorbereitet.  
     18.1. **Station 18.1 – Router Stabilization**  
     - Clean Hash Router final in `apps/web/index.html`.  
     - `import.meta.glob` als einzige Modullade-Strategie.  
     - Routingtests (mehrfaches Mounten) bestehen.  
     - Referenzielle Integrität (Router vs. Module) geprüft.
    18.2. **Station 18.2 – Layout System Stabilization**  
     - Statische Layout-Datei wird einmalig injiziert.  
     - Module mounten ausschließlich in `#dogule-main`.  
     - Keine Template-Fetches mehr.  
     18.3. **Station 18.3 – Build Pipeline Stabilization**  
     - Vite-Build nutzt nur relative Pfade/hashed Assets.  
     - Dev-Server spiegelt Vite-Routing/Paths exakt.  
     - Produktionsbundle frei von Hybrid-Injektionen.  
    18.4. **Station 18.4 – Mock API Consolidation**  
     - Alle Mock-Daten in `modules/shared/api/db/index.js`.  
     - CRUD-Helper bedienen nur dieses Objekt.  
     - Module definieren keine eigenen Mock-Arrays. - In DEV prüft `runIntegrityCheck` globale referentielle Integrität.

### Phase A — Single-Module Ready (Standalone Modules)

19. **Station 19 – Module Self-Test Preparation**
    - Checkliste pro Modul (Routing, UI, Fehler, Tests) in `PHASEA_SELFTEST_CHECKLIST.md` (Pflichtgrundlage für Phase A).
    - Dokumentation verständlich für neue Devs.
    - MASTER/STATUS verweisen auf die Liste.
20. **Station 20 – Dashboard Single-Module Completion**
    - Dashboard liefert alle Karten/Fehler/Empty States standalone.
    - Mock-Daten vollständig, Build grün.
    - Self-Test protokolliert.
21. **Station 21 – Kunden Single-Module Completion**
    - CRUD + Finanzen laufen ohne andere Module.
    - Formulare mit Validation/IDs/Code.
    - Self-Test Checkliste erfüllt.
22. **Station 22 – Hunde Single-Module Completion**
    - Hunde-Standalone deckt Detail/Relation/Finanzen ab.
    - Mock-Daten aktualisieren globale DB korrekt.
    - Self-Test grün.
23. **Station 23 – Kurse Single-Module Completion**
    - Kurslisten, Formulare, Trainerzuweisung funktionsfähig.
    - Fehler/Empty States vorhanden.
    - Self-Test dokumentiert.
24. **Station 24 – Trainer Single-Module Completion**
    - Trainer-CRUD + Verfügbarkeit/Notizen.
    - Gemeinsame Komponenten genutzt.
    - Self-Test abgeschlossen.
25. **Station 25 – Kommunikation Single-Module Completion**
    - Standalone-Placeholder mit Shared Components (keine Relation).
    - Enthält eine einfache Nachrichtenliste + Detailansicht (statische Mock-Nachrichten).
    - UI folgt Shared Layout (Farben, Navigation, Empty/Error States).
    - Self-Test notiert.
    - **Vor Umsetzung:** Detailliertes UI/Flow-Konzept mit Planner abstimmen.
26. **Station 26 – Kalender Single-Module Completion**
    - Kalender zeigt Mock-Einträge (Tag/Woche).
    - Links zu Kursen/Trainern vorhanden.
    - Fehler/Empty States vorhanden.
    - **Vor Umsetzung:** UI/Interaktion (Tag/Woche/Navi) zuerst planen.

#### Kalender — Phase A Acceptance Criteria

- Unterstützt Tag-Ansicht (daily) und Woche-Ansicht (weekly).
- Woche startet montags (ISO-8601).
- Steuerelemente: „Vorherige Woche“, „Nächste Woche“, „Heute“.
- Events zeigen Zeitrange im Format `HH:MM–HH:MM`.
- Keine Kollisionserkennung: Überschneidungen werden einfach gestapelt.
- Kein Multi-Trainer-Support in Phase A (Trainer-Linking erst Phase B).
- Granularität: 30-Minuten-Blöcke visuell; Events dürfen beliebige Dauer haben.

27. **Station 27 – Finanzen Single-Module Completion**
    - Listen/Filter/Summen laufen eigenständig.
    - CRUD für Zahlungen/offene Posten.
    - Self-Test bestanden.
    - **Vor Umsetzung:** Tabellen/Filter/UI-Flows vollständig planen (Planner + Builder).
28. **Station 28 – Waren Single-Module Completion**
    - Waren-CRUD plus Verkaufsliste.
    - Kundenreferenzen sichtbar.
    - Self-Test dokumentiert.
    - **Vor Umsetzung:** UI-Konzepte (Listen, Formulare) vorab definieren.

### Phase B — Connected Modules (All arrows active)

29. **Station 29 – Connect Kunden ↔ Hunde**
    - Bidirektionale Navigation + ID-Konsistenz.
    - CRUD-Operationen aktualisieren Beziehungen korrekt.
    - Self-Test-Szenarien festgehalten.
30. **Station 30 – Connect Kunden ↔ Kurse**
    - Kundenlisten zeigen Kursteilnahmen.
    - Kurse listen Kunden, Navigation per Hash.
    - Fehler/Empty States umgesetzt.
31. **Station 31 – Connect Hunde ↔ Kurse**
    - Hunde zeigen belegte Kurse, Kurse listen Hunde.
    - IDs ausschließlich über interne `id`.
    - Self-Test grün.
32. **Station 32 – Connect Kurse ↔ Trainer**
    - Kurse zeigen verantwortlichen Trainer.
    - Trainer-Detail listet Kurseinsatz.
    - Änderungen propagieren korrekt.
33. **Station 33 – Connect Kurse ↔ Kalender**
    - Kurserstellung erstellt Kalender-Einträge.
    - Kalenderklick navigiert zurück zum Kurs.
    - Zeitzonen/Datumsangaben geprüft.
34. **Station 34 – Connect Trainer ↔ Kalender**
    - Trainer-Verfügbarkeit im Kalender visualisiert.
    - Anpassungen an Einsätzen aktualisieren Kalender.
    - Self-Test dokumentiert.
35. **Station 35 – Connect Kunden ↔ Finanzen**
    - Kundenübersicht zeigt Finanzstatus (Zahlungen/offen).
    - Finanzen-Detail verlinkt zurück zum Kunden.
    - IDs bleiben stabil.
36. **Station 36 – Connect Finanzen ↔ Waren**
    - Warenverkäufe erzeugen Finanzbuchungen.
    - Finanzen zeigen zugehörige Verkäufe.
    - Self-Test bestätigt Ende-zu-Ende-Datenfluss.

### Phase C — Local Alpha Version

37. **Station 37 – Full Local Alpha Assembly**
38. **Station 38 – Local Alpha Test Script**
39. **Station 39 – Local Alpha Hardening**

### Phase D — NAS Deployment

40. **Station 40 – NAS Build Preparation**
41. **Station 41 – NAS Deployment**
42. **Station 42 – NAS Smoke Test**
