# Published Loop Library catalog

Generated from `scripts/loop-data.mjs` (catalog updated 2026-06-19).
Live catalog: https://signals.forwardfuture.ai/loop-library/catalog.md
Machine-readable catalog: https://signals.forwardfuture.ai/loop-library/catalog.json

Search by outcome, trigger, artifact, evidence, category, or keyword. Treat
adaptations and new designs as unpublished unless they appear at the live catalog
URL above.

## 001 — [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/)

- Category: Engineering
- Use when: Use this whenever implementation changes may have left READMEs, setup guides, API references, examples, or runbooks behind.
- Prompt: Whenever a documentation pass is needed, review the codebase in full and make sure all documentation reflects the current implementation. Update stale documentation, verify the changes, then open a pull request.
- Verify: Documentation matches the current implementation. Finish with a reviewable pull request.
- Keywords: AI coding agent, documentation audit, documentation drift, documentation maintenance, pull request workflow
- Related: [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/), [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/)

## 002 — [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/)

- Category: Engineering
- Use when: Use this for a deliberate architectural refactor where the destination can be stated in concrete terms and the current system can be tested after each meaningful change.
- Prompt: Refactor until you are happy with the architecture. After each significant step, live-test the system, run autoreview, and commit. Track progress in /tmp/refactor-{projectname}.md.
- Verify: The architecture is satisfactory and checks pass. Live-test, autoreview, and commit each significant step.
- Keywords: AI coding agent, architecture refactor, autoreview, incremental refactoring, coding agent workflow
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

## 003 — [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

- Category: Engineering
- Use when: Use this when a product has a defined set of routes, a stable performance harness, and a 50 ms target that maps to a specific metric and environment.
- Prompt: Continue optimizing the code for speed. After each significant change, measure page-load performance across every page under the same repeatable test conditions. Continue until every page loads in under 50 ms.
- Verify: Every page loads in under 50 ms. Use the same benchmark and confirm there are no regressions.
- Keywords: AI coding agent, page load optimization, performance benchmark, web performance workflow, 50 ms page load
- Related: [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/), [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/)

## 004 — [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/)

- Category: Engineering
- Use when: Use this as a scheduled reliability pass when an agent can read production telemetry, trace failures into the repository, run the relevant tests, and prepare a reviewable fix.
- Prompt: Review our production logs for errors. If you find an actionable issue, trace it to its root cause, fix it, verify the fix, and open a pull request. If no actionable errors are present, stop without making changes.
- Verify: Actionable production errors are fixed and verified. Finish with a pull request, or stop when no actionable errors are present.
- Keywords: AI coding agent, production log review, error triage, root cause analysis, reliability workflow
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

## 005 — [The 100% test coverage loop](https://signals.forwardfuture.ai/loop-library/loops/100-percent-test-coverage-loop/)

- Category: Engineering
- Use when: Use this when 100% coverage is an explicit project requirement and the repository has a trustworthy coverage command, clear exclusions, and a test suite that can be run repeatedly.
- Prompt: Add tests until we have 100% test coverage.
- Verify: The full test suite passes at 100% coverage. Use the project's coverage report as the source of truth.
- Keywords: AI coding agent, 100 percent test coverage, test coverage workflow, automated testing, coding agent prompt
- Related: [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/), [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/)

## 006 — [The SEO/GEO visibility loop](https://signals.forwardfuture.ai/loop-library/loops/seo-geo-visibility-loop/)

- Category: Content
- Use when: Use this when a site has a defined set of priority pages and target questions, and you can rerun the same technical crawl and search visibility checks after each change.
- Prompt: Run an SEO/GEO audit across crawlability, indexation, page intent, titles, internal links, structured data, source citations, and answer-first content. Rank the gaps by expected impact, fix the highest-leverage issue, then rerun the same crawl and target-query benchmark across search engines and AI answer engines. Repeat until no critical technical issues remain, every priority query maps to a clear answer-ready page, and the benchmark shows no high-impact gap left to fix.
- Verify: Priority pages are indexable, answer-ready, and technically sound. The repeatable crawl and query benchmark finds no remaining high-impact gaps.
- Keywords: SEO audit, generative engine optimization, GEO workflow, AI search visibility, answer engine optimization
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/)

