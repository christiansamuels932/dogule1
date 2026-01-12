# NAS Update Workflow (84U)

Purpose: update Dogule1 locally and propagate changes to the NAS pilot so they are visible at the remote URL.

## Assumptions

- Local repo: `/home/ran/codex/dogule1`
- NAS root: `/volume1/dogule1nasfolder`
- NAS API: `http://127.0.0.1:5177`
- Remote UI: `https://4c31.synology.me:8443/#/auth`

## Local build + package

1. Pull / commit changes locally.
2. Build UI:

```bash
pnpm build
```

3. Refresh `.NAS-Distro`:

```bash
rsync -a --delete dist/ .NAS-Distro/app/
rsync -a --delete modules/ .NAS-Distro/api/modules/
rsync -a --delete tools/server/ .NAS-Distro/api/tools/server/
rsync -a --delete tools/ops/ .NAS-Distro/api/tools/ops/
rsync -a --delete tools/mariadb/ .NAS-Distro/api/tools/mariadb/
cp package.json pnpm-lock.yaml .NAS-Distro/api/
```

## Copy to NAS

```bash
rsync -a --delete .NAS-Distro/ me@192.168.1.116:/volume1/dogule1nasfolder/
```

## NAS install + restart

```bash
cd /volume1/dogule1nasfolder/api
pnpm install --prod
set -a
source /volume1/dogule1nasfolder/config/dogule1.env
set +a
node tools/server/apiServer.js
```

## Verify

- Local NAS: `curl http://127.0.0.1:5177/api/kunden` (expect `missing_token`).
- Remote: open `https://4c31.synology.me:8443/#/auth`.

## Rollback (manual)

- Keep a dated copy of `/volume1/dogule1nasfolder` before updates.
- If needed, restore the previous folder and restart the API.
