# Alpha Test Script — Station 38 (Local Alpha V0.1)

## Pre-Run State

- Action: Reset workspace to the ref listed in Branch and Commit Lock; ensure working tree clean.
- Expected: git status clean on branch `feature/station35-trainer-finanzen` at commit `d41cd5a`.
- Console: No errors.
- Action: Ensure mock DB is at seed state (no leftover local edits). Delete any persisted localStorage/Application Storage for the app origin.
- Expected: Fresh seed data only; no prior test entities present.
- Console: No errors.
- Action: Use deterministic test entities only:
  - Kunde: “Alpha Kunde 1” code `KND-ALPHA-1`
  - Hund: “Alpha Hund 1” code `HND-ALPHA-1`
  - Kurs: “Alpha Kurs 1” code `KURS-ALPHA-1`
  - Trainer: reuse seeded trainer; if new, “Alpha Trainer 1” code `TRN-ALPHA-1`
  - Ware: “Alpha Ware 1” code `WARE-ALPHA-1`
  - Finanzen entry: “Alpha Zahlung 1” code `FIN-ALPHA-1`
- Action: Use a single browser tab. Clear cache if UI assets look stale.
- Expected: Deterministic start; no unexpected session state.
- Console: No errors.

## Pre-Run Command Sequence

- Install
  - Action: `pnpm install`
  - Expected: Dependencies install without errors.
  - Console: No errors.
- integrityCheck
  - Action: `node --input-type=module -e "import('./modules/shared/api/db/integrityCheck.js').then(m=>m.runIntegrityCheck())"`
  - Expected: Integrity check passes; known warning about missing `"type": "module"` may appear.
  - Console: Only known warning allowed.
- Lint
  - Action: `pnpm lint`
  - Expected: Lint passes.
  - Console: No errors.
- Vitest
  - Action: `pnpm vitest run`
  - Expected: Tests pass.
  - Console: No errors.
- Build
  - Action: `pnpm build`
  - Expected: Build succeeds.
  - Console: No errors.
- Dev
  - Action: `pnpm dev` and open app in browser.
  - Expected: App loads to dashboard.
  - Console: No errors.

## Global Navigation Expectations

- Menu order
  - Action: Inspect main nav.
  - Expected: Order is Dashboard, Kunden, Hunde, Kurse, Trainer, Kommunikation, Kalender, Finanzen, Waren.
  - Console: No errors.
- Active-state highlighting
  - Action: Click each menu item once.
  - Expected: Active highlight follows current route only.
  - Console: No errors.
- Hash correctness
  - Action: For each module, confirm URL hash matches route (e.g., `#/kunden`).
  - Expected: Hash updates exactly to route; no extra segments.
  - Console: No errors.
- Router behavior
  - Action: Use nav links to switch modules.
  - Expected: Module mounts in `#dogule-main`; layout remains once; focusHeading fires once; scroll resets to top.
  - Console: No errors.
- Global back/forward expectations
  - Action: Use browser Back then Forward after visiting two modules.
  - Expected: Correct modules re-render; active state and hash stay consistent.
  - Console: No errors.

## Global Console Expectations

- Action: Keep DevTools console open at all times.
- Expected: Zero console errors/warnings across all routes except the known Node ESM warning during CLI commands.
- Console: No in-app warnings/errors allowed.

## Module Tests

### Dashboard

#### Phase-A checklist items

- Action: Navigate to `#/` (Dashboard).
- Expected: h1 shows “Dashboard”; focus on h1; layout unchanged; scroll at top; cards use shared styles.
- Console: No errors.

#### Required linking validations

- Action: Click Kunden count card.
- Expected: Navigates to `#/kunden`; Kunden menu highlighted.
- Console: No errors.
- Action: Use browser Back to return.
- Expected: Dashboard restores; counts visible.
- Console: No errors.

#### Per-module Console Checks

- Action: Reload Dashboard.
- Expected: No console messages.
- Console: Clean.

#### Per-module back/forward checks

- Action: Navigate Dashboard → Kurse via card/link; Back; Forward.
- Expected: Routes and highlights follow history; hashes correct.
- Console: No errors.

