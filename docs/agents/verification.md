# Verification

How an agent exercises a change in this repo before it reaches review.
Human setup narrative lives in `README.md`; this file
holds only what an agent needs.

## Starting the environment

```sh
bun run lint && bun run fmt:check && bun run test:unit && bun run build
```

<!-- drift:forge github -->
<!-- drift:entrypoint-cmd bun run lint && bun run fmt:check && bun run test:unit && bun run build -->

It never prompts. A step needing a human aborts non-zero naming the
prerequisite — see Human prerequisites below.

**Proof it ran**: build completes with zero errors and `dist/index.html` is generated.

## Checks

Run via `bun run`:

| What                | Command                                                                            |
| ------------------- | ---------------------------------------------------------------------------------- |
| Full gate           | `bun run lint && bun run fmt:check && bun run test:unit && bun run build`          |
| Linter              | `bun run lint`                                                                     |
| Formatter check     | `bun run fmt:check`                                                                |
| Unit verification   | `bun run test:unit`                                                                |
| Type check & build  | `bun run build`                                                                    |
| Browser & E2E tests | `bun run preview --port 4322 --host 127.0.0.1 &` then `./scripts/browser-tests.sh` |

## Human prerequisites

None. `node` and `bun` are managed via `mise`.

## Ports

Not applicable. wisdom-quotes has no permanent listening service for its gate, so several agents can run the gate in the same clone at once. (The local preview server optionally listens on port 4322 during browser tests).

## Deployment verification

For toolchain, deployment-workflow, and base URL changes, run the local
gate and browser tests against the production build, and confirm the PR's
CI jobs pass. This is sufficient for review readiness when production
only deploys after merging to `main`.

After merging, confirm the Pages deployment succeeds for the merged commit,
then smoke-test `https://akunzai.github.io/wisdom-quotes/`, including affected
routes and assets. Record the workflow run or deployment id and commit SHA.
Until then, report production deployment as pending post-merge verification;
it does not require keeping an otherwise verified PR in draft.

If a change requires deployed behavior that local tests and CI cannot
exercise, use a preview or staging environment before marking it ready when
one is available. If production is the only such environment, document the
remaining risk, post-merge check, and rollback plan in the PR for review.

Treat deployed evidence as containing real data: mask, crop, or use a
dedicated test account.

Agent may deploy to production: **no**.
Credentials come from GitHub Actions environment secrets.

## Capturing evidence

- Recording: `record-walkthrough` or `tcut` — fallback to terminal-browser or manual capture
- Screenshots: `playwright-cli screenshot` or browser capture
- UI locale: **`zh-Hant`**. Catalogs are `zh-Hant` (default), `en`, and
  `ja` in `src/i18n/`. The app reads `localStorage` key `wq-locale`
  first, then falls back to `zh-Hant` — it does not follow the browser.
  Browser automation defaults to `en-US`, so set `"locale": "zh-TW"` and
  set `wq-locale` to `zh-Hant`. A leftover `en` or `ja` value outranks
  the capture locale. Captions follow Traditional Chinese
  (`"captionLocale"`).

**This document is where the capture rules live**, and the request
document points here rather than restating them. A capture taken on the
developer's own machine carries their account's data, username, and home
paths as readily as a shared environment does. Assert on the frame, a
marker, or fixture data, and crop or mask what the tool happened to be
showing.

For a change behind a mode switch or feature flag, confirm the far end
received the call. A healthy container and a green build are not
evidence that an integration is wired up.

## Not verified

- Cloudflare D1 and Google Drive sync: Phase 2 and Phase 3 integrations not yet implemented in Phase 1 MVP.

A gap you could have closed is not a gap. Run the check whose dependency
you have already seen running, and report a check you skipped as untried,
rather than recording it here as one this repo cannot run.
