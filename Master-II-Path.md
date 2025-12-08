# Master-II Path — First Public Rollout (Stations 50+)

Purpose: concrete path from current state to first public rollout, starting at Station 50. Each station includes clear outcomes and exit criteria. Security and storage are first-class; no module ships without them.

## Station 50 — Roadmap Governance & Definitions of Ready

- Outcomes: confirm station order; publish DoR templates for Phases E–I; assign owners.
- Exit: signed-off DoR format; `status.md` updated with station list; owners identified.

## Station 51 — Storage Contract Finalization (E1)

- Outcomes: canonical storage spec with schemas, IDs, versioning, PII/residency flags, integrity checks, concurrency/locking assumptions, rollback expectations, failure-injection plan.
- Exit: `DOGULE1_SYSTEM_BASELINE_V2.md` drafted; mock→real migration mapping drafted; checksum/scan cadence defined.

## Station 52 — Security Baseline Finalization (F1–F3 summary)

- Outcomes: authn/authz model, password/2FA policy, session/token rules, TLS/HSTS requirements, cookie flags, secret-storage approach, CSRF/injection defense baseline.
- Exit: `DOGULE1_SECURITY_BASELINE.md` initial version; rate-limit table skeleton; threat-model summary.

## Station 53 — Authorization Matrix & Audit Plan (F2, F4)

- Outcomes: role×action matrix for Kommunikation, Kalender, imports; deny-by-default enforcement points; audit events list; alert thresholds; tamper-evident logging strategy.
- Exit: matrix published; audit+alert tables added to security baseline; CI gate defined for permission coverage.

## Station 54 — Storage Access Layer Architecture (E2)

- Outcomes: shared vs per-module access pattern; module migration order; dual-mode (mock+real) strategy; backup locations/mounts documented.
- Exit: architecture note approved; contract tests plan ready; ownership table completed.

## Station 55 — Authentication & Sessions MVP Implementation

- Outcomes: local login (admin/trainer/staff), secure password hashing, session tokens with expiry/refresh, logout/revoke, login failure/lockout handling, admin-only 2FA toggle ready.
- Exit: auth service merged behind feature flag; tests for login/lockout/expiry; secrets stored per baseline.

## Station 56 — Authorization Enforcement Layer

- Outcomes: centralized authz middleware using Station 53 matrix; deny-by-default; unauthorized UX patterns; admin-only zones enforced (infochannel post, imports, backups).
- Exit: middleware live; permission unit/contract tests; audit entries for denied attempts.

## Station 57 — Transport, Secrets, and Config Hardening

- Outcomes: TLS 1.3/HSTS configured for environments; secure cookies; CSRF defense in place; secret storage wired (vault/encrypted store); key rotation cadence documented and scheduled.
- Exit: security smoke test passes; rotation drill script/guide ready; configs free of hardcoded secrets.

## Station 58 — Logging, Rate Limits, and Alerts Foundation

- Outcomes: rate limits for login, chat send, infochannel post, email send, import; audit logging for authn/authz, config changes; alerting hooks for failures/suspicious activity; health checks.
- Exit: limits enforced; alert destinations configured; dashboards or log review plan documented.

## Station 59 — Storage Layer Implementation (Core Entities)

- Outcomes: real storage for Kunden/Hunde/Kurse/Trainer with schema versioning, integrity checks, backup job; migration tool from mock for these entities.
- Exit: dual-mode switch works; CRUD contract tests green; backup+restore dry run.

## Station 60 — Kommunikation Module Skeleton (Read-Only)

- Outcomes: navigation/tabs (Chats, Infochannel, Emails, System); state machine (loading/empty/error/offline); list/detail shells consuming mock+real adapter; access controls applied.
- Exit: UI skeleton merged; authz enforced; logging for navigation/filter actions.

## Station 61 — Groupchat Core

- Outcomes: single groupchat room backed by storage; ordering/retention rules; per-user read markers; send/retry/backoff behavior; notifications inside Kommunikation; rate limits enforced.
- Exit: end-to-end send/read in test; audit on sends; unread counts accurate after refresh.

## Station 62 — Infochannel with Confirmation Flow

- Outcomes: admin-only posting, targeting rules, confirmation UX for trainers, escalation/reminders, audit trail, rate limits; optional comments policy enforced (default: none).
- Exit: admin can post; trainers confirm; late confirmations visible; alerts for missing confirms after SLA.

## Station 63 — Email Integration MVP (Send-Only)

- Outcomes: compose→send flow; allowed fields defined; Outlook send connector with token handling; send status surfaced; spam/abuse thresholds; audit logging.
- Exit: send-only works in test/stage; failure UX; kill switch documented; SPF/DKIM/DMARC alignment plan.

## Station 64 — Outlook Auth & Contact Mapping

- Outcomes: chosen auth method (delegated/service); token lifecycle; contact matching rules; conflict handling; scoped permissions; shutdown switch.
- Exit: mapping table/logic implemented; tests for conflicts; tokens stored/rotated per baseline.

## Station 65 — Outlook → Kalender Import (Preview-First)

- Outcomes: entry point (ICS upload or API pull); field mapping; duplicate detection; preview/diff UI; recurrence policy (flatten/ignore MVP); rate limits; SSRF/zip-bomb defenses.
- Exit: controlled import with logs; alert on failures; undo/cleanup path defined.

## Station 66 — Storage & Security Hardening Pass

- Outcomes: failure-injection run on storage; restore drill; secret rotation drill; audit/log integrity check; permission and rate-limit review after integrations.
- Exit: drills documented; issues fixed; sign-off for public exposure candidate.

## Station 67 — UI Design Tokens & Layout Application (Core Screens)

- Outcomes: apply design tokens/layout primitives to Dashboard + Kommunikation; accessibility pass (keyboard/contrast); performance budgets; localization-ready formatting.
- Exit: UI conforms to `UI_GUIDE_V2`; empty/error states consistent; lint/CI checks for a11y.

## Station 68 — Mobile Readiness (Kommunikation + Dashboard)

- Outcomes: breakpoints; bottom navigation; touch targets; simplified views; offline-read scope for chat history/schedule; offline error UX.
- Exit: responsive views verified on phone/tablet; cache/eviction rules implemented; auth/session flows verified on mobile.

## Station 69 — Rollout Prep & Playbooks

- Outcomes: incident playbook validated; monitoring/alert runbook; kill switches tested (email/import); rate-limit tuning; final risk review.
- Exit: go/no-go checklist green; owners on-call assigned; rollback plan written.

## Station 70 — Public Rollout (V1)

- Outcomes: staged rollout to initial users; telemetry verification; support channel live; rapid patch path defined.
- Exit: rollout completed or halted with documented reasons; status logged in `status.md`.