#### Shared-component expectations

- Action: Inspect cards/links.
- Expected: Shared Cards/Buttons/Notices styling consistent; no stray variants.
- Console: No errors.

### Kunden

#### Phase-A checklist items

- Action: Navigate to `#/kunden`.
- Expected: h1 “Kunden”; focus on h1; scroll top; shared list/table/cards; loading/error/empty notices use shared components.
  - Confirm focusHeading runs once on mount.
- Console: No errors.

#### Required linking validations

- Action: Open detail of any existing Kunde.
- Expected: Detail shows linked Hunde section with links if present.
- Console: No errors.
- Action: Click a Hund link from Kunde detail.
- Expected: Navigates to Hund detail; Kunden menu un-highlighted; Hunde menu highlighted.
- Console: No errors.
- Action: Use Back to return to Kunde detail; Forward to go to Hund again.
- Expected: Details restore correctly.
- Console: No errors.

#### Per-module Console Checks

- Action: Refresh on Kunden list and detail.
- Expected: No console messages.
- Console: Clean.

#### Per-module back/forward checks

- Action: Navigate list → detail → edit; Back to detail; Back to list; Forward twice.
- Expected: Forms rehydrate with prior data; hashes correct.
- Console: No errors.

#### Shared-component expectations

- Action: Confirm Shared Cards/Buttons/Forms used for list, detail, form, notices.
- Expected: h1/h2 hierarchy intact; form rows aligned; ID read-only; Code override toggle present.
- Console: No errors.

#### CRUD with deterministic data

- Action: Click “Neu” and create Kunde with Name “Alpha Kunde 1”, Code `KND-ALPHA-1`, Ort “Alpha Ort”, Telefonnummer “0101”, Email “alpha1@example.com`.
- Expected: Save succeeds; detail shows ID read-only; Code equals `KND-ALPHA-1`; h2 sections present.
- Console: No errors.
- Action: Edit the same Kunde: toggle Code edit, set Code `KND-ALPHA-1B`, update Ort “Alpha Ort 2”.
- Expected: Detail shows updated code and Ort.
- Console: No errors.
- Action: Delete the Kunde.
- Expected: Return to Kunden list; entry removed.
- Console: No errors.
- Action: Force Empty state (if seeds allow) by deleting all entries or filtering for nonexistent term.
- Expected: Empty notice in German appears via shared component.
- Console: No errors.
- Action: Force Error (simulate by invalid hash `#/kunden/invalid`).
- Expected: Error/Not Found notice in German; layout intact.
- Console: No errors.

### Hunde

#### Phase-A checklist items

- Action: Navigate to `#/hunde`.
- Expected: h1 “Hunde”; focus on h1; scroll top; shared components; loading/error/empty notices.
- Console: No errors.

#### Required linking validations

- Action: Open Hund detail; click Besitzer Kunde link.
- Expected: Navigates to Kunden detail; Hunde menu un-highlighted; Kunden menu highlighted.
- Console: No errors.
- Action: From Hund detail, click a Kurs link (if present).
- Expected: Navigates to Kurs detail; Hunde → Kurse chain works.
- Console: No errors.

#### Per-module Console Checks

- Action: Reload list and detail.
- Expected: No console messages.
- Console: Clean.

#### Per-module back/forward checks

- Action: List → detail → edit → detail → Back → Forward.
- Expected: Hashes and active states correct; scroll resets at mount.
- Console: No errors.

#### Shared-component expectations

- Action: Confirm shared form rows, cards, notices; ID read-only; Code override toggle present.
- Expected: h1/h2 hierarchy intact.
- Console: No errors.

#### CRUD with deterministic data and linking

