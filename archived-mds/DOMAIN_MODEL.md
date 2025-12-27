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
