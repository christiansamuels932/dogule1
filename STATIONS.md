# STATIONS — Dogule1

Canonical station order:

1. Clarification
2. Specification
3. Design
4. Implementation
5. Verification
6. Freeze

The active station is recorded in STATUS.md.

Roadmap (Stations 85+ in smart order):

- UI polish first (header/nav/module page cleanup) to stabilize layout for later feature UI.
- Auth updates next (credentials + reset) to establish baseline access control.
- Small UI/data additions before large workflow changes (Heimatort, Zertifikat background).
- Large workflow + structural changes before features that depend on Historie and drafts.
- Role-gated Rapporte and Trainer login after core Historie/Dashboard draft mechanics exist.
- Module hiding last to avoid blocking development or verification of hidden modules.

Station 85 — App header card (FontanasLogo + DOGULE title)
Station 86 — Align left-nav module list with overview grid
Station 87 — Remove module title + description blocks on module pages
Station 88 — Update login credentials (Rifo / rifo6087) and roles
Station 89 — Login password reset with confirmation code to christiansamuels932@gmail.com
Station 90 — Kunden: add read-only Heimatort field in Detailview
Station 91 — Kurs → Zertifikat background PNG (zertifikatHintergrund)
Station 92 — Modul Anmeldung (copy-paste intake, drafts, course assignment gate + detail view restructure)
Station 93 — Dashboard birthdays + Outlook mailto flow
Station 94 — Rapporte: Trainer draft → Admin confirmation
Station 95 — Trainer minimal login (Rapport-only)
Station 96 — Hide modules Kalender/Finanzen/Waren (UI + direct access block)
Station 97 — NAS Deployment
Station 98 — NAS MariaDB DogTabs Kunden/Hunde Refresh
Station 99 — New Features (Schulungen + Kommunikation + Local Auth + UI fixes)
Station 101 — GUI cleanup (consistent buttons, clicks, positions)
Station 102 — Geburtstagsemails text and formatting fixes
Station 103 — Anmeldung refinement (draft fidelity, Historie split, gender inference)
Station 104 — Kurse expansion (Teilnehmer log + Kurs-only Zertifikat)
Station 105 — Zertifikat uses Hunde Rufname
Station 106 — Intermittent “Daten konnten nicht geladen werden” investigation/fix

Battleplan (Stations 85+):

Station 85 — App header card (FontanasLogo + DOGULE title)
Goal:

- Add a top-level app header card that includes the Fontanas logo and white "DOGULE" text as a single header frame.
  Dependencies:
- Asset at `/home/ran/codex/dogule1/attachments/material/FontanasLogo.png` (181x73).
  Scope:
- Header card includes logo on the left and large white "DOGULE" text on the right.
- Both elements are inside the same frame/card as the app title.
- Responsive layout (desktop and mobile).
  Steps:
- Identify the shared app header component and current title layout.
- Insert logo image with fixed display size (181x73) and left alignment.
- Add "DOGULE" text node to the same header container with white color.
- Ensure the card/frame background, padding, and alignment match the existing app header style.
- Update any necessary CSS variables or layout tokens for consistent sizing.
  Deliverables:
- Header card shows logo + DOGULE text side-by-side on all pages.
- No layout shifts or overlap at common breakpoints.
  Verification:
- Visual check on dashboard and at least one module page.
- Confirm logo path loads and no broken image placeholders appear.

Station 86 — Align left-nav module list with overview grid
Goal:

- Align left nav module titles to start at the same horizontal position as module names in the overview grid.
  Dependencies:
- Overview grid layout must already be stable (post Station 85).
  Scope:
- Align left nav items (Dashboard/Kunden/Hunde/Kurse/Trainer/Zertifikate/Kommunikation/Kalender/Finanzen/Waren).
- Remove extra left offset in nav list without breaking icons or collapse behavior.
  Steps:
- Measure current left padding/margin of nav labels and overview grid labels.
- Update nav item container padding/margin or label offset to match grid alignment.
- Verify alignment for active and hover states.
  Deliverables:
- Nav text starts exactly where overview grid text starts.
  Verification:
- Visual check with and without nav selection; check at least two viewport widths.

Station 87 — Remove module title + description blocks on module pages
Goal:

- Remove redundant module title and description blocks from each module page.
  Scope:
- Remove blocks like "Kunden" title + descriptive text (e.g., "Übersicht über alle Kundinnen und Kunden ...").
- Applies to all module pages.
  Steps:
- Locate module page layout template or shared module header component.
- Remove title/description block rendering or disable with a feature flag if shared with other needed UI.
- Ensure remaining page content shifts up cleanly without extra whitespace.
  Deliverables:
- Module pages show their content without title/description blocks.
  Verification:
