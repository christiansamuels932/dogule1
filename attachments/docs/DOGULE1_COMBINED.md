# Dogule1 Combined Docs

Codex instruction: when working in this project, always read `BATTLEPLAN_STATIONS_71_PLUS.md` first.

This file consolidates all current Markdown documentation (excluding status.md).

## Source: CUTOVER_PLAYBOOK.md

# Cutover Playbook (Draft for Station 56 – Candidate Only)

## Preconditions

- Candidate storage: `storage_candidate/v1/` present, scan green (schema/FK/invariants/PII/checksum/merkle).
- Inputs locked: mock DB (`modules/shared/api/db/index.js`) + registries (`migration/mapping/*.json`); `MIGRATE_RUN_ID` default `run-local`, scans default `scan-all`.
- Registries approved and frozen.
- Downtime/maintenance window agreed.
- Rollback assets prepared: snapshot of current storage + registries.

## Roles

- Operator: runs commands below.
- Reviewer: verifies reports/hashes.

## Steps

1. Freeze writes in source system (mock in this repo: N/A; real env: block writes).
2. Build/refresh candidate (if not already green):
   - Clean previous artifacts: `rm -rf storage_candidate/v1 storage_reports/latest-*`
   - `node tools/migration/cli.js dry-run` (expect 0 BLOCKER)
   - `node tools/migration/cli.js migrate` (writes `storage_candidate/v1`, runId=run-local unless overridden)
3. Validate candidate:
   - `node tools/migration/cli.js scan-all`
   - Confirm `storage_reports/latest-scan/summary.json` shows 0 BLOCKER/WARNING.
   - Optional determinism check: copy `storage_candidate/v1` → `storage_candidate/v1-run1`, rerun step 2, then `diff -r storage_candidate/v1-run1 storage_candidate/v1` (expect no output); remove `v1-run1` after check.
4. Record hashes:
   - Per-module Merkle roots from `storage_candidate/v1/<module>/checksums/merkle.json`.
   - Run metadata from `storage_candidate/v1/checksums/run.json` (runId + module roots).
5. Rollback drill (pre-cutover sanity):
   - Inject failure: `MIGRATE_FAIL_AFTER_MODULE=kurse node tools/migration/cli.js migrate` → expect exit 1, no `storage_candidate/v1` left behind.
   - Rebuild clean candidate via steps 2–3 after drill.
6. Flip pointer/config to use candidate storage (implementation-dependent; not in repo).
7. Smoke-test critical paths (read-only): open app, load modules, confirm no errors.
8. If any blocker is found post-flip: rollback immediately (see below).

## Rollback

- Re-point to previous storage path/symlink.
- Restore previous registry snapshot if mutated (not expected in 53–55 scope).
- Re-run integrity scan on restored storage to confirm health.

## Post-Cutover Validation

- Re-run `scan-all` on live pointer.
- Check monitoring/logs for errors.

## Notes

- This playbook assumes offline candidate storage only; no runtime DB writes in this repo.
- Update with environment-specific commands before real use.

---

## Source: DOGULE1_GOVERNANCE.md

# DOGULE1 Governance — Stations 50–74

Purpose: single source for roadmap control, gating, owners, and station readiness rules for Stations 50–74.

Normative scope: this file defines authority, invariants, and roadmap control. PROTOCOL carries agent behavior; MASTER carries station definitions; STATUS logs progress. Hierarchy: GOVERNANCE > PROTOCOL > MASTER > STATUS.

## Station List and Validation

Suffix legend: `R` = lifecycle/retention, `K` = Kommunikation.

Validated order: yes — 2025-12-08

| Station | Title                                                | Notes                                                 |
| ------- | ---------------------------------------------------- | ----------------------------------------------------- |
| 50      | Roadmap Governance & Definitions of Ready            | Planning/docs only                                    |
| 51      | Storage Contract Finalization (E1)                   | Storage schema/versioning/PII/consistency             |
| 52      | Security Baseline Finalization (F1–F3 summary)       | Authn/authz/TLS/secret rules                          |
| 53      | Migration Engine Skeleton & Dry-Run (E2a)            | CLI skeleton, mapper stubs, registry, dry-run only    |
| 54      | Storage Adapters & Checksums (E2b)                   | Atomic write path, checksum tooling, migration writes |
| 55      | Integrity Scanner & CI Integration (E2c)             | Schema/FK/invariant/PII scanner wired to CI           |
| 56      | Migration Rehearsal & Cutover Prep (E2d)             | Full mock→real rehearsal, rollback drills, playbook   |
| 57      | Authorization Matrix & Audit Plan (F2, F4)           | Role×action, audit, alerts                            |
| 58      | Storage Access Layer Architecture (E3)               | Access pattern, migration order                       |
| 59      | Authentication & Sessions MVP Implementation         | Login/session/lockout/2FA toggle                      |
| 60      | Authorization Enforcement Layer                      | Middleware/enforcement/unauthorized UX                |
| 61      | Transport, Secrets, and Config Hardening             | TLS/HSTS/CSRF/secret storage/rotation cadence         |
| 62      | Logging, Rate Limits, and Alerts Foundation          | Limits/audit hooks/alerts/health                      |
| 63      | Storage Layer Implementation (Core Entities)         | Real storage + migration + backup/restore dry run     |
| 64      | Kommunikation Module Skeleton (Read-Only)            | Nav/state machine/access controls                     |
| 65      | Groupchat Core                                       | Send/read markers/notifications/retry                 |
| 66R     | Groupchat Retention Enforcement                      | Retention/TTL/prune/audit/alerts                      |
| 67K     | Infochannel with Confirmation Flow                   | Admin-only posts/confirmations/escalations            |
| 70      | Storage & Security Hardening Pass                    | Drills/failure injection/rate-limit review            |
| 71      | UI Design Tokens & Layout Application (Core Screens) | Tokens/layout/a11y/perf/localization                  |
| 72      | Mobile Readiness (Kommunikation + Dashboard)         | Breakpoints/bottom-nav/offline-read                   |
| 73      | Rollout Prep & Playbooks                             | Incident/playbooks/kill switches/risk review          |
| 74      | Public Rollout (V1)                                  | Staged launch/telemetry/support/rollback              |

Stations 61–63 are foundational and closed; downstream stations depend on them but must not redefine their rules.

## Gating Rules

- Storage contract (51) precedes migration start (53); migration chain is sequential 53 → 54 → 55 → 56.
- Security baseline (52) must be green before migration cutover (56) and before downstream auth/security stations (57–62).
- Auth/Security (57–62) and migration (53–56) must be green before integrations (64–67) begin.
- Integrations (64–67) must be green before UI/Mobile (71–72) begin.
- Hardening (70) precedes rollout (73–74).
- Any blocker triggers either reopening the station or adding a follow-up station before proceeding.

## Branch Naming and PR Governance

- Branch naming: `feature/stationXX-name` (mandatory).
- PR flow: Codex opens PR; Planner reviews; Human merges unless explicitly delegated.
- Blocking findings: document in PR + `status.md`; resolve by reopening station or creating follow-up; update this file if governance changes.

## Owner Roles

- Planner: scope, requirements, acceptance definition, review of PR content.
- Codex: execution, code/docs changes, commits, PR creation.
- Human: merge authority; may delegate merge in writing.

## STATUS.md Entry Standard

- Follow the template defined at the top of `status.md` (Title, Kontext, Ergebnis, Tests, Issues, Notizen).
- Tests must list commands and outcomes; use `Tests: none` only if no tests exist.

## How to Update Governance

- Changes to this file require Planner review and Human approval via PR; record a short changelog line in this section with date and PR link.
- Record blocker resolutions in `status.md` (Issues/Notizen) and, if governance rules change, append the change note here.
- Storage/schema source of truth for Stations 50–70: `DOGULE1_SYSTEM_BASELINE_V2.md` (defines IDs, PII/residency, invariants, migration).

Changelog:

- 2025-12-08: Initial governance for Stations 50–70.
- 2026-01-XX: Renumbered Stations 53–56 to Migration & Integrity (E2a–E2d) per Station 52 plan; downstream stations shifted accordingly.

---

## Source: DOGULE1_MASTER.md

# Dogule1 — Master Blueprint

## Normative Scope

Dieses Dokument definiert Phasen, Stationen und deren Akzeptanzkriterien. Governance/Invarianten stehen in `DOGULE1_GOVERNANCE.md`. Agenten-Verhalten steht in `DOGULE1_PROTOCOL.md` und `agents.md`. `status.md` ist das Fortschritts-Ledger.

## Purpose

Dogule1 ist eine modulare Verwaltungs-App für Hundeschulen. Die Anwendung liefert ein konsistentes Dashboard mit eigenständigen Modulen für Kommunikation, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen und Waren. Ziel ist eine lokale Alpha-Version (V0.1), die später auf einen Contabo VPS ausgerollt wird und schließlich in einen produktiven Kundentest übergeht.

## Core Principles

1. Keine ideologischen Inhalte – Fokus auf sachliche Verwaltungsfunktionen.
2. Module bleiben klar getrennt, nutzen aber gemeinsame Layout-, Router- und Komponenten-Stacks.
3. Jede Entität besitzt eine sichtbare `id` (intern, unveränderbar) und einen editierbaren `code`; das Override-Toggle wirkt nur auf `code`.
4. Mock-Daten bilden die Realität ab, bis eine echte Persistenz folgt.
5. Das Modul-Layout folgt der „Core Module Map – Phase 0“ (Dashboard als Rahmen, farbcodierte Kacheln, definierte Pfeile zwischen Modulen).
6. Ein Modul darf erst als **abgeschlossen** markiert werden, wenn sein vollständiges GUI steht und es sich als eigenständige Einzweck-App bedienen und testen lässt (Navigation, Datenflüsse, Fehlermeldungen, Fokus/Scroll); Abschluss und Status-Update erfolgen erst nach manueller Prüfung und Freigabe durch den Nutzer.
7. Pre-Alpha Validierung: Formulare blockieren nur zwingend notwendige Pflichtfelder; weiche/optionale Checks dürfen Eingaben nicht stoppen (harte Validierung wird in späteren Stationen nachgezogen).

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
- VPS-Deployments nutzen den Vite-Output (`pnpm build` → `dist/` mit relativen Pfaden), damit die Anwendung als statische Seite hinter einem Webserver laufen kann.

### Canonical Repository Layout

```text
dogule1/
  apps/
    web/
  modules/
    <moduleName>/
    shared/
  DOGULE1_MASTER.md
  status.md
  DOGULE1_PROTOCOL.md
  agents.md
  UI_GUIDE.md
```

Alle weiteren Dateien (README, BASELINE etc.) ergänzen diese Grundstruktur, ändern sie aber nicht. Optionale Dokumente (z. B. RISKS.md, MIGRATION_CHECKLIST.md) dürfen ergänzt werden, wenn sie benötigt werden.

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

### ID/Code Patterns (Phase A)

- IDs: systemgeneriert, unveränderbar, UI nur read-only anzeigen. Keine Modul-spezifischen Overrides.
- Codes: menschenlesbar, per Override-Toggle editierbar; Standardpräfixe folgen Stations-Logik (z. B. TR-xyz, K-xyz, H-xyz, kurs-xyz).
- UI zeigt immer beide Felder in Detailansichten; Formulare zeigen ID read-only, Code optional überschreibbar.

### Non-Functional Requirements

