# PHASE A – SELF-TEST CHECKLIST

## 0. Purpose

- Validate each module as a standalone experience in Phase A (Stations 19–26) before integration resumes.
- Ensure router/layout, shared components, and data helpers work consistently across modules.
- Surface UI text exactly as shipped (German strings), while instructions remain in English.

## 1. Universal Module Checks

- Router: Module loads via Clean Hash Router (`#/modulename`), mounts into `#dogule-main`, no stray DOM injection.
- Layout: Shared layout (Header/Nav/Footer) remains intact; active nav link is highlighted and ARIA `aria-current="page"` set.
- Shared Components: Uses shared cards/buttons/forms/notices; no inline styles replacing shared styles.
- Accessibility: Headings follow `h1` (module title) then `h2`/`h3` hierarchy; links/buttons have discernible text; form inputs have labels.
- Empty/Error States: Show German strings `Keine Daten vorhanden.` (empty) and `Fehler beim Laden der Daten.` (error) via shared helpers.
- Scroll/Focus: On navigation, container is cleared, scrolled to top, and focusable elements are reachable via keyboard.
- Data Hooks: Uses shared CRUD/API helpers only (no local mock arrays); respects ID/code rules.

## 2. CRUD Checks

- List renders all records from the mock API and supports refresh without stale data.
- Create: Form blockiert nur zwingend nötige Felder (kein Hard-Stop bei weichen Checks), zeigt Success/Error Notice.
- Read: Detail view shows IDs (`id`) and user-facing codes (`code`); shows linked entities where applicable.
- Update: Edits persist in mock API helpers; nur harte Pflichtfelder blockieren, Codes editierbar mit Override-Toggle.
- Delete: Confirm flow prevents accidental removal; removal updates lists and dependent views.
- Integrity: After CRUD ops, calling `runIntegrityCheck()` stays silent (no thrown errors) in DEV.

## 3. Module-Specific Requirements

- Dashboard: Cards reflect current mock data; navigation links jump to respective modules.
- Kunden: Shows zugeordnete Hunde, Kurse, Finanzen, Warenverkäufe; supports CRUD with `kundenId` enforcement.
- Hunde: Shows Besitzer (Kunde) and Kurszuordnung; prevents orphaned `kundenId`.
- Kurse: Lists Teilnehmer (`kundenIds`/`hundIds`), Trainer, Termine; prevents missing Trainer/Kurs in calendar links.
- Trainer: CRUD, Verfügbarkeiten anzeigen; Kurs-Referenzen stay consistent.
- Kalender: Einträge zeigen Kurs/Trainer-Bezug; date/time formatting is consistent.
- Finanzen: Zahlungen pro Kunde; leere/offene Posten korrekt markiert.
- Waren: Verkäufe pro Kunde; Beträge konsistent mit Finanzen.
- Kommunikation: Placeholder module loads with shared layout/components; strings in German.

## 4. Phase A Acceptance Criteria

- All Universal and CRUD checks pass for every module without manual fixtures.
- No console errors/warnings during navigation, CRUD, or reloads.
- `pnpm lint`, `pnpm test` (vitest + happy-dom), and `pnpm build` succeed locally.
- DOMAIN_MODEL, MASTER, and STATUS reflect any model changes introduced during Phase A work.
- Obsolete assets are archived (not loaded by router/build); repository remains Vite-only.
