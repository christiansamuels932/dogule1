# NAS Distro (Station 84N)

This folder contains the minimal runtime payload to deploy Dogule1 on NAS.

## Contents

- app/    -> built UI (dist/)
- api/    -> API server + required modules
- config/ -> env example (copy and edit)
- logs/   -> runtime logs

## Run (NAS)

Single-folder deploy root: /volume1/dogule1nasfolder

1) Copy this folder to /volume1/dogule1nasfolder.
2) Create /volume1/dogule1nasfolder/config/dogule1.env from the example.
3) Start API:

```bash
cd /volume1/dogule1nasfolder/api
pnpm install --prod
set -a
source /volume1/dogule1nasfolder/config/dogule1.env
set +a
node tools/server/apiServer.js | tee -a /volume1/dogule1nasfolder/logs/api.log
```

UI is served from DOGULE1_WEB_ROOT.
