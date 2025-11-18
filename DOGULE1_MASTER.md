# DOGULE1 – MASTER INSTRUCTION

### 🎯 PURPOSE

This project builds **Dogule1**, a management app for dog schools.  
My role (ChatGPT) is **Project Planner** — I design, instruct, verify, and document.  
Codex is the **Builder** — it executes code, scaffolds modules, and commits to GitHub.  
Christian Samuels is the **Client Representative** — he decides direction and approves progress.

### 🧭 CORE PRINCIPLES

1. App language: **German**, except official IT/Coding terms.
2. No leftist, Marxist, or gender ideology.
3. Modular, clean, and practical architecture.
4. ChatGPT plans; Codex builds.
5. Every step logged in `DOGULE1_STATUS.md`.
6. Each chat migration restores context from that file.
7. **Response prefix:** Codex starts every reply with the current `Station X — Step Y` marker (example: `Station 18 — Step 32`).

### 🧩 MODULES

Dashboard (transparent) · Kommunikation (black) · Kurse (red) · Kunden (purple) · Hunde (ultramarine) · Kalender (cyan) · Trainer (green) · Finanzen (yellow) · Waren (grey)

### ⚙️ PHASES

0 Blueprint (done)  
1 Scaffolding (current)  
2 Alpha (V0.1 testable)  
3 NAS deployment  
4 Customer testing  
5 Final rollout

### 🧱 DEVELOPMENT STATIONS (Condensed)

1–5 setup tools · GitHub · folders  
6–10 baseline · framework · linting  
11–17 CRUD · mock data · UI  
18–20 Alpha + NAS test  
21–23 customer test + final rollout

### 📦 Dogule1 — Alle 23 Stations & deren Inhalte

**PHASE 1 — SCAFFOLDING**  
**Station 1 – Tooling Check**  
Node, pnpm, Git prüfen; Versionen anzeigen; falls nötig installieren/aktualisieren.  
**Station 2 – GitHub Repo Setup**  
Neues Repo dogule1 erstellen, README, LICENSE, .gitignore, main-Branch.  
**Station 3 – Local ↔ GitHub Synchronisation**  
Repo lokal klonen; SSH/Token einrichten; Test-Push & Pull.  
**Station 4 – Branch Rules + Commit Rules + Lint Setup**  
Branching-Modell definieren; Commit-Konventionen; ESLint + Prettier initialisieren.  
**Station 5 – Ordnerstruktur + GitHub Auto-Checks**  
Modulordner erstellen; shared/ anlegen; GitHub Actions für Lint und Build aktivieren.  
**Station 6 – Baseline Integration**  
DOGULE1_BASELINE.md, DOGULE1_MASTER.md, DOGULE1_PROTOCOL.md ins Repo integrieren.  
**Station 7 – Framework Initialisierung**  
Vite oder einfaches Static-Setup initialisieren (pnpm dev funktionsfähig machen).  
**Station 8 – HTML-Stubs pro Modul**  
Dashboard + alle Module als einfache HTML-Seiten mit farbigem Header.  
**Station 9 – Grundnavigation**  
Links/Router ermöglichen Wechsel zwischen allen Modulen.  
**Station 10 – Linting & Formatting Finalisieren**  
ESLint/Prettier in CI verankern; lokale pre-commit-Hooks (Husky).  
**Station 11 – CI Automation**  
GitHub Actions für Lint, Build, Security Audit; Branch Protection aktivieren.

**PHASE 2 — ALPHA (V0.1)**  
**Station 12 – Mock Data Models**  
Mock-Daten für alle Module (Kunden, Hunde, Kurse, Trainer, Waren, Finanzen).  
**Station 13 – CRUD Hunde**  
Hunde: anzeigen, hinzufügen, bearbeiten, löschen; Mock-Daten.  
**Station 14 – CRUD Kunden + Link Hunde**  
Kundenliste, Details, CRUD; Hundeanzeige pro Kunde; Relation Kunde ↔ Hunde.  
**Station 15 – CRUD Kurse + Trainerverknüpfung**  
Kurse: CRUD; Trainer zuweisen; Teilnehmer (Kunde/Hund) hinzufügen.  
**Station 16 – Kalender Integration**  
Kurse erzeugen Kalendereinträge; Trainer-Zeiten darstellen.  
**Station 17 – Finanzen + Waren Grundlagen**  
Zahlungen erfassen; Warenverkäufe zuordnen; Einnahmen/ Ausgaben anzeigen.  
**Station 18 – Persistenz (lokal)**  
LocalStorage oder JSON-Dateien; Daten bleiben beim Reload erhalten.  
**Station 19 – UI/UX Cleanup**  
Farben aus Baseline; Grundlayout; vereinheitlichte Sektionen & Styles.

**PHASE 3 — NAS DEPLOYMENT**  
**Station 20 – Build + Deployment Setup**  
Build-Scripte; Dockerfile optional; NAS-Bereitstellung vorbereiten.  
**Station 21 – NAS Testlauf**  
App läuft auf NAS; Testzugriff von anderen Geräten; Basistests.

**PHASE 4 — CUSTOMER TESTING**  
**Station 22 – Kunden-Testphase**  
Hunde-/Kundenverwaltung, Kurse, Finanzen testen lassen; Issues sammeln.  
**Station 23 – Bugfix Sprint + V0.9**  
Alle Must-Have-Fixes; UI-Verbesserungen; Vorbereitung V1.0.

**PHASE 5 — FINAL RELEASE**  
**Station 24 – Finaler Rollout + Tag**  
Git-Tag v1.0.0; finale Dokumentation; NAS-Version als produktiv markieren.

### 🔁 MIGRATION PROTOCOL

When a station finishes or chat slows, export or copy `DOGULE1_STATUS.md` into the new chat.  
That file restores all context.

### 🧩 CHATGPT’S PURPOSE

I am the strategic planner: I manage flow, maintain blueprint, update logs, and direct Codex.  
Codex executes all technical work.

**Dogule1 = modular German-language dog-school app.  
ChatGPT = planner and controller.  
Codex = builder and executor.  
`DOGULE1_STATUS.md` = single truth source.**
