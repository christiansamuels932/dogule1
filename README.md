# Dogule1 – Management App for Dog Schools

## Purpose

Dogule1 ist eine modulare Verwaltungs-App für Hundeschulen mit Dashboard, Kommunikation, Kunden-, Hunde-, Kurs-, Trainer-, Kalender-, Finanzen- und Waren-Modulen. Ziel ist eine lokale Alpha-Version (V0.1), die später auf einen NAS-Server ausgerollt wird.

## Modules

- Dashboard (transparent) – Einstieg & Kennzahlen
- Kommunikation (schwarz) – Nachrichten/Automationen (Platzhalter)
- Kurse (rot) – Kursplanung & Teilnehmer
- Kunden (violett) – Stammdaten, Hunde, Kurse, Finanzen
- Hunde (ultramarin) – Hundedaten, Besitzer, Kurszuordnung
- Kalender (cyan) – Termine & Trainerplanung
- Trainer (grün) – Trainerprofile & Einsätze
- Finanzen (gelb) – Zahlungen, offene Posten
- Waren (grau) – Produkt- & Verkaufsverwaltung

## Getting Started

```bash
pnpm install
pnpm dev     # startet den offiziellen Vite Dev Server (apps/web)
pnpm build   # erzeugt den Vite-Build (dist/)
```

### Quick-Fix Notes

- Nutze `pnpm dev` zum Testen einzelner Module; der Hash-Router lädt `modules/<name>/index.js`.
- Falls Vite-Build-Probleme auftreten, prüfe `apps/web/main.js` auf konsistente relative Pfade (`./modules/...`) und rerun `pnpm build`.
- Für Mock-Datenänderungen siehe `modules/shared/api`.

## Development & Build Pipeline

- `apps/web` ist die einzige Vite-Applikation und Quelle der Wahrheit (Hash-Router + Layout).
- `pnpm dev` startet ausschließlich den offiziellen Vite-Dev-Server; weitere Custom-Server sind nicht mehr erlaubt.
- `pnpm build` erzeugt das Produktions-Bundle via Vite (relative Pfade, hashed Assets).
- Der frühere Node-Dev-Server wurde entfernt; benötigte Referenzen finden sich nur noch in der Git-History.

### Local QA Loop (empfohlen)

- `pnpm dev` starten, Browser öffnen, Hash-Route des Moduls ansteuern (`#/trainer`, `#/kunden`, …).
- Konsole offen halten, CRUD-Flows testen (Create/Edit/Delete), leere/error States erzwingen, Überschriften/Shared-Komponenten prüfen.
- IDs müssen read-only angezeigt werden; Code-Override nur für `code`, nicht für `id`.
- Form-Buttons: müssen das Formular submitten (`requestSubmit` oder innerhalb des `<form>`), sonst keine Navigation/Validierung.

### Häufige Stolpersteine

- Lint nicht auf `dist/` laufen lassen; bei Bedarf `rm -rf dist` vor `pnpm lint`.
- Form-Buttons außerhalb des `<form>` → keine Submit-Events. Lösung: Button ins Form setzen oder `requestSubmit()` auf das Form auslösen.
- Fehlende Required-Felder (Name/Code) verhindern Submit ohne sichtbare Fehler, wenn Hints `sr-only` bleiben – Hints sichtbar machen bei Fehler.

## Folder Structure

```
dogule1/
  apps/
    web/            # Hash-Router + Layout, lädt alle Module
  modules/
    <moduleName>/   # Dashboard, kunden, hunde, kurse, ...
    shared/         # Gemeinsame Komponenten, Layout, API
  DOGULE1_MASTER.md
  DOGULE1_STATUS.md
  DOGULE1_PROTOCOL.md
  agents.md
```

Weitere Details zu Stationen, Regeln und Migrationen stehen in `DOGULE1_MASTER.md`, `DOGULE1_STATUS.md`, `DOGULE1_PROTOCOL.md` und `agents.md`.