## 007 — [The logging coverage loop](https://signals.forwardfuture.ai/loop-library/loops/exhaustive-logging-coverage-loop/)

- Category: Engineering
- Use when: Use this when important user flows, service boundaries, background jobs, or failure paths are difficult to trace because the system's logging is incomplete or inconsistent.
- Prompt: Review the system's logging and add missing coverage until every important path produces useful, tested logs.
- Verify: Every important path emits useful, tested logs. Representative success and failure tests prove coverage without exposing sensitive data.
- Keywords: AI coding agent, structured logging, observability coverage, logging tests, production diagnostics
- Related: [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/), [The 100% test coverage loop](https://signals.forwardfuture.ai/loop-library/loops/100-percent-test-coverage-loop/)

## 008 — [The nightly changelog loop](https://signals.forwardfuture.ai/loop-library/loops/nightly-changelog-sweep/)

- Category: Engineering
- Use when: Use this when a project changes frequently enough that user-facing release notes can drift from merged pull requests, commits, deployments, and product changes.
- Prompt: Each night, review changes from the previous day and update the changelog with anything users should know.
- Verify: Every user-relevant change from the previous day is accounted for. The changelog is updated and validated, or the no-change result is recorded.
- Keywords: AI coding agent, nightly changelog, release notes workflow, changelog automation, daily repository review
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The repository cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/repository-cleanup-loop/)

## 009 — [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/)

