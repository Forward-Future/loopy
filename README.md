# Loop Library

The Loop Library skill is an installable guide for your AI agent. Tell it what
you want to get done and it can find a published loop, adapt one to your
situation, or help you design a new one through a short conversation.

Loop Library is a collection of reusable ways to get better work from AI
agents. Each loop tells an agent what to do, how to check its work, what to try
next, and when to stop.

[Browse the Loop Library](https://signals.forwardfuture.ai/loop-library/)

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

## What the Loop Library skill does

The Loop Library skill gives your agent direct access to the ideas in the
library. You can use it to:

- Find a published loop that fits what you are trying to get done.
- Adapt a useful loop to your tools, limits, and definition of success.
- Design a new loop through a short, plain-language conversation.
- Turn the result into a compact prompt you can use right away.

The skill checks the live catalog when it recommends a published loop. It does
not quietly start schedules, change production, or send messages on your
behalf. Those actions still require the normal permissions and approvals.

## Install the skill

Run this command in your terminal:

```bash
npx skills add Forward-Future/loop-library --skill loop-library -g
```

The `-g` flag makes the skill available across your projects.

Once it is installed, try asking your agent:

> Use $loop-library to find a loop for keeping our documentation current.

Or start with an outcome and let the skill help shape it:

> Use $loop-library to help me design a loop that turns customer feedback into
> verified fixes.

You do not need to know the right loop vocabulary before you begin. Describe
what you want to get done, and the skill will ask only for the decisions it
needs.

## Explore or contribute

Visit the [Loop Library](https://signals.forwardfuture.ai/loop-library/) to
browse published loops, copy one into your own workflow, or submit a loop that
has worked well for you.

Loop Library is a [Forward Future](https://www.forwardfuture.ai/) project and is
available under the [MIT License](LICENSE).

<details>
<summary>Notes for maintainers</summary>

### Preview locally

```bash
python3 -m http.server 4173 --directory site
```

Then open `http://localhost:4173`.

### Validate a change

```bash
npm ci --prefix worker
node scripts/build-skill-catalog.mjs
node scripts/build-loop-pages.mjs
node scripts/build-social-images.mjs
node --check scripts/build-social-images.mjs
node --check site/script.js
node --check scripts/build-loop-pages.mjs
node --check scripts/loop-data.mjs
node scripts/check.mjs
npm --prefix worker run check
python3 -m json.tool site/.herenow/data.json >/dev/null
git diff --check
```

Read [AGENTS.md](AGENTS.md) before editing loops or publishing the site. It
contains the source-of-truth rules for generated files, form security, and
clean-main deployments.

</details>