- Visual check for at least three module pages (e.g., Kunden, Hunde, Kurse).

Station 88 — Update login credentials (Rifo / rifo6087) and roles
Goal:

- Set the main login user to "Rifo" with password "rifo6087" and adjust competencies/roles to match.
  Scope:
- Seed user data, authentication fixtures, and any login placeholder text.
  Steps:
- Identify seed or default user config and update username/password.
- Update roles/competencies for the main user to match expected permissions.
- Confirm login placeholders and docs reflect the new credentials.
  Deliverables:
- Login works with "Rifo" / "rifo6087".
- Role permissions align with expected admin capabilities.
  Verification:
- Manual login and access to core modules.

Station 89 — Login password reset with confirmation code
Goal:

- Add a password reset flow with a confirmation code sent to `christiansamuels932@gmail.com`.
  Scope:
- UI entry point on login screen.
- Code generation, sending, validation, and password update.
  Steps:
- Add "Passwort vergessen" entry point on login screen.
- Create backend endpoint or handler to generate a confirmation code and send to the specified email.
- Store the code with expiry and validate before allowing password change.
- Add UI flow: request code → enter code → set new password.
- Ensure rate limiting or single active code behavior to prevent reuse.
  Deliverables:
- Working password reset flow with email confirmation and validation.
  Verification:
- Manual end-to-end test: request code, validate, set new password, login with new password.
  Out of scope:
- Multi-user or configurable email targets.
- HTML email templates or attachments.

Station 90 — Kunden: add read-only Heimatort field in Detailview
Goal:

- Add a read-only "Heimatort" field to the Kunde detail view.
  Scope:
- Display label "Heimatort" with stored value or standard empty placeholder.
  Steps:
- Identify Kunde detail view layout and insert the new field in the info section.
- Read from the existing data model (no creation or editing).
- Ensure empty values render a consistent placeholder style.
  Deliverables:
- Kunde detail shows Heimatort in read-only form.
  Verification:
- Visual check with Kunde records that have/omit the field.
  Out of scope:
- Any new form input, validation, or migration work.

Station 91 — Kurs → Zertifikat background PNG (zertifikatHintergrund)
Goal:

- Ensure each certificate uses the Kurs-specific background PNG.
  Scope:
- Add `zertifikatHintergrund` field to Kurs.
- Update Kurs detail/edit UI to assign PNG and show preview.
- Block Zertifikat generation if no PNG is assigned.
  Steps:
- Extend Kurs data model with `zertifikatHintergrund` (image reference/path).
- Add UI field to upload/select an existing PNG and show thumbnail preview.
- Add warning message when missing: "Kein Zertifikat-Hintergrund zugewiesen".
- Update certificate generation to resolve the Kurs field and fail hard if missing.
- Store PNGs locally in a project-controlled path; no external URLs.
  Deliverables:
- Kurs can store a PNG reference and show preview.
- Zertifikat generation uses the assigned PNG and fails if none.
  Verification:
- Assign PNG on Kurs and generate Zertifikat; confirm correct background.
  Out of scope:
- Image editing, versioning, or auto-detection of backgrounds.

Station 92 — Modul Anmeldung (copy-paste intake, drafts, course assignment gate + detail view restructure)
Goal:

- Convert a pasted registration email into drafts (Kunde, Hund), require manual confirmation before persistence, and simplify detail view sections.
  Scope:
- New module "Anmeldung" with copy-paste intake UI.
- Draft creation on Dashboard for Kunde/Hund.
- Blocking rule: course assignment required before saving.
- Structural change: remove sections from Kunde/Hund detail views and keep only Historie + Zertifikate.
  Steps:
- Create new module route and nav entry for "Anmeldung".
- Build UI: textarea "Anmeldung (E-Mail einfügen)", button "Auswerten", and preview panels for Kurs/Kunde/Hund.
- Implement parsing for the fixed email format; extract Kursname, Kunde, Hund; ignore Aufmerksam durch, Newsletter, AGB; normalize dates (DD.MM.YYYY).
- Add draft objects for Kunde/Hund and render Dashboard draft cards ("Neuer Kunde (Entwurf)", "Neuer Hund (Entwurf)").
- Enforce course assignment: if Kurs missing, require manual selection; block saving Kunde/Hund until assigned.
- Enforce partial save rule: if Hund parsing fails, Kunde remains draft and cannot be finalized.
- On confirmation: create Kunde, create Hund linked to Kunde, and add Historie entry for both:
  - "Neue Anmeldung für den Kurs {{Kursname}} – {{heutiges Datum}}"
- Restructure Kunde/Hund detail views:
  - Remove: Kurse dieses Hundes, Finanzübersicht, Offene Beträge, Zahlungshistorie.
  - Keep only: Historie (date, author=Trainer, text) and Zertifikate.
