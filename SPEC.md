# SPEC — Dogule1

Scope

- Maintain and evolve the Dogule1 application (UI, API, data tooling) as defined by the existing station logs and project documentation.

Out of Scope

- Work not documented in this project’s station logs or docs.

Constraints

- Follow 00_SAMDARD.md and CTB rules.
- No scope expansion during Implementation without explicit approval.

Exceptions to SAMDARD

- Root-level code and tooling directories are allowed: apps/, modules/, tools/, migration/.
- Root-level project tooling/config files are allowed: package.json, pnpm-lock.yaml, pnpm-workspace.yaml, vite.config.js, vitest.config.js, eslint.config.mjs, commitlint.config.cjs.
- Root-level VCS and tooling metadata is allowed: .git/, .github/, .husky/, .gitignore, .prettierrc, .prettierignore.
- Environment template is allowed: .env.example.
- Local caches, temp work, and generated dependencies are allowed: node_modules/, .local/, .local-pnpm/, worktrees/, .NAS-Distro/, .tmp-\*/.
- FEATURES_TO_IMPLEMENT.md remains at the project root by design.

References

- Documentation: attachments/docs/
- Archived docs: attachments/archive/
- Status log (historical): attachments/status/status_log.md
