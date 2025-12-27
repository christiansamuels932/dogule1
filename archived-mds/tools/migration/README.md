# Migration Tooling (Station 53 Skeleton)

Scope for Station 53 (E2a):

- Offline Node CLI only (no browser/UI).
- Dry-run command only; no writes to storage or mapping registries.
- Deterministic outputs: canonical JSON, fixed report location `storage_reports/latest-dry-run/` (overwritten each run).
- Read-only mapping registry format frozen: files under `migration/mapping/<module>.json`, each an array sorted by `legacyId` with objects `{ "legacyId": string, "targetUuid": string, "version": 1 }`. Dry-run never mutates these.

Components (skeleton):

- `cli.js`: entry point wiring `dry-run`.
- `sourceAdapter.js`: iterates mock data (v0) and validates schema shape.
- `mapper.js`: per-module stubs; sets defaults (schemaVersion=1, version=0), flags missing mappings; no writes.
- `registry.js`: loads mapping registries read-only; deterministic lookups; errors if mapping absent.
- `canonicalJson.js`: stable serializer (sorted keys/arrays, LF, UTF-8).
- `reporter.js`: writes `storage_reports/latest-dry-run/dry-run.json` + summary; no timestamps in filenames.
- `validation.js`: schema-level validation only in 53; FK/invariant hooks stubbed for later stations.
- `batchRunner.js`: processes modules deterministically; no checkpoints written in 53 (resume design deferred).

Deferred to later stations:

- Actual migration writes, checksum/atomic path, FK/invariant enforcement, registry mutation, checkpoints, cutover/rollback.
