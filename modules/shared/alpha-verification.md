# Alpha Verification – Station 18

## Dashboard

- **Routing:** Hash router mounts `modules/dashboard/index.js` into `#dogule-main`, clearing containers on every navigation; no inline handlers remain.
- **UI Consistency:** Each section renders via `createSectionHeader` and shared `createStandardCard` helpers so repeated mounts reuse identical markup.
- **Empty States:** Quick actions and metrics call the shared `createEmptyState("Keine Daten vorhanden.", "")` helper when no entries exist.
- **Error States:** Builder functions wrap their logic in try/catch and insert `createNotice("Fehler beim Laden der Daten.", ...)` on failure with `[DASHBOARD_ERR_*]` logging.
- **Detail/List/Form Views:** Dashboard is read-only; no entity detail/list/form screens apply.
- **Console Cleanliness:** Only `[DASHBOARD_ERR_*]` errors inside catch blocks remain; normal navigation emits no console output.
- **ID Override:** Module has no entity IDs or input fields; exemption recorded in source.
- **Alpha Limitations:** Data remains mock/static; live telemetry and editable widgets are deferred until post-Station 18.

## Kunden

- **Routing:** `modules/kunden/index.js` resets the section and mounts list/detail/form routes using hash anchors (`#/kunden/...`) so rerenders do not duplicate DOM.
- **UI Consistency:** List/detail/form/finance surfaces are wrapped with `createSectionHeader` + shared cards; shared helpers render badges, notices, and buttons.
- **Empty States:** Every card body clears before re-render and uses `createEmptyState("Keine Daten vorhanden.", "")` for empty customers, Hunde relations, or finances.
- **Error States:** All data fetches are inside try/catch blocks that log `[KUNDEN_ERR_*]` and show `createNotice("Fehler beim Laden der Daten.", ...)` within the affected card.
- **Detail Views:** Detail view loads under the shared layout header, rebuilds all subsections via cards, and scrolls to top each time.
- **List Views:** The old table was replaced by anchor-wrapped cards; metadata rows live inside cleared card bodies, and repeated mounts remain idempotent.
- **Form Views:** Forms use shared `createFormRow` inputs, shared button helpers, validation hints, and the manual ID override toggle wired identically to Hunde.
- **Console Cleanliness:** Only `[KUNDEN_ERR_*]` errors remain and only fire under failures.
- **ID Override:** “ID manuell ändern” is available on create/edit, blocking empty IDs and reverting to generated codes when override is disabled.
- **Alpha Limitations:** CRUD uses mock API storage; external integrations (billing, NAS sync) are deferred beyond Station 18.

## Hunde

- **Routing:** Hunde module mirrors Kunden routing—sections reset on each navigation, anchors drive list/detail/form routes, and scroll resets fire on mount.
- **UI Consistency:** Detail/list/form cards rely on shared helpers (section headers, cards, notices); finance/relations reuse the standardized layout.
- **Empty States:** Every empty-capable card clears before insertion and calls `createEmptyState("Keine Daten vorhanden.", "")`.
- **Error States:** API calls are wrapped in try/catch with `[HUNDE_ERR_*]` logging and shared error notices placed in the impacted card bodies.
- **Detail Views:** Detail header uses `createSectionHeader("Hund")` with dynamic subtitle; subsections mount as discrete cards with cleared DOM.
- **List Views:** Rebuilt into anchor-wrapped cards with shared metadata lists; rerendering the list never duplicates entries.
- **Form Views:** Forms employ shared form rows/buttons, validation hints, and include the ID override toggle with German copy.
- **Console Cleanliness:** Only `[HUNDE_ERR_*]` inside catch blocks; no logs on successful interactions.
- **ID Override:** Manual override control matches Kunden spec; empty IDs rejected and the default ID resurfaces when override is disabled.
- **Alpha Limitations:** Data is mock-only; syncing Hunde documents/photos awaits later stations.

## Kurse

- **Routing:** `modules/kurse/index.js` clears the section, scrolls to top, and resolves list/detail/form routes through hash anchors (`#/kurse/...`) without inline handlers.
- **UI Consistency:** List/detail/form screens now run entirely on shared section headers, cards, badges, notices, and buttons; no bespoke headings remain.
- **Empty States:** Shared `createEmptyState("Keine Daten vorhanden.", "")` renders for empty lists, linked Hunde/Kunden, and finance sections after bodies clear.
- **Error States:** All API calls sit in try/catch blocks that log `[KURSE_ERR_*]` codes and insert the shared error notice via `createErrorNotice()`.
- **Detail Views:** The detail stack is composed of standardized cards (overview, Notizen, Metadaten, link/finance sections) with scroll reset and deduped DOM.
- **List Views:** Table markup was replaced with anchor-wrapped cards produced by `createCourseListItem()`, including metadata rows and shared badges.
- **Form Views:** The Stammdaten card houses a shared-form layout, validation hints, shared buttons, and the new Kurs-ID override control with German toggle copy.
- **Console Cleanliness:** Only `[KURSE_ERR_*]` logs remain, emitted solely within catch blocks to avoid noise during normal use.
- **ID Override:** Create/edit forms load a read-only Kurs-ID row plus the “ID manuell ändern” toggle; empty IDs are prevented via form-row hints.
- **Alpha Limitations:** Data remains mock; Kurs finance calculations and duplicate prevention rely on mock API consistency until live backend work (post-Station 18).