- **Target Environment:** Desktop-first, Chrome + Edge (jeweils aktuelle Version); Mobile-Support wird später adressiert.
- **Data Scale:** Eine einzelne Hundeschule mit ca. 200–500 Kunden, 200–500 Hunden und 50–150 Kursen.
- **Usage Model:** Lokale Single-User-Verwaltung in V0.1, keine Concurrency-Garantien.
- **VPS Expectations:** Statische Auslieferung der `dist/`-Assets; Backups via `dist/` + DB-Dump reichen für Alpha/Staging.

- **Testing & CI:** Stations, die Routing, Modulverhalten oder Datenstruktur anfassen, müssen Vitest-Coverage (router/hash parsing, initModule-Verhalten, Mock-DB-Integrität) liefern. CI (GitHub Actions) führt `pnpm lint`, `pnpm build`, `pnpm test` aus.
- **Local Pflichtläufe:** Nach jeder Codeänderung sind lokal mindestens `pnpm lint`, `pnpm test` und `pnpm build` auszuführen, bevor Übergaben/Commits erfolgen. Vor Abschluss jeder Station und jedes Moduls führen Planner und Builder diese Checks gemeinsam aus, ergänzt um einen manuellen UI-Funktionstest der betroffenen Flows.

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
    - Vite-Build + VPS-Deployment vorbereitet.  
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

### Phase D — VPS Deployment

40. **Station 40 – VPS Build Preparation**
41. **Station 41 – VPS Deployment**
42. **Station 42 – VPS Smoke Test**

---

## Source: DOGULE1_PROTOCOL.md

# DOGULE1 Protocol — Agent Collaboration Rules

Purpose: operational rules for Planner (ChatGPT) and Builder (Codex). Authority hierarchy: GOVERNANCE > PROTOCOL > MASTER > STATUS. Station rules live in MASTER; progress lives in STATUS; role details live in `agents.md`.

Core rules

- One step at a time; no silent scope expansion.
- English for instructions/discussion; German for UI copy and examples.
- Planner defines scope, acceptance, verification; Builder executes only approved scope.
- No background jobs/automation without explicit gating and auditability.
- pnpm is authoritative; no migrations unless explicitly approved.
- Legacy capture artifacts (`migration/legacy/station61/capture_*`) are immutable; CI guards enforce this.

Dependencies & references

- Invariants and authority: `DOGULE1_GOVERNANCE.md`.
- Station definitions and dependencies: `DOGULE1_MASTER.md` + `Master-II-Path.md`.
- Progress ledger: `status.md`.
- Roles and interaction contract: `agents.md`.

---

## Source: DOGULE1_SECURITY_BASELINE.md

# DOGULE1 Security Baseline

Version 0 – first baseline; created in Station 57, covering the Station-52 security baseline scope plus Station-57 authz/audit/alerts. This is the canonical security baseline; future stations must extend (not replace) it.

## Scope & Principles

- Applies to all web modules (Dashboard, Kunden, Hunde, Kurse, Trainer, Kommunikation, Kalender, Finanzen, Waren, Imports, Backups/Config, future VPS/ops surfaces).
- Roles: `admin`, `staff`, `trainer`, plus pseudo-roles `system` (jobs/cron/imports/integrations) and `unauthenticated` (not logged in).
- Deny-by-default: any route/action without an explicit rule is denied. All sensitive actions require audit logging.
- Stable action IDs (`module.action_verb`) are mandatory; see `SECURITY_AUTHORIZATION_MATRIX.md` for the source-of-truth matrix (machine-readable block governs CI coverage).

## Authentication & Session Parameters (anchored)

- Hashing: PBKDF2-HMAC-SHA256, iterations=120000, salt=16 bytes, key length=32 bytes. Stored format: `pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>`.
- Token lifetimes: access=15m, refresh=7d.
- Lockout: 5 failed logins within 5 minutes → lockout for 15 minutes.
- Secrets/envs:
  - `DOGULE1_AUTH_ENABLED` (default false; feature flag for auth).
  - `DOGULE1_AUTH_SECRET` (HMAC for access tokens, required in real deployments).
  - `DOGULE1_REFRESH_SECRET` (HMAC for refresh tokens).
  - `DOGULE1_SESSION_COOKIE_NAME` (default `dogule1.sid`), cookies must be `HttpOnly`, `SameSite=Strict`, `Secure` when over TLS.
- Admin-only 2FA toggle: config flag (default off); if enabled, admin login must require 2FA assertion (implementation in later stations).
- Audit action IDs (stable): `auth.login`, `auth.refresh`, `auth.logout`, `auth.lockout`, `auth.denied`.

## Authorization Matrix (summary)

- Full matrix lives in `SECURITY_AUTHORIZATION_MATRIX.md` (machine-readable YAML + human tables).
- Roles are evaluated in order: `system` (non-human automation), then authenticated human roles (`admin`, `staff`, `trainer`), with `unauthenticated` denied except explicit public assets (currently none).
- Conditional rules must state preconditions (e.g., trainer assigned to kurs/kalender event; staff scoped to assigned customers/mandates; system acting under approved job id).
- Sensitive domains: Finanzen, Backups, Config, Imports, Kommunikation (messages/broadcasts) are locked down to admin unless explicitly allowed with conditions and mandatory audit.

## Audit & Logging Baseline

- Every write/attempt for Finanzen, Imports, Backups/Config, Kommunikation posts/messages is audited regardless of outcome (success/denied/fail).
- Required fields per audit entry:
  - `timestamp` (ISO8601 UTC)
  - `actorId` (user id or `system:<job>`), `actorRole`
  - `actionId` (stable action name)
  - `target` `{ module, id }`
  - `result` (`success` | `denied` | `error`)
  - `before` / `after` snapshots (redacted of secrets; for Finanzen values are included)
  - `requestId` / `correlationId`
  - `hashPrev` (for chain), `hashIndex`, optional `merkleRoot` for rotated segments
  - `context` (ip/userAgent for interactive, job id for system)
- Constraints:
  - Never log secrets or raw tokens; only opaque ids/hashes.
  - PII handling aligns to Station-51 PII map: audit fields may contain entity ids and coarse attributes; full address/contact data should be avoided unless necessary to evidence the action.
- Retention: minimum 180 days online, archival beyond that per ops policy; rotations keep hash-chain continuity (see Tamper-Evident Logging).

## Alerting Baseline

- Thresholds (defined in detail in `SECURITY_AUTHORIZATION_MATRIX.md` and reused by Station 62 for implementation):
  - `failed_login`: ≥5 attempts per 5 minutes per (IP,user) → ALERT.
  - `denied_action`: ≥3 denied actions per 10 minutes per actor → WARNING; ≥10 → ALERT.
  - `finanzen_mutation`: >10 mutations per 10 minutes per actor or outside business hours → WARNING.
  - `imports_failure`: any import failure → WARNING; repeated (≥3 in 1h) → ALERT.
  - `backup_failure` or `config_change` outside window → ALERT.
- Alert sinks: syslog/dev-log placeholders; escalation timing defined per severity (ALERT/CRITICAL immediate).
- Station 57 defines expectations; Station 62 will implement rate-limit + alert plumbing consistent with these thresholds.

## Tamper-Evident Logging

- Logging uses a linear hash chain per file: `hash_0 = SHA-256("seed")`, `hash_i = SHA-256(entry_i || hash_{i-1})`.
- Rotation: size- or time-based (daily or 100k entries). Each segment stores terminal hash and optional Merkle root over the segment entries to anchor integrity.
- Verification procedure:
  1. Start from `hash_0` and recompute through the window; compare terminal hash and stored Merkle root.
  2. If any mismatch → CRITICAL incident; freeze log storage, open investigation, and alert security lead.
  3. Maintain an external anchor (e.g., write segment roots to a separate read-only channel) when available.
- Hashing algorithm: SHA-256, aligning with Stations 54–56 migration checksums.

## CI Gate Expectation (for Station 60 enforcement)

- Machine-readable matrix must enumerate every route/action id; CI should fail if code references an action not present or marked anything other than `allowed|denied|conditional`.
- Deny-by-default must be enforced in code: missing entries treated as deny until explicitly added to the matrix.
- Any station introducing new routes/actions must update the matrix block; otherwise CI (introduced by Station 60) will fail.

## References

- Authorization matrix and alert thresholds: `SECURITY_AUTHORIZATION_MATRIX.md`
- PII map: Station 51 (existing governance reference; ensure alignment when logging/auditing)
- Migration tamper-evidence precedent: Stations 54–56 checksums/merkle roots

---

## Source: DOGULE1_SYSTEM_BASELINE_V2.md

# DOGULE1 System Baseline V2 — Storage, Integrity, and Migration

Single source for schemas, IDs, PII/residency, integrity rules, and migration from mock (v0) to real storage (v1).

## Entity Schemas (Mock → Target Storage)

**Base fields (all entities, v1 real):**

- `id` (uuidv7 string, required, immutable; UI prefix cosmetic)
- `code` (string, required, user-facing)
- `version` (int, required, default 0; optimistic concurrency, increments per write)
- `schemaVersion` (int, required, default 1; module schema version; mock rows hydrate with 0 then upgrade to 1)

### Kunden

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1                              |
| ------------- | ------------ | ---- | ----- | ------------ | ------------------------------------------ |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `KND-` only for readability |
| code          | string       | no   | PII-0 | unrestricted | Human-readable, editable                   |
| vorname       | string       | no   | PII-2 | local only   |                                            |
| nachname      | string       | no   | PII-2 | local only   |                                            |
| email         | string       | no   | PII-2 | local only   | Validate format                            |
| telefon       | string       | yes  | PII-2 | local only   |                                            |
| adresse       | string       | yes  | PII-2 | local only   | Street+city                                |
| notizen       | string       | yes  | PII-2 | local only   | Free text                                  |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted | Derived from real create time if missing   |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted | Set on writes                              |
| version       | int          | no   | PII-0 | unrestricted | Optimistic lock                            |
| schemaVersion | int          | no   | PII-0 | unrestricted | Module schema version tag                  |

### Hunde

| Field          | Type         | Null | PII   | Residency    | Notes / v0→v1              |
| -------------- | ------------ | ---- | ----- | ------------ | -------------------------- |
| id             | uuidv7       | no   | PII-0 | unrestricted | Display prefix `HND-` only |
| code           | string       | no   | PII-0 | unrestricted | Editable                   |
| name           | string       | no   | PII-1 | local only   | Registered name            |
| rufname        | string       | yes  | PII-1 | local only   | Call name                  |
| rasse          | string       | yes  | PII-1 | local only   |                            |
| geschlecht     | string       | yes  | PII-1 | local only   | Enum (Rüde/Hündin/?)       |
| geburtsdatum   | date         | yes  | PII-1 | local only   | ISO date                   |
| gewichtKg      | number       | yes  | PII-1 | local only   |                            |
| groesseCm      | number       | yes  | PII-1 | local only   |                            |
| trainingsziele | string       | yes  | PII-1 | local only   |                            |
| notizen        | string       | yes  | PII-1 | local only   |                            |
| kundenId       | uuidv7       | no   | PII-2 | local only   | FK to Kunden.id            |
| createdAt      | ISO datetime | yes  | PII-0 | unrestricted |                            |
| updatedAt      | ISO datetime | yes  | PII-0 | unrestricted |                            |
| version        | int          | no   | PII-0 | unrestricted |                            |
| schemaVersion  | int          | no   | PII-0 | unrestricted |                            |

