DO NOT DELETE OR TRUNCATE: Only append new station entries to this file. Keep full history.
NEW ENTRIES: Add the latest station block directly below this header section (top of file), pushing older entries down.
READ-ONLY NOTE: provide only 1 step of instruction/guidance per message.
READ-ONLY NOTE: A single "." from the user means "confirmed, ok, next"
READ-ONLY NOTE: Each assistant response must start with "🔷 Topic — Subtitle — Progress: X% 🔷".
BASE NOTE: Keep the "Quick start, 3 Launchcodes" section in this header area. Do not place new station blocks above it.

## Quick start, 3 Launchcodes (manual)

- `sudo systemctl start mariadb && sudo systemctl status mariadb`
- `DOGULE1_STORAGE_MODE=mariadb DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran node tools/server/apiServer.js`
- `DOGULE1_STORAGE_MODE=mariadb DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran DOGULE1_PASSWORD_FILE=/home/ran/codex/dogule1/dogule1.passwords pnpm dev`

## Date 2026-03-01 — Developer Activity Logging + Kunden/Hunde Detail Rework + VPS Rollout

## Kontext

- Status: completed.
- Branch: `2026-03-01`.
- Scope: VPS-Datenbank lokal synchronisieren, neues Developer-Modul mit Aktivitäts-/Problem-Log ausbauen, Header-Button `Anleitung` → `Achtung` umstellen, Hunde-Stammdaten in `#Kunden` direkt bearbeitbar machen, danach vollständigen local→VPS DB- und Runtime-Rollout gemäss `VPS_UPDATE_PROCESS.md` durchführen.

## Ergebnis (kurz)

- Lokale Vorbereitung:
- Aufgaben für die nächste Runde in `Next-Updates.md` ergänzt.
- VPS-Datenbank nach lokal geholt (`/tmp/dogule1_vps_2026-03-01.sql`) und lokal importiert.
- Neue MariaDB-Struktur lokal angewendet: `tools/mariadb/migrations/115_0_developer_activity.sql`.
- `STATUS.md` Header vereinheitlicht: Launchcodes ganz oben gehalten, damit der lokale Start künftig direkt auffindbar bleibt.
- Developer-Modul ausgebaut:
- `Developer` ist jetzt als echtes Navigationsmodul sichtbar, aber weiterhin nur für Rolle `developer`.
- Backup-/Restore-Buttons bleiben im Modul vorhanden.
- Neues Aktivitäts-/Problem-Backend eingeführt:
- neue API-Datei `modules/shared/api/developer.js`
- neuer Server-Store `modules/shared/server/developerActivityStore.js`
- API-Routen in `modules/shared/server/apiRouter.js`
- neue MariaDB-Tabelle `developer_activity_events` in `tools/mariadb/schema.sql`
- Migration `tools/mariadb/migrations/115_0_developer_activity.sql`
- `Gemeldete Probleme` bleibt separat mit sinnvoller Sortierung; Probleme können jetzt mit `Bestätigen` bestätigt und aus der Liste entfernt werden.
- `Aktivitätslog` auf eine deutlich einfachere, scrollbare Barebones-Liste reduziert.
- Support-/Issue-Flow umgesetzt:
- Header-Button `Anleitung` in `apps/web/main.js` zu `Achtung` umbenannt.
- `Achtung` öffnet ein kurzes Problem-/Hinweisformular.
- Nicht-Developer-Aktivität wird für den Developer mitgeloggt (Modulaufrufe, UI-Klicks, Problem-Meldungen).
- Kunden/Hunde-Detailansicht in `#Kunden` überarbeitet:
- Top-Detailbereich jetzt zweispaltig: links `Stammdaten Kunde`, rechts `Stammdaten Hund`.
- Eigene `Aktionen`-Card entfernt.
- Action-Buttons (`Bearbeiten`, `Zu Kurs hinzufügen`, `Löschen`) sitzen jetzt direkt unter dem Titel beider Stammdaten-Cards.
- Hunde-Stammdaten in `#Kunden` vollständig sichtbar und direkt inline bearbeitbar.
- Inline-Hundeditor in `#Kunden` an die echte `#Hunde`-Maske angenähert:
- `Geschlecht` = Dropdown
- `Status` = Dropdown
- `Wurfdatum` = Date-Picker
- `Herkunft` = Dropdown über `HERKUNFT_OPTIONS`
- Layout-/Nav-Anpassungen:
- `modules/shared/layout.html` und `modules/shared/layout.css` für sichtbares Developer-Modul angepasst.
- `modules/shared/shared.css` für neue Kunden-/Developer-Layouts erweitert.

## Tests

- Lokal:
- `pnpm lint` ✅
- `pnpm test -- --runInBand` ✅ (`20` Dateien, `118` Tests)
- `pnpm build` ✅
- Lokaler Start mit den dokumentierten 3 Launchcodes geprüft ✅
- Login lokal wiederhergestellt über korrekten Start mit `DOGULE1_PASSWORD_FILE=/home/ran/codex/dogule1/dogule1.passwords` ✅
- Manuelle Checks lokal:
- Login als `Developer` funktioniert; `Developer`-Modul sichtbar ✅
- Login als Nicht-Developer funktioniert; `Achtung` und Aktivitätslogging verfügbar ✅
- `Gemeldete Probleme` lässt sich im Developer-Modul bestätigen/entfernen ✅
- VPS-Rollout:
- Lokalen DB-Dump erstellt: `/tmp/dogule1_local_2026-03-01.sql`
- Dump auf VPS kopiert ✅
- VPS-Datenbank per `DROP/CREATE` vollständig mit lokalem Dump überschrieben ✅
- `pnpm build` lokal vor Deploy erneut ausgeführt ✅
- Safe `rsync` (`dist`, `modules`, `tools`) nach `/opt/dogule1` ausgeführt ✅
- `sudo systemctl restart dogule1 && sudo systemctl status dogule1 --no-pager -l` = `active (running)` ✅
- `curl -sS -i http://127.0.0.1:5177/healthz` auf VPS = `HTTP/1.1 200 OK` + `{"status":"ok","storageMb":1.8}` ✅

## Offene Punkte

- Browser-Hard-Reload auf dem VPS nach Deploy empfohlen (hash-basierte Assets).
- Live-UI-Smoke auf VPS für `#Developer` und `#Kunden` nach dem Deploy durchführen.

## Date 2026-02-24 — Session Consolidation (Übungsbibliothek UI + Sub-Kurse Local + VPS Rollout)

## Kontext

- Status: completed.
- Scope: Form-UX in `#Übungsbibliothek` anpassen, Sub-Kurse aus `Subkurse.txt` lokal importieren (duplicate-safe), danach vollständigen VPS-Update nach `VPS_UPDATE_PROCESS.md` ausrollen.

## Ergebnis (kurz)

- Übungsbibliothek-Form überarbeitet (`modules/uebungsbibliothek/index.js`):
- Card-Titel `Eintrag anlegen` → `Übung erstellen`.
- Feldlabel `Titel` → `Übungsname` (Create/Edit).
- Textblöcke ohne Block-Titel-Feld; nur `Text` mit Placeholder `Kurze Erklärung / Übersicht`.
- Bild-/Dokumentblöcke behalten `Titel`, werden aber vorbefüllt (`Bild N` / `Dokument N`) und bleiben editierbar.
- Validierung angepasst: Titelpflicht nur für Bild/Dokument, nicht für Text.
- Detailansicht rendert Blocktitel nur, wenn vorhanden.
- Sub-Kurse lokal aus `Subkurse.txt` importiert:
- Zeitnormalisierung (`15.00` → `15:00`, `09.30` → `09:30`).
- Trainer-Alias-Auflösung (`Richi Fontana` → `Fontana Richard`).
- Unterstützung für `Weitere Trainer: ...` (zusätzliche `trainer_ids`).
- Duplicate-Schutz aktiv (Schlüssel: `kursId + weekday + time + primaryTrainerId`).
- Bestand nach Import umfasst Updates für:
- `KS-001`, `KS-002`, `KS-004`, `KS-005`, `KS-006`.
- VPS-Rollout gemäss Prozessdokument durchgeführt:
- `pnpm build` lokal.
- Local DB Dump `/tmp/dogule1_local.sql` erstellt und auf VPS kopiert.
- VPS DB `DROP/CREATE` + Import des local Dumps.
- Safe `rsync` (`dist`, `modules`, `tools`) nach `/opt/dogule1`.
- `dogule1.passwords` auf VPS aktualisiert, Rechte gesetzt.
- `dogule1.service` neu gestartet.

## Tests

- Lokal:
- `pnpm lint` ✅
- `pnpm test` ✅ (`20` Dateien, `118` Tests).
- `pnpm build` ✅
- Sub-Kurs Spotchecks in MariaDB ✅
- VPS:
- `systemctl status dogule1 --no-pager -l` = `active (running)` ✅
- `curl -i http://127.0.0.1:5177/healthz` = `200` + `{"status":"ok","storageMb":1.7}` ✅
- `curl -i http://127.0.0.1:5177/api/auth/options` = `200` ✅
- SQL-Spotcheck `sub_kurse` für `KS-001/002/004/005/006` ✅

## Offene Punkte

- Browser-Hard-Reload (`Shift+Reload`) nach Deploy empfohlen (hash-basierte Assets).

## Date 2026-02-24 — Sub-Kurse Batch Import + VPS Update (Process-Conform)

## Kontext

- Status: completed.
- Scope: neue Sub-Kurse aus `Subkurse.txt` lokal anlegen, danach vollständigen VPS-Update strikt nach `VPS_UPDATE_PROCESS.md` durchführen.
- Zielpunkte:
- Duplicate-safe Sub-Kurs Import.
- Local→VPS DB-Overwrite inklusive Runtime-Deploy und Verifikation.

## Ergebnis (kurz)

- Lokaler Sub-Kurs Import abgeschlossen (mehrere Batches), inklusive Alias-/Format-Normalisierung:
- `Richi Fontana` → `Fontana Richard`.
- `19.00`/`09.30` → `19:00`/`09:30`.
- Zusätzliche Trainer-Zeile unterstützt (`Weitere Trainer: ...`).
- Für folgende Kurse sind neue/aktualisierte Sub-Kurse lokal vorhanden:
- `KS-001`, `KS-002`, `KS-004`, `KS-005`, `KS-006`.
- VPS-Update gemäss Prozessdokument durchgeführt:
- `pnpm build` lokal.
- Lokaler DB-Dump nach `/tmp/dogule1_local.sql`.
- `scp` Dump auf VPS nach `/tmp/dogule1_local.sql`.
- VPS DB `DROP/CREATE` + Import des Dumps.
- Safe `rsync` von `dist`, `modules`, `tools` nach `/opt/dogule1`.
- Passwortdatei nach `/opt/dogule1/config/dogule1.passwords` kopiert und gesetzt.
- `dogule1` Service neu gestartet.

## Tests

- Lokal:
- `pnpm build` ✅
- DB-Dump Erstellung (`/tmp/dogule1_local.sql`) ✅
- VPS:
- `systemctl status dogule1 --no-pager -l` = `active (running)` ✅
- `curl -i http://127.0.0.1:5177/healthz` = `200 OK` + `{"status":"ok","storageMb":1.7}` ✅
- `curl -i http://127.0.0.1:5177/api/auth/options` = `200 OK` ✅
- SQL-Spotcheck auf VPS (`sub_kurse` join `kurse`) zeigt erwartete Einträge für `KS-001/002/004/005/006` ✅

## Offene Punkte

- Browser-Hard-Reload nach Deploy empfohlen (`Shift+Reload`) wegen hash-basierten Assets.
- Für Folgestände denselben `VPS_UPDATE_PROCESS.md` Ablauf beibehalten.

## Date 2026-02-24 — Complete Check Fixes + VPS Update (Zertifikat/Kurs + Backups)

## Kontext

- Status: completed.
- Scope: die 3 grössten offenen Punkte aus dem Complete Check beheben, lokal verifizieren und auf den VPS ausrollen.
- Zielpunkte:
- Kurs-Löschen mit verknüpftem Zertifikat darf keinen `500 storage_error` mehr erzeugen.
- Test-Suite muss wieder vollständig grün sein.
- Backup-Slots `24h`/`72h` müssen auch auf frischen Setups nutzbar sein.

## Ergebnis (kurz)

- Zertifikat/Kurs-Löschpfad stabilisiert:
- `zertifikate.kurs_id` auf `NULL` erlaubt und FK auf `ON DELETE SET NULL` gesetzt.
- Neue Migration hinzugefügt: `tools/mariadb/migrations/114_0_zertifikate_kurs_set_null.sql`.
- Adapter-Validierung angepasst:
- `createZertifikat` verlangt weiterhin `kursId`.
- `updateZertifikat` erlaubt historische Datensätze mit `kursId = null` nach Kurs-Löschung.
- Test-Fixes abgeschlossen:
- UI-Test `modules/kommunikation/groupchat/ui.test.js` auf aktuellen Infochannel-Flow gebracht.
- Fehlende Template-Mocks (`#ui-btn`, `#ui-form-row-template`) ergänzt.
- Infochannel- und Auth-Tests auf aktuelle Regeln/TTL angepasst.
- Backup-Flow gehärtet:
- `tools/backup/backup_db.sh` bootstrapped `backup_24h.sql.gz.gpg` und `backup_72h.sql.gz.gpg` aus dem neuesten Daily-Snapshot, falls Slots noch fehlen.
- Smoke-Script korrigiert:
- `tools/mariadb/smokeTest.js` setzt für Kurs-Erstellung nun `ort`, damit der aktuelle Validator nicht fehlschlägt.
- VPS ausgerollt:
- `pnpm build` lokal.
- `rsync` von `dist`, `modules`, `tools` nach `/opt/dogule1`.
- Migration `114_0` auf VPS-DB angewendet.
- `dogule1.service` via systemd neu gestartet und wieder als laufender Dienst bestätigt.

## Tests

- Lokal:
- `pnpm lint` ✅
- `pnpm test` ✅ (`20` Testdateien, `118` Tests)
- DB-Verifikation lokal (`information_schema`) ✅
- `zertifikate.kurs_id` = nullable
- `fk_zertifikate_kurs` = `SET NULL`
- Regressionsszenario lokal (Kurs+Teilnehmer+Zertifikat → Kurs löschen) ✅
- Zertifikat bleibt bestehen, `kursId` wird `null`, Snapshot-Felder bleiben erhalten.
- Backup-Bootstrap lokal per isoliertem Script-Test ✅
- Daily + Slot-Dateien werden korrekt angelegt.
- VPS:
- `systemctl status dogule1` = `active (running)` ✅
- `curl http://127.0.0.1:5177/healthz` = `{"status":"ok","storageMb":1.7}` ✅
- DB-Verifikation VPS (`information_schema`) ✅
- `zertifikate.kurs_id` = `YES`
- `fk_zertifikate_kurs` = `SET NULL`
- Backup-Dateien vorhanden ✅
- `/opt/dogule1/backups/daily/2026-02-24.sql.gz.gpg`
- `/opt/dogule1/backups/backup_24h.sql.gz.gpg`
- `/opt/dogule1/backups/backup_72h.sql.gz.gpg`

## Offene Punkte

- Optionaler manueller End-to-End UI-Smoke auf VPS:
- Kurs mit Zertifikat anlegen, Kurs löschen, Zertifikat-Detail prüfen.
- Sicherheits-Hygiene:
- sudo-Passwort und DB-Passwort trennen/rotieren (falls aktuell identisch).

## Date 2026-02-24 — VPS Deploy abgeschlossen (Kurse/Sub-Kurse + Developer Backup UI)

## Kontext

- Status: completed.
- Scope: lokalen Stand (Sub-Kurse, gekoppelte Listen, Developer-Backup-Modul) auf VPS ausrollen inkl. DB-Overwrite und Service-Neustart.

## Ergebnis (kurz)

- DB-Transfer local → VPS durchgeführt:
- `/tmp/dogule1_local.sql` nach VPS kopiert.
- VPS-Datenbank vollständig neu erstellt und mit aktuellem Dump importiert.
- App-Deploy durchgeführt:
- `pnpm build` lokal erfolgreich.
- `rsync` von `dist`, `modules`, `tools` nach `/opt/dogule1/`.
- `dogule1` Service auf VPS neu gestartet.
- Runtime-Check:
- `systemctl status dogule1` = `active (running)`.
- API bindet auf `http://localhost:5177`.
- Healthcheck extern erfolgreich: `{"status":"ok","storageMb":1.7}`.
- Funktionscheck:
- `#/developer` als `Developer` erreichbar.
- Buttons `Restore 24h` und `Restore 72h` sichtbar.
- Slot-Status aktuell erwartungsgemäss `Nicht vorhanden`.

## Tests

- Deploy smoke:
- `pnpm build` ✅
- `sudo systemctl status dogule1 --no-pager` ✅
- `curl -s http://144.91.86.20:5177/healthz` ✅
- UI smoke:
- Developer-Backup-Seite lädt und zeigt Buttons ✅

## Offene Punkte

- Geplante Backup-Snapshots auf VPS nach 23:59 (`Europe/Zurich`) prüfen.
- Nach erster/zweiter Nacht Slot-Rotation (`24h`/`72h`) validieren.
- Restore-Ablauf mit real vorhandenem Slot end-to-end prüfen.

## Date 2026-02-24 — Kurse/Sub-Kurse + Developer Backup Modul (Local Integration)

## Kontext

- Status: in progress.
- Scope: kompletter Local-Stand für Sub-Kurse in `#Kurse`, gekoppelte Listen in `#Kunden/#Hunde`, sowie verstecktes Developer-Backup-Modul inkl. Restore-Buttons.

## Ergebnis (kurz)

- Lokale DB-Synchronisierung mit VPS-Dump durchgeführt und verifiziert (normalisierter Dump-Vergleich ohne fachliche Differenzen).
- Migration `113_0_subkurse.sql` lokal angewendet und geprüft:
- `sub_kurse` Tabelle vorhanden.
- `kurs_teilnehmer` erweitert um `sub_kurs_id` und Snapshot-Spalten.
- Kurse UI verdichtet:
- Kurscode/Trainer-Zeile aus Kurs-Karten entfernt.
- `Alter Hund` + `Preis` in einer Zeile.
- Sub-Kurse:
- eigener Bereich in Kurs-Detail mit zusätzlichem Abstand unter `+ Sub-Kurs erstellen`.
- Route geändert: `#/kurse/:kursId/subkurse/:subKursId` öffnet jetzt Detailansicht (nicht Edit).
- Edit liegt unter `#/kurse/:kursId/subkurse/:subKursId/edit`.
- Neue Sub-Kurs-Detailansicht mit:
- read-only Stammdaten,
- Teilnehmerliste als scrollbare Tabelle unten,
- gleiche Spaltenstruktur wie Kurs-Historie (inkl. Sub-Kurs/Startdatum/Eintrag vom),
- Aktionen `Sub-Kurs bearbeiten` + `Zur Kurs-Detailansicht`.
- Kunden/Hunde gekoppelte Listen auf einheitliches Scroll-Table-Layout (wie Übungsbibliothek) umgestellt:
- `Kunden Detail -> Kurse` und `Kunden Detail -> Zertifikate`.
- `Hunde Detail -> Kurse` und `Hunde Detail -> Zertifikate`.
- `Hunde Detail -> Kurse` enthält jetzt `Kurs`, `Sub-Kurs`, `Startdatum`.
- Abstand oberhalb `Zur Kursliste` ergänzt.
- Bugfixes:
- Crash `Cannot read properties of null (reading 'trainer')` in Kunden-Kurse-Render behoben (null-safe Trainerauflösung).
- Falsch-graue Kurslinks in Kunden-Detail behoben (orphan-Mapping korrigiert; nur echte gelöschte Kurse bleiben grau/nicht klickbar).
- Developer Backup Modul:
- versteckte Route `#/developer` aktiviert (Router kannte `developer` zuvor nicht).
- UI zeigt Restore-Buttons zuverlässig (`Restore 24h`, `Restore 72h`), auch wenn Slot-Metadaten nicht ladbar sind.
- API-Bug im Developer-Handler behoben (lokale Variable `path` hat Node-`path` Modul überschattet; führte zu Backup-Load-Fehlern).
- Aktueller UI-Stand als Developer: Buttons sichtbar, Slots derzeit `Nicht vorhanden`.

## Tests

- DB-Check:
- `/tmp/dogule1_vps.sql` vorhanden.
- normalisierter Diff VPS vs lokal: keine fachlichen Unterschiede.
- Migration-Check:
- `SHOW TABLES LIKE 'sub_kurse'` ✅
- Snapshot-/Subkurs-Spalten in `information_schema.columns` ✅
- Build:
- `pnpm build` mehrfach erfolgreich ✅
- Manuelle UI-Prüfung:
- Sub-Kurs erstellen klickbar/funktionsfähig.
- Sub-Kurs-Detailroute + Editroute funktionieren.
- Kunden/Hunde Tabellenlayout und Scrollverhalten sichtbar.
- Developer-Route `#/developer` lädt und zeigt Buttons.

## Offene Punkte

- VPS-Deploy der aktuellen Änderungen steht noch aus.
- Produktive Backup-Pipeline verifizieren:
- tägliche Snapshots 23:59 (`Europe/Zurich`),
- verschlüsselte Ablage,
- erwartete Slot-Rotation (`24h`/`72h`),
- Restore-Flow inkl. Service-Neustart und Berechtigungen (`sudo`/Script-Pfad).
- Nach erster/zweiter Nacht (`24h`/`72h`) Slots auf VPS erneut prüfen und ggf. nachjustieren.

## Date 2026-02-24 — Kurse Sub-Kurs Submit + Übersicht kompakt

## Kontext

- Status: in progress.
- Scope: fix non-working "Erstellen" in Sub-Kurs form and reduce vertical space in Kurs cards.

## Ergebnis (kurz)

- Kursübersicht-Karten verdichtet: Kurscode-Zeile entfernt, Trainer-Zeile entfernt, `Alter Hund` + `Preis` auf einer Zeile.
- Sub-Kurs Form-Fix in `modules/kurse/index.js`:
- Submit-Button an Form gebunden (`form`-Attribut gesetzt).
- Aktions-Buttons in das Form verschoben (`form.appendChild(actions)`), damit `submit` zuverlässig auslöst.

## Tests

- Manuell geprüft: Sub-Kurs-Form lädt; vorheriges Problem reproduzierbar ("Erstellen" ohne Aktion).
- Automatisierte Tests: nicht ausgeführt.

## Offene Punkte

- Nach Neustart lokal erneut manuell prüfen: Sub-Kurs anlegen, speichern, in Liste sichtbar.

## Date 2026-02-14 — Archive Deployment Plan

## Kontext

- Status: completed.
- Scope: move legacy `DEPLOYMENT_PLAN.md` into archive after merge.

## Ergebnis (kurz)

- Archived to `attachments/archive/DEPLOYMENT_PLAN.md`.

## Tests

- Not run (doc move).

## Offene Punkte

- None.

## Date 2026-02-14 — VPS DB Sync + Deploy (Übungsbibliothek Kategorien)

## Kontext

- Status: in progress.
- Scope: push local DB + app changes for Übungsbibliothek Kategorien to VPS.

## Ergebnis (kurz)

- VPS DB overwritten with local dump (`dogule1_local.sql`) after drop/create.
- App deployed via `pnpm build` + safe rsync (dist/modules/tools).
- Service restarted; API listening on `:5177`.

## Tests

- `systemctl status dogule1` ✅ (active)
- `curl http://127.0.0.1:5177/healthz` ✅

## Offene Punkte

- VPS UI check: Kategorie column, Kategorie erstellen (Admin/Developer only), filters, category select, and document links.

## Date 2026-02-14 — Übungsbibliothek Kategorien + Filter

## Kontext

- Status: in progress.
- Scope: Kategorien (DB + UI), Kategorie-Spalte, Filter (Ersteller/Kategorie), Kategorie-Create nur Admin/Developer.

## Ergebnis (kurz)

- Migration hinzugefügt: `112_0_uebungsbibliothek_kategorien.sql` (Kategorien-Tabelle + `kategorie_id`).
- API erweitert: `/api/uebungsbibliothek/kategorien` (GET/POST, POST nur Admin/Developer).
- UI: “Kategorie erstellen” Button (Admin/Developer), Kategorie-Spalte, Filter-Buttons, Kategorie-Select in Create/Edit.
- Fix: `actorRole` in `handleUebungsbibliothekRoutes` definiert (verhindert Runtime-Error).

## Tests

- Not run.

## Offene Punkte

- Migration lokal anwenden.
- UI lokal prüfen (Kategorie erstellen, zuweisen, filtern, suchen).
- Local → VPS DB-Upload + App-Deploy + VPS-UI-Check.

