# Manual Test Report 1

Run: 2026-01-02
Scope: Kunden, Hunde, Kurse (manual E2E baseline)
Environment: local MariaDB + API + Vite dev

## Setup

- Storage mode: mariadb
- MariaDB socket: /run/mysqld/mysqld.sock
- API server: http://localhost:5177
- UI dev: http://localhost:5173

## Results

- Kunden: list, search, detail, edit/save -> pass
- Hunde: list, search, detail, edit/save -> pass
- Kurse: list, detail, create/edit -> pass

## Issues

- None observed
