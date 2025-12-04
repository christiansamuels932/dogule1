Here is the updated **DOGULE1_MIGRATION_PROTOCOL.md** exactly as a clean Markdown file, ready to save:

---

# DOGULE1 – MIGRATION PROTOCOL (Updated)

### 🎯 PURPOSE

Guarantee full continuity of project context between chats, ensuring development remains consistent, recoverable, and structured.

---

## 1 — STATUS FILE (Single Source of Truth)

**File:** `status.md`
**Location:** Repository root (`dogule1/`)
**Maintained by:** Codex (after every completed station)

This file must always contain:

- Current phase
- Current station
- Completed work summary
- Next action
- Branch name
- Relevant PR references
- Warnings or notes for the next station

`status.md` is the _sole authoritative source_ that restores all project context when a chat begins.

---

## 2 — WHEN MIGRATION IS REQUIRED

A migration to a fresh chat must occur when:

1. **A station completes**
2. **The chat becomes slow, crowded, or unstable**
3. **A milestone requires clean isolation** (e.g., major refactor, heavy Codex operations)

Migration ensures clean state, fast performance, and perfect continuity.

---

## 3 — MIGRATION STEPS (Exact Procedure)

1. Copy the **latest** `status.md`.
2. Open a **new chat** named after the next station (e.g., “Chat 13 – Station 13”).
3. Paste `status.md` as **the very first message**.
4. Paste the **Opening Instruction Block**, which includes:
   - “You are Chat X.”
   - “Your task is Station X.”
   - All **Standing Rules** (1–6)
   - Station goal
   - First actionable step
   - Branch name for Codex

5. ChatGPT acknowledges everything and continues from there.

The new chat then becomes the official execution environment for the next station.

#### When _not_ to migrate

- Kein Chat-Wechsel mitten im aktiven Station-Flow, solange Performance stabil ist.
- Nicht migrieren, nur weil der Verlauf lang wirkt; zuerst STATUS aktualisieren.

#### Restart checklist

- STATUS posten (immer zuerst).
- Opening Instruction Block posten (inkl. Branch + Stationziel).
- `git status` prüfen, dann geplante Kommandos/Tests angeben.

---

## 4 — STANDING RULES (Always Passed to the Next Chat)

1. Work one step at a time.
2. Explain every step like to a child.
3. Pass these rules to the next chat.
4. Use English for instructions; German for UI.
5. Codex writes all code, commits, pushes, and updates status.md.
6. **Codex instructions must be plain text only**
   - No bullets
   - No numbering
   - No markdown formatting
   - Only plain new-line text

These rules are mandatory for every station and ensure consistent execution.

---

## 5 — ROLE PRESERVATION DURING MIGRATION

- **ChatGPT** remains the **Project Planner**.
- **Codex** remains the **Builder**.
- **Christian Samuels** remains the **Client Representative**.

Roles never change between chats and must be assumed in every new session.

---

## 6 — REDUNDANCY & SAFETY

- `status.md` is version-controlled via Git.
- All commits and PRs ensure a traceable development history.
- Optional NAS mirror: `/projects/dogule1/logs/`
- Chat migration blocks form a human-readable fallback copy.

This ensures no loss of context, even in catastrophic chat resets.

---

## 7 — RESULT

Following this protocol guarantees:

- Zero context loss
- Seamless multi-chat workflow
- Clear boundaries between stations
- Perfect reproducibility of the entire development journey
- A stable, predictable collaboration between ChatGPT and Codex

Each station becomes a clean, well-defined chapter in Dogule1’s development.
