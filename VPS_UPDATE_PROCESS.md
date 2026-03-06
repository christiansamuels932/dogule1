# VPS Update Process (Dogule1)

Goal: Update the VPS runtime safely, avoid missing config, and prevent downtime.

## VPS Overview (Merged from DEPLOYMENT_PLAN.md)

Goal:

- Run Dogule1 on Contabo VPS only. No NAS-Backup and no Windows installer scope.

VPS profile:

- Provider: Contabo
- Specs: 4 vCPU / 150 GB SSD
- OS: Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-90-generic x86_64)
- IPv4: 144.91.86.20
- IPv6: 2a02:c207:2305:2330::1
- Access: stored offline

Architecture:

- Public API + UI served from the VPS.
- Single runtime target: the VPS.
- Data stored on VPS disk.

DNS / TLS (legacy; verify current state in STATUS.md):

- Domain: to be confirmed
- TLS: to be confirmed (Caddy or Nginx)

Ports (legacy; verify current state in STATUS.md):

- Allow: 22 (SSH), 80/443 (HTTP/HTTPS)
- App API: to be confirmed
- UI: to be confirmed
- Deny all other inbound ports

VPS layout (legacy proposal; current runtime uses `/opt/dogule1/dist`, `/modules`, `/tools`):

- `/opt/dogule1/`
  - `app/` (UI dist)
  - `api/` (Node server + modules)
  - `db/` (MariaDB data directory)
  - `logs/`
  - `config/`
  - `tools/`

Service management:

- Run API as a systemd service
- Run UI as static files served by the API or by the reverse proxy

Deployment method (VPS):

- No git repo on VPS. Deploy from local machine via rsync or scp.
- Preferred: rsync the runtime payload into `/opt/dogule1`:
  - `dist/` → `/opt/dogule1/dist/`
  - `modules/` → `/opt/dogule1/modules/`
  - `tools/` → `/opt/dogule1/tools/`
  - `package.json`, `pnpm-lock.yaml`
- After sync: `pnpm install --prod --ignore-scripts`, then `sudo systemctl restart dogule1`.
- Important: run rsync from local machine, not on the VPS.

Data:

- MariaDB on VPS
- Backups: DB-only encrypted snapshots at `/opt/dogule1/backups/` (24h + 72h slots).

Open questions (legacy; verify current state in STATUS.md):

- VPS OS/version
- Domain name + TLS approach
- API/UI ports

Progress (legacy snapshot):

- 2026-01-30: OS updated and VPS rebooted; uptime verified.
- 2026-01-30: Created `dogule` sudo user; SSH key auth set; root login + password auth disabled.
- 2026-01-30: UFW enabled; OpenSSH + 80/443 allowed.
- 2026-01-30: Installed core packages (curl/ca-certificates/gnupg/git/build-essential/mariadb-server).
- 2026-01-30: Installed Node.js 20 LTS + pnpm (corepack).
- 2026-01-30: Created `/opt/dogule1` and set ownership to `dogule`.

Next step (legacy; verify current state in STATUS.md):

- Confirm VPS OS, domain, and desired port mapping

## Preconditions

- VPS: `dogule@144.91.86.20`
- App root: `/opt/dogule1`
- Service: `dogule1.service`
- Local repo: `/home/ran/codex/dogule@144.91.86.20`
- Deploy method: rsync/scp (no git repo on VPS)

## MariaDB Sync Workflow (VPS → Local → VPS)

Goal: Pull VPS data to local, run schema/code updates locally, then push the updated DB back to VPS.

Notes:

- Local standard socket: `/run/mysqld/mysqld.sock` (avoid mixing sockets).
- These steps overwrite the target DB. Keep the dump as your backup.

### 1) Dump VPS database

On VPS:

```
sudo bash -lc 'source /opt/dogule1/config/dogule1.env && mariadb-dump --single-transaction -u "$DOGULE1_MARIADB_USER" -p"$DOGULE1_MARIADB_PASSWORD" "$DOGULE1_MARIADB_DATABASE" > /tmp/dogule1_vps.sql && chown dogule:dogule /tmp/dogule1_vps.sql'
```

### 2) Copy dump to local

On local:

```
scp dogule@144.91.86.20:/tmp/dogule1_vps.sql /tmp/dogule1_vps.sql
```

If scp fails, stream over SSH:

```
ssh dogule@144.91.86.20 "cat /tmp/dogule1_vps.sql" > /tmp/dogule1_vps.sql
```

