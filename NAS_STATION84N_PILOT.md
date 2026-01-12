# NAS_STATION84N_PILOT.md

Goal: run Dogule1 from NAS for a single-client pilot using a clean deploy layout
and a low-friction update flow. This avoids syncing full repo into the web root.

Status: draft.

## Recorded NAS information (user-provided)

Basic Information

- Server name: SAN
- DSM version: DSM 7.3.2-86009
- Synology Account: christiansamuels932@gmail.com
- QuickConnect ID: A4c31

Hardware

- Serial number: 2110Q8N012802
- Model name: DS218play
- CPU: Realtek RTD1296 SoC
- CPU clock rate: 1.4 GHz
- CPU cores: 4
- Total physical memory: 1024 MB
- Thermal status: Normal
- Fan Speed Mode: Quiet mode

Time

- NTP Server: time.google.com
- Time zone: (GMT+01:00) Amsterdam, Berlin, Rome, Stockholm, Vienna
- System time: 01/11/2026 17:00:58
- Uptime: 19 day(s) 23 hour(s) 42 minute(s) 59 second(s)

Deployment preferences and environment (user-provided)

- Deployment type: unclear; user does not know whether fresh deploy or update existing Dogule1.
- Connection method: local file copy.
- Node.js version: v22.
- MariaDB version: 10.
- pnpm version: unknown / not sure installed.
- MariaDB credentials: user unknown; password provided = Dogule1!2026.
- NAS username: me.
- NAS LAN IP: 192.168.1.116.
- Access method details: manual copying (user-provided).
- MariaDB socket check: `/run/mysqld/mysqld.sock` works.
- MariaDB users present: PUBLIC (no host), dogule1@localhost, dogule1_app@localhost, mariadb.sys@localhost, mysql@localhost, root@localhost.
- pnpm check: `pnpm` not found on NAS (`-sh: pnpm: command not found`).
- corepack check: `corepack` not found on NAS (`-sh: corepack: command not found`).
- Node path: `/usr/local/bin/node`.
- Node version: `v22.19.0`.
- npm version: `10.9.3`.
- npm warning/error: `npm error config prefix cannot be changed from project config: /volume1/homes/me/.npmrc.`
- NAS user npmrc: `/volume1/homes/me/.npmrc` contains `prefix=/volume1/dogule1nasfolder/.npm-global`.
- Created npm global prefix directory: `/volume1/dogule1nasfolder/.npm-global` (user confirmed).
- pnpm install: `npm install -g pnpm` completed; output: "added 1 package in 7s" + "1 package is looking for funding".
- pnpm version after install: `10.28.0`.
- NAS repo base path selected by user: `/volume1/dogule1nasfolder`.
- Created NAS layout folders under `/volume1/dogule1nasfolder`: repo, app, api, config, logs (user confirmed).
- Selected MariaDB user for app: `dogule1`.
- Created env file at `/volume1/dogule1nasfolder/config/dogule1.env` with MariaDB socket `/run/mysqld/mysqld.sock`, user `dogule1`, password `Dogule1!2026`, API port `5177`, web root `/volume1/dogule1nasfolder/app`.
- User request: do not copy full repo to NAS; prepare `.NAS-Distro` so it contains only what must be deployed.
- Local packaging log:
  - `pnpm build` run locally; refreshed `dist/`.
  - Synced `dist/` into `.NAS-Distro/app/` via `rsync -a --delete`.
  - Synced `modules/` into `.NAS-Distro/api/modules/` and `tools/server/` into `.NAS-Distro/api/tools/server/` via `rsync -a --delete`.
  - Copied `package.json` + `pnpm-lock.yaml` into `.NAS-Distro/api/`.
