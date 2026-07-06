# Wisdom Quotes (智慧語錄)

A personal quote collection app with a Traditional Chinese UI, light/dark themes, and browser-local storage.

## Features

- Create, edit, delete, and search quotes
- Browse by author and focus mode for single-quote reading
- Light/dark theme and JSON import/export
- Optional wandering page cat companion

## Prerequisites

- [mise](https://mise.jdx.dev/) — installs Node LTS and [aube](https://aube.jdx.dev/) per `mise.toml`

## Getting Started

```bash
git clone https://github.com/akunzai/wisdom-quotes.git
cd wisdom-quotes
aube install
aubr dev
```

Open [http://localhost:4321/wisdom-quotes/](http://localhost:4321/wisdom-quotes/).

## Scripts

| Command | Description |
|---------|-------------|
| `aubr dev` | Start the development server |
| `aubr build` | Type-check and build to `dist/` |
| `aubr preview` | Preview the production build |
| `aubr typecheck` | Run Astro/TypeScript checks |
| `aubr lint` | Lint the codebase |
| `aubr format` | Format with Prettier |

## Contributing

Issues and pull requests are welcome. Please open an issue before large changes.