### Kurse

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1                     |
| ------------- | ------------ | ---- | ----- | ------------ | --------------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `KRS-` only        |
| code          | string       | no   | PII-0 | unrestricted | Editable                          |
| title         | string       | no   | PII-1 | local only   | Course name                       |
| trainerId     | uuidv7       | no   | PII-1 | local only   | FK to Trainer.id                  |
| date          | date         | no   | PII-1 | local only   | ISO date                          |
| startTime     | HH:MM        | no   | PII-1 | local only   |                                   |
| endTime       | HH:MM        | no   | PII-1 | local only   |                                   |
| location      | string       | yes  | PII-1 | local only   |                                   |
| status        | enum         | no   | PII-0 | unrestricted | offen/geplant/ausgebucht/abgesagt |
| capacity      | int          | yes  | PII-0 | unrestricted |                                   |
| bookedCount   | int          | yes  | PII-0 | unrestricted | Derived preferred                 |
| level         | string       | yes  | PII-0 | unrestricted |                                   |
| price         | number       | yes  | PII-2 | local only   | CHF                               |
| notes         | string       | yes  | PII-1 | local only   |                                   |
| hundIds       | uuidv7[]     | yes  | PII-2 | local only   | FK to Hunde.id                    |
| kundenIds     | uuidv7[]     | yes  | PII-2 | local only   | Optional denormalized link        |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted |                                   |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                                   |
| version       | int          | no   | PII-0 | unrestricted |                                   |
| schemaVersion | int          | no   | PII-0 | unrestricted |                                   |

### Trainer

| Field            | Type         | Null | PII   | Residency    | Notes / v0→v1                 |
| ---------------- | ------------ | ---- | ----- | ------------ | ----------------------------- |
| id               | uuidv7       | no   | PII-0 | unrestricted | Display prefix `TRN-` only    |
| code             | string       | no   | PII-0 | unrestricted | Editable                      |
| name             | string       | no   | PII-1 | local only   |                               |
| email            | string       | yes  | PII-2 | local only   |                               |
| telefon          | string       | yes  | PII-2 | local only   |                               |
| notizen          | string       | yes  | PII-1 | local only   |                               |
| verfuegbarkeiten | array        | yes  | PII-0 | unrestricted | [{weekday,startTime,endTime}] |
| createdAt        | ISO datetime | yes  | PII-0 | unrestricted |                               |
| updatedAt        | ISO datetime | yes  | PII-0 | unrestricted |                               |
| version          | int          | no   | PII-0 | unrestricted |                               |
| schemaVersion    | int          | no   | PII-0 | unrestricted |                               |

### Kalender

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1              |
| ------------- | ------------ | ---- | ----- | ------------ | -------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `EVT-` only |
| code          | string       | no   | PII-0 | unrestricted | Editable                   |
| title         | string       | no   | PII-1 | local only   | Event title                |
| start         | ISO datetime | no   | PII-1 | local only   |                            |
| end           | ISO datetime | no   | PII-1 | local only   |                            |
| location      | string       | yes  | PII-1 | local only   |                            |
| notes         | string       | yes  | PII-1 | local only   |                            |
| kursId        | uuidv7       | yes  | PII-1 | local only   | FK to Kurs.id              |
| trainerId     | uuidv7       | yes  | PII-1 | local only   | FK to Trainer.id           |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| version       | int          | no   | PII-0 | unrestricted |                            |
| schemaVersion | int          | no   | PII-0 | unrestricted |                            |

### Finanzen

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1                |
| ------------- | ------------ | ---- | ----- | ------------ | ---------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `FIN-` only   |
| code          | string       | no   | PII-0 | unrestricted |                              |
| kundeId       | uuidv7       | no   | PII-2 | local only   | FK to Kunden.id              |
| kursId        | uuidv7       | yes  | PII-2 | local only   | FK to Kurse.id (optional)    |
| trainerId     | uuidv7       | yes  | PII-2 | local only   | For payouts/expenses         |
| typ           | enum         | no   | PII-0 | unrestricted | income/expense/zahlung/offen |
| betrag        | number       | no   | PII-2 | local only   | CHF                          |
| datum         | date         | no   | PII-2 | local only   |                              |
| beschreibung  | string       | yes  | PII-2 | local only   |                              |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted |                              |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                              |
| version       | int          | no   | PII-0 | unrestricted |                              |
| schemaVersion | int          | no   | PII-0 | unrestricted |                              |

### Waren

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1              |
| ------------- | ------------ | ---- | ----- | ------------ | -------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `WRN-` only |
| code          | string       | no   | PII-0 | unrestricted |                            |
| kundenId      | uuidv7       | no   | PII-2 | local only   | FK to Kunden.id            |
| produktName   | string       | no   | PII-1 | local only   |                            |
| menge         | int          | yes  | PII-0 | unrestricted | Default 1                  |
| preis         | number       | no   | PII-2 | local only   | CHF                        |
| datum         | date         | no   | PII-2 | local only   |                            |
| beschreibung  | string       | yes  | PII-1 | local only   |                            |
| createdAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| version       | int          | no   | PII-0 | unrestricted |                            |
| schemaVersion | int          | no   | PII-0 | unrestricted |                            |

### Kommunikation (Shell Only)

| Field         | Type         | Null | PII   | Residency    | Notes / v0→v1              |
| ------------- | ------------ | ---- | ----- | ------------ | -------------------------- |
| id            | uuidv7       | no   | PII-0 | unrestricted | Display prefix `COM-` only |
| code          | string       | no   | PII-0 | unrestricted |                            |
| channel       | enum         | no   | PII-0 | unrestricted | infochannel/chat/system    |
| title         | string       | no   | PII-1 | local only   | Visible subject            |
| body          | string       | yes  | PII-1 | local only   | Payload placeholder        |
| status        | enum         | no   | PII-0 | unrestricted | draft/sent/archived        |
| createdAt     | ISO datetime | no   | PII-0 | unrestricted |                            |
| updatedAt     | ISO datetime | yes  | PII-0 | unrestricted |                            |
| version       | int          | no   | PII-0 | unrestricted |                            |
| schemaVersion | int          | no   | PII-0 | unrestricted |                            |

### Inter-Entity Invariants & Compatibility Notes

- Kunden 1:N Hunde; Hunde.kundenId required and must resolve.
- Hunde N:M Kurse via Kurse.hundIds; Kunden N:M Kurse via Kurse.kundenIds (optional denorm).
- Trainer 1:N Kurse; Kurse.trainerId required.
- Trainer 1:N Kalender events; Kalender.trainerId optional but validated if present.
- Kalender event must reference either Kurs or Trainer (or both); at least one must resolve.
- Finanzen must reference Kunde; optional Kurs/Trainer must resolve when set.
- Waren must reference Kunde; optional fin/ledger link is deferred.
- v0 mock data maps missing `version`/`schemaVersion` to 0; migration upgrades to 1 while preserving IDs/codes.

## ID Strategy & Versioning

- **Format:** uuidv7 (sortable). Stored raw; UI may display cosmetic prefixes (`KND-`, `HND-`, `KRS-`, `TRN-`, `EVT-`, `FIN-`, `WRN-`, `COM-`) for readability only; never part of the ID.
- **Continuity:** IDs are immutable and never reused; mock IDs preserved via mapping table for legacy ids (`k1` → new uuid) where necessary; prefixes stable across mock → real.
- **Module schema version:** per-module integer; v1 = 1. Stored on each entity (`schemaVersion`) and in module metadata header; increments only on structural change.
- **Entity instance version:** optimistic concurrency integer; default 0, increments per successful write; writes fail on mismatch.
- **Migration tags:** mock rows default `version=0`, `schemaVersion=0`; migration stamps `schemaVersion=1`, `version=0` (preserve default) after integrity check.
- **Compatibility:** additive-only field evolution; removals require deprecation window + migration; IDs stable indefinitely.

## PII Classification & Residency

- **Model:** PII-0 (operational/metadata), PII-1 (soft personal), PII-2 (hard personal/financial).
- **Residency:** PII-2 local only; PII-1 local by default (mirror only if explicitly allowed); PII-0 unrestricted.
- **Field-level table (summary):**

| Field                                                                                                 | Module(s)     | PII     | Residency    | Notes                        |
| ----------------------------------------------------------------------------------------------------- | ------------- | ------- | ------------ | ---------------------------- |
| id, code, version, schemaVersion, createdAt, updatedAt                                                | all           | PII-0   | unrestricted | Metadata                     |
| vorname, nachname                                                                                     | Kunden        | PII-2   | local only   |                              |
| email, telefon, adresse                                                                               | Kunden        | PII-2   | local only   | Contact                      |
| notizen (Kunden)                                                                                      | Kunden        | PII-2   | local only   | Free text                    |
| name, rufname, rasse, geschlecht, geburtsdatum, gewichtKg, groesseCm, trainingsziele, notizen (Hunde) | Hunde         | PII-1   | local only   | Soft personal                |
| kundenId (Hunde)                                                                                      | Hunde         | PII-2   | local only   | Links to person              |
| title, location, level, status, notes                                                                 | Kurse         | PII-1/0 | local only   | Status = PII-0               |
| price                                                                                                 | Kurse         | PII-2   | local only   | Financial                    |
| trainerId, hundIds, kundenIds                                                                         | Kurse         | PII-2   | local only   | References to identities     |
| startTime, endTime, date                                                                              | Kurse         | PII-1   | local only   | Scheduling                   |
| notes (Kurse)                                                                                         | Kurse         | PII-1   | local only   |                              |
| name (Trainer)                                                                                        | Trainer       | PII-1   | local only   |                              |
| email, telefon (Trainer)                                                                              | Trainer       | PII-2   | local only   |                              |
| notizen, verfuegbarkeiten                                                                             | Trainer       | PII-1   | local only   | Availability considered soft |
| titel, ort, beschreibung, start, end                                                                  | Kalender      | PII-1   | local only   |                              |
| kursId, trainerId (Kalender)                                                                          | Kalender      | PII-1   | local only   |                              |
| kundeId, kursId, trainerId, typ, betrag, datum, beschreibung (Finanzen)                               | Finanzen      | PII-2   | local only   | Financial/identity           |
| produktName, menge, preis, datum, beschreibung, kundenId (Waren)                                      | Waren         | PII-1/2 | local only   | preis/kundenId = PII-2       |
| channel, title, body, status (Kommunikation)                                                          | Kommunikation | PII-1/0 | local only   | channel/status = PII-0       |

## Integrity & Consistency Rules

- **Checksums:** entity checksum = SHA-256 over canonical JSON (keys sorted, no whitespace variance); snapshot checksum = Merkle root of entity checksums per module.
- **Invariant checks:** enforce inter-entity list above; additionally ensure dates/time ranges valid (`start < end`), price/betrag non-negative, capacity ≥ bookedCount.
- **Orphan detection:** weekly scan: unresolved FK → mark entity as `invalidRef` flag, write to integrity report; auto-fix options: (a) archive entity, (b) remove broken FK, (c) block write.
- **Validation order:** schema validation → FK resolution → invariant validation → checksum → write.
- **Audit trail:** record checksum + invariant result per write in module metadata (no external system required).

## Concurrency & Locking

- **Single-writer contract:** only one writer (UI thread) mutates a module at a time; background readers allowed.
- **Optimistic concurrency:** writes include `version`; reject on mismatch and re-read before retry.
- **Lock boundary:** module-level atomic writes (per-entity collection file). No cross-module locks.
- **Multi-tab:** no guarantee; UI warns on multiple open tabs when a write occurs; last-writer wins only if invariants still satisfied.

## Atomicity, Durability & Rollback

