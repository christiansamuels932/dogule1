# Eingaenge (Zugriffe + Passwoerter)

This file documents where to access the VPS and where credentials/configs live.
Passwords listed below are only those already known during setup.
If a password is unknown, it is left blank intentionally.

## VPS access

- SSH: `ssh dogule@144.91.86.20`
- Cockpit GUI: `https://144.91.86.20:9090` (UFW port 9090/tcp open)
- OS: Ubuntu 24.04.3 LTS
- Cockpit login: same as VPS user credentials.

## App access

- UI: `http://144.91.86.20:5177/`
- Auth page: `http://144.91.86.20:5177/#/auth`
- Health: `http://144.91.86.20:5177/healthz`

## Service + logs

- systemd unit: `/etc/systemd/system/dogule1.service`
- Start/stop/restart:
  - `sudo systemctl start dogule1`
  - `sudo systemctl stop dogule1`
  - `sudo systemctl restart dogule1`
- Logs: `sudo journalctl -u dogule1 --no-pager`

## Auth + secrets (locations)

- App env file: `/opt/dogule1/config/dogule1.env`
  - DB settings, `DOGULE1_AUTH_SECRET`, `DOGULE1_REFRESH_SECRET`.
  - Must exist or systemd start will fail.
- Password file (users): `/opt/dogule1/config/dogule1.passwords`
  - One line per user: `username:password`.
  - Permissions should allow the service user to read it.
- Source password list (local): `/home/ran/codex/dogule1/dogule1.passwords`.

## MariaDB (VPS)

- DB name: `dogule1`
- User: `dogule`
- Password: `Ace1contabo215932`
- Socket: `/run/mysqld/mysqld.sock`
- Port: 3306 (set `DOGULE1_MARIADB_PORT=3306` in `dogule1.env`)
- Quick checks:
  - `mariadb -u dogule -p -e "USE dogule1; SHOW TABLES;"`
  - `mariadb -u dogule -p -e "USE dogule1; SELECT COUNT(*) FROM trainer;"`

## Local MariaDB (source for imports)

- Local dumps are created from the local DB and imported into VPS.
- Typical dump file: `/tmp/dogule1_local.sql` (local machine)
- Typical transfer target: `/tmp/dogule1_local.sql` (VPS)

## Health watchdog

- Script: `/opt/dogule1/tools/healthcheck.sh`
- Systemd:
  - `/etc/systemd/system/dogule1-healthcheck.service`
  - `/etc/systemd/system/dogule1-healthcheck.timer`
- Check timer: `systemctl list-timers --no-pager | rg dogule1-healthcheck`

## Firewall

- UFW open ports: 22, 80/443 (future), 5177 (app), 9090 (Cockpit)
- Check: `sudo ufw status verbose`

## Known logins + passwords (as of 2026-01-30)

### App users (Dogule1)

From `/home/ran/codex/dogule1/dogule1.passwords` and deployed to
`/opt/dogule1/config/dogule1.passwords`:

- Developer / `Developer`: `deve6087`
- Patricia / `patty.bruehwiler`: `pabr003`
- Susann / `eidara`: `such002`
- Michael / `michael.damico`: `mida005`
- Richard (admin) / `info`: `rifo6087`
- Cornelia / `cornelia13`: `cosc004`

### VPS users

- VPS user: `dogule` / password: Ace1contabo215932
- Root: disabled for password login.

### Local users

- Local user: `ran` / password: 215932

### MariaDB 

- Local: Ace1Ab215932.
- on NAS: Dogule1!2026
