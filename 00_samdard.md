# SAMDARD.MD — SECTION HEADINGS (CANONICAL)

## PURPOSE & AUTHORITY

SAMDARD.md is the universal operating standard for all of my software projects. It defines the fixed rules, naming, structure, and workflow that apply across projects, independent of the technology stack or project scope.

Authority order (highest to lowest):

- SAMDARD.md (universal law)
- Project SPEC.md (project contract)
- Project STATUS.md (current state and next action)
- All other project files (supporting information)

00_SAMDARD.md is the governing file name. References to "SAMDARD.md" are conceptual, not a separate file.

If any document conflicts with SAMDARD.md, SAMDARD.md wins. If a project needs an exception, the exception must be explicitly written in the project's SPEC.md under an "Exceptions to SAMDARD" section.

SAMDARD.md is edited rarely. Any change to SAMDARD.md must be deliberate and treated as a formal amendment (see "Amendment Rule"). No silent edits are allowed.

This standard exists to reduce cognitive load, prevent tool-chaos, prevent scope drift, and make work repeatable even when motivation is low.

=========================================

## CORE PRINCIPLES

All projects governed by SAMDARD.md follow these non-negotiable principles:

- Files are the source of truth. Nothing exists unless it is written down in a file. ChatGPT has no authority and no memory.
- One active objective at a time. Parallel goals create confusion. At any moment, only one clear next action is allowed.
- No silent changes. Any meaningful change (scope, behavior, tools, rules) must be explicitly recorded.
- Boring beats clever. Preference is always given to simple, explicit, and readable solutions over elegant or novel ones.
- Constraints are assets. Limited tools, fixed workflows, and frozen scope reduce decision fatigue and increase output.
- Reality over plans. Standards evolve only after real use. No speculative tooling or hypothetical upgrades.
- Finish before improving. Shipping a usable version has priority over refactoring, optimizing, or beautifying.
- Repeatability over optimization. A process that can be repeated reliably is more valuable than a faster but fragile one.
- Every project must have automated checks for Build, Dependency Audit, and Lint on pull requests.

Violation of these principles is considered a process failure, not a technical one.

=========================================

## AGENT CHECKLIST (QUICK)

- Work inside exactly one Active project.
- Required files exist and are current: 00_SAMDARD.md, README.md, SPEC.md, STATUS.md, STATIONS.md (or latest version).
- STATUS.md has exactly one Next Action.
- Scope is frozen once Implementation begins.
- Tool use is within CTB; Layer 2 tools require TECH_BASELINE.md.
- Any change affecting scope, tools, structure, or workflow is reflected in STATUS.md.
- Commits and pushes are handled by Codex (not the user).

=========================================

## CTB — CODING TOOL BOX (SAMDARD-ALIGNED)

The Coding Tool Box (CTB) is defined in /home/ran/codex/SYSTEM/ctb.md. SAMDARD sets the rules; CTB.md defines the current inventory.

Using any Layer 2 (escalation) tool makes TECH_BASELINE.md mandatory for that project.

CTB updates follow the modification rules in this document; CTB.md holds the authoritative contents.

=========================================

## CODEX ROOT STRUCTURE

The Codex root (/home/ran/codex/) is the global workspace for all projects governed by SAMDARD. It defines the boundary between system-wide authority and project-local autonomy.

Nothing may exist in the Codex root unless explicitly allowed here.

CANONICAL CODEX ROOT LAYOUT
The Codex root must follow this structure exactly:

/home/ran/codex/
|-- SYSTEM/
| |-- 00_SAMDARD.md
| |-- CTB.md
| |-- (other global system documents, if explicitly approved)
|
|-- \_PROJECT_INDEX.md
|
|-- <project-name-1>/
|-- <project-name-2>/
|
`-- _ARCHIVE/
    |-- <archived-project-1>/
    `-- <archived-project-2>/

FOLDER RESPONSIBILITIES

SYSTEM/ (also written \_SYSTEM/)

- Contains global, cross-project authority.
- Holds SAMDARD and CTB.
- Defines rules that apply to all projects.
- Must be treated as read-only during project execution.