- **Write flow:** write to temp file → fsync temp → checksum verify → atomic rename over module file → fsync parent dir.
- **Cross-module changes:** stage to shadow copies; validate combined invariants; commit all-or-revert by replacing both files only if all succeed.
- **Durability guarantee:** after success, data survives crash/power loss; checksum stored alongside payload.
- **Rollback:** on invariant failure or checksum mismatch, revert to last valid snapshot; keep rolling snapshots (see cadence).

## Failure-Injection Plan (Storage)

| Failure Type              | Injection Point                | Expected Detection                   | Expected Recovery                                          |
| ------------------------- | ------------------------------ | ------------------------------------ | ---------------------------------------------------------- |
| Write interruption        | After temp write before rename | Missing checksum or incomplete file  | Retry from last snapshot; keep partial for forensics       |
| Corrupted partial file    | After rename bypass            | Checksum mismatch on read            | Restore prior snapshot; log incident                       |
| Checksum mismatch         | Post-write verification        | Verification step fails              | Abort commit; retain prior file; alert                     |
| Broken FK                 | During validation              | FK resolver flags missing target     | Block write; offer auto-clean (archive/remove FK)          |
| Snapshot creation failure | While copying                  | Missing snapshot checksum            | Retry; if persistent, pause writes                         |
| Migration corruption      | During field mapping           | Schema/PII mismatch or checksum fail | Abort migration batch; roll back to pre-migration snapshot |

**Cadence:** Phase E weekly manual injection; Phase F scripted on each release candidate (pre-merge).

## Mock → Real Migration Mapping

- **ID continuity:** preserve existing IDs where possible; for short mock IDs (`k1`) generate uuidv7 and store mapping table {legacyId → uuidv7}; references rewrite using mapping.
- **Field rules:** undefined mock fields hydrate to defaults/null; required real fields synthesized (timestamps = migration time if absent).
- **Sanitization:** strip debug keys; normalize dates to ISO; ensure UTF-8; recompute checksums post-migration.

**Per-module mapping:**

- Kunden: {id→uuidv7 (map), code→code, vorname, nachname, email, telefon?, adresse?, notizen?, createdAt?, updatedAt?}. Add `version=1`, `schemaVersion=1`.
- Hunde: same pattern; ensure `kundenId` remapped via legacy table; add `version/schemaVersion`, backfill timestamps.
- Kurse: map `trainerId`, `hundIds`, optional `kundenIds`; backfill `status` default `offen` if missing; price default 0; timestamps added.
- Trainer: map core fields; `verfuegbarkeiten` normalized to array; timestamps added.
- Kalender: rename `title`→`titel`; `location`→`ort`; `notes`→`beschreibung`; remap `kursId`/`trainerId`; add timestamps/version tags.
- Finanzen: `zahlungen` table → Finanzen; map `kursId` optional; add `trainerId` null; ensure `betrag` number; add timestamps/version tags.
- Waren: direct mapping; default `menge=1` if missing; add timestamps/version tags.
- Kommunikation: hydrate empty shell with schema only; no legacy data.

## Backup / Checksum / Scan Cadence

| Activity                  | Cadence                                | Scope            | Notes                                                        |
| ------------------------- | -------------------------------------- | ---------------- | ------------------------------------------------------------ |
| Backup snapshot           | Daily; pre-migration; pre-version bump | All modules      | Rolling 7-day window; keep pre-migration snapshot separately |
| Write-time checksum       | Every write                            | Entity + module  | Fail write on mismatch                                       |
| Weekly deep checksum      | Weekly                                 | All modules      | Recompute Merkle roots; compare to last baseline             |
| Orphan scan               | Weekly                                 | FK relationships | Report + auto-clean options                                  |
| PII exposure scan         | Weekly                                 | All modules      | Ensure residency flags respected; no PII in logs             |
| Schema version drift scan | Weekly                                 | All modules      | Detect mixed schemaVersion; block writes until reconciled    |

---

## Source: DOMAIN_MODEL.md

# Domain Model – Dogule1 (Phase A)

Immutable IDs are system-generated and never editable. Codes are user-facing and may be overridden. Relations use internal IDs only.

## Kunden

- id (immutable), code (editierbar)
- Required: vorname, nachname, email
- Optional: telefon, adresse, notizen, createdAt, updatedAt
- Outbound: hunde (via hunde.kundenId), kurse (via kurse.kundenIds), finanzen (via finanzen.kundeId), waren (via waren.kundenId)
- Inbound: none

## Hunde

- id (immutable), code (editierbar)
- Required: name, kundenId
- Optional: rufname, rasse, geschlecht, geburtsdatum, gewichtKg, groesseCm, trainingsziele, notizen, createdAt, updatedAt
- Outbound: kurse (via kurse.hundIds), finanzen (read-only via kunde), kunden (via kunden.id)
- Inbound: kunden (kunden.id → hunde.kundenId)

## Kurse

- id (immutable), code (editierbar)
- Required: title, trainerId, date, startTime, endTime, status
- Optional: location, capacity, bookedCount, level, price, notes, createdAt, updatedAt
- Outbound: kunden (via kundenIds), hunde (via hundIds), trainer (via trainerId), kalender (via kalender.kursId), finanzen (derived per participant)
- Inbound: kunden (kundenIds → kurse.id), hunde (hundIds → kurse.id), trainer (trainer.id → kurse.trainerId)

## Trainer

- id (immutable), code (editierbar)
- Required: name
- Optional: email, telefon, notizen, createdAt, updatedAt, verfuegbarkeiten
- Outbound: kurse (via kurse.trainerId), kalender (via kalender.trainerId)
- Inbound: kurse (trainerId), kalender (trainerId)

## Kalender

- id (immutable), code (editierbar)
- Required: datum, startTime, endTime, titel
- Optional: ort, beschreibung, kursId, trainerId, createdAt, updatedAt
- Outbound: kurse (via kursId), trainer (via trainerId)
- Inbound: kurse (kursId), trainer (trainerId)

## Finanzen

- id (immutable), code (editierbar)
- Required: kundeId, typ ("zahlung" | "offen"), betrag, datum
- Optional: beschreibung, createdAt, updatedAt
- Outbound: kunden (via kundeId)
- Inbound: kunden (kundeId), waren (sales may create entries), kurse (derived links)

## Waren

- id (immutable), code (editierbar)
- Required: kundenId, produktName, preis, datum
- Optional: menge, beschreibung, createdAt, updatedAt
- Outbound: kunden (via kundenId), finanzen (sale can produce financial entry)
- Inbound: kunden (kundenId)

---

## Source: DOR_PHASES_E_TO_I.md

# Definitions of Ready (DoR) — Phases E–I

Purpose: single template set to decide when a station is ready to start. Use these for Stations 51–70 (Phases E–I).

Common usage rules

- Apply the matching phase template before starting a station.
- Log risks/assumptions in the station PR description and `status.md` (Issues/Notizen) for traceability.
- Verify upstream dependencies are green per `DOGULE1_GOVERNANCE.md` gating rules.

## Phase E — Storage Baseline & Access Layers

- Scope clarity: what storage artifacts this station must deliver.
- Dependencies cleared: upstream stations green (storage/security prerequisites).
- Risks & assumptions logged: capture in PR + `status.md`.
- Artifacts required: MASTER/STATUS updates, storage baseline docs (e.g., SYSTEM_BASELINE_V2), diagrams/tables.
- Testability: evidence such as schema/versioning docs, migration mapping, integrity/locking notes; contract test plan (if applicable).
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date: set expectation.
- Acceptance boundaries: what is explicitly out of scope.
- Exit criteria: checklist of required outputs and approvals.

## Phase F — Security Baseline & Enforcement

- Scope clarity: security artifacts (authn/authz, transport, secrets, logging).
- Dependencies cleared: storage baseline pieces in place; prior security stations green.
- Risks & assumptions logged: PR + `status.md`.
- Artifacts required: SECURITY_BASELINE, permission matrix, rate-limit/alert tables, threat-model summary.
- Testability: evidence for controls (docs, configs, planned checks); CI/policy gates if available.
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date.
- Acceptance boundaries: exclusions (e.g., no code for certain stations, or MVP-only scope).
- Exit criteria: checklist of outputs, approvals, and logging/audit hooks defined.

## Phase G — Integrations (Chats, Infochannel, Imports)

- Scope clarity: integration feature(s) and surfaces.
- Dependencies cleared: storage/security green; gating honored.
- Risks & assumptions logged: PR + `status.md`.
- Artifacts required: updates to MASTER/STATUS, Master-II-Path, relevant baselines, diagrams/flows.
- Testability: evidence such as preview/diff flows, rate-limit/audit coverage, failure/rollback paths.
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date.
- Acceptance boundaries: out-of-scope items (e.g., no attachments, recurrence deferred).
- Exit criteria: checklist of required docs, behaviors, and validations.

## Phase H — UI Tokens & Mobile Readiness

- Scope clarity: design tokens, layout patterns, accessibility/localization/performance expectations.
- Dependencies cleared: integration decisions stable; gating rules satisfied.
- Risks & assumptions logged: PR + `status.md`.
- Artifacts required: UI_GUIDE.md, MASTER/STATUS updates, component/layout references.
- Testability: evidence via screenshots/specs, a11y checks, performance budgets, responsive behavior definitions.
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date.
- Acceptance boundaries: what UI areas are excluded in this station.
- Exit criteria: checklist covering docs updated, patterns applied, and validation evidence.

## Phase I — Rollout & Operations

- Scope clarity: rollout steps, playbooks, monitoring/alerting readiness, backup/restore.
- Dependencies cleared: all gating stations green (hardening before rollout).
- Risks & assumptions logged: PR + `status.md`.
- Artifacts required: rollout plan, incident/runbooks, monitoring/alert destinations, STATUS/MASTER updates.
- Testability: evidence of drills (restore/kill switch), alert tests, rollback path.
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date.
- Acceptance boundaries: what is excluded from the rollout slice.
- Exit criteria: checklist confirming playbooks, owners, on-call, rollback, and telemetry verification steps.

---

## Source: MIGRATION_TOOLING_PLAN.md

# Migration & Integrity Tooling Plan (Stations 53–56)

## 1. Purpose & Scope

Canonical contract for mock→real migration (v0→v1) and integrity tooling. This plan cannot override `DOGULE1_SYSTEM_BASELINE_V2.md`; on conflict, baseline wins. Governs implementation for Stations 53–56 (technical sequence). Planning only; no live storage manipulation.

## 2. Sources of Truth & Inputs

- `DOGULE1_SYSTEM_BASELINE_V2.md` — schemas, invariants, ID rules, PII classification, atomicity, checksums, mock→real mapping.
- `status.md` — current station context, environment caveats, logging conventions.
- `DOGULE1_GOVERNANCE.md` — gating, conflicts, station naming.
- `DOGULE1_PROTOCOL.md` + `agents.md` — agent behavior and role contract (execution rules only).
- `Master-II-Path.md` — E/F roadmap context.
- Rule: this plan adds operational detail only; baseline remains the source of truth.

## 3. Migration Engine Architecture

Offline Node CLI (never browser/UI).

Components:

- **SourceAdapter:** strict v0 reader/validator for mock data (schema check).
- **Mapper:** pure functions per module.
- **LegacyIdRegistry:** deterministic mapping; never mutated by dry-run.
- **TargetAdapter:** atomic writes (temp → fsync → rename), checksum stamping.
- **ValidationPipeline:** schema → FK → invariants → checksum.
- **BatchRunner:** idempotent, resumable with progress logging.
- **CLI:** `dry-run`, `migrate`, `verify`, `rollback-preview`.

Constraints:

- Deterministic: same inputs + same mapping registry → identical outputs.
- Obeys baseline atomicity and write ordering.