- Add section-level errors for Kurs/Kunde/Hund and allow manual corrections before save.
  Deliverables:
- Anmeldung module with parsing, previews, drafts, and confirmation flow.
- Kunde/Hund detail views show only Historie + Zertifikate sections.
  Verification:
- Paste valid email; confirm drafts appear and save after Kurs assignment.
- Confirm Historie entry creation and section removal in Kunde/Hund.
  Out of scope:
- Deduplication, email automation, storage of ignored fields.

Station 93 — Dashboard birthdays + Outlook mailto flow
Goal:

- Show today's birthdays and allow dismiss or Outlook mailto actions with audit logging.
  Scope:
- Dashboard card "Heutige Geburtstage" listing Kunden (Geburtsdatum) and Hunde (Wurfdatum).
- Two inline actions per entry: Verwerfen and Geburtstagsemail.
- Audit/Historie entry on Kunde for each action.
  Steps:
- Add Dashboard card that aggregates today's Kunden/Hunde birthdays.
- For each entry, include Name, Type (Kunde/Hund), and date.
- Implement Verwerfen to mark handled for the day and remove from dashboard.
- Implement Geburtstagsemail to open mailto with recipient, subject, and URL-encoded body; mark handled after click.
- Write Historie entry on the Kunde:
  - "Geburtstag {{Kunde|Hund}} {{Name}} – {{Verworfen|E-Mail vorbereitet}} – {{Datum}}"
- Ensure entries appear only once per day after handling.
  Deliverables:
- Birthday card with actions and audit logging.
  Verification:
- Test with sample data; confirm once-per-day behavior.
  Out of scope:
- Automatic sending, delivery tracking, HTML templates.

Station 94 — Rapporte: Trainer draft → Admin confirmation
Goal:

- Allow Trainer to submit Rapporte drafts and require Admin confirmation before they become Historie entries.
  Scope:
- Trainer creates draft report for Kunde or Hund.
- Admin reviews drafts on Dashboard and confirms or discards.
  Steps:
- Add report creation UI: "Rapport eröffnen" with short text field; auto-add date/time and author=Trainer.
- Store Rapporte as draft objects (not in Kunde/Hund Historie).
- Add Dashboard section "Neue Rapporte (Entwurf)" showing draft cards with Kunde/Hund, author, date, preview.
- Implement Admin actions:
  - Bestätigen: persist to Historie (Kunde and/or Hund).
  - Verwerfen: delete draft with no persistence.
- Enforce trainer restrictions: no edit after submit, no access to others' drafts, no confirm/delete ability.
  Deliverables:
- Draft Rapporte flow with Admin confirmation and Historie persistence.
  Verification:
- Create draft as Trainer; confirm Admin sees it and can approve/deny.
  Out of scope:
- Attachments, notifications, editing after submission.

Station 95 — Trainer minimal login (Rapport-only)
Goal:

- Provide a minimal Trainer login limited to creating Rapporte drafts only.
  Scope:
- Separate Trainer logins, no role switching.
- Minimal UI: search, detail (read-only), rapport text field.
  Steps:
- Create Trainer role permissions that block all modules except Rapport creation flow.
- Implement minimal Trainer UI without main navigation or dashboard access.
- Reuse Rapporte draft creation from Station 94.
- Enforce hard restrictions and block unauthorized routes with 403/redirect.
  Deliverables:
- Trainer can only search Kunde/Hund and submit Rapporte drafts.
  Verification:
- Login as Trainer; attempt to access blocked modules; verify denial.
  Out of scope:
- Trainer notifications, edits, or approvals.

Station 96 — Hide modules Kalender/Finanzen/Waren (UI + direct access block)
Goal:

- Hide unused modules across UI and block direct access.
  Scope:
- Hide Kalender, Finanzen, Waren from main navigation and dashboard shortcuts.
- Block direct URL access (403 or redirect).
  Steps:
- Remove or feature-flag these modules in nav and dashboard.
- Add route guards to prevent direct access for all roles.
- Ensure no data deletion or internal behavior changes inside those modules.
  Deliverables:
- Modules are not visible or accessible from the UI.
  Verification:
- Try direct URL access; confirm blocked behavior.
  Out of scope:
- Per-user feature toggles or partial visibility.

Station 101 — GUI cleanup (consistent buttons, clicks, positions)
Goal:

- Standardize UI actions so the same buttons and clicks behave consistently across all modules, with consistent placement.
  Scope:
- Align primary/secondary actions (Create/Edit/Delete/Back/Save/Cancel) across modules.
- Ensure identical labels and click behaviors for equivalent actions.
- Normalize button placement within module list/detail/create/edit views.
  Steps:
- Inventory all module action buttons and click behaviors.
- Define canonical labels, ordering, and placement for shared actions.
- Update each module to follow the canonical action layout.
- Verify no behavior regressions (same action does the same thing everywhere).
  Deliverables:
- Consistent action button placement and behavior across modules.
  Verification:
- Manual check on at least four modules (Kunden, Hunde, Kurse, Kommunikation).
  Out of scope:
- New features or layout redesign beyond action placement.

Station 102 — Geburtstagsemails text and formatting fixes
Goal:

- Fix birthday email content: correct names, spacing, spelling, and add new text blocks.
  Scope:
- Adjust mailto subject/body formatting for birthday emails.
- Fix name rendering and spacing issues.
- Correct spelling and add required new text blocks.
  Steps:
- Review current birthday mailto composition and identify text issues.
- Update templates/strings to correct names, spacing, and spelling.
- Insert new text blocks as specified in the birthday email content.
  Deliverables:
- Corrected birthday email content with updated blocks.
  Verification:
- Trigger birthday email action and verify content in the mail client.
  Out of scope:
- Automated sending or SMTP delivery changes.

Station 103 — Anmeldung refinement (draft fidelity, Historie split, gender inference)
Goal:

- Ensure Anmeldung drafts match the email content exactly, ignore spacing, and propagate each bullet point into both drafts and Kunde/Hund details; split Historie for Rapporte vs Anmeldung; infer gender from Herr/Frau.
  Scope:
- Drafts must mirror the email data (content fidelity, spacing-insensitive parsing).
- Each email point appears in the Anmeldung draft and in Kunde/Hund detail views.
- Kurs Anmeldungen remain in Kundenhistorie but also have separate Historie categories: Rapporte vs Anmeldungen.
- Herr/Frau in the email sets gender automatically.
  Steps:
- Make email parsing spacing-insensitive while preserving content.
- Persist parsed points and surface them in draft + Kunde/Hund detail.
- Introduce separate Historie categories/sections for Rapporte and Anmeldungen.
- Map "Herr"/"Frau" to gender field during draft creation.
  Deliverables:
- Drafts and detail views reflect full email content; Historie split is visible; gender inferred reliably.
  Verification:
- Paste a sample Anmeldung email with multiple points and verify all outputs.
  Out of scope:
- Redesign of the Anmeldung UI beyond required content placement.

Station 104 — Kurse expansion (Teilnehmer log + Kurs-only Zertifikat)
Goal:

- Add a Teilnehmer history/log per Kurs, allow adding Kunde/Hund with start date, and restrict Zertifikat creation to Kurs context only.
  Scope:
- Kurs detail shows a log of confirmations (definitive attendance, not just Anmeldung).
- Kurs overview has "Kunde eintragen" flow: select Kunde, then Hund, then Startdatum; log entry created.
- Kurs detail includes a Teilnehmer Historie-style section (similar to Kunden overview).
- Zertifikat creation is only allowed from Kurse once Teilnehmer data exists.
  Steps:
- Add participant log storage and UI section in Kurs detail.
- Implement “Kunde eintragen” dialog/flow from Kurs overview and log the entry.
- Enforce Zertifikat creation path to be Kurs-only.
  Deliverables:
- Kurs shows Teilnehmer log; entries are created via Kurs overview; Zertifikat is gated to Kurs flow.
  Verification:
- Create a log entry and confirm it appears in Kurs detail; verify Zertifikat only from Kurs.
  Out of scope:
- Changing existing Anmeldung flow outside of course logging.

Station 105 — Zertifikat uses Hunde Rufname
Goal:

- Use the dog's Rufname (not Name) in the certificate output.
  Scope:
- Certificate template and any related display uses Rufname.
  Steps:
- Update certificate generation to reference Rufname.
- Verify any preview or stored outputs use Rufname.
  Deliverables:
- Zertifikat content shows Rufname instead of Name.
  Verification:
- Generate a certificate and verify the displayed dog name.

Station 106 — Intermittent “Daten konnten nicht geladen werden” investigation/fix
Goal:

- Identify and fix the intermittent “Daten konnten nicht geladen werden” error that forces re-login and loses unsaved form data.
  Scope:
- Reproduce the error reliably if possible.
- Identify root cause (auth/session/token/state/data fetch failures).
- Prevent forced logout and data loss during form entry.
  Steps:
- Add diagnostics to capture the failure context (API response, auth state, timing).
- Trace the failure path and fix the underlying issue.
- Add a safeguard to preserve in-progress form data if a transient error occurs.
  Deliverables:
- Error no longer occurs or is gracefully handled without data loss.
  Verification:
- Manual test across common flows (create Kunde/Hund/Kurs) without reload/login.
