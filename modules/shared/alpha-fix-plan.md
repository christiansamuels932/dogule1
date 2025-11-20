# Station 18 — Alpha Fix Plan

## Dashboard

### Routing

- Schnellaktions-Buttons durch echte `<a>` Links ersetzen, damit Hash-Routen in neuem Tab geöffnet werden können.

### UI Consistency

- Keine Aktion erforderlich; Karten und Header nutzen bereits shared components.

### Empty-States

- Texte der `createEmptyState` Aufrufe auf „Keine Daten vorhanden.” angleichen.

### Error-States

- Keine offenen Punkte.

### Detail Views

- Nicht zutreffend.

### List Views

- Nicht zutreffend.

### Form Views

- Nicht zutreffend.

### Console Cleanliness

- Keine Änderungen nötig.

### ID Override Controls

- Nicht zutreffend.

### Kurs ID Visibility

- Nicht zutreffend.

## Kunden

### Routing

- Keine Anpassung erforderlich; Routenlogik deckt Liste/Detail/Form ab.

### UI Consistency

- Detailansicht in `createCard` + `createSectionHeader` umbauen, damit Abstände/Typografie shared.css folgen.

### Empty-States

- Listen-Empty-State durch `createEmptyState` mit „Keine Daten vorhanden.” ersetzen und identische Behandlung in Hunde-/Kurssektionen anwenden.

### Error-States

- Bestehende Notices belassen.

### Detail Views

- Datensatzwerte in Karten/Definition Lists innerhalb gemeinsamer Cards anzeigen.

### List Views

- Kundenliste in eine Card mit shared spacing und optionalen Badges überführen.

### Form Views

- Alle Felder über `createFormRow` rendern und Fehlermeldungen in die gemeinsamen Slots legen.

### Console Cleanliness

- Keine zusätzlichen Logs hinzufügen; bestehende Fehlercodes beibehalten.

### ID Override Controls

- Neben der gesperrten Kunden-ID einen „ID manuell setzen“ Button hinzufügen, der das Feld entsperrt und Eingaben validiert.

### Kurs ID Visibility

- Nicht zutreffend.

## Hunde

### Routing

- Keine Maßnahmen nötig; Routenauflösung ist vollständig.

### UI Consistency

- Bestehende Cards/Section Header weiterverwenden.

### Empty-States

- Sowohl Listen- als auch Kurs-Empty-States auf `createEmptyState` + „Keine Daten vorhanden.” vereinheitlichen.

### Error-States

- Warn-Notices belassen.

### Detail Views

- Prüfen, ob Hunde-ID und Kunden-ID immer sichtbar bleiben; Darstellung bleibt in Cards.

### List Views

- Tabellenlayout beibehalten, aber Empty-State-Text korrigieren.

### Form Views

- Hunde-ID als read-only Input initial rendern und `createFormRow` verwenden, falls noch nicht überall aktiv.

### Console Cleanliness

- `console.log("[Hunde] module loaded")` entfernen; nur Fehlercodes loggen.

### ID Override Controls

- Override-Button einführen, der nach Bestätigung das Hunde-ID Feld editierbar macht.

### Kurs ID Visibility

- Nicht zutreffend.

## Kurse

### Routing

- Keine Änderungen notwendig.

### UI Consistency

- Layout bereits shared; keine Aktion.

### Empty-States

- Leere Kursliste per `createEmptyState` mit Standardtext darstellen.

### Error-States

- Warnhinweise bestehen lassen.

### Detail Views

- Kurs-ID (z. B. `kurs.id`) im Detailkopf anzeigen und in Cards referenzieren.

### List Views

- Kurskarten um eine Kurs-ID Zeile/Bade erweitern, damit sie in der Übersicht sichtbar ist.

### Form Views

- Kurs-ID Feld hinzufügen (auto-generiert, optional editierbar) und in `createFormRow` integrieren.

### Console Cleanliness

- Keine zusätzlichen Logs nötig.

### ID Override Controls

- Override-Button implementieren, der das neue Kurs-ID Feld nach Sicherheitsabfrage entsperrt.

### Kurs ID Visibility

- Nach den obigen Änderungen sicherstellen, dass ID in Liste, Detail und Formular identisch angezeigt wird.