## Date 2026-02-14 — Merge Deployment Plan into VPS Update Process

## Kontext

- Status: completed.
- Scope: consolidate `DEPLOYMENT_PLAN.md` into `VPS_UPDATE_PROCESS.md` without losing information.

## Ergebnis (kurz)

- `VPS_UPDATE_PROCESS.md` now includes the full deployment plan content as a merged overview (legacy items clearly labeled).
- `DEPLOYMENT_PLAN.md` marked as legacy snapshot pointing to the authoritative doc.

## Tests

- Not run (doc update).

## Offene Punkte

- None.

## Date 2026-02-14 — VPS MariaDB Sync Workflow Added

## Kontext

- Status: completed.
- Scope: document VPS → local → VPS MariaDB sync workflow in `VPS_UPDATE_PROCESS.md`.

## Ergebnis (kurz)

- Added a dedicated MariaDB sync section with dump/copy/import steps and socket guidance.
- Notes include overwrite warning and fallback SSH streaming for dumps.

## Tests

- Not run (doc update).

## Offene Punkte

- Verify commands on next real sync.

## Date 2026-02-14 — Übungsbibliothek/Schulungen Dokument-Uploads

## Kontext

- Status: completed.
- Scope: PDF/DOC/DOCX Uploads in Übungsbibliothek + Schulungen; neuer Button “Dokument hinzufügen”; Dokumente öffnen im neuen Tab.

## Ergebnis (kurz)

- UI: neuer “Dokument hinzufügen”-Button in Create/Edit; Dokument-Blöcke rendern als Link mit `target="_blank"`.
- API: Uploads akzeptieren PDF/DOC/DOCX; Content-Type + Dateiendungen korrekt gesetzt.
- Bestehende Bild-Uploads unverändert.

## Tests

- Not run.

## Offene Punkte

- Dokument-Upload + Anzeige lokal und auf VPS prüfen.

## Date 2026-02-11 — HTTPS via Cloudflare + Nginx reverse proxy

## Kontext

- Status: completed.
- Scope: ogule.net HTTPS with trusted padlock while app stays on :5177.

## Ergebnis (kurz)

- Nginx installed and enabled; ports 80/443 opened via UFW.
- Cloudflare Origin Certificate created for `ogule.net` + `www.ogule.net`.
- Cert/key installed on VPS: `/etc/ssl/cloudflare/ogule.net.pem` and `/etc/ssl/cloudflare/ogule.net.key`.
- Nginx reverse proxy configured: 80 → 443 redirect, 443 → `http://127.0.0.1:5177`, WebSocket headers set.
- Nginx config validated and reloaded.
- Cloudflare SSL mode set to **Full (strict)**.
- Cloudflare Page Rule set: Always Use HTTPS for `http://ogule.net/*`.

## Tests

- `curl -kI https://localhost` → `HTTP/2 200` ✅

## Offene Punkte

- None.

## Date 2026-02-11 — Kunden Kurs-History split + Kurs hinzufügen prefill

## Kontext

- Status: in progress.
- Scope: Kunden Detailview — Kursliste pro Teilnehmer-Startdatum getrennt; neuer “Zu Kurs hinzufügen” Flow mit Kursauswahl + Prefill im Kurs-Teilnehmer-Formular.

## Ergebnis (kurz)

- Kunden → Kurse: Wenn derselbe Kurs mehrfach mit unterschiedlichen Startdatum-Einträgen existiert, wird jeder Teilnehmer-Eintrag als eigene Zeile gerendert (statt zusammengeführt).
- Kunden Detail: Button “Zu Kurs hinzufügen” zeigt eine Kursauswahl; Auswahl öffnet Kurs-Detail und prefillt den Teilnehmer-Dialog mit dem Kunden.
- Kursauswahl bleibt verborgen bis “Zu Kurs hinzufügen” gedrückt wird (verhindert leere Dropdowns beim Laden).
- Kurs-Teilnehmer-Formular unterstützt Prefill (Kunde vorselektiert).
- UI spacing: `.kunden-kurs-add` hinzugefügt.

## Tests

- Not run (lokal und VPS).

## Offene Punkte

- Änderungen auf VPS deployen (rsync gemäß `VPS_UPDATE_PROCESS.md`) und Service neu starten.
- UI-Verifikation auf VPS: Kunden Detail → “Zu Kurs hinzufügen” → Kursauswahl → Prefill im Teilnehmer-Dialog.

Quick start, 3 Launchcodes (manual):

- `sudo systemctl start mariadb && sudo systemctl status mariadb`
- `DOGULE1_STORAGE_MODE=mariadb DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran node tools/server/apiServer.js`
- `DOGULE1_STORAGE_MODE=mariadb DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran DOGULE1_PASSWORD_FILE=/home/ran/codex/dogule1/dogule1.passwords pnpm dev`

Quick stop (manual):

- `pkill -f "tools/server/apiServer.js|vite dev|pnpm dev|vite" 2>/dev/null || true`
- `sudo systemctl stop mariadb`

# Date 2026-02-07 — VPS update fix + Trainer Übungsbibliothek write + Schulungen footer spacing

## Kontext

- Status: completed.
- Scope: fix recurring VPS deploy failure, allow trainer create in Übungsbibliothek, and add Schulungen form footer spacing.

## Ergebnis (kurz)

- Confirmed root cause: rsync with trailing slashes flattened `tools/`, breaking `/opt/dogule1/tools/server/apiServer.js`.
- `VPS_UPDATE_PROCESS.md` updated with minimal update flow and explicit “run rsync locally / no trailing slashes” warning.
- RBAC: `trainer_rapport` can now write `uebungsbibliothek` (trainer create works).
- Übungsbibliothek uploads: unauthenticated GET is allowed for `/api/uebungsbibliothek/uploads/*`.
- Schulungen create/edit footer now has margin via `.schulungen-form-footer`.
- Schulungen images still 404 until uploads are restored (folder empty on VPS).

## Tests

- VPS service active: `systemctl status dogule1` ✅
- UI checks pending: trainer Übungsbibliothek create + Schulungen footer spacing

## Offene Punkte

- Restore/re-upload Schulungen images.
- Confirm trainer create flow + Schulungen footer spacing after deploy.

# Date 2026-02-07 — VPS deploy fix: rsync flattening + Übungsbibliothek uploads auth

## Kontext

- Status: in progress.
- Scope: fix broken Übungsbibliothek/Schulungen images and recurring VPS deploy failure after rsync.

## Ergebnis (kurz)

- Identified recurring VPS crash: `Cannot find module '/opt/dogule1/tools/server/apiServer.js'` after deploy.
- Root cause: rsync with trailing slashes flattened `tools/` into `/opt/dogule1/server/...` and removed `/opt/dogule1/tools/`.
- Corrected deploy command (no trailing slashes) and documented in `VPS_UPDATE_PROCESS.md`, with explicit warning about flattening and missing `tools/`.
- API change: allow unauthenticated GET for `/api/uebungsbibliothek/uploads/*` so images render in `<img>`.
- Note: `/opt/dogule1/uploads/schulungen` is empty, causing `{"message":"not_found"}` for Schulungen images.

## Tests

- Pending: `systemctl status dogule1`, `/healthz`, and UI image re-check after corrected deploy + restart.

## Offene Punkte

- Verify VPS service running after restart.
- Restore Schulungen uploads if source images exist (otherwise re-upload).

# Date 2026-02-02 — Übungsbibliothek + Schulungen split, Kunden UI, VPS deploy recovery

## Kontext

- Status: completed.
- Scope: new Übungsbibliothek module + Schulungen permissions, Kunden detail list redesign, VPS deploy + recovery hardening.

## Ergebnis (kurz)

- Übungsbibliothek added as its own module (trainer create/edit); Schulungen stays read-only for trainer and editable by Richard.
- Übungsbibliothek + Schulungen overviews aligned (search, sorting, column widths); detail actions card spacing matched to Kurse.
- Kunden detail: Kurse card now sortable list with Startdatum/Kursname/Trainer/Hund, scrollable (4 rows); Hunde card moved beside Stammdaten with dog toggle and inline stammdaten; Historie cards styled like Dashboard birthdays.
- New APIs/routes for Übungsbibliothek; RBAC and router wiring updated; uploads handling in API router.
- MariaDB migrations added: `110_0_schulungen_created_by.sql`, `111_0_uebungsbibliothek.sql`; applied locally and on VPS (110 already present on VPS).
- VPS deploy recovery: restored missing `/opt/dogule1/modules`, `/opt/dogule1/tools`, `/opt/dogule1/dist`, `package.json` + `pnpm-lock.yaml`, and reinstalled prod deps; service running again.
- VPS update process hardened with explicit warning against `rsync --delete` without excludes and recovery steps for missing deps/dist.

## Tests

- Manual UI verification (local + VPS) for Übungsbibliothek/Schulungen/Kunden detail flows.
- VPS service health: `systemctl status dogule1` ✅ and `curl http://127.0.0.1:5177/` ✅.

## Offene Punkte

- VPS uploads (`/opt/dogule1/uploads`) were deleted during bad rsync; images are permanently lost (no backup). Future updates must use safe rsync excludes.

# Station 109 — Status reconciliation: mark prior stations completed

## Kontext

- Status: completed.
- Date: 2026-02-02.
- Scope: mark all prior stations as completed per user directive.

## Ergebnis (kurz)

- All historical stations in this log are now considered completed as of 2026-02-02, including any entries previously marked "in progress".
- No content changes to prior station blocks; completion is recorded via this reconciliation station.

## Tests

- Not run (status-only update).

## Offene Punkte

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 107 — VPS auth timeout fix + deploy recovery

## Kontext

- Status: completed.
- Scope: fix VPS auth timeout + recover broken deploy.

## Ergebnis (kurz)

- Auth timeout mitigated: access token TTL set to 45 minutes; HTTP client now auto-refreshes tokens on 401 and retries.
- VPS deploy recovered after wrong rsync target overwrote `/opt/dogule1` layout.
- Recreated `/opt/dogule1/config/dogule1.env` with fresh secrets; password file restored.
- Installed prod dependencies on VPS (mariadb, nodemailer); service running again.
- MariaDB port fixed to 3306 via env.
- Added `VPS_UPDATE_PROCESS.md` with full update checklist and pitfalls.

## Tests

- VPS service running; log shows MariaDB port 3306 ✅

## Offene Punkte

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 108 — Links audit: Hund/Kunde/Trainer → Kurse

## Kontext

- Status: completed.
- Scope: fix linked Kurse visibility in Hund/Kunde detail and Trainer links to Kurse.

## Ergebnis (kurz)

- Hund detail shows linked Kurse via Teilnehmer-Log (not only `hundIds`), with Kurs links.
- Kunde detail shows linked Kurse via Teilnehmer-Log and Hund relations, with Kurs links.
- Trainer detail now resolves Kurse by `trainerId` and `trainerIds` in HTTP mode.
- Trainer Kurse cards simplified to code + title only (removed date/time rows).

## Tests

- Manual: Hund/Kunde Kurse lists visible ✅
- Manual: Trainer Kurse list links render ✅
- VPS UI: hard reload required after deploy to refresh asset hashes ✅

# - - - - - - - - - - - - - - - - - - - -

# Station 106 — Cleanup: keep runtime, remove historical/NAS artifacts

## Kontext

- Status: completed.
- Scope: keep only what is required to run locally + VPS; everything else is history (STATUS.md only).

## Ergebnis (kurz)

- Removed NAS-only directories and historical archives from repo:
  - `.NAS-Distro/`, `.NAS-Backup-Distro/`, `attachments/archive/`, `attachments/docs/`,
    `attachments/status/`, `migration/legacy/`, `backups/`, `notes/`.
- Cleanup mirrored on VPS under `/opt/dogule1`.
- Local and VPS runtime checks OK after cleanup.

## Tests

- Local DB tables listed ✅
- Local API `/healthz` ✅
- VPS API `/healthz` ✅

## Notizen

- Follow-up: verify local + VPS runtime still work after cleanup.

# - - - - - - - - - - - - - - - - - - - -

# Station 105 — VPS-only setup: OS updated + rebooted

## Kontext

- Status: in progress.
- Scope: Contabo VPS-only deployment.

## Ergebnis (kurz)

- OS packages updated on VPS.
- VPS rebooted and verified with uptime.
- Non-root sudo user `dogule` created.
- SSH key added for `dogule` and root login/password auth disabled.
- UFW enabled; SSH/HTTP/HTTPS allowed.
- Core packages installed (curl/ca-certificates/gnupg/git/build-essential/mariadb-server).
- Node.js 20 LTS and pnpm installed and verified.
- App root `/opt/dogule1` created and owned by `dogule`.

## Offene Punkte

- Install runtime (Node, MariaDB) and deploy app.

# - - - - - - - - - - - - - - - - - - - -

# Station 105 — VPS-only pivot (Contabo)

## Kontext

- Status: in progress.
- Scope: Contabo VPS-only deployment; drop NAS-Backup + Windows installer.

## Ergebnis (kurz)

- VPS provisioned (Ubuntu 24.04.3 LTS) and reachable via SSH at 144.91.86.20.
- Deployment plan rewritten to VPS-only.

## Offene Punkte

- Run OS updates on VPS and reboot if required.
- Harden SSH + firewall.
- Install runtime (Node, MariaDB) and deploy app.

# - - - - - - - - - - - - - - - - - - - -

# Station 105 — NAS-Backup setup progress

## Kontext

- Status: in progress.
- Scope: NAS-Backup root + backup-only server.

## Ergebnis (kurz)

- Terminology set: NAS-Dogule (alpha) vs Install-Dogule (beta) + NAS-Backup.
- NAS-Backup root created at `/volume1/dogule1backup`.
- API payload copied into `/volume1/dogule1backup/api` via GUI.
- Master key created and stored at `/volume1/dogule1backup/config/backup_master_key.txt` (permissions 600).
- Token file created: `/volume1/dogule1backup/config/dogule1.backup.tokens`.

## Offene Punkte

- Start backup-only server with full env vars and keep it running (nohup).
- Verify `/healthz` on port 5178 and set reverse proxy `8444 → 5178`.
- Contabo VPS setup postponed; resume later.

# - - - - - - - - - - - - - - - - - - - -

# Station 105 — Naming + NAS-Backup separation

## Kontext

- Status: in progress.
- Scope: clarify NAS-Dogule (alpha) vs Install-Dogule (beta) + NAS-Backup separation.

## Ergebnis (kurz)

- Terminology added: NAS-Dogule (alpha), Install-Dogule (beta), NAS-Backup.
- NAS-Backup root created under `/volume1/dogule1backup`.
- Backup-only server script prepared (`tools/server/backupServer.js`).

## Offene Punkte

- Deploy backup-only server to NAS-Backup root and configure reverse proxy + env.

# - - - - - - - - - - - - - - - - - - - -

# Station 105 — Finding best deployment method

## Kontext

- Status: in progress.
- Scope: Windows MSI deployment with local runtime + NAS backup.

## Ergebnis (kurz)

- Target platform: Windows MSI installer.
- Runtime model: local Dogule server on client machine, not NAS-hosted.
- Data: stored locally with encrypted backups uploaded to NAS.
- Backup transport: HTTPS API on dedicated port `https://4c31.synology.me:8444`, `/backup/*` only.
- Auth: separate backup token, unique per client install.

## Offene Punkte

- Define backup API endpoints and token issuance.
- Decide backup encryption key management.
- Plan client update mechanism for later releases.

# - - - - - - - - - - - - - - - - - - - -

# Station 104 — Kurse expansion (Teilnehmer log + Kurs-only Zertifikat)

## Kontext

- Status: completed.
- Branch: `104`.
- Scope: Kurs Teilnehmer-Log + Kurs Historie UX, Teilnehmer flow (Kunde → Hund → Startdatum), Kurs-only Zertifikat-Erstellung, MariaDB storage wiring, and status badge storage usage.

## Ergebnis (kurz)

- Kurs Detail: Aktionen card moved to top, Zertifikat Hintergrund always collapsible, and Kurs Historie card added with search, clickable rows, “Zertifikat erstellen” + “Löschen”, and “Eintrag vom” column.
- Teilnehmer flow: “+ neuer Teilnehmer” creates entries with Kunde/Hund/Startdatum and updates the list without reload; delete prompts and optional rapport jump retained.
- Zertifikate: entry points removed from Hunde and Zertifikate overview; only Kurs Historie row creates Zertifikate with prefilled Kunde/Hund/Kurs; API guardrail blocks Zertifikate without matching Teilnehmer.
- Zertifikate form: manual trainer sections are foldable; placeholders de-gendered.
- Storage: added `kurs_teilnehmer` table + adapters/API routes; health badge now shows DB storage MB; removed gendered wording across UI/docs where found.

## Tests

- Manual: add Teilnehmer, list updates, delete entry, Zertifikat create from Kurs Historie ✅
- Manual: health badge shows `NAS OK · <ms> · <MB>` ✅
- Not run: unit/integration tests.

## Issues

- MariaDB `created_by` length overflow on first run; fixed by widening to TEXT via migration.

## Notizen

- Migrations applied locally:
  - `tools/mariadb/migrations/104_0_kurs_teilnehmer.sql`
  - `tools/mariadb/migrations/104_1_kurs_teilnehmer_created_by.sql`
  - `tools/mariadb/migrations/104_2_kurs_teilnehmer_created_by_text.sql`

# - - - - - - - - - - - - - - - - - - - -

# Station 102 — Geburtstagsemails text and formatting fixes

## Kontext

- Status: completed.
- Branch: `101`.
- Scope: dashboard birthday mailto subject/body formatting, line breaks, and wording for Kunde + Hund templates.

## Ergebnis (kurz)

- Kunden mailto uses the provided “Liebe{{r}} {{Kunde Vorname}}” template with exact line breaks and spacing, plus free lesson line and sign-off.
- Hund mailto uses the provided birthday wording (Geburtstag + Rufname) with matching spacing and sign-off.
- Added gender-aware Liebe/Lieber suffix based on `geschlecht` to resolve “Liebe{{r}}”.

## Tests

- Not run.

## Issues

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 101 — GUI cleanup (Anmeldung + Kunden address fields + UI consistency)

## Kontext

- Status: completed.
- Branch: `101`.
- Scope: Anmeldung UI cleanup; Kunden detail/form address split + Mobile; MariaDB schema updates.

## Ergebnis (kurz)

- Anmeldung: removed redundant top header; added spacing above "Auswerten" actions.
- Kunden detail/form: added Mobile + Strasse/PLZ/Ort; address parsing for legacy `adresse`; computed `adresse` on save; MariaDB columns + migration added.
- Rapporte: admin/developer now save directly from Kunde/Hund detail with "Rapport speichern"; Historie updates immediately without refresh; trainers still submit drafts.
- Kunden detail: removed "Zertifikat erstellen" action; removed outer section headers for Hunde/Zertifikate/Historie; unified smaller card spacing.
- Overview lists: rows are fully clickable with pointer cursor, blue hover (no underline) in Kunden/Hunde/Trainer/Zertifikate.
- Hunde list: applied compact 0.75rem spacing between Aktionen and Übersicht.
- Dashboard/Kunden/Kurse/Trainer/Zertifikate/Schulungen: applied compact 0.75rem top-card spacing (card-stack-compact).
- Kurs detail: show "Weitere Trainer 1–4"; Kurs edit/create: four additional trainer selects; validation/payload updated.
- MariaDB migration applied locally: `tools/mariadb/migrations/101_0_kunden_address_fields.sql`.

## Tests

- Not run.

## Issues

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 103 — Anmeldung refinement (draft fidelity, Historie split, gender inference)

## Kontext

- Status: completed (read-only).
- Branch: `101`.
- Scope: Anmeldung parsing improvements for Kunde/Hund fields, fuzzy Kurs match, Kunde/Hund detail alignment, and schema additions for Kunde anrede/heimatort/aufmerksam durch.

## Ergebnis (kurz)

- Kurs auto-select now uses best-match title logic when parsing Anmeldung emails (not exact match required).
- Anmeldung Kunde draft uses the same field set as Kunden detail (Anrede, Vorname, Nachname, Strasse, PLZ, Ort, E-Mail, Telefon, Geburtsdatum, Mobile, Heimatort, Aufmerksam durch).
- Anmeldung Hund draft now includes Geschlecht, Kastriert, Rasse, Rufname, Wurfdatum, Chip-Nr., matching Hunde detailview labels.
- Kunden schema extended with `anrede`, `heimatort`, `aufmerksam_durch`; adapters/validators/defaults updated; migration added `tools/mariadb/migrations/103_0_kunden_anrede_heimatort_aufmerksam.sql`.
- Anmeldung parser now captures Anrede → Geschlecht inference, Geburtsdatum, Mobile, Heimatort, Aufmerksam durch, Kastriert, Chip-Nr., and preserves address parts for Strasse/PLZ/Ort.
- Kunden detail shows Anrede/Vorname/Nachname explicitly, includes Aufmerksam durch; Hunde detail + form labels aligned to Wurfdatum/Chip-Nr.

## Tests

- Not run.

## Issues

- None.

# - - - - - - - - - - - - - - - - - - - -

This document is the authoritative status log for Dogule1 (replaces dogule1_status.md). Station suffix legend: `R` = lifecycle/retention, `K` = Kommunikation, `E` = Email/Outlook line.
Every station block is wrapped by a visual bracket line: `# - - - - - - - - - - - - - - - - - - - -

# Station 101 — GUI cleanup (Anmeldung + Kunden address fields + UI consistency)

## Kontext

- Status: completed (read-only).
- Branch: `101`.
- Scope: Anmeldung UI cleanup; Kunden detail/form address + mobile split; Rapporte direct save for admin/developer; list UX/hover/click; consistent card spacing; small UI cleanups.

## Ergebnis (kurz)

- Anmeldung: removed redundant top header; added spacing above "Auswerten" actions.
- Kunden detail/form: added Mobile + Strasse/PLZ/Ort; address parsing for legacy `adresse`; computed `adresse` on save; MariaDB columns + migration added.
- Rapporte: admin/developer now save directly from Kunde/Hund detail with "Rapport speichern"; Historie updates immediately without refresh; trainers still submit drafts.
- Kunden detail: removed "Zertifikat erstellen" action; removed outer section headers for Hunde/Zertifikate/Historie; unified smaller card spacing.
- Overview lists: rows are fully clickable with pointer cursor, blue hover (no underline) in Kunden/Hunde/Trainer/Zertifikate.
- Hunde list: applied compact 0.75rem spacing between Aktionen and Übersicht.
- Dashboard/Kunden/Kurse/Trainer/Zertifikate/Schulungen: applied compact 0.75rem top-card spacing (card-stack-compact).
- Kurs detail: show "Weitere Trainer 1–4"; Kurs edit/create: four additional trainer selects; validation/payload updated.

## Tests

- Not run.

## Issues

- None.

## Notizen

- MariaDB migration applied locally: `tools/mariadb/migrations/101_0_kunden_address_fields.sql`.
- Local port 5177 conflict resolved before restart.

# - - - - - - - - - - - - - - - - - - - -` before and after.

Each station block uses this structure (read-only):

- Title: `# Station X — <Title>` (for grouped history: `Station 1–17 — <Title>`).
- `## Kontext`: branch names, scope/goal/phase, prerequisites.
- `## Ergebnis (kurz)`: concise implementation summary (UI/data/logic, constraints).
- `## Tests`: commands run with outcomes (e.g., `pnpm lint`, `pnpm test`/`vitest`, `pnpm build`, `runIntegrityCheck`), note any warnings.
- `## Issues` (optional): failed tests/pushes/tooling, lint/build hiccups, and how resolved. Omit if none.
- `## Notizen` (optional): pending manual checks, warnings, risks, decisions.
  Instructions/notes in English; UI text references remain in German when quoted. Chronological order applies.
- READ-ONLY INSTRUCTIONS: All stations (including historical ones) must stay logged in this file; never replace or truncate existing entries when adding new stations. If a truncation occurs, restore the full history before adding new content (the Station 39–41 overwrite was fixed by restoring Stations 1–38 and reappending 39–41).

Branching rule: each station must be developed on its dedicated branch; if the expected branch does not exist yet, create a new one before starting the station.

# - - - - - - - - - - - - - - - - - - - -

# Station 101 — GUI cleanup (Anmeldung + Kunden address fields)

## Kontext

- Status: in progress.
- Branch: `101`.
- Scope: Anmeldung UI cleanup; Kunden detail/form address split + Mobile; MariaDB schema updates.

## Ergebnis (kurz)

