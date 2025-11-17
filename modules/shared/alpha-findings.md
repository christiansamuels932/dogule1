# Station 18 — Alpha Findings

> Hinweis: `pnpm dev` (#/dashboard default) konnte im aktuellen Umfeld nicht gestartet werden (`listen EPERM 127.0.0.1:4173`). Die folgenden Punkte stammen daher aus einer Quellcode-Durchsicht und sollten im echten Build bestätigt werden.

## Dashboard

- Empty-State-Texte für Schnellaktionen/Metriken nutzen "Noch keine Daten" statt des vorgeschriebenen „Keine Daten vorhanden.“ und verletzen damit den globalen Empty-State-Standard (modules/dashboard/index.js:52-107)
- Schnellaktionen werden ausschließlich als Buttons gerendert; ohne `<a>` Links lassen sich Zielseiten nicht in neuem Tab öffnen, was den Navigations-Check unter „Routing“ bricht (modules/dashboard/index.js:52-82)

## Kunden

- Kundenliste zeigt bei leeren Daten nur einen nackten `<p>` Text („Noch keine Kunden.“) statt `createEmptyState` mit Standardtext (modules/kunden/index.js:77-106)
- Detailansicht rendert das komplette Datenblatt als freies `<dl>` ohne gemeinsame Kartenstruktur, wodurch Abstände/Typografie nicht den Shared Styles entsprechen (modules/kunden/index.js:125-154)
- Formulare bauen die Felder manuell (`div.kunden-form-row`) und ignorieren die gemeinsamen `createFormRow` Controls, sodass Label/Spacing/Errors pro Feld variieren (modules/kunden/index.js:243-330)
- Das automatisch generierte `Kunden-ID`-Feld ist strikt readonly und es existiert kein Sicherheits-Button zum gezielten Override wie von den globalen ID-Regeln gefordert (modules/kunden/index.js:270-307)
- Verknüpfte Hunde- und Kurslisten zeigen bei fehlenden Daten nur einfache Texte („Keine Hunde zugeordnet.“ / „Noch keine Kurse“) statt des vereinheitlichten `ui-empty` Bausteins mit Standardcopy (modules/kunden/index.js:433-500)

## Hunde

- Modul initialisiert mit `console.log("[Hunde] module loaded")`, obwohl Clean-Console nur Fehlercodes erlauben soll (modules/hunde/index.js:7-36)
- Die Listenkarte verwendet bei leeren Daten den Text „Noch keine Hunde erfasst.“ anstelle von „Keine Daten vorhanden.“ (modules/hunde/listView.js:80-117)
- Die verknüpften Kurse eines Hundes nutzen ebenfalls „Noch keine Kurse“ ohne `ui-empty`, wodurch Empty-State-Checks scheitern (modules/hunde/detailView.js:150-195)
- Das Feld „Hunde-ID“ bleibt immer frei editierbar und es existiert kein dedizierter Override-Knopf; laut Anforderung muss die ID zunächst gesperrt angezeigt und erst nach Bestätigung überschreibbar sein (modules/hunde/formView.js:127-188)

## Kurse

- Die Kursliste zeigt bei fehlenden Daten „Noch keine Kurse erfasst.“ statt des geforderten „Keine Daten vorhanden.“ (modules/kurse/index.js:636-714)
- Weder Detail- noch Listenansicht zeigen irgendwo die Kurs-ID, wodurch Nutzer den Datensatz nicht verifizieren oder identifizieren können (modules/kurse/index.js:124-187, 794-817)
- Das Kursformular enthält keinerlei Feld für die automatisch erzeugte Kurs-ID; folglich fehlt auch der Override-Button für Ausnahmefälle (modules/kurse/index.js:505-620, 865-1003)
- Ohne Kurs-ID im Formular oder in den Detailkarten lässt sich die globale Regel „ID anzeigen + manueller Override möglich“ für Kurse derzeit nicht erfüllen
