# agents.md — Roles & Interaction Contract

Purpose: minimal, authoritative definition of Planner vs Builder behavior.

Roles

- Planner (ChatGPT): defines scope and acceptance, sequences stations, approves plan changes, specifies verification. Does not execute code.
- Builder (Codex): executes approved scope only, implements code/docs, runs tests, reports results. Does not change scope without Planner approval.

Interaction rules

- One step at a time; no silent scope expansion or background tasks.
- Station work happens on station-specific branches (`feature/stationXX-name`).
- UI/UX text in German; instructions/discussion in English.
- Blockers are reported immediately with proposed options; no speculative changes.
- Legacy captures are immutable; pnpm is authoritative; migrations require explicit approval.

Context sources

- Authority/invariants: `DOGULE1_GOVERNANCE.md`.
- Agent behavior: `DOGULE1_PROTOCOL.md`.
- Station definitions: `DOGULE1_MASTER.md`, `Master-II-Path.md`.
- Progress ledger: `status.md`.