- Anmeldung: removed redundant top "Anmeldung" header outside the card; added spacing above "Auswerten" button via `anmeldung-actions`.
- Kunden detail: added "Mobile" after "Telefon"; split address into Strasse/PLZ/Ort display (fallback parses legacy `adresse`).
- Kunden form: replaced single Adresse field with Mobile + Strasse + PLZ + Ort fields; computed `adresse` from parts on save.
- Parsing: improved address parsing for inline `Strasse PLZ Ort` (e.g., "Kirchweg 23 5415 Nussbaumen AG").
- Storage/schema:
  - MariaDB: new columns `mobile`, `strasse`, `plz`, `ort` in `kunden`.
  - Added migration `tools/mariadb/migrations/101_0_kunden_address_fields.sql`.
  - Updated MariaDB adapter + real adapter + validators + API defaults.

## Tests

- Not run.

## Issues

- UI loads forever after changes; API restart attempts failed with `EADDRINUSE` on port 5177.

## Notizen

- Resume by identifying the process on port 5177 and stopping it, then restart API + `pnpm dev`.
- Apply migration `101_0_kunden_address_fields.sql` to local (and NAS if needed).

# - - - - - - - - - - - - - - - - - - - -

# Station 101 — NAS → Local MariaDB copy (dump + transfer)

## Kontext

- Status: in progress.
- Branch: `101`.
- Scope: copy NAS MariaDB `dogule1` into local MariaDB (NAS is source of truth), full overwrite on local.

## Ergebnis (kurz)

- NAS dump created at `/tmp/dogule1_nas.sql` (and `.sql.gz`).
- Local DB dropped/recreated: `DROP DATABASE dogule1; CREATE DATABASE dogule1;`.
- Local dump file transferred via SSH stream to `/tmp/dogule1_nas.sql` (scp from NAS `/tmp` failed).
- Import completed into local `dogule1` database.
- Local MariaDB password confirmed for user `ran` (recorded in `NAS_UPDATE_AND_SETUP.md`).

## Tests

- `mariadb -u ran -p -e "SELECT 1;"` ✅
- `mariadb -u ran -p -e "USE dogule1; SHOW TABLES;"` ✅

## Issues

- `scp me@192.168.1.116:/tmp/dogule1_nas.sql` failed with “No such file or directory”; resolved by streaming file via `ssh me@192.168.1.116 "cat /tmp/dogule1_nas.sql" > /tmp/dogule1_nas.sql`.

## Notizen

- Import completed via `mariadb -u ran -p dogule1 < /tmp/dogule1_nas.sql`.

# - - - - - - - - - - - - - - - - - - - -

# Station 100 — Anleitung Popup + Kursinhalt Lines

## Kontext

- Status: completed (read-only).
- Branch: `100`.
- Scope: Kursinhalt Theorie/Praxis inputs as 5 fixed-width lines, global Anleitung popup per module, NAS deploy sync prep.

## Ergebnis (kurz)

- Kursinhalt Theorie/Praxis now uses five single-line inputs (24 chars) that serialize to the same newline-separated text output.
- Added global Anleitung button next to auth actions that opens a German module instruction popup.
- Synced `attachments/material/Material/` into `.NAS-Distro/attachments/material/Material/`.
- Updated `FEATURES_TO_IMPLEMENT.md` and marked Station 99 as read-only.
- Rebuilt frontend and synced `dist/` into `.NAS-Distro/app/`.

## Tests

- `pnpm build` ✅

# - - - - - - - - - - - - - - - - - - - -

# Station 99 — New Features (Schulungen + Kommunikation + Local Auth + UI fixes)

## Kontext

- Status: completed (read-only).
- Branch: `99-newfeatures`.
- Scope: Schulungen module, Kommunikation overhaul (Infochannel only), local passwordless auth, dashboard/report polish, Zertifikate delete, trainer forced mobile view, UI wrapping fixes.

## Ergebnis (kurz)

- Schulungen module added end-to-end:
  - UI list + detail + create with dynamic text blocks and image uploads (min 1 block).
  - Detail view shows date + title; image previews are small and clickable to full size.
  - Overview includes delete with warning (matches Schulungen pattern).
  - API/storage wiring added for list/get/create/delete/upload.
  - MariaDB schema + migration added (`schulungen`), local migration file `tools/mariadb/migrations/99_0_schulungen.sql`.
  - Uploads served at `/api/schulungen/uploads/<file>` (public GET).
- Kommunikation module overhauled:
  - Removed System/Chats; only Infochannel remains (tabs hidden when only one).
  - SLA removed completely; trainers can still confirm; confirmations show trainer.
  - Publish restricted to Richard Fontana; admin-only delete on notices.
  - Historie list is vertical; spacing and back button styling aligned with other modules.
  - Trainer status bars (Ausstehend/Bestätigt) hidden for non-admin trainers.
- Local auth behavior updated (NAS untouched):
  - Local login is passwordless for all users; NAS still requires passwords from `DOGULE1_PASSWORD_FILE`.
  - Login UI no longer blocks empty password.
  - Header auth button is visible consistently.
- UI/feature fixes:
  - Dashboard raporte draft shows trainer name and improved meta.
  - Zertifikate overview delete button with warning.
  - Navigation and routing include Schulungen.
  - Historie/post text now wraps within card/frame (Kunden/Hunde Rapporte, Schulungen detail, Kommunikation detail).
- Trainer forced mobile view:
  - Adds forced mobile layout for trainer roles via `force-mobile` class + inline styles.
  - Enlarged fonts/buttons, full-width layout, and tighter side margins for trainer sessions.

## Tests

- Not run.

## Issues

- Outlook mailto still shows `+` in subject/body for birthday emails (needs investigation).
- Trainer forced mobile view still reported as unchanged in browser testing (user asked to leave as-is for now).

## Notizen

- NAS remains passworded; local passwordless is gated by runtime path check (`/volume1`).
- Schulungen local migration run manually:
  - `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock dogule1 < tools/mariadb/migrations/99_0_schulungen.sql`
- NAS cleanup (dog duplicates):
  - Rule: same owner + same name + same birthdate; delete lower `filled_score` row (tie: keep lowest id).
  - Deleted 112 rows from `hunde` on NAS; verification shows 0 duplicate groups remaining.
- Header logo update:
  - Replaced logo asset with `/home/ran/Downloads/ChatGPT Image Jan 22, 2026, 11_09_53 PM.png`.
  - Removed "DOGULE" text from header; adjusted brand card sizing for new PNG.
  - Rebuilt UI and updated `.NAS-Distro/app/` plus `.NAS-Distro/api/modules/shared/`.

# - - - - - - - - - - - - - - - - - - - -

# Station 98 — NAS MariaDB DogTabs Kunden/Hunde Refresh

## Kontext

- Status: read-only (completed).
- Branch: `98`.
- Scope: update NAS MariaDB kunden/hunde from DogTabs exports (`Kundenliste_2026-01-15 17-30.xls`, `rpt_sel_kundenliste.pdf`), generate NAS-schema CSVs, and preserve existing NAS IDs/links.

## Ergebnis (kurz)

- Started Station 98 and verified NAS MariaDB connection details from `/volume1/dogule1nasfolder/config/dogule1.env`.
- Generated NAS-schema CSVs from DogTabs XLS/PDF with NAS ID preservation: `attachments/nas_kunden.csv`, `attachments/nas_hunde.csv`, plus merge report `attachments/nas_merge_report.json`.
- Imported CSVs into NAS MariaDB via staging tables and upserted into `kunden`/`hunde`.
- Post-import counts on NAS: `kunden=1418`, `hunde=1734`.

## Tests

- Not run (manual NAS import and count checks only).

## Notizen

- NAS MariaDB socket access confirmed for user `dogule1` (password `Dogule1!2026`).
- NAS exports captured before import: `/volume1/dogule1nasfolder/exports/kunden.tsv`, `/volume1/dogule1nasfolder/exports/hunde.tsv` and copied locally to `attachments/`.
- Manual owner mapping applied to resolve ambiguous PDF names (e.g., Almeira/Rodrigues, Binzegger, De Pasquale, Fellmann, Fontana, Knecht, Meier, Mohr, Wäspi, Wettstein).
- Import flow (NAS):
  - `DROP TABLE IF EXISTS kunden_import; DROP TABLE IF EXISTS hunde_import;`
  - `CREATE TABLE kunden_import LIKE kunden; CREATE TABLE hunde_import LIKE hunde;`
  - `LOAD DATA LOCAL INFILE '/volume1/dogule1nasfolder/exports/nas_kunden.csv' INTO TABLE kunden_import ...`
  - `LOAD DATA LOCAL INFILE '/volume1/dogule1nasfolder/exports/nas_hunde.csv' INTO TABLE hunde_import ...`
  - Upsert into `kunden`/`hunde` with `INSERT ... ON DUPLICATE KEY UPDATE ...`
  - Verified counts: `SELECT COUNT(*) FROM kunden; SELECT COUNT(*) FROM hunde;`
  - Dropped staging tables after verification: `DROP TABLE IF EXISTS kunden_import; DROP TABLE IF EXISTS hunde_import;`

# - - - - - - - - - - - - - - - - - - - -

# Station 97 — NAS Deployment (Schema Drift Hardening + Kurs Preview Fold)

## Kontext

- Status: completed (manual verification done on NAS).
- Branch: `97`.
- Scope: stop repeating NAS breakage caused by MariaDB schema drift; improve Kurs detail UX.

## Ergebnis (kurz)

- NAS autostart hardened: `.NAS-Distro/api/start_if_needed.sh` now uses a lock to avoid repeated parallel starts (previously `EADDRINUSE :5177` spam) and runs `api/tools/mariadb/nas-ensure-schema.sh` before starting the API.
- Added `tools/mariadb/nas-ensure-schema.sh` and deployed via `.NAS-Distro/api/tools/mariadb/`:
  - Applies `schema.sql` and all `migrations/*.sql`.
  - Force-creates missing tables `rapporte_drafts` and `anmeldung_drafts` using the NAS collation (and retries `rapporte_drafts` without FK if the FK is rejected).
  - Logs to `/volume1/dogule1nasfolder/logs/schema.log`.
- Resolved NAS-only failures:
  - Kurs save 500 (`storage_error`) caused by schema mismatch (missing `kurse.zertifikat_hintergrund`).
  - Rapport draft submit 400 caused by missing `rapporte_drafts`.
  - Anmeldung drafts 500 caused by missing `anmeldung_drafts`.
- Kurs detail UX: Zertifikat Hintergrund preview is now collapsed by default and only expands on click.

## Tests

- Local: `pnpm build` ✅
- NAS: manual verification only.

## Notizen

- Canonical rule reinforced: `.NAS-Distro` is the source of truth; copy subfolders (`app/`, `api/`, `config/`) to NAS to avoid drift.
- MariaDB tooling on NAS: `mysql` client was used (not `mariadb`); `!` in passwords requires quoting.

# - - - - - - - - - - - - - - - - - - - -

# Station 97 — NAS Deployment (Password File Migration)

## Kontext

- Status: completed (manual verification done).
- Branch: `97`.
- Scope: move NAS login passwords to a deterministic config file and remove `.pw.txt` dependency.

## Ergebnis (kurz)

- Auth now reads `username:password` entries from `DOGULE1_PASSWORD_FILE` (defaults to `config/dogule1.passwords`).
- Password seeding now overwrites existing hashes to avoid stale credentials after password changes.
- NAS deploy workflow updated to require `DOGULE1_PASSWORD_FILE` in `config/dogule1.env` and a mirrored `.NAS-Distro`.
- NAS autostart script cleaned and kept in `.NAS-Distro/api/start_if_needed.sh`.

## Tests

- Not run (manual NAS verification only).

## Notizen

- Manual NAS steps: copy `.NAS-Distro` to `/volume1/dogule1nasfolder`, ensure `config/dogule1.passwords` exists, add `DOGULE1_PASSWORD_FILE` to `config/dogule1.env`, restart API, and rebooted NAS to confirm login success.
- Old `.pw.txt` flow is deprecated and no longer used.

# - - - - - - - - - - - - - - - - - - - -

# Station 96 — Hide modules Kalender/Finanzen/Waren

## Kontext

- Status: completed (manual verification done).
- Branch: `96`.
- Scope: hide Kalender/Finanzen/Waren in UI and block direct access for all roles.

## Ergebnis (kurz)

- Removed Kalender/Finanzen/Waren from layout navigation and the legacy module index page.
- Disabled access to those modules via RBAC and route parsing, redirecting direct hashes to the default module.
- Kept module internals and API behavior unchanged; only visibility and access were adjusted.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅ (warning: `--localstorage-file` without a valid path)
- `pnpm build` ✅

## Issues

- Vitest logs a `--localstorage-file` warning and groupchat read-marker warnings; tests still pass.

## Notizen

- Manual checks completed: nav hides Kalender/Finanzen/Waren; direct hashes `#/kalender`, `#/finanzen`, `#/waren` are blocked/redirected; legacy module index hides those links; dashboard shows only allowed modules.
- Follow-up: birthday mail warnings for Kunde status `deaktiviert` and Hund status `verstorben` verified on dashboard (prominent warning + confirmation dialog warning).

# - - - - - - - - - - - - - - - - - - - -

# Station 97 — NAS Deployment (Password Login Prep)

## Kontext

- Status: in progress.
- Branch: `97`.
- Scope: require password-based logins for all users and prep NAS deployment notes.

## Ergebnis (kurz)

- Auth now verifies passwords from `.pw.txt` (PBKDF2) for seed users and trainer logins.
- Login UI requires a password input; dropdown user selection remains.
- NAS update workflow notes updated to track `.NAS-Distro` path and password file handling.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅ (warning: `--localstorage-file` without a valid path)

## Issues

- Vitest logs a `--localstorage-file` warning and groupchat read-marker warnings; tests still pass.

## Notizen

- `.pw.txt` is ignored by git and must be present alongside the API process working directory at runtime (e.g., NAS).

# - - - - - - - - - - - - - - - - - - - -

# Station 95 — Trainer minimal login (Rapport-only) (Detailed)

## Kontext

- Status: completed.
- Branch: `95`.
- Scope: minimal trainer role for rapport draft creation only; restrict access surface to Kunden/Hunde lookup + Rapporte drafts.
- Prerequisites: Station 94 Rapporte drafts + admin approval flow already in place.

## Ergebnis (kurz)

- Added `trainer_rapport` role for trainer logins (non-admin trainers) and surfaced it in login options with " - Rapport" suffix to signal limited access.
- RBAC: `trainer_rapport` allows Kunden/Hunde read access plus Rapporte read (own drafts) and write (draft create); no other module/API access.
- Rapporte API: draft list/get stays filtered to own drafts for rapport-only trainers; approve/reject remain admin/developer only.
- Kunden UI: rapport-only trainers see detail + rapport draft card, but no create/edit/delete actions, no list actions, and no Historie/Zertifikate/linked Hunde sections.
- Hunde UI: rapport-only trainers see detail + rapport draft card, but no create/edit/delete actions, no list actions, and no Historie/Zertifikate sections; Hunde form access is blocked.
- Groupchat UI test stabilization: retain pending/failed messages while loading chat history; retry temp-dir cleanup to avoid ENOTEMPTY on test teardown.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅ (warning: `--localstorage-file` without a valid path)
- `pnpm build` ✅

## Issues

- Vitest emits a `--localstorage-file` warning from the groupchat UI test harness; tests still pass.

## Notizen

- Groupchat UI tests log "Failed to update read marker" during runs; no failures observed.

# - - - - - - - - - - - - - - - - - - - -

# Station 95 — Trainer minimal login (Rapport-only) (Tests)

## Kontext

- Status: completed (automated tests run).
- Branch: `95`.
- Scope: Station 95 verification.

## Ergebnis (kurz)

- Automated checks run for lint, vitest, and build.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅ (warning: `--localstorage-file` without a valid path)
- `pnpm build` ✅

## Issues

- Vitest emits a `--localstorage-file` warning from the groupchat UI test harness; tests still pass.

# - - - - - - - - - - - - - - - - - - - -

# Station 95 — Trainer minimal login (Rapport-only)

## Kontext

- Status: completed.
- Branch: `95`.
- Scope: minimal trainer role for rapport-only access.

## Ergebnis (kurz)

- Added `trainer_rapport` role mapping for trainer logins with rapport-only labeling in login options.
- Restricted rapport-only trainers to Kunden/Hunde read access and Rapporte draft create; other module/API access blocked.
- Kunden/Hunde UI hides create/edit/delete actions and Historie/Zertifikate for rapport-only trainers while keeping Rapport draft entry.

## Tests

- Not run (manual).

## Notizen

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 94 — Rapporte: Trainer draft → Admin confirmation (Tests)

## Kontext

- Status: completed (automated tests run).
- Branch: `94`.
- Scope: Station 94 verification after trainer/admin manual checks.

## Ergebnis (kurz)

- Automated checks run for lint, vitest, and build.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅ (warning: `--localstorage-file` without a valid path)
- `pnpm build` ✅

## Issues

- Vitest emits a `--localstorage-file` warning from the groupchat UI test harness; tests still pass.

# - - - - - - - - - - - - - - - - - - - -

# Station 94 — Rapporte: Trainer draft → Admin confirmation

## Kontext

- Status: completed (manual verification done).
- Branch: `94`.
- Scope: trainer submits rapport drafts, admin reviews/approves into Historie.

## Ergebnis (kurz)

- Added MariaDB `rapporte_drafts` table + migration.
- Added API/storage for draft list/create/approve/reject with RBAC.
- Trainer can submit rapport drafts from Kunde/Hund detail; admin dashboard lists drafts and approves/rejects.
- Approvals write Historie entries on Kunde (and Hund if target is Hund) with trainer first-name in text.

## Tests

- Not run (manual).

## Notizen

- MariaDB migration applied: `tools/mariadb/migrations/94_0_rapporte_drafts.sql`.

# - - - - - - - - - - - - - - - - - - - -

# Station 93 — Dashboard birthdays + mailto

## Kontext

- Status: completed (manual verification done).
- Branch: `93`.
- Scope: Dashboard “Heutige Geburtstage” with global once-per-day handling and mailto preparation.

## Ergebnis (kurz)

- Added `kunden.geburtsdatum` and a global handled table (`dashboard_birthdays_handled`).
- Dashboard shows today’s birthdays for Kunden + Hunde with actions:
  - “Verwerfen” hides entry for the day and writes a Historie entry on the Kunde.
  - “Geburtstagsemail” shows a confirmation first, then opens `mailto:` (no auto-send) and writes Historie on the Kunde.
- Historie entries are now editable/deletable (admin/developer) and list newest → oldest; Zertifikate shown above Historie (below Hunde).

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅

## Notizen

- MariaDB migration applied: `tools/mariadb/migrations/93_0_dashboard_birthdays.sql`.

# - - - - - - - - - - - - - - - - - - - -

# Station 92 — Modul Anmeldung (Completion)

## Kontext

- Status: completed (manual verification done).
- Branch: `feature/station92`.
- Scope: closeout for Station 92 implementation + follow-up UX hardening.

## Ergebnis (kurz)

- End-to-end flow verified: paste email → create draft → save Kunde → save Hund → Historie entries present for both Kunde/Hund.
- Prevents double-saving Kunde/Hund on finalize (server-side draft locks + UI in-flight guards).
- Dashboard: removed “Schnellaktionen”/“Kennzahlen” and added on-demand duplicate scanner (report-only).
- Restored cross-links: Kunde detail shows linked Hunde; Hund detail links to linked Kunde.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅

## Notizen

- Duplicate cleanup remains manual by design (scanner is warning/report only).

# - - - - - - - - - - - - - - - - - - - -

# Station 92 — Modul Anmeldung (Draft Intake + Historie)

## Kontext

- Status: in progress (manual verification pending).
- Branch: `feature/station92`.
- Scope: Anmeldung copy-paste intake → drafts → course assignment gate → Kunde/Hund finalize + Historie entries; show Historie in Kunde/Hund detail views.

## Ergebnis (kurz)

- Added new module `Anmeldung` with email paste + parse preview, draft edit screen, Kurs assignment, and actions to create Kunde then Hund.
- Added MariaDB-backed draft + history storage (`anmeldung_drafts`, `historie_entries`) with new API routes:
  - Draft CRUD: `/api/anmeldung/drafts` + `/api/anmeldung/drafts/:id`
  - Finalize: `/api/anmeldung/drafts/:id/kunde` then `/api/anmeldung/drafts/:id/hund`
  - Historie: `/api/historie` (list/create; filtered by `entityType` + `entityId`)
- Dashboard now renders draft cards “Neuer Kunde (Entwurf)” and “Neuer Hund (Entwurf)” linking to `#/anmeldung/:draftId`.
- Kunde/Hund detail views now show Historie + Zertifikate sections (customer-linked Hunde list removed; Hund owner moved into Stammdaten).

## Tests

- `pnpm lint` ✅
- `pnpm build` ✅
- `pnpm vitest run` ❌ (3 failing tests observed: `authService` token expiry, `groupchat` retention UI, `realAdapter` parity check requiring Kurs Ort; appears unrelated to Station 92 changes)

## Notizen

- Superseded by the Station 92 completion block above (final manual verification passed and tests are green there).
- MariaDB schema needs to be applied/updated to create new tables: `mariadb --protocol=socket --socket <...> < tools/mariadb/schema.sql`.
- Parsing is heuristic until a real sample Anmeldung email format is provided for tightening.

# - - - - - - - - - - - - - - - - - - - -

# Station 91 — Kurs → Zertifikat Hintergrund (PNG)

## Kontext

- Status: completed.
- Branch: `feature/station91`.
- Scope: per-kurs certificate background PNG, selection/preview, block generation when missing.

## Ergebnis (kurz)

- Added background mapping helper, Kurs UI selection/preview, and PDF background resolution.
- Shifted Kursinhalt lists ~7mm left in Zertifikat PDF layout for alignment.

## Tests

- Not run (manual).

## Notizen

- `modules/zertifikate/certificatePdf.js` modified per read-only guard.

# - - - - - - - - - - - - - - - - - - - -

# Station 90 — Kunden: Heimatort in Detailview (read-only)

## Kontext

- Status: completed.
- Branch: `feature/station90`.
- Scope: add read-only Heimatort field to Kunden detail view.

## Ergebnis (kurz)

- Kunden detail “Stammdaten” now shows Heimatort with standard placeholder for empty values.
- Field reads from `heimatort` with fallback to `heimatOrt`.

## Tests

- Not run (manual).

## Notizen

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 89 — Login password reset with email code

## Kontext

- Status: read-only (completed).
- Branch: `feature/station89`.
- Scope: note manual password reset process (no self-service reset).

## Ergebnis (kurz)

- Removed self-service reset UI/endpoints and reset helpers; password resets are handled manually by an admin.

## Tests

- Not run (manual).

## Notizen

- Manual reset only (no email or TOTP flow).

# - - - - - - - - - - - - - - - - - - - -

# Station 88 — Login dropdown + simplified roles

## Kontext

- Status: read-only (completed).
- Branch: `feature/station88`.
- Scope: dropdown login for trainers + developer, remove passwords, reduce roles to Admin/Trainer with TR-001 as Admin; simplify detail views for Kunden/Hunde/Kurse/Trainer.
- Preconditions: MariaDB storage available for trainer list.

## Ergebnis (kurz)

- Login UI now loads `/api/auth/options` and uses a dropdown; password input removed.
- Auth accepts username-only logins; trainer users are provisioned from trainer records; Developer remains a seed login with full access.
- RBAC reduced to Admin/Trainer plus Developer full access; trainer access limited to Kunden/Hunde and matching API guards.
- Kunden detail now shows only Hunde dieses Kunden and Zertifikate; Hunde detail now shows Besitzer + Zertifikate.
- Kurse detail removes participant + finance sections; Trainer detail removes calendar and revenue sections.

## Tests

- Not run (manual).

## Notizen

- Admin assignment is derived from trainer code `TR-001` (Fontana Richard).

# - - - - - - - - - - - - - - - - - - - -

# Station 87 — Remove module title + description blocks

## Kontext

- Status: read-only (completed).
- Branch: `station87-remove-module-headers`.
- Scope: remove module title/description blocks and align Zertifikate layout with other modules.

## Ergebnis (kurz)

- Removed top title/description header blocks across module pages.
- Zertifikate list/detail/create now follow the same action-card + content-card structure as other modules.

## Tests

- Manual UI check: Dashboard, Kunden, Hunde, Kurse, Trainer, Zertifikate ✅

## Notizen

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 86 — Align left-nav module list with overview grid

## Kontext

- Status: read-only (completed).
- Branch: `station86-align-nav`.
- Scope: align left-nav module titles with module names in the overview grid.

## Ergebnis (kurz)

- Adjusted left-nav padding to align module titles with overview grid labels.

## Tests

- Manual UI check: left-nav alignment ✅

