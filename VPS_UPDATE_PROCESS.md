# VPS Update Process (Dogule1)

Goal: Update the VPS runtime safely, avoid missing config, and prevent downtime.

## Preconditions

- VPS: `dogule@144.91.86.20`
- App root: `/opt/dogule1`
- Service: `dogule1.service`
- Local repo: `/home/ran/codex/dogule1`
- Deploy method: rsync/scp (no git repo on VPS)

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

Preferred: rsync from local:

```
rsync -av --delete /home/ran/codex/dogule1/dist/ /home/ran/codex/dogule1/modules/ /home/ran/codex/dogule1/tools/ dogule@144.91.86.20:/opt/dogule1/
```

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
scp /home/ran/codex/dogule1/dogule1.passwords dogule@144.91.86.20:/tmp/dogule1.passwords
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
