# DOGULE1 Security Baseline

Version 0 – first baseline; created in Station 57, covering the Station-52 security baseline scope plus Station-57 authz/audit/alerts. This is the canonical security baseline; future stations must extend (not replace) it.

## Scope & Principles

- Applies to all web modules (Dashboard, Kunden, Hunde, Kurse, Trainer, Kommunikation, Kalender, Finanzen, Waren, Imports, Backups/Config, future NAS/ops surfaces).
- Roles: `admin`, `staff`, `trainer`, plus pseudo-roles `system` (jobs/cron/imports/email sender/integrations) and `unauthenticated` (not logged in).
- Deny-by-default: any route/action without an explicit rule is denied. All sensitive actions require audit logging.
- Stable action IDs (`module.action_verb`) are mandatory; see `SECURITY_AUTHORIZATION_MATRIX.md` for the source-of-truth matrix (machine-readable block governs CI coverage).

## Authentication & Session Parameters (anchored)

- Hashing: PBKDF2-HMAC-SHA256, iterations=120000, salt=16 bytes, key length=32 bytes. Stored format: `pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>`.
- Token lifetimes: access=15m, refresh=7d.
- Lockout: 5 failed logins within 5 minutes → lockout for 15 minutes.
- Secrets/envs:
  - `DOGULE1_AUTH_ENABLED` (default false; feature flag for auth).
  - `DOGULE1_AUTH_SECRET` (HMAC for access tokens, required in real deployments).
  - `DOGULE1_REFRESH_SECRET` (HMAC for refresh tokens).
  - `DOGULE1_SESSION_COOKIE_NAME` (default `dogule1.sid`), cookies must be `HttpOnly`, `SameSite=Strict`, `Secure` when over TLS.
- Admin-only 2FA toggle: config flag (default off); if enabled, admin login must require 2FA assertion (implementation in later stations).
- Audit action IDs (stable): `auth.login`, `auth.refresh`, `auth.logout`, `auth.lockout`, `auth.denied`.

## Authorization Matrix (summary)

- Full matrix lives in `SECURITY_AUTHORIZATION_MATRIX.md` (machine-readable YAML + human tables).
- Roles are evaluated in order: `system` (non-human automation), then authenticated human roles (`admin`, `staff`, `trainer`), with `unauthenticated` denied except explicit public assets (currently none).
- Conditional rules must state preconditions (e.g., trainer assigned to kurs/kalender event; staff scoped to assigned customers/mandates; system acting under approved job id).
- Sensitive domains: Finanzen, Backups, Config, Imports, Kommunikation (messages/emails/broadcasts) are locked down to admin unless explicitly allowed with conditions and mandatory audit.

## Audit & Logging Baseline

- Every write/attempt for Finanzen, Imports, Backups/Config, Kommunikation posts/emails is audited regardless of outcome (success/denied/fail).
- Required fields per audit entry:
  - `timestamp` (ISO8601 UTC)
  - `actorId` (user id or `system:<job>`), `actorRole`
  - `actionId` (stable action name)
  - `target` `{ module, id }`
  - `result` (`success` | `denied` | `error`)
  - `before` / `after` snapshots (redacted of secrets; for Finanzen values are included)
  - `requestId` / `correlationId`
  - `hashPrev` (for chain), `hashIndex`, optional `merkleRoot` for rotated segments
  - `context` (ip/userAgent for interactive, job id for system)
- Constraints:
  - Never log secrets or raw tokens; only opaque ids/hashes.
  - PII handling aligns to Station-51 PII map: audit fields may contain entity ids and coarse attributes; full address/contact data should be avoided unless necessary to evidence the action.
- Retention: minimum 180 days online, archival beyond that per ops policy; rotations keep hash-chain continuity (see Tamper-Evident Logging).

## Alerting Baseline

- Thresholds (defined in detail in `SECURITY_AUTHORIZATION_MATRIX.md` and reused by Station 62 for implementation):
  - `failed_login`: ≥5 attempts per 5 minutes per (IP,user) → ALERT.
  - `denied_action`: ≥3 denied actions per 10 minutes per actor → WARNING; ≥10 → ALERT.
  - `finanzen_mutation`: >10 mutations per 10 minutes per actor or outside business hours → WARNING.
  - `imports_failure`: any import failure → WARNING; repeated (≥3 in 1h) → ALERT.
  - `backup_failure` or `config_change` outside window → ALERT.
- Alert sinks: email/syslog/dev-log placeholders; escalation timing defined per severity (ALERT/CRITICAL immediate).
- Station 57 defines expectations; Station 62 will implement rate-limit + alert plumbing consistent with these thresholds.

## Tamper-Evident Logging

- Logging uses a linear hash chain per file: `hash_0 = SHA-256("seed")`, `hash_i = SHA-256(entry_i || hash_{i-1})`.
- Rotation: size- or time-based (daily or 100k entries). Each segment stores terminal hash and optional Merkle root over the segment entries to anchor integrity.
- Verification procedure:
  1. Start from `hash_0` and recompute through the window; compare terminal hash and stored Merkle root.
  2. If any mismatch → CRITICAL incident; freeze log storage, open investigation, and alert security lead.
  3. Maintain an external anchor (e.g., write segment roots to a separate read-only channel) when available.
- Hashing algorithm: SHA-256, aligning with Stations 54–56 migration checksums.

## CI Gate Expectation (for Station 60 enforcement)

- Machine-readable matrix must enumerate every route/action id; CI should fail if code references an action not present or marked anything other than `allowed|denied|conditional`.
- Deny-by-default must be enforced in code: missing entries treated as deny until explicitly added to the matrix.
- Any station introducing new routes/actions must update the matrix block; otherwise CI (introduced by Station 60) will fail.

## References

- Authorization matrix and alert thresholds: `SECURITY_AUTHORIZATION_MATRIX.md`
- PII map: Station 51 (existing governance reference; ensure alignment when logging/auditing)
- Migration tamper-evidence precedent: Stations 54–56 checksums/merkle roots