## Notizen

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 85 — App header card (FontanasLogo + DOGULE title)

## Kontext

- Status: read-only (completed).
- Branch: `84XCleanUp`.
- Scope: add header card with Fontanas logo and DOGULE title.

## Ergebnis (kurz)

- Header card shows the Fontanas logo (181x73) on the left and large white "DOGULE" text on the right within the same frame.
- Layout updated in shared header styling to reflect the new sizing.

## Tests

- Manual UI check: Dashboard and one module page ✅

## Notizen

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 84U — NAS Update Workflow (Remote)

## Kontext

- Status: completed.
- Branch: `feature/station84u-nas-update-workflow`.
- Scope: implement UI/login updates, validate manual NAS update flow, and document a minimal update workflow.
- Preconditions: NAS pilot running with reverse proxy (`4c31.synology.me:8443`), manual drag & drop updates.

## Ergebnis (kurz)

- Implemented header branding (Fontanas logo + DOGULE) and removed module title/description blocks across modules.
- Updated seed admin login to `Rifo` / `rifo6087`; login placeholder updated.
- Built and refreshed `.NAS-Distro`, manually copied to NAS, and confirmed core flows (Neuer Hund, Neuer Kurs, Zertifikat print).
- Documented minimal manual update workflow in `NAS_UPDATE_WORKFLOW.md`.
- Removed `staff` seed user and updated `developer` password to `devpass6087`; refreshed `.NAS-Distro` and manually copied to NAS.

## Tests

- NAS UI: `https://4c31.synology.me:8443/#/auth` loads ✅
- Manual flow checks: Neuer Hund, Neuer Kurs, Zertifikat drucken ✅
- Auth update: not re-verified after latest `.NAS-Distro` copy.

## Issues

- NAS `pnpm install --prod` failed due to husky `prepare` (`husky: command not found`); fixed by removing `scripts.prepare`.
- API restart hit `EADDRINUSE` on `:5177`; resolved by NAS reboot.

## Notizen

- User prefers manual drag & drop for NAS updates (including full `config/` when env changes).
- Latest `.NAS-Distro` copy was manual drag & drop.

# - - - - - - - - - - - - - - - - - - - -

# Station 84N.3 — NAS Data Sync + Autostart Hardening

## Kontext

- Status: completed (ops).
- Branch: `feature/station84n-nas-pilot`.
- Scope: sync local MariaDB data to NAS; ensure API autostarts on boot and restarts daily.
- Preconditions: local MariaDB running; NAS SSH access.

## Ergebnis (kurz)

- Local MariaDB started; full `dogule1` dump created and imported into NAS via socket.
- NAS data now matches local; counts verified for `kunden`, `hunde`, and `zertifikate`.
- Added `/volume1/dogule1nasfolder/api/start_if_needed.sh` (start API if not running).
- DSM Task Scheduler set to run the script on boot and daily; reboot verified API starts and UI loads.

## Tests

- Local dump: `mariadb-dump --protocol=socket --socket /run/mysqld/mysqld.sock -u ran -p dogule1 > /tmp/dogule1.sql` ✅
- NAS import: `mysql --protocol=socket --socket /run/mysqld/mysqld.sock -u dogule1 -p dogule1 < /volume1/dogule1nasfolder/dogule1.sql` ✅
- NAS counts: `SELECT COUNT(*) AS kunden FROM kunden; ...` ✅ (kunden 1412, hunde 388, zertifikate 2)
- Reboot check: API serves `http://192.168.1.116:5177/#/auth` ✅

## Notizen

- `scp` to `/volume1/dogule1nasfolder` failed (NAS scp path handling); used SSH stream copy instead.
- Remote access via reverse proxy still pending; user will resume tomorrow.

# - - - - - - - - - - - - - - - - - - - -

# Station 84N.2 — NAS Pilot Execution (Distro Refresh, API Bring-Up, Zertifikate Fix)

## Kontext

- Status: completed.
- Branch: `feature/station84n-nas-pilot` (existing).
- Scope: refresh `.NAS-Distro`, deploy to NAS, install runtime deps, start API, fix Zertifikate load error, log every detail into `NAS_STATION84N_PILOT.md`.
- Preconditions: NAS access via SSH, MariaDB running on NAS, local MariaDB for data export (blocked by sudo).

## Ergebnis (kurz)

- Collected and logged full NAS inventory + network/port forwarding details and all actions (including credentials) into `NAS_STATION84N_PILOT.md` with high granularity.
- Refreshed `.NAS-Distro` locally (`pnpm build`, synced `dist/`, `modules/`, `tools/server/`, `tools/ops/`, `tools/mariadb/`), copied to NAS `/volume1/dogule1nasfolder`, and installed prod deps after removing `scripts.prepare` (husky).
- Started NAS API successfully; confirmed UI served from `/volume1/dogule1nasfolder/app` after updating `DOGULE1_WEB_ROOT` in the env file.
- Resolved Zertifikate load error by creating missing `zertifikate` table with `utf8mb4_uca1400_ai_ci` collation and valid FKs; Zertifikate UI now loads (empty).
- Created DSM Task Scheduler Triggered Task (root) to autostart API on boot; manual Run verified API responds on NAS.

## Tests

- Local: `pnpm build` ✅
- NAS: `pnpm install --prod` ✅ (after removing `prepare` script)
- NAS: `curl http://127.0.0.1:5177/api/kunden` → `{"message":"missing_token"}` ✅ (expected)
- NAS: `SHOW TABLES LIKE 'zertifikate'` ✅ after manual CREATE
- NAS: Task Scheduler Run → `curl http://127.0.0.1:5177/api/kunden` → `{"message":"missing_token"}` ✅

## Issues

- NAS `pnpm install --prod` failed initially due to husky `prepare` script (`husky: command not found`); resolved by removing `scripts.prepare` in NAS `package.json`.
- `83_2_zertifikate_schema.sql` failed due to FK collation mismatch (`collation_database=utf8mb3_general_ci`); resolved via manual CREATE with `utf8mb4_uca1400_ai_ci`.
- Local MariaDB not running; `sudo` password rejected, blocking local dump → NAS data still behind local.

## Notizen

- API autostart configured via DSM Task Scheduler; reboot verification pending.
- NAS env includes automation defaults; UI now served from `/volume1/dogule1nasfolder/app`.
- Data sync from local to NAS remains pending until local MariaDB can be started.
- Merged into Station 84N summary for project-level completion tracking.

# - - - - - - - - - - - - - - - - - - - -

# Station 84 — Automation & Certificates (Kommunikation/System)

## Kontext

- Status: completed (awaiting SMTP credentials).
- Branch: `feature/station84-automation`.
- Scope: event-driven automation scaffolding for birthday + certificate delivery, admin approval flow, SMTP test + send pipeline (no cron, no auto-send).
- Preconditions: MariaDB required; Kommunikation System tab available; Outlook SMTP settings pending.

## Ergebnis (kurz)

- Added automation settings + events storage, validators, and audit logging; new API routes for settings/events + event decision update + SMTP connection test.
- Kommunikation → System tab now renders automation settings (sender + SMTP fields), SMTP test button, and event list with approve/deny controls.
- Event hooks: new Hund with today's birthday logs an event; new Zertifikat logs a delivery event.
- Approval flow persists decisions and attempts send only when `sendingEnabled=true` and SMTP is ready; status moves to `sent` or `failed` with reason/error captured.
- Added nodemailer dependency for SMTP verification and send pipeline; Outlook credentials still required to operate.

## Tests

- Not run (manual UI verification only).

## Notizen

- SMTP credentials are still missing; system is prepared but blocked until Outlook settings are supplied.

# - - - - - - - - - - - - - - - - - - - -

# Station 84N — NAS Client Pilot

## Kontext

- Status: completed.
- Branch: `feature/station84n-nas-pilot`.
- Scope: define and validate NAS pilot runbook for single-client testing, including remote access.
- Preconditions: NAS access with Node, pnpm, MariaDB, and router port forwards.

## Ergebnis (kurz)

- Expanded `NAS_STATION84N_PILOT.md` into a full runbook with validated NAS layout, deployment steps, dependency fixes, and data sync notes.
- Executed NAS pilot refresh: built and deployed `.NAS-Distro`, installed prod deps, fixed Zertifikate schema/collation, and verified API/UI bring-up.
- Configured DSM Task Scheduler autostart and verified external access via reverse proxy.
- Remote access configured via Synology DDNS (`4c31.synology.me`), Let's Encrypt cert, and reverse proxy on `:8443` to API `:5177`.
- External UI access confirmed at `https://4c31.synology.me:8443/#/auth`.

## Tests

- External access: `https://4c31.synology.me:8443/#/auth` ✅

## Notizen

- Update workflow formalization moved to Station 84U.

# - - - - - - - - - - - - - - - - - - - -

# Station 84N.1 — NAS Pilot Troubleshooting (Copy + Dependencies)

## Kontext

- Status: in progress (ops troubleshooting).
- Branch: `feature/station84n-nas-pilot`.
- Scope: get NAS pilot running from `.NAS-Distro` and resolve missing deps and copy flow.

## Ergebnis (kurz)

- Created `.NAS-Distro` payload locally with `app/`, `api/`, `config/`, `logs/`, `README.md`, and `dogule1.env` example.
- Built `dist/` locally and refreshed `.NAS-Distro/app/`.
- Added runtime env example pointing `DOGULE1_WEB_ROOT=/volume1/web/dogule1-staging`.
- Copied `package.json` + `pnpm-lock.yaml` into `.NAS-Distro/api` to allow prod dependency install on NAS.
- Logged missing `nodemailer` on NAS and updated README to require `pnpm install --prod` (or `npm install --omit=dev`).

## Tests

- `pnpm build` (local) ✅
- NAS API start failed due to missing `nodemailer` (no `package.json` on NAS at the time).

## Issues

- NAS `mysql --socket` works for `dogule1` user; TCP `127.0.0.1` not listening.
- Local→NAS copy not completed: rsync run from NAS fails; rsync from local failed due to SSH auth (wrong password/hostname).

## Notizen

- Use local host with SSH `me@192.168.1.116` to push `.NAS-Distro` to NAS.
- Install prod deps on NAS under `/volume1/dogule1nasfolder/.NAS-Distro/api` before starting API.

# - - - - - - - - - - - - - - - - - - - -

# Station 83.6 — Zertifikat-ID Whiteout

## Kontext

- Status: completed.
- Branch: `feature/station84-automation`.
- Scope: make Zertifikat-ID footer invisible on print by switching text color to white.
- Preconditions: Zertifikate PDF renderer in place.

## Ergebnis (kurz)

- Zertifikat-ID footer now renders in white (`#ffffff`) to avoid visibility on printouts.

## Tests

- Not run (visual change only).

## Notizen

- Logged due to `certificatePdf.js` read-only note.

# - - - - - - - - - - - - - - - - - - - -

# Station 83.5t — Zertifikate PDF Hybrid Renderer (PNG Overlay, Fine-Tuning)

## Kontext

- Status: completed (hybrid PNG overlay + iterative layout tuning).
- Branch: `feature/station83-3-zertifikate-ui`.
- Scope: replace HTML-flow PDF with PNG background + snapshot text overlays; repeated micro-layout adjustments to match canonical certificate; no PNG edits in repo (user-managed asset).
- Preconditions: `Material/zertifikat_bg_a4_300dpi.png` provided/updated externally; Zertifikate snapshots required; Trainer titles enforced.

## Ergebnis (kurz)

- Replaced Zertifikat PDF export with hybrid PNG renderer: full-page A4 background + absolute overlay text from snapshot-only fields.
- Centralized layout map for all overlay coordinates (percent-based), with controlled font sizing, line spacing, and overflow handling (wrap → shrink → truncate).
- Participant sentence now fully rendered by Dogule (four lines): “Hiermit bestätigen wir, dass” + Kunde name + “mit dem” + Hund line; course participation sentence rendered as `am Kurs "<Kursname>" erfolgreich teilgenommen hat.`.
- Added course title overlay above “Kursbestätigung” (blue, bold, larger) and aligned Kunde/Hund lines to the same visual axis.
- Kursinhalt bullets repositioned for visual centering under headers; fixed line height + max lines; deterministic truncation for overflow.
- Gratulation sentence now rendered fully by Dogule (Hundeführer).
- Ausstellungsdatum rendered as centered `Döttingen, DD.MM.YYYY` on the same axis as title/name.
- Trainer blocks aligned and synchronized (baseline/spacing) with right column shifted for symmetry.
- Added unobtrusive Zertifikat-ID footer (internal UUID) for authenticity verification.
- `modules/zertifikate/certificatePdf.js` marked read-only via file permissions (`chmod 444`) to prevent accidental edits.

## Tests

- Manual verification (Zertifikat `Z-002`):
  - Participant sentence (4 lines) renders cleanly; course sentence uses `am Kurs "<Kursname>" erfolgreich teilgenommen hat.` ✅
  - Course title line above “Kursbestätigung” is blue, bold, and centered ✅
  - Kursinhalt bullets align under headers, with stable wrapping/truncation ✅
  - Gratulation sentence rendered by Dogule (Hundeführer) ✅
  - Date line centered as `Döttingen, DD.MM.YYYY` ✅
  - Trainer blocks aligned and symmetric ✅
  - Zertifikat-ID footer visible and unobtrusive ✅

## Notizen

- PNG background is user-managed and treated as source-of-truth; no repo-side image edits allowed.
- `modules/zertifikate/certificatePdf.js` contains a read-only header note + filesystem read-only permissions to prevent accidental edits; log changes in `status.md` if modified.
- Read-only file updated once for lint globals; status note recorded here per guardrail.

# - - - - - - - - - - - - - - - - - - - -

# Station 83.4b — Kursinhalt Snapshots & Trainer-Titel

## Kontext

- Status: completed (schema + validation + PDF update).
- Branch: `feature/station83-3-zertifikate-ui`.
- Scope: Kursinhalt fields for Kurse, Zertifikate snapshots, PDF from snapshots, trainer title enforcement.

## Ergebnis (kurz)

- Added `inhalt_theorie`/`inhalt_praxis` to Kurse (UI textareas + MariaDB mapping) without blocking course saves.
- Extended Zertifikate snapshots with course content; certificate creation now rejects missing Kursinhalt and missing trainer titles (Trainer 1 always, Trainer 2 if selected).
- PDF rendering now uses Kursinhalt snapshots (one bullet per line) and requires trainer titles; no PDF storage.
- Trainer detail/edit highlights Titel as required for certificates.
- Kurse edit: “Weitere Trainer” now uses a single select dropdown with a “Keiner” option (no raw ID list).

## Tests

- Manual verification:
  - Kursinhalt Theorie/Praxis filled in a Kurs; save succeeds ✅
  - Zertifikat creation blocks when Kursinhalt or Trainer titles missing ✅
  - PDF uses Kursinhalt snapshot bullets + trainer titles ✅

## Notizen

- Zertifikate creation now fails when Kursinhalt fields are empty; update Kurs first.

# - - - - - - - - - - - - - - - - - - - -

# Station 83.4 — Zertifikate PDF Export

## Kontext

- Status: completed (PDF export).
- Branch: `feature/station83-3-zertifikate-ui`.
- Scope: single-page PDF generation from Zertifikate snapshots only; no PDF storage.

## Ergebnis (kurz)

- Added on-demand PDF export from Zertifikate detail view using snapshot fields only.
- PDF layout includes header (logo), Kursbestätigung title/subtitle, participant sentence, dog line, kurs title, static Kursinhalt (Theorie/Praxis), closing line, and footer with Ort/Datum/signatures/address.
- Trainer 2 signature block renders only when snapshot values exist; export guarded for missing snapshot fields.
- No PDF binaries or paths stored.

## Tests

- Manual verification pending.

## Notizen

- Export triggers browser print dialog; filename uses `Zertifikat_<code>.pdf`.

# - - - - - - - - - - - - - - - - - - - -

# Station 83.3 — Zertifikate UI (List/Create/Detail)

## Kontext

- Status: completed (UI only).
- Branch: `feature/station83-3-zertifikate-ui`.
- Scope: Zertifikate module UI (list/create/detail) with snapshot preview; no PDF generation.

## Ergebnis (kurz)

- New Zertifikate module with list view (code, kunde/hund/kurs snapshots, dates) and detail view grouped by Kunde/Hund/Kurs/Trainer/Ausstellung.
- Zertifikate create flow implemented with Kunde/Hund/Kurs/Trainer selections, live snapshot preview, and required field validation.
- Entry points added from Kunde, Hund, and Kurs detail actions; navigation link added to header.
- PDF export button shown as disabled placeholder (no PDF generation yet).
- API routing/RBAC/Mock wiring updated to include Zertifikate.

## Tests

- Not run (manual UI verification pending).

## Notizen

- No PDF generation implemented; detail view shows a disabled placeholder button.

# - - - - - - - - - - - - - - - - - - - -

# Station 83.2 — Schema Changes & Zertifikate Storage

## Kontext

- Status: completed (schema + storage wiring).
- Branch: `feature/station83-2-schema`.
- Scope: kunden.geschlecht, trainer.titel, kurs.ort required; zertifikate table + adapter wiring.

## Ergebnis (kurz)

- Added `geschlecht` for Kunden (autofill on create via Vorname heuristic; editable in detail/form).
- Added optional `titel` for Trainer (editable in detail/form).
- Added `ort` for Kurse (required in UI + API validation; stored alongside existing location).
- Added Zertifikate table schema + MariaDB storage adapter with required-field validation.
- Added non-destructive migration SQL in `tools/mariadb/migrations/83_2_zertifikate_schema.sql`.

## Tests

- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 < tools/mariadb/migrations/83_2_zertifikate_schema.sql` ✅
- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 -e "DESCRIBE zertifikate; DESCRIBE kunden; DESCRIBE trainer; DESCRIBE kurse;"` ✅

## Issues

- None.

# - - - - - - - - - - - - - - - - - - - -

# Station 82 — Billing from Kurse

## Kontext

- Status: read-only (completed).
- Branch: `feature/station82`.
- Scope: Rechnungen from Kurse/Kunde; OR/MWST-required fields; Rechnungsverlauf (history) in Finanzen.

## Ergebnis (kurz)

- Finanzen UI refocused to Rechnungen: list columns, detail view, and Rechnung form (Status, Zeitraum, MWST, Zahlungsdaten).
- Rechnung data model added to `zahlungen` (API defaults + MariaDB schema + adapter mapping).
- Auto-generated Rechnungsnummer format `YYMMDD-###` when Rechnungsdatum is set (manual override supported).
- Kurs linkage added in Rechnung form with auto-fill for Beschreibung/Total/Leistungsdatum.
- Filter layout aligned to list-controls style; “Neue Rechnung” visible even when no entries.
- Access token TTL increased to 24h (refresh remains 7 days).
- Kunden selector now refreshes when cached data is empty, so failed loads don't leave the form without options.
- Rechnung form simplified: removed Währung/Steuerbefreiung/Zahlungsbedingungen/Empfänger/QR/MWST-Hinweis/Kontakt fields, combined Leistungsdatum, MWST-Betrag auto-calculated, Total auto-calculated (now last field), and Zahlungsfrist is now days (default 30).
- Kurse form updated to new fields (Trainer, Abo-Form, Alter Hund, Preis, Aufbauend, Notizen) and Status = Aktiv/Deaktiviert; multi-trainer support added via `trainer_ids` (primary remains `trainer_id`).
- Kurse list cards reduced to Code/Name/Trainer/Alter Hund/Preis; detail view now matches Kunden detail layout.
- Outlook mirror row removed from Kurse UI.
- Live MariaDB Kurse reintroduced (KS-001..KS-013) from the curated list.

## Tests

- Manual UI flow (logged-in):
  - Rechnung create/save works after DB schema update: ✅
  - Rechnung form order, Kunde selection, Kurs auto-fill, and MWST/Total auto-calc: ✅
  - Kurse list/detail/form layout with new fields: not run (visual check pending).
- MariaDB schema update (manual, not yet scripted):
  - `ALTER TABLE zahlungen ADD COLUMN ...` applied locally to add Rechnung fields.
  - `ALTER TABLE kurse ADD COLUMN trainer_ids ...; ALTER TABLE kurse ADD COLUMN abo_form ...; ALTER TABLE kurse MODIFY price ...` applied locally for Kurse fields.
- MariaDB data load (manual):
  - `INSERT INTO kurse ...` (KS-001..KS-013) ✅
  - `SELECT code, title, trainer_name, status, abo_form, alter_hund, aufbauend, price FROM kurse ORDER BY code;` ✅

## Issues

- Auth tokens expire; now 24h, but re-login still required when expired.

## Notizen

- Running services required: MariaDB, API server, Vite dev; login required for API access.
- Kurse list reintroduced in live MariaDB; multi-trainer IDs stored in `kurse.trainer_ids` while `trainer_id` remains required.
- Manual UI check still needed for Kurse list/detail/form with multi-trainer select and new fields.

# - - - - - - - - - - - - - - - - - - - -

# Station 81 — Accounts & Roles

## Kontext

- Status: read-only (completed).
- Branch: `feature/station81-accounts-roles`.
- Scope: add login flow, developer super-login, trainer auto-login on create, and RBAC enforcement for modules.

## Ergebnis (kurz)

- Added auth UI module and header login/logout display with route guarding for unauthenticated users.
- Implemented auth API endpoints (`/api/auth/login|refresh|logout|me`) and enforced access tokens for core API routes.
- Added RBAC rules for modules and API reads/writes; trainer role is restricted to Kurse/Kalender/Kommunikation in the UI and read-only for core data except Kurse/Kalender writes.
- Added developer seed user and auto-provisioned trainer logins on create (default password `trainerpass`), surfaced in Trainer create notices.

## Tests

- Manual login checks:
  - Admin (`admin/adminpass`) full access: ✅
  - Trainer (`trainer/trainerpass`) restricted access: ✅
  - Developer (`developer/devpass`) full access: ✅
  - Trainer creation shows login credentials: ✅

## Notizen

- Default logins (seeded): `admin/adminpass`, `staff/staffpass`, `trainer/trainerpass`, `developer/devpass`.
- New trainer logins are auto-provisioned with password `trainerpass` and shown in the create success notice.

# - - - - - - - - - - - - - - - - - - - -

# Station 80 — Kurse Catalogue System

## Kontext

- Status: read-only (completed).
- Branch: `feature/station80-kurse-catalogue`.
- Scope: import/normalize `Kurse Catalogue.txt`, enforce catalogue selection for Kurs creation/editing.

## Ergebnis (kurz)

- Added shared catalogue list from `DogTabs Data/Kurse Catalogue.txt` in `modules/shared/data/kurseCatalogue.js` (64 unique entries).
- Kurse form now requires selecting a course from the catalogue; Kurstitel is read-only and synced to the selection.

## Tests

- Manual UI verification:
  - Kurse form requires catalogue selection and title sync: ✅

# - - - - - - - - - - - - - - - - - - - -

# Station 79 — Structural UI for Large Datasets

## Kontext

- Status: read-only (completed).
- Branch: `feature/station79-structural-ui`.
- Scope: filters, sorting, pagination, and column controls for large datasets (1500+ Kunden).

## Ergebnis (kurz)

- Added list control rows (search, status filter, page size) and pagination for Kunden and Hunde tables.
- Added search, status filter, sorting controls, and pagination for Kurse list; list now renders per-page for large datasets.
- Shared list-controls + pagination styling added in `modules/shared/shared.css`.

## Tests

- Manual UI verification (large datasets):
  - Kunden list controls (search/status/page size), sorting, pagination: ✅
  - Hunde list controls (search/status/page size), sorting, pagination: ✅
  - Kurse list controls (search/status/sort/dir/page size), pagination: ✅

# - - - - - - - - - - - - - - - - - - - -

# Station 78 — Fix Round 1

## Kontext

- Status: read-only (completed).
- Branch: `feature/station78-fix-round-1`.
- Scope: fix only issues from Station 77.

## Ergebnis (kurz)

- No issues reported in Station 77; no fixes required.

## Tests

- Not run (no changes).

## Notizen

- Station 77 completed with no issues logged; Station 78 closed without changes.

# - - - - - - - - - - - - - - - - - - - -

# Station 77 — Manual Test Round 1 (Baseline)

## Kontext

- Status: read-only (completed).
- Branch: `feature/station77-manual-test-1`.
- Scope: manual E2E test pass (Kunden/Hunde/Kurse) on local MariaDB + API; NAS is out of scope.

## Ergebnis (kurz)

- Completed manual baseline test for Kunden, Hunde, and Kurse on local MariaDB + API + Vite dev.
- No issues observed; manual test results captured below.
- Replaced Kurse dataset with unique entries from `DogTabs Data/Kurse Catalogue.txt` (64 rows) and anchored to a placeholder trainer (`Kurse Katalog`).