## 4. Field-Mapping Rules (Per Module)

- Derived strictly from baseline “Mock → Real Migration Mapping”; no new mappings invented here.
- Contracts per module: `validateV0(record)`, `mapToV1(record, ctx)`, `postMapValidate(entity)`.
- No fields beyond baseline. Missing timestamps may be synthesized at migration time (document exact algorithm). No synthetic PII; only defaults permitted by baseline.

## 5. ID Continuity & Legacy-ID Mapping

- One mapping store per module (e.g., `kunden.legacyIds.json`, `hunde.legacyIds.json`, etc.).
- Raw IDs are uuidv7 only; UI prefixes are cosmetic, never part of IDs.
- Dry-run never mutates mapping stores.
- Migrate mutates mapping only when legacy→uuidv7 is needed.
- Deterministic: same registry → same outputs; FKs rewritten only via registry (no heuristics).

## 6. Version & Schema Defaults

- Each migrated entity: `schemaVersion = 1`, `version = 0`.
- Migration must not bump versions; versioning is for future storage mutations only.

## 7. Staging, Cutover & Rollback

- **Pre-migration:** full snapshot of v0 mock DB + mapping stores; prepare isolated target dir (e.g., `storage_v1_candidate/`).
- **Migration:** `dry-run` (validate, no mutations) → `migrate` (atomic writes, checksum stamping, integrity report).
- **Cutover:** allowed only when deep checksum scan (Merkle), orphan scan, and schema drift scan are green per baseline. Flip single pointer/symlink/config to v1.
- **Rollback:** flip pointer back + restore snapshot + mapping stores if any blocking failure after cutover.

## 8. Checksum Tooling Contract

- Canonical JSON: sorted keys, UTF-8, no whitespace variability.
- Entity checksum: SHA-256 over canonical JSON.
- Module checksum: Merkle root of entity checksums.
- Metadata files: `kunden.checksums.json`, `hunde.checksums.json`, etc., containing `{ entityId, hash, merkleRoot, generatedAt }`.
- Use on every write (entity) and weekly (Merkle/deep scan), matching baseline cadence.

## 9. Integrity Scanner

- Subcommands: `scan-all`, `scan-module`, `scan-pii`, `scan-drift`.
- Checks: schema validator (v1 spec), FK validator (null only if allowed), invariant validator (baseline), schema drift detector, PII-residency audit (PII-2 leakage = BLOCKER; PII-1 violations = WARNING/BLOCKER per baseline).
- Exit codes: BLOCKER → non-zero; WARNING → zero but printed.

## 10. Failure-Handling Strategy

- Severity: INFO < WARNING < BLOCKER.
- `dry-run`: no writes; no mapping mutations.
- `migrate`: abort batch on schema/PII/ID mismatch or checksum mismatch.
- Auto-fixes: only safe defaults allowed by baseline; no silent FK repair/deletion/PII modification.
- Idempotent: re-running migrate on identical state yields identical output.

## 11. Execution Order for E → F (Technical Mapping to Future Stations)

- Governance currently assigns 53–56 to auth/alert work → governance update required before implementing this sequence.
- Proposed technical sequence:
  - Technical 53: migration engine skeleton + mapper stubs + dry-run.
  - Technical 54: real storage adapters + atomic write + checksum tooling.
  - Technical 55: integrity scanner (schema/FK/invariants/PII) + CI integration.
  - Technical 56: full migration rehearsal + rollback drills + cutover playbook.

## 12. Testing & Failure-Injection Protocol

- Unit: mappers, validators, invariants, checksum functions.
- Contract tests: broken FKs, corrupted checksums, mixed schemaVersions, mapping stability (reruns consistent).
- Failure injection: mid-batch interruption → rollback → clean re-run; tampered checksum metadata → scan rejects cutover; PII-residency violations → BLOCKER.
- All scenarios must pass before any real migration.

## 13. Operational Runbook & Report Retention

- Operator role: Ops/Admin; required environment: dev, VPS-like before production.
- Reports stored under `storage_reports/<timestamp>/`: `dry-run.json`, `migration-summary.json`, `integrity-summary.json`, `checksum-report.json`; retain at least last 10 runs.
- Status logging format: `## Tests` → migrated modules + integrity outcomes; `## Issues` → BLOCKER/WARNING summary.

---

## Source: Master-II-Path.md

# Master-II Path — First Public Rollout (Stations 50+)

Purpose: concrete path from current state to first public rollout, starting at Station 50. Each station includes clear outcomes and exit criteria. Security and storage are first-class; no module ships without them. Suffix legend: `R` = lifecycle/retention, `K` = Kommunikation.

## Station 50 — Roadmap Governance & Definitions of Ready

- Outcomes: confirm station order; publish DoR templates for Phases E–I; assign owners.
- Exit: signed-off DoR format; `status.md` updated with station list; owners identified.

## Station 51 — Storage Contract Finalization (E1)

- Outcomes: canonical storage spec with schemas, IDs, versioning, PII/residency flags, integrity checks, concurrency/locking assumptions, rollback expectations, failure-injection plan.
- Exit: `DOGULE1_SYSTEM_BASELINE_V2.md` drafted; mock→real migration mapping drafted; checksum/scan cadence defined.

## Station 52 — Security Baseline Finalization (F1–F3 summary)

- Outcomes: authn/authz model, password/2FA policy, session/token rules, TLS/HSTS requirements, cookie flags, secret-storage approach, CSRF/injection defense baseline.
- Exit: `DOGULE1_SECURITY_BASELINE.md` initial version; rate-limit table skeleton; threat-model summary.

## Station 53 — Migration Engine Skeleton & Dry-Run (E2a)

- Outcomes: offline CLI skeleton with SourceAdapter, Mapper stubs per module, Legacy ID Registry design, ValidationPipeline (schema-only), BatchRunner, and dry-run command (no writes).
- Exit: deterministic dry-run reports (no mutations), mapping registry format fixed, plan wired to Station 52 baseline; idempotent behavior confirmed on sample data.

## Station 54 — Storage Adapters & Checksums (E2b)

- Outcomes: TargetAdapter with atomic write path (temp→fsync→rename), checksum tooling (entity hash + Merkle roots), integration with registry/mappers, migrate command writing v1 candidate storage.
- Exit: migration writes succeed in dev environment; checksum metadata emitted; rollback-safe temp handling validated.

## Station 55 — Integrity Scanner & CI Integration (E2c)

- Outcomes: Integrity scanner covering schema/FK/invariants/PII, schema drift detection, checksum verification; severity model (INFO/WARNING/BLOCKER); wired to CI with non-zero exit on blockers.
- Exit: scan-all/scan-module/scan-pii/scan-drift commands; CI job executes scanner; reports in machine-readable + human summary.

## Station 56 — Migration Rehearsal & Cutover Prep (E2d)

- Outcomes: full mock→real rehearsal in isolated target, rollback drill, integrity report (checksums, orphan scan, drift scan) green; cutover playbook drafted.
- Exit: documented rehearsal results, rollback validated, cutover readiness checklist approved.

## Station 57 — Authorization Matrix & Audit Plan (F2, F4)

- Outcomes: role×action matrix for Kommunikation, Kalender, imports; deny-by-default enforcement points; audit events list; alert thresholds; tamper-evident logging strategy.
- Exit: matrix published; audit+alert tables added to security baseline; CI gate defined for permission coverage.

## Station 58 — Storage Access Layer Architecture (E3)

- Outcomes: shared vs per-module access pattern; module migration order; dual-mode (mock+real) strategy; backup locations/mounts documented.
- Exit: architecture note approved; contract tests plan ready; ownership table completed.

## Station 59 — Authentication & Sessions MVP Implementation

- Outcomes: local login (admin/trainer/staff), secure password hashing, session tokens with expiry/refresh, logout/revoke, login failure/lockout handling, admin-only 2FA toggle ready.
- Exit: auth service merged behind feature flag; tests for login/lockout/expiry; secrets stored per baseline.

## Station 60 — Authorization Enforcement Layer

- Outcomes: centralized authz middleware using Station 57 matrix; deny-by-default; unauthorized UX patterns; admin-only zones enforced (infochannel post, imports, backups).
- Exit: middleware live; permission unit/contract tests; audit entries for denied attempts.

## Station 61 — Transport, Secrets, and Config Hardening

- Outcomes: TLS 1.3/HSTS configured for environments; secure cookies; CSRF defense in place; secret storage wired (vault/encrypted store); key rotation cadence documented and scheduled.
- Exit: security smoke test passes; rotation drill script/guide ready; configs free of hardcoded secrets.

## Station 62 — Logging, Rate Limits, and Alerts Foundation

- Outcomes: rate limits for login, chat send, infochannel post, import; audit logging for authn/authz, config changes; alerting hooks for failures/suspicious activity; health checks.
- Exit: limits enforced; alert destinations configured; dashboards or log review plan documented.

## Station 63 — Storage Layer Implementation (Core Entities)

- Outcomes: real storage for Kunden/Hunde/Kurse/Trainer with schema versioning, integrity checks, backup job; migration tool from mock for these entities.
- Exit: dual-mode switch works; CRUD contract tests green; backup+restore dry run.

## Station 64 — Kommunikation Module Skeleton (Read-Only)

- Outcomes: navigation/tabs (Chats, Infochannel, System); state machine (loading/empty/error/offline); list/detail shells consuming mock+real adapter; access controls applied.
- Exit: UI skeleton merged; authz enforced; logging for navigation/filter actions.

## Station 65 — Groupchat Core

- Outcomes: single groupchat room backed by storage; ordering/retention rules; per-user read markers; send/retry/backoff behavior; notifications inside Kommunikation; rate limits enforced.
- Exit: end-to-end send/read in test; audit on sends; unread counts accurate after refresh.

## Station 66R — Groupchat Retention Enforcement

- Outcomes: enforce retention/purge for global groupchat according to policy; prune TTL-violating messages deterministically; audit deletions with hash chain; SLA alerts for retention job failures; read markers stay consistent post-prune.
- Exit: retention job runs/dry-run tested; audit entries emitted; unread counts stable after prune; alerts fire on failures/missed runs.

## Station 67K — Infochannel with Confirmation Flow

- Outcomes: admin-only posting, targeting rules, confirmation UX for trainers, escalation/reminders, audit trail, rate limits; optional comments policy enforced (default: none).
- Exit: admin can post; trainers confirm; late confirmations visible; alerts for missing confirms after SLA.

## Station 70 — Storage & Security Hardening Pass

- Outcomes: failure-injection run on storage; restore drill; secret rotation drill; audit/log integrity check; permission and rate-limit review after integrations.
- Exit: drills documented; issues fixed; sign-off for public exposure candidate.

## Station 71 — UI Design Tokens & Layout Application (Core Screens)

- Outcomes: apply design tokens/layout primitives to Dashboard + Kommunikation; accessibility pass (keyboard/contrast); performance budgets; localization-ready formatting.
- Exit: UI conforms to `UI_GUIDE.md`; empty/error states consistent; lint/CI checks for a11y.

## Station 72 — Mobile Readiness (Kommunikation + Dashboard)

- Outcomes: breakpoints; bottom navigation; touch targets; simplified views; offline-read scope for chat history/schedule; offline error UX.
- Exit: responsive views verified on phone/tablet; cache/eviction rules implemented; auth/session flows verified on mobile.

## Station 73 — Rollout Prep & Playbooks

- Outcomes: incident playbook validated; monitoring/alert runbook; kill switches tested (imports); rate-limit tuning; final risk review.
- Exit: go/no-go checklist green; owners on-call assigned; rollback plan written.

