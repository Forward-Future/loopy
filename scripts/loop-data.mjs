export const site = {
  name: "Loop Library",
  publisher: "Forward Future",
  baseUrl: "https://signals.forwardfuture.ai/loop-library/",
  description:
    "Practical AI agent workflows for engineering, research, editorial work, evaluation, and operations.",
  updated: "2026-06-18",
  socialImageVersion: "20260618-5",
  socialImageExtension: "png",
  socialImageMimeType: "image/png",
};

export const categories = [
  { slug: "engineering", label: "Engineering" },
  { slug: "evaluation", label: "Evaluation" },
  { slug: "operations", label: "Operations" },
  { slug: "content", label: "Content" },
  { slug: "design", label: "Design" },
];

const categorySlugByLabel = new Map([
  ["AI coding agent workflow", "engineering"],
  ["AI repository operations workflow", "engineering"],
  ["AI product evaluation workflow", "evaluation"],
  ["AI release operations workflow", "operations"],
  ["AI data operations workflow", "operations"],
  ["AI deployment operations workflow", "operations"],
  ["AI search visibility workflow", "content"],
  ["AI editorial workflow", "content"],
  ["AI visual design workflow", "design"],
  ["AI frontend design workflow", "design"],
]);

export function getLoopCategory(loop) {
  const categorySlug = categorySlugByLabel.get(loop.categoryLabel);
  const category = categories.find(({ slug }) => slug === categorySlug);

  if (!category) {
    throw new Error(`No browsing category for ${loop.title}.`);
  }

  return category;
}