\_PROJECT_INDEX.md

- Single authoritative list of all projects.
- Records project name, lifecycle state, and next action.
- No other file may act as a project overview.

Project folders (<project-name>/)

- Fully self-contained.
- Contain all files, data, and context for that project.
- Must comply with SAMDARD project structure rules.
- Must not depend on files from other projects.

\_ARCHIVE/

- Contains Frozen or Archived projects only.
- Read-only by default.
- No active work is allowed inside \_ARCHIVE/.

ROOT-LEVEL RULES

- No loose files are allowed in /home/ran/codex/.
- No project may write into SYSTEM/ (or \_SYSTEM/).
- No project may reference another project’s files.
- All active work must occur inside exactly one project folder.
- Any deviation from this structure is forbidden unless explicitly amended in SAMDARD.

AUTHORITY RULE

- SYSTEM/ (or \_SYSTEM/) defines rules.
- Project folders execute within those rules.
- If a conflict exists, SYSTEM/ (or \_SYSTEM/) wins.

This structure exists to:

- prevent cross-project contamination,
- keep authority boundaries explicit,
- allow Codex and AI agents to operate deterministically.

=========================================

## CANONICAL FILE SET

Every project governed by SAMDARD uses a small, fixed set of canonical files. These files define structure, intent, and state. No other documents may replace their role.

Only the files listed here are allowed to carry authority.
All canonical filenames are case-insensitive unless explicitly stated otherwise.

MANDATORY FILES (ALWAYS PRESENT)

00_SAMDARD.md

- Universal operating law. Applies before any project-specific rule.

README.md

- One-page explanation of what the project is and how to run or use it.

SPEC.md

- The functional contract of the project. Defines what the system must do and must not do.

STATUS.md

- Single source of truth for current state and next action.
- Contains only:
  - current status
  - blocking issues
  - exactly one next step

STATIONS.md

- Canonical list of all stations for the project.
- Must be completed before project start.
- Read-only during execution; do not edit in-place.
- When station changes are necessary, create a new versioned file in the project root
  (STATIONS_v1.md, STATIONS_v2.md, STATIONS_v3.md, etc.). The latest version is authoritative.

\_PROJECT_INDEX.md

- Single authoritative index of all projects and their lifecycle state.

CONDITIONAL FILES (ONLY WHEN EXPLICITLY NEEDED)

TECH_BASELINE.md

- Allowed technologies and constraints specific to this project.

CTB.md

- Authoritative inventory of tools; SAMDARD defines rules, CTB.md defines contents.

EXECUTION_RULES.md

- Work discipline rules when complexity or multiple agents are involved.

DECISIONS.md

- Records irreversible or costly decisions with brief rationale.

DATA_MODEL.md

- Canonical data structures when persistence exists.

OUT_OF_SCOPE.md

- Explicit list of forbidden features or areas.

ERROR_CODE_REGISTRY.md

- Defined error codes and meanings, only if error codes are used.

FEATURES_TO_IMPLEMENT.md

- Sole file for listing future features to be implemented later.
- Must not include active tasks or replace STATUS.md.
- Must live at the project root only; no copies in subfolders.

FORBIDDEN BY DEFAULT (RESERVED NAMES)
The following file names are reserved but must not exist unless explicitly activated by the project SPEC:

- TODO.md
- TEST_PLAN.md
- RUNBOOK.md
- ENV.md / ENV.example
- DEPENDENCIES.md
- LICENSE.md
- CONTRIBUTING.md
- CODEOWNERS

Their responsibilities are either absorbed elsewhere or considered premature for solo work.

FILE AUTHORITY RULES

- Each canonical file has exactly one responsibility.
- No file may duplicate another file's role.
- If information fits multiple files, it belongs in the higher-authority file.
- If a file is missing, its responsibility does not exist.

This prevents drift, duplication, and forgotten context.

=========================================

## PROJECT FOLDER STRUCTURE

All projects follow a predictable, minimal folder structure. Folders exist only when they serve a clear purpose. No speculative directories are allowed.