### 3) Import into local MariaDB (full overwrite)

On local:

```
sudo systemctl start mariadb
mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -u ran -p -e "DROP DATABASE IF EXISTS dogule1; CREATE DATABASE dogule1;"
mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -u ran -p dogule1 < /tmp/dogule1_vps.sql
```

### 4) Make schema + app changes locally

- Apply migrations / schema updates.
- Update the app locally.

### 5) Dump local DB for VPS

On local:

```
mariadb-dump --single-transaction --protocol=socket --socket /run/mysqld/mysqld.sock -u ran -p dogule1 > /tmp/dogule1_local.sql
scp /tmp/dogule1_local.sql dogule@144.91.86.20:/tmp/dogule1_local.sql
```

### 6) Import back into VPS (full overwrite)

On VPS:

```
sudo bash -lc 'source /opt/dogule1/config/dogule1.env && mariadb -u "$DOGULE1_MARIADB_USER" -p"$DOGULE1_MARIADB_PASSWORD" -e "DROP DATABASE IF EXISTS $DOGULE1_MARIADB_DATABASE; CREATE DATABASE $DOGULE1_MARIADB_DATABASE;"'
sudo bash -lc 'source /opt/dogule1/config/dogule1.env && mariadb -u "$DOGULE1_MARIADB_USER" -p"$DOGULE1_MARIADB_PASSWORD" "$DOGULE1_MARIADB_DATABASE" < /tmp/dogule1_local.sql'
```

### 7) Deploy app to VPS

Continue with the standard "Minimal update flow" below (build + rsync + restart).

## Minimal update flow (most deploys)

Run locally:

```
pnpm build
rsync -av --delete --exclude 'config/' --exclude 'uploads/' --exclude 'node_modules/' /home/ran/codex/dogule@144.91.86.20/dist /home/ran/codex/dogule@144.91.86.20/modules /home/ran/codex/dogule@144.91.86.20/tools dogule@144.91.86.20:/opt/dogule1/
```

Then on the VPS:

```
sudo systemctl restart dogule1
```

Notes:

- Run the rsync command from your local machine (not on the VPS).
- Do not add trailing slashes to the source paths; trailing slashes flatten the folders and break `/opt/dogule1/tools`.

## Files that MUST exist on VPS

- `/opt/dogule1/config/dogule1.env`
- `/opt/dogule1/config/dogule1.passwords`

If `dogule1.env` is missing, `systemd` will fail with:

- `Failed to load environment files: No such file or directory`
- `Failed to spawn 'start' task: No such file or directory`

## 1) Build locally

Run on local:

```
pnpm build
```

## 2) Deploy runtime payload to VPS

Preferred: rsync from local (safe: do NOT delete config/uploads/node_modules).
Important: no trailing slashes on the source paths (they would flatten the folders and break `/opt/dogule1/tools` and `/opt/dogule1/dist`).

```
rsync -av --delete --exclude 'config/' --exclude 'uploads/' --exclude 'node_modules/' /home/ran/codex/dogule@144.91.86.20/dist /home/ran/codex/dogule@144.91.86.20/modules /home/ran/codex/dogule@144.91.86.20/tools dogule@144.91.86.20:/opt/dogule1/
```

⚠️ **Never** run plain `rsync --delete` against `/opt/dogule1`, and never add trailing slashes to the source paths. It will delete or flatten:

- `/opt/dogule1/config` (breaks service env)
- `/opt/dogule1/uploads` (destroys images)
- `/opt/dogule1/node_modules` (breaks runtime deps)
- `/opt/dogule1/modules` or `/opt/dogule1/dist` (breaks API/UI)
- `/opt/dogule1/tools` (breaks `apiServer.js` path)

If you need to re-run rsync, always use the exact command above.

## 3) Ensure config exists on VPS

Check:

```
ls -la /opt/dogule1/config
```

If missing, recreate `dogule1.env` (new secrets):

```
sudo bash -lc 'install -d -m 755 /opt/dogule1/config && ACCESS=$(openssl rand -hex 32) && REFRESH=$(openssl rand -hex 32) && printf "DOGULE1_STORAGE_MODE=mariadb\nDOGULE1_MARIADB_SOCKET=/run/mysqld/mysqld.sock\nDOGULE1_MARIADB_DATABASE=dogule1\nDOGULE1_MARIADB_USER=dogule\nDOGULE1_MARIADB_PASSWORD=Ace1contabo215932\nDOGULE1_AUTH_ENABLED=true\nDOGULE1_AUTH_SECRET=%s\nDOGULE1_REFRESH_SECRET=%s\nDOGULE1_PASSWORD_FILE=/opt/dogule1/config/dogule1.passwords\n" "$ACCESS" "$REFRESH" > /opt/dogule1/config/dogule1.env'
```

