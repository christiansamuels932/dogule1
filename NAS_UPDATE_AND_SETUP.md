# NAS Update + Setup (84U)

Purpose: update Dogule1 locally and propagate changes to the NAS pilot so they are visible at the remote URL.

Rule: `/home/ran/codex/dogule1/.NAS-Distro` must always be an exact mirror of the NAS root `/volume1/dogule1nasfolder`.
All changes are made inside `/home/ran/codex/dogule1/.NAS-Distro` first, then you copy the specific subfolder(s)
(`app/`, `api/`, `config/`, `logs/`, or root files like `README.md` and `update.sh`) to the NAS as instructed.

Non-negotiable: do not hand-edit `app/` or `api/` on the NAS. If something needs to change, change it in
`/home/ran/codex/dogule1/.NAS-Distro` and then upload the relevant subfolder(s). This avoids “works locally but not on NAS”
drift and prevents repeated breakages.

## Assumptions

- Local repo: `/home/ran/codex/dogule1`
- Local MariaDB (ran) password: `Ace1Ab215932.`
- Local NAS deploy payload: `/home/ran/codex/dogule1/.NAS-Distro`
- NAS root: `/volume1/dogule1nasfolder`
- NAS API: `http://127.0.0.1:5177`
- Remote UI: `https://4c31.synology.me:8443/#/auth`
- Password file: `/volume1/dogule1nasfolder/config/dogule1.passwords` (format `username:password`).
- Required env: `DOGULE1_PASSWORD_FILE=/volume1/dogule1nasfolder/config/dogule1.passwords`.
- `.pw.txt` is deprecated and must not be used.

## Minimal workflow (current)

1. Make local changes in `/home/ran/codex/dogule1`.
2. Update `.NAS-Distro`:
   - `pnpm build`
   - sync `dist/` → `.NAS-Distro/app/`
   - sync `modules/` → `.NAS-Distro/api/modules/`
   - sync `tools/server/` → `.NAS-Distro/api/tools/server/`
   - sync `tools/ops/` → `.NAS-Distro/api/tools/ops/`
   - sync `tools/mariadb/` → `.NAS-Distro/api/tools/mariadb/`
   - copy `package.json` + `pnpm-lock.yaml` → `.NAS-Distro/api/`
3. Copy only the changed subfolder(s) from `.NAS-Distro` to `/volume1/dogule1nasfolder`:
   - UI changes: copy `app/`
   - API changes: copy `api/`
   - Env changes: copy `config/`
4. Ensure `config/dogule1.passwords` exists on NAS (not tracked in git) and matches the usernames from `/api/auth/options`.
5. Ensure `DOGULE1_PASSWORD_FILE` is present in `config/dogule1.env`.

## Restart + verify

- Restart API (or reboot NAS if port 5177 is still in use).
- Preferred restart on NAS:
  - `pkill -f "api/tools/server/apiServer.js" && /volume1/dogule1nasfolder/api/start_if_needed.sh`
- Verify remote UI: `https://4c31.synology.me:8443/#/auth`.
- Health check: `curl -i http://127.0.0.1:5177/healthz` (expect `{"status":"ok"}`).
- Auth options: `curl -i http://127.0.0.1:5177/api/auth/options` (expect 200 + users).
- Login test (example):
  `curl -s -X POST http://127.0.0.1:5177/api/auth/login -H "Content-Type: application/json" -d '{"username":"Developer","password":"<PASSWORD>"}'`

## Passwords (NAS)

- File path: `/volume1/dogule1nasfolder/config/dogule1.passwords`
- Format: `username:password` per line, no extra labels.
- Usernames must match `/api/auth/options` exactly (case-sensitive).

## Autostart (NAS)

- Script: `/volume1/dogule1nasfolder/api/start_if_needed.sh` (source of truth is `.NAS-Distro/api/start_if_needed.sh`).
- DSM Task Scheduler should run that script on boot.
- The autostart script runs `api/tools/mariadb/nas-ensure-schema.sh` before starting the API (creates missing tables/columns and applies migrations).
- `start_if_needed.sh` includes a lock to avoid repeated parallel starts (previously caused `EADDRINUSE :5177` spam in logs).
- `start_if_needed.sh` intentionally does not depend on `pgrep` (uses `ps` + `grep`), because some NAS shells do not provide `pgrep`.
- After copying `api/`, ensure the script is executable (only needed if permissions were lost during file copy):
  - `chmod +x /volume1/dogule1nasfolder/api/start_if_needed.sh`

## MariaDB schema drift (NAS)

Symptom examples:

- `400 rapporte_create_failed` (often: missing `rapporte_drafts` table)
- `500 storage_error` when saving Kurs (often: schema mismatch / missing column)

Fix:

- Always deploy schema changes together with API changes:
  - Copy `.NAS-Distro/api/` to NAS (this includes `api/tools/mariadb/`).
- Run schema ensure manually after deploy (safe to run repeatedly):
  - `/bin/sh /volume1/dogule1nasfolder/api/tools/mariadb/nas-ensure-schema.sh`
- Check schema log on NAS:
  - `tail -n 50 /volume1/dogule1nasfolder/logs/schema.log`

Notes:

- `nas-ensure-schema.sh` will force-create `rapporte_drafts` if it is missing (and will retry without FK if the NAS collation/FK setup rejects the constraint).
- `nas-ensure-schema.sh` will force-create `anmeldung_drafts` if it is missing (required for Dashboard drafts + Anmeldung module).
- Do not run ad-hoc `ALTER TABLE` on the NAS unless you also commit the equivalent change into `tools/mariadb/schema.sql` and/or a migration in `tools/mariadb/migrations/`, then redeploy via `.NAS-Distro`.