- NAS copy: user copied contents of `.NAS-Distro` into `/volume1/dogule1nasfolder` (app/api/config/logs/README.md/update.sh).
- NAS API deps install attempt: `pnpm` not found in NAS shell (`-sh: pnpm: command not found`).
- npm global bin missing: `/volume1/dogule1nasfolder/.npm-global/bin` does not exist.
- Created npm global bin directory: `/volume1/dogule1nasfolder/.npm-global/bin` (user confirmed).
- pnpm reinstall: `npm install -g pnpm` completed; output: "added 1 package in 5s" + "1 package is looking for funding".
- PATH updated in shell: `/volume1/dogule1nasfolder/.npm-global/bin` prepended (user confirmed).
- pnpm version after PATH update: `10.19.0` (NAS shell).
- NAS `pnpm install --prod` output: packages +9 (mariadb 3.4.5, nodemailer 7.0.12), `prepare` script attempted to run husky (`DLX-HUSKY-000`), failed with `sh: husky: command not found`, ended with `ELIFECYCLE` error.
- NAS `HUSKY=0 pnpm install --prod` retried: still ran `prepare`/`husky install`, failed with `sh: husky: command not found`, `ELIFECYCLE` error.
- NAS API `package.json`: removed `scripts.prepare` via node one-liner to bypass husky on install.
- NAS prod deps install: `pnpm install --prod` completed successfully (pnpm v10.19.0).
- NAS API start failed: missing `/volume1/dogule1nasfolder/api/tools/ops/log_event.schema.json` referenced by `modules/shared/logging/schema.js` (ENOENT).
- Local packaging fix: synced `tools/ops/` into `.NAS-Distro/api/tools/ops/` to include `log_event.schema.json`.
- NAS copy: updated `/volume1/dogule1nasfolder/api/tools/ops` copied from `.NAS-Distro` (user confirmed).
- NAS API start: `node tools/server/apiServer.js` started successfully; MariaDB connected on socket `/run/mysqld/mysqld.sock`, API listening at `http://localhost:5177`. Warning: Node suggests adding `"type": "module"` to `package.json` (left unchanged). Output showed `Serving UI from /volume1/web/dogule1-staging` (env not sourced in that run).
- NAS API stopped via Ctrl+C (user confirmed).
- NAS API start (second attempt): started without sourcing env; output still shows `Serving UI from /volume1/web/dogule1-staging` (env not sourced). API listening at `http://localhost:5177`, same Node warning.
- NAS API stopped again via Ctrl+C (user confirmed).
- NAS API start (env sourced): ran `set -a`, sourced `/volume1/dogule1nasfolder/config/dogule1.env`, then started server. Output still shows `Serving UI from /volume1/web/dogule1-staging` (env may be overridden elsewhere). API listening at `http://localhost:5177`, Node warning unchanged.
- Shell env check: `DOGULE1_WEB_ROOT` currently resolves to `/volume1/web/dogule1-staging`.
- NAS env file contents (current): `DOGULE1_WEB_ROOT=/volume1/web/dogule1-staging` (not `/volume1/dogule1nasfolder/app`), includes MariaDB host/port + socket, API port, and automation defaults (`DOGULE1_AUTOMATION_SENDER_EMAIL=info@fontanas-dogworld.ch`, `DOGULE1_AUTOMATION_PROVIDER=outlook`).
- User decision: switch `DOGULE1_WEB_ROOT` to `/volume1/dogule1nasfolder/app`.
- Updated NAS env file: `DOGULE1_WEB_ROOT` set to `/volume1/dogule1nasfolder/app` (user confirmed).
- NAS API start (updated env): MariaDB connected via socket, API listening at `http://localhost:5177`, serving UI from `/volume1/dogule1nasfolder/app`. Node warning about missing `"type": "module"` remains.
- NAS API health check: `curl http://127.0.0.1:5177/api/kunden` returned `{"message":"missing_token"}` (expected without auth token).
- Browser check: UI loads at `http://192.168.1.116:5177` (user confirmed Dogule opens).
- User note: keep API running in terminal for now.
- Data state note: local MariaDB is ahead of NAS MariaDB; Zertifikate module shows error "Zertifikate Fehler beim Laden der Daten."
- NAS MariaDB check: `SHOW TABLES LIKE 'zertifikate'` failed with `ERROR 1045 (28000): Access denied for user 'dogule1'@'localhost' (using password: YES)`.
- NAS MariaDB check: `SHOW TABLES LIKE 'zertifikate'` rerun (password accepted); no output returned (table missing).
- NAS migration attempt failed: `/volume1/dogule1nasfolder/api/tools/mariadb/migrations/83_2_zertifikate_schema.sql` not found (missing in `.NAS-Distro`).
- Local packaging fix: synced `tools/mariadb/` into `.NAS-Distro/api/tools/mariadb/` to include migrations.
- NAS copy: updated `/volume1/dogule1nasfolder/api/tools/mariadb` copied from `.NAS-Distro` (user confirmed).
- NAS migration error: `83_2_zertifikate_schema.sql` failed with `ERROR 1005 (HY000): Can't create table dogule1.zertifikate (errno: 150 "Foreign key constraint is incorrectly formed")` during CREATE TABLE.
- NAS schema: `SHOW CREATE TABLE kunden` shows `kunden.id` is `char(36)` with utf8mb4_uca1400_ai_ci collation.
- NAS schema: `SHOW CREATE TABLE hunde` shows `hunde.id` is `char(36)` with utf8mb4_uca1400_ai_ci collation; FK `fk_hunde_kunden` references `kunden(id)` with ON UPDATE CASCADE.
- NAS schema: `SHOW CREATE TABLE kurse` shows `kurse.id` is `char(36)` with utf8mb4_uca1400_ai_ci collation; FK `fk_kurse_trainer` references `trainer(id)` with ON UPDATE CASCADE.
- NAS schema: `SHOW CREATE TABLE trainer` shows `trainer.id` is `char(36)` with utf8mb4_uca1400_ai_ci collation.
- NAS DB collation: `collation_database` is `utf8mb3_general_ci`.
- NAS cert table create: ran manual `CREATE TABLE IF NOT EXISTS zertifikate ... DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;` via heredoc; command completed without errors.
- NAS cert table verify: `SHOW TABLES LIKE 'zertifikate'` returned `zertifikate`.
- UI check after table create: Zertifikate loads; shows "Keine Zertifikate vorhanden."
- User note: NAS MariaDB is behind local; missing recent data.
- User decision: copy local MariaDB data to NAS now.
- Local dump attempt: `mysqldump --protocol=socket --socket /run/mysqld/mysqld.sock -u ran -p dogule1` failed; warning about deprecation (use `mariadb-dump`), error 2002 cannot connect to socket `/run/mysqld/mysqld.sock` (not found).
- Local sudo check: `sudo systemctl status mariadb` prompted for password; user reported "Sorry, try again."
- Local socket dir: `ls -la /run/mysqld` shows directory exists but no socket file present.
- Local process check: `ps aux | rg -i 'mariadb|mysqld'` shows no MariaDB process running.
- User report: local sudo password not accepted; unable to start MariaDB locally.
- Local sudo check: `sudo -v` failed; "Sorry, try again."