- Action: Create Hund “Alpha Hund 1”, Code `HND-ALPHA-1`, Besitzer = “Alpha Kunde 1” (create Kunde first if missing), Rasse optional, Notizen “Test Hund”.
- Expected: Detail shows Besitzer section linking to Kunde; ID read-only; code stored.
- Console: No errors.
- Action: Edit Hund: update Code to `HND-ALPHA-1B`, Notizen “Updated Hund”.
- Expected: Detail reflects changes; link to Besitzer remains.
- Console: No errors.
- Action: Delete Hund.
- Expected: Return to Hunde list; entry removed.
- Console: No errors.
- Action: Empty state: filter for nonexistent term or clear list after deletes.
- Expected: Empty notice in German.
- Console: No errors.
- Action: Error state: open invalid hash `#/hunde/invalid`.
- Expected: Not found/error notice shown.
- Console: No errors.

### Kurse

#### Phase-A checklist items

- Action: Navigate to `#/kurse`.
- Expected: h1 “Kurse”; focus on h1; scroll top; shared components visible; notices for loading/error/empty use shared style.
- Console: No errors.

#### Required linking validations

- Action: Open Kurs detail; click Teilnehmer Hund link and Kunde link (derived).
- Expected: Navigates to Hund detail, then Kunden detail; Back/Forward returns correctly.
- Console: No errors.
- Action: Click Trainer link in Kurs detail.
- Expected: Navigates to Trainer detail.
- Console: No errors.
- Action: From Kurs detail, click Kalender event link (if shown) or open `#/kalender/event/<id>` via link.
- Expected: Navigates to Kalender event detail with Kurs context.
- Console: No errors.

#### Per-module Console Checks

- Action: Reload list and detail.
- Expected: No console messages.
- Console: Clean.

#### Per-module back/forward checks

- Action: List → detail → edit → detail; Back to list; Forward to detail.
- Expected: Hash and active states correct; focus/scroll reset on mount.
- Console: No errors.

#### Shared-component expectations

- Action: Confirm shared forms/cards; ID read-only; Code override toggle; typeahead chips for Hunde/Kunden/Trainer.
- Expected: h1/h2 hierarchy intact; notices consistent.
- Console: No errors.

#### CRUD with deterministic data and linking

- Action: Create Kurs “Alpha Kurs 1”, Code `KURS-ALPHA-1`, assign Trainer (seeded Trainer), add Hund “Alpha Hund 1” as Teilnehmer, set Datum/Zeit deterministic (e.g., 2024-01-01 10:00), Beschreibung “Alpha Kurs Test”.
- Expected: Detail shows Trainer block with link; Teilnehmer list shows Hund and Besitzer; ID read-only; code set.
- Console: No errors.
- Action: Edit Kurs: change time to 11:00, update Code `KURS-ALPHA-1B`.
- Expected: Detail updates; Kalender event reflects new time.
- Console: No errors.
- Action: Delete Kurs.
- Expected: Return to Kurse list; entry removed; Kalender event removed.
- Console: No errors.
- Action: Empty state: filter for nonexistent term or clear list after deletes.
- Expected: Empty notice in German.
- Console: No errors.
- Action: Error state: open invalid hash `#/kurse/invalid`.
- Expected: Error/Not Found notice.
- Console: No errors.

### Trainer

#### Phase-A checklist items

- Action: Navigate to `#/trainer`.
- Expected: h1 “Trainer”; focus on h1; scroll top; shared components; notices consistent.
- Console: No errors.

#### Required linking validations

- Action: Open Trainer detail; confirm Kurseinsatz list shows Kurse linked; click a Kurs.
- Expected: Navigates to Kurs detail; Back returns to Trainer; Forward re-opens Kurs.
- Console: No errors.
- Action: In Trainer detail, confirm Finanzen summary card shows revenue if linked.
- Expected: Sums and last entries appear; links to Finanzen entries work.
- Console: No errors.
- Action: In Trainer detail, confirm Kalendereinsätze card shows events with links to Kurs and Event.
- Expected: Links open Kurs detail and Kalender event detail; both valid.
- Console: No errors.

#### Per-module Console Checks

- Action: Reload list and detail.
- Expected: No console messages.
- Console: Clean.

#### Per-module back/forward checks

- Action: List → detail → edit → detail; Back/Forward confirm state.
- Expected: Hash and highlights correct.
- Console: No errors.

#### Shared-component expectations

