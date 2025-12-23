# Master-II Path — First Public Rollout (Stations 50+)

Purpose: concrete path from current state to first public rollout, starting at Station 50. Each station includes clear outcomes and exit criteria. Security and storage are first-class; no module ships without them. Suffix legend: `R` = lifecycle/retention, `K` = Kommunikation.

## Station 50 — Roadmap Governance & Definitions of Ready

- Outcomes: confirm station order; publish DoR templates for Phases E–I; assign owners.
- Exit: signed-off DoR format; `status.md` updated with station list; owners identified.

## Station 51 — Storage Contract Finalization (E1)

- Outcomes: canonical storage spec with schemas, IDs, versioning, PII/residency flags, integrity checks, concurrency/locking assumptions, rollback expectations, failure-injection plan.
- Exit: `DOGULE1_SYSTEM_BASELINE_V2.md` drafted; mock→real migration mapping drafted; checksum/scan cadence defined.

## Station 52 — Security Baseline Finalization (F1–F3 summary)

- Outcomes: authn/authz model, password/2FA policy, session/token rules, TLS/HSTS requirements, cookie flags, secret-storage approach, CSRF/injection defense baseline.
- Exit: `DOGULE1_SECURITY_BASELINE.md` initial version; rate-limit table skeleton; threat-model summary.

## Station 53 — Migration Engine Skeleton & Dry-Run (E2a)

- Outcomes: offline CLI skeleton with SourceAdapter, Mapper stubs per module, Legacy ID Registry design, ValidationPipeline (schema-only), BatchRunner, and dry-run command (no writes).
- Exit: deterministic dry-run reports (no mutations), mapping registry format fixed, plan wired to Station 52 baseline; idempotent behavior confirmed on sample data.

## Station 54 — Storage Adapters & Checksums (E2b)

- Outcomes: TargetAdapter with atomic write path (temp→fsync→rename), checksum tooling (entity hash + Merkle roots), integration with registry/mappers, migrate command writing v1 candidate storage.
- Exit: migration writes succeed in dev environment; checksum metadata emitted; rollback-safe temp handling validated.

## Station 55 — Integrity Scanner & CI Integration (E2c)

- Outcomes: Integrity scanner covering schema/FK/invariants/PII, schema drift detection, checksum verification; severity model (INFO/WARNING/BLOCKER); wired to CI with non-zero exit on blockers.
- Exit: scan-all/scan-module/scan-pii/scan-drift commands; CI job executes scanner; reports in machine-readable + human summary.

## Station 56 — Migration Rehearsal & Cutover Prep (E2d)

- Outcomes: full mock→real rehearsal in isolated target, rollback drill, integrity report (checksums, orphan scan, drift scan) green; cutover playbook drafted.
- Exit: documented rehearsal results, rollback validated, cutover readiness checklist approved.

## Station 57 — Authorization Matrix & Audit Plan (F2, F4)

- Outcomes: role×action matrix for Kommunikation, Kalender, imports; deny-by-default enforcement points; audit events list; alert thresholds; tamper-evident logging strategy.
- Exit: matrix published; audit+alert tables added to security baseline; CI gate defined for permission coverage.

## Station 58 — Storage Access Layer Architecture (E3)

- Outcomes: shared vs per-module access pattern; module migration order; dual-mode (mock+real) strategy; backup locations/mounts documented.
- Exit: architecture note approved; contract tests plan ready; ownership table completed.

## Station 59 — Authentication & Sessions MVP Implementation

- Outcomes: local login (admin/trainer/staff), secure password hashing, session tokens with expiry/refresh, logout/revoke, login failure/lockout handling, admin-only 2FA toggle ready.
- Exit: auth service merged behind feature flag; tests for login/lockout/expiry; secrets stored per baseline.

## Station 60 — Authorization Enforcement Layer