- Category: Evaluation
- Use when: Use this when product quality needs a strict consecutive-success bar and failures should permanently improve the test and benchmark suite.
- Prompt: Test realistic scenarios. When one fails, document it, add regression and benchmark coverage, fix it, and restart the streak. Stop after [N] successful cases in a row.
- Verify: The latest [N] realistic cases pass in a row. Every earlier failure is documented, fixed, and protected by regression and benchmark coverage.
- Keywords: AI product evaluation, quality streak, regression testing, benchmark coverage, realistic scenarios
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The 100% test coverage loop](https://signals.forwardfuture.ai/loop-library/loops/100-percent-test-coverage-loop/)

## 010 — [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/)

- Category: Evaluation
- Use when: Use this for an end-to-end product evaluation when quality must be measured across the full feature set rather than a narrow regression or a few hand-picked examples.
- Prompt: Create [N] realistic scenarios covering every major capability. Before testing, define clear success criteria and choose a consistent evaluation method, such as pass/fail checks or a scoring rubric. Run every scenario under the same conditions and record evidence for each outcome. Fix the underlying cause of anything that does not meet the criteria, rerun the affected scenarios, and then rerun the complete set. Continue until every scenario meets the original quality bar.
- Verify: Every one of the [N] scenarios meets the defined quality bar. The final evaluated run covers every major capability under the original conditions.
- Keywords: AI product evaluation, full product testing, response scoring, quality benchmark, feature coverage
- Related: [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/), [The production data cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/production-data-cleanup-loop/)

## 011 — [The test-suite speed loop](https://signals.forwardfuture.ai/loop-library/loops/test-suite-speed-loop/)

- Category: Engineering
- Use when: Use this when slow tests are delaying local feedback or continuous integration and the project has stable commands for measuring runtime and coverage.
- Prompt: Optimize the test suite to run as quickly as possible without reducing coverage or changing behavior.
- Verify: The suite is faster with no coverage or behavior regression. Repeatable timing, the full passing suite, and the original coverage report prove the result.
- Keywords: AI coding agent, test suite performance, faster CI, test optimization, coverage preservation
- Related: [The 100% test coverage loop](https://signals.forwardfuture.ai/loop-library/loops/100-percent-test-coverage-loop/), [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

## 012 — [The repository cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/repository-cleanup-loop/)

- Category: Engineering
- Use when: Use this when abandoned branches, old worktrees, unclear pull requests, or unmerged commits make it difficult to know which repository state still matters.
- Prompt: Inspect local and remote branches, pull requests, commits, and worktrees. Recover valuable work and clean everything stale until the repository is current and organized.
- Verify: Valuable work is recovered and remaining repository state is intentional. Branches, pull requests, commits, and worktrees are current, owned, or safely removed with evidence.
- Keywords: AI coding agent, repository cleanup, git worktree audit, branch hygiene, pull request triage
- Related: [The stale-safe batch release loop](https://signals.forwardfuture.ai/loop-library/loops/stale-safe-batch-release-loop/), [The nightly changelog loop](https://signals.forwardfuture.ai/loop-library/loops/nightly-changelog-sweep/)

## 013 — [The stale-safe batch release loop](https://signals.forwardfuture.ai/loop-library/loops/stale-safe-batch-release-loop/)

- Category: Operations
- Use when: Use this when several branches or pull requests may be ready at once and the release must avoid stale worktrees, partial overlays, and incomplete changes.
- Prompt: Review pending changes and pull requests, exclude stale or unfinished work, combine the valid changes, and release them together.
- Verify: Only current, complete changes ship in the combined release. The released revision is the latest integrated main that contains every selected change.
- Keywords: AI release operations, batch release, stale code prevention, pull request coordination, deployment safety
- Related: [The repository cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/repository-cleanup-loop/), [The post-release baseline loop](https://signals.forwardfuture.ai/loop-library/loops/post-release-baseline-loop/)

## 014 — [The production data cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/production-data-cleanup-loop/)

- Category: Operations
- Use when: Use this when a production dataset contains records that no longer match a product, policy, taxonomy, or quality definition and the classifier allowed them through.
- Prompt: Review production records, remove anything that does not meet the allowed definition, improve the classification logic, and verify the remaining data.
- Verify: Every remaining record meets the allowed definition. Representative classification tests and a post-cleanup audit prove the retained data is valid.
- Keywords: AI data operations, production data cleanup, classification logic, data quality audit, regression examples
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The logging coverage loop](https://signals.forwardfuture.ai/loop-library/loops/exhaustive-logging-coverage-loop/)

## 015 — [The post-release baseline loop](https://signals.forwardfuture.ai/loop-library/loops/post-release-baseline-loop/)

- Category: Operations
- Use when: Use this immediately after a release when future regressions or improvements need to be measured against the exact version now in production.
- Prompt: After current releases finish, run the standard benchmarks and record the results as the new baseline.
- Verify: The new baseline belongs to the completed release. Revision, environment, benchmark version, conditions, and results are recorded together.
- Keywords: AI release operations, post-release benchmark, performance baseline, release verification, benchmark history
- Related: [The stale-safe batch release loop](https://signals.forwardfuture.ai/loop-library/loops/stale-safe-batch-release-loop/), [The test-suite speed loop](https://signals.forwardfuture.ai/loop-library/loops/test-suite-speed-loop/)

## 016 — [The ticket-to-PR-ready loop](https://signals.forwardfuture.ai/loop-library/loops/ticket-to-pr-ready-loop/)

- Category: Engineering
- Use when: Use this when a real but loosely written ticket, bug report, or customer complaint needs to become a bounded engineering change with enough proof for a fast review.
- Prompt: Turn [issue] into a review-ready fix. Reproduce the problem, identify the root cause with evidence, make the smallest scoped change, and rerun the same check plus relevant regression tests. Repeat only while the evidence changes. Stop when the fix is proved, [reproduction limit] is reached, or a broader decision is required. Do not expand scope without approval. Finish with the cause, change, proof, risks, and suggested pull-request summary.
- Verify: The failure is fixed, verified, and ready for review. The issue reproduces before the fix, no longer reproduces afterward, and relevant regression checks pass.
- Keywords: AI coding agent, ticket to pull request, bug reproduction, root cause analysis, review-ready patch
- Related: [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/), [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/)

## 017 — [The customer AI deployment loop](https://signals.forwardfuture.ai/loop-library/loops/customer-ai-deployment-loop/)

- Category: Operations
- Use when: Use this when an AI workflow must live inside a real customer process and needs validation, approval, gradual rollout, monitoring, and a clear business outcome.
- Prompt: Move one agreed customer workflow toward a measurable production outcome. Define the owner, users, inputs, outputs, risks, approvals, and success check. Build or change one bounded part, test it with representative data, fix the smallest verified problem, and retest. Release only through approved stages and monitor the agreed signals. Stop on verified success, a clear blocker, or no progress. Ask before customer-facing, sensitive, financial, or irreversible actions. Finish with the outcome, evidence, open risks, and next step.
- Verify: The workflow reaches an approved, measurable outcome. Evidence confirms the agreed rollout stage and success check, or the run stops with a clear blocker, owner, and next step.
- Keywords: customer AI deployment, AI workflow rollout, approval gates, production monitoring, AI ROI
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/)

## 018 — [The product update podcast loop](https://signals.forwardfuture.ai/loop-library/loops/product-update-podcast-loop/)

- Category: Content
- Use when: Use this when a product ships frequently enough that users would benefit from a short recurring audio explanation of what changed and how to use it.
- Prompt: At [cadence], review public product changes from [release window]. Select only changes that matter to users and verify each against the released product or public documentation. Create a short audio update with [available podcast tool], then check the script and audio for accuracy, clarity, and pronunciation. Revise until the checks pass. If nothing meaningful shipped, publish nothing and record the no-op. Ask before releasing the episode. Finish with the episode, sources, and review result.
- Verify: The episode is accurate, useful, and ready for review. Every included update is public and source-backed, or the run records that no episode is needed.
- Keywords: AI podcast workflow, product update podcast, Jellypod MCP, release communication, editorial automation
- Related: [The nightly changelog loop](https://signals.forwardfuture.ai/loop-library/loops/nightly-changelog-sweep/), [The post-release baseline loop](https://signals.forwardfuture.ai/loop-library/loops/post-release-baseline-loop/)

## 019 — [The adversarial code-review loop](https://signals.forwardfuture.ai/loop-library/loops/clodex-adversarial-review-loop/)

- Category: Engineering
- Use when: Use this when a code change needs independent review and may require several bounded fix-and-review rounds.
- Prompt: For [code change], have one agent implement and verify a reviewable patch, then have an independent reviewer inspect it against [acceptance criteria] and rank findings by severity. Fix findings above [accepted severity], rerun the relevant checks, and review again. Stop on approval, only explicitly accepted findings, no progress, or [iteration limit]. Never report an errored or exhausted run as approved. Finish with the patch, checks, verdict, remaining findings, and review link.
- Verify: The change reaches the agreed review bar. An independent reviewer approves it or only explicitly accepted findings remain; errors, stalls, and exhausted limits are reported as such.
- Keywords: Clodex, Codex adversarial review, Claude Code plugin, review fix loop, pull request automation
- Related: [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/), [The stale-safe batch release loop](https://signals.forwardfuture.ai/loop-library/loops/stale-safe-batch-release-loop/)

## 020 — [The second-agent verification loop](https://signals.forwardfuture.ai/loop-library/loops/loop-harness-verification-loop/)

- Category: Engineering
- Use when: Use this when a recurring repository task should run unattended but one agent must not be allowed to generate and approve the same output.
- Prompt: At [cadence], run one bounded repository task in an isolated workspace and stage the result without publishing it. Have a separate agent verify the staged work against [acceptance criteria]. Publish the configured output only after a pass and any required approval. On failure, publish nothing, preserve the evidence, and retry only under [retry policy]. Finish with the source revision, staged artifacts, verifier result, delivery status, and next run.
- Verify: Only independently verified output ships. A second-agent pass releases the configured output; a failed verification preserves evidence and produces no external change.
- Keywords: Loop Harness, scheduled coding agent, git worktree isolation, second-agent verification, autonomous agent workflow
- Related: [The adversarial code-review loop](https://signals.forwardfuture.ai/loop-library/loops/clodex-adversarial-review-loop/), [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/)

## 021 — [The visual reconstruction benchmark](https://signals.forwardfuture.ai/loop-library/loops/boeing-747-benchmark/)

- Category: Design
- Use when: Use this to test whether an agent can recreate and improve a visual subject through repeatable rendering and comparison.
- Prompt: Recreate [reference subject] with [rendering tool]. Define the reference images, required views, and scoring rubric before building. After each bounded change, render the same views, compare them with the references, and fix the largest visible gap without regressing stronger areas. Keep the best verified version. Stop when every required view meets [quality threshold], progress stalls for [limit], or the budget ends. Finish with the artifact, comparison renders, scores, and remaining gaps.
- Verify: Every required view meets the agreed visual threshold. Repeatable renders meet the fixed rubric, or the run reports stagnation, budget exhaustion, and remaining gaps.
- Keywords: Boeing 747 benchmark, Three.js agent workflow, vision self-verification, 3D reconstruction loop, camera inspection system
- Related: [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/), [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/)

## 022 — [The frontend reconstruction loop](https://signals.forwardfuture.ai/loop-library/loops/war-loops-frontend-designer/)

- Category: Design
- Use when: Use this when an authorized interface must be rebuilt from a URL or image and checked beyond a single screenshot.
- Prompt: Rebuild [authorized page or image] with [available design and code tools]. Capture a reliable reference and record its layout, styles, content, motion, and responsive behavior. Compare the same viewports and interactions after each bounded change. Fix the largest measured mismatch while preserving what already passes. Stop when every agreed fidelity check passes, progress stalls, or the reference cannot be captured. Finish with the best build, reference spec, comparisons, scores, and remaining gaps.
- Verify: The build meets every agreed fidelity check. Appearance, motion, and responsive behavior pass under repeatable conditions, or the run reports stagnation or a blocked reference.
- Keywords: War Loops, autonomous frontend designer, frontend fidelity, visual evaluation loop, responsive motion matching
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

## 023 — [The champion-challenger loop](https://signals.forwardfuture.ai/loop-library/loops/self-improving-champion-loop/)

- Category: Evaluation
- Use when: Use this to improve a prompt, policy, configuration, or other testable artifact when cheap iteration is useful but final acceptance must use fresh evidence.
- Prompt: Improve [artifact] against [objective] within [budget]. Save the current best version and its score. Each round, make one untried change based on a recorded failure, test it on the working set, and evaluate promising candidates on fresh holdout cases plus [guard checks]. Replace the current best only when the holdout score improves by [margin] and no guard regresses. Stop on success, budget exhaustion, or no progress. Finish with the best version, scores, experiment log, and remaining failures.
- Verify: The strongest verified version is returned. Every candidate is logged, and accepted changes beat the previous version on fresh cases without a guard regression.
- Keywords: self-improving loop, champion challenger evaluation, Goodhart prevention, independent evaluation gate, bounded optimization workflow
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/)

## 024 — [The devil's-advocate loop](https://signals.forwardfuture.ai/loop-library/loops/devils-advocate-design-loop/)

- Category: Evaluation
- Use when: Use this before committing to an architecture, interface, rollout plan, or other consequential design that benefits from structured adversarial review.
- Prompt: Challenge [design] against [acceptance criteria]. Have a critic record the strongest evidence-backed objections in [shared log] and rank them by impact. For each high-impact objection, have the builder either fix it and verify the result or document why it is accepted. Let the critic reopen unsupported closures. Repeat until no high-impact objection remains or the same unresolved issues show no new evidence or progress for [limit]. Finish with the decision, resolved and accepted objections, evidence, and any stalemate.
- Verify: No high-impact objection remains open. Every logged objection is verified as resolved or explicitly accepted with evidence, or the final report truthfully records a two-round stalemate.
- Keywords: devil's advocate loop, adversarial design review, critic builder workflow, architecture objection log, red team design process
- Related: [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/), [The adversarial code-review loop](https://signals.forwardfuture.ai/loop-library/loops/clodex-adversarial-review-loop/)

## 025 — [The fresh-clone loop](https://signals.forwardfuture.ai/loop-library/loops/fresh-clone-loop/)

- Category: Engineering
- Use when: Use this to test whether a repository's onboarding instructions work in a clean environment without undocumented help.
- Prompt: Test [repository] from a clean disposable environment. Follow only its onboarding documentation. When a step fails or assumes missing knowledge, record the gap, fix the smallest documentation or setup issue, discard the environment, and start again. Carry no dependencies, configuration, credentials, or manual repairs between attempts. Stop when one uninterrupted run reaches [documented ready state], progress stalls, or [budget] ends. Finish with the verified commands, gaps closed, and remaining blockers.
- Verify: A clean environment reaches the documented ready state. The final run uses only the onboarding guide and needs no unstated dependency, configuration, or manual repair.
- Keywords: fresh clone loop, README verification, developer onboarding test, clean environment setup, repository documentation workflow
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The repository cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/repository-cleanup-loop/)

## 026 — [The thumbnail iteration loop](https://signals.forwardfuture.ai/loop-library/loops/infinite-clickbait-loop/)

- Category: Design
- Use when: Use this when a video topic and asset set are ready but the thumbnail needs several structured ideation and critique rounds before production.
- Prompt: For [video], create [number] distinct thumbnail concepts from [approved assets]. Score each at realistic display sizes using a fixed rubric for clarity, curiosity, emotional pull, contrast, and accuracy. Improve the weakest dimension of the top candidates and rescore them under the same conditions. Stop when one concept meets [quality threshold], progress stalls, or [budget] ends. Reject misleading concepts. Finish with the winner, runners-up, final previews, scores, and rationale.
- Verify: One accurate thumbnail clears the fixed quality threshold. The winner outscores the alternatives under the same conditions, remains legible at realistic sizes, and represents the video accurately.
- Keywords: Infinite Clickbait, YouTube thumbnail loop, thumbnail iteration workflow, clickbait scoring rubric, AI visual design
- Related: [The visual reconstruction benchmark](https://signals.forwardfuture.ai/loop-library/loops/boeing-747-benchmark/), [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/)

## 027 — [The independent builder-reviewer loop](https://signals.forwardfuture.ai/loop-library/loops/autonomy-loop/)

- Category: Engineering
- Use when: Use this when a repository task benefits from repeated builder-reviewer handoffs and has reliable automated checks.
- Prompt: For [repository task], separate builder and reviewer into isolated workspaces. The builder makes one bounded change, adds a test that fails before the fix and passes after it, runs the checks, and hands off. The reviewer reruns the checks, audits the change, and proves the test detects the fix by reverting or mutating it. Accept only on both passes. Stop for protected changes, repeated failure, no progress, or budget exhaustion. Finish with the change, test proof, checks, and risks.
- Verify: Every accepted change passes independent test proof. The new test fails without the change and passes with it, all agreed checks pass, and protected changes remain approval-gated.
- Keywords: autonomy-loop, adversarial code review, mutation testing, builder reviewer workflow, Claude Code loop
- Related: [The adversarial code-review loop](https://signals.forwardfuture.ai/loop-library/loops/clodex-adversarial-review-loop/), [The second-agent verification loop](https://signals.forwardfuture.ai/loop-library/loops/loop-harness-verification-loop/)

## 028 — [The completion-contract loop](https://signals.forwardfuture.ai/loop-library/loops/codex-completion-contract-loop/)

- Category: Engineering
- Use when: Use this for long-running or high-risk work where a plausible partial result could be mistaken for completion.
- Prompt: For [task], define the requirements, scope, non-goals, and evidence needed for completion before acting. After each bounded action, record each requirement as proved, weak, missing, or contradicted using current evidence. Continue only while the evidence closes a requirement and [budget] remains. Mark complete only when every required item is proved. Otherwise stop as blocked, exhausted, or stalled without claiming success. Ask before creating persistent goal state. Finish with the requirement-to-evidence table, status, owner, and next action.
- Verify: Every required item has current, adequate proof. The final audit contains no weak, missing, or contradicted required item; otherwise the work remains open, blocked, or exhausted.
- Keywords: Codex Goal, completion contract, evidence audit, definition of done, false completion prevention
- Related: [The ticket-to-PR-ready loop](https://signals.forwardfuture.ai/loop-library/loops/ticket-to-pr-ready-loop/), [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/)

## 029 — [The evidence-based improvement loop](https://signals.forwardfuture.ai/loop-library/loops/revolve-self-improvement-loop/)

- Category: Evaluation
- Use when: Use this when improving a testable artifact across several experiments that must remain comparable, resumable, and reversible.
- Prompt: Improve [artifact] toward [objective] within [budget]. Save a version, freeze the evaluation, and record a baseline. Test one change per cycle. Keep it only when it improves by [margin] without a guard regression; otherwise restore the best version. If the evaluation changes, create a revision and rerun the baseline. Ask before changing the live artifact. Stop on success, no progress, a blocker, or budget exhaustion. Finish with the best version, evidence, rollback, and next action.
- Verify: The best version wins under one unchanged evaluation. Every comparison uses the same evaluation, accepted changes pass all guards, rollback is available, and live changes have approval.
- Keywords: Revolve, agent self improvement, checkpoint evaluation, revisioned experiments, evidence based promotion
- Related: [The champion-challenger loop](https://signals.forwardfuture.ai/loop-library/loops/self-improving-champion-loop/), [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/)
