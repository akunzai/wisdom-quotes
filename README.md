# Wisdom Quotes

A personal quote collection app with multilingual UI (Traditional Chinese, English, Japanese), light/dark themes, and browser-local storage.

## Features

- Create, edit, delete, and search quotes
- Browse by author and focus mode for single-quote reading
- Light/dark theme, locale switcher, and JSON import/export
- Optional wandering page cat companion
- Optional manual Google Drive quote backup and restore

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

| Command          | Description                     |
| ---------------- | ------------------------------- |
| `aubr dev`       | Start the development server    |
| `aubr build`     | Type-check and build to `dist/` |
| `aubr preview`   | Preview the production build    |
| `aubr typecheck` | Run Astro/TypeScript checks     |
| `aubr lint`      | Lint the codebase               |
| `aubr format`    | Format with Prettier            |

## Google Drive backup setup

Google Drive backup is optional. Without configuration, local quotes and JSON
import/export continue to work, and Settings explains that cloud backup is not
enabled.

1. Create a Google Cloud project, enable the Drive API, and configure its OAuth
   consent screen and audience. Use an appropriate publishing configuration
   before public release.
2. Create an OAuth **Web application** client. Register the site's origin
   (for example, `https://akunzai.github.io`), without the `/wisdom-quotes` path,
   and your development origin and port when testing locally.
3. Copy `.env.example` to `.env` and set `PUBLIC_GOOGLE_DRIVE_CLIENT_ID` to the
   public web client ID. Never include a client secret. Restart the dev server
   after changing configuration.
4. For GitHub Pages, set the repository Actions variable
   `PUBLIC_GOOGLE_DRIVE_CLIENT_ID` before the next build. The deployment workflow
   passes it to Astro; public environment variables are embedded at build time.

Only `drive.appdata` is requested. Each manual backup creates a separate version
hidden from the normal Drive file list; old versions are not automatically
deleted. Restore requires exporting the current collection and explicitly
confirming it was saved, then replaces the entire local collection. Device
preferences are excluded. Tokens are held in memory only; a new page session or
expiry can require another authorization action. This is not automatic sync.

See [Google's token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model),
[web client setup](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid),
[Drive app data](https://developers.google.com/workspace/drive/api/guides/appdata),
and [Astro environment variables](https://docs.astro.build/en/guides/environment-variables/).

### Automated backup verification

Run `aubr test:unit` for the demo-data checks and mocked Drive/API tests. For the
transaction and settings-flow tests, start a dedicated dev server with synthetic
configuration, then run:

```bash
PUBLIC_GOOGLE_DRIVE_CLIENT_ID=test-client-id aubr dev --host 127.0.0.1 --port 4323
aubr test:backup
```

`test:backup` uses an isolated browser session, synthetic quote data, and mocked
Google responses. It exercises real IndexedDB transactions, but does not prove
real OAuth or Drive connectivity. `BACKUP_TEST_BASE_URL` can override the default
local dev URL. Do not point these tests at a personal browser session. If a dev
server is already running, stop it before starting with the test configuration.

Before release, use a dedicated Google test account on a configured origin to
verify real creation, listing, and restore across independent browser storage
contexts. Follow `docs/agents/verification.md` for deployment restrictions and
safe evidence capture.

## Localization

| File                                   | Language            |
| -------------------------------------- | ------------------- |
| [README.md](README.md)                 | English (default)   |
| [README.zh-Hant.md](README.zh-Hant.md) | Traditional Chinese |
| [README.ja.md](README.ja.md)           | Japanese            |

## Contributing

Issues and pull requests are welcome. Please open an issue before large changes.