ROOT-LEVEL STRUCTURE (CANONICAL)
Each project lives in its own root folder and may contain only the following at top level:

- 00_SAMDARD.md
- README.md
- SPEC.md
- STATUS.md
- optional canonical files (per Section 4)
- project-specific folders as defined below

No other root-level clutter is allowed.

ALLOWED FOLDERS (CONDITIONAL)
Folders may exist only if their purpose applies to the project:

- src/ — Source code. Required only for code-based projects.
- data/ or storage/ — Application state or persisted data. Only when data exists.
- attachments/ — User-uploaded or externally attached files.
- exports/ — Generated outputs (reports, CSVs, PDFs).
- scripts/ — Repeatable automation scripts. No one-off helpers.
- backups/ — Backups or snapshots, only if backups are actually performed.
- migrations/ — Schema or data evolution, only if persistence evolves over time.
- fixtures/ — Test data, only when testing exists.
- logs/ — Local development logs only. Must not be committed.

FORBIDDEN STRUCTURE PATTERNS

- Deep nesting without justification
- Multiple folders serving the same purpose
- “misc”, “temp”, or “old” folders
- Tool-generated folders committed without intent
- If a folder does not clearly answer why it exists, it must not exist.

STRUCTURAL DISCIPLINE RULE

- Folder creation is a decision, not a default.
- Any non-obvious folder must be explained in either README.md or SPEC.md.
- Removing unused folders is preferred over preserving “just in case” structure.
- Structure exists to reduce thinking, not to mirror complexity.

=========================================

## PROJECT LIFECYCLE

Every project governed by SAMDARD follows a simple, explicit lifecycle. A project must always be in exactly one lifecycle state.

Lifecycle states exist to control focus, prevent overload, and make stopping explicit.

LIFECYCLE STATES

Idea

- Project exists only as an entry in \_PROJECT_INDEX.md.
- No folder, no files, no work.
- Purpose and intent are vague by definition.

Created

- Project folder exists.
- 00_SAMDARD.md, README.md, STATUS.md exist.
- No implementation work has started.

Active

- Exactly one project may be Active at any time.
- All work happens here.
- STATUS.md must be kept current.
- New scope is forbidden unless explicitly approved.

Frozen

- Project is intentionally paused.
- No changes allowed.
- State is preserved for future continuation.
- Reason for freezing must be written in STATUS.md.

Archived

- Project is finished or abandoned permanently.
- No future work expected.
- Folder remains read-only.
- STATUS.md records the final state and reason.

LIFECYCLE RULES

- Only one Active project is allowed across all projects.
- Switching Active projects requires updating \_PROJECT_INDEX.md.
- Work on Frozen or Archived projects is forbidden.
- A project may move backward only by explicit decision (e.g., Frozen → Active).
- Lifecycle discipline exists to protect attention and prevent endless parallel work.

=========================================

## STATUS & LOGGING RULES

This section is the sole authority for STATUS.md; other mentions are reminders only.
STATUS.md is the only tracker for active work. No other file may act as a task list, backlog, or work tracker, except FEATURES_TO_IMPLEMENT.md for future features only.

STATUS.MD — PURPOSE
STATUS.md answers exactly three questions:

- What is the current state?
- What is blocking progress (if anything)?
- What is the single next action?

MANDATORY STRUCTURE OF STATUS.MD
STATUS.md must always contain, in this order:

Current State

- A short, factual description of where the project stands.

Blockers

- Empty or explicit. No vague risks or future worries.

Next Action

- Exactly one concrete, actionable step.

LOGGING RULES

- Not a history log; past actions, discussions, and experiments are excluded.
- When the Next Action is completed, update STATUS.md to the new state.

WHAT IS EXPLICITLY FORBIDDEN

- Backlogs
- Checklists
- Multiple next steps
- Ideas for later
- TODO-style accumulation

If more than one action exists, the project is ill-defined and must be simplified.

CHANGE VISIBILITY RULE
Any change affecting scope, behavior, tools, structure, or workflow must be reflected in STATUS.md until it is resolved or frozen.

=========================================

## DECISION DISCIPLINE

