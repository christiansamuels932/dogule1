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

| Modul          | Farbe        | Kurzbeschreibung                                        | Wichtige Verknüpfungen                              |
|----------------|-------------|---------------------------------------------------------|-----------------------------------------------------|
| Dashboard      | transparent | Zentrale Einstiegsseite, Zugriff auf alle Module       | Alle Module                                         |
| Kommunikation  | schwarz     | Nachrichten und Koordination, Automationen später      | (Phase 0: isoliert, später: alle Module)           |
| Kurse          | rot         | Kursdaten: wann, wer, welcher Trainer                  | Kunden ↔ Kurse ↔ Kalender, Kurse ↔ Trainer          |
| Kunden         | violett     | Kundenstamm: Hunde, Kurse, Zahlungen                   | Hunde · Kurse · Finanzen · Kalender · Waren        |
| Hunde          | ultramarin  | Hundedaten: Name, Notizen, Besitzer                    | Kunden · Kurse                                      |
| Kalender       | cyan        | Termine und Kurszeiten                                 | Kurse · Trainer · Kunden                            |
| Trainer        | grün        | Admin + 5 Trainer, Kursleitung                         | Kurse · Kalender · Finanzen                         |
| Finanzen       | gelb        | Einnahmen, Ausgaben, Zahlungen                         | Kunden · Trainer · Waren                            |
| Waren          | grau        | Verkaufte Produkte (Futter, Material usw.)             | Finanzen · Kunden                                   |

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

- Jedes Modul erhält **eine eigene, testbare HTML-Ansicht** (Farbschema wie oben, einfache Überschrift, Mock-Daten).  
- Es gibt **noch keine echten Abhängigkeiten oder Persistenz**, nur einfache Navigation.  
- Verknüpfungen aus Abschnitt 3 dienen als **Design-Vorgabe für spätere Phasen**, werden aber in Phase 1 nur visuell berücksichtigt.

---

## 5. Empfohlene Projektstruktur

```text
dogule1/
  DOGULE1_MASTER.md
  DOGULE1_BASELINE.md
  DOGULE1_STATUS.md        ← wird laufend gepflegt
  DOGULE1_PROTOCOL.md
  dashboard/
  kunden/
  hunde/
  kurse/
  trainer/
  kalender/
  finanzen/
  waren/
  kommunikation/
  shared/
  ```
  
Root-Markdown-Dateien: Projektregeln, Blueprint, Status und Migrationsprotokoll.

Modul-Ordner: jeweils eigene HTML/JS/CSS-Artefakte pro Modul.

shared/: gemeinsame Ressourcen (z. B. Styles, Utilities) für spätere Phasen.

6. Diagramm-Referenz
Offizielle visuelle Referenz: „Core Module Map — Phase 0“ in Draw.io.

Farben und Verknüpfungen müssen mit dieser Karte übereinstimmen.

Änderungen an der Modul-Architektur dürfen nur erfolgen, wenn dieses Baseline-Dokument und das Diagramm gemeinsam aktualisiert werden.
