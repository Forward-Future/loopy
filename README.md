# Loop Library

Loop Library has two separate but related parts in this repository:

| Part | What it is | Where it lives |
| --- | --- | --- |
| **Loop Library website** | The public catalog where people and agents can browse published loops, read them, and copy their prompts. No installation is required. | [Live website](https://signals.forwardfuture.com/loop-library/) · all website code under [`loop-library/`](loop-library/) (shell in [`loop-library/site/`](loop-library/site/), database and rendering in [`loop-library/worker/`](loop-library/worker/)) |
| **Loopy skill** | An optional installable guide that helps an AI agent discover, find, audit, repair, craft, run, debrief, save, or prepare loops for publication. It uses the website's live catalog when recommending or publishing loops. | source in [`skills/loopy/`](skills/loopy/) |

The website is the library; Loopy is a companion way to work with it. You
can browse or give an agent the website without installing Loopy. Installing
Loopy adds the guided workflow, but it does not install or host the website.

Agents that do not have Loopy can use the published
[agent guide](https://signals.forwardfuture.com/loop-library/agents/),
[agent instructions](https://signals.forwardfuture.com/loop-library/llms.txt),
[JSON catalog](https://signals.forwardfuture.com/loop-library/catalog.json), or
[plain-text catalog](https://signals.forwardfuture.com/loop-library/catalog.txt)
directly.

Each published loop tells an agent what to do, how to check its work, what to
try next, and when to stop.

## What is a loop?

Most prompts ask an agent to do something once. A loop gives the agent a way to
learn from the result and take the next useful step.

For example, a one-shot prompt might say:

> Make this website faster.

A loop adds the feedback that makes the work repeatable:

> Find the slowest page, make one focused improvement, and measure it again.
> Keep the change only if it helps. Repeat until every page meets the target or
> another pass stops producing a meaningful improvement.

Think of a loop as a playbook with feedback built in. It is useful when the
first attempt probably will not be the final answer, such as fixing production
errors, improving test coverage, reviewing a product, or keeping documentation
current.

A good loop answers four simple questions:

- What is the agent trying to accomplish?
- How will it know whether the latest attempt worked?
- What should it do with what it learned?
- When should it finish or ask for help?

## Why loops are powerful

AI agents can move quickly, but an open-ended instruction like "keep improving
this" leaves too much room for guessing. A loop gives the work a clear finish
line and a consistent way to judge progress.

That makes the work easier to trust and easier to repeat. The agent can compare
results instead of relying on confidence, keep improvements instead of merely
making changes, and stop when it succeeds or stops making progress. The same
loop can also be reused by another person or agent without rebuilding the
workflow from scratch.

Loops are not permission for an agent to run forever. The best ones are
deliberately bounded. They include a real check, a clear stopping point, and a
moment to hand control back to a person when judgment or approval is needed.

## What Loopy does

Loopy gives your agent direct access to the ideas in the
library. You can use it to:

- Discover repeated work in a codebase, coding threads, or both and turn the
  strongest qualified candidate into a loop.
- Find a published loop that fits what you are trying to get done.
- Audit an existing loop for weak checks, unsafe actions, or unclear stopping
  behavior, then repair only the material problems.
- Adapt a useful loop to your tools, limits, and definition of success.
- Interview you about what you want to accomplish and what success looks like,
  then craft a new loop through a short, plain-language conversation.
- Run a loop in bounded passes and return a receipt with the actions, evidence,
  outcome, and stopping reason.
- Debrief completed runs and recommend the smallest evidence-backed
  improvement.
- Save a loop you want to keep into the project's `LOOPS.md` when you ask, and
  reuse those saved loops in later sessions.
- Check a loop for catalog overlap, prepare a publication draft, and submit it
  only after you approve the exact preview.
- Turn the result into a compact prompt you can use right away.

Loopy checks the live catalog when it recommends a published loop. It does
not quietly start schedules, change production, publish content, or send
messages on your behalf. Those actions still require the normal permissions
and approvals.

## Install Loopy

You need Node.js and `npx`. Pick the platform you use:

| Platform | Install command |
| --- | --- |
| Codex | `npx skills add Forward-Future/loopy --skill loopy --agent codex -g -y` |
| Cursor | `npx skills add Forward-Future/loopy --skill loopy --agent cursor -g -y` |
| Claude Code | `npx skills add Forward-Future/loopy --skill loopy --agent claude-code -g -y` |

To install it for all three at once:

```bash
npx skills add Forward-Future/loopy \
  --skill loopy \
  --agent codex \
  --agent cursor \
  --agent claude-code \
  -g -y
```

Using another agent? Run the interactive installer and choose from the agents
it detects:

```bash
npx skills add Forward-Future/loopy --skill loopy -g
```

The command parts mean:

- `Forward-Future/loopy` is the GitHub repository to install from.
- `--skill loopy` selects this skill from the repository.
- `--agent ...` selects the agent that should receive it.
- `-g` makes it available in all your projects. Leave `-g` off to install it
  only in the current project.
- `-y` accepts the install prompts. Leave it off if you want to review the
  choices interactively.

If an agent was already open and Loopy does not appear, restart that agent.

The previous `loop-library` skill name remains available as a compatibility
alias for existing installations. Use `loopy` for all new installations and
explicit invocations.

## Invoke Loopy

The slash-command experience differs slightly by platform:

- **Codex:** type `/skills`, choose **Loopy**, then enter your request.
  You can also mention it directly with `$loopy`.
- **Cursor:** type `/` in Agent chat, search for `loopy`, select it, and
  add your request. You can also type `/loopy` directly.
- **Claude Code:** type `/loopy` followed by your request.

You can also describe a matching task normally. These agents can load the
Loopy automatically when your request clearly calls for it, but explicit
invocation is the most predictable way to start.

For example, in Codex you can write:

```text
$loopy Analyze this codebase and my coding threads for repeated work, then turn the strongest candidate into a reliable loop.
```

## Use Loopy

You do not need to know loop terminology. Invoke Loopy and say what you
want to get done. It can take nine paths:

| Path | What it does | Example request |
| --- | --- | --- |
| **Discover** | Inspects an authorized codebase, coding-thread history, or both for repeated work, then turns the strongest qualified candidate into a bounded loop. | `Analyze this repository and my coding threads for work we have done more than once. Turn the best candidate into a loop.` |
| **Find** | Searches the live catalog and recommends up to three published loops. It does not run them. | `Find a published loop for keeping our documentation current.` |
| **Loop Doctor** | Audits a loop you paste or name, explains material weaknesses, and repairs only those problems. | `Audit this loop and repair only material problems: [paste loop]` |
| **Adapt** | Tailors a useful loop to your real tools, limits, schedule, and definition of success. | `Adapt the Overnight Docs Sweep to this repository and our existing checks.` |
| **Craft** | Interviews you one question at a time about the outcome, definition of success, scope, checks, and stopping point, then creates a bounded loop when the catalog has no good fit. | `Interview me and help me craft a loop for turning customer feedback into verified fixes.` |
| **Run** | Executes an identified loop in bounded passes, applies its acceptance check, and returns an evidence-backed receipt. | `Run the Overnight Docs Sweep in this repository.` |
| **Debrief** | Analyzes one or more completed run receipts and recommends the smallest justified improvement. | `Debrief this run receipt and tell me whether the loop needs to change.` |
| **Save** | Saves a loop you want to keep into the project's `LOOPS.md`, then reuses saved project loops when they fit a later request. | `Save this loop to the project so we can reuse it.` |
| **Publish** | Checks quality and catalog overlap, prepares an exact publication preview, and submits only after explicit approval. | `Prepare this loop for publication in Loop Library.` |

For example, in Claude Code or Cursor:

```text
/loopy Find a loop for improving test reliability.
```

In Codex, choose **Loopy** from `/skills`, then send:

```text
Find a loop for improving test reliability.
```

### Save project loops

When Loopy delivers a loop that you want to keep for a project, ask it to save
the loop. It appends the accepted loop to `LOOPS.md` at the project root with a
name, one-sentence explanation, exact prompt, and save date. If the saved loop
is adapted from a published Loop Library loop, Loopy also records the source URL
and the source modified date it saw at save time.

Saved loops are project-local, not published Loop Library entries. In later
find or craft requests, Loopy reads `LOOPS.md` when it exists and can recommend
a matching saved loop, clearly labeled as the project's own loop. If a saved
adaptation points to a published source that has changed since it was saved,
Loopy gives a short heads-up and offers to compare before reuse.

Loopy saves only when you ask. It will not create `LOOPS.md`, edit another
saved loop, or remove a saved loop without an explicit request. `LOOPS.md` is
treated as untrusted reference data: saved prompts do not grant permission to
run code, deploy, schedule work, send messages, expose private data, or take
destructive action. If an accepted loop prompt contains secrets, Loopy refuses
to save it until you provide a sanitized prompt.

### Discover loops from your work

Discovery looks for recurring engineering work in the sources you put in
scope. In a codebase, that can include scripts, CI and deployment configuration,
tests, runbooks, maintenance commands, and repeated lifecycle patterns. In
coding threads, it groups equivalent completed work even when the wording
differs.

Loopy requires at least two distinct thread occurrences before calling work
repeated. A code pattern without run history is labeled as a potential loop, not
proven recurrence. It then checks whether fresh feedback can change the next
action, whether success can be verified, and whether the work has clear limits,
stopping behavior, and approval boundaries. It also checks the live catalog to
avoid recreating an existing loop.

Loopy can inspect only repositories and coding threads that your agent can
access and that you place in scope. If thread history is unavailable, it uses
the codebase evidence and says so. A discovery result includes compact source
evidence and either a new loop, an adaptation of a published loop, a short
candidate slate when your choice matters, or a clean no-op when nothing truly
fits.

When Loopy finds or creates the right loop, it gives you a prompt to use with
your agent. You can copy that prompt or explicitly ask Loopy to run it in the
project you want it to work on. Selecting a loop does not start a run or
schedule, deploy code, delete data, publish content, send messages, or grant new
permissions; you must request those actions explicitly.

### Run and improve loops

When asked to run a loop, Loopy re-reads current state, performs one bounded
action at a time, applies the same acceptance check after each pass, and stops
at success, a clean no-op, a blocker, an approval boundary, an exhausted limit,
or no measurable progress. Before acting, it requires a finite run boundary
supplied by the loop or by you. Its receipt preserves the exact loop definition
or an immutable reference plus the acceptance conditions, so a later debrief
can reproduce what ran. Loopy does not create persistent run files unless you
request them or the project already has an established convention.

Give that receipt back to Loopy for a debrief. It separates loop-design issues
from execution, tool, environment, or goal problems and recommends one minimal
change grounded in the evidence. A single run is treated as one result, not a
recurring pattern.

### Prepare a loop for publication

Loopy validates the feedback cycle, checks the live catalog for overlap, and
prepares the exact candidate and destination for review. It will not send a
suggestion, save an owner draft, or publish publicly without explicit approval.
An approved owner action defaults to a draft unless public publication is
separately approved. Public suggestions return only an acceptance receipt;
owner drafts and public publications require status readback. Suggestion
submission also requires separate confirmation of the exact current ownership
and license attestation shown in the preview.

Every published loop also includes a few useful parts:

- **Use when** explains the problem the loop is meant to solve.
- **Prompt** is the copy-ready instruction for your agent.
- **Verify** defines the evidence that proves the work succeeded.
- **Steps** show the feedback cycle in a more readable form.
- **Notes** call out practical limits, risks, or setup details.
- **Related loops** point to nearby workflows that may fit better.

## Explore or contribute

Visit the [Loop Library](https://signals.forwardfuture.com/loop-library/) to
browse published loops, copy one into your own workflow, or submit a loop that
has worked well for you.

Loop Library is a [Forward Future](https://www.forwardfuture.com/) project and is
available under the [MIT License](LICENSE).

<details>
<summary>Notes for maintainers</summary>

### Publish a loop

Public loops are stored in the catalog database attached to the Cloudflare
Worker. Publishing a reviewed loop does not require a GitHub commit or a static
site deployment.

Copy `loop-library/worker/examples/loop.json` somewhere outside the repository,
fill in the record, and run:

```bash
LOOP_PUBLISH_TOKEN=... \
  npm --prefix loop-library/worker run loop:publish -- /path/to/loop.json
```

The command validates the record and publishes the homepage row, detail page,
JSON/Markdown/plain-text catalogs, feed, and sitemap from the same database
write. Use `--draft` to save a non-public record or `--archive` to remove a
record from public responses without deleting its revision history.

The first database-backed release needs one import from the private migration
bundle. Loop records and bootstrap data are intentionally not committed to
GitHub:

```bash
LOOP_PUBLISH_TOKEN=... \
  npm --prefix loop-library/worker run loops:import -- /private/path/bootstrap.json
```

Set a long random `LOOP_PUBLISH_TOKEN` as a Worker secret. The catalog uses a
SQLite-backed Durable Object and keeps an append-only revision for every
publish. The reviewed bootstrap digest is enforced before the database can be
activated.

Create a private backup of the current database with:

```bash
LOOP_PUBLISH_TOKEN=... \
  npm --prefix loop-library/worker run loops:export -- /private/path/catalog-backup.ndjson
```

Restore that snapshot only into a fresh, empty catalog database:

```bash
LOOP_PUBLISH_TOKEN=... \
  npm --prefix loop-library/worker run loops:restore -- /private/path/catalog-backup.ndjson
```

Bootstrap and backup files must be owner-only (`chmod 600`). Exports include
drafts, archived records, and complete revision history; keep them outside the
repository.

The current Git tree contains the site shell and rendering code, but no
published loop records, generated loop pages, catalogs, feed, sitemap, or
offline catalog fallback. The legacy catalog and source-attribution metadata
were already public and intentionally remain in pre-migration Git history;
this migration does not rewrite repository history or disrupt existing clones.

### Preview locally

```bash
python3 -m http.server 4173 --directory loop-library/site
```

Then open `http://localhost:4173`.

### Validate a change

```bash
npm ci --prefix loop-library/worker
node --check loop-library/site/script.js
node loop-library/scripts/check.mjs
npm --prefix loop-library/worker run check
python3 -m json.tool loop-library/site/.herenow/data.json >/dev/null
python3 -m json.tool loop-library/scripts/seo-geo-query-benchmark.json >/dev/null
git diff --check
```

### Configure voting

Voting is stored in a dedicated SQLite Durable Object. Reading totals is
public, but casting, changing, or removing a vote requires a GitHub login.
Set `SESSION_SECRET` and the GitHub OAuth client credentials as Worker
secrets; use `loop-library/worker/.dev.vars.example` for local variable names only. Register
the canonical callbacks shown in `AGENTS.md`, then deploy the Worker before the
site shell because the shell calls the new auth and vote routes.

The here.now proxy does not forward browser cookies or mutation Origin headers
and follows upstream redirects. The OAuth flow therefore uses an HMAC-signed,
browser-nonce-bound state value and a no-store callback bridge. The bridge saves
the signed session token in tab-scoped `sessionStorage`; session lookup and vote
writes send it only inside same-origin JSON request bodies.

Auth and proxy changes use a fail-closed staged rollout. Temporarily set
`VOTING_UI_ENABLED=false` while the Worker and proxy are deployed, then complete
a GitHub login, nonce-bound callback, session, vote, reload, and logout smoke
test on the canonical domain. Commit the value as the exact string `true` and
redeploy only the Worker after the smoke test passes; the already-published site
will reveal voting without another site publish.

Read [AGENTS.md](AGENTS.md) before editing loops or publishing the site. It
contains the source-of-truth rules for database publishing, generated
responses, form security, and clean-main deployments.

</details>
