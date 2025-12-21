This document is the authoritative status log for Dogule1 (replaces dogule1_status.md).
Every station block is wrapped by a visual bracket line: `# - - - - - - - - - - - - - - - - - - - -` before and after.
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

# Station 62 — Logging, Rate Limits, Alerts (Step 2D — Rate Limit Primitive)

## Kontext

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

- Branch: `feature/station62-logging-rate-alerts`.
- Scope: runtime loader + validator for log/alert schema (no UI/storage changes); no new dependencies added; ajv absent, so minimal in-repo validator used.

## Ergebnis (kurz)

- Added `modules/shared/logging/schema.js` to load `tools/ops/log_event.schema.json` at runtime and validate events via a Station-62-aligned subset validator (required fields, enums, lengths/types, meta whitelist).
- Added `modules/shared/logging/schema.test.js` with happy-path and invalid-case coverage (required missing, enum mismatch, type mismatch, meta overage/disallowed key).

## Tests

- `npm run lint` — ✅ (worktrees/** excluded to avoid frozen Station 61 config noise).
- `npm test` — ✅ (vitest suites pass, including `modules/shared/logging/schema.test.js`).

## Notizen

- Minimal validator is a strict subset aligned to Station 62 until an in-repo JSON Schema validator (e.g., ajv) is available.
- No new dependencies added.

# - - - - - - - - - - - - - - - - - - - -

# Station 62 — Logging, Rate Limits, Alerts (Design Step 1)

## Kontext

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

# Station 1–17 — Foundations & Early Linking (Historisch)

## Kontext

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

# Station 58 — Storage Access Layer Architecture (E3)

## Kontext

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

# Station 59 — Authentication & Sessions MVP Implementation

## Kontext

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

# Station 57 — Authorization Matrix & Audit Plan (F2, F4)

## Kontext

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

# Station 18 — Status Quo Cleanup & Router/Layout/Build/Mock DB Konsolidierung

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 19 — Module Self-Test Preparation (Phase A)

## Kontext

- Ziel: Pflicht-Checkliste für Phase-A-Module etablieren.
- Artefakt: `PHASEA_SELFTEST_CHECKLIST.md` erstellt und im MASTER verankert.

## Ergebnis (kurz)

- Checkliste deckt Router/Layout/Shared Components/CRUD/Empty/Error/Accessibility/Integrity ab.
- MASTER verweist auf Checkliste als Voraussetzung für alle Phase-A-Stationen.

## Notizen

- Keine Codeänderungen an Modulen; Dokumentationsstation abgeschlossen.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 20 — Dashboard Phase A

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 24 — Trainer Single-Module Completion (Phase A)

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 25 — Finanzen Phase A (Listen/Detail/Filter – Skeleton)

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 27 — Finanzen Single-Module Completion (Phase A)

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 28 — Waren Single-Module Completion (Phase A)

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 29 — Connect Kunden ↔ Hunde

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 30 — Connect Kunden ↔ Kurse (Hunde-basiert)

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 31 — Connect Hunde ↔ Kurse

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 32 — Connect Kurse ↔ Trainer

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 32a — Build-Fix Trainer FK Export

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 33 — Connect Kurse ↔ Kalender

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 35 — Connect Trainer ↔ Finanzen (re-scoped)

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 35.1 — CI Lint Fix (Trainer ↔ Finanzen)

## Kontext

- Branch: `feature/station35-trainer-finanzen`
- Ziel: Lint-Fehler (unused helper) beheben.

## Ergebnis (kurz)

- Unbenutzten Helper `formatScheduleTimeRange` entfernt; Aufruf bleibt bei `formatTimeRange`.

## Tests

- `pnpm lint` ✅

## Notizen

- Rein technischer Cleanup, keine funktionalen Änderungen.

# - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - -

# Station 36 — Connect Trainer ↔ Kalender (Derivation-Only)

## Kontext

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

# Station 37 — Local Alpha Assembly Prep (Phase C)

## Kontext

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

# Station 38 — Local Alpha Test Script (Phase C)

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 39 — Alpha Hardening (Failure Inventory)

## Kontext

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

# Station 40 — NAS Build Preparation (Completed)

## Kontext

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

# Station 41 — NAS Deployment (Completed)

## Kontext

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

# Station 42 — NAS Smoke Test

## Kontext

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

# Station 50 — Roadmap Governance & Definitions of Ready

## Kontext

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

# Station 51 — Storage Baseline V2 Formalization

## Kontext

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

# Station 52 — Migration & Integrity Tooling Plan (Phase E2)

## Kontext

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

# Station 54 — Storage Adapters & Checksums (Plan, Phase E2b)

## Kontext

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

# Station 55 — Integrity Scanner & CI Integration (Phase E2c)

## Kontext

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

# Station 53–55 — Migration Tooling Execution (Dry-Run, Migrate, Scan)

## Kontext

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

# 53-55-Code — Migration Tooling Execution & Remediation (Guardrail)

## Kontext

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

# Station 56 — Migration Rehearsal & Cutover Prep (E2d)

## Kontext

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

# - - - - - - - - - - - - - - - - - - - -

# Station 61 — Legacy Data Capture

## Kontext

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

- Captured files (name | bytes | sha256):
```text
raw/.directory | 34 bytes | 1ea26f5c88c67a94ae3c512502c9150a1c8a198fc92219fba0d8f65ce18d98df
raw/Kursbestätigung.pdf | 316649 bytes | a508ece676238d8829cbb0e33d5d7d14447bd8a5efba41dc43bbaa2908dabebc
raw/dogtaps_00a_Export_Dateien/Fontanas DogWorld_Praxis_2011-08-10_15-16.xls | 10752 bytes | a009f2a1f439326e94f8c2a2ea9e213e869c513e40907ae0abd01af0ac86dfd8
raw/dogtaps_00a_Export_Dateien/Kundenliste_2017-01-23 21-47.xls | 108544 bytes | 13fc533aa0c4f32e85e46912665ed2577eb53cb4a094ccee7ee19bd02a12cc8c
raw/dogtaps_00a_Export_Dateien/Kundenliste_2017-01-31 22-45.xls | 185344 bytes | 94c00e1e6e45a1be938313b5734b1e081f2186235b52860d3dbbe5775c6d57ce
raw/dogtaps_00a_Export_Dateien/Natel 092.JPG | 104158 bytes | 94eda64b680b336e6d31c562960a39ec5e88f89619be122380737210adb15a1a
raw/dogtaps_00a_Export_Dateien/ReadMe.txt | 57 bytes | e6279f95fa71ec0be96ef69217f6e07410d799dc494f04e3197c4a075394974e
raw/dogtaps_00a_Export_Dateien/dogtaps_Kundenselektion_Email_2011-12-16_16-08.xls | 44544 bytes | 3c65f87cffcb4a8054e7e4a3cd351646868e2d4dbb3e721fe1f3bb0215067742
raw/dogtaps_00a_Export_Dateien/dogtaps_Kundenselektion_Email_2024-02-09_17-14.xls | 16384 bytes | b365ec1cfc3352303e4e19182a019d8867b16f280319ecf3dc27b738a8f26baa
raw/dogtaps_80_Datenbank_Save/ReadMe.txt | 264 bytes | 81fa9d0ef75769072f90803fcf0ab62c97b9c2b9b99e166fb05fd89df0753023
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-09_09-15.xlsx | 118362 bytes | 19cd4dc281d49208df75d3d91013e22e7203129a5ae308b723c952cd5496f8b7
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-10_09-51.xlsx | 118361 bytes | da97ac6b2618043e1773d5c62ca96feccd993f3a1c4443758aa2e0476deb88fa
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-11_07-53.xlsx | 118361 bytes | 631ce8d1080602f9760469d62c0b25f5bd7c6d2b43d29563f078864df10dfb97
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-12_08-08.xlsx | 118364 bytes | ea8d9984cf664ec60b1cb10871be68fc9fd2a55c535967aa17d82daae2b13e9e
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-13_07-30.xlsx | 118361 bytes | 866f92538e75b3f8328f038a185f0c7ad90aa365e858d6be4b89e15b66978ba1
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-14_08-23.xlsx | 118362 bytes | adca3da4bcc6cd532534a4ee71574f376097e80fb3d978d1a6affd2416b20751
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-15_07-42.xlsx | 118362 bytes | a5afbca029dfa9d286ab0f1afd509d1bc4c476f25ee736d5faa10ab921cad4f0
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-16_12-43.xlsx | 118360 bytes | 4cee3cc1ea419d967d231a2cb43945daa6a9c0305a911bbe1e54f67db70c518e
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-17_08-57.xlsx | 118427 bytes | ee04506f8104dee4caf4ea04b8e673d156b2b4ef2027fef5686e88a4de00a9ee
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-18_07-30.xlsx | 118426 bytes | 7aaf02525cb2bafad8179d3c7dc31e9733e1dd3095b0f59d5e61ea4496537f28
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-19_08-23.xlsx | 118426 bytes | 6cc0f56e02a2db900993e58aeeaa303097f39c2a4db304fc1ffc1569603b6b17
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-20_07-47.xlsx | 118426 bytes | 3c15fcf6891f990a38ad6fc2c795e16dc46c7d18c58ab190a86bc15fa815fe33
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-21_17-24.xlsx | 118426 bytes | 4f96534577bdbedde2fed2ecbeadeaf773dff78d418678a5c204975c592183c3
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-22_07-16.xlsx | 118426 bytes | 560e23965e9fcaaf4fec4259254d09d09a8840002125004e6a3ae279fd5a7c89
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-23_09-00.xlsx | 118426 bytes | 27efc29bdf6fa2a9aaccb32931fe012a069aeb9bc4f8b8178d09537a10dd9733
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-24_11-50.xlsx | 118426 bytes | 228d8e616d023a94b6241df417c05cb757fd8a3f615774b0ba598c62c4c56aa3
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-25_07-27.xlsx | 118427 bytes | 39c16c5bb383131888e889889a8a8ab70fb3ff3b56502fc9abc7fe53e2fc8e4c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-26_08-50.xlsx | 118426 bytes | fd88dd40fcd2bff3a4daf8635bfef262b183caae031e86e8f3c1a1acd3da1b33
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-27_07-38.xlsx | 118427 bytes | f06e0e3da343b57a726a75ffaed4ffd50d86b71990184e16cf69e06c76f96956
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-28_09-19.xlsx | 118426 bytes | c743d26b5cd04ebef7f21304c8b80ee98e372f0a4db93d92ef2a3ff097d3b24a
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-29_07-25.xlsx | 118426 bytes | bfff5ddeffce6dcef0d16126659089ab429f6cfed48bcf1bf74275c7655844af
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-11-30_12-54.xlsx | 118426 bytes | 27bd7e1fd4b5e84a02d96da9dbdcc81615bd29ac272ef8092c15340982988442
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-12-02_07-25.xlsx | 118426 bytes | b7b688ecfb9c168b8f1f5a04646a499a1f8120cc9a5917c144ad44fb4d920f38
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-12-03_07-58.xlsx | 118426 bytes | 0d31c73a35d3df7b37d2e7996b614c68ea2b448447f8fc418abc5b51f75e6c6d
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-12-04_07-26.xlsx | 118426 bytes | a162d25764bed9c4e2db447e1e77f48409152a809f9e5a3637024c5742e145be
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-12-05_09-20.xlsx | 118426 bytes | 4846031aed9aa89405bc8b8df3956e7dff36a852ba5e5061fff7781fa8bfb353
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-12-06_07-36.xlsx | 118427 bytes | 13165d6a35b34f66edc510570ae45f4ef0f1da084bf1b9d5062009b330db494f
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-12-07_09-16.xlsx | 118426 bytes | c5d84ed17739b92204720de6ba8e4efe737e7f84e483e7b0033450b1868b5be3
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-12-08_09-23.xlsx | 118426 bytes | ff9ecd26b8e621db5e5c21260186d4701e0c90a776b206de604b69acfc1e40b4
raw/dogtaps_80_Datenbank_Save/Save_Daten_Hunde_2025-12-09_07-26.xlsx | 118426 bytes | 51823261fcb98b446d55bad9c3642bacc5e68d209ad60edaa10b52946c06659f
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-09_09-15.xlsx | 196552 bytes | 83a372a420947d3f40a5282fa8c1f5e9e86e5eacb2d17428b092fc390cd8fdc8
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-10_09-51.xlsx | 196551 bytes | 38c918093ea7641d41e4558119d61c5aef46953a69831604e991146931ff0234
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-11_07-53.xlsx | 196546 bytes | af9531f7c42ba790ec1fbde908eaa8cbf48555970bd138441bcec426e05f063b
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-12_08-08.xlsx | 196547 bytes | 7693c796734a1aa4bb3fd294b63e148ecb976c14958366de42034a85b1288702
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-13_07-30.xlsx | 196546 bytes | d28d3cc422c24a4fff3991deb5cc1af7b1305e9b5bfd6c91303e7c2b3117ae40
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-14_08-23.xlsx | 196547 bytes | d9c97785092d62f358c1c4c63a0a7738b49de7d5e23787fc7d30f1141a76dcf2
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-15_07-42.xlsx | 196547 bytes | 86a1c7292b1302ed86af9c33ceca4bc7088dbaa43c0d43cd10eadd87350318de
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-16_12-43.xlsx | 196545 bytes | 1472a7b46f1471b2a75cab25cd24a5fe5d5ea0c7584df7897072459dad1f9fa4
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-17_08-57.xlsx | 196682 bytes | 4255d2d96594f55fd55ee2c09b3c2fe34e56a90d9f20861c5c1c1f2a2f971667
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-18_07-30.xlsx | 196681 bytes | 655ab9898c2afbeaf12829aa457cb8dd476b11692ebcd90a827ecb830583fabd
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-19_08-23.xlsx | 196681 bytes | 77a731bc6c6b3dc020484b200c76a3961d4601af69d3df1c81e784c4e8013015
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-20_07-47.xlsx | 196681 bytes | c7f75bfa02d34ba191912848f9f70e6bc9b63d8d15187df4fbc21d6fff153437
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-21_17-24.xlsx | 196681 bytes | a653e3df685fe9ba4c5c7a51d2938c718678208e0af03139992166d58634fca9
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-22_07-16.xlsx | 196681 bytes | b29b4973786d6b7fd57d285da82a6bf5acc0f87a8d7893a5f9a24db884d06093
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-23_09-00.xlsx | 196681 bytes | 42e8bc39b7824f84afdefca0d8eeccfb32858ce101ec6d13c4fa95facd6d9b3f
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-24_11-50.xlsx | 196681 bytes | 6233b41403b65458f031fbc5682cfc79e6b15092dcb0fb75eaac1850dcd29a69
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-25_07-27.xlsx | 196684 bytes | 8bd98c01621d81c6a21ea4fa7cf9e0098365d0d7a3f8bb5026baed0d0dab591c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-26_08-50.xlsx | 196681 bytes | a33a4df7b80cfec4c2986e57e684553bd0951b18e29b0659d999ba11cee6aed6
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-27_07-38.xlsx | 196682 bytes | 4de7fd251f5970907724a1492f1e4d55bfe3546126142379f413ece95e839b8c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-28_09-19.xlsx | 196681 bytes | 3c5f68a930479523f1fee2b39d10ddb169cea1bb5aac08332265a05d83c4c492
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-29_07-25.xlsx | 196681 bytes | 4005833a70d53ccc53010040b35eff8728b7af0e7459ab2bf4124567c885d8b5
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-11-30_12-54.xlsx | 196681 bytes | 26c08d127b4056f0c995ce8016337320cbcfcddf144df30c3a0d5a995663042f
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-12-02_07-25.xlsx | 196681 bytes | acadd4be0d77dd864eb54a5637b857ad6c6a0122d44729e9d4184505c8abf216
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-12-03_07-58.xlsx | 196681 bytes | 45de19c9a838c9b5956d343416802137c2ebc81c681ea1913c8a5343f6e968b0
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-12-04_07-26.xlsx | 196681 bytes | 6f716cd75b1e61333a80476ba396d6833dd58cc17ede693b39cdedfcca5ee8e2
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-12-05_09-20.xlsx | 196681 bytes | db6c835465142ca54a62eec85661b8448bd2caf1b6ce50459c69db306f986e4e
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-12-06_07-36.xlsx | 196684 bytes | 2657e5da4ab3e9282733605ca5e10740facd4c89fde05c0d22ca4cbd27dd46ce
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-12-07_09-16.xlsx | 196684 bytes | 6d4606cf049f9442c30ba87dbab6c441d5da700387645791e34d77be837132ba
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-12-08_09-23.xlsx | 196681 bytes | 2bd0cf4c849f0861c4e26ed1dc47ec4fd412601197b654595eb98a2e68f9c187
raw/dogtaps_80_Datenbank_Save/Save_Daten_Kunden_2025-12-09_07-26.xlsx | 196681 bytes | cd869b0259a0b04c0dff6cbc190074df0a6dcf7a0184ba3d036cae9e7a99e71e
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-09_09-15.xlsx | 9066 bytes | 21163f7b57aba309734879722a8daeb1567c0b6b5d27d9e28c2427d6a1089a89
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-10_09-51.xlsx | 9065 bytes | b0d316e22b7cc87cb463598a64284e130a28a7beb288a39511ae549e9fed07a0
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-11_07-53.xlsx | 9065 bytes | aa4f44fb87f16baa2052672d3f910d06bf3094ed3e1a004885a1fd104a231dba
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-12_08-08.xlsx | 9065 bytes | 177070d4c067b18b04679873d1798ec12012e2567590f040fddfc2950dd50ba1
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-13_07-30.xlsx | 9068 bytes | 07955afc5160cc63d0cdc8a527e45670bae3c39bc49e92f25318c8d07a493cba
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-14_08-23.xlsx | 9068 bytes | d4beab1b3addf220cfd43338178a84a50f597dc6f2667216e1284e9753dc006c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-15_07-42.xlsx | 9066 bytes | 91491daca1101a7d95236e174a892cb06f187e6c8aae64b400267995a0cf38eb
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-16_12-43.xlsx | 9064 bytes | e6f62461b6e8e1b144abbe2ac9a717f6427bbf08fdfd47400d4c4a851460886d
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-17_08-57.xlsx | 9065 bytes | 7b272a093a020bee65149b16ed461d346e55406002a43612dbe5044a765ec6c7
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-18_07-30.xlsx | 9064 bytes | 92d6681d770f38e3be00f1fdd820db17effa4b96e623c366e3943cbaa65fd718
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-19_08-23.xlsx | 9064 bytes | 7efeedfbd3e6d36bef5f17727faa2d9c25bed4729d5ce4bc95281cbda603c257
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-20_07-47.xlsx | 9064 bytes | e21d708ff1dc668930440910f3e90c8bd6620ef894482117987a0467dbbb96f5
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-21_17-24.xlsx | 9064 bytes | 4dcb21e348330c5fb47997bd4ed66ed9623dd91700ac7f9ef9f15a0e582fc609
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-22_07-16.xlsx | 9064 bytes | 4370341637254d51615d8ded545e2877d5079dea5e6ef06e9820431f16ae0e35
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-23_09-00.xlsx | 9064 bytes | a50f4d8ec3a085f9b6a6303665df3ae658e76bdd2a4107953e5af21c0e346a09
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-24_11-50.xlsx | 9064 bytes | fa964ccb8f6d05e811508c377bb5b87ce263f115e1be6311a5a25f22ca6ada2c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-25_07-27.xlsx | 9065 bytes | 74bdb347aa7c2a33e61cd1509a6ca9e54b5de35d82c02c051c0953a2ba45b4df
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-26_08-50.xlsx | 9064 bytes | f44f9ba9c4aa13be61ce9f1c626ec4e07808f39afba1edc3aab748e96406b33c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-27_07-38.xlsx | 9065 bytes | 6f2f828ec3b3c5d72cee4120c4c63df0ded8dfbdf4efc947b3c28b010ae347b8
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-28_09-19.xlsx | 9064 bytes | 6408cde29bb4eaba8d57fd54d109ad30165949a9eb421a5ef08998f005b993d7
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-29_07-25.xlsx | 9064 bytes | 71984b52e5e4c59ab9ce4ee618f06831cf6dad82fe3280bd3edfacc5b5a26c58
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-11-30_12-54.xlsx | 9064 bytes | 6ef30b86fcfe84c3dfd9acfaa239baca942695216e29a43cf595e38b17a2e2cc
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-12-02_07-25.xlsx | 9064 bytes | bce4ad5b49ce9cbf6ad1c50933c564b9fd444e772a164edaea6181ae8e5952ea
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-12-03_07-58.xlsx | 9064 bytes | 3b5b66766f34885934006980c425f1528f52d750214f170c5eab1db381e58a48
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-12-04_07-26.xlsx | 9064 bytes | a144ad057bffcbde5bc4dfc6c8ba68b63dfcf29fb265fc5e010a2f5bbf9c27cd
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-12-05_09-20.xlsx | 9064 bytes | 6ca4f1a943af57a1694af0b6a76cc32beaaaa163bb6677f2937fa521608ce083
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-12-06_07-36.xlsx | 9065 bytes | be050d244c964064d05ba4f47ae883374bc0574827f8589079850092391de0fe
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-12-07_09-16.xlsx | 9064 bytes | 4464d4c8b7e8e79d3c674ec83837fb1800ff27e2f410753a89145e49dd1ac161
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-12-08_09-23.xlsx | 9064 bytes | aca265f63cc111f05dc218454a6c3b7c2a99223ae27f7a64bfcaf5edca3ca72f
raw/dogtaps_80_Datenbank_Save/Save_Daten_Pension_2025-12-09_07-26.xlsx | 9064 bytes | b40e26efaf6b4d7ea2d32965c4be2a9848e74c3a9c61efcae652d89ea1dfa66a
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-09_09-15.xlsx | 10383 bytes | 4d6714e0255062e2906aa6da6c2618eb4b15be2cbc03094d0bac80d5f63773cf
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-10_09-51.xlsx | 10382 bytes | d0b39d2c2122f35d324a36b9513cfe4a7a8e6085cce01c0a32438e985856f611
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-11_07-53.xlsx | 10382 bytes | 6cc45986b96d40babd0b37e2914281e498fbdabd62224ac86705cf10ad5103a2
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-12_08-08.xlsx | 10382 bytes | cedace3bb3edff9af5cb3e74b4149816a6e42da0fcfacc8e89abca848c081f6d
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-13_07-30.xlsx | 10382 bytes | 60e913e432bb35f1a5a76c2a0d6e129c481b0ed299b88849c1051181dac5911c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-14_08-23.xlsx | 10383 bytes | 13a41c01dd7719422256c27ab85c25337020bab925079042f8e0984ac641ffa3
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-15_07-42.xlsx | 10383 bytes | 72af0757e16a8add4fa07a4fee2c516b94346cd47b82bb41e3816f7e363c91b4
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-16_12-43.xlsx | 10381 bytes | 4f3a38ebcde34782f5e58e0f16440b079a17f21240d5a5358b40ad9072142989
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-17_08-57.xlsx | 10534 bytes | a3e087659c9ed5b56b2124dc9da8a7146432a915006a6cc9ba09254cb6fbe51c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-18_07-30.xlsx | 10533 bytes | a739dfe215baa395ace2ae1b4cea12ca2b59dc6801d223b06f5cc7dea126ca6b
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-19_08-23.xlsx | 10533 bytes | d75086d31f05ebe2736f408f2a8f1a802764496992bd1a647a012fd8a20033fa
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-20_07-47.xlsx | 10533 bytes | 8af3a2972d8be9fdff08fbff6bfcb73548ce5c508bf56f9ba49866c65a64bb5a
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-21_17-24.xlsx | 10533 bytes | c45eb2c47c84b5131cd56ec98e225e72d58d7010de549363d2f2dd079e494099
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-22_07-16.xlsx | 10533 bytes | 1822b93177c56b40edb6fb8335e64b81a93bcd337577654cb0131489f7792a64
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-23_09-00.xlsx | 10533 bytes | 10908fb1b4de9c2e4d8a6281b0c35b02b8748a9a549d5781079b883b810806aa
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-24_11-50.xlsx | 10533 bytes | 79f2d8e736c63e33d01255cf438229b4bc979edf40a677759b5c0a4d15d5aa7a
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-25_07-27.xlsx | 10534 bytes | f5b4beb3ff22c37b9daa4b47dc1a4a69b45f5819ac33b2869562fbae4963b477
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-26_08-50.xlsx | 10533 bytes | 4a67c821a54c2dc93185317a851848b1689009b9855e194627af3e700801d686
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-27_07-38.xlsx | 10534 bytes | 0b9cae73569074d0619b62ba97eb4f5726a42571ec82f7511af8d5d1450232e0
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-28_09-19.xlsx | 10533 bytes | 5bd47174694ee409b2f93cf78cb5178aa73e5b299d97eab3572ed9f1bbfe394c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-29_07-25.xlsx | 10533 bytes | 31182ea0eea083dbac765c2a5f9d8572708a70bf50edb1b01cc8035611ea00ca
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-11-30_12-54.xlsx | 10533 bytes | 63ac65ab9b480d288a07105ff4e5bc36d238f7897aa28aab3906c0128940a9be
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-12-02_07-25.xlsx | 10533 bytes | b2a7bbd44ba92e283ccd02ce5392aa81f0df272a66f256b7a6983c9edf48f348
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-12-03_07-58.xlsx | 10533 bytes | 73dc41c7cb6252020e694f59b7af867ff97a3f3fb3e2bfc081c8f455d494101d
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-12-04_07-26.xlsx | 10533 bytes | b952d876087df75a954ae14b7fc07465a2f504c917cfb37244a077dc9149283a
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-12-05_09-20.xlsx | 10533 bytes | cbb5c2a03d04bd861f9ab32d3b94e297ae79ec0e6837ad1ba7c2c0d4ba2a5353
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-12-06_07-36.xlsx | 10534 bytes | 44ba58540bf075e53d785a2cb092b92585a872e772407a98a77d5c8fd720da4f
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-12-07_09-16.xlsx | 10533 bytes | cb79d3519b9a9cf3e92b48580b5963baf916c3fdd959ef40236c56e9f805bbe0
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-12-08_09-23.xlsx | 10533 bytes | 32669e9f0589e917543bc8b86474033237cdff32c448b31538cfaf640abfe9d2
raw/dogtaps_80_Datenbank_Save/Save_Daten_Rechnungen_2025-12-09_07-26.xlsx | 10533 bytes | 18ade7acf979369b0cdeabf54b0a5bc352841b1dcf835b308d5ee205a24ffb7f
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-09_09-15.xlsx | 89505 bytes | 78d4e12cbe6e27ca7bd4de29796a477fb8a13f9bbdbe1a570463b6afbd1a60e0
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-10_09-51.xlsx | 89504 bytes | 62aec9fb4716031a8a693f1d81f467c613389a458e2e9c6ac85216f6e502a90d
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-11_07-53.xlsx | 89504 bytes | 29c7536e3f32574ac8849683ac021de5614708c89789f0b88f3f367ea6b487ef
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-12_08-08.xlsx | 89504 bytes | e40c099dd96b658910c39d49bc6ba47a15722808f60e4232bb53e1803bb096ff
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-13_07-30.xlsx | 89504 bytes | f9073423c91146a970221a9a8a4ecfc5dcace83d6d67b6e3155cba27a7507180
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-14_08-23.xlsx | 89505 bytes | a9daa6a5d972bfd06b152b72bd22e9d9e8af323cbf67054b5bb9a7fb7a865f49
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-15_07-42.xlsx | 89505 bytes | 74e2f266977b5efdf1f81e3b7af44fe6cf41eada2b4b8c5d9b3b1bc8adb6a7cb
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-16_12-43.xlsx | 89503 bytes | 73d1b5a07e5b358525e98cd39e4e8fb84ab83676b17f58839359720c1aa6156c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-17_08-57.xlsx | 89574 bytes | 8239d1faad566713d134abf3efd4889e70695a33ad5f6c23e4eb4de5c58ea9ab
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-18_07-30.xlsx | 89573 bytes | cc348f8c9151e5e6e1c7194e7fa8d544bc4bde01b5ab8aae483c45e21e0af643
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-19_08-23.xlsx | 89573 bytes | dd62beb1e1296a350bd6f0ecde52bc0cb9e34fd672b298fe35f05838c7a04784
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-20_07-47.xlsx | 89573 bytes | b0609ba3d32ddfeb870e686851b884312d6ac771bd360c91b9c0d9462e63d77e
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-21_17-24.xlsx | 89573 bytes | 49f69238e94816a59245836a20e36d33ed86caf303e44bb3941294238932ee0d
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-22_07-16.xlsx | 89573 bytes | 7b61fe75cedc89c218c09201e9ccd3321d5a35278012e85fb64c82a2b720f59d
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-23_09-00.xlsx | 89573 bytes | 979110c0810dcd17f1dfbf67c9d54660953426778540d5d720cab7008e20c497
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-24_11-50.xlsx | 89573 bytes | 1c0f0a90921fa86d270f208d619e4da3180af4172edb562edc76adb10101a8e0
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-25_07-27.xlsx | 89574 bytes | 18fc5aa6babb41638a540ffe0eb405cca6ac8c05a7e1967ad09be3a5ac6733d3
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-26_08-50.xlsx | 89573 bytes | f6c33e466afd126de11b214807ee6b193ccc753fe81cba7179586b3570839991
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-27_07-38.xlsx | 89574 bytes | 4bce4bf6f2d9e87bb0f93a8caa38e4efc8ff49d27a9435342c5dee0cf5e56430
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-28_09-19.xlsx | 89573 bytes | bf74b4ccee0c2b826fae19a2b91d43fc9ce6ee681d5a12bb0ad0d707eac47f79
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-29_07-25.xlsx | 89573 bytes | e31821007c695a515dd4d5149147837ca047f64916ee2b1ae207048d0f0ba452
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-11-30_12-54.xlsx | 89573 bytes | bf5a7a28319bff621a3df4e03a69529aaf1672177fa30f0a76c3ddfba7eb4efe
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-12-02_07-25.xlsx | 89573 bytes | e578786b4616be0f7fa981716d786c9b2ea99cbc0c905756a91a1837145f172c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-12-03_07-58.xlsx | 89573 bytes | c77473a9510a99af476fb3fa96860b3b9f0368d52136a24774aced8171b6ee83
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-12-04_07-26.xlsx | 89573 bytes | 0a43d74ba29344823db2535c4e7844dd18b0e85b64a9d11066a44a0236070105
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-12-05_09-20.xlsx | 89573 bytes | f0ad92ac04f76e7944c3c2591ce85deb19e1f63e90db320371c00c8b0de80ffc
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-12-06_07-36.xlsx | 89574 bytes | fc7ba588338f42b956130d883452a039d4b03b81a7a2bbea442728a73bc0b656
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-12-07_09-16.xlsx | 89573 bytes | 6b59aec96021cd02074d7b1598b09b8ea15b64de30723070ef7c9e0264deaaf9
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-12-08_09-23.xlsx | 89573 bytes | 01df7d3c13fb6cdb0cf1133a8853b013318b31fdbd920ba4ba4c041d82e1199c
raw/dogtaps_80_Datenbank_Save/Save_Daten_Seminare_2025-12-09_07-26.xlsx | 89573 bytes | 6cb50979ba4968df6f3b3978eb8a90dd34973dd2e7052a8b999614b13a995ce4
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-09-18_07-30.accdr | 21401600 bytes | 16cba42823d65b420dfd266f7696d8b61a3a0d9a8b626275458aee530d492950
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-10-18_08-08.accdr | 21401600 bytes | 89349cc7669f6514f03127e5ba3ecba1fc646c8b0b50e53e994e0e6d54f1e43d
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-10-27_15-53.accdr | 21401600 bytes | 223049552677a1cd807a144f8d44891c3efeeb3a2d583b1b546e3c8a75d14474
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-10-28_07-34.accdr | 21401600 bytes | ad34157b0b859c9104b5735038fe5e85882cfae54365976242452f60484ddf72
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-10-29_10-20.accdr | 21401600 bytes | 303386948d8b9592c5643fb9a916f47c666b93644209f494f950f6733dbfdc99
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-10-30_07-47.accdr | 21401600 bytes | c32b59b53cecb7e2e0ad20513f55a52917c237ba5662e67a295ba7a1f717ea94
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-10-31_08-21.accdr | 21401600 bytes | 109af6be513dd314ed90454af2755861d8d4a24321cf56e2169c76e8bd1f029e
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-01_10-12.accdr | 21401600 bytes | c98c50fd064546b99c551a4e326392b244e3ab561a901651008305be5509ba5c
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-03_08-45.accdr | 21401600 bytes | 851d9075f33a13d872936713e8c0ec311a9e7ce74a75492aa532463ee06f53e5
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-04_07-32.accdr | 21401600 bytes | 0bb1cb146629bcb73fd9e83a9a01ca3f6a05ac5eeeead56783a86c57bc4e8daf
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-05_07-52.accdr | 21401600 bytes | 12904b405dd323be05e514c6bf92edf9deaf6485f57e23250a487bc22e2ac218
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-06_08-38.accdr | 21401600 bytes | 1029dfc5e91b5619255100f8f8b6def2cc303f75f51a298940509eeb04722357
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-07_08-24.accdr | 21401600 bytes | 84c3980d19fc56f9883c7867b14d8c8ad6da169c5094a3d9ee1feea85afeeaf7
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-08_10-34.accdr | 21401600 bytes | 73ab4950b176a25a75a9dd6d5f66e68da8fff8666b74665c9a970215b13c69bb
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-09_09-15.accdr | 21401600 bytes | 998cf18ed34f0d1a66e77cbc1ceb249f376e13bedb927d950151f1c2ee74cdf8
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-10_09-51.accdr | 21401600 bytes | 78399be58f2f97f13ebff3c7d3590e6c7e6049506827794d888ff96cbee48f40
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-11_07-53.accdr | 21401600 bytes | e8f8a18bc9beba6ae18ca4239d628678470cf2ff55b9b98ada486af5afab2f16
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-12_08-08.accdr | 21401600 bytes | 92a585a6dda9c6f6cfb5c20565a307e5f9b36f4cdf4c2ea7b55f54102f8d9956
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-13_07-30.accdr | 21401600 bytes | b741567a31fc35f54dfa731ecec3e7c625dcf75656bc406e45bc3153297f06a7
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-14_08-23.accdr | 21401600 bytes | 108046cab4e7a43ee9fecceb3d9fcdac1a41e9b019ba2d43487b82e2fe34c67f
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-15_07-42.accdr | 21401600 bytes | 01a1c1212d2acee56c3eda20b26a9a1f1a8a2aae1c1427305bdfc63a6b5f594e
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-16_12-43.accdr | 21401600 bytes | 51455a11b8a8dd4adbee3318fa6c1135cce573f966bf374408cf5655ce173a21
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-17_08-57.accdr | 21401600 bytes | 7a2fa026d9d43fbdb89c0b520449448b859c05cf28c983aa76087427f0a834a1
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-18_07-30.accdr | 21401600 bytes | db5e156a392d22436824e7f9734efd04e680e46e07100c4d174ea869fb07731c
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-19_08-23.accdr | 21401600 bytes | 7a141e833f7ffc7e389e891794475dfd9b1e03df721eefb223442f89c39c7934
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-20_07-47.accdr | 21401600 bytes | f7f4cda131839bb2427193ee1301f8bc1c95ae9b33b1e09d44d9f6275204ea43
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-21_17-24.accdr | 21401600 bytes | 2c019588e911cda5cae2fe24f5ba9bdadc962ce642511b84589ed17af8c0dd1b
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-22_07-16.accdr | 21401600 bytes | b4695f74e65ab131bf0e040be4c4424aab43fc17a8f6d4887ef67f8f89453e3f
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-23_09-00.accdr | 21401600 bytes | 21615e863930883c2785c43c18de38218b02bfcfaaa0248db77a492721d835d4
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-24_11-50.accdr | 21401600 bytes | 25baae04315a66515abe22cf65c83170df3e8cec84a985578e6c943e04218ebf
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-25_07-27.accdr | 21401600 bytes | 15a327579fffe4e8d94d6766e10341e4f15eaae2a2750824f6c96bcefa33ac09
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-26_08-50.accdr | 21401600 bytes | d810b81a50bd67ac24ea6ac481b42929979f491780885aec7658f188b3d4a1ca
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-27_07-38.accdr | 21401600 bytes | 7c489bc00ee7ba50b3cc767cb21731cd3c3a16b86023ca036517d0b6f0ac955c
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-28_09-19.accdr | 21401600 bytes | d58ea7b4d0c8e35fb9dc1f3308a33afe84b7fb0040d54bb15b8d06859f5118d1
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-29_07-25.accdr | 21401600 bytes | f014667e7d07a9dc89723fe180dd872085fdf1a15e63fae3cb5e29e2cc78de06
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-11-30_12-54.accdr | 21401600 bytes | 27dc33d4c997dbef658d047bc8eaf5f94a33d557a0ae5934ee5314c8acfff456
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-12-02_07-25.accdr | 21401600 bytes | 9469f40ee7cba139af3c04212e673deecc592ed0a46eca0f25af703dfdf4188e
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-12-03_07-58.accdr | 21401600 bytes | e74092668f5044b8e9c26fd5e775c9e650044220ce0e9c7797fc3cb47ad1edfa
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-12-04_07-26.accdr | 21401600 bytes | a918e2204a400cfce7c7293a19fa03d5a73f9bece8f9fa3359739a4d5b4a3b2b
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-12-05_09-20.accdr | 21401600 bytes | 1ede028dce014280fbb329e2db9beb40dc171561dc8ca2a57bf5fd598753da1a
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-12-06_07-36.accdr | 21401600 bytes | 92daa32d8b18b75f3823e2805adc5ccdc4813c6a1b95d7bbc0324746f90dcb4e
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-12-07_09-16.accdr | 21401600 bytes | 28800003d0d4928bf7e70b6e9881e9fbadc9e2f1f2b5fe18881486a603ad7a08
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-12-08_09-23.accdr | 21401600 bytes | f252462e95d8cb9aeeb2724da0bdca6ad322085771293224f0551b39d764649d
raw/dogtaps_80_Datenbank_Save/Save_dogtaps_Datenbank_2025-12-09_07-26.accdr | 21401600 bytes | c6b4825c8f0a1039415cb2b7478f2d49270c4233629dc4efab53c8e9a66d6f35
raw/dogtaps_90_Datenbank/ReadMe.txt | 75 bytes | 7beb4806fdc787fc6c84e7809632339f716db30d056a066455fdfa0e5fbe6b7a
raw/dogtaps_90_Datenbank/Save_dogtaps_Datenbank_2014-06-19_15-14.accdr | 10858496 bytes | 27a17076eaad99cecb239e954615a70da27685e763eba1a012b887652c65d504
raw/dogtaps_90_Datenbank/delete Christen dogtaps_Datenbank.accdr | 10063872 bytes | 7d53973471fb130d0e45dbb3d451c7cd81b6f892e94bcd80dc78e8d43772d149
raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.accdr | 11837440 bytes | 9d7cbd66573aec5f5320c9f341ac337b387da8aeaf47c2e675a10cd1151a9a2d
raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.accdr.ORG | 10522624 bytes | 1eb29bcc90c967b8da5903ad7ae4a78130f29a884d735bbdc6f564e8fc60f42e
raw/dogtaps_90_Datenbank/delete dogtaps_Datenbank.bak | 10657792 bytes | 799dda6f293dadf7e94695ed8026348de115105d2baba60fff19baf64492a9e4
raw/dogtaps_90_Datenbank/dogtaps_Datenbank.accdr | 21401600 bytes | ac7f42faec503cf72c20b526aec748353eaea1492f1a8c5c7503b20575687de1
raw/dogtaps_90_Datenbank/dogtaps_Datenbank.laccdb | 128 bytes | c667e8f314fae4f9635cc81bfaed3d8827a4b5ab39ef103ac900ae9bfcbc6756
raw/dogtaps_90_Datenbank/dogtaps_Signet_Anwendung.ico | 4122 bytes | 9a83ded80465c760cd286f8571f12ca01c44cd0e1469ae566104458fc3597143
```
- Repo-doc gap: `agents.md` remains missing; Station 61 directory is input-only/immutable after commit.

# - - - - - - - - - - - - - - - - - - - -