## Tests

- Manual UI checks:
  - Kunden list/search/detail/edit: ✅
  - Hunde list/search/detail/edit: ✅
  - Kurse list/detail/create/edit: ✅
- Data load verification:
  - `SELECT COUNT(*) FROM kurse;` → 64

## Manual Test Report 1

- Run: 2026-01-02
- Scope: Kunden, Hunde, Kurse (manual E2E baseline)
- Environment: local MariaDB + API + Vite dev
- Setup:
  - Storage mode: mariadb
  - MariaDB socket: /run/mysqld/mysqld.sock
  - API server: http://localhost:5177
  - UI dev: http://localhost:5173
- Results:
  - Kunden: list, search, detail, edit/save -> pass
  - Hunde: list, search, detail, edit/save -> pass
  - Kurse: list, detail, create/edit -> pass
- Issues: none observed

## Notizen

- Local start commands:
  - `sudo systemctl start mariadb && sudo systemctl status mariadb`
  - `DOGULE1_STORAGE_MODE=mariadb DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran node tools/server/apiServer.js`
  - `DOGULE1_STORAGE_MODE=mariadb DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran pnpm dev`
- If Vite starts without `DOGULE1_MARIADB_SOCKET`, it will try the local socket and the UI will show `Fehler beim Laden der Daten`.
- Kurse reload flow:
  - Initial load failed due to `fk_kurse_trainer` constraint when `trainer_id` was blank.
  - Inserted placeholder trainer `00000000-0000-0000-0000-000000000000` (`Kurse Katalog`) and reloaded 64 unique titles.

# - - - - - - - - - - - - - - - - - - - -

# Station 76 — Audit Remediation (XLSX Export)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station76-ui-followup`.
- Scope: fix CI `pnpm audit` failure caused by `xlsx` vulnerabilities while keeping XLSX export behavior.

## Ergebnis (kurz)

- Removed the `xlsx` dependency and replaced export logic with a minimal in-browser XLSX (OOXML + zip) writer in `modules/shared/utils/xlsxExport.js`.
- XLSX exports for Kunden/Hunde still generate `.xlsx` files, now without vulnerable third-party dependencies.
- `pnpm install` updated the lockfile to remove `xlsx` from dependencies.

## Tests

- Not run (dependency and helper refactor only).

## Notizen

- Audit failure details: `xlsx` reported high severity Prototype Pollution and ReDoS advisories; no patched versions available, so dependency was removed.

# - - - - - - - - - - - - - - - - - - - -

# Station 76 — MariaDB Performance & Index Validation (UI Follow-up + Export)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station75-dogtabs-ingestion` (follow-up changes captured here).
- Scope: complete Station-76 manual UI follow-ups, add Hunde Herkunft enum + form fields, add Kunden/Hunde XLSX exports, and add Kunden list column controls with “Hunde, Name” visibility.
- Preconditions: MariaDB socket `/run/mysqld/mysqld.sock`, API server (`tools/server/apiServer.js`), and Vite dev (`pnpm dev`) running with `DOGULE1_STORAGE_MODE=mariadb`.

## Ergebnis (kurz)

- Added Kunden list column configurator with Status fixed first, reorderable remaining columns, and visible “Hunde, Name” column populated from linked Hunde; persisted order via localStorage.
- Added foldable “Spalten anpassen” panel with explicit open/close toggle state and constrained height to reduce distraction.
- Added XLSX export buttons for Kunden- und Hundeübersicht using a shared export helper + `xlsx` dependency; export respects current filters/sort and visible columns.
- Implemented Herkunft as a controlled dropdown (privat/züchter/tierheim/tierschutz/internet/zoohandel) plus display formatting on Hund detail.
- Extended Hunde form to include all detail fields (Status, Kastriert, Felltyp, Fellfarbe, Größe-Typ, Größe (cm), Gewicht (kg), Herkunft, Chip Nummer, Trainingsziele, Notizen) and added Kunden search filter for large lists.
- Updated Hunde API defaults + mock data to include new fields (kastriert, felltyp, fellfarbe, groesseTyp, chipNummer) for UI visibility.

## Tests

- Not run (manual UI verification only).

## Notizen

- Manual checks completed:
  - Kunden: column reorder works with Status fixed; “Hunde, Name” visible; XLSX export works.
  - Hunde: Herkunft dropdown present; Herkunft displays as label in detail view after edit; form shows expanded fields.
  - Kunden search in Hunde form available for large customer list.
- `pnpm install` required after adding `xlsx` dependency.
- Branch mismatch recorded above; follow-up work executed on `feature/station75-dogtabs-ingestion`.

# - - - - - - - - - - - - - - - - - - - -

# Station 76 — MariaDB Performance & Index Validation

## Kontext

- Status: read-only (completed).

- Branch: `feature/station76-mariadb-performance`.
- Scope: define thresholds, enumerate adapter SQL, run EXPLAIN + timed baselines, UI N+1 sanity check, and document findings in `MARIADB_PERF_REPORT.md`.

## Ergebnis (kurz)

- Locked Station 76 performance thresholds and documented MariaDB adapter SQL + EXPLAIN targets in `MARIADB_PERF_REPORT.md`.
- Ran EXPLAIN and profiling on system MariaDB socket (`/run/mysqld/mysqld.sock`) and recorded warm-cache p95 baselines + environment details.
- Ingested Kurse catalog items from `$_seminarstamm` with minimal trainer dependency (1 trainer + 14 kurse inserted) to make baselines representative; no schema/UI changes.
- Decision: no remediation required; PK index scans accepted under bounded dataset and observed sub-millisecond timings; no schema/adapter changes made.
- Manual UI sanity check completed (Kunden list → Kunde detail → Hunde list) with no visible multi-step loading; follow-ups noted in the report.
- Hunde data fidelity fix: normalized DogTabs US-style dates for `geburtsdatum`, mapped `hund_tiergruppe` via `$_codes_tiergruppen` (labels instead of numeric codes), and updated existing Hunde rows.

## Tests

- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 -e "SELECT 'kunden', COUNT(*) FROM kunden; ..."` ✅
- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 <<SQL ... EXPLAIN ... SQL` ✅
- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 < /tmp/mariadb_perf.sql` ✅ (profiling runs)
- `DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran node tools/dogtabs/cli.js ingest --modules=kurse` ✅
- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 -e "SELECT COUNT(*) FROM kurse; SELECT id, status, inventory_flag, portfolio_flag, date, start_time, end_time, notes FROM kurse LIMIT 1;"` ✅
- `DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran node tools/dogtabs/updateHundeFields.js` ✅
- `mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 -e "SELECT id, code, geburtsdatum, herkunft FROM hunde LIMIT 5;"` ✅

## Notizen

- Deferred validation: kalender/zahlungen/waren are empty; re-run baselines once data exists.
- Follow-ups captured in `MARIADB_PERF_REPORT.md`: Kunde Übersicht “Hund verlinkt” column, post-fix UI check for geburtsdatum/Herkunft.
- Tech-debt: Kurse catalog items use empty strings for date/time fields (schema NOT NULL); acceptable for Station 76, to be revisited in a later station.
- Pending verification checklist (next session):
  - UI sanity check (post-fix): open Kunden list, pick a Kunde, confirm Hunde list shows `Geburtsdatum` values (not blank) and `Herkunft` labels (e.g., `Hund`, not numeric codes).
  - UI detail check: open a Hund detail view and confirm `Geburtsdatum` and `Herkunft` render correctly in the detail list.
  - Data spot-check in MariaDB: `SELECT id, code, geburtsdatum, herkunft FROM hunde LIMIT 5;` confirm ISO dates and label values.
  - Report consistency: ensure `MARIADB_PERF_REPORT.md` reflects the Hunde data fix and that the post-fix UI check is marked complete once verified.
  - Remaining follow-up scope: Kunden Übersicht “Hund verlinkt” column (sortable) still pending; confirm intended sort behavior once implemented.

# - - - - - - - - - - - - - - - - - - - -

# Station 76.5 — NAS Deployment (Staging for Manual Test)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station76.5-nas-deployment`.
- Scope: deploy MariaDB-backed app to NAS, expose public staging, and validate readiness for Station 77 manual tests.
- Access scope: public (`https://4c31.synology.me/dogule1-staging/`).
- NAS profile: Synology DS218play (DSM 7.3.2-86009), SAN.

## Ergebnis (kurz)

- Created reproducible NAS runbook in `NAS_STATION76_5_SETUP.md`; captured environment, access scope, and rollback steps.
- Repo deployed to NAS (`/volume1/dogule1nasfolder/dogule1`), dependencies installed, `pnpm build` completed, and `dist/` deployed to `/volume1/web/dogule1-staging/`.
- API server running on NAS (`node tools/server/apiServer.js`), reverse proxy exposed at `https://4c31.synology.me:8443/api`.
- Added CORS support to API server and configured `DOGULE1_CORS_ORIGINS=https://4c31.synology.me`.
- NAS MariaDB refreshed from local export; full dataset restored and dashboard counts validated.
- Deployment report recorded in `NAS_STATION76_5_REPORT.md`.

## Tests

- `curl http://127.0.0.1:5177/api/kunden` ✅
- `curl --resolve 4c31.synology.me:8443:192.168.1.116 https://4c31.synology.me:8443/api/kunden` ✅
- Manual UI smoke: Kunden + Hunde create OK; counts updated ✅

## Issues

- CORS blocked cross-port API access; resolved by adding CORS headers in `tools/server/apiServer.js` and setting `DOGULE1_CORS_ORIGINS`.
- Reverse proxy UI lacked path-based routing; API exposed on port 8443 instead of `/api` on 443.

## Notizen

- Rollback procedure documented in `NAS_STATION76_5_SETUP.md` (stop API, clear staging folder, disable proxy/close port).
- Station 77 prerequisite met: NAS staging environment is live and stable.
- Future task logged: add persistent boot-time API service via DSM Task Scheduler (not implemented yet).

# - - - - - - - - - - - - - - - - - - - -

# Station 76.6 — Post-Remediation Verification

## Kontext

- Status: read-only (completed).

- Branch: `feature/station76.5-nas-deployment`.
- Scope: verify Hunde `Geburtsdatum`/`Herkunft` UI rendering, confirm Kunden list column sorting, and re-run tests after XLSX dependency removal.

## Ergebnis (kurz)

- Verified Kunden → Hunde list shows `Geburtsdatum` values and `Herkunft` labels (not numeric codes).
- Verified Hund detail view renders `Geburtsdatum` and `Herkunft` correctly.
- Confirmed Kunden list column "Hunde, Name" is present and sortable.
- `pnpm test` and `pnpm build` pass after XLSX removal.

## Tests

- Manual UI check: Kunden list → Kunde → Hunde list; Hund detail ✅
- Manual UI check: Kunden list column "Hunde, Name" sortable ✅
- `pnpm test` ✅
- `pnpm build` ✅

## Notizen

- Manual verification only; no code changes.

# - - - - - - - - - - - - - - - - - - - -

# Station 76.7 — NAS Manual Test + Battleplan Update

## Kontext

- Status: read-only (completed).

- Branch: `feature/station76.5-nas-deployment`.
- Scope: validate NAS staging manual test pass with live API, and record battleplan updates for NAS autostart + role-based logins.

## Ergebnis (kurz)

- Confirmed NAS API was down (502); started `tools/server/apiServer.js` on NAS to restore data access.
- Verified reverse proxy and local API health; full manual test pass on NAS staging completed.
- Added battleplan notes: NAS autostart requirement for MariaDB + API server, and Trainer/Admin role-based login requirement for Kommunikation.

## Tests

- NAS local API: `curl http://127.0.0.1:5177/api/kunden` ✅
- NAS reverse proxy: `curl https://4c31.synology.me:8443/api/kunden` ✅
- Manual NAS staging test (Kunden/Hunde/Kurse/Trainer/Kalender/Finanzen/Waren + navigation) ✅

## Notizen

- API server must be running on NAS for the frontend to load data.

# - - - - - - - - - - - - - - - - - - - -

# Station 76.8 — NAS Autostart Follow-up

## Kontext

- Status: read-only (completed).
- Branch: `feature/station76.6-nas-followup`.
- Scope: make NAS staging self-starting by documenting API + MariaDB autostart steps and providing an API boot script.

## Ergebnis (kurz)

- Added NAS API boot script at `tools/ops/nas-api-server.sh` (waits for MariaDB socket, then starts API).
- Updated NAS runbook with DSM Task Scheduler boot task instructions and MariaDB autostart checklist.

## Tests

- Not run (documentation + ops script only).

## Notizen

- Task Scheduler must run at boot to keep staging alive after NAS restarts.

# - - - - - - - - - - - - - - - - - - - -

# Station 76.9 — NAS Git Deploy Key Workflow

## Kontext

- Status: read-only (completed).
- Branch: `feature/station76.6-nas-followup`.
- Scope: switch NAS updates to a GitHub Deploy Key workflow and document `git pull` deployment steps.

## Ergebnis (kurz)

- Added a detailed NAS git workflow in `NAS_STATION76_5_SETUP.md` (deploy key creation, remote config, pull-based updates).
- Clarified that `git fetch` does not update the working tree; `git pull` is required for deployments.

## Tests

- Not run (documentation-only).

## Notizen

- NAS updates should avoid scp/rsync for repo changes; use `git pull` after merges.

# - - - - - - - - - - - - - - - - - - - -

# Station 76.10 — NAS Healthcheck Script

## Kontext

- Status: read-only (completed).
- Branch: `feature/station76.6-nas-followup`.
- Scope: add a lightweight boot-time healthcheck script for NAS API/MariaDB and log results to `api.log`.

## Ergebnis (kurz)

- Added `tools/ops/nas-api-healthcheck.sh` for socket + API checks.
- `tools/ops/nas-api-server.sh` now triggers the healthcheck after starting the API.
- Runbook updated with executable steps for the new healthcheck.

## Tests

- Not run (ops script only).

## Notizen

- Healthcheck uses `curl` and the MariaDB socket path to validate readiness.

# - - - - - - - - - - - - - - - - - - - -

# Station 76.11 — Contabo VPS Setup (Battleplan Added)

## Kontext

- Status: read-only (completed).
- Branch: `feature/station76.6-nas-followup`.
- Scope: add a new battleplan station for migrating hosting from NAS to Contabo VPS with production-grade setup and step-by-step operator runbook.

## Ergebnis (kurz)

- Added Station 76.7 “Contabo VPS Setup (Production-Grade Hosting)” to `BATTLEPLAN_STATIONS_71_PLUS.md`.
- Station scope includes VPS provisioning, OS hardening, firewall, MariaDB + Node API services, static hosting with reverse proxy, TLS, backup/rollback, and verified runbook.

## Tests

- Not run (documentation-only).

## Notizen

- Next agent should create `CONTABO_VPS_SETUP.md` and execute the runbook on the VPS.

# - - - - - - - - - - - - - - - - - - - -

# Station 76.12 — Handover Notes (Contabo VPS)

## Kontext

- Status: read-only (completed).
- Branch: `feature/station76.6-nas-followup`.
- Scope: record handover notes for the Contabo VPS station so a new agent can continue without context loss.

## Ergebnis (kurz)

- New battleplan entry: Station 76.7 “Contabo VPS Setup (Production-Grade Hosting)” in `BATTLEPLAN_STATIONS_71_PLUS.md`.
- `status.md` Station 76.11 notes that the runbook must be created and executed.
- Next deliverable: `CONTABO_VPS_SETUP.md` with full provisioning + service setup steps.
- VPS work should include: SSH keys only, firewall hardening, MariaDB + API systemd units, static hosting with reverse proxy, TLS, backups, and reboot validation.

## Tests

- Not run (handover note only).

## Notizen

- Use this as the single source of truth for the next agent’s kickoff.

# - - - - - - - - - - - - - - - - - - - -

# Station 76.13 — Contabo VPS Runbook Draft

## Kontext

- Status: read-only (completed).
- Branch: `feature/station76.7-contabo-runbook`.
- Scope: draft a step-by-step Contabo VPS runbook aligned with battleplan and NAS learnings; documentation only (no VPS execution).

## Ergebnis (kurz)

- Expanded `CONTABO_VPS_SETUP.md` with DNS cutover, deploy key setup, SSH service reload fixes, MariaDB backup/restore hardening, and explicit `DOGULE1_REQUIRE_MARIADB` config.
- Runbook now includes VPS verification, update workflow, backups, rollback, and reboot validation in one linear checklist.

## Tests

- Not run (documentation-only).

## Notizen

- VPS execution and validation are still pending; this entry only covers the runbook update.

# - - - - - - - - - - - - - - - - - - - -

# Station 75 — DogTabs Data Ingestion Pipeline

## Kontext

- Status: read-only (completed).

- Branch: `feature/station75-dogtabs-ingestion`.
- Scope: DogTabs ingestion + MariaDB wiring + manual-test preparation (Kunden → Hunde → Kurse).
- Station focus: resolve MariaDB adapter mismatch, import Kunden/Hunde into the live MariaDB, and align UI with new status/search requirements.

## Ergebnis (kurz)

- Enforced MariaDB-only mode in storage config + API router (fail-fast `MARIADB_REQUIRED`).
- Aligned MariaDB adapter defaults with smoke test (socket default + OS user), added connection log line.
- Resolved adapter mismatch: confirmed two MariaDB instances; standardized on system socket `/run/mysqld/mysqld.sock`.
- Loaded MariaDB schema on the system instance; created `dogule1` database there.
- Imported DogTabs Kunden CSV into system MariaDB: 1412 inserted.
- Added `kunden.legacy_id` column, then backfilled via `code=DT-<kundennummer>` mapping (1412 updated, 0 skipped).
- Imported DogTabs Hunde from Access DB with FK resolution via `kunden.legacy_id` → `kunden.id`: 386 inserted/linked, 2 unmatched.
- UI updates: Kunden Status added to list (first column) with default sort Aktiv → Passiv → Deaktiviert, and search filter; Hunde list search added; Hunde form now includes Status dropdown.
- Data model updates: `hunde.status` column added to schema and storage adapters; status shown in Hund detail.

## Tests

- `pnpm run lint` — ✅
- `pnpm run test` — ✅
- `pnpm run build` — ✅
- `pnpm run legacy:station61:guard` — ❌ `spawnSync git EPERM` in sandbox.
- `DOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock DOGULE1_MARIADB_USER=ran pnpm run mariadb:smoke` — ✅ (kunden=1413).
- `node tools/dogtabs/cli.js dry-run` — ❌ `mdb-export` EPERM in sandbox.
- `node tools/dogtabs/cli.js customers-csv <Dogtabs-Kunden-Export.csv>` — ✅ (system socket; report shows 1412 inserted).
- Hunde import via Access DB + MariaDB writer — ✅ (386 inserted/linked, 2 unmatched).

## Notizen

- Two MariaDB instances were in play: local socket `~/.local/mariadb/mariadb.sock` vs system socket `/run/mysqld/mysqld.sock`. API was using system socket; schema/data initially only existed on local socket.
- Current standard: system MariaDB socket (`/run/mysqld/mysqld.sock`) for API + imports; avoid mixing sockets.
- `kunden.legacy_id` is now the deterministic link for Hunde import (DogTabs `hund_kundennummer` → `kunden.legacy_id`).
- Unmatched Hunde count: 2 (no matching `kunden.legacy_id`); record in next pass before Kurs import.
- CI guard: removed `migration/legacy/station61/capture_20251219_185854Z/Dogtabs-Kunden-Export.csv` from git to keep Station 61 capture immutable.
- Lint/test failures resolved by adding explicit globals in DogTabs tooling and updating storage-mode tests to expect `MARIADB_REQUIRED`.

# Station 71 — From Alpha to Beta Planning & Doc Consolidation

## Kontext

- Status: read-only (completed).

- Branch: `from-alpha-to-beta-planning`.
- Scope: consolidate current docs (excluding `status.md`), archive legacy MDs, and define the Alpha→Beta battleplan with early UI preview pass.

## Ergebnis (kurz)

- Created `DOGULE1_COMBINED.md` as the single consolidated doc and archived existing MDs into `archived-mds/` while preserving relative paths.
- Added and refined `BATTLEPLAN_STATIONS_71_PLUS.md` with reordered stations, single-backend MariaDB rule, performance validation, UI split (visual early vs structural later), and manual-test freeze rules.
- Added instruction to always read the battleplan in `DOGULE1_COMBINED.md` and `BATTLEPLAN_STATIONS_71_PLUS.md`.

## Tests

- Not run (documentation/planning changes only).

## Notizen

- `status.md` remains the continuous log and was not consolidated.

# - - - - - - - - - - - - - - - - - - - -

# Station 74 — MariaDB Schema & Adapter Implementation

## Kontext

- Status: read-only (completed).

- Branch: `feature/station74-mariadb-schema-adapter`.
- Scope: implement MariaDB schema + adapter, switch core CRUD to HTTP-backed API, and hard-require MariaDB for Beta usage.

## Ergebnis (kurz)

- Added MariaDB schema + local setup guide (`tools/mariadb/schema.sql`, `tools/mariadb/README.md`) and initialized local data dir under `/home/ran/codex/.local/mariadb` (socket-only).
- Implemented MariaDB storage adapter (`modules/shared/storage/mariadbAdapter.js`) with CRUD for kunden/hunde/kurse/trainer/kalender/finanzen/waren, uuidv7 defaults, and JSON field handling.
- Added core HTTP API router (`modules/shared/server/coreApiRouter.js`) and combined router export; Vite dev now wires core + Kommunikation via `createApiRouter`.
- UI core modules switched to HTTP in browser with `modules/shared/api/httpClient.js`, while tests stay on mock via a test-environment guard.
- Added Node API server entrypoint (`tools/server/apiServer.js`), MariaDB smoke test (`tools/mariadb/smokeTest.js`), and `.env.example` for local config.
- Storage config supports `mariadb` mode and can enforce it via `DOGULE1_REQUIRE_MARIADB=1`; `.local/` is gitignored.

## Tests

- `pnpm install` ✅ (esbuild build scripts ignored warning)
- `pnpm test` ❌ (HTTP mode tried `http://localhost:3000`, fixed by test-env guard)
- `pnpm test` ✅
- `mariadb-install-db --datadir /home/ran/codex/.local/mariadb --user=ran` ✅ (auth_pam ownership warnings)
- `nohup mariadbd --datadir /home/ran/codex/.local/mariadb --socket=/home/ran/codex/.local/mariadb/mariadb.sock --pid-file=/home/ran/codex/.local/mariadb/mariadb.pid --log-error=/home/ran/codex/.local/mariadb/mariadb.err --skip-networking &` ✅
- `mariadb --protocol=socket --socket /home/ran/codex/.local/mariadb/mariadb.sock --user=ran < tools/mariadb/schema.sql` ✅
- `mariadb --protocol=socket --socket /home/ran/codex/.local/mariadb/mariadb.sock --user=ran -e "SHOW TABLES IN dogule1;"` ✅
- `pnpm run mariadb:smoke` ✅ (uses default socket + user)

## Notizen

- MariaDB runs with `--skip-networking` (socket-only) due to sandbox restrictions; set `DOGULE1_MARIADB_SOCKET` to connect.
- Core UI now expects `/api/*` endpoints in browser; use `createApiRouter` from `modules/shared/server/apiRouter.js` to serve CRUD + Kommunikation.
- `mariadb:smoke` emits MODULE_TYPELESS warning (repo is not ESM); left as-is.

# - - - - - - - - - - - - - - - - - - - -

# Station 73 — DogTabs Data Inventory & Mapping Plan

## Kontext

- Status: read-only (completed).

- Branch: `feature/station73-dogtabs-inventory`.
- Scope: inventory DogTabs legacy capture (read-only), document file formats/counts, and define a mapping plan to Dogule1 schema.

## Ergebnis (kurz)

- Added `DOGTABS_DATA_INVENTORY.md` with file-type counts, directory inventory, snapshot counts, and PII notes for the Station-61 capture.
- Added `DOGTABS_TO_DOGULE1_MAPPING.md` describing target mappings, ID strategy, FK rules, and open questions; embedded Access DB extraction manual.
- Extracted Access DB schema and table list from the DogTabs database and mapped core tables (Kunden, Hunde, Seminare, Rechnungen, Pension/Rooms).
- Captured column headers via `mdb-export` for `$_kundenstamm`, `$_kunden_hunde`, `$_seminardaten`, and `$_rechnung_kopf` and documented them in the mapping plan.

## Tests

