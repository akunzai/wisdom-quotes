# 智慧語錄 (Wisdom Quotes) — Developer Guidelines

## Project Overview

**智慧語錄** is a personal quote management site, **static-first** and deployable to **GitHub Pages**. The UI is primarily **Traditional Chinese (zh-TW)** with Light / Dark theme support. MVP focuses on personal collection and management; the architecture reserves room for future **public quotes** and **Like** features (Cloudflare D1).

**Planning & requirements** are tracked in [GitHub Issues](https://github.com/akunzai/wisdom-quotes/issues). Start with the [roadmap epic (#1)](https://github.com/akunzai/wisdom-quotes/issues/1).

## Quick Commands

> Update these once the project scaffold is in place.

```bash
# Development
npm run dev

# Build (outputs to dist/ for GitHub Pages)
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Tests
npm run test

# Lint / Format
npm run lint
npm run format

# Preview design mockup (no build required)
npx serve mockup
```

## Architecture Overview

```
/
├── mockup/             # Interactive HTML design preview
├── src/
│   ├── components/     # UI components (quote cards, search, theme toggle)
│   ├── pages/          # Routes (home, authors, focus mode, settings)
│   ├── lib/
│   │   ├── storage/    # IndexedDB / localStorage abstraction
│   │   ├── import-export/  # JSON import/export
│   │   ├── drive/      # Google Drive sync (Phase 2)
│   │   └── api/        # Cloudflare Workers API client (Phase 3)
│   ├── styles/         # Global styles, theme tokens, animations
│   └── types/          # Quote, Author type definitions
├── public/             # Static assets
└── workers/            # Cloudflare Worker (Phase 3, optional)
```

### Data Model (MVP)

```typescript
interface Quote {
  id: string;           // UUID
  text: string;         // Quote text (required)
  author?: string;      // Author (optional)
  sourceUrl?: string;   // Source link (optional)
  tags?: string[];      // Tags (optional, future)
  createdAt: string;    // ISO 8601
  updatedAt: string;
  visibility: 'private' | 'public';  // MVP defaults to private
}

interface QuoteCollection {
  version: string;
  exportedAt: string;
  quotes: Quote[];
}
```

### Deployment Topology

| Phase | Frontend | Data | Backup |
|-------|----------|------|--------|
| MVP | GitHub Pages (static) | Browser IndexedDB | JSON import/export |
| Phase 2 | GitHub Pages | IndexedDB + Google Drive sync | Auto Drive backup |
| Phase 3 | GitHub Pages + CF Workers | D1 (public quotes, likes) | Personal data stays local/Drive |

## Tech Stack

- **Framework**: Astro 5 + React islands (static output, SEO-friendly, React for interactive islands)
- **Styling**: Tailwind CSS 4 + CSS variables (theme switching)
- **Storage**: Dexie.js (IndexedDB wrapper)
- **Companions**: optional page cat (SVG) that wanders, occasionally reads beside quote cards, and appears in focus mode; respects `prefers-reduced-motion`
- **Fonts**: Noto Serif TC (quote body) + Noto Sans TC (UI chrome)
- **Phase 3 API**: Cloudflare Workers + D1 + Hono

## UI Language Convention

- **Display name**: 智慧語錄
- **User-facing copy**: Traditional Chinese (zh-TW)
- **Code, identifiers, comments, and docs**: English

## Code Style & Conventions

- Language: TypeScript strict mode
- Components: function components + hooks; separate logic (`lib/`) from UI (`components/`)
- Immutable updates: quote CRUD goes through the storage abstraction, never direct IndexedDB access
- Theming: `data-theme="light" | "dark"` on `<html>`, tokens defined as CSS variables
- Accessibility: keyboard navigable, visible focus rings, animations can be disabled
- Git branches: `feature/<desc>`, `fix/<desc>`
- **Issues**: link PRs to issues (`Closes #N`); update roadmap checklist in #1 when closing MVP issues

## Workflows

- **Planning**: use GitHub Issues — do not add parallel planning docs in `docs/`
- **Testing**: run `npm run typecheck` and `npm run test` before submitting
- **Build verification**: `npm run build` must succeed and `dist/` must be deployable as-is
- **UI changes**: verify both Light/Dark themes and mobile layouts; reference `mockup/index.html`
- **Animation**: any new motion must degrade gracefully under `prefers-reduced-motion: reduce`

## Security & Privacy

- MVP data stays in the user's browser; nothing uploaded to a server
- Google Drive sync only accesses user-authorized file scopes
- Publishing a quote publicly requires explicit user confirmation
- D1 API must validate origin, apply rate limiting; likes must prevent duplicates and abuse

## Claude Code Compatibility

> [!NOTE]
> This repository maintains compatibility with Claude Code. `CLAUDE.md` is a symbolic link pointing to `AGENTS.md`.
> All commands, style guides, and workflows defined in `AGENTS.md` apply to both agentic assistants and Claude Code.
> **Do not** delete or edit `CLAUDE.md` independently; update guidelines directly in `AGENTS.md`.