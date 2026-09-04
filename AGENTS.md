# Wisdom Quotes — Developer Guidelines

**Wisdom Quotes** (智慧語錄) is a static-first personal quote management web app deployable to GitHub Pages with multi-locale UI (zh-Hant default, en, ja) and local IndexedDB storage.

This project uses [aube](https://aube.jdx.dev/) (`aubr`).

## Commands

- Run unit verification: `aubr test:unit`
- Run E2E test suite: `aubr test:e2e`
- Build static site: `aubr build`

## Conventions

- **UI Language**: Default `zh-Hant`, supports `en` and `ja` via `src/i18n/`. Code, identifiers, and docs in English.
- **Theming**: Light / Dark theme via `data-theme="light" | "dark"` on `<html>`.
- **Accessibility & Motion**: Respect `prefers-reduced-motion: reduce` on all animations.
- **Planning**: Tracked in GitHub Issues. Start with the [roadmap epic (#1)](https://github.com/akunzai/wisdom-quotes/issues/1).

## Pointers

- Domain types & schema: @src/types/quote.ts
- Storage layer: @src/lib/storage/quotes.ts
- Import / export schema: @src/lib/import-export/schema.ts
- i18n catalogs: @src/i18n/index.ts
- Verification tests: @scripts/verify-demo-quotes.mjs

## Claude Code Compatibility

`CLAUDE.md` is a symbolic link pointing to `AGENTS.md`. Edit `AGENTS.md` directly.

## Self-Reflection

- **Candidate**: Distill a non-obvious gotcha into ≤ 2 context-tagged bullets. Propose it before writing.
- **Promote**: On confirmation, put it where whoever would break it must already pass — enforce it (assert/type/test) when the fix is in hand, else a comment at that site, else an agent-facing doc (`docs/agents/<topic>.md`, else `docs/agents/lessons-learned.md`) with one `@path` line under Pointers. Never both.
- **Prune**: Drop entries once stale (obsolete version, now enforced, duplicated, or a transcript) — not by a fixed count.
