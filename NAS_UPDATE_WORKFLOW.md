# NAS Update Workflow (84U)

Purpose: update Dogule1 locally and propagate changes to the NAS pilot so they are visible at the remote URL.

## Assumptions

- Local repo: `/home/ran/codex/dogule1`
- NAS root: `/volume1/dogule1nasfolder`
- NAS API: `http://127.0.0.1:5177`
- Remote UI: `https://4c31.synology.me:8443/#/auth`

## Minimal workflow (current)

1. Make local changes.
2. Update `.NAS-Distro` (build + sync from `dist/`, `modules/`, `tools/`).
3. Drag & drop `.NAS-Distro/` onto `/volume1/dogule1nasfolder/` (include `config/` when env changes).

## Restart + verify

- Restart API (or reboot NAS if port 5177 is still in use).
- Verify remote UI: `https://4c31.synology.me:8443/#/auth`.