- `mdb-tables -1 "migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.accdr.ORG"` — ✅
- `mdb-schema "migration/legacy/station61/capture_20251219_185854Z/raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.accdr.ORG" mysql` — ✅ (No MSysRelationships)
- `mdb-export ... "$_kundenstamm"` — ✅ (header capture)
- `mdb-export ... "$_kunden_hunde"` — ✅ (header capture)
- `mdb-export ... "$_seminardaten"` — ✅ (header capture)
- `mdb-export ... "$_rechnung_kopf"` — ✅ (header capture)

## Notizen

- XLSX snapshots appear to have no embedded column headers; Access DB remains the authoritative schema source.
- `mdb-schema` output saved outside the repo in `/tmp/dogtaps_schema.sql`.
- Relationships were not emitted by `mdbtools` (`No MSysRelationships`), so FK rules still need manual validation.

# - - - - - - - - - - - - - - - - - - - -

# Station 72 — Alpha Closeout & Beta Readiness Gate

## Kontext

- Status: read-only (completed).

- Branch: `feature/station72-alpha-closeout`.
- Scope: freeze Alpha scope, define Beta entry/exit criteria, and standardize manual test issue logging. Documentation only.

## Ergebnis (kurz)

- Added `BETA_READINESS.md` with Alpha freeze list, Beta entry/exit criteria, and manual test issue log template.
- Captured deferred-to-Beta scope (DogTabs ingestion, MariaDB-only backend, expanded entity fields, performance validation, manual test cycles).

## Tests

- Not run (documentation changes only).

# - - - - - - - - - - - - - - - - - - - -

# Station 71 — UI Visual Pass & Entity List/Detail Cleanup

## Kontext

- Status: read-only (completed).

- Branch: `station71`.
- Scope: visual cohesion pass, standardized button spacing, and list/detail refinements for Kunden/Hunde/Kurse/Trainer; no backend changes.

## Ergebnis (kurz)

- Applied new visual palette and typography across shared styles; unified button styling and spacing in module action areas.
- Rebuilt Kunden/Hunde/Trainer list views into sortable, scrollable table overviews; aligned detail views with cleaner definition-list layouts.
- Updated Kunden detail/form to include Status select (Aktiv/Deaktiviert), Ausweis-ID, Foto upload (Verfügbar/Keines link), and Begleitpersonen; Hunde detail extended with required fields (Felltyp, Kastriert, Fellfarbe, Größe-Typ, Herkunft, Chip-Nummer).
- Adjusted Kurse list/detail to display created date and Outlook-mirror status in place of direct scheduling; added Kunde/Hund summaries in Kurs overview; normalized trainer availability labels to weekdays.
- Fixed vertical spacing for “Hund hinzufügen” and “Auswahl leeren” buttons; standardized form footer button layout across Kunde/Hund/Kurs/Trainer.
- Updated battleplan to include certificate station and UI requirements for status/photo upload.

## Tests

- Not run (UI/documentation changes only).

## Notizen

- Photo upload is stored as data URL for now (mock storage), surfaced as “Verfügbar” link in details.

# - - - - - - - - - - - - - - - - - - - -

# Station 70 — Storage & Security Hardening Pass

## Kontext

- Status: read-only (completed).

- Branch: `70`.
- Scope: storage failure-injection + restore drill, audit/log integrity check, secret rotation drill, and permission/rate-limit review after integrations.

## Ergebnis (kurz)

- Ran migration dry-run, failure injection, migrate + scan/verify-checksums; completed a restore drill on `storage_candidate/v1` and re-verified checksums.
- Verified audit/log integrity via test suite (logging schema + audit chain) and ran the mock DB integrity check; reviewed auth matrix and rate-limit config for Kommunikation.
- Performed a secret-rotation drill by reloading auth config with updated env secrets.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅
- `npm run build` — ✅
- `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"` — ✅ (MODULE_TYPELESS warning)
- `node tools/migration/cli.js dry-run` — ✅ (MODULE_TYPELESS warning)
- `MIGRATE_FAIL_AFTER_MODULE=kurse MIGRATE_RUN_ID=station70-fail node tools/migration/cli.js migrate` — ❌ expected (rollback drill)
- `MIGRATE_RUN_ID=station70 node tools/migration/cli.js migrate` — ✅
- `node tools/migration/cli.js scan-all` — ✅
- `node tools/migration/cli.js scan-pii` — ✅
- `node tools/migration/cli.js scan-drift` — ✅
- `node tools/migration/cli.js verify-checksums` — ✅ (pre-restore)
- `node tools/migration/cli.js verify-checksums` — ✅ (post-restore)
- `node --input-type=module -e "import('./modules/shared/auth/config.js').then(m=>{process.env.DOGULE1_AUTH_SECRET='rotate-a'; process.env.DOGULE1_REFRESH_SECRET='rotate-b'; const a=m.resolveAuthConfig({}); process.env.DOGULE1_AUTH_SECRET='rotate-c'; process.env.DOGULE1_REFRESH_SECRET='rotate-d'; const b=m.resolveAuthConfig({}); console.log(a.secrets.access, a.secrets.refresh, b.secrets.access, b.secrets.refresh);})"` — ✅ (MODULE_TYPELESS warning)

## Notizen

- storage reports: `storage_reports/latest-dry-run/`, `storage_reports/latest-scan/` (gitignored).
- storage candidate: `storage_candidate/v1` (gitignored).
- cleanup: removed `storage_reports/` and `storage_candidate/` after drills.

# - - - - - - - - - - - - - - - - - - - -

# Station 67X — Email Feature Removal

## Kontext

- Status: read-only (completed).

- Branch: `67x`.
- Scope: remove email feature across Kommunikation (UI, API, storage validators, tests) and delete email/Outlook planning from governance/baseline/DoR documents; retain historical logs.

## Ergebnis (kurz)

- Removed the email module and API wiring, dropped the Kommunikation emails tab, and stripped email storage validation/code paths.
- Updated governance, master path, DoR, and security baseline to remove email/Outlook stations and rules while keeping logs intact.

## Tests

- Tests not run (not requested).

# - - - - - - - - - - - - - - - - - - - -

# Station 67K — Infochannel with Confirmation Flow

## Kontext

- Status: read-only (completed).

- Branch: `feature/station67k-infochannel-confirmation`.
- Scope: admin-only Infochannel publish, trainer confirmation flow, SLA clock + reminders/escalations, full audit trail, rate limits, and UI wiring; no comments/attachments/edits after send.

## Ergebnis (kurz)

- Added Infochannel storage/SAL (notices, confirmations, SLA reminder/escalation events) with audit chain writes, rate limits, and admin-only publish; confirmations are immutable with late/overdue calculations.
- Implemented Infochannel API handlers + client and wired Kommunikation UI list/detail with confirm UX and SLA status indicators; shared styles extended for Infochannel surfaces.
- Mounted Kommunikation API routes (groupchat/infochannel/email) in the dev HTTP router and added actor/authz header propagation from clients.
- Updated auth matrix with Infochannel view/confirm/SLA actions; added validators for new entities.

## Tests

- `npm test -- modules/kommunikation/infochannel/sal.test.js modules/kommunikation/infochannel/apiRoutes.test.js modules/kommunikation/email/sal.test.js modules/kommunikation/email/apiRoutes.test.js` — ✅

## Notizen

- Manual check: Infochannel publish + trainer confirmation validated in dev; admin view shows confirmation list and SLA metadata.

# - - - - - - - - - - - - - - - - - - - -

# Station 67E — Email Integration MVP (Send-Only)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station67e-email-send-mvp`.
- Scope: compose→send flow in Kommunikation → Emails, Outlook send connector (send-only), status surfaced, abuse thresholds + rate limits, audit logging, kill switch + SPF/DKIM/DMARC alignment plan docs.

## Ergebnis (kurz)

- Added email send storage + SAL with queued→sent/failed status updates, Outlook connector stub (token-aware), rate limits/recipient caps, and audit chain writes; CC/BCC gated to admin.
- Implemented email API handlers + client and wired Kommunikation UI compose/list/detail with status/error messaging.
- Documented kill switch + SPF/DKIM/DMARC alignment plan in security baseline; extended auth matrix with email view action and tightened admin-only send policy.

## Tests

- `npm test -- modules/kommunikation/infochannel/sal.test.js modules/kommunikation/infochannel/apiRoutes.test.js modules/kommunikation/email/sal.test.js modules/kommunikation/email/apiRoutes.test.js` — ✅

## Notizen

- Manual check: Email send attempt without Outlook token shows `Fehlgeschlagen` with `missing_token` error as expected.

# - - - - - - - - - - - - - - - - - - - -

# Station 66R — Groupchat Retention Enforcement

## Kontext

- Status: read-only (completed).

- Branch: `feature/station66r-groupchat-retention`.
- Scope: enforce deterministic retention for the global groupchat with pinned cutoff pagination, logical read-marker clamping, gated server-side pruning, and minimal UI notices; no polling/push, no moderation UI, no migrations.

## Ergebnis (kurz)

- Added retention config + validation, pinned cutoff in cursors, query-time filtering, retention-aware unread counts, and optional prune job with caps/time budget and audit events; retention is disabled by default and Station 65 behavior remains unchanged.
- Exposed retention/truncation metadata on list responses and added minimal German UI notices when enabled/truncated.
- Added auth matrix entries for retention prune events; added UI guide placeholder, agents/protocol docs, and archived legacy status/step notes from the planning tidy-up.

## Tests

- `pnpm test -- modules/kommunikation/groupchat/sal.test.js modules/kommunikation/groupchat/ui.test.js` — ✅

## Notizen

- Pruning is gated by `DOGULE1_GROUPCHAT_RETENTION_PRUNE_ENABLED` and rate-limited; async pruning emits start/complete/noop/error audit events with jobId.

# - - - - - - - - - - - - - - - - - - - -

# Station 65 — Groupchat Core (Step 2 — API & UI Wiring)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station65-groupchat-core`.
- Scope: Expose SAL-backed global groupchat via HTTP-style handlers and wire Kommunikation → Chats UI (list badge/preview, detail view, composer with optimistic send/retry, read marker update, offline handling). No polling/push.

## Ergebnis (kurz)

- Added groupchat API handlers (`/api/kommunikation/groupchat/messages`, `/read-marker`) with authz/rate-limit mapping, idempotent sends (clientNonce), cursor pagination, and 429/Retry-After propagation without logging bodies.
- UI now loads real chat summary (preview + unread badge), renders detail with ordered messages, optimistic pending/failed states, retry, and read marker updates on open/send; offline banner surfaces via storage probe.
- Client fetch wrapper and UI tests exercise send→refresh persistence with SAL-backed storage.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅
- `npm run build` — ✅

## Notizen

- Rate limits rely on in-memory limiter; retention still null/no-op. API handlers are framework-agnostic; wire into actual HTTP server in later steps if needed.

# - - - - - - - - - - - - - - - - - - - -

# Station 65 — Groupchat Core (Step 1 — Storage & SAL)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station65-groupchat-core`.
- Scope: Storage + SAL for global group chat (room/message/read marker/dedupe entities, authz, rate limits, audit hooks, ordering/pagination). UI remains untouched.

## Ergebnis (kurz)

- Implemented schemaVersion=1 storage for `kommunikation_groupchat_room`, messages, read markers, and send dedupe with deterministic ordering and base64url cursor pagination (createdAt ASC + id ASC).
- `sendMessage` is idempotent on `(actorId, clientNonce)` for 24h via hashed dedupe table; enforces trimmed/max-length body, authz, rate limits, audit events (no body logged), and atomic message+dedupe writes through `executeWriteContract`.
- Read markers enforce same-room existence and monotonic advance; `listMessages` returns optional readMarker/unreadCount; default room auto-created with retentionDays=null.

## Tests

- `npm test -- modules/kommunikation/groupchat/sal.test.js` — ✅

## Notizen

- Retention enforcement still null/no-op; UI wiring and polling remain out of scope for Step 1. Rate limits use in-memory buckets.

# - - - - - - - - - - - - - - - - - - - -

# Station 64 — Kommunikation Skeleton (Abgeschlossen)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station64-kommunikation-skeleton`.
- Scope: read-only Kommunikation shell with hash-based tabs (Chats, Infochannel, Emails, System), deterministic state machine (loading/empty/error/offline), deny-by-default authz on view actions, SAL-based offline detection only, navigation/view logging without sensitive payloads. No send/notifications/migrations.

## Ergebnis (kurz)

- Kommunikation module now parses deep-link routes (`#/kommunikation/<tab>[/<id>]`), renders tab nav + list/detail placeholders, and drives loading/empty/error/offline states deterministically.
- Authz enforced in-module: default denied; admin shortcut allowed; otherwise requires `allowedActions` to include the tab’s view action (`kommunikation.chat.view|infochannel.view|email.view|system.view`). Blocked state shown when unauthorized.
- Offline handled solely via SAL probe hook (`window.__DOGULE_STORAGE_PROBE__`); lacking a probe yields offline. Client-side logging emits schema-shaped navigation/view events to `window.__DOGULE_LOGGER__`/console (no sensitive payloads).
- Shared styles updated for Kommunikation tabs/cards/detail; no business logic or writes added.

## Tests

- `npm run lint` — ✅ (pnpm/corepack unavailable on host)
- `npm run test` — ✅
- `npm run build` — ✅

## Notizen

- Manual viewing of shells requires providing authz + SAL probe in the runtime context (e.g., `window.__DOGULE_ACTOR__`, `window.__DOGULE_AUTHZ__.allowedActions`, `window.__DOGULE_STORAGE_PROBE__`). Otherwise UI shows blocked/offline by design. No PR yet.

# Station 63 — Real Storage Core Entities (Abgeschlossen)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station63-storage-layer`.
- Scope: implement real-mode storage + audit chain for Kunden/Hunde/Trainer/Kurse with schemaVersion=1 validation, checksum-wrapped JSON files, FK checks (Hund→Kunde, Kurs→Trainer), fail-fast storage root, and contract-first logging/alerts.

## Ergebnis (kurz)

- Real adapter now supports CRUD for all four core entities using canonical JSON + sha256 checksums, tamper-evident audit JSONL with hashPrev/hashIndex/recordHash, and manifest updates; read path verifies checksum and wrapper metadata.
- Validators enforce schemaVersion=1, required fields, UUID ids; FK enforcement for Hund→Kunde and Kurs→Trainer runs inside the write contract; missing storage root raises STORAGE_ROOT_MISSING.
- Logging/alerts now cover all write failures (schema/FK/manifest/IO) via `executeWriteContract`; mock adapter parity preserved.

## Tests

- `npm run lint` — ✅ (pnpm unavailable on host; corepack/pnpm commands missing)
- `npm run test` — ✅
- `npm run build` — ✅

## Notizen

- Audit/manifest writes assume single-process access (no cross-process locking yet); storage root must pre-exist (no auto-create). Station 61 legacy capture remains untouched.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Abgeschlossen)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: Closing summary after Steps 1–2E delivered (schema, logger, alerts, rate limits, health endpoints).

## Ergebnis (kurz)

- Station 62 implemented canonical logging/alert schema, core logger (fail-fast dev/test, single-drop notice in prod), alert wrapper with throttling, in-memory rate-limit primitive with logging, and `/healthz`/`/readyz` endpoints with internal readiness checks only.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- Limitations: (1) logger schema-violation notice is log-only (no alert signal); (2) alert `result` defaults to `"error"` unless caller sets an explicit outcome; (3) rate-limit buckets are in-memory without TTL cleanup (long-lived keys may accumulate).

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2E — Health Endpoints)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: add `/healthz` (always 200 ok) and `/readyz` (200 ok vs 503 not_ready) handlers with internal readiness checks; no external deps.

## Ergebnis (kurz)

- Implemented `modules/shared/server/health.js` with `handleHealthz` (always 200, `{status:"ok"}`) and `handleReadyz` (200 ok only when config/logger/rate-limit checks pass; else 503 `{status:"not_ready"}`).
- Readiness failures log a warning via canonical logger (`actionId=system.health.readiness`, `result=error`, `message=READINESS-NOT-READY`); successful checks are not logged. No stack traces or config leakage in responses.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- Readiness scope limited to internal availability (config loaded, logger initialized, rate limiter available); no external service checks.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2D — Rate Limit Primitive)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: in-memory fixed-window rate limit primitive + rate-limit hit logging helper; no concrete limits yet.

## Ergebnis (kurz)

- Added `modules/shared/ratelimit/limiter.js` with `rateLimit({ actionId, key, limit, windowMs })` returning `{ allowed, remaining, resetAt }` without throwing; fixed window with deterministic resetAt; buckets are per key in-memory.
- Added `logRateLimitHit({ actionId, actor, requestId, key })` emitting warning-level `RATE-LIMIT-HIT` via canonical logger (result=rate_limited, target=ratelimit/key, no new schema).

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- No hardcoded limits; consumers resolve identity keys and call the primitive.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2C — Alert Signals)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: alert wrapper over central logger with throttling; no new dependencies or schema changes.

## Ergebnis (kurz)

- Added `modules/shared/logging/alerts.js` with `alertEvent(event)`: requires `alertCode` and `throttleKey`, forces `level=alert`/`severity=ALERT`, reuses the canonical schema via `logEvent`, and throttles per (`alertCode`, `throttleKey`) to max 1 emit per 5 minutes (drops silently).
- Dev/Test: throws on missing required fields or schema violations; Prod: never throws, drops invalid/throttled alerts after emitting via logger when valid.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- No new dependencies; schema is reused (no additional schema files).

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2B — Core Logger)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: central JSONL logger with schema validation + fail-fast/dev-test vs drop-once-in-prod behavior; no new dependencies.

## Ergebnis (kurz)

- Implemented `modules/shared/logging/logger.js` exporting `logEvent(event)` only: applies defaults (ts, level→severity mapping), validates via Station 62 subset schema, enforces meta whitelist/size (<=1024B), and writes exactly one JSON line to stdout on success.
- Environment behavior: dev/test throw immediately on schema violation; prod emits a single `critical` event (`message=LOG-SCHEMA-INVALID`) on first invalid log, then drops subsequent invalid events silently.

## Tests

- `npm run lint` — ✅
- `npm test` — ✅

## Notizen

- No new dependencies added; console usage limited to the controlled stdout write.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Step 2A — Schema Validation Loader)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: runtime loader + validator for log/alert schema (no UI/storage changes); no new dependencies added; ajv absent, so minimal in-repo validator used.

## Ergebnis (kurz)

- Added `modules/shared/logging/schema.js` to load `tools/ops/log_event.schema.json` at runtime and validate events via a Station-62-aligned subset validator (required fields, enums, lengths/types, meta whitelist).
- Added `modules/shared/logging/schema.test.js` with happy-path and invalid-case coverage (required missing, enum mismatch, type mismatch, meta overage/disallowed key).

## Tests

- `npm run lint` — ✅ (worktrees/\*\* excluded to avoid frozen Station 61 config noise).
- `npm test` — ✅ (vitest suites pass, including `modules/shared/logging/schema.test.js`).

## Notizen

- Minimal validator is a strict subset aligned to Station 62 until an in-repo JSON Schema validator (e.g., ajv) is available.
- No new dependencies added.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Design Step 1)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: define canonical logging/alert event schema and JSON Schema; boundaries: no UI, no migrations, no storage writes beyond logs.

## Ergebnis (kurz)

- Created `tools/ops/STATION62_LOGGING_ALERTS_EVENT_SCHEMA.md` with canonical event shape (logs + alerts), severity mapping, required/optional fields, privacy rules, and overload/drop policy.
- Added machine-readable schema `tools/ops/log_event.schema.json` (schemaVersion 1.0.0) enforcing required fields, enums, meta whitelist/size caps, and alert extras.

## Tests

- None (design-only step).

## Notizen

- Step 1 complete. Next: implement logger, schema validation, rate limits, alert throttling, health endpoints per plan. Boundaries reaffirmed: no UI changes, no migrations, no storage writes beyond logs.

# - - - - - - - - - - - - - - - - - - - -

# Station 61 — Legacy Data Capture

## Kontext

- Status: read-only (completed).

- Branch: `feature/station61-legacy-capture`.
- Scope: Station 61 forensic capture of DogTabs legacy data; freeze raw inputs only (no parsing/mapping/cleanup).

## Ergebnis (kurz)

- Raw DogTabs payload copied byte-for-byte into `migration/legacy/station61/capture_20251219_185854Z` (capturedAt 2025-12-19T18:58:54Z UTC) with `raw/`, `README.md`, `manifest.json`, and `checksums.sha256`.
- Checksums cover all files except the checksum file itself; manifest lists size/hash per raw file; capture naming follows `capture_YYYYMMDD_HHMMSSZ`.
- CI guard `tools/ci/legacyStation61Guard.js` added and wired into the lint workflow (fetch-depth 0) to forbid modifications to existing `capture_*` directories; guard run locally using env-fed git status output (Node child_process blocked here) → pass.
- Legacy data remains unfiltered/unsorted; reserved for later mapping/cleanup stations.

## Tests

- `node tools/ci/legacyStation61Guard.js` with env-provided git status output ✅ (pnpm unavailable locally)

## Notizen

- Dogtaps raw payload parked in `migration/legacy/station61/capture_20251219_185854Z/raw/`; folder is gitignored and only stored for reference (no processing / no per-file listing here).

- Repo-doc gap: `agents.md` remains missing; Station 61 directory is input-only/immutable after commit.

# - - - - - - - - - - - - - - - - - - - -

# Station 59 — Authentication & Sessions MVP Implementation

## Kontext

- Status: read-only (completed).

- Branch: `feature/station59-auth-sessions`.
- Ziel: Auth-/Session-MVP mit lokalem Login (`admin|staff|trainer`), PBKDF2-Hashing, Access/Refresh-Tokens, Lockout, Logout/Revoke, Admin-2FA-Flag (stub), Feature-Flagging; Audit-/AuthZ-Aktions-IDs fest verdrahtet in Baseline/Matrix.

## Ergebnis (kurz)

- `DOGULE1_SECURITY_BASELINE.md` ergänzt um Auth-Parameter: PBKDF2-HMAC-SHA256 (120k, 16B Salt, 32B Key), Access=15m, Refresh=7d, Lockout 5/5m → 15m, Secrets `DOGULE1_AUTH_SECRET`/`DOGULE1_REFRESH_SECRET`, Flags `DOGULE1_AUTH_ENABLED`, `DOGULE1_SESSION_COOKIE_NAME` (HttpOnly/SameSite=Strict/Secure), Admin-2FA-Toggle, Audit-ActionIDs `auth.*`.
- `SECURITY_AUTHORIZATION_MATRIX.md` erweitert um `auth.login|refresh|logout|lockout|denied` Rollenregeln (deny-by-default bleibt).
- Neue Auth-Implementierung (Mock/MVP): `modules/shared/auth/` mit Hashing, HMAC-signed Tokens, Lockout-Tracking, Refresh-Rotation/Revoke, Audit-Hooks (actionId/actor/target/result + Chain-Felder), Feature-Flag `DOGULE1_AUTH_ENABLED` (default off), Admin-2FA-Flag (stub: verweigert, wenn gefordert aber nicht gesetzt). Seed-User mit PBKDF2-Hashes (`admin`, `staff`, `trainer`).
- Config-Resolver (`modules/shared/auth/config.js`) für Secrets/TTLs/Lockout/2FA; Error-Codes gekapselt; ownership bleibt rein in-memory (kein Storage-Write).

## Tests

- `pnpm vitest run modules/shared/auth/authService.test.js` ✅ (nach Vitest-Konfig-Anpassung auf Single-Thread)
- `pnpm vitest run` ✅ (alle 7 Suites: kalender utils, router utils, finanzen.trainer, authService)

## Notizen

- Keine Runtime-/Storage-Änderungen; `storage_candidate/`, `storage_reports/`, NAS/`dist-station40.tar.gz`, `dogule1-alpha/` unverändert.
- Vitest-Konfig auf Single-Thread (`pool: "threads", maxThreads=1`) gesetzt, um den vorherigen Worker-Crash zu beheben; Tests laufen stabil.

# - - - - - - - - - - - - - - - - - - - -

# Station 58 — Storage Access Layer Architecture (E3)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station57-authorization-matrix`.
- Ziel: Architekturplan für die Storage Access Layer (SAL), dual-mode (mock/real), inkl. AuthZ/Audit-Anforderungen, Migrationsreihenfolge, Storage-Layout, Contract-Tests und Ownership-Tabelle. Keine Code-/Storage-Änderungen.
- Quellen: Governance Station 58, Master-II Path, `SECURITY_AUTHORIZATION_MATRIX.md`, `DOGULE1_SECURITY_BASELINE.md`, Stations 54–57 Outputs.

## Ergebnis (kurz)