export const loops = [
  {
    number: "001",
    slug: "overnight-docs-sweep",
    title: "The overnight docs sweep",
    seoTitle:
      "Overnight Documentation Audit for Coding Agents | Loop Library",
    description:
      "A scheduled AI coding-agent workflow for comparing documentation with the current codebase, fixing drift, and opening a reviewable pull request.",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-12",
    modified: "2026-06-17",
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
    categoryLabel: "AI coding agent workflow",
    author: "Peter Steinberger",
    published: "2026-06-12",
    modified: "2026-06-17",
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
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-12",
    modified: "2026-06-17",
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
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-12",
    modified: "2026-06-17",
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
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-13",
    modified: "2026-06-17",
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
    categoryLabel: "AI search visibility workflow",
    author: "Matthew Berman",
    published: "2026-06-13",
    modified: "2026-06-17",
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
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-17",
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
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-17",
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
    categoryLabel: "AI product evaluation workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-17",
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
      "A comprehensive product-quality workflow that evaluates realistic scenarios across every major capability, fixes weak outcomes, and reruns them to the defined bar.",
    categoryLabel: "AI product evaluation workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-17",
    prompt:
      "Create [N] realistic scenarios covering every major capability. Before testing, define clear success criteria and choose a consistent evaluation method, such as pass/fail checks or a scoring rubric. Run every scenario under the same conditions and record evidence for each outcome. Fix the underlying cause of anything that does not meet the criteria, rerun the affected scenarios, and then rerun the complete set. Continue until every scenario meets the original quality bar.",
    verifyTitle: "Every one of the [N] scenarios meets the defined quality bar.",
    verifyDetail:
      "The final evaluated run covers every major capability under the original conditions.",
    useWhen:
      "Use this for an end-to-end product evaluation when quality must be measured across the full feature set rather than a narrow regression or a few hand-picked examples.",
    steps: [
      "List every major capability, define the success criteria and evaluation method, choose [N], and allocate realistic scenarios across the product surface.",
      "Run the full set under consistent conditions and evaluate every outcome with evidence.",
      "Document each scenario that misses the criteria, fix the underlying issue, and add focused regression coverage where appropriate.",
      "Rerun affected scenarios and then the complete set until every outcome meets the original quality bar.",
    ],
    why:
      "A fixed capability map and consistent evaluation method make product quality visible across the whole system. Requiring a final complete run catches fixes that improve one scenario while weakening another.",
    note:
      "Keep the scenario set representative and preserve failed examples. Aggregate results can hide severe misses, so require every scenario to clear the bar.",
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
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-17",
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
    categoryLabel: "AI repository operations workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-17",
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
    categoryLabel: "AI release operations workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-17",
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
    categoryLabel: "AI data operations workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-17",
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
    categoryLabel: "AI release operations workflow",
    author: "Matthew Berman",
    published: "2026-06-16",
    modified: "2026-06-17",
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
  {
    number: "016",
    slug: "ticket-to-pr-ready-loop",
    title: "The ticket-to-PR-ready loop",
    seoTitle: "Ticket-to-PR-Ready Loop for Coding Agents | Loop Library",
    description:
      "A bounded engineering workflow that turns a ticket, failing behavior, or customer complaint into a proven root cause, minimal patch, and reviewer-ready handoff.",
    categoryLabel: "AI coding agent workflow",
    author: "Hiten Shah",
    sourceUrl:
      "https://docs.google.com/document/d/1PjkOSfGaww1k_NJjswovfCdSHl31w8sxIEzXilU92gg/edit?tab=t.0",
    published: "2026-06-18",
    modified: "2026-06-18",
    prompt:
      "Take this ticket, bug report, failing behavior, or customer complaint and turn it into a review-ready patch. Define the failure clearly and reproduce it in the smallest possible environment. Isolate the root cause and confirm it with evidence, not inference. Implement the smallest credible fix, then verify the before-and-after behavior. If verification fails, return to the root cause and iterate. If the issue cannot be reproduced after two serious attempts, say so clearly. Do not silently expand scope; split broader refactors or separate problems into named follow-ups. Finish with the failure summary, reproduction steps, root cause, fix summary, files changed, verification proof, risks, follow-ups, suggested PR title, and PR description draft.",
    verifyTitle: "The failure is fixed, verified, and ready for review.",
    verifyDetail:
      "The same behavior reproduces before the fix, no longer reproduces afterward, and the handoff explains the evidence in under two minutes.",
    useWhen:
      "Use this when a real but loosely written ticket, bug report, or customer complaint needs to become a bounded engineering change with enough proof for a fast review.",
    steps: [
      "State the expected and actual behavior, then reproduce the failure in the smallest representative environment.",
      "Trace the behavior to a root cause and confirm the causal link with evidence.",
      "Implement the smallest credible fix, avoiding unrelated cleanup or hidden refactors.",
      "Repeat the original reproduction, run relevant regression checks, and package the result for review.",
    ],
    why:
      "The loop closes the gap between something being wrong and a reviewer being able to trust the patch. Reproduction, evidence, bounded scope, and a structured handoff remove the detective work from review.",
    note:
      "Match the proof to the failure: screenshots or recordings for UI issues, tests or logs for backend behavior, benchmark deltas for performance, and sanitized traces for integrations.",
    keywords: [
      "AI coding agent",
      "ticket to pull request",
      "bug reproduction",
      "root cause analysis",
      "review-ready patch",
    ],
    related: ["production-error-sweep", "quality-streak-loop"],
  },
  {
    number: "017",
    slug: "customer-ai-deployment-loop",
    title: "The customer AI deployment loop",
    seoTitle: "Customer AI Deployment Loop | Loop Library",
    description:
      "A supervised delivery workflow that advances one customer priority into a validated, gradually released AI system with monitoring, approvals, and outcome evidence.",
    categoryLabel: "AI deployment operations workflow",
    author: "AgentLed.ai Agent",
    sourceUrl:
      "https://www.agentled.ai/en/blog/post/beginners-buy-ai-automations-experts-build-ai-deployment-loops",
    published: "2026-06-18",
    modified: "2026-06-18",
    prompt:
      "Manage one customer AI deployment from priority to production outcome. Run this loop when a customer shares a new priority, requests an AI workflow, gives feedback, reports a failure, or reaches a scheduled AI operations review. Start from the customer's current business priority and choose one concrete workflow or improvement to advance. Define the business goal, owner, affected users, systems and APIs, input data, expected output, approval gates, risk level, success criteria, and ROI hypothesis. Build or update the deployment, run a dry run on realistic customer data, record failures and edge cases, fix the smallest underlying issue, and rerun until the dry run passes or a blocker is clear. Release gradually and monitor production. Before stopping, produce a customer-facing update and store the reusable lessons for the next run.",
    verifyTitle: "One customer priority reaches a proven terminal state.",
    verifyDetail:
      "The workflow reaches its agreed rollout stage, a production issue is fixed, a blocker is escalated with an owner, or a healthy review records the next check.",
    useWhen:
      "Use this when an AI workflow must live inside a real customer process and needs validation, approval, gradual rollout, monitoring, and a clear business outcome.",
    steps: [
      "Review the current customer priority, recent feedback, workflow history, failures, approvals, usage, cost, and ROI signals.",
      "Choose one workflow or improvement and define its owner, systems, data, risk, approval gates, success criteria, and ROI hypothesis.",
      "Build or update it, run a dry run on realistic data, repair the smallest underlying issue, and release through controlled stages.",
      "Monitor production, send the customer-facing update, and store preferences, rules, failures, examples, and ROI observations in shared memory.",
    ],
    why:
      "The loop treats deployment as the operating system around an automation: scope, validation, approval, rollout, monitoring, learning, and accountability all stay connected to the customer's priority.",
    note:
      "Do not expand rollout when dry-run evidence, approval state, or monitoring is missing. Keep sensitive, irreversible, financial, and customer-facing actions behind explicit human approval.",
    keywords: [
      "customer AI deployment",
      "AI workflow rollout",
      "approval gates",
      "production monitoring",
      "AI ROI",
    ],
    related: ["full-product-evaluation-loop", "quality-streak-loop"],
  },
  {
    number: "018",
    slug: "product-update-podcast-loop",
    title: "The product update podcast loop",
    seoTitle: "Product Update Podcast Automation Loop | Loop Library",
    description:
      "A scheduled editorial workflow that turns meaningful public product changes into a short, source-grounded podcast episode.",
    categoryLabel: "AI editorial workflow",
    author: "Pierson Marks",
    sourceUrl: "https://www.jellypod.com/mcp",
    published: "2026-06-18",
    modified: "2026-06-18",
    prompt:
      "Each night, review any new publicly released features or changes from the repository and identify the ones most meaningful to users. Verify each selected change against the released product, documentation, or release notes. Use the Jellypod MCP to generate a short three-to-five-minute podcast episode explaining how users can take advantage of the new features, why they are important, and how to try them. Review the script and audio for accuracy, clarity, and pronunciation; fix or regenerate anything that does not match the source material. If there were no meaningful public changes, record that result instead of manufacturing an episode.",
    verifyTitle: "The episode accurately covers every meaningful public update.",
    verifyDetail:
      "Finish with a review-ready three-to-five-minute episode, or a confirmed no-episode result when nothing meaningful shipped.",
    useWhen:
      "Use this when a product ships frequently enough that users would benefit from a short recurring audio explanation of what changed and how to use it.",
    steps: [
      "Collect the release window's public product changes, documentation, and release notes.",
      "Select the changes most meaningful to users and verify what actually shipped.",
      "Generate a three-to-five-minute Jellypod episode covering the benefit, importance, and how-to for each selected change.",
      "Review the script and audio against the sources, then regenerate weak or unsupported passages before stopping.",
    ],
    why:
      "A fixed release window keeps coverage current, while editorial selection and source verification prevent the episode from becoming an automated reading of commit titles.",
    note:
      "Use only publicly released information. Do not expose private repository context, customer data, security-sensitive details, or unreleased work in the generated episode.",
    keywords: [
      "AI podcast workflow",
      "product update podcast",
      "Jellypod MCP",
      "release communication",
      "editorial automation",
    ],
    related: ["nightly-changelog-sweep", "post-release-baseline-loop"],
  },
  {
    number: "019",
    slug: "clodex-adversarial-review-loop",
    title: "The Clodex adversarial-review loop",
    seoTitle: "Clodex Adversarial Code Review Loop | Loop Library",
    description:
      "A bounded development workflow that plans and ships a pull request, runs an independent Codex adversarial review, fixes blocking findings, and repeats.",
    categoryLabel: "AI coding agent workflow",
    author: "Lukas Kucinski",
    sourceUrl: "https://github.com/lukaskucinski/clodex",
    published: "2026-06-18",
    modified: "2026-06-18",
    prompt:
      "Run /clodex [task] think hard --max-iter 5 --threshold medium. Plan the task, implement it, ship a pull request, run the Codex adversarial-review code path, fix every finding above the configured threshold, and repeat. Persist the plan, branch, pull request, findings, verdict, and iteration state so the run can resume safely. Remember that threshold names the highest acceptable severity. Stop when Codex approves, only sub-threshold findings remain, or max-iter is reached. Never report a stalled, errored, or exhausted run as approved.",
    verifyTitle: "The pull request reaches the configured review bar.",
    verifyDetail:
      "Codex approves, only explicitly acceptable findings remain, or the final report truthfully discloses that the iteration cap or an error stopped the loop.",
    useWhen:
      "Use this for a meaningful code change that benefits from an independent reviewer and may need several structured review-and-fix rounds.",
    steps: [
      "Choose the task, thinking level, maximum iterations, and highest acceptable finding severity.",
      "Plan, implement, verify, and ship the pull request through the Clodex workflow.",
      "Run the Codex adversarial review, fix every blocking finding, commit and push, then review again.",
      "Persist state across rounds and finish with the verdict, remaining findings, checks, and pull-request link.",
    ],
    why:
      "Clodex separates the builder from the reviewer and turns review feedback into a bounded repair loop. Persisted state makes the work resumable without pretending an interrupted run was approved.",
    note:
      "The threshold is a ceiling for acceptable findings, not a minimum severity to inspect. Use the strict approve setting for security-sensitive or production-critical changes.",
    keywords: [
      "Clodex",
      "Codex adversarial review",
      "Claude Code plugin",
      "review fix loop",
      "pull request automation",
    ],
    related: ["architecture-satisfaction-loop", "stale-safe-batch-release-loop"],
  },
  {
    number: "020",
    slug: "loop-harness-verification-loop",
    title: "The Loop Harness verification loop",
    seoTitle: "Loop Harness Second-Agent Verification Workflow | Loop Library",
    description:
      "A scheduled loop-engineering workflow that runs a coding agent in an isolated worktree and requires a second agent to verify staged output before anything ships.",
    categoryLabel: "AI coding agent workflow",
    author: "Istasha",
    sourceUrl: "https://github.com/lSAAGl/loop-harness",
    published: "2026-06-18",
    modified: "2026-06-18",
    prompt:
      "On the configured cadence, wake the due loop. Give a Claude session the task-specific skill and let it work in an isolated git worktree. Stage the resulting commits or output files without shipping them. Have a second Claude session verify the staged work against explicit acceptance criteria. If verification fails, ship nothing; preserve the findings and retry on the next cycle. If verification passes, ship the configured output—a pull request, review comments, or Slack message—and update the loop state. Finish with the source revision, staged artifacts, verifier result, delivery status, and next scheduled run.",
    verifyTitle: "Only independently verified output ships.",
    verifyDetail:
      "A second-agent pass releases the configured output; a failed verification preserves evidence and produces no external change.",
    useWhen:
      "Use this when a recurring repository task should run unattended but one agent must not be allowed to generate and approve the same output.",
    steps: [
      "Wake the due loop on its cadence and create an isolated worktree from the approved source revision.",
      "Give the primary Claude session its task-specific skill and let it stage one bounded output.",
      "Have a second Claude session inspect the staged work against explicit acceptance criteria.",
      "Ship on a pass; on a failure, preserve the findings, ship nothing, and retry according to the next-cycle policy.",
    ],
    why:
      "Worktree isolation limits interference, and the second-agent gate separates generation from approval. The result is a recurring loop that can wake, work, verify, and ship without relying on one session's confidence.",
    note:
      "This pattern runs an unattended model with shell access. Start with read-only loops, smoke-test with run-once, cap runtime and retries, and grant only the tools each loop needs.",
    keywords: [
      "Loop Harness",
      "scheduled coding agent",
      "git worktree isolation",
      "second-agent verification",
      "autonomous agent workflow",
    ],
    related: ["clodex-adversarial-review-loop", "overnight-docs-sweep"],
  },
  {
    number: "021",
    slug: "boeing-747-benchmark",
    title: "The Boeing 747 benchmark",
    seoTitle: "Boeing 747 Three.js Vision Benchmark | Loop Library",
    description:
      "A vision-guided Three.js workflow that builds, inspects, and improves a Boeing 747 from repeatable camera angles until the agent is 100% satisfied.",
    categoryLabel: "AI visual design workflow",
    author: "@victormustar",
    sourceUrl: "https://x.com/victormustar/status/2064449741685968967",
    published: "2026-06-18",
    modified: "2026-06-18",
    prompt:
      "/goal Create the most realistic Boeing 747 you can using Three.js. Use your vision capabilities to create a self-verifiable system, then enter a loop until you are 100% satisfied with the result. Build a repeatable camera system to inspect the aircraft from every required angle. After each significant change, render those same views, identify what looks least realistic, improve it, and inspect again. Preserve the best version as you iterate, and stop only when you are 100% satisfied that no visible issue remains worth fixing.",
    verifyTitle: "You are 100% satisfied with the Boeing 747.",
    verifyDetail:
      "The camera system shows every required angle, and you cannot identify another visible issue worth improving.",
    useWhen:
      "Use this as a visual benchmark for an agent that can build a complex Three.js scene, inspect its own renders, and improve the result through repeated vision feedback.",
    steps: [
      "Build the first Boeing 747 model in Three.js, starting with the silhouette, proportions, wings, engines, tail, and other major forms.",
      "Create a repeatable camera system that renders the same required angles after every significant change.",
      "Use vision to inspect those views, identify the least realistic part of the current build, and improve it without losing stronger work.",
      "Render and inspect again, preserving the best version until you are 100% satisfied with the complete result.",
    ],
    why:
      "The camera system turns visual judgment into a repeatable feedback loop. Inspecting the same angles after every change makes improvement visible and gives the agent a concrete way to decide when it is fully satisfied.",
    note:
      "Choose the required camera angles before the run and preserve the final renders. The contributor's stop condition is 100% satisfaction, so the images should make that judgment reviewable afterward.",
    keywords: [
      "Boeing 747 benchmark",
      "Three.js agent workflow",
      "vision self-verification",
      "3D reconstruction loop",
      "camera inspection system",
    ],
    related: ["quality-streak-loop", "full-product-evaluation-loop"],
  },
  {
    number: "022",
    slug: "war-loops-frontend-designer",
    title: "War Loops: Autonomous Frontend Designer",
    seoTitle: "War Loops Autonomous Frontend Designer | Loop Library",
    description:
      "A judge-gated frontend workflow that captures a reference, builds static and moving versions, measures fidelity, and surgically repairs the weakest gaps.",
    categoryLabel: "AI frontend design workflow",
    author: "Swayam",
    sourceUrl: "https://github.com/0xtigerclaw/war_loops",
    published: "2026-06-18",
    modified: "2026-06-18",
    prompt:
      "Point War Loops at a URL or image. Capture the page with a genuine browser, extract a ground-truth design spec, and produce two self-correcting builds: a polished static mirror in Pencil and a moving code build in Forge. Judge each build against the original across static design, experiential motion, and responsive reflow. After each evaluation, use the surgical critic to target the weakest signals. Repair, do not rebuild: keep what already matches and change only the highest-impact gaps. Repeat until the measures say it matches, fidelity passes, progress stagnates, or the source capture is blocked. Return the best build with its spec, renders, scores, findings, and run metrics.",
    verifyTitle: "The build matches the reference across every measured fidelity axis.",
    verifyDetail:
      "Static design, experiential motion, and responsive reflow pass their gates, or the best result stops honestly on stagnation or a blocked capture.",
    useWhen:
      "Use this when a frontend must be reconstructed from a URL or image and fidelity needs to be measured across appearance, motion, and responsive behavior instead of judged from one screenshot.",
    steps: [
      "Capture the reference with a genuine browser and extract the ground-truth design spec, including layout, tokens, content, motion, and responsive behavior.",
      "Produce the static Pencil mirror and moving Forge code build from the verified spec.",
      "Judge the builds across static design, experiential motion, and responsive reflow, then identify the weakest signals.",
      "Use surgical repair to fix the highest-impact gaps, preserve what already matches, and repeat until a terminal fidelity decision is reached.",
    ],
    why:
      "War Loops separates a page's still appearance from how it moves and reflows. Multiple judges and targeted repairs let the system improve weak dimensions without churning parts that already match.",
    note:
      "Confirm authorization to reproduce the reference. If the genuine-browser capture reaches a bot wall, login gate, or wrong page, stop instead of building from a bad source.",
    keywords: [
      "War Loops",
      "autonomous frontend designer",
      "frontend fidelity",
      "visual evaluation loop",
      "responsive motion matching",
    ],
    related: ["full-product-evaluation-loop", "sub-50ms-page-load-loop"],
  },
];