Port forwarding rules

- NAS_80: TCP, device NAS, entry 80 → dest 80.
- NAS_443: TCP, device NAS, entry 443 → dest 443.
- NAS VPN: UDP, device NAS, entry 1194 → dest 1194.
- NAS-Web 1: TCP, device NAS, entry 5000 → dest 5000.
- NAS-Web 2: TCP, device NAS, entry 5001 → dest 5001.
- dogule1: TCP, device NAS, entry 8443 → dest 8443.

Automatically created port forwarding by UPnP IGD

- Plex Media Server: TCP, device NAS, entry 22222 → dest 32400.

Router port-forwarding page (verbatim)

- NAS_80: TCP, device NAS, entry 80 → dest 80.
- NAS_443: TCP, device NAS, entry 443 → dest 443.
- NAS VPN: UDP, device NAS, entry 1194 → dest 1194.
- NAS-Web 1: TCP, device NAS, entry 5000 → dest 5000.
- NAS-Web 2: TCP, device NAS, entry 5001 → dest 5001.
- dogule1: TCP, device NAS, entry 8443 → dest 8443.
- Plex Media Server: TCP, device NAS, entry 22222 → dest 32400. (UPnP IGD)

Remote access (current session)

- DDNS already configured: `4c31.synology.me` (Synology), status Normal.
- Let's Encrypt certificate issued for `4c31.synology.me` (user confirmed).
- Reverse Proxy draft: name `dogule1-api`, source HTTPS `4c31.synology.me` port `8443` (HSTS enabled), destination HTTP `127.0.0.1:5177` (pending save).
- Reverse Proxy edit attempt on port 443 failed with: "The domain name is already used. Please use another name." (indicates existing rule for `4c31.synology.me:443`).
- Existing reverse proxy on `4c31.synology.me:443` named "The Gate" routes to `http://127.0.0.1:80` (user noted this is intended as a shared gateway for multiple apps).
- Decision: keep "The Gate" unchanged; use Dogule1 on `4c31.synology.me:8443` with router port-forward `8443 -> 8443`.
- Reverse Proxy draft (user view): name `dogule1`, source HTTPS `synology.me` port `8443`, destination HTTP `localhost:80` (needs hostname `4c31.synology.me` and destination port `5177`).
- Reverse Proxy finalized: name `dogule1`, source HTTPS `4c31.synology.me` port `8443` (HSTS enabled), destination HTTP `127.0.0.1:5177`.
- External access verified: `https://4c31.synology.me:8443/#/auth` loads from outside LAN (user confirmed); client will bookmark this until a custom hostname is available.

