# DEPLOYMENT PLAN — Dogule1 (Legacy Snapshot)

This plan has been merged into `VPS_UPDATE_PROCESS.md` as the single authoritative VPS doc.
Do not update this file; keep for historical reference only.

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

## Deployment method (VPS)

- No git repo on VPS. Deploy from local machine via rsync or scp.
- Preferred: rsync the runtime payload into `/opt/dogule1`:
  - `dist/` → `/opt/dogule1/dist/`
  - `modules/` → `/opt/dogule1/modules/`
  - `tools/` → `/opt/dogule1/tools/`
  - `package.json`, `pnpm-lock.yaml`
- After sync: `pnpm install --prod --ignore-scripts`, then `sudo systemctl restart dogule1`.
- Important: run rsync from local machine, not on the VPS.

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

## Next step

- Confirm VPS OS, domain, and desired port mapping
