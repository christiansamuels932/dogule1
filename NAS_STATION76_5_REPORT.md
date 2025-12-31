# NAS Deployment Report — Station 76.5

Scope

- Deploy MariaDB-backed Dogule1 to NAS staging and confirm public reachability for manual tests.

Environment

- NAS: Synology DS218play (DSM 7.3.2-86009), server name SAN
- Access scope: public (client remote access)
- Staging URL: `https://4c31.synology.me/dogule1-staging/`
- API URL: `https://4c31.synology.me:8443/api`
- Repo path: `/volume1/dogule1nasfolder/dogule1`
- Web root: `/volume1/web/dogule1-staging`
- MariaDB 10 socket: `/run/mysqld/mysqld10.sock`
- MariaDB port: `3306`
- Node: `v22.19.0`
- pnpm: `10.19.0`

Deployment Summary

- Repo copied to NAS via tar-over-SSH.
- Dependencies installed on NAS; `pnpm build` executed.
- `dist/` deployed to `/volume1/web/dogule1-staging/` (overwrite).
- API server started via `node tools/server/apiServer.js` on port `5177`.
- Reverse proxy created: HTTPS `8443` → `http://127.0.0.1:5177`.
- CORS enabled for `https://4c31.synology.me` via `DOGULE1_CORS_ORIGINS`.
- NAS MariaDB refreshed from local export (`dogule1.sql`) to restore full dataset.

Validation

- `curl http://127.0.0.1:5177/api/kunden` → 200 OK.
- `curl --resolve 4c31.synology.me:8443:192.168.1.116 https://4c31.synology.me:8443/api/kunden` → 200 OK.
- UI loads at `https://4c31.synology.me/dogule1-staging/` without CORS errors.
- Manual CRUD smoke: Kunden + Hunde create OK; counts updated.

Issues / Remediation

- Initial CORS block when API exposed on different port; fixed by adding CORS headers in `tools/server/apiServer.js` and setting `DOGULE1_CORS_ORIGINS`.
- Reverse proxy UI did not support path routing, so API exposed on port 8443.

Rollback / Disable

- Stop API server (`kill <PID>`), remove staging web files (`rm -rf /volume1/web/dogule1-staging/*`), optionally disable reverse proxy and close port 8443.

Notes

- Full reproducible runbook is in `NAS_STATION76_5_SETUP.md`.
