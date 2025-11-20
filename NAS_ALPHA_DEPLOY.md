# Dogule1 NAS Alpha Deployment – Station 18 Step 40

## Build

1. Install dependencies once via `pnpm install`.
2. Run `pnpm build` from repo root.
   - Vite compiles `apps/web` + `modules/*` into hashed chunks under `dist/`.
   - Hash-based routing stays intact so no rewrite rules are needed on the NAS.

## Output

```
dist/
├─ index.html            → ~1–2 KB shell pointing to hashed JS/CSS
└─ assets/
   ├─ index-*.js        → entry + module chunks (dashboard/kunden/…)
   └─ index-*.css       → shared/layout styles bundled via Vite
```

`index.html` references bundles via relative paths (e.g., `<script type="module" src="./assets/index-XXXXX.js">`), so everything stays self-contained and offline-friendly.

## NAS target

- Folder: `/volume1/web/dogule1-alpha/`
- Permissions: grant read access for DSM “http”/“nginx” user plus write access for deployment account (e.g., `devops`).

## Deployment steps

1. Build locally (`pnpm build`) and verify `dist/` (see checklist below).
2. Copy the folder to NAS via preferred method:
   - **SMB:** `\\nas\web\dogule1-alpha` → drag/drop `dist/*`.
   - **File Station:** Upload ZIP of `dist/`, extract inside `/volume1/web/dogule1-alpha/`.
   - **rsync:** `rsync -avh dist/ devops@nas:/volume1/web/dogule1-alpha/`.
3. Ensure `index.html` sits directly inside `/volume1/web/dogule1-alpha/`.
4. (Optional) Keep a dated backup by copying the previous contents to `/volume1/web/dogule1-alpha-backups/YYYYMMDD/` before overwriting.

## Access

- Browser URL on LAN: `http://<NAS-IP-or-hostname>/dogule1-alpha/`
- Because routing is hash-based, direct deep links like `http://<NAS>/dogule1-alpha/#/kunden/123` work without server rules.

## Alpha V0.1 limitations

- Mock APIs only (no persistence between refreshes, no NAS database yet).
- Modules outside Dashboard/Kunden/Hunde/Kurse still use placeholder UIs until Station 18.1.
- Files/assets load over HTTP; no HTTPS enforcement yet.
- Authentication is not implemented; NAS path must stay internal-only.

## Verification checklist (run after copying to NAS)

1. Load `/dogule1-alpha/` in Chrome/Edge, confirm layout renders without console errors.
2. Navigate Dashboard, Kunden, Hunde, Kurse via navigation bar; verify hash updates correctly.
3. Exercise CRUD flows for Kunden/Hunde/Kurse (create/edit/delete) using mock data; refresh page to confirm mock reset behavior is understood.
4. Inspect browser console; only `[DASHBOARD|KUNDEN|HUNDE|KURSE_ERR_*]` entries should appear on forced error cases.
5. Reload each module twice to ensure empty/error states stay deduplicated and routing clears containers.
6. Smoke-test the ID override toggles in Kunden/Hunde/Kurse forms; empty/duplicate IDs must be blocked per Station 18 rules.