- `STATION58_STORAGE_ACCESS_LAYER_ARCHITECTURE.md` hinzugefügt: Dual-Mode-Switch (`DOGULE1_STORAGE_MODE=mock|real`, dev=mock, CI=real wenn Fixtures vorhanden, fehlende Pfade → fail fast), Real-Mode nutzt Station-54/56 Atomic Write + Integrity-Scan bei jedem Write; Candidate-Storage bleibt read-only.
- SAL-Konfiguration definiert für `modules/shared/storage/config.js` (Single Source): Mode-Auflösung, absolute Pfade (`/storage/v1`, `/storage_candidate/v1`), AuthZ/Audit-Hooks.
- AuthZ/Audit-Grenze: SAL verlangt `actionId/actorId/actorRole`, deny-by-default, jede Write-Operation (success/denied/error) erzeugt Audit-Eintrag mit Chain-Feldern (`hashPrev`, `hashIndex`, optional Merkle).
- Migrationsreihenfolge mit Begründung (Kunden → Hunde → Trainer → Kurse → Kalender → Finanzen → Waren → Kommunikation) zur FK-Sicherheit; Storage-Layout für Real vs. Candidate + Backup-Triggers (Stations 61/63).
- Contract-Tests gefordert (vor SAL-Implementation): CRUD + Parität (Mock vs Real, Hash-Vergleich), Error-Fidelity (`NotFound`, `InvalidData`, `InvariantViolation`, `Denied`, `StorageError`), Audit-Hook-Pflicht, Performance-Baseline (<5k rows).
- Ownership-Tabelle inkl. System-Actor (Imports/Backups/Config Jobs) mit Pflicht zu `actionId` + jobId im Audit-Kontext.

## Tests

- Keine (Dokumentationsstation).

## Notizen

- `STATION58_STORAGE_ACCESS_LAYER_ARCHITECTURE.md` ist Vorgabe für zukünftige SAL-Implementationen (Stations 59–63); CI-Gate folgt in Station 60. Keine Runtime-/Storage-/NAS-Änderungen; `storage_candidate/`, `storage_reports/`, `dist-station40.tar.gz`, `dogule1-alpha/` unverändert.

# - - - - - - - - - - - - - - - - - - - -

# Station 57 — Authorization Matrix & Audit Plan (F2, F4)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station57-authorization-matrix`.
- Ziel: Station-57 Planung/Dokumentation für Rollen×Aktionen, Audit-/Alert-Konzept, tamper-evidente Logs; erfüllt gleichzeitig die ausstehende Station-52 Security-Baseline-Anforderung.
- Scope: Rollen `admin`, `staff`, `trainer`, plus Pseudo-Rollen `system`, `unauthenticated`; Module: Kommunikation (Chats/Infochannel/Emails/System), Kalender, Imports, Finanzen, Backups, Config. Keine Code-/Storage-Änderungen.

## Ergebnis (kurz)

- `DOGULE1_SECURITY_BASELINE.md` erstellt (Version 0, Station-52+57): Prinzipien (deny-by-default), Rollen, Audit/Alert-Baseline, tamper-evidente Logging-Kette (SHA-256 Chain + optionale Merkle-Roots), CI-Gate-Erwartung für spätere Umsetzung.
- `SECURITY_AUTHORIZATION_MATRIX.md` hinzugefügt: machine-readable YAML für CI (Aktion-IDs wie `module.action` mit allowed/denied/conditional je Rolle), Tabellen-Hinweise, Preconditions, sensitive Domains markiert; System-/Unauthenticated-Rollen abgedeckt.
- Audit-Plan verankert: Pflichtfelder (ts/actor/action/target/result/before-after/requestId/hashPrev/hashIndex/context), keine Secrets/Tokens im Log, PII-Referenz zu Station 51, Pflicht-Audits für Finanzen/Imports/Backups/Config/Kommunikation-Writes.
- Alert-Plan definiert: Schwellen für failed_login, denied_action, finanzen_mutation, imports_failure, backup_failure, config_change; Station 62 muss diese Regeln implementieren.
- Tamper-Evidence aus Station 54–56 wiederverwendet (SHA-256, Chain, Rotation, Verifikationsprozedur); CI-Gate beschrieben (Station 60 muss Enforcement implementieren).

## Tests

- Keine (Dokumentationsstation).

## Notizen

- `DOGULE1_SECURITY_BASELINE.md` schließt die offene Station-52-Baseline-Anforderung und bildet die Grundlage für Station 57–62 (Auth/Authz/Logging/Alerts).
- Keine Runtime-/App-/Storage-Änderungen; `storage_candidate/`, `storage_reports/`, NAS-Artefakte, `dist-station40.tar.gz`, `dogule1-alpha/` unverändert.
- CI-Gate ist als Anforderung für spätere Stationen formuliert; derzeit keine Pipeline-Anpassung erfolgt.

# - - - - - - - - - - - - - - - - - - - -

# Station 56 — Migration Rehearsal & Cutover Prep (E2d)

## Kontext

- Status: read-only (completed).

- Branch: `53-55-Code`.
- Ziel: End-to-end Rehearsal der Station-53–55 Toolchain (dry-run → migrate → scan, Checksums/Merkle, FK/Invariant/PII), Determinismusbeweis, Rollback-Drill, Playbook-Aktualisierung.
- Inputs: Mock-DB (`modules/shared/api/db/index.js`) + Registries (`migration/mapping/*.json`) fixiert; Candidate-Root `storage_candidate/v1/`; `MIGRATE_RUN_ID=run-local`.

## Ergebnis (kurz)

- Rehearsal auf sauberem Workspace ausgeführt: `dry-run` → `migrate` → `scan-all` → 0 BLOCKER/WARNING; Candidate + Reports unter `storage_candidate/v1` und `storage_reports/latest-*`.
- Determinismus bestätigt: Candidate gelöscht, erneut `dry-run`/`migrate`/`scan-all`, `diff -r storage_candidate/v1-run1 storage_candidate/v1` leer (byte-identisch).
- Rollback-Drill: `MIGRATE_FAIL_AFTER_MODULE=kurse node tools/migration/cli.js migrate` bricht wie erwartet ab, Temp-Root entfernt, kein `storage_candidate/v1` hinterlassen; anschließender Clean-Run wieder grün.
- Hashes dokumentiert (`run.json`): kunden `e4237d40…317d`, hunde `66740e0d…511`, kurse `85c4ff57…8dd`, trainer `5a797283…437`, kalender `40035969…ef2`, finanzen `b2797674…1aa`, waren `297c6599…7b0`, kommunikation `e3b0c442…b855`.
- `CUTOVER_PLAYBOOK.md` und `STATION56_REHEARSAL_REPORT.md` auf Station-56-Rehearsal-Stand aktualisiert (Determinismus- und Rollback-Schritte aufgenommen).

## Tests

- `node tools/migration/cli.js dry-run` ✅
- `node tools/migration/cli.js migrate` ✅ (run-local)
- `node tools/migration/cli.js scan-all` ✅
- `diff -r storage_candidate/v1-run1 storage_candidate/v1` ✅ (Determinismus)
- `MIGRATE_FAIL_AFTER_MODULE=kurse node tools/migration/cli.js migrate` ❌ erwartet (Rollback-Drill; hinterließ kein `storage_candidate/v1`)

## Notizen

- Artefakte gitignored: `storage_candidate/v1/`, `storage_reports/latest-*`.
- Bekannte Warnung unverändert akzeptiert: Node-Hinweis zu fehlendem `"type": "module"` in package.json.
- Registries weiter Platzhalter aus Mock-IDs; echte UUID-Freigabe vor realem Cutover notwendig.

# - - - - - - - - - - - - - - - - - - - -

# Station 55 — Integrity Scanner & CI Integration (Phase E2c)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station55-integrity-scanner-plan`.
- PR: https://github.com/christiansamuels932/dogule1/pull/61
- Ziel: Read-only Integrity-Scanner + CLI-Befehle (scan-all/module/pii/drift/verify-checksums) für Candidate-Storage, CI-ready; keine Migration-Writes oder Registry-Mutationen.

## Ergebnis (kurz)

- CLI erweitert um Scan-Kommandos (schema/FK/invariants/PII/drift + separate verify-checksums) mit deterministischen Reports (`storage_reports/latest-scan/`); Exit-Regel: BLOCKER → exit 1, sonst 0.
- Validatoren implementiert: Schema (schemaVersion=1, version vorhanden), FK-Auflösung gegen Candidate-Daten, Invarianten (Zeitspanne, capacity>=bookedCount, non-negative price/betrag, Kurs/Trainer-Erfordernisse), Checksums (SHA-256 + Merkle, empty-root = SHA-256("")), Schema-Drift, PII-Leak-Check (kein PII in Checksums/Reports).
- Registry bleibt read-only; keine Runtime-/Mock-DB-Schreibzugriffe; Reports gitignored.

## Tests

- `pnpm exec eslint tools/migration` ✅
- Scan-Läufe nicht ausgeführt (Tooling-Implementierung ohne Ausführung).

## Notizen

- Läufe sollen auf `storage_candidate/v1` erfolgen; CI-Jobs folgen in dieser Station. Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert.

# - - - - - - - - - - - - - - - - - - - -

# Station 54 — Storage Adapters & Checksums (Plan, Phase E2b)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station54-storage-adapters-checksums`.
- PR: https://github.com/christiansamuels932/dogule1/pull/60
- Ziel: Implementierungs-Layout für Storage-Adapter und Checksumms festlegen (Candidate-Only), keine Runtime-/Storage-Schreiboperationen.

## Ergebnis (kurz)

- `tools/migration/STATION54_IMPLEMENTATION_PLAN.md` ergänzt: Ziel-Layout `storage_candidate/v1/<module>/data.jsonl` + Checksums, TargetAdapter-API (temp→fsync→rename, abort cleanup), SHA-256-Hashes mit kanonischem JSON, Merkle-Regeln (id-sortiert, Empty-Root = SHA-256("")), CLI-Migrate-Flags/Defaults, read-only Registry-Nutzung (Proposals nur in registry_candidate), Report-Pfade deterministisch, Validierungs-Scope = Schema-only (FK/Invariant/PII in 55), Safety-Guidelines (nur Candidate-Root).
- `.gitignore` erweitert um `storage_candidate/` (Candidate-Ausgaben werden nicht eingecheckt).

## Tests

- Keine (Dokumentationsstation, keine Codeänderungen).

## Notizen

- Station 53 (dry-run) muss landen, bevor 54 Schreibpfade nutzt; 54 bleibt candidate-only/offline. Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert.

# - - - - - - - - - - - - - - - - - - - -

# Station 53–55 — Migration Tooling Execution (Dry-Run, Migrate, Scan)

## Kontext

- Status: read-only (completed).

- Branch: `53-55-Code`
- Ziel: Station-53–55 Tooling tatsächlich ausführen/härten (Dry-Run + Migrate + Scan) mit deterministischen Outputs, Atomik via Temp-Root→Rename, Checksum/Merkle, Registry-gestützte FK-Rewrites.
- Registry: synthetische Platzhalter (`migration/mapping/*.json`) erstellt für alle Module; finale UUID-Zuweisungen müssen noch planerisch bestätigt/ersetzt werden.

## Ergebnis (kurz)

- `migrate.js` implementiert: liest Mock-DB, wendet Registry auf IDs/FKs an, erzwingt `schemaVersion=1`/`version=0`, schreibt Kandidat nur unter `storage_candidate/v1` via temp-root + atomic rename, erzeugt Entity-Checksums + Merkle (`checksums/entities.jsonl`, `merkle.json`) und deterministisches `checksums/run.json` (`runId`, `generatedAt` fix).
- CLI erweitert (`node tools/migration/cli.js migrate`), Dry-Run/Scan bleiben bestehen; Scan toleriert leere Registry nur bei leeren Modulen.
- Determinismus belegt: zwei `migrate` Läufe mit identischem `MIGRATE_RUN_ID=run-1` erzeugen byte-identische Trees (`diff -r` leer).
- Rollback-Drill: `MIGRATE_FAIL_AFTER_MODULE=kurse` → erwarteter Abbruch, Temp-Root wird entfernt, bestehender Kandidat bleibt unverändert.
- Kandidat + Checksums aktuell unter `storage_candidate/v1`; `run.json` nutzt `generatedAt: "00000000T000000Z"`.
- Mappings abgeleitet aus Mock-DB (Option A = Mock als Legacy): `migration/mapping/*.json` jetzt deterministisch aus Mock-IDs → uuidv7 (per Hash-Seeding).

## Tests

- `node tools/migration/cli.js dry-run` ✅ (0 BLOCKER)
- `node tools/migration/cli.js migrate` ✅ (kandidat geschrieben, checksums/merkle)
- `node tools/migration/cli.js scan-all` ✅ (0 BLOCKER/WARNING)
- Determinismus: zwei Läufe (`MIGRATE_RUN_ID=run-1`) + `diff -r storage_candidate/v1_run1 storage_candidate/v1_run2` → keine Unterschiede
- Rollback-Injection: `MIGRATE_FAIL_AFTER_MODULE=kurse MIGRATE_RUN_ID=fail-test node tools/migration/cli.js migrate` ❌ erwartet; Temp-Verzeichnis bereinigt
- `pnpm lint` ✅ (nach Ignore-Erweiterung für build/output/reports)

## Issues

- UUID-Mappings leiten sich deterministisch aus Mock-IDs ab; falls echte Legacy-Daten auftauchen, müssen sie ersetzt werden.
- Fsync-Pfad (temp→fsync→rename) fehlt noch; aktuell rename-atomik ohne fsync.
- Vitest nicht erneut ausgeführt (vorbekanntes Worker-Exit-Problem bleibt offen).
- Node-Warnung zu fehlendem `"type": "module"` weiter vorhanden (bewusst unverändert).

## Notizen

- Kandidat-/Report-Pfade gitignored (`storage_candidate/`, `storage_reports/`).
- CUTOVER-Playbook/Station-56-Report noch zu schreiben; wird in Station 56 erwartet.

# - - - - - - - - - - - - - - - - - - - -

# Station 52 — Migration & Integrity Tooling Plan (Phase E2)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station52-migration-tooling-plan`.
- PR: https://github.com/christiansamuels932/dogule1/pull/58
- Ziel: Plan für Migration/Integrity-Tooling auf Basis der Storage-Baseline erstellen (keine Implementierung/Storage-Manipulation).

## Ergebnis (kurz)

- `MIGRATION_TOOLING_PLAN.md` angelegt: Scope/Out-of-scope, Engine-Architektur (CLI, Source/Target-Adapter, Mapper, Legacy-ID-Registry, Validation, BatchRunner), ID/Version/Prefix-Regeln, Mapping/Checksum/Integrity-Scanner/Fallback-Strategien, Staging/Cutover/Rollback, Test- und Failure-Injection-Protokoll, Runbook/Reports.
- Plan bindet strikt an `DOGULE1_SYSTEM_BASELINE_V2.md` (Baseline gewinnt bei Konflikt) und nennt Governance-Namenskonflikt (Stations 53–56) als vorgelagerte Governance-Aktion.
- Keine Runtime-Codeänderungen; reine Dokumentation/Planung.

## Tests

- Keine (Dokumentationsstation, keine Codeänderungen).

## Notizen

- Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert belassen. Governance-Update erforderlich, bevor technische Schritte 53–56 umgesetzt werden.
- Governance wurde nach Station 52 angepasst: Stationen 53–56 sind jetzt Migration/Integrity (siehe PR `feature/station52-migration-tooling-plan`); nachgelagerte Stationen wurden entsprechend renummeriert.

# - - - - - - - - - - - - - - - - - - - -

# Station 51 — Storage Baseline V2 Formalization

## Kontext

- Status: read-only (completed).

- Branch: `feature/station51-storage-baseline`.
- Ziel: Speicher-Baseline V2 dokumentieren (Schemas, IDs, PII/Residency, Integrität, Migration).

## Ergebnis (kurz)

- `DOGULE1_SYSTEM_BASELINE_V2.md` angelegt (Schema-Tabellen für alle Module inkl. Kommunikation-Shell, PII/Residency, ID/Version-Policy, Invarianten, Checksums, Concurrency/Atomicity, Failure-Injection, Mock→Real-Mapping, Backup/Scan-Cadence).
- Governance verweist nun auf die Baseline; `modules/shared/api/README.md` hinzugefügt als Pointer für Mock-Daten/Storage-Arbeiten.
- Keine Codeänderungen an Runtime; Migration/Tooling noch ausstehend.

## Tests

- Keine (Dokumentationsstation).

## Notizen

- Migration-/Integrity-Tooling folgt in späteren Schritten; PII/Prefix/Version Defaults sind im Dokument fixiert.

# - - - - - - - - - - - - - - - - - - - -

# Station 50 — Roadmap Governance & Definitions of Ready

## Kontext

- Status: read-only (completed).

- Branch: `feature/station50-governance`.
- Ziel: Governance und DoR-Artefakte für Stationen 50–70 erstellen (nur Dokumentation, keine Builds/Tests).

## Ergebnis (kurz)

- `DOGULE1_GOVERNANCE.md` angelegt: Stationen 50–70 restated mit Validierung (2025-12-08, gültig), Gating-Regeln, Branch/PR-Governance, Rollen, Änderungsregeln, Blocker-Protokollierung.
- `DOR_PHASES_E_TO_I.md` angelegt: DoR-Templates für Phasen E–I mit Pflichtfeldern (Scope, Dependencies, Risiken/Annahmen, Artefakte, Testbarkeit, Reviewer, Timebox, Boundaries, Exit-Kriterien) und Vorgabe, Risiken/Annahmen in PR + `status.md` zu loggen.

## Tests

- Keine (Dokumentationsstation).

## Notizen

- Keine Codeänderungen. Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert belassen.

# - - - - - - - - - - - - - - - - - - - -

# Station 42 — NAS Smoke Test

## Kontext

- Status: read-only (completed).

- Branch: `feature/station42-nas-smoketest`.
- Ziel: Formale NAS-Smoketest-Abnahme des statischen Builds (HTTP, keine Codeänderungen), Protokollierung in `NAS_SMOKE_TEST_REPORT.md` und `status.md`.

## Ergebnis (kurz)

- NAS-App über HTTP geladen; alle Module (Dashboard, Kunden, Hunde, Kurse, Trainer, Kommunikation/Placeholder, Kalender, Finanzen, Waren) gerendert ohne Fehler (nur erwartetes `favicon.ico` 404).
- CRUD für Kunden/Hunde/Kurse/Trainer/Finanzen/Waren erfolgreich (Create/Edit/Delete). Kalender Tag/Woche + Event-Linking funktionieren; Back/Forward/Hash stabil.

## Tests

- Manuelle NAS-Smoketests per Browser (HTTP auf NAS-Pfad) ✅
- Keine Build/Lint/Test-Läufe (Validierungsstation, kein Code geändert).

## Issues

- Erwartetes `favicon.ico` 404 im NAS-Serving (als bekannt/benign dokumentiert).

## Notizen

- `NAS_SMOKE_TEST_REPORT.md` ergänzt mit Metadaten/Ergebnissen. Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) unverändert belassen.

# - - - - - - - - - - - - - - - - - - - -

# Station 41 — NAS Deployment (Completed)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station41-nas-deployment` @ commit `0763e90f77a81abc97b245310eca260fd3119db7`.
- Ziel: NAS Deployment des Alpha-Builds durchführen und verifizieren.

## Ergebnis (kurz)

- Deployment auf NAS-Pfad `/volume1/web/dogule1-alpha/` abgeschlossen; Struktur top-level `index.html` + `assets/` ohne zusätzliche Verschachtelung.
- Smoke-Test (HTTP) erfolgreich: App lädt vollständig, alle Module (Dashboard, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen, Waren) funktionieren mit Mock-API, CRUD und Back/Forward ok, keine roten Konsolenfehler oder CORS/MIME/404-Warnungen.
- Verhalten identisch zum Station-40-Static-Build.

## Tests

- Deployment-Integrationstest: ✅ (Statische Auslieferung über NAS-HTTP geprüft)
- Hinweise: Favicon 404 erwartet/irrelevant; Mock-DB bleibt nicht persistent (Design).

## Offene Punkte/Risiken

- Vitest-Worker-Exit (Umweltproblem) weiterhin bekannt, nicht blocker für NAS.

## Nächste Schritte

- Station 42 – NAS Smoke Test (formale Abnahme).

# - - - - - - - - - - - - - - - - - - - -

# Station 41.1 — Status Log Restoration & Guardrail

## Kontext

- Status: read-only (completed).

- Branch: `feature/station41.1-status-log-fix`.
- Ziel: Vollständige Stationshistorie in `status.md` wiederherstellen und Guardrail-Instruktion ergänzen, damit keine Stationseinträge mehr überschrieben/entfernt werden.

## Ergebnis (kurz)

- `status.md` aus Commit `d6343be` (Stand Station 38) wiederhergestellt, anschließend Station 39–41 Einträge erneut angefügt.
- Neue READ-ONLY-Instruktion oben ergänzt: alle Stationen müssen erhalten bleiben; bei Trunkierungen ist die Historie vor neuen Einträgen wiederherzustellen (fix dokumentiert für den vorherigen Station-39–41-Overwrite).

## Tests

- Keine Builds/Tests notwendig (Dokumentationsstation).

## Notizen

- Untracked Artefakte (`dist-station40.tar.gz`, `dogule1-alpha/`) bewusst unverändert belassen.

# - - - - - - - - - - - - - - - - - - - -

# Station 40 — NAS Build Preparation (Completed)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station40-nas-deployment` @ commit `0763e90f77a81abc97b245310eca260fd3119db7`.
- Ziel: NAS-Build vorbereiten, Validierungssequenz erneut ausführen, statisches Hosting prüfen.

## Ergebnis (kurz)

- Vollständige Validierungssequenz auf Branch/Commit Lock erneut ausgeführt (siehe Tests); Build frisch erzeugt.
- Manuelle Alpha-Walkthrough-Tests laut Skript: ✅ (keine In-App-Abweichungen, Konsole clean; entspricht Local Alpha V0.1).
- Static-Hosting-Test per `python3 -m http.server 8000` aus `dist/`: ✅ (alle Module/CRUD, Nav/Back/Forward, keine roten Konsolenfehler oder CORS/MIME/404-Hinweise). `file://`-Aufruf von `index.html` erzeugt erwartete CORS-Fehler für CSS/JS (ESM-Standard) und ist kein Blocker für NAS-HTTP-Hosting.
- NAS-Build-Artefakt erstellt: `dist-station40.tar.gz` (untracked) mit SHA256 `5a473e409dffaf662417b33177781d3578a0e5e4e90121f750637dcd0d504dee` aus dem frisch erzeugten `dist/`.

## Tests

- `pnpm install` ✅
- `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"` ✅ (nur bekannte Warning zu fehlendem `"type": "module"`)
- `pnpm lint` ✅
- `pnpm vitest run` ❌ (gleiches Worker-Exit/no-tests-collected-Muster wie Station 39; Umweltproblem, kein Regression)
- `rm -rf dist` → `pnpm build` ✅ (frische hashed Assets in `dist/assets`; Basis für Paket)
- Manuelles Alpha-Skript: ✅
- Static-Hosting-Smoke (lokal, HTTP auf `dist/`): ✅ (siehe Ergebnis)

## Offene Punkte/Risiken

- Vitest-Worker-Exit bleibt ungefixt (Umweltproblem).
- Dev-Server kann Port-EPERM auf ::1:5173 auslösen; bei Bedarf mit Escalation starten (siehe Station 39).
- `file://`-Zugriff auf `dist/index.html` erzeugt erwartete ESM-CORS-Fehler; NAS/HTTP-Hosting nicht betroffen.

## Nächste Schritte / Migration

- Station 41 – NAS Deployment: `dist/` bzw. `dist-station40.tar.gz` nach NAS-Zielpfad laut `NAS_ALPHA_DEPLOY.md` kopieren, statischen Hosting-Smoke-Test durchführen und Ergebnisse loggen.
- Ready for migration zu Station 41.

# - - - - - - - - - - - - - - - - - - - -

# Station 39 — Alpha Hardening (Failure Inventory)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station39-alpha-hardening`.
- Ziel: Alpha-Testskript vollständig ausführen (ohne Codeänderungen), Abweichungen in `STATION39_FAILURE_INVENTORY.txt` dokumentieren.

## Ergebnis (kurz)

- Pre-Run-Kommandos ausgeführt; Lint/Build/IntegrityCheck grün, Vitest bricht ab (Worker exited unexpectedly, keine Tests gesammelt).
- Dev-Server musste mit erhöhten Rechten gestartet werden (Port ::1:5173 EPERM im ersten Versuch, zweiter Start per Escalation). UI-Walkthrough vollständig durchgeführt, keine in-app Abweichungen/Console-Warnungen, kleiner Beobachtungspunkt: Finanzen-Liste initial gelegentlich ~1s Ladezeit, aber innerhalb Erwartung.
- Failure Inventory ergänzt (Environment-Hinweise, Vitest-Failure, Dev-Server-Port, alle Modul-Checks als Pass).

