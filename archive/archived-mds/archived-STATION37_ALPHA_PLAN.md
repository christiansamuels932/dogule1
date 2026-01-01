# Station 37 – Alpha Assembly Plan (Local Alpha V0.1)

Scope guard: assemble the existing app (post-Station 36) without adding features or schema changes. Accept Kommunikation as a placeholder, Waren as standalone, and Trainer↔Finanzen only as currently scoped. No Kurs/Waren-derived Finanzen entries yet.

## Branch & Build Snapshot

- Branch: `feature/station35-trainer-finanzen` (git reports dirty: `status.md` modified).
- Latest pipeline run (by Codex): `pnpm lint` ✅, `pnpm vitest run` ✅ (CJS Vite API deprecation notice), `pnpm build` ✅, `runIntegrityCheck()` ✅ with the known Node `"type": "module"` warning.

## Technical Checks to Keep Green

- `pnpm lint`
- `pnpm vitest run`
- `pnpm build`
- `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"` (warning about missing `"type": "module"` in `package.json` is allowed)

## Module Completeness Targets (Phase A references)

- Dashboard, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen, Waren, Kommunikation (placeholder) follow the Phase-A self-test checklist: hash route loads, shared layout/components, h1/h2 hierarchy, empty/error/loading states, ID read-only + code override where applicable.

## Implemented Interactions to Verify (Phase B)

- Kunden ↔ Hunde (detail links, FK enforcement)
- Kunden ↔ Kurse (derived via Hunde)
- Hunde ↔ Kurse (mutual lists/links)
- Kurse ↔ Trainer (assignment + detail links; delete guard)
- Kurse ↔ Kalender (events derived from Kurse)
- Trainer ↔ Kalender (derived display in trainer detail and calendar event context)

Non-goals for Station 37 (log as gaps, not failures): Waren ↔ Finanzen linking, Kurs ↔ Finanzen revenue entries, expanded Trainer ↔ Finanzen beyond current summary, richer Kommunikation.

## Shared UI Consistency Audit

- All modules mount into `#dogule-main` via hash routes, use shared cards/buttons/notices/form rows/templates.
- Active nav highlighting + `aria-current="page"` present.
- focusHeading (or equivalent) fires once per route load; scroll-to-top on mount.
- Empty/Error/Loading texts use shared German strings.
- German copy: consistent nouns/verbs/plurals; no leftover English fragments in UI.

## Alpha Navigation Walkthrough Script (Desk/Manual)

1. `#/dashboard` loads without console errors; nav highlights Dashboard.
2. Kunden: create a Kunde (ID read-only, code override optional); detail shows Hunde/Kurse/Finanzen sections.
3. Hunde: create a Hund for that Kunde; detail links back to Kunde; list updates.
4. Kurse: create a Kurs, assign Trainer, add Hund via search chips (empty selection allowed); detail lists Hunde with owner info and links.
5. Trainer: open assigned Trainer; Kurs list shows the Kurs; delete guard blocks if Kurs exists.
6. Kalender: Kurs creation/edits surface matching event; event detail links to Kurs and Trainer; day/week views render.
7. Waren: CRUD a sale; stays standalone (no Finanzen link expected).
8. Finanzen: run existing flows (CRUD, filters, detail). Trainer-related summaries show when Kurs payments exist; no auto revenue from Kurse/Waren.
9. Navigation back/forward across all visited routes keeps layout intact and headings correct.

## Documentation Tasks for Station 37

- Update README with an Alpha section: how to install/run/build, where dist ends up, known limitations (Kommunikation placeholder; Waren not linked to Finanzen; no Kurs-derived revenue; Node `"type"` warning), and the Alpha walkthrough pointer.
- Ensure STATUS picks up Station 37 summary and test commands once work is finalized.

## Known Gaps to Log (for Station 38 script and later)

- No Waren ↔ Finanzen linking.
- No Kurs-generated revenue entries in Finanzen.
- Kommunikation remains minimal placeholder.
- Node warning about missing `"type": "module"` in `package.json` during ESM imports (accepted).