## Recommended NAS layout

Use a dedicated root:

- /volume1/dogule1/repo/ (git clone, source code)
- /volume1/dogule1/app/ (built UI, dist/)
- /volume1/dogule1/api/ (API run location, optional symlink to repo)
- /volume1/dogule1/config/ (env files, secrets)
- /volume1/dogule1/db/ (MariaDB data if self-hosted on NAS)
- /volume1/dogule1/logs/ (api logs)

## Prereqs

- MariaDB running on NAS (package or Docker).
- Node.js available on NAS (nvm or package).
- Git + pnpm available on NAS.

## Initial setup (NAS)

1. Clone repo to NAS:

```bash
cd /volume1/dogule1
git clone git@github.com:christiansamuels932/dogule1.git repo
cd repo
pnpm install
```

2. Build UI:

```bash
pnpm build
```

3. Deploy UI to web root:

```bash
rsync -a --delete /volume1/dogule1/repo/dist/ /volume1/dogule1/app/
```

4. Create env file (example):

```bash
cat > /volume1/dogule1/config/dogule1.env <<'EOF'
DOGULE1_STORAGE_MODE=mariadb
DOGULE1_MARIADB_HOST=127.0.0.1
DOGULE1_MARIADB_PORT=3306
DOGULE1_MARIADB_USER=ran
DOGULE1_MARIADB_PASSWORD=changeme
DOGULE1_API_PORT=5177
DOGULE1_WEB_ROOT=/volume1/dogule1/app
EOF
```

5. Run API server (manual):

```bash
cd /volume1/dogule1/repo
set -a
source /volume1/dogule1/config/dogule1.env
set +a
node tools/server/apiServer.js | tee -a /volume1/dogule1/logs/api.log
```

## Update flow (NAS)

```bash
cd /volume1/dogule1/repo
git pull
pnpm install
pnpm build
rsync -a --delete /volume1/dogule1/repo/dist/ /volume1/dogule1/app/
# restart API process
```

## Rollback (NAS)

- Keep previous deploy: copy /volume1/dogule1/app to /volume1/dogule1/app.prev before rsync.
- Roll back by restoring app.prev and restarting API.

## Drive sync alternative (if required)

If you must sync from /home/ran/codex/dogule1 via Synology Drive:

- Sync into /volume1/Sync/dogule1 (not /app).
- Exclude at minimum:
  - node_modules/
  - .local/
  - dist/
  - storage\_\*/
  - .env
  - DogTabs Data/
  - .tmp-\*/
  - Material/\*.png (optional if PNG already on NAS)

Then build from /volume1/Sync/dogule1 and deploy only dist/ to /volume1/dogule1/app.

## Notes

- Do not sync secrets or DB files via Drive; use NAS-local config.
- Avoid writing any data under /app; keep runtime state under /db and /logs.
- Confirm MariaDB user/password matches the NAS instance before pilot.

## Where to Resume (Detailed)

Current state summary (as of last step):

- NAS host: SAN (192.168.1.116), user `me`, DSM 7.3.2-86009.
- NAS base path in use: `/volume1/dogule1nasfolder`.
- `.NAS-Distro` content copied into NAS root (so `app/`, `api/`, `config/`, `logs/`, `README.md`, `update.sh` are under `/volume1/dogule1nasfolder`).
- API runs manually from `/volume1/dogule1nasfolder/api` and is serving UI from `/volume1/dogule1nasfolder/app`.
- MariaDB socket on NAS: `/run/mysqld/mysqld.sock`.
- MariaDB user: `dogule1` with password `Dogule1!2026`.
- NAS env file: `/volume1/dogule1nasfolder/config/dogule1.env` (contains DB host/port + socket, API port 5177, and automation defaults).
- Zertifikate table created manually with `utf8mb4_uca1400_ai_ci`; Zertifikate UI now loads (empty).
- NAS data is behind local data; local MariaDB dump blocked because local sudo password not accepted and MariaDB not running.
- pnpm installed on NAS, but shell PATH must include `/volume1/dogule1nasfolder/.npm-global/bin`.

Immediate checks (run on NAS):

