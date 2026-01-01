# NAS Staging Setup — Station 76.5 (MariaDB-backed App)

Purpose

- Provide a 1:1 reproducible runbook for deploying the MariaDB-backed Dogule1 app to NAS staging.
- Record every decision, command, and environment detail needed to repeat the setup.

Source References

- `BATTLEPLAN_STATIONS_71_PLUS.md` (Station 76.5 scope/exit criteria).
- `archived-mds/archived-NAS_ALPHA_DEPLOY.md` (historical NAS deployment pattern).

Current State (before Station 76.5)

- Workspace commit: `169e6de43179fe696c7b7780c4f593d576497862`
- Current branch: `feature/station76.5-nas-deployment`

NAS Profile (from battleplan)

- Device: Synology DS218play
- Server name: SAN
- DSM: 7.3.2-86009
- QuickConnect ID: A4c31
- CPU: Realtek RTD1296 (4 cores @ 1.4 GHz)
- RAM: 1 GB

Access Scope (required)

- Scope: public (remote access required)
- Access URL: `https://4c31.synology.me/dogule1-staging/`
- Auth/Firewall: TBD

Staging Target (required)

- NAS target path: `/volume1/web/dogule1-staging/` (created)
- Web path: TBD (e.g., `http://<nas-host>/dogule1-staging/`)

Permissions (observed)

- `http`: Allow Read (also shown as Read & Write)
- `admin`: Allow Read & Write
- `me`: Allow Read & Write
- `administrators`: Allow Read & Write
- `users`: Allow Read & Write
- `guest`: Deny Full Control

MariaDB / API Backend (required)

- API server host: TBD (NAS-local vs separate host)
- API base used by app: `/api` by default; override via `window.__DOGULE_API_BASE__`
- MariaDB socket/user/db: socket `/run/mysqld/mysqld10.sock`, port `3306`, db `dogule1`, user `dogule1_app`
- API process manager/service: TBD (systemd, pm2, DSM task, or manual)
- CORS: allow `https://4c31.synology.me` (set `DOGULE1_CORS_ORIGINS`).

Rollback / Disable Plan (required)

Strategy: remove staging web files and stop API process (reverse proxy can remain).

Steps:

1. Stop API server:
   - Find PID: `ps -eo pid,command | grep "tools/server/apiServer.js" | grep -v grep`
   - Kill: `kill <PID>`
2. Remove staging web output:
   - `rm -rf /volume1/web/dogule1-staging/*`
3. (Optional) Disable reverse proxy:
   - DSM → Control Panel → Login Portal → Reverse Proxy → disable `dogule1-api`.
4. (Optional) Close port 8443 in NAS firewall + router if no longer needed.

Autostart — Persistent API Service (DSM Task Scheduler)

- Script: `/volume1/dogule1nasfolder/dogule1/tools/ops/nas-api-server.sh`
- Ensure executable: `chmod +x /volume1/dogule1nasfolder/dogule1/tools/ops/nas-api-server.sh`
- DSM → Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script.
  - User: `root` (recommended for consistent PATH) or `me` if PATH is set.
  - Event: Boot-up.
  - Run command: `/bin/sh /volume1/dogule1nasfolder/dogule1/tools/ops/nas-api-server.sh`
- Verify after reboot:
  - `curl http://127.0.0.1:5177/api/kunden` → 200
  - `curl https://4c31.synology.me:8443/api/kunden` → 200
  - `tail -n 50 /volume1/dogule1nasfolder/dogule1/api.log`

Autostart — MariaDB Package

- DSM Package Center → MariaDB 10 → ensure "Run at startup" is enabled.
- Socket check: `/run/mysqld/mysqld10.sock` exists after boot.

---

Execution Steps

1. Create branch
   - Command: `git checkout -b feature/station76.5-nas-deployment`
   - Record branch creation time: TBD

2. Confirm access scope + target path
   - Decide LAN-only vs public, and record the final URL.
   - Decide NAS target path and confirm DSM permissions for the web server user.

3. Build the app (local)
   - Preconditions:
     - `pnpm install` completed.
     - Ensure any required env (if build-time settings are added later).
   - Command:
     - `pnpm build`
   - Expected output:
     - `dist/index.html`
     - `dist/assets/*`
   - Record build timestamp + artifact hash: TBD

4. (Optional) Inject API base for NAS
   - If the API server is not co-located at `/api` on the NAS web host, set:
     - `window.__DOGULE_API_BASE__ = "http(s)://<api-host>/api"`
   - Preferred method: add a small inline script to `dist/index.html` after build.
   - Record the exact value and where it was applied.