Notes:

- This invalidates existing sessions and forces re-login.
- If you need to preserve existing sessions, you must restore the previous secrets.
- MariaDB may auto-select port 3307 when unset; set `DOGULE1_MARIADB_PORT=3306` in `dogule1.env` if needed.

## 4) Copy password file

Local:

```
scp /home/ran/codex/dogule@144.91.86.20/dogule1.passwords dogule@144.91.86.20:/tmp/dogule1.passwords
```

VPS:

```
sudo mv /tmp/dogule1.passwords /opt/dogule1/config/dogule1.passwords && sudo chmod 600 /opt/dogule1/config/dogule1.passwords && sudo chown dogule:dogule /opt/dogule1/config/dogule1.passwords
```

## 5) Restart service

```
sudo systemctl restart dogule1
```

## 6) Verify

```
sudo systemctl status dogule1 --no-pager -l
```

```
curl -sS -i http://127.0.0.1:5177/healthz
```

```
curl -sS -i http://127.0.0.1:5177/api/auth/options
```

## 6b) Browser cache refresh

- After deploy, the UI assets are hash-named. If the browser has old `index.html`, modules may 404.
- Fix: hard reload (Shift+Reload) or clear site data for `http://144.91.86.20:5177`.

## 7) Troubleshooting

### Service won’t start (resources)

Check logs:

```
sudo journalctl -xeu dogule1.service --no-pager -n 200
```

Common root cause:

- Missing `/opt/dogule1/config/dogule1.env`.

### Service won’t start (apiServer.js missing)

Symptoms:

- `systemctl status dogule1` shows `code=exited, status=1/FAILURE`.
- `journalctl -xeu dogule1.service` shows:
  - `Error: Cannot find module '/opt/dogule1/tools/server/apiServer.js'`
  - `code: 'MODULE_NOT_FOUND'`
  - `Node.js v20.x`

Cause:

- `/opt/dogule1/tools/` did not get deployed (bad rsync path, wrong cwd, or trailing slash flattening).
- When flattened, `apiServer.js` ends up at `/opt/dogule1/server/apiServer.js` instead of `/opt/dogule1/tools/server/apiServer.js`.

Fix:

1. On VPS, verify the file:

```
ls -la /opt/dogule1/tools/server/apiServer.js
```

2. If missing, re-deploy from local using the exact safe rsync command (includes `tools/`):

```
rsync -av --delete --exclude 'config/' --exclude 'uploads/' --exclude 'node_modules/' /home/ran/codex/dogule@144.91.86.20/dist /home/ran/codex/dogule@144.91.86.20/modules /home/ran/codex/dogule@144.91.86.20/tools dogule@144.91.86.20:/opt/dogule1/
```

3. Restart and verify:

```
sudo systemctl restart dogule1
sudo systemctl status dogule1 --no-pager -l
curl -sS -i http://127.0.0.1:5177/healthz
```

### Service won’t start (ERR_MODULE_NOT_FOUND: mariadb)

Cause:

- `node_modules` or `package.json` was deleted by a bad rsync.

Fix:

```
scp /home/ran/codex/dogule@144.91.86.20/package.json /home/ran/codex/dogule@144.91.86.20/pnpm-lock.yaml dogule@144.91.86.20:/opt/dogule1/
```

```
cd /opt/dogule1 && pnpm install --prod --ignore-scripts
```

### 404 on `/` (Not found)

Cause:

- `/opt/dogule1/dist` is missing.

Fix:

```
rsync -av --delete /home/ran/codex/dogule@144.91.86.20/dist/ dogule@144.91.86.20:/opt/dogule1/dist/
```

### Port already in use (EADDRINUSE)

Find listener:

```
sudo ss -ltnp | rg 5177
```

### Auth suddenly fails after idle time

Cause:

- Access token expired (default 45 minutes).

Mitigations:

- UI auto-refreshes tokens on 401 and retries the request.
- Logout/login remains as fallback.

## Notes on dependencies

- If `pnpm install --prod` fails due to husky, rerun with `pnpm install --prod --ignore-scripts`.
