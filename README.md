# 智慧語錄 (Wisdom Quotes)

Record, manage, and reflect on thought-provoking wisdom quotes. Static-first, deployable to GitHub Pages, with a Traditional Chinese UI, light/dark themes, and subtle ambient animations.

**[Preview the design mockup →](./mockup/index.html)** · **[Roadmap & issues →](https://github.com/akunzai/wisdom-quotes/issues/1)**

## Feature Overview

| Feature | MVP | Planned |
|---------|:---:|:-------:|
| Add / edit / delete quotes | ✅ | |
| Optional author & source link | ✅ | |
| Browse by author | ✅ | |
| Full-text search | ✅ | |
| Focus mode (single-quote fullscreen) | ✅ | |
| Light / Dark theme | ✅ | |
| JSON import / export | ✅ | |
| Page pets (cute companions) | ✅ | |
| Google Drive cloud backup | | [Phase 2](https://github.com/akunzai/wisdom-quotes/issues/6) |
| Public quote wall | | [Phase 3](https://github.com/akunzai/wisdom-quotes/issues/8) |
| Quote likes | | [Phase 3](https://github.com/akunzai/wisdom-quotes/issues/8) |

## Planning

Requirements, phased delivery, and open decisions are tracked in **GitHub Issues**:

| Issue | Description |
|-------|-------------|
| [#1](https://github.com/akunzai/wisdom-quotes/issues/1) | Roadmap epic |
| [#3–#9](https://github.com/akunzai/wisdom-quotes/issues/3) | MVP (Phase 1) tasks |
| [#6](https://github.com/akunzai/wisdom-quotes/issues/6) | Google Drive sync |
| [#8](https://github.com/akunzai/wisdom-quotes/issues/8) | Public quotes + D1 |
| [#10](https://github.com/akunzai/wisdom-quotes/issues/10) | Open product decisions |

Implementation conventions and data models live in [AGENTS.md](./AGENTS.md).

## Why Static-First?

- **Zero server cost**: GitHub Pages hosts for free
- **Privacy-friendly**: personal quotes stay in your browser by default
- **Offline-capable**: PWA support can enable offline browsing and management
- **Progressive enhancement**: add Cloudflare Workers + D1 for public quotes and likes later without changing the static frontend

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Pages (static frontend)                         │
│  Astro + React + Tailwind                               │
│  IndexedDB (Dexie) ← personal quotes, local storage     │
└───────────────────────┬─────────────────────────────────┘
                        │ JSON import/export
                        │ Google Drive sync (Phase 2)
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Workers + D1 (Phase 3, optional)            │
│  Public quote browsing · Like counts · Rate limiting    │
└─────────────────────────────────────────────────────────┘
```

## Local Development

> Run these steps once the project scaffold is in place.

```bash
git clone https://github.com/akunzai/wisdom-quotes.git
cd wisdom-quotes
npm install
npm run dev
```

Open `http://localhost:4321` (Astro default port).

### Preview Mockup (available now)

```bash
npx serve mockup
# Open http://localhost:3000
```

### Build & Deploy (GitHub Pages)

```bash
npm run build
# dist/ is the deployable static site
```

Tracked in [#4](https://github.com/akunzai/wisdom-quotes/issues/4).

## Import / Export Format

```json
{
  "version": "1.0",
  "exportedAt": "2026-07-06T12:00:00.000Z",
  "quotes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "text": "未經審視的人生不值得過。",
      "author": "蘇格拉底",
      "sourceUrl": "https://example.com/source",
      "createdAt": "2026-07-06T10:00:00.000Z",
      "updatedAt": "2026-07-06T10:00:00.000Z",
      "visibility": "private"
    }
  ]
}
```

On import, quotes are matched by `id`; when IDs collide, the record with the newer `updatedAt` wins.

## UI / UX Direction

- **Display name**: 智慧語錄
- **Language**: Traditional Chinese (zh-TW) for all user-facing copy
- **Fonts**: Noto Serif TC for quote text, Noto Sans TC for navigation and controls
- **Themes**: Light — warm parchment paper; Dark — deep ink blue with warm gold accents
- **Companions**: optional page cat that wanders, occasionally stops to read quote cards, and appears in focus mode; toggle in settings; respects `prefers-reduced-motion`
- **Animation**: focus mode fade-in

See `mockup/index.html` for the interactive design reference.

## Project Structure

```
wisdom-quotes/
├── AGENTS.md          # AI assistant dev guide (CLAUDE.md → this file)
├── README.md          # This file
├── mockup/            # Interactive HTML design preview
├── src/               # Source code (pending scaffold)
└── public/            # Static assets
```

## License

MIT License

## Contributing

Open an issue or submit a PR. Read [AGENTS.md](./AGENTS.md) for conventions; pick a task from the [issue board](https://github.com/akunzai/wisdom-quotes/issues).