## Station 74 — Public Rollout (V1)

- Outcomes: staged rollout to initial users; telemetry verification; support channel live; rapid patch path defined.
- Exit: rollout completed or halted with documented reasons; status logged in `status.md`.

---

## Source: README.md

# Dogule1 - Management App for Dog Schools

## Purpose

Dogule1 ist eine modulare Verwaltungs-App fuer Hundeschulen mit Dashboard und Modulen fuer Kommunikation, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen und Waren. Ziel ist eine lokale Alpha-Version (V0.1) mit spaeterem VPS-Rollout (Contabo).

## Quick Start

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
```

## Canonical Docs

- `status.md` - progress ledger and station history.
- `DOGULE1_GOVERNANCE.md` - authority, invariants, gating.
- `DOGULE1_PROTOCOL.md` - agent collaboration rules.
- `agents.md` - Planner vs Builder roles.
- `Master-II-Path.md` - stations 50+ roadmap.
- `DOGULE1_MASTER.md` - architecture baseline and station definitions.
- `DOGULE1_SYSTEM_BASELINE_V2.md` - storage, integrity, migration rules.
- `DOGULE1_SECURITY_BASELINE.md` and `SECURITY_AUTHORIZATION_MATRIX.md` - security baseline and auth matrix.

## Dev Notes

- Vite app lives in `apps/web` and is the only runtime entry.
- Hash routes: `#/dashboard`, `#/kunden`, `#/hunde`, `#/kurse`, `#/trainer`, `#/kalender`, `#/finanzen`, `#/waren`, `#/kommunikation`.
- UI copy is German; instructions and docs are English unless noted.

---

## Source: SECURITY_AUTHORIZATION_MATRIX.md

# Security Authorization Matrix (Station 57)

Source of truth for role × action permissions, audit expectations, and alert hooks. Deny-by-default applies; any action not listed here is denied.

## Machine-Readable Matrix (source for CI)

```yaml
version: 1
roles:
  - unauthenticated
  - system
  - admin
  - staff
  - trainer
actions:
  - id: auth.login
    module: auth
    description: Interactive login
    roles:
      admin: allowed
      staff: allowed
      trainer: allowed
      system: denied
      unauthenticated: allowed
    preconditions:
      - Account must be active; lockout blocks login.
    audit: always
    alerts: failed_login

  - id: auth.refresh
    module: auth
    description: Refresh access token
    roles:
      admin: allowed
      staff: allowed
      trainer: allowed
      system: denied
      unauthenticated: denied
    preconditions:
      - Valid refresh token, not revoked, not expired.
    audit: always
    alerts: denied_action

  - id: auth.logout
    module: auth
    description: Logout/revoke session
    roles:
      admin: allowed
      staff: allowed
      trainer: allowed
      system: conditional
      unauthenticated: denied
    preconditions:
      - System may revoke sessions it owns (job cleanup).
    audit: always
    alerts: denied_action

  - id: auth.lockout
    module: auth
    description: Account lockout triggered after failed attempts
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - Triggered automatically by auth service after threshold.
    audit: always
    alerts: failed_login

  - id: auth.denied
    module: auth
    description: Denied auth attempt (invalid/expired token, lockout)
    roles:
      admin: allowed
      staff: allowed
      trainer: allowed
      system: allowed
      unauthenticated: allowed
    preconditions:
      - N/A (represents failure events).
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.view_thread
    module: kommunikation
    description: View chat threads/messages
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: conditional
      unauthenticated: denied
    preconditions:
      - staff must be assigned to the customer/channel.
      - trainer must be a participant or assigned to related kurs/hund.
      - system limited to delivery/archiver job ids.
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.send_message
    module: kommunikation
    description: Post/send chat message
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - staff: assigned to customer/channel.
      - trainer: participant or assigned trainer.
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.edit_own_message
    module: kommunikation
    description: Edit own chat message
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: denied
      unauthenticated: denied
    preconditions:
      - Only author may edit; time-boxed (tbd in Station 60).
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.delete_own_message
    module: kommunikation
    description: Delete own chat message
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: denied
      unauthenticated: denied
    preconditions:
      - Only author; keep tombstone; moderation retains audit trail.
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.moderate_delete
    module: kommunikation
    description: Moderator removal of any message
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - Staff only if granted moderation scope; system only for automated abuse filters.
    audit: always
    alerts: denied_action

  - id: kommunikation.groupchat.retention.prune
    module: kommunikation
    description: Retention pruning for groupchat messages
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only (system:retention) with retention enabled.
    audit: always
    alerts: denied_action

  - id: kommunikation.groupchat.retention.prune.noop
    module: kommunikation
    description: Retention pruning noop event
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only (system:retention) with retention enabled or prune disabled.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.publish
    module: kommunikation
    description: Publish infochannel notice
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - Admin-only in MVP.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.view
    module: kommunikation
    description: View infochannel notices
    roles:
      admin: allowed
      staff: conditional
      trainer: allowed
      system: conditional
      unauthenticated: denied
    preconditions:
      - Trainers see only notices targeted to them.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.confirm
    module: kommunikation
    description: Confirm infochannel notice
    roles:
      admin: denied
      staff: denied
      trainer: allowed
      system: denied
      unauthenticated: denied
    preconditions:
      - Trainer must be targeted by the notice.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.sla.run
    module: kommunikation
    description: Run SLA reminder/escalation job for infochannel
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only with service credentials.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.reminder
    module: kommunikation
    description: Emit reminder events for pending infochannel confirmations
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.escalation
    module: kommunikation
    description: Emit escalation events for overdue infochannel confirmations
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only.
    audit: always
    alerts: denied_action

  - id: kalender.view_day
    module: kalender
    description: View day schedule
    roles:
      admin: allowed
      staff: allowed
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - Trainer sees only assigned events.
    audit: success-only

  - id: kalender.view_week
    module: kalender
    description: View week schedule
    roles:
      admin: allowed
      staff: allowed
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - Trainer sees only assigned events.
    audit: success-only

  - id: kalender.create_event
    module: kalender
    description: Create calendar event
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - Staff only within assigned modules/customers.
      - Trainer only for own courses.
    audit: always
    alerts: denied_action

  - id: kalender.update_event
    module: kalender
    description: Update calendar event
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - Same as create; cannot reassign trainer without permission.
    audit: always
    alerts: denied_action

  - id: kalender.delete_event
    module: kalender
    description: Delete calendar event
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - Staff only if creator/owner and no active participants; system only for sync/cleanup.
    audit: always
    alerts: denied_action

  - id: imports.start
    module: imports
    description: Start import job
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System must use approved job id; dry-run preferred first.
    audit: always
    alerts: imports_failure

  - id: imports.dry_run
    module: imports
    description: Dry-run import
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job id allowlist.
    audit: always
    alerts: imports_failure

  - id: imports.cancel
    module: imports
    description: Cancel running import
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - System only if owns the job.
    audit: always
    alerts: imports_failure

  - id: imports.view_status
    module: imports
    description: View import status/logs
    roles:
      admin: allowed
      staff: allowed
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions: []
    audit: success-only

  - id: finanzen.list_entries
    module: finanzen
    description: List finance entries
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: denied
      unauthenticated: denied
    preconditions:
      - Staff only for assigned customers/mandates.
      - Trainer only for own kurs/trainer revenue view.
    audit: always

  - id: finanzen.view_entry
    module: finanzen
    description: View finance entry
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: denied
      unauthenticated: denied
    preconditions:
      - Same as list_entries.
    audit: always

  - id: finanzen.create_entry
    module: finanzen
    description: Create finance entry
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - Staff allowed only for assigned scope and template-based inputs.
    audit: always
    alerts: finanzen_mutation

  - id: finanzen.update_entry
    module: finanzen
    description: Update finance entry
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - Staff allowed only for assigned scope; dual-control recommended.
    audit: always
    alerts: finanzen_mutation

  - id: finanzen.delete_entry
    module: finanzen
    description: Delete finance entry
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - None (admin-only).
    audit: always
    alerts: finanzen_mutation

  - id: finanzen.export_report
    module: finanzen
    description: Export finance data/report
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - Staff only for assigned scope; outputs redacted of PII where possible.
    audit: always
    alerts: denied_action

  - id: backups.run_backup
    module: backups
    description: Run backup job
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job id allowlist.
    audit: always
    alerts: backup_failure

  - id: backups.restore_backup
    module: backups
    description: Restore from backup
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - System only for automated recovery drills with approval token.
    audit: always
    alerts: backup_failure

  - id: config.view_settings
    module: config
    description: View operational configuration
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions: []
    audit: success-only

  - id: config.update_settings
    module: config
    description: Update operational configuration
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - System only via controlled rollout jobs.
    audit: always
    alerts: config_change
```

## Human-Readable View (selected highlights)

- **Deny-by-default**: any action not listed above is denied.
- **Unauthenticated**: no access to app data; may only reach login/static assets (not shown in matrix).
- **System role**: allowed only for defined jobs (imports, backups, calendar sync); must carry job id for audit.
- **Finanzen**: admin-only for destructive operations; staff limited to scoped create/update; trainer read-only for own revenue.
- **Kommunikation**: admin/staff moderate; trainers limited to participant channels.
- **Kalender**: trainer scoped to own events; staff scoped to assignments; deletes restricted.
- **Imports/Backups/Config**: admin/system only; cancellations/restores are audited and alert-worthy.

## Preconditions (reference)

- **Assigned scope**: staff actions require assignment to the customer/mandate/module; trainers require ownership/assignment to kurs/hund.
- **System job allowlist**: system actions must carry a known job id and be executed with service credentials.
- **Dual-control (recommended)**: high-risk finance updates and config changes should require secondary approval (to be implemented in later stations).

## Audit & Alerts Summary (alignment)

- Audit required for all writes and for any action marked `audit: always`; success-only actions may be logged at lower verbosity but still chained.
- Alert hooks correspond to thresholds in `DOGULE1_SECURITY_BASELINE.md` (failed_login, denied_action, finanzen_mutation, imports_failure, backup_failure, config_change).

## CI Gate Expectation

- This YAML block is the source for future CI (Station 60): every route/action in code must map to an entry here; missing entries or invalid states (`allowed|denied|conditional` only) will fail CI once the gate is implemented.
- Any station that adds/changes routes/actions must update this block to keep CI green.

---

## Source: STATION56_REHEARSAL_REPORT.md

# Station 56 Rehearsal Report

## Run Metadata

- Run ID: `run-local`
- Candidate path: `storage_candidate/v1/`
- Date: 2025-12-08T16:14:20+01:00
- Operator: Codex
- Inputs: Mock DB (`modules/shared/api/db/index.js`) + registries (`migration/mapping/*.json`)

## Commands Executed

- `node tools/migration/cli.js dry-run`
- `node tools/migration/cli.js migrate`
- `node tools/migration/cli.js scan-all`
- Determinism check: `diff -r storage_candidate/v1-run1 storage_candidate/v1` (second run after clean slate)
- Rollback drill: `MIGRATE_FAIL_AFTER_MODULE=kurse node tools/migration/cli.js migrate` (expected failure; verified cleanup), followed by clean rerun of dry-run → migrate → scan-all

## Findings

- Dry-run blockers: none (report in `storage_reports/latest-dry-run/`)
- Migrate status: success (atomic temp-root → rename, candidate confined to `storage_candidate/v1`)
- Scan summary: BLOCKER=0 / WARNING=0 (`storage_reports/latest-scan/summary.json`)
- Checksums/Merkle: match (per-module entities + merkle roots validated by scan)
- Drift/Orphans: none flagged (drift check part of scan-all)
- PII audit: none flagged in scan-all
- Determinism: yes — two migrations from clean state produced byte-identical trees (`diff -r` empty)
- Rollback drill: injected failure after module `kurse` removed temp root; no `storage_candidate/v1` left behind; subsequent clean rerun succeeded

