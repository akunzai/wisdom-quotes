# Wisdom Quotes — Developer Guidelines

**Wisdom Quotes** (智慧語錄) is a static-first personal quote management web app deployable to GitHub Pages with multi-locale UI (zh-Hant default, en, ja) and local IndexedDB storage.

This project uses [aube](https://aube.jdx.dev/) (`aubr`).

## Commands

```bash
aubr dev           # Start Astro dev server
aubr build         # Build static site (astro check && astro build to dist/)
aubr preview       # Preview production build
aubr typecheck     # Type checking (astro check)
aubr lint          # Linting (oxlint)
aubr format        # Format code (oxfmt .)
aubr format:check  # Check formatting (oxfmt --check .)
aubr test:unit     # Run unit verification script
aubr test:e2e      # Run E2E test suite
```

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

When problem-solving reveals non-obvious knowledge (gotchas, hidden config, env var quirks):

1. **Candidate**: Distill into a concise, non-derivable rule (≤ 2 bullets, context-tagged, no micromanagement).
2. **Promote**: Present candidate to user for explicit confirmation before writing to a dedicated topic file (`docs/<topic>.md`) or fallback `docs/lessons-learned.md`. Add or update a single `@path` reference line under Pointers — never inline in `AGENTS.md`.
3. **Prune**: Periodically propose dropping stale entries (upgraded past tagged context, now enforced by linter/test, or duplicated).