1. Confirm API is still running and serving the new web root:
   - In the API terminal, you should see:
     - `Dogule1 API server listening on http://localhost:5177`
     - `Serving UI from /volume1/dogule1nasfolder/app`
   - If it is not running, start it:
     - `cd /volume1/dogule1nasfolder/api`
     - `set -a; . /volume1/dogule1nasfolder/config/dogule1.env; set +a`
     - `node tools/server/apiServer.js | tee -a /volume1/dogule1nasfolder/logs/api.log`

2. Validate API health (expected missing auth token):
   - `curl http://127.0.0.1:5177/api/kunden`
   - Expected: `{"message":"missing_token"}`.

3. Confirm Zertifikate table exists (NAS DB):
   - `mysql --protocol=socket --socket /run/mysqld/mysqld.sock -udogule1 -p -e "SHOW TABLES LIKE 'zertifikate';" dogule1`

Key reminders and known issues:

- The NAS `pnpm install --prod` originally failed because `scripts.prepare` ran husky; fixed by removing `scripts.prepare` from NAS `package.json`. If `.NAS-Distro` is regenerated in the future, repeat this or remove `prepare` in the source or add a guard in the install flow.
- The Zertifikate migration SQL failed due to FK collation mismatch because `collation_database` is `utf8mb3_general_ci`. The table was created manually with `utf8mb4_uca1400_ai_ci`. If you re-run migrations, keep collation consistent.
- The API currently runs in the foreground. Autostart on NAS is not yet configured (DSM Task Scheduler or equivalent still needed).

Data sync (blocked):

- Local MariaDB is not running; sudo password is not accepted so `systemctl start mariadb` fails.
- Until sudo works, you cannot run a local dump. Once sudo is fixed:
  1. Start local MariaDB.
  2. Dump local DB to a file (use `mariadb-dump` if `mysqldump` is deprecated).
  3. Copy dump to NAS.
  4. Import into NAS DB using the `dogule1` user.

If you need to rebuild `.NAS-Distro` again:

- Local refresh steps already used:
  - `pnpm build` (refresh `dist/`).
  - `rsync -a --delete dist/ .NAS-Distro/app/`
  - `rsync -a --delete modules/ .NAS-Distro/api/modules/`
  - `rsync -a --delete tools/server/ .NAS-Distro/api/tools/server/`
  - `rsync -a --delete tools/ops/ .NAS-Distro/api/tools/ops/`
  - `rsync -a --delete tools/mariadb/ .NAS-Distro/api/tools/mariadb/`
  - `cp package.json pnpm-lock.yaml .NAS-Distro/api/`

What is still pending:

- Configure API autostart on NAS (DSM Task Scheduler).
- Resolve local sudo issue and perform full DB sync from local to NAS.
- Decide whether to expose the app via reverse proxy (443/8443) or only via `http://192.168.1.116:5177`.
- DSM Task Scheduler: user reported no "event" option for boot-up; set a scheduled task to repeat daily with start time 00:05 (not ideal for autostart).
- DSM Task Scheduler schedule options observed: Run on following days (enabled), Repeat daily; Run on following date (disabled); Start 01/11/2026; "Repeat: Do not repeat"; Start time 00:05; "Continue running within the same day" disabled; "Repeat: Every hour" disabled; Last run time 00:05.
- DSM Task Scheduler: user created a Triggered Task and saved a script to start the API using env file and PATH `/volume1/dogule1nasfolder/.npm-global/bin`.
- Task test attempt: user ran `curl http://127.0.0.1:5177/api/kunden` on local machine; connection failed (expected since API is on NAS).
- Task test on NAS: `curl http://127.0.0.1:5177/api/kunden` returned `{"message":"missing_token"}` (API running).

Autostart setup details:

- DSM Task Scheduler: Created Triggered Task (User-defined script) running as `root` to start the API on boot.
- Script used:
  - `export PATH="/volume1/dogule1nasfolder/.npm-global/bin:$PATH"`
  - `set -a`
  - `. /volume1/dogule1nasfolder/config/dogule1.env`
  - `set +a`
  - `cd /volume1/dogule1nasfolder/api`
  - `node tools/server/apiServer.js >> /volume1/dogule1nasfolder/logs/api.log 2>&1 &`
- Task manual Run verified: `curl http://127.0.0.1:5177/api/kunden` returned `{"message":"missing_token"}` on NAS.
- User intent: reboot both NAS and local PC to resolve local sudo issue and verify autostart after reboot.