## Tests

- `pnpm install` ✅ (Warnung: husky install deprecated; pnpm approve-builds Hinweis)
- `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"` ✅ (bekannte `"type": "module"` Warnung)
- `pnpm lint` ✅
- `pnpm vitest run` ❌ (Worker exited unexpectedly; 6 unhandled errors, keine Tests)
- `pnpm build` ✅
- `pnpm dev` ⚠️ (erstes Mal EPERM ::1:5173; zweiter Start mit Escalation OK, aber Prozess durch Timeout beendet)

## Issues

- Vitest: Worker-exit/Unhandled errors verhindern Testlauf (keine Suites gesammelt).
- Dev-Server: Port 5173 EPERM ohne Escalation; startete nur mit erhöhten Rechten und lief bis Timeout; Browser/DevTools Lauf erfolgte manuell außerhalb des Timers.

## Notizen

- `STATION39_FAILURE_INVENTORY.txt` enthält detaillierte Beobachtungen (Environment + alle Modul-Schritte als Pass). Keine GUI-Anpassungen oder Codeänderungen vorgenommen.

# - - - - - - - - - - - - - - - - - - - -

# Station 38 — Local Alpha Test Script (Phase C)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station38-alpha-test-script` (ab Station-37-Stand fortgeführt).
- Ziel: Deterministisches, schrittweises Alpha-Testskript erstellen, das alle Module (Phase A) und Verknüpfungen (Phase B) abdeckt und bekannte Nicht-Ziele dokumentiert.
- Artefakte: `ALPHA_TEST_SCRIPT.md` (vollständiges Skript mit Aktionen/Erwartungen/Konsolen-Checks).

## Ergebnis (kurz)

- Vollständiges Alpha-Testskript mit festen Testdaten (Alpha Kunde/Hund/Kurs/Trainer/Ware/Finanzbuchung), Aktionen→Erwartung→Konsolen-Triplets, Navigation/Back/Forward/Hash-Checks.
- Deckt Phase-A-Checks je Modul (Focus/Scroll/Shared Components/Empty/Error/Loading) und alle Verknüpfungsketten (Kunden↔Hunde↔Kurse↔Trainer↔Kalender, Trainer↔Finanzen) ab; Kommunikation als Placeholder bestätigt.
- Negative Tests dokumentiert: Keine automatischen Waren→Finanzen- oder Kurs→Finanzen-Einträge.
- Data/Cleanup-Policy und Branch/Commit-Lock festgelegt für deterministische Runs.

## Tests

- Keine Builds/Tests notwendig (Dokumentationsstation); Pre-Run-Befehle im Skript vorgegeben (`pnpm install`, Integrity Check, `pnpm lint`, `pnpm vitest run`, `pnpm build`, `pnpm dev`).

## Notizen

- Bekannte Warnung bleibt akzeptiert: Node-Hinweis zu fehlendem `"type": "module"` beim Integrity Check.
- Branch/Commit-Lock im Skript: `feature/station38-alpha-test-script` @ `621e849`.

# - - - - - - - - - - - - - - - - - - - -

# Station 37 — Local Alpha Assembly Prep (Phase C)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station35-trainer-finanzen` (weitergeführt für Station 37).
- Ziel: Alpha-Assembly vorbereiten ohne Scope-Erweiterung; Plan/Doku ergänzen, UX-Konsistenz prüfen, kleine UI-Korrekturen.
- Grenzen: Kommunikation bleibt Placeholder, Waren ↔ Finanzen nicht verknüpft, keine automatischen Kurs/Waren-Umsätze in Finanzen.

## Ergebnis (kurz)

- Plan/Doku: `STATION37_ALPHA_PLAN.md` hinzugefügt (Scope-Guards, Walkthrough, Gaps); README um Alpha-Abschnitt ergänzt (Runs, Verknüpfungen, bekannte Lücken).
- Navigation: Hauptmenü-Reihenfolge angepasst auf `Dashboard, Kunden, Hunde, Kurse, Trainer, Kommunikation, Kalender, Finanzen, Waren`.
- Kunden-Create: Optionaler Hunde-Block im Kundenformular (Mehrfachentwürfe, Name Pflicht, Code auto, Kunde FK gesetzt, Toast mit Erfolg/Fehlschlägen).
- Waren: Listen/Detail zeigen zugehörigen Kunden; Formular erfordert Kunde-Select; „Neu“-Button links ausgerichtet; Codes weiter optional.
- Bekannter Gap dokumentiert: Kein automatischer Waren→Finanzen- oder Kurs→Finanzen-Eintrag (bleibt bewusst offen).

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅ (Vite CJS Node API deprecation notice)
- `pnpm build` ✅
- `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"` ✅ (bekannte `"type": "module"` Warnung akzeptiert)

## Notizen

- Manuelle Alpha-Walkthrough-Schritte erfolgreich (Kunde→Hund→Kurs→Trainer→Kalender, Waren-CRUD, Finanzen-CRUD).
- Station 38 soll bekannte Gaps berücksichtigen (kein Waren/Kurs-Auto-Revenue, Kommunikation weiterhin minimal).

# - - - - - - - - - - - - - - - - - - - -

# Station 36 — Connect Trainer ↔ Kalender (Derivation-Only)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station35-trainer-finanzen` (weitergeführt für Station 36)
- Ziel: Trainerdaten nur abgeleitet in Kalenderoberflächen anzeigen, keine Schema-/Persistenzänderungen.
- Vorbedingungen: Station 32/32a (Kurse ↔ Trainer, FK-Checks), Station 33 (Kurse ↔ Kalender via kursId, keine Trainerfelder im Event) waren bereits umgesetzt.

## Änderungen (Code)

- `modules/kalender/index.js` (Bestand aus Station 33 weiterverwendet): Event-Blöcke/Details nutzen bereits `attachKursAndTrainer` und zeigen Trainer-Metadaten (Titel, Trainerzeile, „Zum Trainer“-Link im Event-Detail). Keine neuen Persistenzfelder; ableitende Darstellung bleibt intakt.
- `modules/kalender/utils/eventContext.js`: Weiterhin verantwortlich für Kurs/Trainer-Auflösung pro Event (keine Schemaänderung).
- `modules/trainer/index.js`: Neue read-only Karte „Kalendereinsätze“ im Trainer-Detail:
  - Lädt alle Kalender-Events, filtert nach `trainerId`.
  - Zeigt Datum + Zeitspanne (ISO → lokal), Titel/Code, Links zu Kurs (`#/kurse/<id>`) und Event (`#/kalender/event/<id>` Hash via `buildKalenderHash`).
  - Deutsche Empty/Error States, sortiert nach Startzeit.
  - Keine Schreiboperationen; rein abgeleitete Anzeige.
- Hilfsfunktionen ergänzt: Sortierung/Formatierung (`sortEventsByStart`, `formatEventTimeRange`).

## Tests & Qualität

- `pnpm lint` ✅
- `pnpm test --run` ✅ (Vitest-Suite inkl. Kalender-Utils/Routes/Layout und Finanzen-Trainer-Tests)
- `pnpm build` ✅
- `runIntegrityCheck` ✅ (Node Warnung: package.json ohne `"type": "module"`, unverändert)
- Manuelle Checks ✅: Kalender Tag/Woche zeigt Trainerzeile bzw. „Kein Trainer zugewiesen.“; Event-Detail mit Trainerblock + „Zum Trainer“; Trainer-Detail-Karte listet Events inkl. Links/Empty/Error.

## Lint/Build/CI-Folgen

- Keine neuen Lint-Verstöße; Husky/lint-staged liefen bei Commits.
- Node Warnung bei Integrity-Check bleibt bekannt (Type-Flag), bewusst nicht geändert.

## Entscheidungen / Abweichungen

- Keine Schemaänderungen in `kalender` (Events behalten nur `kursId`; Trainer wird immer über Kurs aufgelöst).
- Keine Router/Layout-Anpassungen; nur Moduloberflächen erweitert.
- Keine neuen Mock-Daten; bestehende Kurs→Kalender-Synchronisation reicht für Trainerableitung.

## Issues

- Node-Hinweis beim Integrity-Check (fehlendes `"type": "module"` in package.json) bewusst akzeptiert; keine Aktion.

## Notizen

- Station 36 abgeschlossen. PR “Station 36.X – Update Log” offen: https://github.com/christiansamuels932/dogule1/pull/48.

# - - - - - - - - - - - - - - - - - - - -

# Station 35 — Connect Trainer ↔ Finanzen (re-scoped)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station35-trainer-finanzen`
- Ziel: Trainer-Metadaten in Finanzen (read-only), optional `kursId` in Zahlungen, keine Schemaerweiterung darüber hinaus.

## Ergebnis (kurz)

- Finanzen-Liste/Detail zeigen Trainer-Meta/Links für Kurs-Zahlungen; Trainer-Detail Umsatz-Karte (Summen Bezahlt/Offen/Saldo + letzte Einträge) mit Finanzen-Links.
- Neue API-Helper `resolveFinanzenWithRelations`, `getFinanzenReportForTrainer`; Integrity-Check validiert `kursId` falls vorhanden.
- Nicht kursgebundene Zahlungen bleiben unverändert; Kurs ohne Trainer zeigt Hinweis; Trainer-Umsatzkarte leer bei keinem Umsatz.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run --root . modules/shared/api/finanzen.trainer.test.js` ✅
- `pnpm build` ✅
- Manuelle Checks durchgeführt.

# - - - - - - - - - - - - - - - - - - - -

# Station 35.1 — CI Lint Fix (Trainer ↔ Finanzen)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station35-trainer-finanzen`
- Ziel: Lint-Fehler (unused helper) beheben.

## Ergebnis (kurz)

- Unbenutzten Helper `formatScheduleTimeRange` entfernt; Aufruf bleibt bei `formatTimeRange`.

## Tests

- `pnpm lint` ✅

## Notizen

- Rein technischer Cleanup, keine funktionalen Änderungen.

# - - - - - - - - - - - - - - - - - - - -

# Station 33 — Connect Kurse ↔ Kalender

## Kontext

- Status: read-only (completed).

- Branch: `feature/station33-kurse-kalender`
- Ziel: Kalender-Ereignisse strikt aus Kursen ableiten/synchronisieren.

## Ergebnis (kurz)

- Kalender upsert/remove per Kurs; `syncKalenderWithKurse` räumt Waisen.
- Event-Payload lokal → ISO, nur MASTER-Felder.
- UI: Event-Blocks verlinken zu `#/kurse/<id>`, Event-Detail zeigt Kurs-Infos + „Zum Kurs/Zum Tag“.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- Manuell: Kurs erstellen → Event erscheint; Zeit ändern → Event verschiebt; Löschen nach Entlinken entfernt Event; Event-Detail-Link ok.

# - - - - - - - - - - - - - - - - - - - -

# Station 32 — Connect Kurse ↔ Trainer

## Kontext

- Status: read-only (completed).

- Branch: `feature/station31-hunde-kurse` (fortgeführt)
- Ziel: Trainer-Zuweisung validieren, Kurse ↔ Trainer Navigation, Delete-Guards.

## Ergebnis (kurz)

- Kurse laden/prüfen Trainerliste, Trainerkarte im Kursdetail (ID/Code/Kontakt), UI-Fehler bei ungültigem Trainer.
- Trainer-Detail listet Kurseinsatz; Trainer-Löschen blockiert bei Zuweisungen und zeigt Kursliste, Integrity-Check im Fehlerfall.
- Aktionen-Karten mit primärem „Neuer …“-Button vereinheitlicht.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- Manuell: Kursdetail → Trainer-Link, Trainerdetail → Kurse, Kurs-Create/Edit mit Trainer, Delete-Guard.

# - - - - - - - - - - - - - - - - - - - -

# Station 32a — Build-Fix Trainer FK Export

## Kontext

- Status: read-only (completed).

- Branch: `feature/station31-hunde-kurse`
- Ziel: CI-Build-Fix nach fehlendem Export und FK-Check.

## Ergebnis (kurz)

- `modules/shared/api/kurse.js` exportiert `getKurseForTrainer`.
- Trainer-FK-Checks verschärft; Integrity-Check erweitert.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- Commit: `fix: enforce trainer FK and export getKurseForTrainer`.

# - - - - - - - - - - - - - - - - - - - -

# Station 31 — Connect Hunde ↔ Kurse

## Kontext

- Status: read-only (completed).

- Branch: `feature/station31-hunde-kurse`
- Ziel: Kurse in Hundedetail, Hunde in Kursdetail; Besitzerinfos konsistent.

## Ergebnis (kurz)

- Hunde-Detail listet Kurse inkl. Links; Kurs-Detail listet teilnehmende Hunde inkl. Besitzerinfos.
- Alle Hundedarstellungen zeigen Besitzer (Code/Name) + Ort aus Kundenadresse; Kurs-Formular-Suche/Chips ebenso.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- PR ausstehend.

# - - - - - - - - - - - - - - - - - - - -

# Station 30 — Connect Kunden ↔ Kurse (Hunde-basiert)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station30-kunden-kurse`
- Ziel: Teilnehmermodell auf Hunde-only, abgeleitete Kundenanzeigen.

## Ergebnis (kurz)

- Kurse validieren `hundIds`, `kundenIds` entfernt; Integrity-Check aktualisiert.
- Kunden-Detail verlinkt Kurse über Hunde.
- Kurs-UI zeigt Teilnehmerkunden abgeleitet aus Hundebesitzern.
- Neues Typeahead im Kurs-Formular: Spalten Kunden/Hunde; Kunde-Klick fügt alle eigenen Hunde hinzu, Hund-Klick Einzelhund; Chips/Leeren; leere Auswahl erlaubt.

## Tests

- `pnpm lint` ✅
- `pnpm vitest run` ✅
- `pnpm build` ✅
- PR erstellt (Station abgeschlossen).

# - - - - - - - - - - - - - - - - - - - -

# Station 29 — Connect Kunden ↔ Hunde

## Kontext

- Status: read-only (completed).

- Branch: `feature/station29-kunden-hunde`
- Ziel: Bidirektionale Navigation Kunden↔Hunde, FK-Sicherung.

## Ergebnis (kurz)

- Kunden-Detail zeigt verlinkte Hunde (ID/Code); Hunde-Liste/Detail verlinkt Besitzer, Rücksprung nach Delete.
- Hund-API erzwingt gültige `kundenId` bei Create/Update.
- Self-Test-Checkliste um Station-29-Block ergänzt.

## Tests

- `runIntegrityCheck` ✅
- `pnpm lint` ✅
- `pnpm test` ✅
- `pnpm build` ✅

# - - - - - - - - - - - - - - - - - - - -

# Station 28 — Waren Single-Module Completion (Phase A)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station28-waren`
- Ziel: Waren-CRUD Phase-A-fertig (keine Relationen).

## Ergebnis (kurz)

- Routen `#/waren`/`new`/`<id>`/`<id>/edit`.
- Listen/Detail/Form/Delete über Shared Cards/Buttons/Notices/Form-Rows.
- Deutsche UI, Loading/Error/Empty/Not-Found, Fokus/H1/H2 korrekt.
- Keine Routing-/Console-Warnungen; nutzt zentrale Waren-API.

## Tests

- `pnpm lint` ✅
- `pnpm build` ✅
- Manuelle Self-Test: CRUD inkl. Delete ✅

# - - - - - - - - - - - - - - - - - - - -

# Station 27 — Finanzen Single-Module Completion (Phase A)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station27-finanzen`
- Ziel: Finanzen-CRUD komplettieren.

## Ergebnis (kurz)

- Hash-Routen `#/finanzen`/`new`/`<id>`/`<id>/edit`.
- Shared-Formular: ID read-only + Code-Override, Felder Kunde/Typ/Betrag/Datum/Beschreibung.
- Filter + Summary beibehalten; Detail mit Edit/Delete-Actions, Inline-Löschbestätigung.
- Typen vereinheitlicht auf „Bezahlt/Offen“, Kundenlabels aus zentraler Map.
- Shared Notices/Empty, Fokus/Scroll-Reset, deutsche UI.

## Tests

- `pnpm lint` ✅
- `pnpm test` ✅
- `pnpm build` ✅
- Manuelle Self-Test: CRUD end-to-end inkl. Delete ✅, Console clean.

# - - - - - - - - - - - - - - - - - - - -

# Station 25 — Finanzen Phase A (Listen/Detail/Filter – Skeleton)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station25-finanzen`
- Ziel: Phase-A-Skelett für Finanzen (ohne CRUD/Deletes, vorbereitet für Station 27).

## Ergebnis (kurz)

- `initModule` mit Scroll/Fokus/Hash-Segmente.
- Loading/Error/Empty via Shared Notices.
- Summary-Karte (Summe Zahlungen/Offen/Saldo), Filter-Karte (Kunde/Typ).
- Einträge-Tabelle mit Kundenauflösung und Hash-Details.
- Detail-Card mit Kunde-Link + Back-Link.

## Tests

- `pnpm lint` ✅
- `pnpm build` ✅
- Manuell: `#/finanzen`, `#/finanzen/<id>` console-clean.

# - - - - - - - - - - - - - - - - - - - -

# Station 24 — Trainer Single-Module Completion (Phase A)

## Kontext

- Status: read-only (completed).

- Branch: `feature/station24-trainer`
- Ziel: Trainer-Modul Phase-A-fertig (CRUD, Validierung, Shared Components).

## Ergebnis (kurz)

- h1/h2-Hierarchie sauber, Router-Mount unverändert.
- IDs sequenziell `t<n>` API-seitig; UI zeigt ID read-only, Code-Override-Toggle in Create/Edit.
- Verfügbarkeiten als interaktives Textarea mit Persistenz.
- Form-Buttons triggern Submit (`requestSubmit`), CRUD wieder funktionsfähig.
- Detail/List zeigen ID/Code/Kontakt/Notizen/Verfügbarkeiten.

## Tests

- `pnpm lint` ✅
- `pnpm build` ✅
- Manuelle UI-Validierung Phase-A: CRUD, Validierung, Empty/Error, Navigation, Shared-Styles ✅

# - - - - - - - - - - - - - - - - - - - -

# Station 20 — Dashboard Phase A

## Kontext

- Status: read-only (completed).

- Ziel: Dashboard auf zentrale Mock-API umstellen, Phase-A-Ready.

## Ergebnis (kurz)

- Dashboard-Zählungen nutzen zentrale Kunden/Hunde/Kurse-Daten.
- Fallback-Texte vereinheitlicht, Scroll/Focus beim Laden.
- Status-Karte via Shared Notice; Self-Test für Dashboard abgeschlossen.

## Tests

- `pnpm lint` ✅
- `pnpm build` ✅

## Notizen

- MASTER ergänzt: Module gelten nur nach vollständigem GUI + manueller Freigabe als abgeschlossen.

# - - - - - - - - - - - - - - - - - - - -

# Station 19 — Module Self-Test Preparation (Phase A)

## Kontext

- Status: read-only (completed).

- Ziel: Pflicht-Checkliste für Phase-A-Module etablieren.
- Artefakt: `PHASEA_SELFTEST_CHECKLIST.md` erstellt und im MASTER verankert.

## Ergebnis (kurz)

- Checkliste deckt Router/Layout/Shared Components/CRUD/Empty/Error/Accessibility/Integrity ab.
- MASTER verweist auf Checkliste als Voraussetzung für alle Phase-A-Stationen.

## Notizen

- Keine Codeänderungen an Modulen; Dokumentationsstation abgeschlossen.

# - - - - - - - - - - - - - - - - - - - -

# Station 18 — Status Quo Cleanup & Router/Layout/Build/Mock DB Konsolidierung

## Kontext

- Status: read-only (completed).

- Phase-1 Abschluss: Vereinheitlichung und Hardening der Basis.
- Scope: UI/ID-Regeln angleichen, Vite-Build stabilisieren, Router/Layout finalisieren, Mock-DB zentralisieren.

## Ergebnis (kurz)

- Dashboard/Kunden/Hunde/Kurse vereinheitlicht; ID/Code-Regeln dokumentiert (id fix, code editierbar).
- Router final: Clean Hash Router mit `import.meta.glob`, Fehlerzustände, Navigation-Highlighting.
- Layout final: Statische Layout-Injektion, Mount nur in `#dogule-main`.
- Build final: Vite-only, relative Pfade, keine Hybrid-Templates.
- Mock-DB: Alle Daten zentral in `modules/shared/api/db/index.js`; Integrity-Check aktiv.
- NAS-Platzhalter/Doku hinterlegt.

## Notizen

- Phase 1 QA-Checkliste angelegt; dient als laufender Prüfanker.

# - - - - - - - - - - - - - - - - - - - -

# Station 1–17 — Foundations & Early Linking (Historisch)

## Kontext

- Status: read-only (completed).

- Zeitraum: Phase 1 Baseline bis Kurs-Finanzflächen.
- Branches/PRs: diverse, bereits gemergt; keine offenen PRs mehr aus dieser Phase.
- Scope: Tooling, Router/Layout, Shared Components, zentrale Mock-API, CRUD für Kunden/Hunde/Kurse, erste Finanzen-Ansichten, frühe Verknüpfungen (Kunden↔Hunde↔Kurse), Build/NAS-Vorbereitung.

## Ergebnis (kurz)

- Tooling/CI/Husky/Commitlint aufgesetzt, Module scaffolded, Hash-Router + persistentes Layout, Shared UI-Komponenten, zentrale Mock-DB/CRUD.
- CRUD: Kunden, Hunde, Kurse; Finanzen-Karten für Kunden/Hunde/Kurse (readonly).
- Verknüpfungen: Kunden↔Hunde, Hunde↔Kurse, Kunden↔Kurse (teilnehmerbezogen), Kurs-Finanzflächen.
- Build: Vite-only mit relativen Pfaden; NAS-Platzhalter; Integrity-Check etabliert.

## Notizen

- Alle Stationen 1–17 abgeschlossen, keine offenen Issues aus dieser Phase bekannt.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# 53-55-Code — Migration Tooling Execution & Remediation (Guardrail)

## Kontext

- Status: read-only (completed).

- Branch: `53-55-Code`.
- Hintergrund: Stationen 53–55 waren zuvor nur geplant, nicht ausgeführt; dieser Eintrag dokumentiert die nachgeholte Ausführung/Härtung. Guardrail: Keine künftige Station darf als erledigt gelten, ohne tatsächliche Ausführung + Status-Log.
- Legacy-Quelle: Option A (Mock-DB als Legacy). Mappings deterministisch aus Mock-IDs abgeleitet.

## Ergebnis (kurz)

- Mappings generiert via `tools/migration/generateMappings.js`: Mock-ID → uuidv7 (hash-seeded), abgelegt unter `migration/mapping/*.json`.
- `migrate` gehärtet: Temp-Root + fsync auf Dateien/Verzeichnisse vor Rename; schreibt Kandidat nur nach `storage_candidate/v1`, erzeugt Checksums/Merkle + deterministisches `run.json` (`generatedAt` fixiert).
- Pipeline ausgeführt: `dry-run` → `migrate` → `scan-all` mit 0 BLOCKER/WARNING; Kandidat + Checksums aktuell unter `storage_candidate/v1`.
- Determinismus bereits validiert (identische Outputs bei gleichem `MIGRATE_RUN_ID`); Rollback-Drill via `MIGRATE_FAIL_AFTER_MODULE` bereinigt Temp-Root wie erwartet.
- Docs/Templates ergänzt: `CUTOVER_PLAYBOOK.md`, `STATION56_REHEARSAL_REPORT.md`.
- Qualität: `pnpm lint` ✅, `pnpm vitest run` ✅.

## Tests

- `node tools/migration/cli.js dry-run` ✅
- `node tools/migration/cli.js migrate` ✅
- `node tools/migration/cli.js scan-all` ✅
- `pnpm vitest run` ✅
- `pnpm lint` ✅

## Issues

- Mappings basieren auf Mock-IDs; bei echter Legacy-Datenquelle müssen sie ersetzt + Pipeline erneut ausgeführt werden.
- Bekannte Warnung beibehalten: Node-Hinweis zu fehlendem `"type": "module"` in package.json.
- Untracked Artefakte unverändert: `dist-station40.tar.gz`, `dogule1-alpha/`.

## Notizen

- Guardrail: Ausführung + Status-Log sind Pflicht vor Abschluss eines Stationslogs.
- Bei Eintreffen echter Daten: neue Mappings generieren, `migrate` + `scan-all` erneut laufen lassen und Hashes protokollieren.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -
