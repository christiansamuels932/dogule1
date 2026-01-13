# DOGULE1 Protocol — Agent Collaboration Rules

Purpose: operational rules for Planner (ChatGPT) and Builder (Codex). Authority hierarchy: GOVERNANCE > PROTOCOL > MASTER > STATUS. Station rules live in MASTER; progress lives in STATUS; role details live in `agents.md`.

Core rules

- One step at a time; no silent scope expansion.
- English for instructions/discussion; German for UI copy and examples.
- Planner defines scope, acceptance, verification; Builder executes only approved scope.
- No background jobs/automation without explicit gating and auditability.
- pnpm is authoritative; no migrations unless explicitly approved.
- Legacy capture artifacts (`migration/legacy/station61/capture_*`) are immutable; CI guards enforce this.

Dependencies & references

- Invariants and authority: `DOGULE1_GOVERNANCE.md`.
- Station definitions and dependencies: `DOGULE1_MASTER.md` + `Master-II-Path.md`.
- Progress ledger: `status.md`.
- Roles and interaction contract: `agents.md`.