## Hashes (per module)

- kunden: `e4237d4037d4f4d17abee96a225bf27aa9e12fd6374748221d36d12e5159317d`
- hunde: `66740e0dbc789e1dd1aff25e33715d1aed3be820d9ad77c71a8d099ea5b2c511`
- kurse: `85c4ff570202bced63cd4f039151fea07dbae8e0a5764c081e337d3ef75048dd`
- trainer: `5a797283c0dc99af621de330486eb59fa3633a1edc67a39f7b99ed3308342437`
- kalender: `4003596907966c91f5dbc780d8208f6b720fe22e60b18291ebc632b111a08ef2`
- finanzen: `b27976743b4f76d8287831f4a532957f15b1be63efef7e9efe22179aa015d1aa`
- waren: `297c65996d46baf84ec01c4bc5e77849276702bf9f280f7211c7dcdc83b7e7b0`
- kommunikation: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

## Issues

- None. Known/accepted warning: Node notes missing `"type": "module"` in package.json (unchanged).

## Next Actions

- Keep registries aligned with approved UUIDs before real cutover.
- Finalize cutover playbook with environment-specific pointer flip and validation checklists.

---

## Source: STATION58_STORAGE_ACCESS_LAYER_ARCHITECTURE.md

# Station 58 — Storage Access Layer Architecture (E3)

Authoritative specification for the Storage Access Layer (SAL) that will replace the mock DB and provide a unified interface to candidate/real storage. No code changes in this station.

## Dual-Mode Switch (required)

- Env var: `DOGULE1_STORAGE_MODE=mock|real`
- Defaults: dev → `mock`; CI → `real` when candidate fixtures exist (`/storage_candidate/v1`), else fail fast.
- SAL must route **all** storage operations through this flag.
- Real mode uses Station-54/56 atomic write path (temp → fsync → rename).
- Every write in real mode triggers an integrity scan (Station 55). No silent fallback to mock.
- If `DOGULE1_STORAGE_MODE=real` but `/storage/v1` (or `/storage_candidate/v1` for fixtures) is absent → fail fast.

## SAL Configuration Location (single source)

- File: `modules/shared/storage/config.js` (to be created in implementation stations).
- Holds:
  - `DOGULE1_STORAGE_MODE` resolution.
  - Absolute storage paths: real `/storage/v1`, candidate `/storage_candidate/v1`.
  - References to authz/audit injector interfaces (see below).
- All SAL modules import this config; no duplicate env parsing elsewhere.

## AuthZ + Audit Inputs (Station 57 integration)

- SAL does **not** do role logic, but requires these inputs on every call:
  - `actionId` (from Station 57 matrix, e.g., `finanzen.update_entry`).
  - `actorId`, `actorRole`.
- Enforcement at SAL boundary:
  - Deny-by-default: if authz middleware did not provide explicit permission resolution, SAL rejects the call.
  - Audit emission: every write attempt (success, denied, or failed) must trigger an audit entry containing `actionId`, `actorId/actorRole`, target, result, before/after, `hashPrev`, `hashIndex` (required), optional `merkleRoot`, `requestId`, and context (e.g., jobId/ip). Hooks are passed explicitly (arguments), not via globals.

## Migration Order (with rationale)

1. Kunden — root entity; no FK dependencies.
2. Hunde — depends on Kunden.
3. Trainer — independent, required by Kurse.
4. Kurse — depends on Hunde + Trainer.
5. Kalender — derived from Kurse (events sync).
6. Finanzen — depends on Kurs/Trainer, optional Kunden fallback.
7. Waren — weakest dependencies.
8. Kommunikation — waits for auth/session/logging (Stations 59–62).

This order avoids FK invalidation during cutover.

## Storage Layout

- Candidate storage (migration pipeline): `/storage_candidate/v1/...` — produced by Stations 53–56. SAL **never writes** here.
- Real storage: `/storage/v1/<module>/data.jsonl` (+ checksums). Used in real mode only.
- Backups (trigger-only): `/storage/backups/{daily,weekly,manual}/`. SAL raises backup events; actual backup jobs handled in Stations 61 & 63. Backups do not interact with mock mode.

## SAL Responsibilities vs Non-Responsibilities

**Must do:**

- Normalize/validate inputs; enforce `schemaVersion=1`.
- Increment `version` on writes.
- Enforce deny-by-default with provided `actionId/actor`.
- Route errors into typed categories: `NotFound`, `InvalidData`, `InvariantViolation`, `Denied`, `StorageError`.
- Trigger integrity scan on real-mode writes.
- Emit audit hooks for all writes (success/denied/error).

**Must NOT do:**

- Derive business logic (e.g., calendar sync).
- Mutate unrelated modules.
- Perform UI-level validation.
- Manage backups directly.

## Interface Model (baseline)

- Common ops: `getById`, `list`, `query`, `create`, `update`, `delete`.
- Entity helpers: `listByKundenId`, `listByHundId`, `listByTrainerId`, `updateParticipants`, etc., mirroring module needs.
- Real mode reads/writes canonical JSONL as defined in Stations 54–56; never return raw storage objects—only validated entities.

## Contract Tests (must exist before SAL code merges)

6.1 CRUD contract: create→getById byte-identical; update increments version; invalid FK → `InvariantViolation`; delete passes integrity scan.  
6.2 Parity: run CRUD tests in mock and real; compare entity hashes (serialization parity), not just deep equality.  
6.3 Error fidelity: distinct errors for `NotFound`, `InvalidData`, `InvariantViolation`, `Denied`, `StorageError`.  
6.4 Audit-hook: any write attempt emits an audit entry with chain fields (`hashPrev`, `hashIndex`); missing hook = test failure.  
6.5 Performance baseline: list ops stable for <5k rows (document expectation; no tuning yet).

## Ownership Table (incl. system actors)

| Module/Actor                               | SAL functions                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Kunden                                     | create, update, delete, list, getById                                                                      |
| Hunde                                      | create, update, delete, list, getById, listByKundenId                                                      |
| Kurse                                      | create, update, delete, list, getById, listByHundId, updateParticipants                                    |
| Trainer                                    | create, update, delete, list, getById, listByTrainerId (for Finanzen/Kalender)                             |
| Kalender                                   | derived via Kurse: create/update/delete events through course operations                                   |
| Finanzen                                   | create/update/delete/list with invariant checks                                                            |
| Waren                                      | CRUD + optional link to Kunden                                                                             |
| Kommunikation                              | late-stage, read/write threads/messages after auth/logging ready                                           |
| System jobs (imports/backups/config/tasks) | May call SAL in real mode only; must pass `actionId` for the system action, include jobId in audit context |

## Implementation Notes (for future stations)

- SAL default mode: mock for dev; CI real when fixtures exist; production real only. Absence of expected storage → fail fast.
- Integrity scan is an internal SAL hook (not user-triggered) for real writes.
- Config and authz/audit hooks are injectable; no global state.
- Any new module or action must update the machine-readable matrix (Station 57) and SAL config; CI (Station 60) will enforce coverage.

---

## Source: UI_GUIDE.md

# UI Guide (Draft)

Purpose: placeholder for UI tokens, layout rules, and a11y expectations. This will be expanded in Station 71.

Scope (planned)

- Design tokens (colors, typography, spacing, radii, shadows).
- Layout primitives (page shells, cards, tables, forms, empty/error states).
- Accessibility baseline (contrast, keyboard, focus states).
- Localization formatting rules for dates, times, and numbers (German UI).

References

- `Master-II-Path.md`
- `DOR_PHASES_E_TO_I.md`

---

## Source: agents.md

# agents.md — Roles & Interaction Contract

Purpose: minimal, authoritative definition of Planner vs Builder behavior.

Roles

- Planner (ChatGPT): defines scope and acceptance, sequences stations, approves plan changes, specifies verification. Does not execute code.
- Builder (Codex): executes approved scope only, implements code/docs, runs tests, reports results. Does not change scope without Planner approval.

Interaction rules

- One step at a time; no silent scope expansion or background tasks.
- Station work happens on station-specific branches (`feature/stationXX-name`).
- UI/UX text in German; instructions/discussion in English.
- Blockers are reported immediately with proposed options; no speculative changes.
- Legacy captures are immutable; pnpm is authoritative; migrations require explicit approval.

Context sources

- Authority/invariants: `DOGULE1_GOVERNANCE.md`.
- Agent behavior: `DOGULE1_PROTOCOL.md`.
- Station definitions: `DOGULE1_MASTER.md`, `Master-II-Path.md`.
- Progress ledger: `status.md`.

---

## Source: migration/legacy/station61/capture_20251219_185854Z/README.md

Station 61 raw legacy snapshot (DogTabs).
This folder is immutable and input-only; tooling and humans must not edit or regenerate files after commit.
Raw filenames and directory structure are preserved exactly as received.

captureId: capture_20251219_185854Z
capturedAt (UTC): 2025-12-19T18:58:54Z

---

## Source: modules/shared/api/README.md

# Shared API & Storage Notes

- Storage/PII/ID rules are defined centrally in `DOGULE1_SYSTEM_BASELINE_V2.md` (uuidv7 IDs with cosmetic prefixes, PII residency, invariants, migration).
- Mock data lives in `modules/shared/api/db/index.js`; align fields and PII tags with the baseline. Add `version`/`schemaVersion` defaults when extending data.
- Integrity/ID mapping/migration tooling should hook here; do not introduce module-local mock arrays.

---

## Source: modules/shared/components/README.md

# Shared UI Components

This directory contains reusable UI building blocks used across Dogule1 modules. Each component exposes:

- A template snippet in `templates.html`.
- Companion styles in `components.css`.
- Optional JS helpers in `components.js`.

Import the CSS via `@import "./components/components.css";` inside `modules/shared/shared.css`, and load templates/JS as needed per module.

---

## Source: tools/migration/README.md

# Migration Tooling (Station 53 Skeleton)

Scope for Station 53 (E2a):

- Offline Node CLI only (no browser/UI).
- Dry-run command only; no writes to storage or mapping registries.
- Deterministic outputs: canonical JSON, fixed report location `storage_reports/latest-dry-run/` (overwritten each run).
- Read-only mapping registry format frozen: files under `migration/mapping/<module>.json`, each an array sorted by `legacyId` with objects `{ "legacyId": string, "targetUuid": string, "version": 1 }`. Dry-run never mutates these.

Components (skeleton):

- `cli.js`: entry point wiring `dry-run`.
- `sourceAdapter.js`: iterates mock data (v0) and validates schema shape.
- `mapper.js`: per-module stubs; sets defaults (schemaVersion=1, version=0), flags missing mappings; no writes.
- `registry.js`: loads mapping registries read-only; deterministic lookups; errors if mapping absent.
- `canonicalJson.js`: stable serializer (sorted keys/arrays, LF, UTF-8).
- `reporter.js`: writes `storage_reports/latest-dry-run/dry-run.json` + summary; no timestamps in filenames.
- `validation.js`: schema-level validation only in 53; FK/invariant hooks stubbed for later stations.
- `batchRunner.js`: processes modules deterministically; no checkpoints written in 53 (resume design deferred).

Deferred to later stations:

- Actual migration writes, checksum/atomic path, FK/invariant enforcement, registry mutation, checkpoints, cutover/rollback.

