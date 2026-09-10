# Verification

How an agent exercises a change in this repo before it reaches review.
Human setup narrative lives in `README.md`; this file
holds only what an agent needs.

## Starting the environment

```sh
aubr lint && aubr format:check && aubr test:unit && aubr build
```

<!-- drift:forge github -->
<!-- drift:entrypoint-cmd aubr lint && aubr format:check && aubr test:unit && aubr build -->

It never prompts. A step needing a human aborts non-zero naming the
prerequisite — see Human prerequisites below.

**Proof it ran**: build completes with zero errors and `dist/index.html` is generated.

## Checks

Run via `aubr` (aube package manager):

| What                | Command                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| Full gate           | `aubr lint && aubr format:check && aubr test:unit && aubr build`                |
| Linter              | `aubr lint`                                                                     |
| Formatter check     | `aubr format:check`                                                             |
| Unit verification   | `aubr test:unit`                                                                |
| Type check & build  | `aubr build`                                                                    |
| Browser & E2E tests | `aubr preview --port 4322 --host 127.0.0.1 &` then `./scripts/browser-tests.sh` |

## Human prerequisites

None. `node` and `aube` are managed via `mise`.

## Ports

Not applicable. wisdom-quotes has no permanent listening service for its gate, so several agents can run the gate in the same clone at once. (The local preview server optionally listens on port 4322 during browser tests).

## Changes that need a deployed environment

These cannot be verified locally. Open the request as a draft, let the
pipeline deploy, then verify against `https://akunzai.github.io/wisdom-quotes/`:

- GitHub Pages production deployment: changes to deployment workflows or base URL routing that only trigger on push to `main`.

Evidence from that environment cites the pipeline or deployment id and
the commit SHA, and is treated as containing real data: mask, crop, or
use a dedicated test account.

Agent may deploy to it: **no**.
Credentials come from GitHub Actions environment secrets.

## Capturing evidence

- Recording: `to-walkthrough-video` or `tcut` — fallback to terminal-browser or manual capture
- Screenshots: `playwright-cli screenshot` or browser capture

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
