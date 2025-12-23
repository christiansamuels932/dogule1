# DOGULE1 Governance — Stations 50–74

Purpose: single source for roadmap control, gating, owners, and station readiness rules for Stations 50–74.

Normative scope: this file defines authority, invariants, and roadmap control. PROTOCOL carries agent behavior; MASTER carries station definitions; STATUS logs progress. Hierarchy: GOVERNANCE > PROTOCOL > MASTER > STATUS.

## Station List and Validation

Suffix legend: `R` = lifecycle/retention, `K` = Kommunikation, `E` = Email/Outlook line.

Validated order: yes — 2025-12-08

| Station | Title                                                | Notes                                                   |
| ------- | ---------------------------------------------------- | ------------------------------------------------------- |
| 50      | Roadmap Governance & Definitions of Ready            | Planning/docs only                                      |
| 51      | Storage Contract Finalization (E1)                   | Storage schema/versioning/PII/consistency               |
| 52      | Security Baseline Finalization (F1–F3 summary)       | Authn/authz/TLS/secret rules                            |
| 53      | Migration Engine Skeleton & Dry-Run (E2a)            | CLI skeleton, mapper stubs, registry, dry-run only      |
| 54      | Storage Adapters & Checksums (E2b)                   | Atomic write path, checksum tooling, migration writes   |
| 55      | Integrity Scanner & CI Integration (E2c)             | Schema/FK/invariant/PII scanner wired to CI             |
| 56      | Migration Rehearsal & Cutover Prep (E2d)             | Full mock→real rehearsal, rollback drills, playbook     |
| 57      | Authorization Matrix & Audit Plan (F2, F4)           | Role×action, audit, alerts                              |
| 58      | Storage Access Layer Architecture (E3)               | Access pattern, migration order                         |
| 59      | Authentication & Sessions MVP Implementation         | Login/session/lockout/2FA toggle                        |
| 60      | Authorization Enforcement Layer                      | Middleware/enforcement/unauthorized UX                  |
| 61      | Transport, Secrets, and Config Hardening             | TLS/HSTS/CSRF/secret storage/rotation cadence           |
| 62      | Logging, Rate Limits, and Alerts Foundation          | Limits/audit hooks/alerts/health                        |
| 63      | Storage Layer Implementation (Core Entities)         | Real storage + migration + backup/restore dry run       |
| 64      | Kommunikation Module Skeleton (Read-Only)            | Nav/state machine/access controls                       |
| 65      | Groupchat Core                                       | Send/read markers/notifications/retry                   |
| 66R     | Groupchat Retention Enforcement                      | Retention/TTL/prune/audit/alerts                        |
| 67K     | Infochannel with Confirmation Flow                   | Admin-only posts/confirmations/escalations              |
| 67E     | Email Integration MVP (Send-Only)                    | Compose→send/status/audit/abuse guardrails              |
| 68E     | Outlook Auth & Contact Mapping                       | Token lifecycle/mapping/conflicts/shutdown              |
| 69E     | Outlook → Kalender Import (Preview-First)            | Mapping/duplicate detection/preview/limits/SSRF defense |
| 70E     | Storage & Security Hardening Pass                    | Drills/failure injection/rate-limit review              |
| 71      | UI Design Tokens & Layout Application (Core Screens) | Tokens/layout/a11y/perf/localization                    |
| 72      | Mobile Readiness (Kommunikation + Dashboard)         | Breakpoints/bottom-nav/offline-read                     |
| 73      | Rollout Prep & Playbooks                             | Incident/playbooks/kill switches/risk review            |
| 74      | Public Rollout (V1)                                  | Staged launch/telemetry/support/rollback                |

Stations 61–63 are foundational and closed; downstream stations depend on them but must not redefine their rules.

## Gating Rules

- Storage contract (51) precedes migration start (53); migration chain is sequential 53 → 54 → 55 → 56.
- Security baseline (52) must be green before migration cutover (56) and before downstream auth/security stations (57–62).
- Auth/Security (57–62) and migration (53–56) must be green before integrations (64–69) begin.
- Integrations (64–69) must be green before UI/Mobile (71–72) begin.
- Hardening (70) precedes rollout (73–74).
- Any blocker triggers either reopening the station or adding a follow-up station before proceeding.

## Branch Naming and PR Governance

- Branch naming: `feature/stationXX-name` (mandatory).
- PR flow: Codex opens PR; Planner reviews; Human merges unless explicitly delegated.
- Blocking findings: document in PR + `status.md`; resolve by reopening station or creating follow-up; update this file if governance changes.

## Owner Roles

- Planner: scope, requirements, acceptance definition, review of PR content.
- Codex: execution, code/docs changes, commits, PR creation.
- Human: merge authority; may delegate merge in writing.

## STATUS.md Entry Standard

- Follow the template defined at the top of `status.md` (Title, Kontext, Ergebnis, Tests, Issues, Notizen).
- Tests must list commands and outcomes; use `Tests: none` only if no tests exist.

## How to Update Governance

- Changes to this file require Planner review and Human approval via PR; record a short changelog line in this section with date and PR link.
- Record blocker resolutions in `status.md` (Issues/Notizen) and, if governance rules change, append the change note here.
- Storage/schema source of truth for Stations 50–70: `DOGULE1_SYSTEM_BASELINE_V2.md` (defines IDs, PII/residency, invariants, migration).

Changelog:

- 2025-12-08: Initial governance for Stations 50–70.
- 2026-01-XX: Renumbered Stations 53–56 to Migration & Integrity (E2a–E2d) per Station 52 plan; downstream stations shifted accordingly.
