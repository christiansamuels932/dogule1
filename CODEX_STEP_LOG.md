# Codex Step Log — Station 21 (Phase A Kunden)

Context: Station 21 – Kunden Single-Module Completion. Self-test gap analysis requested; no code changes yet.

Progress:

- Read PHASEA_SELFTEST_CHECKLIST.md, DOGULE1_MASTER.md, baseline/README, shared API/helpers (kunden/hunde/kurse/finanzen, CRUD, integrity check), shared components templates/helpers, router/main.js.
- Scanned complete Kunden module (modules/kunden/index.js + index.html) with line references noted in gap report.
- Domain model file is missing (DOMAIN_MODEL.md not in repo), so field/relationship alignment can’t be verified.

Findings for Kunden vs. Phase A checklist (to act on next):

- IDs vs. codes: Detail view shows only code alias (`kundenCode || id`) and no immutable `id` field; form toggle edits code, not the true id (see modules/kunden/index.js:295-307, 501-597).
- Waren linkage absent: Kunden detail does not load or show Warenverkäufe; only Hunde, Kurse, Finanzen are rendered (modules/kunden/index.js:752-980).
- Delete leaves orphans: Deleting a Kunde doesn’t cascade to Hunde/Waren/Zahlungen; integrity check would fail if run post-delete (modules/kunden/index.js:378-404, integrityCheck.js).
- Kurs relation bias: Kurse are discovered only via Hunde → hundIds; Kurse with kundenIds but no hundIds stay hidden (modules/kunden/index.js:329-366).
- Heading semantics: createSectionHeader renders h2 with aria-level; no explicit h1 on Kunden views, may miss checklist “h1 then h2/h3” requirement (templates.html + Kunden usage).
- Domain model unknown: Need DOMAIN_MODEL.md or confirmation to ensure fields/relations are complete.
- Positives: Hash routing works for list/detail/create/edit; shared components/empty/error states are used; validations and ID override toggle exist; scroll/focus reset implemented; uses only shared mock APIs.

Next actions:

1. Add immutable id display and clarify code override toggle per MASTER rules.
2. Add Waren section using shared API and empty/error states.
3. Decide on cascade/warning behavior on delete to avoid orphaning relations and integrity failures.
4. Expand Kurs discovery to include kundenIds-only entries if domain model expects it.
5. Address heading hierarchy if h1 is required by checklist.
6. Obtain/restore DOMAIN_MODEL.md to validate field/relationship coverage.