5. Deploy to NAS staging path
   - Copy `dist/` contents so `index.html` is top-level in the target directory.
   - Methods (pick one and record):
     - SMB/drag-drop
     - DSM File Station
     - `rsync -avh dist/ <user>@<nas>:/volume1/web/<target>/`
   - Record the method + timestamp.

6. Run NAS smoke test (manual)
   - Verify app loads without console errors.
   - Navigate core modules (Dashboard, Kunden, Hunde, Kurse, Trainer).
   - Perform CRUD on Kunden/Hunde/Kurse (real data).
   - Confirm API connectivity and MariaDB persistence.
   - Record any issues with steps and severity.

7. Rollback / disable staging
   - If broken, remove or rename the staging folder or disable its DSM web alias.
   - Record the exact rollback action used.

---

Manual Action Required / NAS Remote Access

- Remote access or DSM login details needed to:
  - Create/confirm the staging folder and permissions.
  - Deploy the build to NAS.
  - Configure API server placement or reverse proxy (if required).
  - Verify access scope (LAN-only vs public).

Record updates here as steps are completed.

Progress Log

- 2025-??-??: `dogule1-staging` folder created under `/volume1/web/`. `http` has read access.
- 2025-??-??: Verified web path `https://4c31.synology.me/dogule1-staging/` returns `dogule1 staging ok` after uploading a test `index.html`.
- 2025-??-??: DSM Package Center shows Node.js v20 and v22 installed.
- 2025-??-??: DSM Package Center shows MariaDB 10 installed.
- 2025-??-??: DSM Package Center shows phpMyAdmin 5.2.2-1102 installed.
- 2025-??-??: MariaDB root credentials entered by user in phpMyAdmin (not stored in this log).
- 2025-??-??: MariaDB schema imported into `dogule1` via phpMyAdmin (`tools/mariadb/schema.sql`).
- 2025-??-??: `dogule1_app@localhost` created and granted all privileges on `dogule1` (password stored separately).
- 2025-??-??: MariaDB 10 TCP enabled on port 3306; socket confirmed at `/run/mysqld/mysqld10.sock`.
- 2025-??-??: NAS `.env` created for API server with MariaDB socket + staging web root (password stored separately).
- 2025-??-??: `pnpm build` completed on NAS.
- 2025-??-??: Built `dist/` deployed to `/volume1/web/dogule1-staging/` (overwrite).
- 2025-??-??: API server started on NAS (`node tools/server/apiServer.js`), listening on `http://localhost:5177`, serving UI from `/volume1/web/dogule1-staging`.
- 2025-??-??: Reverse proxy created for API on `https://4c31.synology.me:8443` → `http://127.0.0.1:5177`.
- 2025-??-??: API reachable locally (`curl http://127.0.0.1:5177/api/kunden` → 200 OK); nginx listening on 8443.
- 2025-??-??: Reverse proxy verified with Host header (`curl --resolve 4c31.synology.me:8443:192.168.1.116` → 200 OK).
- 2025-??-??: NAS firewall rule added to allow TCP destination port 8443.
- 2025-??-??: Router port forward added: TCP 8443 → NAS 192.168.1.116:8443.
- 2025-??-??: CORS configured for public origin (`DOGULE1_CORS_ORIGINS=https://4c31.synology.me`); API server restarted.
- 2025-??-??: Manual smoke test: Kunden + Hunde create OK; dashboard metrics updated.
- 2025-??-??: NAS MariaDB refreshed from local export (`dogule1.sql`); database dropped/recreated and re-imported.
- 2025-??-??: Post-import verification: dashboard shows full dataset (counts restored).
- 2025-??-??: NAS repo share path set to `/volume1/dogule1nasfolder` (user-permissioned).
- 2025-??-??: SSH service enabled on NAS (port 22, medium security).
- 2025-??-??: NAS LAN IP reported as `192.168.1.116`.
- 2025-??-??: SSH login succeeded for `me@192.168.1.116`.
- 2025-??-??: SSH key installed for `me@192.168.1.116` via `ssh-copy-id`.
- 2025-??-??: `rsync` over SSH still returning auth failure despite successful interactive SSH login; troubleshooting in progress.
- 2025-??-??: Repo copied to NAS via tar-over-SSH into `/volume1/dogule1nasfolder/dogule1`.
- 2025-??-??: Node.js v22.19.0 and npm 10.9.3 confirmed on NAS shell.
- 2025-??-??: pnpm 10.19.0 installed globally via `npm install -g pnpm@10.19.0`.
- 2025-??-??: pnpm reinstalled under `/volume1/dogule1nasfolder/.npm-global` and verified (`pnpm -v` = 10.19.0).
- 2025-??-??: PATH updated in `~/.profile` to include `/volume1/dogule1nasfolder/.npm-global/bin`.
- 2025-??-??: `pnpm install` completed on NAS repo.
