# Definitions of Ready (DoR) — Phases E–I

Purpose: single template set to decide when a station is ready to start. Use these for Stations 51–70 (Phases E–I).

Common usage rules

- Apply the matching phase template before starting a station.
- Log risks/assumptions in the station PR description and `status.md` (Issues/Notizen) for traceability.
- Verify upstream dependencies are green per `DOGULE1_GOVERNANCE.md` gating rules.

## Phase E — Storage Baseline & Access Layers

- Scope clarity: what storage artifacts this station must deliver.
- Dependencies cleared: upstream stations green (storage/security prerequisites).
- Risks & assumptions logged: capture in PR + `status.md`.
- Artifacts required: MASTER/STATUS updates, storage baseline docs (e.g., SYSTEM_BASELINE_V2), diagrams/tables.
- Testability: evidence such as schema/versioning docs, migration mapping, integrity/locking notes; contract test plan (if applicable).
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date: set expectation.
- Acceptance boundaries: what is explicitly out of scope.
- Exit criteria: checklist of required outputs and approvals.

## Phase F — Security Baseline & Enforcement

- Scope clarity: security artifacts (authn/authz, transport, secrets, logging).
- Dependencies cleared: storage baseline pieces in place; prior security stations green.
- Risks & assumptions logged: PR + `status.md`.
- Artifacts required: SECURITY_BASELINE, permission matrix, rate-limit/alert tables, threat-model summary.
- Testability: evidence for controls (docs, configs, planned checks); CI/policy gates if available.
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date.
- Acceptance boundaries: exclusions (e.g., no code for certain stations, or MVP-only scope).
- Exit criteria: checklist of outputs, approvals, and logging/audit hooks defined.

## Phase G — Integrations (Chats, Infochannel, Imports)

- Scope clarity: integration feature(s) and surfaces.
- Dependencies cleared: storage/security green; gating honored.
- Risks & assumptions logged: PR + `status.md`.
- Artifacts required: updates to MASTER/STATUS, Master-II-Path, relevant baselines, diagrams/flows.
- Testability: evidence such as preview/diff flows, rate-limit/audit coverage, failure/rollback paths.
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date.
- Acceptance boundaries: out-of-scope items (e.g., no attachments, recurrence deferred).
- Exit criteria: checklist of required docs, behaviors, and validations.

## Phase H — UI Tokens & Mobile Readiness

- Scope clarity: design tokens, layout patterns, accessibility/localization/performance expectations.
- Dependencies cleared: integration decisions stable; gating rules satisfied.
- Risks & assumptions logged: PR + `status.md`.
- Artifacts required: UI_GUIDE.md, MASTER/STATUS updates, component/layout references.
- Testability: evidence via screenshots/specs, a11y checks, performance budgets, responsive behavior definitions.
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date.
- Acceptance boundaries: what UI areas are excluded in this station.
- Exit criteria: checklist covering docs updated, patterns applied, and validation evidence.

## Phase I — Rollout & Operations

- Scope clarity: rollout steps, playbooks, monitoring/alerting readiness, backup/restore.
- Dependencies cleared: all gating stations green (hardening before rollout).
- Risks & assumptions logged: PR + `status.md`.
- Artifacts required: rollout plan, incident/runbooks, monitoring/alert destinations, STATUS/MASTER updates.
- Testability: evidence of drills (restore/kill switch), alert tests, rollback path.
- Reviewer roles: Planner review → Builder execution → Human merge.
- Timebox / target date.
- Acceptance boundaries: what is excluded from the rollout slice.
- Exit criteria: checklist confirming playbooks, owners, on-call, rollback, and telemetry verification steps.
