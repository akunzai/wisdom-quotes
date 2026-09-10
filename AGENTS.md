# Wisdom Quotes — Developer Guidelines

**Wisdom Quotes** (智慧語錄) is a static-first personal quote management web app deployable to GitHub Pages with multi-locale UI (zh-Hant default, en, ja) and local IndexedDB storage.

This project uses [aube](https://aube.jdx.dev/) (`aubr`).

## Commands

- Run unit verification: `aubr test:unit`
- Run E2E test suite: `aubr test:e2e`
- Build static site: `aubr build`

## Pointers

- Domain types & schema: @src/types/quote.ts
- Storage layer: @src/lib/storage/quotes.ts
- Import / export schema: @src/lib/import-export/schema.ts
- i18n catalogs: @src/i18n/index.ts
- Verification tests: @scripts/verify-demo-quotes.mjs
- Issue tracker: @docs/agents/issue-tracker.md
- Pull requests: @docs/agents/pull-request.md
- Verification: @docs/agents/verification.md
- Triage labels: @docs/agents/triage-labels.md
- Domain docs: @docs/agents/domain.md

## Claude Code Compatibility

`CLAUDE.md` is a symbolic link pointing to `AGENTS.md`. Edit `AGENTS.md` directly.

## Prevent Recurrence

- **Candidate**: Name who hits this again, in which file, on what change. No such scenario, nothing to propose.
- **Promote**: Offer the first tier that reaches them and only that one, pending confirmation — enforce it (assert/type/test) with its size quoted, else a comment at that site, else an agent-facing doc (`docs/agents/<topic>.md`, else `docs/agents/lessons-learned.md`) with one `@path` line under Pointers and one sentence on why the tiers above cannot hold it.
- **Prune**: When adding to a file, audit the rest of it in the same pass. Drop entries once stale (obsolete version, now enforced, duplicated, or a transcript) — not by a fixed count.
