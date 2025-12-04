# DOGULE1 – BASELINE BLUEPRINT

**Projekt:** Huschu App – Dogule1  
**Phase:** 0 abgeschlossen · Phase 1 Start  
**Rollen:**

- Client Representative: Christian Samuels
- Project Planner: ChatGPT
- Builder: Codex

---

## 1. Zweck

Dogule1 steuert den gesamten Betrieb einer Hundeschule über ein zentrales Dashboard mit verbundenen Modulen (Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen, Waren, Kommunikation).

---

## 2. Module und Farben

| Modul         | Farbe       | Kurzbeschreibung                                  | Wichtige Verknüpfungen                        |
| ------------- | ----------- | ------------------------------------------------- | --------------------------------------------- |
| Dashboard     | transparent | Zentrale Einstiegsseite, Zugriff auf alle Module  | Alle Module                                   |
| Kommunikation | schwarz     | Nachrichten und Koordination, Automationen später | (Phase 0: isoliert, später: alle Module)      |
| Kurse         | rot         | Kursdaten: wann, wer, welcher Trainer             | Kunden ↔ Kurse ↔ Kalender, Kurse ↔ Trainer |
| Kunden        | violett     | Kundenstamm: Hunde, Kurse, Zahlungen              | Hunde · Kurse · Finanzen · Kalender · Waren   |
| Hunde         | ultramarin  | Hundedaten: Name, Notizen, Besitzer               | Kunden · Kurse                                |
| Kalender      | cyan        | Termine und Kurszeiten                            | Kurse · Trainer · Kunden                      |
| Trainer       | grün        | Admin + 5 Trainer, Kursleitung                    | Kurse · Kalender · Finanzen                   |
| Finanzen      | gelb        | Einnahmen, Ausgaben, Zahlungen                    | Kunden · Trainer · Waren                      |
| Waren         | grau        | Verkaufte Produkte (Futter, Material usw.)        | Finanzen · Kunden                             |

Hinweis: Kommunikation ist in Phase 0 konzeptionell vorhanden, aber technisch noch nicht verbunden.

---

## 3. Daten-Verknüpfungen (funktional)

- **Kunden ↔ Hunde**: Jeder Hund gehört zu einem Kunden; Kundenübersicht zeigt zugeordnete Hunde.
- **Kunden ↔ Kurse**: Kunden buchen Kurse; Kurse zeigen Teilnehmerliste.
- **Hunde ↔ Kurse**: Kurse können hundbezogen sein (teilnehmende Hunde).
- **Kurse ↔ Trainer**: Jeder Kurs hat mindestens einen verantwortlichen Trainer.
- **Kurse ↔ Kalender**: Jeder Kurs erzeugt mindestens einen Kalendereintrag.
- **Trainer ↔ Kalender**: Kalender zeigt, welcher Trainer wann eingesetzt ist.
- **Kunden ↔ Finanzen**: Zahlungen und offene Posten pro Kunde.
- **Trainer ↔ Finanzen**: Optionale Auswertung (z. B. Stunden, Entlohnung).
- **Waren ↔ Finanzen**: Verkäufe erzeugen Einnahmenbuchungen.
- **Kunden ↔ Waren**: Zuordnung von Warenkäufen zu Kunden.

---

## 4. Phase 1 – Zielbild

- Phase 1 endet mit vollständig lauffähigen Einzelmodulen (Dashboard, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen, Waren, Kommunikation), die über den gemeinsamen Router und das persistente Layout geladen werden.
- Stationen 1–17 liefern die komplette Shared-Infrastruktur (Tooling, Router, Layout, Komponenten, zentrale Mock-API) und bauen in den Modulen funktionierende CRUD-/Detail-Flows einschließlich ID/Code-Regeln auf.
- Beziehungen aus Abschnitt 3 bleiben logisch dokumentiert, bis spätere Phasen (ab Station 19) die Navigation/Datenverknüpfungen aktivieren.
- IDs folgen der Regel: `id` ist intern/systemgeneriert/unveränderbar, `code` ist user-facing/editierbar; Overrides betreffen nur `code`.

---

## 5. Kanonische Projektstruktur

```text
dogule1/
  apps/
    web/                  ← Einstieg (Hash-Router + Layout)
  modules/
    <moduleName>/         ← Dashboard, kunden, hunde, ...
    shared/               ← gemeinsame Assets (layout, components, api)
  DOGULE1_MASTER.md       ← Blueprint & Station Plan
  status.md               ← Fortschritts-Log (Aktueller Stand)
  DOGULE1_PROTOCOL.md     ← Planner-Regeln
  agents.md               ← Rollen & Arbeitsablauf
```

Weitere Markdown-Dateien (z. B. BASELINE, README) unterstützen die Doku, ändern aber nicht die Kernstruktur.

Der kanonische Daten- und Relationsplan für alle Module steht in `DOMAIN_MODEL.md` und hat Vorrang vor älteren Annahmen.

6. Diagramm-Referenz
   Offizielle visuelle Referenz: „Core Module Map — Phase 0“ in Draw.io.

Farben und Verknüpfungen müssen mit dieser Karte übereinstimmen.

Änderungen an der Modul-Architektur dürfen nur erfolgen, wenn dieses Baseline-Dokument und das Diagramm gemeinsam aktualisiert werden.
