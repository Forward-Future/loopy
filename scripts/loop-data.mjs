export const site = {
  name: "Loop Library",
  publisher: "Forward Future",
  baseUrl: "https://signals.forwardfuture.ai/loop-library/",
  description:
    "Practical AI agent workflows for engineering, research, editorial work, evaluation, and operations.",
  updated: "2026-06-19",
  socialImageVersion: "20260619-3",
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
    title: "The docs sweep",
    seoTitle: "Documentation Sweep for Coding Agents | Loop Library",
    description:
      "A reusable AI coding-agent workflow for comparing documentation with the current codebase, fixing drift, and opening a reviewable pull request.",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-12",
    modified: "2026-06-18",
    prompt:
      "Whenever a documentation pass is needed, review the codebase in full and make sure all documentation reflects the current implementation. Update stale documentation, verify the changes, then open a pull request.",
    verifyTitle: "Documentation matches the current implementation.",
    verifyDetail: "Finish with a reviewable pull request.",
    useWhen:
      "Use this whenever implementation changes may have left READMEs, setup guides, API references, examples, or runbooks behind.",
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
      "documentation maintenance",
      "pull request workflow",
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
      "A scheduled production-log workflow that traces actionable errors to root causes, verifies fixes, opens a pull request, and stops cleanly when no action is needed.",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-12",
    modified: "2026-06-18",
    prompt:
      "Review our production logs for errors. If you find an actionable issue, trace it to its root cause, fix it, verify the fix, and open a pull request. If no actionable errors are present, stop without making changes.",
    verifyTitle: "Actionable production errors are fixed and verified.",
    verifyDetail:
      "Finish with a pull request, or stop when no actionable errors are present.",
    useWhen:
      "Use this as a scheduled reliability pass when an agent can read production telemetry, trace failures into the repository, run the relevant tests, and prepare a reviewable fix.",
    steps: [
      "Review the agreed production log window and group repeated symptoms into likely incidents.",
      "Separate actionable product errors from expected noise, transient upstream failures, and already-known issues.",
      "Trace each actionable error to a root cause, implement the smallest appropriate fix, and verify it with focused checks.",
      "Open a pull request for each verified fix. If the logs are clean, stop without making changes.",
    ],
    why:
      "The loop converts passive log review into a closed reliability workflow. It requires a root cause, verified change, and review artifact instead of stopping at a list of errors.",
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
    modified: "2026-06-19",
    prompt:
      "Turn [issue] into a review-ready fix. Reproduce the problem, identify the root cause with evidence, make the smallest scoped change, and rerun the same check plus relevant regression tests. Repeat only while the evidence changes. Stop when the fix is proved, [reproduction limit] is reached, or a broader decision is required. Do not expand scope without approval. Finish with the cause, change, proof, risks, and suggested pull-request summary.",
    verifyTitle: "The failure is fixed, verified, and ready for review.",
    verifyDetail:
      "The issue reproduces before the fix, no longer reproduces afterward, and relevant regression checks pass.",
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
    modified: "2026-06-19",
    prompt:
      "Move one agreed customer workflow toward a measurable production outcome. Define the owner, users, inputs, outputs, risks, approvals, and success check. Build or change one bounded part, test it with representative data, fix the smallest verified problem, and retest. Release only through approved stages and monitor the agreed signals. Stop on verified success, a clear blocker, or no progress. Ask before customer-facing, sensitive, financial, or irreversible actions. Finish with the outcome, evidence, open risks, and next step.",
    verifyTitle: "The workflow reaches an approved, measurable outcome.",
    verifyDetail:
      "Evidence confirms the agreed rollout stage and success check, or the run stops with a clear blocker, owner, and next step.",
    useWhen:
      "Use this when an AI workflow must live inside a real customer process and needs validation, approval, gradual rollout, monitoring, and a clear business outcome.",
    steps: [
      "Review the agreed customer priority, recent evidence, approvals, and current workflow state.",
      "Choose one bounded improvement and define its owner, inputs, outputs, risks, approval gates, and success check.",
      "Test it with representative data, fix the smallest verified problem, and release only through approved stages.",
      "Monitor the agreed signals and record the outcome, open risks, reusable lessons, and next step.",
    ],
    why:
      "The loop keeps scope, validation, approval, rollout, monitoring, and learning tied to one customer priority and measurable outcome.",
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
    modified: "2026-06-19",
    prompt:
      "At [cadence], review public product changes from [release window]. Select only changes that matter to users and verify each against the released product or public documentation. Create a short audio update with [available podcast tool], then check the script and audio for accuracy, clarity, and pronunciation. Revise until the checks pass. If nothing meaningful shipped, publish nothing and record the no-op. Ask before releasing the episode. Finish with the episode, sources, and review result.",
    verifyTitle: "The episode is accurate, useful, and ready for review.",
    verifyDetail:
      "Every included update is public and source-backed, or the run records that no episode is needed.",
    useWhen:
      "Use this when a product ships frequently enough that users would benefit from a short recurring audio explanation of what changed and how to use it.",
    steps: [
      "Collect public product changes and supporting sources from the agreed release window.",
      "Select the changes most meaningful to users and verify what actually shipped.",
      "Create a short audio update with the available podcast tool, covering the benefit and how to use each change.",
      "Review the script and audio against the sources, revise unsupported passages, and request approval before release.",
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
    title: "The adversarial code-review loop",
    seoTitle: "Adversarial Code Review Loop for Coding Agents | Loop Library",
    description:
      "A bounded workflow that builds, independently reviews, and revises a code change until it meets an agreed severity bar.",
    categoryLabel: "AI coding agent workflow",
    author: "Lukas Kucinski",
    sourceUrl: "https://github.com/lukaskucinski/clodex",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "For [code change], have one agent implement and verify a reviewable patch, then have an independent reviewer inspect it against [acceptance criteria] and rank findings by severity. Fix findings above [accepted severity], rerun the relevant checks, and review again. Stop on approval, only explicitly accepted findings, no progress, or [iteration limit]. Never report an errored or exhausted run as approved. Finish with the patch, checks, verdict, remaining findings, and review link.",
    verifyTitle: "The change reaches the agreed review bar.",
    verifyDetail:
      "An independent reviewer approves it or only explicitly accepted findings remain; errors, stalls, and exhausted limits are reported as such.",
    useWhen:
      "Use this when a code change needs independent review and may require several bounded fix-and-review rounds.",
    steps: [
      "Define the change, acceptance criteria, accepted severity, and iteration or no-progress limit.",
      "Have the builder implement and verify one reviewable patch.",
      "Have an independent reviewer rank findings, then fix blocking issues and rerun the checks.",
      "Repeat until the review bar or another named stop is reached, then report the verdict and remaining findings.",
    ],
    why:
      "Separating the builder from the reviewer turns findings into a bounded repair loop. Persisted state keeps the work resumable without treating an interruption as approval.",
    note:
      "The source implementation uses Clodex with Codex as the adversarial reviewer. Treat the severity threshold as a ceiling for acceptable findings, not a minimum severity to inspect.",
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
    title: "The second-agent verification loop",
    seoTitle: "Second-Agent Verification Workflow | Loop Library",
    description:
      "A recurring repository workflow that publishes staged output only after a separate agent verifies it.",
    categoryLabel: "AI coding agent workflow",
    author: "Istasha",
    sourceUrl: "https://github.com/lSAAGl/loop-harness",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "At [cadence], run one bounded repository task in an isolated workspace and stage the result without publishing it. Have a separate agent verify the staged work against [acceptance criteria]. Publish the configured output only after a pass and any required approval. On failure, publish nothing, preserve the evidence, and retry only under [retry policy]. Finish with the source revision, staged artifacts, verifier result, delivery status, and next run.",
    verifyTitle: "Only independently verified output ships.",
    verifyDetail:
      "A second-agent pass releases the configured output; a failed verification preserves evidence and produces no external change.",
    useWhen:
      "Use this when a recurring repository task should run unattended but one agent must not be allowed to generate and approve the same output.",
    steps: [
      "Start the due task from the approved source revision in an isolated workspace.",
      "Have the primary agent stage one bounded result without publishing it.",
      "Have a separate agent inspect the staged work against explicit acceptance criteria.",
      "Publish only after a pass and any required approval; otherwise preserve the findings and stop or retry under the agreed policy.",
    ],
    why:
      "Workspace isolation limits interference, and the second-agent gate separates generation from approval. The result can run repeatedly without relying on one session's confidence.",
    note:
      "The source implementation uses Loop Harness, git worktrees, and separate model sessions. Start with read-only tasks, test one run first, cap runtime and retries, and grant only the tools each agent needs.",
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
    title: "The visual reconstruction benchmark",
    seoTitle: "Visual Reconstruction Benchmark for AI Agents | Loop Library",
    description:
      "A visual workflow that improves a rendered subject by comparing repeatable views against references and a fixed quality bar.",
    categoryLabel: "AI visual design workflow",
    author: "@victormustar",
    sourceUrl: "https://x.com/victormustar/status/2064449741685968967",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Recreate [reference subject] with [rendering tool]. Define the reference images, required views, and scoring rubric before building. After each bounded change, render the same views, compare them with the references, and fix the largest visible gap without regressing stronger areas. Keep the best verified version. Stop when every required view meets [quality threshold], progress stalls for [limit], or the budget ends. Finish with the artifact, comparison renders, scores, and remaining gaps.",
    verifyTitle: "Every required view meets the agreed visual threshold.",
    verifyDetail:
      "Repeatable renders meet the fixed rubric, or the run reports stagnation, budget exhaustion, and remaining gaps.",
    useWhen:
      "Use this to test whether an agent can recreate and improve a visual subject through repeatable rendering and comparison.",
    steps: [
      "Define the subject, reference images, required views, scoring rubric, quality threshold, and limits.",
      "Build the first version and create a repeatable camera or capture setup for every required view.",
      "Compare the renders with the references, fix the largest gap, and confirm stronger areas did not regress.",
      "Keep the best verified version and repeat until the threshold or another named stop is reached.",
    ],
    why:
      "Fixed references, views, and scores turn visual judgment into a repeatable comparison. Keeping the best verified version prevents later changes from erasing stronger work.",
    note:
      "The source example rebuilds a Boeing 747 in Three.js. For another subject or renderer, define the references, views, and threshold before the run and preserve the final comparisons.",
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
    title: "The frontend reconstruction loop",
    seoTitle: "Frontend Reconstruction Loop for AI Agents | Loop Library",
    description:
      "A workflow that rebuilds an authorized interface and improves it against repeatable checks for appearance, motion, and responsive behavior.",
    categoryLabel: "AI frontend design workflow",
    author: "Swayam",
    sourceUrl: "https://github.com/0xtigerclaw/war_loops",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Rebuild [authorized page or image] with [available design and code tools]. Capture a reliable reference and record its layout, styles, content, motion, and responsive behavior. Compare the same viewports and interactions after each bounded change. Fix the largest measured mismatch while preserving what already passes. Stop when every agreed fidelity check passes, progress stalls, or the reference cannot be captured. Finish with the best build, reference spec, comparisons, scores, and remaining gaps.",
    verifyTitle: "The build meets every agreed fidelity check.",
    verifyDetail:
      "Appearance, motion, and responsive behavior pass under repeatable conditions, or the run reports stagnation or a blocked reference.",
    useWhen:
      "Use this when an authorized interface must be rebuilt from a URL or image and checked beyond a single screenshot.",
    steps: [
      "Capture a reliable reference and record its layout, styles, content, motion, responsive behavior, and target viewports.",
      "Build the first working reconstruction with the available tools.",
      "Compare the same views and interactions, then identify the largest measured mismatch.",
      "Fix that mismatch, preserve what already passes, and repeat until a fidelity gate or another named stop is reached.",
    ],
    why:
      "Separating appearance, motion, and responsive behavior prevents one good screenshot from hiding a weak implementation. Targeted fixes reduce churn in areas that already match.",
    note:
      "The source implementation uses War Loops with Pencil and Forge. Confirm authorization to reproduce the reference, and stop on a bot wall, login gate, or unreliable capture.",
    keywords: [
      "War Loops",
      "autonomous frontend designer",
      "frontend fidelity",
      "visual evaluation loop",
      "responsive motion matching",
    ],
    related: ["full-product-evaluation-loop", "sub-50ms-page-load-loop"],
  },
  {
    number: "023",
    slug: "self-improving-champion-loop",
    title: "The champion-challenger loop",
    seoTitle: "Champion-Challenger Evaluation Loop | Loop Library",
    description:
      "A bounded workflow that tests targeted changes on fresh evidence and keeps only improvements that pass every guard check.",
    categoryLabel: "AI product evaluation workflow",
    author: "Jose C. Munoz",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Improve [artifact] against [objective] within [budget]. Save the current best version and its score. Each round, make one untried change based on a recorded failure, test it on the working set, and evaluate promising candidates on fresh holdout cases plus [guard checks]. Replace the current best only when the holdout score improves by [margin] and no guard regresses. Stop on success, budget exhaustion, or no progress. Finish with the best version, scores, experiment log, and remaining failures.",
    verifyTitle: "The strongest verified version is returned.",
    verifyDetail:
      "Every candidate is logged, and accepted changes beat the previous version on fresh cases without a guard regression.",
    useWhen:
      "Use this to improve a prompt, policy, configuration, or other testable artifact when cheap iteration is useful but final acceptance must use fresh evidence.",
    steps: [
      "Save the current best version, working set, fresh holdout set, guard checks, improvement margin, budget, and experiment log.",
      "Use a recorded failure to propose one untried change and test it on the working set.",
      "Evaluate promising candidates on the untouched holdout cases and every guard check.",
      "Keep only a meaningful, regression-free win; log every result and return the best version at the stop condition.",
    ],
    why:
      "Separating the working set from fresh holdout cases limits overfitting. Keeping the current best by default prevents regressions, while a fixed budget bounds the search.",
    note:
      "Define the budget, improvement margin, working set, holdout cases, and guard checks before starting. Do not edit against the holdout cases or weaken a guard after a failed candidate.",
    keywords: [
      "self-improving loop",
      "champion challenger evaluation",
      "Goodhart prevention",
      "independent evaluation gate",
      "bounded optimization workflow",
    ],
    related: ["full-product-evaluation-loop", "quality-streak-loop"],
  },
  {
    number: "024",
    slug: "devils-advocate-design-loop",
    title: "The devil's-advocate loop",
    seoTitle: "Devil's-Advocate Design Review Loop | Loop Library",
    description:
      "A critic-and-builder workflow that attacks a design, tracks every objection, and requires evidence before an objection can be closed.",
    categoryLabel: "AI product evaluation workflow",
    author: "Anonymous contributor",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Challenge [design] against [acceptance criteria]. Have a critic record the strongest evidence-backed objections in [shared log] and rank them by impact. For each high-impact objection, have the builder either fix it and verify the result or document why it is accepted. Let the critic reopen unsupported closures. Repeat until no high-impact objection remains or the same unresolved issues show no new evidence or progress for [limit]. Finish with the decision, resolved and accepted objections, evidence, and any stalemate.",
    verifyTitle: "No high-impact objection remains open.",
    verifyDetail:
      "Every logged objection is verified as resolved or explicitly accepted with evidence, or the final report truthfully records a two-round stalemate.",
    useWhen:
      "Use this before committing to an architecture, interface, rollout plan, or other consequential design that benefits from structured adversarial review.",
    steps: [
      "Write the design goals and acceptance criteria, then initialize a shared objection log.",
      "Have the critic present the strongest evidence-backed case against the current design and rank each objection by impact.",
      "Have the builder repair the weakness or document an explicit acceptance rationale, then verify the result against the stated criteria.",
      "Let the critic reopen weak answers and repeat until the objections are closed with evidence or the loop reports a stalemate honestly.",
    ],
    why:
      "Separating critic and builder roles makes disagreement explicit. A persistent objection log prevents circular debate, while evidence-based closure stops the builder from declaring success by explanation alone.",
    note:
      "Keep the critic independent where possible. Do not change the acceptance criteria mid-run simply to close a difficult objection.",
    keywords: [
      "devil's advocate loop",
      "adversarial design review",
      "critic builder workflow",
      "architecture objection log",
      "red team design process",
    ],
    related: ["architecture-satisfaction-loop", "clodex-adversarial-review-loop"],
  },
  {
    number: "025",
    slug: "fresh-clone-loop",
    title: "The fresh-clone loop",
    seoTitle: "Fresh Clone README Verification Loop | Loop Library",
    description:
      "A disposable-environment workflow that follows the README from scratch, fixes every hidden setup assumption, and restarts until onboarding works cleanly.",
    categoryLabel: "AI repository operations workflow",
    author: "0xUmbra",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Test [repository] from a clean disposable environment. Follow only its onboarding documentation. When a step fails or assumes missing knowledge, record the gap, fix the smallest documentation or setup issue, discard the environment, and start again. Carry no dependencies, configuration, credentials, or manual repairs between attempts. Stop when one uninterrupted run reaches [documented ready state], progress stalls, or [budget] ends. Finish with the verified commands, gaps closed, and remaining blockers.",
    verifyTitle: "A clean environment reaches the documented ready state.",
    verifyDetail:
      "The final run uses only the onboarding guide and needs no unstated dependency, configuration, or manual repair.",
    useWhen:
      "Use this to test whether a repository's onboarding instructions work in a clean environment without undocumented help.",
    steps: [
      "Create a disposable environment with no project dependencies or configuration carried over from another checkout.",
      "Fresh-clone the repository and follow only the README, recording every missing step, hidden assumption, and failure.",
      "Fix the smallest setup or documentation gap, discard the environment completely, and begin again.",
      "Repeat until one clean run reaches the documented ready state without intervention, then report the commands and gaps closed.",
    ],
    why:
      "Destroying the environment after each repair prevents local state from hiding the next problem. The final uninterrupted run is direct evidence that the README, not the operator's memory, is sufficient.",
    note:
      "Use an isolated disposable environment and review the repository before executing it. Never copy personal credentials into the test environment or run untrusted setup scripts on a production host.",
    keywords: [
      "fresh clone loop",
      "README verification",
      "developer onboarding test",
      "clean environment setup",
      "repository documentation workflow",
    ],
    related: ["overnight-docs-sweep", "repository-cleanup-loop"],
  },
  {
    number: "026",
    slug: "infinite-clickbait-loop",
    title: "The thumbnail iteration loop",
    seoTitle: "Thumbnail Iteration and Scoring Loop | Loop Library",
    description:
      "A workflow that generates, scores, and refines thumbnail concepts until one clears an agreed quality bar without misleading viewers.",
    categoryLabel: "AI visual design workflow",
    author: "@Alex_FF",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "For [video], create [number] distinct thumbnail concepts from [approved assets]. Score each at realistic display sizes using a fixed rubric for clarity, curiosity, emotional pull, contrast, and accuracy. Improve the weakest dimension of the top candidates and rescore them under the same conditions. Stop when one concept meets [quality threshold], progress stalls, or [budget] ends. Reject misleading concepts. Finish with the winner, runners-up, final previews, scores, and rationale.",
    verifyTitle: "One accurate thumbnail clears the fixed quality threshold.",
    verifyDetail:
      "The winner outscores the alternatives under the same conditions, remains legible at realistic sizes, and represents the video accurately.",
    useWhen:
      "Use this when a video topic and asset set are ready but the thumbnail needs several structured ideation and critique rounds before production.",
    steps: [
      "Define the video subject, approved assets, concept count, quality threshold, limits, and fixed scoring rubric.",
      "Create distinct concepts, inspect them at realistic display sizes, and score each one under the same conditions.",
      "Improve the weakest dimension of the top candidates and rescore them.",
      "Stop at the quality bar or another named limit, reject misleading concepts, and return the winner and runners-up.",
    ],
    why:
      "A varied first set creates real options, while a fixed rubric makes later rounds comparable. Scoring accuracy prevents curiosity from becoming a promise the video cannot keep.",
    note:
      "Choose an inspiration channel whose audience and visual language are relevant. Evaluate the actual thumbnail crop at desktop and mobile sizes, and reject concepts that misrepresent the video's substance.",
    keywords: [
      "Infinite Clickbait",
      "YouTube thumbnail loop",
      "thumbnail iteration workflow",
      "clickbait scoring rubric",
      "AI visual design",
    ],
    related: ["boeing-747-benchmark", "full-product-evaluation-loop"],
  },
  {
    number: "027",
    slug: "autonomy-loop",
    title: "The independent builder-reviewer loop",
    seoTitle: "Independent Builder-Reviewer Loop | Loop Library",
    description:
      "A coding workflow that pairs an isolated builder with an independent reviewer who proves each new test detects the change it protects.",
    categoryLabel: "AI coding agent workflow",
    author: "@inferencegod",
    sourceUrl: "https://github.com/inferencegod/autonomy-loop",
    published: "2026-06-19",
    modified: "2026-06-19",
    prompt:
      "For [repository task], separate builder and reviewer into isolated workspaces. The builder makes one bounded change, adds a test that fails before the fix and passes after it, runs the checks, and hands off. The reviewer reruns the checks, audits the change, and proves the test detects the fix by reverting or mutating it. Accept only on both passes. Stop for protected changes, repeated failure, no progress, or budget exhaustion. Finish with the change, test proof, checks, and risks.",
    verifyTitle: "Every accepted change passes independent test proof.",
    verifyDetail:
      "The new test fails without the change and passes with it, all agreed checks pass, and protected changes remain approval-gated.",
    useWhen:
      "Use this when a repository task benefits from repeated builder-reviewer handoffs and has reliable automated checks.",
    steps: [
      "Separate builder and reviewer workspaces, define the checks, protect sensitive paths, and set the stop limits.",
      "Have the builder make one bounded change with a test that fails before the fix and passes after it.",
      "Have the reviewer rerun the checks, audit the change, and use revert-or-mutate proof on the new test.",
      "Accept only on both passes; otherwise return the findings or request help when a stop condition is reached.",
    ],
    why:
      "Separate workspaces reduce self-approval, while the revert-or-mutate check catches tests that execute code without proving the fix. A durable handoff keeps the loop resumable.",
    note:
      "The source implementation uses autonomy-loop commands, separate worktrees, and a git-backed baton. Treat local hooks as tripwires, not a security boundary, and keep protected changes behind enforced approval.",
    keywords: [
      "autonomy-loop",
      "adversarial code review",
      "mutation testing",
      "builder reviewer workflow",
      "Claude Code loop",
    ],
    related: ["clodex-adversarial-review-loop", "loop-harness-verification-loop"],
  },
  {
    number: "028",
    slug: "codex-completion-contract-loop",
    title: "The completion-contract loop",
    seoTitle: "Completion Contract and Evidence Loop | Loop Library",
    description:
      "A workflow that defines completion up front, tracks proof for every requirement, and prevents partial work from being reported as done.",
    categoryLabel: "AI coding agent workflow",
    author: "3goblack (@Dis_Trackted)",
    sourceUrl:
      "https://github.com/ranvier2d2/skills-share/tree/main/skills/goal-planner-codex",
    published: "2026-06-19",
    modified: "2026-06-19",
    prompt:
      "For [task], define the requirements, scope, non-goals, and evidence needed for completion before acting. After each bounded action, record each requirement as proved, weak, missing, or contradicted using current evidence. Continue only while the evidence closes a requirement and [budget] remains. Mark complete only when every required item is proved. Otherwise stop as blocked, exhausted, or stalled without claiming success. Ask before creating persistent goal state. Finish with the requirement-to-evidence table, status, owner, and next action.",
    verifyTitle: "Every required item has current, adequate proof.",
    verifyDetail:
      "The final audit contains no weak, missing, or contradicted required item; otherwise the work remains open, blocked, or exhausted.",
    useWhen:
      "Use this for long-running or high-risk work where a plausible partial result could be mistaken for completion.",
    steps: [
      "Recover a measurable definition of done for every ambiguous requirement.",
      "Record the requirements, scope, non-goals, evidence plan, and current status without expanding the requested work.",
      "Execute one bounded action at a time and attach current evidence to each affected requirement.",
      "Audit every requirement before closure and preserve honest blocked, exhausted, stalled, or contradicted states.",
    ],
    why:
      "A durable completion contract keeps the definition of done visible across long sessions. Mapping every requirement to evidence makes false completion easy to detect.",
    note:
      "The source implementation uses a Codex goal-planner skill and optional native Goal state. Create persistent goal state only with approval; budget exhaustion never counts as success.",
    keywords: [
      "Codex Goal",
      "completion contract",
      "evidence audit",
      "definition of done",
      "false completion prevention",
    ],
    related: ["ticket-to-pr-ready-loop", "quality-streak-loop"],
  },
  {
    number: "029",
    slug: "revolve-self-improvement-loop",
    title: "The evidence-based improvement loop",
    seoTitle: "Evidence-Based Improvement Loop | Loop Library",
    description:
      "A research workflow that compares one change at a time under a fixed evaluation and keeps only improvements with a safe rollback.",
    categoryLabel: "AI product evaluation workflow",
    author: "Agent Zero",
    sourceUrl: "https://github.com/agent0ai/revolve",
    published: "2026-06-19",
    modified: "2026-06-19",
    prompt:
      "Improve [artifact] toward [objective] within [budget]. Save a version, freeze the evaluation, and record a baseline. Test one change per cycle. Keep it only when it improves by [margin] without a guard regression; otherwise restore the best version. If the evaluation changes, create a revision and rerun the baseline. Ask before changing the live artifact. Stop on success, no progress, a blocker, or budget exhaustion. Finish with the best version, evidence, rollback, and next action.",
    verifyTitle: "The best version wins under one unchanged evaluation.",
    verifyDetail:
      "Every comparison uses the same evaluation, accepted changes pass all guards, rollback is available, and live changes have approval.",
    useWhen:
      "Use this when improving a testable artifact across several experiments that must remain comparable, resumable, and reversible.",
    steps: [
      "Define the objective, permissions, budget, evaluation, guards, and improvement margin; then save and score the current version.",
      "Test one evidence-backed change under the unchanged evaluation.",
      "Keep only a meaningful improvement with no guard regression, and start a new revision if the evaluation changes.",
      "Stop on a named condition and require approval plus verification before changing the live artifact.",
    ],
    why:
      "Revision boundaries prevent unlike scores from being compared as equivalent. Saved versions and an approval boundary keep the work resumable and reversible.",
    note:
      "The source implementation uses Revolve for durable research state and checkpoints. Set the budget before searching, and do not change the evaluator mid-revision to make a preferred candidate win.",
    keywords: [
      "Revolve",
      "agent self improvement",
      "checkpoint evaluation",
      "revisioned experiments",
      "evidence based promotion",
    ],
    related: ["self-improving-champion-loop", "full-product-evaluation-loop"],
  },
];
