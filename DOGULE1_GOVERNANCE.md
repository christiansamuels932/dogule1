# DOGULE1 Governance — Stations 50–70

Purpose: single source for roadmap control, gating, owners, and station readiness rules for Stations 50–70.

## Station List and Validation

Validated order: yes — 2025-12-08

| Station | Title                                                | Notes                                                   |
| ------- | ---------------------------------------------------- | ------------------------------------------------------- |
| 50      | Roadmap Governance & Definitions of Ready            | Planning/docs only                                      |
| 51      | Storage Contract Finalization (E1)                   | Storage schema/versioning/PII/consistency               |
| 52      | Security Baseline Finalization (F1–F3 summary)       | Authn/authz/TLS/secret rules                            |
| 53      | Authorization Matrix & Audit Plan (F2, F4)           | Role×action, audit, alerts                              |
| 54      | Storage Access Layer Architecture (E2)               | Access pattern, migration order                         |
| 55      | Authentication & Sessions MVP Implementation         | Login/session/lockout/2FA toggle                        |
| 56      | Authorization Enforcement Layer                      | Middleware/enforcement/unauthorized UX                  |
| 57      | Transport, Secrets, and Config Hardening             | TLS/HSTS/CSRF/secret storage/rotation cadence           |
| 58      | Logging, Rate Limits, and Alerts Foundation          | Limits/audit hooks/alerts/health                        |
| 59      | Storage Layer Implementation (Core Entities)         | Real storage + migration + backup/restore dry run       |
| 60      | Kommunikation Module Skeleton (Read-Only)            | Nav/state machine/access controls                       |
| 61      | Groupchat Core                                       | Send/read markers/notifications/retry                   |
| 62      | Infochannel with Confirmation Flow                   | Admin-only posts/confirmations/escalations              |
| 63      | Email Integration MVP (Send-Only)                    | Compose→send/status/audit/abuse guardrails              |
| 64      | Outlook Auth & Contact Mapping                       | Token lifecycle/mapping/conflicts/shutdown              |
| 65      | Outlook → Kalender Import (Preview-First)            | Mapping/duplicate detection/preview/limits/SSRF defense |
| 66      | Storage & Security Hardening Pass                    | Drills/failure injection/rate-limit review              |
| 67      | UI Design Tokens & Layout Application (Core Screens) | Tokens/layout/a11y/perf/localization                    |
| 68      | Mobile Readiness (Kommunikation + Dashboard)         | Breakpoints/bottom-nav/offline-read                     |
| 69      | Rollout Prep & Playbooks                             | Incident/playbooks/kill switches/risk review            |
| 70      | Public Rollout (V1)                                  | Staged launch/telemetry/support/rollback                |

## Gating Rules

- Station 52 precedes 53; 53 precedes 56.
- Storage (51, 54) and Security (52, 53, 57, 58) must be green before integrations (60–65) begin.
- Integrations (60–65) must be green before UI/Mobile (67–68) begin.
- Hardening (66) precedes rollout (69–70).
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

- Fields: Date; Owner (Planner); Branch; PR link; Summary; Notes/Issues; Exit confirmation.
- Tests: list commands run or `Tests: none` if N/A.

## How to Update Governance

- Changes to this file require Planner review and Human approval via PR; record a short changelog line in this section with date and PR link.
- Record blocker resolutions in `status.md` (Issues/Notizen) and, if governance rules change, append the change note here.
- Storage/schema source of truth for Stations 50–70: `DOGULE1_SYSTEM_BASELINE_V2.md` (defines IDs, PII/residency, invariants, migration).

Changelog:

- 2025-12-08: Initial governance for Stations 50–70.