---

## Source: tools/migration/STATION54_IMPLEMENTATION_PLAN.md

# Station 54 — Storage Adapters & Checksums (E2b) Implementation Layout

Purpose: execution blueprint for Station 54. No runtime changes; offline tooling only. Must align with `DOGULE1_SYSTEM_BASELINE_V2.md`, `MIGRATION_TOOLING_PLAN.md`, governance (53→54→55→56 chain), and status (Station 53 must land before persistent writes).

## Target Storage Layout (Candidate Only)

- Root: `storage_candidate/v1/` (override via CLI `--output-dir`).
- Per-module payload: `storage_candidate/v1/<module>/data.jsonl` (one canonical JSON object per line).
- Per-module checksums:
  - `storage_candidate/v1/<module>/checksums/entities.jsonl` — `{ id, hash }` per entity.
  - `storage_candidate/v1/<module>/checksums/merkle.json` — `{ module, ordering: "id", leaves: [{ id, hash }], root }`.
- Run metadata: `storage_candidate/v1/checksums/run.json` — `{ runId, generatedAt, modules: [{ name, root }], globalRoot? }`.
- Empty modules: write empty data.jsonl and merkle.json with `leaves: []` and `root` = SHA-256 of empty string.

## TargetAdapter Contract (54 scope)

- API: `beginBatch({ module, runId, outputDir })`, `writeEntity({ module, entity })`, `commitBatch()`, `abortBatch()`.
- Atomic write: temp file per module → fsync temp → fsync parent dir → rename to final path. Abort cleans temps.
- All writes confined to candidate root; never touch app runtime or mock DB.
- Uses canonical JSON from Station 53 for entity serialization and hashing.

## Checksums (Entity + Merkle)

- Algorithm: SHA-256 over canonical JSON (sorted keys/arrays, LF, UTF-8).
- Entity hash: `hashEntity(canonicalJson(entity))`.
- Merkle ordering: entities sorted by `id` (uuid). Leaves = ordered entity hashes; root computed deterministically. Empty module root = SHA-256 of empty string.
- Global root (optional): Merkle over module roots; include when available in `run.json`.

## Registry & Mapper Integration

- Read registry files only: `migration/mapping/<module>.json`, array `{ legacyId, targetUuid, version }` sorted by `legacyId`.
- No mutations to registry in 54. If gaps detected, emit proposal artifacts under `storage_candidate/v1/registry_candidate/<module>.json` with same shape; do not overwrite real registry.
- Pipeline for `migrate`: SourceAdapter → ValidationPipeline (schema-only) → Mapper → TargetAdapter (+ checksums) → Report.

## CLI Behavior

- Extend Station-53 CLI with `migrate`:
  - Flags: `--all-modules` or `--module <name>` (repeatable), `--output-dir <path>` default `storage_candidate/v1`, `--run-id <string>` (if absent, use deterministic placeholder `run-local`), `--dry-run` retains Station 53 behavior.
- Reports: deterministic paths under `storage_reports/latest-migrate/` (overwrite each run), filenames without timestamps. Report includes: modules processed, entities written, candidate path, per-module roots, optional global root, anomalies (schema/mapping issues).
- No writes outside `output-dir`; registry files remain untouched.

## Validation Scope (Station 54)

- Enforce schema-level checks as in Station 53 (required fields/nullability/types). FK/invariant/PII checks remain stubbed for Station 55.
- Version defaults enforced: `schemaVersion=1`, `version=0`.

## Filesystem & Safety Constraints

- Fsync temp file and parent dir before rename; abort removes temps.
- All candidate output paths added to `.gitignore`.
- No interaction with app runtime storage, CI configs, or production paths.

## Tests & Acceptance (to be executed during Station 54)

- Unit: TargetAdapter temp→fsync→rename, abort cleanup; checksum builder determinism (entity hash/Merkle ordering, empty-module root).
- Integration: `migrate --module kunden --output-dir ./tmp-migrate-test --run-id test` on sample mock data; assert candidate files are valid JSONL, checksums deterministic across two runs, no files outside candidate root.
- Manual: one end-to-end migration of known mock dataset into fresh candidate dir; verify layout, checksum files, report counts vs source.
- Status exit must note: branch/PR, atomic write semantics validated, checksum metadata deterministic, writes confined to candidate storage, runtime untouched.

---

## Source: tools/migration/STATION55_IMPLEMENTATION_PLAN.md

# Station 55 — Integrity Scanner & CI Integration (E2c) Implementation Layout

Purpose: execution blueprint for Station 55. Offline integrity scanner plus CI wiring, aligned with `DOGULE1_SYSTEM_BASELINE_V2.md`, `MIGRATION_TOOLING_PLAN.md`, and governance chain (53 → 54 → 55 → 56). No migration writes, no cutover.

## Scope

- Read-only scanner over candidate v1 storage produced by Station 54 (default `storage_candidate/v1/`).
- Checks: schema validation (v1), FK resolution, invariants, PII-residency audit, schema drift, checksum verification (entity + Merkle).
- CLI commands with deterministic outputs and exit codes; CI job fails on BLOCKER.
- Reports only; no registry or storage mutation.

## CLI & Commands

- Entry extends existing migration CLI with:
  - `scan-all` (all modules).
  - `scan-module --module <name>` (repeatable).
  - `scan-pii` (PII audit only).
  - `scan-drift` (schemaVersion drift only).
  - `verify-checksums` (recompute entity/Merkle and compare to stored sidecars; not part of `scan-all`).
- Flags:
  - `--input-dir <path>` default `storage_candidate/v1`.
  - `--modules <list>` optional, else all modules.
  - `--run-id <string>` optional; default deterministic `scan-local`.
- Outputs: deterministic report directory `storage_reports/latest-scan/` (overwrite per run), files:
  - `scan.json` machine-readable: entries `{ module, entityId: string|null, checkType, severity, message, autoFixPossible }`; `entityId` is null for module-level checks (e.g., schemaVersion drift).
  - `summary.json` with counts per severity/module + checksum status.
  - Optional `pii.json`, `drift.json` for filtered runs.
- No timestamps in filenames; use ISO string inside reports if needed.

## Validation Rules

- Schema: enforce required fields/types/nullability per baseline; `schemaVersion` must equal 1; `version` present (>=0).
- FK: resolve via registry mapping (target UUIDs) and candidate data:
  - kundenId/hundIds/kundenIds/kursId/trainerId as per module rules.
  - Missing target = BLOCKER unless field is optional in baseline.
- Invariants: from baseline (non-negative betrag/preis, start < end, capacity ≥ bookedCount, required associations like course requires trainer, calendar requires kurs or trainer).
- PII residency: PII-2 fields must only appear in approved modules/files; no PII in logs/checksum metadata; leak = BLOCKER. PII-1 violations → WARNING unless baseline marks stricter.
- Schema drift: any entity with `schemaVersion` ≠ 1 → BLOCKER; mixed versions flagged.
- Checksums: recompute entity hashes (canonical JSON, SHA-256) and Merkle roots (sorted by id). Mismatch = BLOCKER. Empty module root = SHA-256 of empty string.

## Severity & Exit Codes

- Severity: INFO < WARNING < BLOCKER.
- Exit rule: if any BLOCKER → exit 1; else exit 0 (warnings printed, non-blocking).

## CI Integration (Station 55 scope)

- Add CI job that runs `node tools/migration/cli.js scan-all --input-dir <path>` against a known candidate fixture (path configurable).
- CI fails on BLOCKER; warnings surfaced in logs.
- No writes in CI except reports in workspace; ensure reports path ignored by git.

## Data & Paths

- Default input: `storage_candidate/v1/` (read-only).
- Reports: `storage_reports/latest-scan/` (overwrite per run, gitignored).
- Registry: `migration/mapping/<module>.json` read-only; no proposals written in 55.
- No touching app runtime storage or mock DB.

## Tests (to execute in Station 55)

- Unit:
  - Schema validator (required fields, nullability, schemaVersion).
  - FK validator with registries and candidate data.
  - Invariant checker (date/time ordering, numeric constraints).
  - Checksum verifier (entity/Merkle determinism; empty module root).
  - PII audit (flag PII-2 leak to non-allowed files).
- Integration:
  - Scan over sample candidate tree produced from mock data; expect zero BLOCKER when data is consistent.
  - Tamper checksum sidecar → expect BLOCKER on `verify-checksums`.
  - Introduce FK break → BLOCKER; mixed schemaVersion → BLOCKER.
- Determinism: identical runs produce identical reports given same input.

## Non-Goals (defer to Station 56)

- No migration writes or registry mutation.
- No cutover/rollback drills or playbook.
- No changes to app runtime consumption of v1 storage.

## Status/Logging Expectations

- `status.md` entry should record branch/PR, commands run, summary of findings (BLOCKER/WARNING counts), and confirm reports confined to `storage_reports/latest-scan/` with no runtime storage touched.

---

## Source: tools/ops/STATION62_LOGGING_ALERTS_EVENT_SCHEMA.md

# Station 62 — Canonical Logging & Alert Event Schema

This document defines the single, canonical JSON event shape for all logs and alert signals. It encodes the severity ladder, required fields, optional fields, and hard rules for privacy and overload handling. All emitters must use this shape; any deviation is invalid.

## Severity Ladder & Mapping

- `level`: `debug | info | warning | alert | critical`
- `severity`: `INFO | WARNING | ALERT | CRITICAL`
- Mapping is 1:1 (`warning` → `WARNING`, `alert` → `ALERT`, etc.).

## Required Fields

- `ts` — ISO-8601 UTC timestamp (string)
- `level` — one of the values above
- `severity` — one of the values above (mapped to `level`)
- `actionId` — exact action id from the authorization matrix (string, stable)
- `actor` — object:
  - `type`: `user | system | anonymous`
  - `id`: string or null (null for anonymous)
  - `role`: string or null (null for anonymous/system)
- `target` — object or null:
  - `type`: string (stable domain identifier)
  - `id`: string (stable id)
- `result` — `success | denied | rate_limited | error`
- `requestId` — generated per request, propagated (string)
- `message` — short, stable string key (no prose)

## Optional Fields (Strict)

- `meta` — small object, whitelisted keys only, `additionalProperties: false`, max serialized size 1024 bytes. Allowed keys:
  - `requestPath` (string, <= 200)
  - `ipHash` (string, <= 128, hashed only)
  - `windowSeconds` (integer, >= 1)
  - `limit` (integer, >= 1)
  - `code` (string, <= 64, e.g., `DLX-RATE-001`)
- `alertCode` — stable identifier for alert signals (string, <= 64)
- `throttleKey` — derived key for alert throttling (string, <= 128)

## Hard Rules

- No PII, no secrets, no request bodies, no arbitrary objects.
- `meta` keys are limited to the whitelist above; anything else is rejected.
- Schema violations must fail fast in dev/test. In prod, the logger emits one `critical` drop notice, then drops subsequent invalid events.
- `actionId`, `actor`, `target`, and `result` must always be set; `target` may be `null`.

## Overload / Drop Policy

- Dev/Test: logger throws on schema violation or emit failure (fail fast).
- Prod: first failure emits a single `critical` log noting the drop, subsequent invalid events are dropped to protect the system.

## Alert Signals

- Alert events use the same shape and required fields as logs, plus:
  - `alertCode` — required for alerts
  - `throttleKey` — required for alerts (e.g., `auth.login:actorId`)
- Throttle: same `alertCode` + `throttleKey` → max 1 per 5 minutes.
- Transport is identical to logs (stdout JSONL).

---
