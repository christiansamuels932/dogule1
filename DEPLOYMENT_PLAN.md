# DEPLOYMENT PLAN — Dogule1 (VPS-only)

## Goal

Run Dogule1 on Contabo VPS only. No NAS-Backup and no Windows installer scope.

## VPS profile

- Provider: Contabo
- Specs: 4 vCPU / 150 GB SSD
- OS: Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-90-generic x86_64)
- IPv4: 144.91.86.20
- IPv6: 2a02:c207:2305:2330::1
- Access: stored offline

## Architecture

- Public API + UI served from the VPS.
- Single runtime target: the VPS.
- Data stored on VPS disk.

## DNS / TLS

- Domain: to be confirmed
- TLS: to be confirmed (Caddy or Nginx)

## Access & credentials (locations only)

- VPS access + key locations: see `Eingaenge.md`
- App env: `/opt/dogule1/config/dogule1.env`
- Password file: `/opt/dogule1/config/dogule1.passwords`
- Cockpit GUI: `https://144.91.86.20:9090`

## Ports

- Allow: 22 (SSH), 80/443 (HTTP/HTTPS)
- App API: to be confirmed
- UI: to be confirmed
- Deny all other inbound ports

## VPS layout (proposed)

- `/opt/dogule1/`
  - `app/` (UI dist)
  - `api/` (Node server + modules)
  - `db/` (MariaDB data directory)
  - `logs/`
  - `config/`
  - `tools/`

## Service management

- Run API as a systemd service
- Run UI as static files served by the API or by the reverse proxy

## Data

- MariaDB on VPS
- Backups: to be defined (local snapshot + offsite?)

## Open questions

- VPS OS/version
- Domain name + TLS approach
- API/UI ports
- Backup strategy

## Progress

- 2026-01-30: OS updated and VPS rebooted; uptime verified.
- 2026-01-30: Created `dogule` sudo user; SSH key auth set; root login + password auth disabled.
- 2026-01-30: UFW enabled; OpenSSH + 80/443 allowed.
- 2026-01-30: Installed core packages (curl/ca-certificates/gnupg/git/build-essential/mariadb-server).
- 2026-01-30: Installed Node.js 20 LTS + pnpm (corepack).
- 2026-01-30: Created `/opt/dogule1` and set ownership to `dogule`.
- 2026-01-30: Synced repo to `/opt/dogule1` on VPS.
- 2026-01-30: `pnpm install` completed on VPS.
- 2026-01-30: `pnpm approve-builds` ran for esbuild.
- 2026-01-30: MariaDB `dogule1` database and `dogule` user created; password set on VPS.
- 2026-01-30: Created `/opt/dogule1/config/dogule1.env` with MariaDB connection settings.
- 2026-01-30: MariaDB schema ensure script ran on VPS.
- 2026-01-30: UI assets built on VPS (`pnpm build`).
- 2026-01-30: API health check OK on `http://127.0.0.1:5177/healthz`.
- 2026-01-30: systemd service file created for `dogule1`.
- 2026-01-30: Cleared port 5177 conflict (fuser).
- 2026-01-30: `dogule1` systemd service running.
- 2026-01-30: UFW opened port 5177 for IP-only access.
- 2026-01-30: External health check OK at `http://144.91.86.20:5177/healthz`.
- 2026-01-30: Forced MariaDB TCP by clearing `DOGULE1_MARIADB_SOCKET`.
- 2026-01-30: Set MariaDB socket to `/run/mysqld/mysqld.sock` in VPS env.
- 2026-01-30: Imported local MariaDB dump into VPS `dogule1` (trainers + data).
- 2026-01-30: Auth options verified; passwordless disabled; password file installed.
- 2026-01-30: Auth secrets generated and stored in `/opt/dogule1/config/dogule1.env`.
- 2026-01-30: Cockpit GUI installed and UFW opened port 9090.
- 2026-01-30: Healthcheck watchdog added via systemd timer.

## Next step

- Confirm VPS OS, domain, and desired port mapping
