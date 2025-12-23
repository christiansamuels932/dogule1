# Security Authorization Matrix (Station 57)

Source of truth for role × action permissions, audit expectations, and alert hooks. Deny-by-default applies; any action not listed here is denied.

## Machine-Readable Matrix (source for CI)

```yaml
version: 1
roles:
  - unauthenticated
  - system
  - admin
  - staff
  - trainer
actions:
  - id: auth.login
    module: auth
    description: Interactive login
    roles:
      admin: allowed
      staff: allowed
      trainer: allowed
      system: denied
      unauthenticated: allowed
    preconditions:
      - Account must be active; lockout blocks login.
    audit: always
    alerts: failed_login

  - id: auth.refresh
    module: auth
    description: Refresh access token
    roles:
      admin: allowed
      staff: allowed
      trainer: allowed
      system: denied
      unauthenticated: denied
    preconditions:
      - Valid refresh token, not revoked, not expired.
    audit: always
    alerts: denied_action

  - id: auth.logout
    module: auth
    description: Logout/revoke session
    roles:
      admin: allowed
      staff: allowed
      trainer: allowed
      system: conditional
      unauthenticated: denied
    preconditions:
      - System may revoke sessions it owns (job cleanup).
    audit: always
    alerts: denied_action

  - id: auth.lockout
    module: auth
    description: Account lockout triggered after failed attempts
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - Triggered automatically by auth service after threshold.
    audit: always
    alerts: failed_login

  - id: auth.denied
    module: auth
    description: Denied auth attempt (invalid/expired token, lockout)
    roles:
      admin: allowed
      staff: allowed
      trainer: allowed
      system: allowed
      unauthenticated: allowed
    preconditions:
      - N/A (represents failure events).
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.view_thread
    module: kommunikation
    description: View chat threads/messages
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: conditional
      unauthenticated: denied
    preconditions:
      - staff must be assigned to the customer/channel.
      - trainer must be a participant or assigned to related kurs/hund.
      - system limited to delivery/archiver job ids.
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.send_message
    module: kommunikation
    description: Post/send chat message
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - staff: assigned to customer/channel.
      - trainer: participant or assigned trainer.
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.edit_own_message
    module: kommunikation
    description: Edit own chat message
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: denied
      unauthenticated: denied
    preconditions:
      - Only author may edit; time-boxed (tbd in Station 60).
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.delete_own_message
    module: kommunikation
    description: Delete own chat message
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: denied
      unauthenticated: denied
    preconditions:
      - Only author; keep tombstone; moderation retains audit trail.
    audit: always
    alerts: denied_action

  - id: kommunikation.chat.moderate_delete
    module: kommunikation
    description: Moderator removal of any message
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - Staff only if granted moderation scope; system only for automated abuse filters.
    audit: always
    alerts: denied_action

  - id: kommunikation.groupchat.retention.prune
    module: kommunikation
    description: Retention pruning for groupchat messages
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only (system:retention) with retention enabled.
    audit: always
    alerts: denied_action

  - id: kommunikation.groupchat.retention.prune.noop
    module: kommunikation
    description: Retention pruning noop event
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only (system:retention) with retention enabled or prune disabled.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.publish
    module: kommunikation
    description: Publish infochannel notice
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - Admin-only in MVP.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.view
    module: kommunikation
    description: View infochannel notices
    roles:
      admin: allowed
      staff: conditional
      trainer: allowed
      system: conditional
      unauthenticated: denied
    preconditions:
      - Trainers see only notices targeted to them.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.confirm
    module: kommunikation
    description: Confirm infochannel notice
    roles:
      admin: denied
      staff: denied
      trainer: allowed
      system: denied
      unauthenticated: denied
    preconditions:
      - Trainer must be targeted by the notice.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.sla.run
    module: kommunikation
    description: Run SLA reminder/escalation job for infochannel
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only with service credentials.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.reminder
    module: kommunikation
    description: Emit reminder events for pending infochannel confirmations
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only.
    audit: always
    alerts: denied_action

  - id: kommunikation.infochannel.escalation
    module: kommunikation
    description: Emit escalation events for overdue infochannel confirmations
    roles:
      admin: denied
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job only.
    audit: always
    alerts: denied_action

  - id: kommunikation.email.view
    module: kommunikation
    description: View email send logs
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - System only for delivery monitoring jobs.
    audit: always
    alerts: denied_action

  - id: kommunikation.email.send_customer
    module: kommunikation
    description: Send single email to customer
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - Admin-only compose; system uses service credentials.
    audit: always
    alerts: denied_action

  - id: kommunikation.email.send_bulk
    module: kommunikation
    description: Send bulk/broadcast email
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - System only for approved campaigns with opt-in list; rate limits apply.
    audit: always
    alerts: denied_action

  - id: kalender.view_day
    module: kalender
    description: View day schedule
    roles:
      admin: allowed
      staff: allowed
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - Trainer sees only assigned events.
    audit: success-only

  - id: kalender.view_week
    module: kalender
    description: View week schedule
    roles:
      admin: allowed
      staff: allowed
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - Trainer sees only assigned events.
    audit: success-only

  - id: kalender.create_event
    module: kalender
    description: Create calendar event
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - Staff only within assigned modules/customers.
      - Trainer only for own courses.
    audit: always
    alerts: denied_action

  - id: kalender.update_event
    module: kalender
    description: Update calendar event
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: allowed
      unauthenticated: denied
    preconditions:
      - Same as create; cannot reassign trainer without permission.
    audit: always
    alerts: denied_action

  - id: kalender.delete_event
    module: kalender
    description: Delete calendar event
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - Staff only if creator/owner and no active participants; system only for sync/cleanup.
    audit: always
    alerts: denied_action

  - id: imports.start
    module: imports
    description: Start import job
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System must use approved job id; dry-run preferred first.
    audit: always
    alerts: imports_failure

  - id: imports.dry_run
    module: imports
    description: Dry-run import
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job id allowlist.
    audit: always
    alerts: imports_failure

  - id: imports.cancel
    module: imports
    description: Cancel running import
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - System only if owns the job.
    audit: always
    alerts: imports_failure

  - id: imports.view_status
    module: imports
    description: View import status/logs
    roles:
      admin: allowed
      staff: allowed
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions: []
    audit: success-only

  - id: finanzen.list_entries
    module: finanzen
    description: List finance entries
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: denied
      unauthenticated: denied
    preconditions:
      - Staff only for assigned customers/mandates.
      - Trainer only for own kurs/trainer revenue view.
    audit: always

  - id: finanzen.view_entry
    module: finanzen
    description: View finance entry
    roles:
      admin: allowed
      staff: conditional
      trainer: conditional
      system: denied
      unauthenticated: denied
    preconditions:
      - Same as list_entries.
    audit: always

  - id: finanzen.create_entry
    module: finanzen
    description: Create finance entry
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - Staff allowed only for assigned scope and template-based inputs.
    audit: always
    alerts: finanzen_mutation

  - id: finanzen.update_entry
    module: finanzen
    description: Update finance entry
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - Staff allowed only for assigned scope; dual-control recommended.
    audit: always
    alerts: finanzen_mutation

  - id: finanzen.delete_entry
    module: finanzen
    description: Delete finance entry
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - None (admin-only).
    audit: always
    alerts: finanzen_mutation

  - id: finanzen.export_report
    module: finanzen
    description: Export finance data/report
    roles:
      admin: allowed
      staff: conditional
      trainer: denied
      system: denied
      unauthenticated: denied
    preconditions:
      - Staff only for assigned scope; outputs redacted of PII where possible.
    audit: always
    alerts: denied_action

  - id: backups.run_backup
    module: backups
    description: Run backup job
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions:
      - System job id allowlist.
    audit: always
    alerts: backup_failure

  - id: backups.restore_backup
    module: backups
    description: Restore from backup
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - System only for automated recovery drills with approval token.
    audit: always
    alerts: backup_failure

  - id: config.view_settings
    module: config
    description: View operational configuration
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: allowed
      unauthenticated: denied
    preconditions: []
    audit: success-only

  - id: config.update_settings
    module: config
    description: Update operational configuration
    roles:
      admin: allowed
      staff: denied
      trainer: denied
      system: conditional
      unauthenticated: denied
    preconditions:
      - System only via controlled rollout jobs.
    audit: always
    alerts: config_change
```