- Action: Confirm shared cards/forms; ID read-only; Code override toggle in form.
- Expected: h1/h2 hierarchy correct; notices shared.
- Console: No errors.

#### CRUD with deterministic data

- Action: Create Trainer “Alpha Trainer 1”, Code `TRN-ALPHA-1`, Kontakt “alpha.trainer@example.com`.
- Expected: Detail shows new trainer with empty Kurseinsatz/Kalender/Finanzen sections.
- Console: No errors.
- Action: Edit Trainer: update Code `TRN-ALPHA-1B`, Notizen “Alpha Trainer Update”.
- Expected: Detail updates.
- Console: No errors.
- Action: Delete Trainer (only if not linked); if linked, verify delete guard with Kurs list.
- Expected: Guard prevents delete when linked; otherwise delete succeeds and returns to list.
- Console: No errors.
- Action: Empty/Error states via filter or invalid hash.
- Expected: Shared empty/error notices.
- Console: No errors.

### Kalender

#### Phase-A checklist items

- Action: Navigate to `#/kalender`.
- Expected: h1 “Kalender”; focus on h1; scroll top; shared cards; loading/error/empty notices.
- Console: No errors.

#### Required linking validations

- Action: Click a Kurs-derived event block; open event detail.
- Expected: Event detail shows Kurs info and Trainer meta; links “Zum Kurs” and “Zum Trainer” work.
- Console: No errors.
- Action: Use “Zum Tag” link then Back.
- Expected: Returns to prior view; state preserved.
- Console: No errors.

#### Per-module Console Checks

- Action: Switch between Tag/Woche; reload.
- Expected: No console messages.
- Console: Clean.

#### Per-module back/forward checks

- Action: Open event detail, Back to Kalender view, Forward to event.
- Expected: Hash updates; active menu correct.
- Console: No errors.

#### Shared-component expectations

- Action: Confirm notices/cards/buttons match shared styles.
- Expected: Consistent visuals; h1/h2 order valid.
- Console: No errors.

#### Event updates

- Action: After editing Kurs time (from Kurse module), revisit Kalender.
- Expected: Event reflects updated time; no duplicates.
- Console: No errors.

### Finanzen

#### Phase-A checklist items

- Action: Navigate to `#/finanzen`.
- Expected: h1 “Finanzen”; focus on h1; scroll top; summary/filters/cards use shared components; loading/error/empty notices.
- Console: No errors.

#### Required linking validations

- Action: Open Finanzbuchung linked to Kunde and optional Kurs/Trainer.
- Expected: Detail shows Kunde link, Kurs link (if kursId), Trainer meta read-only for Kurs payments; links navigate correctly.
- Console: No errors.

#### Per-module Console Checks

- Action: Reload list/detail.
- Expected: No console messages.
- Console: Clean.

#### Per-module back/forward checks

- Action: List → detail → edit → detail; Back/Forward.
- Expected: History works; hashes accurate.
- Console: No errors.

#### Shared-component expectations

- Action: Confirm shared forms/cards/notices; ID read-only; Code override toggle present; filter card uses shared controls.
- Expected: h1/h2 hierarchy correct.
- Console: No errors.

#### CRUD with deterministic data and linking

- Action: Create Finanzbuchung “Alpha Zahlung 1”, Code `FIN-ALPHA-1`, Kunde “Alpha Kunde 1`, Typ “Bezahlt”, Betrag 100, Datum deterministic, Beschreibung “Alpha Zahlung Test”, Kurs optional referencing “Alpha Kurs 1”.
- Expected: Detail shows correct Kunde link; Trainer meta appears if Kurs has Trainer; summary updates.
- Console: No errors.
- Action: Edit entry: set Betrag 120, Code `FIN-ALPHA-1B`.
- Expected: Detail shows updated values.
- Console: No errors.
- Action: Delete entry.
- Expected: List no longer shows it.
- Console: No errors.
- Action: Empty/Error via filter or invalid hash.
- Expected: Shared notices in German.
- Console: No errors.

### Waren

#### Phase-A checklist items

- Action: Navigate to `#/waren`.
- Expected: h1 “Waren”; focus on h1; scroll top; shared list/detail/form components; notices for loading/error/empty.
- Console: No errors.

