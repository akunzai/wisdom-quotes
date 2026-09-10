# Issue tracker: GitHub

**This file is English throughout**, sample blocks included, so it reads
one way to every model, whatever language the repo chose for its issues.

Issues live as GitHub issues. Use the `gh` CLI for all
operations; it infers the repo when run inside a clone.

Write issue titles and descriptions in **English**.

## Conventions

- **Create**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read**: `gh issue view <number> --comments`
- **List**: `gh issue list --state open --json number,title,labels`
- **Comment**: `gh issue comment <number> --body "..."`
- **Label**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Use a concise descriptive title with no Conventional Commit prefix.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## Description shape

1. Open with what a product manager or a new engineer would observe: the
   symptom or the request, in plain language. Skip file paths and
   function names unless the reader cannot otherwise locate the issue.
2. Add a visual the forge renders inline — a screenshot or recording for
   a UI bug, a Mermaid diagram for a flow or state problem. Skip formats
   the description editor cannot render, such as a link to an external
   artifact or a raw HTML or SVG file. Upload it with the repeatable `--attach` flag
   (`gh issue create --attach './bug.png#The error state'`);
   alt text follows the path after `#`. Only when capture is genuinely
   impossible, leave `<!-- screenshot pending: <what it should show> -->`
   rather than omitting it silently.
3. Close with a collapsed technical section, so it does not push the
   human summary below the fold:

```markdown
<details>
<summary>Technical details</summary>

suspected cause, related code paths, repro commands, log excerpts

</details>
```

**No personally identifiable information in any attachment**; use test
data, masking, or cropping.

## Spec issues

An issue an agent will implement from carries a different shape, because
its reader is building rather than triaging. Acceptance criteria stay
above the fold; only background goes into `<details>`.

```markdown
<one paragraph: the observable outcome, in English>

## Acceptance criteria

- [ ] <checkable statement about observable behaviour>
- [ ] <one per criterion; a reviewer can tick these without reading code>

## Scope

- In: <paths or areas>
- Out: <what this issue deliberately does not change>

## Verification

<how to prove it works, per docs/agents/verification.md; say here when
this needs a deployed environment rather than a local run>

<details>
<summary>Technical details</summary>

related code paths, prior art, log excerpts, open questions

</details>
```

Use the vocabulary the project already defines for its domain, so the
issue, the tests, and the code name the same things.

An issue with unanswered open questions is not ready to implement. Say
so in the issue rather than letting an agent guess.

## Labels

This repo's own labels, read from `gh label list --limit 100`.

Check the other documents under `docs/agents/` before listing. Where one
already owns part of this vocabulary — `triage-labels.md` owns the triage
roles — point at it and list only what it does not cover.

- **Required on every issue**: none
- **Triage roles**: see `docs/agents/triage-labels.md` (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)
- **Applied when it applies**:
  - `bug`: Something isn't working
  - `enhancement`: New feature or request
  - `documentation`: Improvements or additions to documentation
  - `phase-1`: MVP — local quote management
  - `phase-2`: Google Drive sync
  - `phase-3`: Public quotes & D1
  - `decision`: Open product decision
  - `epic`: Roadmap / umbrella issue

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
