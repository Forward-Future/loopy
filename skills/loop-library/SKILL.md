---
name: loop-library
description: Find, compare, adapt, and design repeatable AI-agent loops with explicit triggers, actions, verification, stopping conditions, guardrails, and handoffs. Use when a user asks for a loop, recurring agent workflow, automation cadence, iterative improvement process, an existing Loop Library recommendation, or help turning an outcome into a bounded copy-ready loop through a short question-led design session.
---

# Loop Library

Help the user reuse a published Loop Library loop when one fits. Otherwise,
adapt the closest loop or design a new one through a focused interview. Treat a
loop as a feedback system with terminal states, not as permission for endless
autonomy.

## Route the request

Choose the smallest useful path:

- **Find:** Recommend one to three published loops for a stated problem.
- **Adapt:** Start from a published loop and replace its thresholds, tools,
  cadence, owners, or checks without weakening its feedback cycle.
- **Design:** Ask a few plain-language questions, then produce a new bounded
  loop.
- **Find, then design:** Search first. Use the nearest published loop as a
  scaffold and ask only about the missing decisions.

Do not ask for information the user already supplied. If the request is vague,
begin with: "What would you like the agent to get done?"

## Find a published loop

1. Read [references/catalog.md](references/catalog.md). Search its `Use when`,
   `Prompt`, `Verify`, and keyword fields by the user's outcome, trigger,
   artifact, risk, and evidence—not only by title.
2. If the user asks for the latest catalog, or freshness materially affects the
   answer and web access is available, check the canonical
   [Loop Library](https://signals.forwardfuture.ai/loop-library/) before
   recommending.
3. Rank candidates by outcome fit, available inputs and tools, verification
   fit, acceptable authority, and stopping condition.
4. Recommend at most three. For each, give its exact published title and link,
   why it fits, and the smallest adaptation required.
5. Prefer adapting a strong match over inventing a nearly identical loop. If no
   loop fits, say so plainly and switch to the design interview.

Never invent a Loop Library title, number, contributor, or URL. Label an
adaptation or new design as such; do not imply that it is already published.

## Run the design interview

Assume the user is new to loops. Ask one short question at a time in everyday
language. In the interview questions, do not use terms such as trigger, success
gate, terminal state, guardrail, or persistent state unless the user asks what
they mean.

Start with:

1. "What would you like the agent to get done?"

Then ask only what is still needed:

2. "When should it run: when you ask, on a schedule, or after something
   happens?"
3. "What can it look at or change? Is anything off-limits?"
4. "How will you know it worked?"
5. "When should it stop or ask you for help?"

Infer the smallest repeatable action, what to remember, and the final handoff
from the user's answers instead of asking them to design those parts. If the
user does not know an answer, suggest one reasonable default and ask them to
confirm it. Stop asking questions once the remaining details would not change
the design materially.

## Design the feedback cycle

Build every loop around this sequence:

1. **Observe:** Read fresh state and collect the agreed evidence.
2. **Choose:** Select the highest-value in-scope action from explicit criteria.
3. **Act:** Make one bounded, reversible change or produce one candidate.
4. **Verify:** Run the same acceptance check under recorded conditions.
5. **Record:** Save the action, evidence, outcome, and remaining work.
6. **Repeat or stop:** Continue only while progress is measurable and budget
   remains; otherwise enter a named terminal state.

Apply these rules:

- Make the success gate observable and reproducible. Replace "until happy"
  with a rubric, threshold, benchmark, reviewer decision, or finite scenario
  set whenever possible.
- Define success, clean no-op, blocked, approval-required, exhausted, and
  stagnated outcomes where relevant. Never report an error or exhausted budget
  as success.
- Bound time, iterations, cost, retries, or affected scope. Add an escalation
  owner for important blocked work.
- Re-read current state before consequential actions. Do not ship stale code,
  partial artifacts, or assumptions carried from an earlier cycle.
- Preserve unrelated user work. Require explicit approval for destructive,
  irreversible, production, financial, privacy-sensitive, or external-message
  actions.
- Separate the working signal from a fresh acceptance gate when optimizing a
  prompt, model, ranking, or other artifact that could overfit its own metric.
- Use independent verification when the same actor should not both create and
  approve high-impact output.
- Recommend a one-shot workflow instead of manufacturing a loop when no new
  feedback can change the next action.

Designing a loop does not authorize enabling a schedule, changing production,
or sending external messages. Implement or activate it only when the user asks.

## Deliver the loop

Return a concise design in this order:

```markdown
## [Loop name]

Purpose: [observable outcome]
Use when: [fit and prerequisites]
Trigger: [event, schedule, threshold, or manual start]
Inputs and authority: [evidence, tools, allowed reads and writes]
Persistent state: [what survives between cycles]

Cycle:
1. Observe ...
2. Choose ...
3. Act ...
4. Verify ...
5. Record ...
6. Repeat or stop ...

Success gate: [reproducible proof]
Other terminal states: [no-op, approval, blocker, exhaustion, stagnation]
Guardrails: [forbidden and approval-gated actions]
Budget and escalation: [limits, retries, owner]
Finish with: [artifact or handoff]

Copy-ready prompt:
> [self-contained agent instruction]
```

Write the copy-ready prompt so it can stand alone. Use this compact pattern:

> When [trigger], inspect [fresh inputs]. Choose [bounded action] using
> [criteria], then [act]. After each action, verify [evidence] under [conditions]
> and record [state]. Repeat only while [progress rule] and [budget] allow. Stop
> successfully when [gate]. Stop without changes when [no-op]. Request approval
> or escalate when [condition]. Never [guardrail]. Finish with [artifact].

End with any assumptions that still need confirmation and one or two related
published loops when they offer useful patterns.