Decisions are treated as explicit, finite events, not ongoing discussions. Only decisions with lasting cost or irreversible impact are recorded.

WHAT COUNTS AS A DECISION
A decision must be recorded if it:

- is costly to reverse,
- constrains future options,
- changes scope or direction,
- selects one approach while rejecting others.

Minor tweaks, experiments, and temporary choices do not qualify.

WHERE DECISIONS ARE RECORDED
DECISIONS.md is the only place for recorded decisions.

Each decision entry must include:

- date,
- decision statement (one sentence),
- brief rationale,
- explicit consequences (what this enables / forbids).

No commentary, no debate transcripts.

DECISION FINALITY RULE

- Once written, a decision is considered final.
- Reversing a decision requires a new decision entry explaining why.
- Silent reversals are forbidden.

DECISION TIMING RULE

- Decisions are made as late as possible, but not later.
- Delaying a decision that blocks progress is considered a process failure.

ANTI-PATTERNS (FORBIDDEN)

- Re-litigating past decisions
- Keeping decisions "open"
- Encoding decisions only in code
- Relying on memory or chat history

Decisions exist to remove future thinking, not to document thought.

=========================================

## WORKFLOW MODEL (STATIONS)

All project work follows a station-based workflow. Stations represent clear phases of work, not time estimates or task lists.

Only one station may be active at any time.
Stations are recorded in STATIONS.md (or the latest STATIONS_vN.md); the latest version is authoritative.

PURPOSE OF STATIONS
Stations exist to:

- enforce focus,
- prevent parallel work,
- make progress visible,
- provide natural stopping points.

A station answers: "What kind of work am I doing right now?"

STATION RULES

- One active station only: Parallel stations are forbidden.
- Stations are sequential: A station must be completed or explicitly abandoned before moving on.
- Station change is a decision: Moving to the next station must be reflected in STATUS.md.
- No scope growth inside a station: New ideas are deferred or explicitly rejected.

CANONICAL STATION TYPES
The exact list may evolve, but stations generally follow this order:

- Clarification — Understanding the problem, constraints, and goals.
- Specification — Writing SPEC.md and defining scope and behavior.
- Design — Structural and architectural decisions.
- Implementation — Writing code or executing the plan.
- Verification — Manual testing, validation, sanity checks.
- Freeze — Locking behavior and stopping changes.

Not all projects require all stations, but order must be respected.

STATION COMPLETION RULE
A station is complete when:

- its purpose is fulfilled,
- no open questions remain,
- the next station is clearly defined.

Incomplete stations may be frozen, but never silently skipped.

Stations exist to turn work into finite, controllable steps, not endless activity.

=========================================

## CHANGE RULES

Changes are controlled to prevent drift, rework, and hidden complexity. Not all changes are equal; most are forbidden by default.

WHAT COUNTS AS A CHANGE
A change is any modification that affects:

- scope,
- behavior,
- data,
- structure,
- tools,
- workflow,
- assumptions.

Pure formatting or comment-only edits do not count.

CHANGE PERMISSION RULES

Before Freeze

- Changes are allowed if they support the current station.
- Changes must not expand scope.

After Freeze

- Changes are forbidden by default.
- Only bug fixes or safety issues may be addressed.
- Any exception requires an explicit decision.

After Archive

- No changes are allowed.

CHANGE VISIBILITY RULE
All approved changes must be:

- reflected in STATUS.md while active,
- consistent with SPEC.md,
- compliant with SAMDARD.

Silent or undocumented changes are considered violations.

FORBIDDEN CHANGE PATTERNS

- Refactoring "because it feels wrong"
- Tool changes mid-station
- Expanding scope under the label of "cleanup"
- Fixing non-bugs

Changes exist to serve progress, not curiosity.

=========================================

## SCOPE CONTROL

Scope defines what the project is allowed to be. Uncontrolled scope is the primary cause of unfinished work.

SCOPE DEFINITION
Scope is defined explicitly in SPEC.md and consists of:

- included functionality,
- excluded functionality,
- constraints and limits.

Anything not written in scope is out of scope by default.

SCOPE FREEZE RULE
Once a project enters the Implementation station:

- scope is considered frozen,
- new features are forbidden,
- "small additions" are treated as scope expansion.

If new requirements emerge, one of the following must happen:

- the requirement is rejected,
- the project is frozen,
- a new project is created.

OUT_OF_SCOPE DISCIPLINE
If scope boundaries are critical or frequently challenged:

- an explicit OUT_OF_SCOPE.md may be created,
- it must list forbidden features or directions.

This file exists to end discussions, not to invite them.

SCOPE VIOLATION INDICATORS
The following indicate scope violation:

- "While we're here…"
- "It's just a small change…"
- "We might need this later…"

When detected, work must stop and scope must be re-evaluated.

Scope control exists to protect completion, not ambition.

=========================================

## ERROR HANDLING & DEBUG DISCIPLINE

Errors are treated as first-class information, not as noise. Silent failures, vague messages, or implicit behavior are forbidden.

ERROR HANDLING PRINCIPLES

- Every error must be detectable, explicit, and observable.
- Errors must fail loudly and early rather than degrade silently.
- An error that cannot be explained is considered unresolved.

ERROR VISIBILITY RULES

- Errors must surface where they occur.
- Backend errors must return:
  - a clear error message,
  - a deterministic error code (if codes are used).
- Frontend errors must be shown plainly, without masking or "friendly" wording.

ERROR CODE DISCIPLINE (CONDITIONAL)
If error codes are used:

- codes must be deterministic and stable,
- codes must be documented in ERROR_CODE_REGISTRY.md,
- codes must never be reused for different failures.

If error codes are not used, this file must not exist.

DEBUGGING RULES

- Debugging starts at the point of failure, not with speculation.
- Logs are used to observe, not to narrate.
- One hypothesis at a time; verify before proceeding.

FORBIDDEN PATTERNS

- Catching errors without handling them
- Logging errors without surfacing them
- "This should never happen" branches
- Fixing symptoms instead of causes

Debug discipline exists to shorten feedback loops and prevent recurring failures.

=========================================

## CHATGPT / CODEX USAGE RULES

ChatGPT and Codex are tools, not authorities. They assist execution and thinking but never replace written project truth.

ROLE SEPARATION

- Human (Owner): authority, judgment, decisions
- ChatGPT: planner, reviewer, explainer
- Codex: builder and executor

No role overlap is allowed.

MANDATORY CONTEXT RULE
Before ChatGPT or Codex is asked to act on a project, the following files must be provided or referenced explicitly:

- 00_SAMDARD.md
- SPEC.md
- STATUS.md

If these files are missing, outdated, or contradictory, work must stop.

ALLOWED USES
ChatGPT may:

- clarify requirements,
- review specifications,
- suggest approaches within constraints,
- explain errors and logs,
- rephrase text without changing meaning.

Codex may:

- implement exactly what is specified,
- modify files according to instructions,
- run commands when explicitly asked.

FORBIDDEN USES
ChatGPT and Codex must not:

- invent requirements,
- expand scope,
- refactor without instruction,
- change tools or structure silently,
- act without explicit input files.

AUTHORITY RULE

- ChatGPT output is advisory, not binding.
- Codex output must be reviewed, not trusted blindly.
- Files override chat history at all times.

STOP CONDITION
If ambiguity, conflict, or missing information is detected:

- the AI must stop,
- report the issue,
- request clarification.

Continuing without clarity is forbidden.

AI exists to accelerate disciplined work, not to replace it.

=========================================

## GROWTH RULE (BASELINE EVOLUTION)

Standards evolve, but never casually. Growth is incremental, deliberate, and grounded in real experience.

EVOLUTION PRINCIPLE
The baseline workflow, CTB, and SAMDARD itself evolve only when:

- a tool or pattern has been used in a real project,
- its benefit is clearly demonstrated,
- its inclusion reduces future effort or error.

Speculation is not a valid reason for change.

ADDITIVE GROWTH RULE

- New rules or tools may be added, not rewritten.
- Existing rules are not removed; they may be deprecated with explanation.
- Past projects are never retroactively invalidated.
- Growth preserves history.

