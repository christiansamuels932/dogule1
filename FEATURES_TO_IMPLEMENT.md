# Temp Ideas & Features (84U)

Purpose: capture future ideas/features so they are not lost before formal implementation.
Status: scratchpad; do not track active work here. Move items into stations when ready.

## Ideas

- [ ]

## Features

### Feature A — App header card

- [ ] Add top-level app header card with `/home/ran/codex/dogule1/attachments/material/FontanasLogo.png` (181x73) on the left and large white "DOGULE" text to the right; both in the same frame/card as the app title.

### Feature B — Align module list in left nav

- [ ] Align module list so the module titles in the left nav (Dashboard/Kunden/Hunde/Kurse/Trainer/Zertifikate/Kommunikation/Kalender/Finanzen/Waren) start exactly where the module names in the overview grid start; current left offset is too far left.

### Feature C — Remove module title + description blocks

- [ ] Remove module title + description blocks from each module page (e.g., "Kunden" title and its description text like "Übersicht über alle Kundinnen und Kunden ...").

### Feature D — Update login credentials

- [ ] Update login credentials: main login user "Rifo" with password "rifo6087"; adjust competencies/roles to match.

### Feature E — Login password reset

- [ ] Add login password reset: send confirmation code to `christiansamuels932@gmail.com` and validate before allowing password change.

## Notes

-

## Detailed features

### Feature 1 — Kunden: Heimatort (Detailview)

Change type: UI-only, minimal.

Definition: Add a new read-only field „Heimatort“ to the Kunde Detailview.

Scope:

- Kunden → Detailview shows label Heimatort
- Displays stored value if present
- Empty value shows standard empty placeholder
- No create/edit flow required in this step

Out of scope:

- No validation
- No forms
- No filters/search
- No migration work

### Feature 2 — Modul Anmeldung (Copy-Paste Intake, Draft-based)

Purpose: Convert a pasted registration email into structured drafts (Kunde, Hund) and require explicit user confirmation before anything is persisted.

Module:

- New module: Anmeldung

UI:

- Textarea: „Anmeldung (E-Mail einfügen)“
- Button: „Auswerten“
- Preview panels:
  - Kurs (assignment required)
  - Kunde (Entwurf)
  - Hund (Entwurf)
- Actions:
  - Kunde speichern
  - Hund speichern

Input:

- Plain-text email, fixed known format.
- Copy-paste only (no attachments, no HTML).

Parsing & Mapping:

- Extract:
  - Kursname (header + Kurs line)
  - Kunde from Angaben zur Person
  - Hund from Angaben zum Hund
- Ignore fields: Aufmerksam durch, Newsletter, AGB.
- Normalize dates (DD.MM.YYYY).

Kurs Handling (Blocking Rule):

- If the referenced Kurs does not exist:
  - User must manually assign an existing Kurs.
  - No saving of Kunde/Hund allowed until Kurs is assigned.

Draft Logic (Mandatory):

- After parsing, nothing is persisted.
- Create Dashboard Draft Cards:
  - “Neuer Kunde (Entwurf)”
  - “Neuer Hund (Entwurf)”
- Drafts remain visible until explicitly saved or discarded.

Partial Save Rule:

- If Hund parsing fails:
  - Kunde may not be auto-finalized.
  - Both remain in Draft state on Dashboard until resolved.

Persistence (on user confirmation):

- When user confirms save:
  - Create Kunde.
  - Create Hund, linked to Kunde.
  - Create Historie entry (both Kunde and Hund):
    - Neue Anmeldung für den Kurs {{Kursname}} – {{heutiges Datum}}

Structural Change (Important):

- Remove the following sections entirely from Kunde and Hunde detail views:
  - Kurse dieses Hundes
  - Finanzübersicht
  - Offene Beträge
  - Zahlungshistorie
- Replace with exactly two sections only:
  - Historie
    - Short entries (date, author = Trainer, text)
    - Used for Anmeldungen, Rapporte, Notizen
  - Zertifikate
    - List of linked certificates
- This applies to both Kunde and Hund.

Error Handling:

- Section-level errors (Kurs/Kunde/Hund).
- Allow manual correction in preview before saving.
- Clear message if Kurs assignment is missing (blocking).

Out of Scope:

- Deduplication / matching existing records
- Email automation
- Storing ignored fields

### Feature 3 — Kurs → Zertifikat Hintergrundgrafik (PNG)

Purpose: Ensure each Zertifikat uses the correct background PNG based on the Kurs.

Data Model:

- Kurs gets a new field: zertifikatHintergrund
- Type: PNG image reference (file/path)
- Optional, but required to generate a Zertifikat

Rules:

- Each Kurs can have:
  - its own unique PNG, or
  - share a PNG with other Kurse
- No image = Zertifikat generation blocked for that Kurs

UI (Kurse):

- Kurs Detail / Edit:
  - Field: „Zertifikat Hintergrund (PNG)“
  - Upload or select existing PNG
  - Show preview thumbnail if assigned
  - If missing, show warning:
    - „Kein Zertifikat-Hintergrund zugewiesen“

Zertifikat Generation:

- When generating a Zertifikat:
  - System resolves Kurs → zertifikatHintergrund
  - Uses that PNG as the background layer
- No fallback image.
- Hard fail if none assigned.

Asset Source:

- PNG files are provided by the client
- Stored locally (project-controlled path)
- No dynamic fetching, no external URLs

Out of Scope:

- Image editing
- Versioning of certificate designs
- Automatic image inference

### Feature 5 — Dashboard: Geburtstage + Geburtstagsemail (Kunde & Hund)

Purpose: Show all birthdays of the current date and allow the user to either dismiss them or trigger a birthday email via Outlook with predefined text.

Dashboard Behavior:

- New Dashboard section/card: „Heutige Geburtstage“
- Lists both:
  - Kunden (Geburtsdatum)
  - Hunde (Wurfdatum)
- Each entry shows:
  - Name (Kunde or Hund)
  - Type (Kunde / Hund)
  - Geburtstag (date)

Actions (per entry):

- Two buttons, inline:
  - Verwerfen
    - Marks the birthday as handled
    - Removes it from Dashboard
    - No email sent
  - Geburtstagsemail
    - Opens Outlook
    - Pre-fills:
      - Recipient (mailto: target)
      - Subject
      - Body with predefined birthday text
    - After click, entry is considered handled and removed from Dashboard

Email Handling — Clear Answer:

- Yes, this is possible without an internal Dogule email system.
- Use a standard mailto: link, which Outlook (desktop or web, depending on system default) will open.
- What works reliably:
  - Recipient
  - Subject
  - Plain-text body (URL-encoded)
- What does not work reliably:
  - HTML formatting
  - Attachments
  - Tracking send status
- This fits your requirement exactly.
- Conclusion:
  - ➡️ No Dogule-internal email system needed.
  - ➡️ Outlook + mailto: is sufficient and simplest.

Audit / Logging:

- When either button is clicked:
  - Create an Audit/Historie entry on the Kunde (not Hund):
    - Geburtstag {{Kunde|Hund}} {{Name}} – {{Verworfen|E-Mail vorbereitet}} – {{Datum}}
- Audit text must be human-readable.

Rules:

- Birthday entries appear once per day.
- Once handled (Verwerfen or Geburtstagsemail), they do not reappear the same day.
- No automatic sending; user action required.

Out of Scope:

- Automatic scheduled emails
- Delivery tracking
- HTML mail templates

### Feature 6 — Rapporte: Trainer Draft → Admin Bestätigung

Purpose: Allow Trainer to write short reports (Rapporte) for Kunde or Hund, but require Admin confirmation before they become permanent history entries.

Roles:

- Trainer
  - Extremely limited login
  - Can create Rapporte only
- Admin
  - Confirms or discards Rapporte

Trainer Flow:

- Trainer logs in with own login.
- Can search for:
  - Kunde or
  - Hund
- Selects the correct record.
- Clicks „Rapport eröffnen“.
- Sees a short text field:
  - Free text note
  - System auto-adds:
    - Date/time
    - Author = Trainer
  - Submits → Rapport is created as Draft.

Draft State (Mandatory):

- Submitted Rapporte are not written to Kunde/Hund yet.
- They appear on the Dashboard as „Neue Rapporte (Entwurf)“.
- Each draft shows:
  - Kunde / Hund name
  - Author (Trainer)
  - Date
  - Text preview

Admin Dashboard Actions (per Rapport):

- Bestätigen
  - Rapport is persisted
  - Written to Historie of:
    - Kunde and/or
    - Hund (depending on origin)
- Verwerfen
  - Rapport is deleted
  - No persistence anywhere
- After either action, the draft is removed from the Dashboard.

Historie (Result of Bestätigung):

- Stored entry format:
  - Date
  - Author (Trainer)
  - Text
- Appears under Historie in:
  - Kunde Detail
  - Hund Detail (if applicable)

Rules:

- Trainers cannot:
  - Edit confirmed Rapporte
  - See other trainers’ drafts
  - Confirm or delete Rapporte
- Admin confirmation is required for persistence.
- Drafts survive reloads until confirmed or discarded.

Out of Scope:

- Editing Rapporte after submission
- Attachments
- Notifications
- Automatic approval

### Feature 7 — Super simples Trainer-Login (Rapport-only)

Purpose: Provide a minimal, locked-down Trainer login whose only job is to create Rapporte for Kunden or Hunde.

Authentication:

- Each Trainer has their own login.
- No shared accounts.
- No role switching.

Trainer Capabilities (and nothing else):

- After login, Trainer can only:
  - Search
  - Kunden
  - Hunde
  - Select
  - One Kunde or one Hund
  - Create Rapport
    - Button: „Rapport eröffnen“
    - One short text field
    - System auto-adds:
      - Date/time
      - Author = Trainer
    - Submit
    - Rapport is saved as Draft
    - Trainer sees a simple confirmation: „Rapport eingereicht (wartet auf Bestätigung)“

Hard Restrictions:

- Trainer cannot:
  - See Dashboard
  - See Finanzen
  - See Zertifikate
  - See Historie (except their own just-submitted text preview)
  - Edit or delete Rapporte
  - Confirm or reject anything
  - Access any other module
- If a Trainer tries to access anything else → blocked.

Integration with Feature 6:

- All Trainer Rapporte go into Dashboard → Neue Rapporte (Entwurf).
- Admin must Bestätigen or Verwerfen.
- Only after Bestätigen do they appear in Historie of Kunde/Hund.

UI Characteristics:

- Extremely minimal UI
- No navigation menu
- Single-purpose screens:
  - Search
  - Detail (read-only name)
  - Rapport text field

Out of Scope:

- Trainer editing past Rapporte
- Trainer seeing confirmations
- Trainer notifications
- Permissions beyond Rapport creation

### Feature 8 — Module ausblenden (Kalender, Finanzen, Waren)

Purpose: Hide unused modules to reduce UI noise and prevent accidental access.

Scope:

- Modules to hide:
  - Kalender
  - Finanzen
  - Waren
- Hidden from:
  - Main navigation
  - Dashboard shortcuts
  - Direct links (blocked)

Behavior:

- Modules are not visible anywhere in the UI.
- Direct URL access is denied (403 or redirect).
- No data deletion; modules are disabled, not removed.

Roles:

- Applies to all roles (Admin, Trainer).

Out of Scope:

- Partial visibility
- Feature toggles per user
- Any functional changes inside the modules