## Human-Readable View (selected highlights)

- **Deny-by-default**: any action not listed above is denied.
- **Unauthenticated**: no access to app data; may only reach login/static assets (not shown in matrix).
- **System role**: allowed only for defined jobs (imports, backups, calendar sync, email sender); must carry job id for audit.
- **Finanzen**: admin-only for destructive operations; staff limited to scoped create/update; trainer read-only for own revenue.
- **Kommunikation**: admin/staff moderate; trainers limited to participant channels; bulk email restricted to admin/system.
- **Kalender**: trainer scoped to own events; staff scoped to assignments; deletes restricted.
- **Imports/Backups/Config**: admin/system only; cancellations/restores are audited and alert-worthy.

## Preconditions (reference)

- **Assigned scope**: staff actions require assignment to the customer/mandate/module; trainers require ownership/assignment to kurs/hund.
- **System job allowlist**: system actions must carry a known job id and be executed with service credentials.
- **Dual-control (recommended)**: high-risk finance updates and config changes should require secondary approval (to be implemented in later stations).

## Audit & Alerts Summary (alignment)

- Audit required for all writes and for any action marked `audit: always`; success-only actions may be logged at lower verbosity but still chained.
- Alert hooks correspond to thresholds in `DOGULE1_SECURITY_BASELINE.md` (failed_login, denied_action, finanzen_mutation, imports_failure, backup_failure, config_change).

## CI Gate Expectation

- This YAML block is the source for future CI (Station 60): every route/action in code must map to an entry here; missing entries or invalid states (`allowed|denied|conditional` only) will fail CI once the gate is implemented.
- Any station that adds/changes routes/actions must update this block to keep CI green.
