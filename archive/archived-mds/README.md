# Dogule1 - Management App for Dog Schools

## Purpose

Dogule1 ist eine modulare Verwaltungs-App fuer Hundeschulen mit Dashboard und Modulen fuer Kommunikation, Kunden, Hunde, Kurse, Trainer, Kalender, Finanzen und Waren. Ziel ist eine lokale Alpha-Version (V0.1) mit spaeterem NAS-Rollout.

## Quick Start

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
```

## Canonical Docs

- `status.md` - progress ledger and station history.
- `DOGULE1_GOVERNANCE.md` - authority, invariants, gating.
- `DOGULE1_PROTOCOL.md` - agent collaboration rules.
- `agents.md` - Planner vs Builder roles.
- `Master-II-Path.md` - stations 50+ roadmap.
- `DOGULE1_MASTER.md` - architecture baseline and station definitions.
- `DOGULE1_SYSTEM_BASELINE_V2.md` - storage, integrity, migration rules.
- `DOGULE1_SECURITY_BASELINE.md` and `SECURITY_AUTHORIZATION_MATRIX.md` - security baseline and auth matrix.

## Dev Notes

- Vite app lives in `apps/web` and is the only runtime entry.
- Hash routes: `#/dashboard`, `#/kunden`, `#/hunde`, `#/kurse`, `#/trainer`, `#/kalender`, `#/finanzen`, `#/waren`, `#/kommunikation`.
- UI copy is German; instructions and docs are English unless noted.