#### Required linking validations

- Action: Open Ware detail; verify Kunde link shown.
- Expected: Link opens Kunden detail; Back returns to Ware detail.
- Console: No errors.

#### Per-module Console Checks

- Action: Reload list and detail.
- Expected: No console messages.
- Console: Clean.

#### Per-module back/forward checks

- Action: List → detail → edit → detail; Back to list; Forward to detail.
- Expected: History accurate; hashes correct.
- Console: No errors.

#### Shared-component expectations

- Action: Confirm shared cards/forms/notices; ID read-only; Code optional; h1/h2 correct.
- Expected: Consistent styling.
- Console: No errors.

#### CRUD with deterministic data

- Action: Create Ware “Alpha Ware 1”, Code `WARE-ALPHA-1`, Kunde “Alpha Kunde 1`, Preis 10, Beschreibung “Alpha Ware Test”.
- Expected: Detail shows Kunde link; ID read-only.
- Console: No errors.
- Action: Edit Ware: update Preis 12, Code `WARE-ALPHA-1B`.
- Expected: Detail updates.
- Console: No errors.
- Action: Delete Ware.
- Expected: List removes it.
- Console: No errors.
- Action: Empty/Error via filter or invalid hash.
- Expected: Shared notices.
- Console: No errors.

### Kommunikation

#### Phase-A checklist items

- Action: Navigate to `#/kommunikation`.
- Expected: h1 “Kommunikation” (placeholder); focus on h1; scroll top; shared layout; placeholder content only.
- Console: No errors.

#### Required linking validations

- Action: None (no linking required).
- Expected: Section states minimal placeholder.
- Console: No errors.

#### Per-module Console Checks

- Action: Reload route.
- Expected: No console messages.
- Console: Clean.

#### Per-module back/forward checks

- Action: Navigate away then Back/Forward to Kommunikation.
- Expected: Route restores placeholder; active highlight correct.
- Console: No errors.

#### Shared-component expectations

- Action: Verify placeholder uses shared card/notice styling; h1/h2 correct if present.
- Expected: Consistent layout despite minimal content.
- Console: No errors.

## Negative Tests

### Waren not creating Finanzen entries

- Action: Create “Alpha Ware 1” with Preis 10 and save.
- Expected: Ware saved; Finanzen list unchanged.
- Console: No errors.
- Action: Navigate to `#/finanzen` and search for amount 10 or text “Alpha Ware”.
- Expected: No Finanzbuchung appears for this Ware; summary unchanged.
- Console: No errors.

### Kurse not creating Finanzen revenue

- Action: Create “Alpha Kurs 1” and assign Trainer/Hunde; do not create any Finanzbuchung.
- Expected: Kurs saved; Kalender event present; Finanzen unchanged.
- Console: No errors.
- Action: Navigate to `#/finanzen` and filter by Kunde/Trainer of the Kurs.
- Expected: No new Finanzbuchung exists; summaries unchanged.
- Console: No errors.

## Data Model and Cleanup Policy

- Action: Use hybrid data: start from seed data, create deterministic entities as listed; reuse them across modules.
- Expected: Deterministic names/codes avoid collisions; links stay valid.
- Console: No errors.
- Action: Cleanup at end of each module where feasible (delete created entities) except when needed for later linking steps (keep Alpha Kunde 1, Alpha Hund 1, Alpha Kurs 1, Alpha Trainer 1, Alpha Zahlung 1 until all linking tests finish, then delete in Finanzen/Kurse/Hunde/Kunden order).
- Expected: DB returns to seed state after full script.
- Console: No errors.

## Branch and Commit Lock

- Branch: feature/station35-trainer-finanzen
- Commit: d41cd5a
- Action: Verify testing happens on this ref; do not mix with newer commits unless instructed.
- Expected: Deterministic baseline.
- Console: No errors.

## Appendix

- Known warning: package.json missing "type": "module" Node warning during integrityCheck; acceptable.
