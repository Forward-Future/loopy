export const site = {
  name: "Loop Library",
  publisher: "Forward Future",
  baseUrl: "https://signals.forwardfuture.ai/loop-library/",
  description:
    "Practical AI agent workflows for engineering, research, editorial work, evaluation, and operations.",
  updated: "2026-06-16",
};

export const loops = [
  {
    number: "001",
    slug: "overnight-docs-sweep",
    title: "The overnight docs sweep",
    seoTitle:
      "Overnight Documentation Audit for Coding Agents | Loop Library",
    description:
      "A scheduled AI coding-agent workflow for comparing documentation with the current codebase, fixing drift, and opening a reviewable pull request.",
    type: "Scheduled",
    typeSlug: "scheduled",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-12",
    modified: "2026-06-12",
    prompt:
      "Each night, review the codebase in full and make sure all documentation reflects the latest changes from the previous day. Update the documentation as needed, then open a pull request with those changes.",
    verifyTitle: "Documentation matches the current implementation.",
    verifyDetail: "Finish with a reviewable pull request.",
    useWhen:
      "Use this after active development days when implementation changes can leave READMEs, setup guides, API references, examples, or runbooks behind.",
    steps: [
      "Review implementation changes since the last documentation pass.",
      "Compare the repository's documentation with the code, configuration, commands, and behavior that now ship.",
      "Update only stale material, then verify commands, links, and examples against the current repository.",
      "Run the relevant checks and open a pull request that explains the documentation drift and the fixes.",
    ],
    why:
      "The loop ties documentation to the implementation instead of relying on memory. Requiring a pull request creates a visible diff, a review point, and a durable record of what changed.",
    note:
      "Keep the scope tied to real implementation changes. Do not rewrite accurate documentation just to create activity.",
    keywords: [
      "AI coding agent",
      "documentation audit",
      "documentation drift",
      "pull request workflow",
      "scheduled agent workflow",
    ],
    related: ["production-error-sweep", "architecture-satisfaction-loop"],
  },
  {
    number: "002",
    slug: "architecture-satisfaction-loop",
    title: "The architecture satisfaction loop",
    seoTitle:
      "Architecture Refactoring Loop for Coding Agents | Loop Library",
    description:
      "A bounded refactoring workflow that live-tests the system, runs an independent review, commits checkpoints, and records progress.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI coding agent workflow",
    author: "Peter Steinberger",
    published: "2026-06-12",
    modified: "2026-06-12",
    prompt:
      "Refactor until you are happy with the architecture. After each significant step, live-test the system, run autoreview, and commit. Track progress in /tmp/refactor-{projectname}.md.",
    verifyTitle: "The architecture is satisfactory and checks pass.",
    verifyDetail:
      "Live-test, autoreview, and commit each significant step.",
    useWhen:
      "Use this for a deliberate architectural refactor where the destination can be stated in concrete terms and the current system can be tested after each meaningful change.",
    steps: [
      "Write down the architectural target, constraints, and current risks before editing code.",
      "Make one significant, reviewable change at a time.",
      "Live-test the affected behavior and run an independent review after each significant step.",
      "Commit each verified checkpoint and update the temporary progress file with decisions, blockers, and the next action.",
    ],
    why:
      "Small verified checkpoints reduce refactor risk and preserve rollback points. The progress file keeps the goal and decisions available across long sessions or handoffs.",
    note:
      "Define what satisfactory means before starting, such as module boundaries, dependency direction, passing tests, and acceptable performance. A subjective stop condition can otherwise run indefinitely.",
    keywords: [
      "AI coding agent",
      "architecture refactor",
      "autoreview",
      "incremental refactoring",
      "coding agent workflow",
    ],
    related: ["overnight-docs-sweep", "sub-50ms-page-load-loop"],
  },
  {
    number: "003",
    slug: "sub-50ms-page-load-loop",
    title: "The sub-50 ms page-load loop",
    seoTitle: "Sub-50 ms Page-Load Optimization Loop | Loop Library",
    description:
      "A performance optimization workflow for coding agents that uses one repeatable benchmark and stops only when every target page meets the threshold.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-12",
    modified: "2026-06-12",
    prompt:
      "Continue optimizing the code for speed. After each significant change, measure page-load performance across every page under the same repeatable test conditions. Continue until every page loads in under 50 ms.",
    verifyTitle: "Every page loads in under 50 ms.",
    verifyDetail:
      "Use the same benchmark and confirm there are no regressions.",
    useWhen:
      "Use this when a product has a defined set of routes, a stable performance harness, and a 50 ms target that maps to a specific metric and environment.",
    steps: [
      "Define the exact metric, routes, test environment, warm-up behavior, and number of benchmark runs.",
      "Capture a baseline for every target page before making changes.",
      "Make one significant optimization, rerun the same benchmark, and inspect regressions across all routes.",
      "Continue until every page meets the threshold under the original test conditions.",
    ],
    why:
      "The fixed harness prevents performance work from turning into anecdotal tuning. Measuring every route after each change catches local wins that quietly slow down another page.",
    note:
      "Page load can mean server response, render completion, or a browser timing metric. Name the metric and hardware explicitly so the 50 ms target is reproducible and meaningful.",
    keywords: [
      "AI coding agent",
      "page load optimization",
      "performance benchmark",
      "web performance workflow",
      "50 ms page load",
    ],
    related: ["architecture-satisfaction-loop", "production-error-sweep"],
  },
  {
    number: "004",
    slug: "production-error-sweep",
    title: "The production error sweep",
    seoTitle: "Production Error Triage Loop for Coding Agents | Loop Library",
    description:
      "A scheduled production-log workflow that traces actionable errors to root causes, verifies fixes, opens a pull request, and reports the result.",
    type: "Scheduled",
    typeSlug: "scheduled",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-12",
    modified: "2026-06-12",
    prompt:
      "Review our production logs for errors. If you find an actionable issue, trace it to its root cause, fix it, verify the fix, and open a pull request. Then ping me in Slack with the findings and PR link. If no actionable errors are present, ping me with that result instead.",
    verifyTitle: "Actionable production errors are fixed and verified.",
    verifyDetail:
      "Finish with a pull request and Slack summary, or a clean-log confirmation.",
    useWhen:
      "Use this as a scheduled reliability pass when an agent can read production telemetry, trace failures into the repository, run the relevant tests, and prepare a reviewable fix.",
    steps: [
      "Review the agreed production log window and group repeated symptoms into likely incidents.",
      "Separate actionable product errors from expected noise, transient upstream failures, and already-known issues.",
      "Trace each actionable error to a root cause, implement the smallest appropriate fix, and verify it with focused checks.",
      "Open a pull request and report the findings, verification, and link. If the logs are clean, report that terminal state instead.",
    ],
    why:
      "The loop converts passive log review into a closed reliability workflow. It requires a root cause, verified change, review artifact, and explicit communication instead of stopping at a list of errors.",
    note:
      "Treat logs as sensitive production data. Do not copy credentials, tokens, personal information, or private payloads into prompts, pull requests, or chat messages.",
    keywords: [
      "AI coding agent",
      "production log review",
      "error triage",
      "root cause analysis",
      "reliability workflow",
    ],
    related: ["overnight-docs-sweep", "sub-50ms-page-load-loop"],
  },
  {
    number: "005",
    slug: "100-percent-test-coverage-loop",
    title: "The 100% test coverage loop",
    seoTitle: "100% Test Coverage Loop for Coding Agents | Loop Library",
    description:
      "A goal-based coding-agent workflow that identifies uncovered behavior, adds meaningful tests, and stops when the full suite passes at 100% coverage.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-13",
    modified: "2026-06-13",
    prompt: "Add tests until we have 100% test coverage.",
    verifyTitle: "The full test suite passes at 100% coverage.",
    verifyDetail: "Use the project's coverage report as the source of truth.",
    useWhen:
      "Use this when 100% coverage is an explicit project requirement and the repository has a trustworthy coverage command, clear exclusions, and a test suite that can be run repeatedly.",
    steps: [
      "Run the complete test suite with coverage and save the baseline report.",
      "Prioritize uncovered branches and behavior by risk instead of file order.",
      "Add tests that assert meaningful outcomes, failure paths, and boundary conditions.",
      "Repeat until the full suite passes and the configured coverage report reaches 100%.",
    ],
    why:
      "A concrete coverage target gives the agent a measurable stopping condition and makes skipped code visible. Risk-first ordering keeps the work focused on behavior that matters.",
    note:
      "Coverage measures which code ran, not whether the assertions are good. Review test quality, avoid tests that only execute lines, and keep justified generated-code or platform exclusions explicit.",
    keywords: [
      "AI coding agent",
      "100 percent test coverage",
      "test coverage workflow",
      "automated testing",
      "coding agent prompt",
    ],
    related: ["architecture-satisfaction-loop", "production-error-sweep"],
  },
  {
    number: "006",
    slug: "seo-geo-visibility-loop",
    title: "The SEO/GEO visibility loop",
    seoTitle: "SEO and GEO Visibility Audit Loop | Loop Library",
    description:
      "A repeatable search visibility workflow that fixes the highest-impact crawl, indexation, page-intent, citation, and answer-readiness gaps first.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI search visibility workflow",
    author: "Matthew Berman",
    published: "2026-06-13",
    modified: "2026-06-13",
    prompt:
      "Run an SEO/GEO audit across crawlability, indexation, page intent, titles, internal links, structured data, source citations, and answer-first content. Rank the gaps by expected impact, fix the highest-leverage issue, then rerun the same crawl and target-query benchmark across search engines and AI answer engines. Repeat until no critical technical issues remain, every priority query maps to a clear answer-ready page, and the benchmark shows no high-impact gap left to fix.",
    verifyTitle:
      "Priority pages are indexable, answer-ready, and technically sound.",
    verifyDetail:
      "The repeatable crawl and query benchmark finds no remaining high-impact gaps.",
    useWhen:
      "Use this when a site has a defined set of priority pages and target questions, and you can rerun the same technical crawl and search visibility checks after each change.",
    steps: [
      "Record the target queries, answer engines, search engines, locale, date, and benchmark method.",
      "Audit crawlability, indexation, page intent, titles, internal links, structured data, citations, and visible answer quality.",
      "Rank findings by expected impact and fix one high-leverage issue at a time.",
      "Rerun the original crawl and query benchmark until no critical technical issue or high-impact content gap remains.",
    ],
    why:
      "A fixed benchmark makes visibility work measurable and prevents a long list of low-value SEO tasks from replacing the highest-impact fix. Mapping each priority query to a strong page also gives search and answer systems a clear destination.",
    note:
      "AI citations and search results vary by time, location, account state, and model. Record the test conditions and treat sampled visibility as evidence, not a guaranteed ranking.",
    keywords: [
      "SEO audit",
      "generative engine optimization",
      "GEO workflow",
      "AI search visibility",
      "answer engine optimization",
    ],
    related: ["overnight-docs-sweep", "production-error-sweep"],
  },
  {
    number: "007",
    slug: "exhaustive-logging-coverage-loop",
    title: "The logging coverage loop",
    seoTitle: "Logging Coverage Loop for Coding Agents | Loop Library",
    description:
      "A goal-based observability workflow that audits important paths, adds useful structured logs, and verifies success and failure events with tests.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-16",
    prompt:
      "Review the system's logging and add missing coverage until every important path produces useful, tested logs.",
    verifyTitle: "Every important path emits useful, tested logs.",
    verifyDetail:
      "Representative success and failure tests prove coverage without exposing sensitive data.",
    useWhen:
      "Use this when important user flows, service boundaries, background jobs, or failure paths are difficult to trace because the system's logging is incomplete or inconsistent.",
    steps: [
      "Inventory the important paths and define the event, outcome, severity, correlation context, and fields each one should emit.",
      "Add structured logs to uncovered paths without duplicating events or adding low-value noise.",
      "Add tests for successful and failed outcomes, then inspect representative emitted logs for useful context.",
      "Verify redaction and repeat until every important path has tested coverage or a documented reason not to log.",
    ],
    why:
      "Treating logging as testable coverage turns observability from scattered statements into a reviewable system requirement. Inspecting emitted events catches gaps that source review alone misses.",
    note:
      "Never log credentials, tokens, secrets, or sensitive personal data. Prefer stable event names and structured fields over interpolated prose.",
    keywords: [
      "AI coding agent",
      "structured logging",
      "observability coverage",
      "logging tests",
      "production diagnostics",
    ],
    related: ["production-error-sweep", "100-percent-test-coverage-loop"],
  },
  {
    number: "008",
    slug: "nightly-changelog-sweep",
    title: "The nightly changelog loop",
    seoTitle: "Nightly Changelog Loop for Coding Agents | Loop Library",
    description:
      "A scheduled coding-agent workflow that reviews the previous day's changes and keeps user-facing release history complete and current.",
    type: "Scheduled",
    typeSlug: "scheduled",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-16",
    prompt:
      "Each night, review changes from the previous day and update the changelog with anything users should know.",
    verifyTitle: "Every user-relevant change from the previous day is accounted for.",
    verifyDetail:
      "The changelog is updated and validated, or the no-change result is recorded.",
    useWhen:
      "Use this when a project changes frequently enough that user-facing release notes can drift from merged pull requests, commits, deployments, and product changes.",
    steps: [
      "Collect the previous day's merged pull requests, commits, deployments, and other in-scope changes.",
      "Identify which changes affect users and compare them with the current changelog.",
      "Add concise dated entries with useful references while preserving existing content and avoiding duplicates.",
      "Run the relevant checks and record either the validated update or the fact that no user-facing entry was needed.",
    ],
    why:
      "A daily reconciliation makes omissions visible while the context is still fresh. Limiting entries to what users should know keeps the changelog useful instead of turning it into a raw commit feed.",
    note:
      "Use the underlying change and product behavior as the source of truth. Commit titles alone can overstate, understate, or misclassify what users experienced.",
    keywords: [
      "AI coding agent",
      "nightly changelog",
      "release notes workflow",
      "changelog automation",
      "daily repository review",
    ],
    related: ["overnight-docs-sweep", "repository-cleanup-loop"],
  },
  {
    number: "009",
    slug: "quality-streak-loop",
    title: "The quality streak loop",
    seoTitle: "Quality Streak Evaluation Loop for AI Products | Loop Library",
    description:
      "A realistic product-testing workflow that turns every failure into documented regression coverage and restarts the success streak after each fix.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI product evaluation workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-16",
    prompt:
      "Test realistic scenarios. When one fails, document it, add regression and benchmark coverage, fix it, and restart the streak. Stop after [N] successful cases in a row.",
    verifyTitle: "The latest [N] realistic cases pass in a row.",
    verifyDetail:
      "Every earlier failure is documented, fixed, and protected by regression and benchmark coverage.",
    useWhen:
      "Use this when product quality needs a strict consecutive-success bar and failures should permanently improve the test and benchmark suite.",
    steps: [
      "Define realistic scenarios, the quality bar, the value of [N], and the evidence required for a pass.",
      "Run cases one at a time under consistent conditions and preserve the result for review.",
      "On any failure, document it, add regression and benchmark coverage, fix the cause, verify the fix, and reset the streak to zero.",
      "Stop only after [N] consecutive cases meet the original quality bar.",
    ],
    why:
      "Restarting the streak prevents isolated successes from hiding intermittent weaknesses. Converting each failure into durable coverage makes the evaluation stronger after every miss.",
    note:
      "Choose [N] before the run and keep the scenario distribution representative. Do not lower the quality bar or avoid difficult cases to preserve the streak.",
    keywords: [
      "AI product evaluation",
      "quality streak",
      "regression testing",
      "benchmark coverage",
      "realistic scenarios",
    ],
    related: ["full-product-evaluation-loop", "100-percent-test-coverage-loop"],
  },
  {
    number: "010",
    slug: "full-product-evaluation-loop",
    title: "The full product evaluation loop",
    seoTitle: "Full Product Evaluation Loop for AI Systems | Loop Library",
    description:
      "A comprehensive product-quality workflow that scores realistic tests across every major feature, fixes weak cases, and reruns them to the defined bar.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI product evaluation workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-16",
    prompt:
      "Create [N] realistic tests covering every major feature. Score each response, fix anything unsatisfactory, and rerun it until every case meets the quality bar.",
    verifyTitle: "Every one of the [N] cases meets the defined quality bar.",
    verifyDetail:
      "The final scored run covers every major feature under the original conditions.",
    useWhen:
      "Use this for an end-to-end product evaluation when quality must be measured across the full feature set rather than a narrow regression or a few hand-picked examples.",
    steps: [
      "List every major feature, define the scoring rubric, choose [N], and allocate realistic cases across the product surface.",
      "Run the full set under consistent conditions and score every response with evidence.",
      "Document each unsatisfactory case, fix the underlying issue, and add focused regression coverage where appropriate.",
      "Rerun affected cases and then the complete set until every score meets the original quality bar.",
    ],
    why:
      "A fixed feature map and scoring rubric make product quality visible across the whole system. Requiring a final complete run catches fixes that improve one case while weakening another.",
    note:
      "Keep the test set representative and preserve failed examples. Averages can hide severe misses, so require every case to clear the bar.",
    keywords: [
      "AI product evaluation",
      "full product testing",
      "response scoring",
      "quality benchmark",
      "feature coverage",
    ],
    related: ["quality-streak-loop", "production-data-cleanup-loop"],
  },
  {
    number: "011",
    slug: "test-suite-speed-loop",
    title: "The test-suite speed loop",
    seoTitle: "Test-Suite Speed Optimization Loop | Loop Library",
    description:
      "A performance workflow for reducing test runtime under repeatable conditions without weakening coverage, assertions, isolation, or behavior.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-16",
    prompt:
      "Optimize the test suite to run as quickly as possible without reducing coverage or changing behavior.",
    verifyTitle: "The suite is faster with no coverage or behavior regression.",
    verifyDetail:
      "Repeatable timing, the full passing suite, and the original coverage report prove the result.",
    useWhen:
      "Use this when slow tests are delaying local feedback or continuous integration and the project has stable commands for measuring runtime and coverage.",
    steps: [
      "Record the full-suite runtime, coverage, environment, worker settings, and repeatable timing method.",
      "Profile the suite to find expensive setup, redundant work, poor isolation, unnecessary integration paths, or safe parallelization opportunities.",
      "Make one optimization at a time, then rerun the full suite and compare timing, coverage, and behavior.",
      "Stop at the agreed runtime target or diminishing-returns rule with all original checks still passing.",
    ],
    why:
      "A fixed baseline prevents speed work from quietly trading away coverage or correctness. Profiling directs effort toward measured bottlenecks instead of speculative rewrites.",
    note:
      "Define a runtime target or diminishing-returns rule before starting. Faster tests are not an improvement if they become flaky, order-dependent, or less representative.",
    keywords: [
      "AI coding agent",
      "test suite performance",
      "faster CI",
      "test optimization",
      "coverage preservation",
    ],
    related: ["100-percent-test-coverage-loop", "sub-50ms-page-load-loop"],
  },
  {
    number: "012",
    slug: "repository-cleanup-loop",
    title: "The repository cleanup loop",
    seoTitle: "Repository Cleanup Loop for Coding Agents | Loop Library",
    description:
      "A repository-hygiene workflow that audits branches, pull requests, commits, and worktrees, recovers valuable changes, and removes proven stale state.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI repository operations workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-16",
    prompt:
      "Inspect local and remote branches, pull requests, commits, and worktrees. Recover valuable work and clean everything stale until the repository is current and organized.",
    verifyTitle: "Valuable work is recovered and remaining repository state is intentional.",
    verifyDetail:
      "Branches, pull requests, commits, and worktrees are current, owned, or safely removed with evidence.",
    useWhen:
      "Use this when abandoned branches, old worktrees, unclear pull requests, or unmerged commits make it difficult to know which repository state still matters.",
    steps: [
      "Inventory local and remote branches, open and recently closed pull requests, unmerged commits, and registered worktrees.",
      "Classify each item as current, valuable but unfinished, superseded, merged, abandoned, or uncertain, recording evidence and ownership.",
      "Recover valuable changes into an appropriate current branch before removing any stale reference.",
      "Clean only proven stale state, fetch and prune safely, then rerun the inventory until every remaining item is intentional.",
    ],
    why:
      "Inventory and classification separate recoverable work from clutter before cleanup begins. Repeating the inventory proves the repository is organized instead of merely smaller.",
    note:
      "Do not delete uncertain work, discard uncommitted changes, or close someone else's pull request without confirmation. Preserve evidence for every destructive cleanup action.",
    keywords: [
      "AI coding agent",
      "repository cleanup",
      "git worktree audit",
      "branch hygiene",
      "pull request triage",
    ],
    related: ["stale-safe-batch-release-loop", "nightly-changelog-sweep"],
  },
  {
    number: "013",
    slug: "stale-safe-batch-release-loop",
    title: "The stale-safe batch release loop",
    seoTitle: "Stale-Safe Batch Release Loop | Loop Library",
    description:
      "A release-coordination workflow that excludes stale or unfinished work, combines valid changes, and ships complete artifacts from the latest integrated main.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI release operations workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-16",
    prompt:
      "Review pending changes and pull requests, exclude stale or unfinished work, combine the valid changes, and release them together.",
    verifyTitle: "Only current, complete changes ship in the combined release.",
    verifyDetail:
      "The released revision is the latest integrated main that contains every selected change.",
    useWhen:
      "Use this when several branches or pull requests may be ready at once and the release must avoid stale worktrees, partial overlays, and incomplete changes.",
    steps: [
      "Fetch current repository and pull-request state, then inspect every candidate change for freshness, completeness, ownership, checks, and dependencies.",
      "Exclude stale, superseded, conflicting, or unfinished work and record why each candidate was omitted.",
      "Integrate the valid changes, rerun the combined checks, and select the newest main revision that contains the full batch.",
      "Release complete artifacts from a clean checkout, serialize the deployment, and verify production before closing the batch.",
    ],
    why:
      "Evaluating all candidates before integration prevents stale code from entering a release through convenience or worktree confusion. Releasing from integrated main proves the deployed artifact matches the reviewed batch.",
    note:
      "The candidate diff selects what belongs in the batch, but deployment must use complete artifacts from the latest integrated main. Never deploy from a task worktree or partial file overlay.",
    keywords: [
      "AI release operations",
      "batch release",
      "stale code prevention",
      "pull request coordination",
      "deployment safety",
    ],
    related: ["repository-cleanup-loop", "post-release-baseline-loop"],
  },
  {
    number: "014",
    slug: "production-data-cleanup-loop",
    title: "The production data cleanup loop",
    seoTitle: "Production Data Cleanup Loop for AI Systems | Loop Library",
    description:
      "A production-data quality workflow that removes disallowed records, improves classification logic, and verifies the remaining dataset against an explicit definition.",
    type: "Goal",
    typeSlug: "goal",
    categoryLabel: "AI data operations workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-16",
    prompt:
      "Review production records, remove anything that does not meet the allowed definition, improve the classification logic, and verify the remaining data.",
    verifyTitle: "Every remaining record meets the allowed definition.",
    verifyDetail:
      "Representative classification tests and a post-cleanup audit prove the retained data is valid.",
    useWhen:
      "Use this when a production dataset contains records that no longer match a product, policy, taxonomy, or quality definition and the classifier allowed them through.",
    steps: [
      "Write the allowed definition as explicit inclusion, exclusion, and edge-case rules before changing data.",
      "Audit production records, preserve a recoverable record of proposed removals, and separate clear violations from uncertain cases.",
      "Remove confirmed invalid records through the approved production path and improve the classifier with regression examples.",
      "Rerun classification tests and audit the remaining production data until every sampled and queried record meets the definition.",
    ],
    why:
      "Fixing both the existing records and the classifier closes the immediate data problem and reduces recurrence. Explicit rules and regression examples make future cleanup decisions reviewable.",
    note:
      "Follow access, retention, privacy, and audit requirements. Use backups or reversible operations where appropriate, and do not delete uncertain records without review.",
    keywords: [
      "AI data operations",
      "production data cleanup",
      "classification logic",
      "data quality audit",
      "regression examples",
    ],
    related: ["full-product-evaluation-loop", "exhaustive-logging-coverage-loop"],
  },
  {
    number: "015",
    slug: "post-release-baseline-loop",
    title: "The post-release baseline loop",
    seoTitle: "Post-Release Benchmark Baseline Loop | Loop Library",
    description:
      "A triggered release workflow that runs standard benchmarks against the completed release and records a reproducible baseline for future comparisons.",
    type: "Triggered",
    typeSlug: "triggered",
    categoryLabel: "AI release operations workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-16",
    prompt:
      "After current releases finish, run the standard benchmarks and record the results as the new baseline.",
    verifyTitle: "The new baseline belongs to the completed release.",
    verifyDetail:
      "Revision, environment, benchmark version, conditions, and results are recorded together.",
    useWhen:
      "Use this immediately after a release when future regressions or improvements need to be measured against the exact version now in production.",
    steps: [
      "Confirm every in-scope release is complete and record the production revision or artifact identity.",
      "Run the standard benchmark suite under its documented environment, data, warm-up, and repetition rules.",
      "Investigate invalid or unstable runs, then rerun only under the same documented conditions.",
      "Store the final results with the release identity and benchmark metadata, and mark them as the new comparison baseline.",
    ],
    why:
      "Tying the baseline to a verified release creates a trustworthy reference point for later performance and quality work. Recording the conditions prevents unrelated environment changes from masquerading as product changes.",
    note:
      "Do not overwrite the previous baseline until the release identity and benchmark run are verified. Keep historical baselines available for trend analysis.",
    keywords: [
      "AI release operations",
      "post-release benchmark",
      "performance baseline",
      "release verification",
      "benchmark history",
    ],
    related: ["stale-safe-batch-release-loop", "test-suite-speed-loop"],
  },
];
