# Station 62 — Canonical Logging & Alert Event Schema

This document defines the single, canonical JSON event shape for all logs and alert signals. It encodes the severity ladder, required fields, optional fields, and hard rules for privacy and overload handling. All emitters must use this shape; any deviation is invalid.

## Severity Ladder & Mapping

- `level`: `debug | info | warning | alert | critical`
- `severity`: `INFO | WARNING | ALERT | CRITICAL`
- Mapping is 1:1 (`warning` → `WARNING`, `alert` → `ALERT`, etc.).

## Required Fields

- `ts` — ISO-8601 UTC timestamp (string)
- `level` — one of the values above
- `severity` — one of the values above (mapped to `level`)
- `actionId` — exact action id from the authorization matrix (string, stable)
- `actor` — object:
  - `type`: `user | system | anonymous`
  - `id`: string or null (null for anonymous)
  - `role`: string or null (null for anonymous/system)
- `target` — object or null:
  - `type`: string (stable domain identifier)
  - `id`: string (stable id)
- `result` — `success | denied | rate_limited | error`
- `requestId` — generated per request, propagated (string)
- `message` — short, stable string key (no prose)

## Optional Fields (Strict)

- `meta` — small object, whitelisted keys only, `additionalProperties: false`, max serialized size 1024 bytes. Allowed keys:
  - `requestPath` (string, <= 200)
  - `ipHash` (string, <= 128, hashed only)
  - `windowSeconds` (integer, >= 1)
  - `limit` (integer, >= 1)
  - `code` (string, <= 64, e.g., `DLX-RATE-001`)
- `alertCode` — stable identifier for alert signals (string, <= 64)
- `throttleKey` — derived key for alert throttling (string, <= 128)

## Hard Rules

- No PII, no secrets, no request bodies, no arbitrary objects.
- `meta` keys are limited to the whitelist above; anything else is rejected.
- Schema violations must fail fast in dev/test. In prod, the logger emits one `critical` drop notice, then drops subsequent invalid events.
- `actionId`, `actor`, `target`, and `result` must always be set; `target` may be `null`.

## Overload / Drop Policy

- Dev/Test: logger throws on schema violation or emit failure (fail fast).
- Prod: first failure emits a single `critical` log noting the drop, subsequent invalid events are dropped to protect the system.

## Alert Signals

- Alert events use the same shape and required fields as logs, plus:
  - `alertCode` — required for alerts
  - `throttleKey` — required for alerts (e.g., `auth.login:actorId`)
- Throttle: same `alertCode` + `throttleKey` → max 1 per 5 minutes.
- Transport is identical to logs (stdout JSONL).