CONSOLIDATION TRIGGER
A change may be consolidated into SAMDARD when:

- it appears repeatedly across projects,
- it solves the same problem in the same way,
- it has proven stable over time.

Until then, it remains project-specific.

REJECTION RECORDING
If a tool, pattern, or workflow is considered and rejected:

- the rejection must be recorded,
- the reason must be explicit,
- re-evaluation without new evidence is forbidden.

ANTI-GROWTH PATTERNS (FORBIDDEN)

- Adding tools "for the future"
- Rewriting standards due to boredom
- Chasing novelty or trends
- Optimizing before friction exists

Baseline evolution exists to compound competence, not to reset it.

=========================================

## ANTI-PATTERNS

The following behaviors are explicitly recognized as anti-patterns. If they appear, work must pause and the process must be corrected.

STRUCTURAL ANTI-PATTERNS

- Creating files or folders "just in case"
- Multiple files serving the same purpose
- Keeping unused structure to avoid deletion
- Allowing undocumented conventions to form

PROCESS ANTI-PATTERNS

- Working without updating STATUS.md
- Starting implementation before scope is defined
- Changing tools mid-station
- Parallel work streams on a single project

DECISION ANTI-PATTERNS

- Keeping decisions "open"
- Re-discussing recorded decisions
- Encoding decisions only in code
- Avoiding decisions to delay commitment

SCOPE ANTI-PATTERNS

- "While we're here…" additions
- Treating refactors as harmless
- Expanding scope to avoid finishing
- Confusing improvement with completion

AI-RELATED ANTI-PATTERNS

- Treating ChatGPT as memory
- Letting Codex improvise
- Accepting AI output without review
- Using AI to bypass discipline

Anti-patterns are not moral failures. They are signals that structure is being bypassed.

Correcting anti-patterns early prevents collapse later.

=========================================

## ACTIVATION CHECKLIST

A project may only move from Idea to Created or Active if the following conditions are met. This checklist exists to prevent premature execution.

MANDATORY BEFORE ANY WORK
Before any implementation, experimentation, or tool usage:

- 00_SAMDARD.md exists in the project root
- README.md exists and states the purpose in one page or less
- STATIONS.md exists and is complete (or the latest STATIONS_vN.md)
- STATUS.md exists and contains:
  - current state
  - blockers (or explicitly "none")
  - exactly one next action
- The project is listed in \_PROJECT_INDEX.md with a lifecycle state

If any of these are missing, work must not start.

MANDATORY BEFORE IMPLEMENTATION
Before entering the Implementation station:

- SPEC.md exists and defines scope
- Out-of-scope areas are explicit
- Required tools are confirmed to be within CTB or explicitly approved
- The current station is recorded in STATUS.md

ACTIVATION RULE

- Skipping the activation checklist is forbidden.
- If a project feels urgent, the checklist becomes more important, not less.

Activation discipline exists to ensure work starts cleanly and deliberately.

=========================================

## AMENDMENT RULE

SAMDARD.md is a governing document. Changes to it affect all current and future projects and are therefore treated with the highest discipline.

WHEN SAMDARD MAY BE AMENDED
An amendment to SAMDARD.md is allowed only if:

- a rule has repeatedly failed in real use, or
- a missing rule caused recurring friction or error, or
- a clarified wording prevents misinterpretation.

Personal mood, curiosity, or novelty are not valid reasons.

AMENDMENT PROCEDURE
Any amendment must:

- Be deliberate and explicit
- Modify one section at a time
- Preserve the original intent of the standard
- Avoid retroactive invalidation of past projects

Amendments are written directly into SAMDARD.md; no parallel versions exist.

AMENDMENT DISCIPLINE

- Amendments are rare.
- If an amendment feels "nice to have", it must be postponed.
- If an amendment feels "necessary", it must be written clearly and minimally.

FINAL AUTHORITY STATEMENT
SAMDARD.md overrides:

- project conventions,
- habits,
- preferences,
- AI suggestions,
- undocumented practices.

Only an explicit amendment may change this.

This rule exists to keep the standard stable, trusted, and boring.