- Outcomes: centralized authz middleware using Station 57 matrix; deny-by-default; unauthorized UX patterns; admin-only zones enforced (infochannel post, imports, backups).
- Exit: middleware live; permission unit/contract tests; audit entries for denied attempts.

## Station 61 — Transport, Secrets, and Config Hardening

- Outcomes: TLS 1.3/HSTS configured for environments; secure cookies; CSRF defense in place; secret storage wired (vault/encrypted store); key rotation cadence documented and scheduled.
- Exit: security smoke test passes; rotation drill script/guide ready; configs free of hardcoded secrets.

## Station 62 — Logging, Rate Limits, and Alerts Foundation

- Outcomes: rate limits for login, chat send, infochannel post, import; audit logging for authn/authz, config changes; alerting hooks for failures/suspicious activity; health checks.
- Exit: limits enforced; alert destinations configured; dashboards or log review plan documented.

## Station 63 — Storage Layer Implementation (Core Entities)

- Outcomes: real storage for Kunden/Hunde/Kurse/Trainer with schema versioning, integrity checks, backup job; migration tool from mock for these entities.
- Exit: dual-mode switch works; CRUD contract tests green; backup+restore dry run.

## Station 64 — Kommunikation Module Skeleton (Read-Only)

- Outcomes: navigation/tabs (Chats, Infochannel, System); state machine (loading/empty/error/offline); list/detail shells consuming mock+real adapter; access controls applied.
- Exit: UI skeleton merged; authz enforced; logging for navigation/filter actions.

## Station 65 — Groupchat Core

- Outcomes: single groupchat room backed by storage; ordering/retention rules; per-user read markers; send/retry/backoff behavior; notifications inside Kommunikation; rate limits enforced.
- Exit: end-to-end send/read in test; audit on sends; unread counts accurate after refresh.

## Station 66R — Groupchat Retention Enforcement

- Outcomes: enforce retention/purge for global groupchat according to policy; prune TTL-violating messages deterministically; audit deletions with hash chain; SLA alerts for retention job failures; read markers stay consistent post-prune.
- Exit: retention job runs/dry-run tested; audit entries emitted; unread counts stable after prune; alerts fire on failures/missed runs.

## Station 67K — Infochannel with Confirmation Flow

- Outcomes: admin-only posting, targeting rules, confirmation UX for trainers, escalation/reminders, audit trail, rate limits; optional comments policy enforced (default: none).
- Exit: admin can post; trainers confirm; late confirmations visible; alerts for missing confirms after SLA.

## Station 70 — Storage & Security Hardening Pass

- Outcomes: failure-injection run on storage; restore drill; secret rotation drill; audit/log integrity check; permission and rate-limit review after integrations.
- Exit: drills documented; issues fixed; sign-off for public exposure candidate.

## Station 71 — UI Design Tokens & Layout Application (Core Screens)

- Outcomes: apply design tokens/layout primitives to Dashboard + Kommunikation; accessibility pass (keyboard/contrast); performance budgets; localization-ready formatting.
- Exit: UI conforms to `UI_GUIDE.md`; empty/error states consistent; lint/CI checks for a11y.

## Station 72 — Mobile Readiness (Kommunikation + Dashboard)

- Outcomes: breakpoints; bottom navigation; touch targets; simplified views; offline-read scope for chat history/schedule; offline error UX.
- Exit: responsive views verified on phone/tablet; cache/eviction rules implemented; auth/session flows verified on mobile.

## Station 73 — Rollout Prep & Playbooks

- Outcomes: incident playbook validated; monitoring/alert runbook; kill switches tested (imports); rate-limit tuning; final risk review.
- Exit: go/no-go checklist green; owners on-call assigned; rollback plan written.

## Station 74 — Public Rollout (V1)

- Outcomes: staged rollout to initial users; telemetry verification; support channel live; rapid patch path defined.
- Exit: rollout completed or halted with documented reasons; status logged in `status.md`. 
