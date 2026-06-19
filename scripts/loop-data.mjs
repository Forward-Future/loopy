export const site = {
  name: "Loop Library",
  publisher: "Forward Future",
  baseUrl: "https://signals.forwardfuture.ai/loop-library/",
  description:
    "Practical AI agent workflows for engineering, research, editorial work, evaluation, and operations.",
  updated: "2026-06-19",
  socialImageVersion: "20260619-8",
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
    summary:
      "Keeps documentation aligned with the current codebase and opens a reviewable pull request.",
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
    summary:
      "Refactors architecture in small, tested, independently reviewed checkpoints.",
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
    summary:
      "Optimizes every page until it consistently loads in under 50 ms.",
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
    summary: "Finds, fixes, and verifies actionable errors in production.",
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
    summary:
      "Adds meaningful tests until the full suite reaches 100% coverage.",
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
    summary:
      "Fixes the highest-impact gaps in search and AI answer visibility.",
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
    summary: "Adds useful, tested logs to every important system path.",
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
    summary:
      "Keeps the changelog current with meaningful changes from the previous day.",
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
    summary:
      "Fixes product failures until a defined streak of realistic tests passes.",
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
    summary:
      "Tests every major product capability and fixes outcomes below the quality bar.",
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
    summary:
      "Speeds up the test suite without weakening coverage, assertions, or isolation.",
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
    summary:
      "Recovers valuable repository work and safely removes proven stale state.",
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
    summary:
      "Batches valid changes and releases complete artifacts from the latest integrated main.",
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
    summary:
      "Removes disallowed production data and prevents the same classification errors from returning.",
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
    summary:
      "Benchmarks each completed release and records a reproducible baseline.",
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
    summary:
      "Turns a ticket or complaint into a verified, reviewer-ready pull request.",
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
      "Take a ticket, bug report, failing behavior, or customer complaint and turn it into a review-ready patch. Reproduce the failure in the smallest representative environment, prove the root cause, make the smallest credible fix, and rerun the original reproduction plus relevant regression tests. If the issue cannot be reproduced after two serious attempts, say so. Do not fold unrelated refactors into the patch. Finish with the cause, changed files, before-and-after proof, risks, and pull-request summary.",
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
    summary:
      "Moves one customer AI priority through validation, controlled rollout, and monitoring.",
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
      "Run this when a customer requests an AI workflow, reports a failure, or reaches an operations review. Choose one priority, such as enriching leads, drafting emails, summarizing meetings, or updating a CRM. Define the owner, inputs, approvals, success metric, and ROI hypothesis. Dry-run it on realistic customer data, fix the smallest verified problem, then release through approved stages and monitor production. Finish with the outcome, evidence, customer update, lessons saved, and next review.",
    verifyTitle: "One customer priority reaches a proven terminal state.",
    verifyDetail:
      "The workflow reaches its agreed rollout stage, a production issue is fixed, or a blocker is escalated with an owner and next step.",
    useWhen:
      "Use this when an AI workflow must live inside a real customer process and needs validation, approval, gradual rollout, monitoring, and a clear business outcome.",
    steps: [
      "Review the customer priority, recent feedback, workflow history, failures, approvals, usage, cost, and ROI signals.",
      "Choose one workflow or improvement and define its owner, systems, data, risk, approval gates, success criteria, and ROI hypothesis.",
      "Dry-run it on realistic customer data, repair the smallest underlying issue, and release through controlled stages.",
      "Monitor production, send the customer update, and store reusable preferences, failures, examples, and ROI observations.",
    ],
    why:
      "The workflow itself is only one part of a real deployment. This loop keeps validation, approval, rollout, monitoring, learning, and accountability tied to one customer priority.",
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
    summary:
      "Turns meaningful product updates into a short, source-grounded podcast episode.",
    seoTitle: "Product Update Podcast Automation Loop | Loop Library",
    description:
      "A scheduled editorial workflow that turns meaningful public product changes into a short, source-grounded podcast episode.",
    categoryLabel: "AI editorial workflow",
    author: "Pierson Marks",
    sourceUrl: "https://www.jellypod.com/mcp",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Each night, review publicly released product changes and select only those users need to know. Verify each against the product, docs, or release notes. Use the Jellypod MCP to turn the approved changes into a three-to-five-minute podcast explaining what changed, why it matters, and how to try it. Check the script and audio for accuracy, clarity, and pronunciation. If nothing meaningful shipped, make no episode. Ask before publishing. Finish with the draft episode, sources, and review result.",
    verifyTitle: "The episode accurately covers every meaningful public update.",
    verifyDetail:
      "Finish with a review-ready three-to-five-minute episode, or a confirmed no-episode result when nothing meaningful shipped.",
    useWhen:
      "Use this when a product ships frequently enough that users would benefit from a short recurring audio explanation of what changed and how to use it.",
    steps: [
      "Collect the previous day's public product changes, documentation, and release notes.",
      "Select the changes most meaningful to users and verify what actually shipped.",
      "Use Jellypod to draft a three-to-five-minute episode covering the benefit and how to try each selected change.",
      "Review the script and audio against the sources, regenerate weak passages, and request approval before publishing.",
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
    summary:
      "Uses Codex to review Claude's pull request until blocking findings are resolved.",
    seoTitle: "Clodex Adversarial Code Review Loop | Loop Library",
    description:
      "A Claude-and-Codex workflow that opens a pull request, runs an independent Codex review, fixes blocking findings, and repeats.",
    categoryLabel: "AI coding agent workflow",
    author: "Lukas Kucinski",
    sourceUrl: "https://github.com/lukaskucinski/clodex",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Run /clodex [task] think hard --max-iter 5 --threshold medium. Claude plans the task, implements it, opens a pull request, asks Codex for an adversarial review, fixes findings above the accepted severity, and repeats. Keep the branch, PR, findings, verdict, and iteration state resumable. Stop when Codex approves, only accepted findings remain, progress stalls, or the iteration cap is reached. Never describe an errored or exhausted run as approved. Finish with the PR, checks, verdict, and remaining findings.",
    verifyTitle: "The pull request reaches the configured review bar.",
    verifyDetail:
      "Codex approves it or only explicitly accepted findings remain; errors, stalls, and exhausted limits are reported as such.",
    useWhen:
      "Use Clodex when Claude is building a meaningful code change and Codex should independently review each repair round.",
    steps: [
      "Choose the task, thinking level, maximum iterations, and highest acceptable finding severity.",
      "Have Claude plan, implement, verify, and open the pull request through Clodex.",
      "Run the Codex adversarial review, fix blocking findings, push, and review again.",
      "Persist state across rounds and finish with the verdict, remaining findings, checks, and pull-request link.",
    ],
    why:
      "Clodex separates the Claude builder from the Codex reviewer and turns review feedback into a bounded repair loop. Persisted state keeps the work resumable without treating an interruption as approval.",
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
    title: "The Loop Harness verification loop",
    summary:
      "Ships scheduled agent work only after an independent verification pass.",
    seoTitle: "Loop Harness Second-Agent Verification Workflow | Loop Library",
    description:
      "A scheduled Loop Harness workflow that runs Claude in an isolated worktree and ships staged output only after a second Claude session verifies it.",
    categoryLabel: "AI coding agent workflow",
    author: "Istasha",
    sourceUrl: "https://github.com/lSAAGl/loop-harness",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Use Loop Harness for scheduled repository work such as CI triage, issue grooming, dependency updates, or docs sync. Set [retry limit], then start an isolated git worktree. Let one Claude session stage a patch or outbox message and a second Claude session verify it against explicit criteria. Ship only after a pass; otherwise preserve the findings and retry only within the limit. Finish with the source revision, staged output, verifier result, delivery status, and next run.",
    verifyTitle: "Only independently verified output ships.",
    verifyDetail:
      "A second-agent pass releases the configured output; a failed verification preserves evidence and produces no external change.",
    useWhen:
      "Use this when a recurring repository task should run unattended but one agent must not be allowed to generate and approve the same output.",
    steps: [
      "Set the retry limit, wake the due Loop Harness task, and create an isolated worktree from the approved source revision.",
      "Have the primary Claude session stage one bounded result without publishing it.",
      "Have a second Claude session inspect the staged work against explicit acceptance criteria.",
      "Ship on a pass; otherwise preserve the findings, publish nothing, and retry only until the preset limit.",
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
    title: "The Boeing 747 benchmark",
    summary:
      "Builds and improves a Three.js Boeing 747 across nine repeatable views.",
    seoTitle: "Boeing 747 Three.js Vision Benchmark | Loop Library",
    description:
      "A vision benchmark in which an agent builds a Boeing 747 from Three.js primitives, renders nine repeatable angles, and fixes what each view reveals.",
    categoryLabel: "AI visual design workflow",
    author: "@victormustar",
    sourceUrl: "https://x.com/victormustar/status/2064449741685968967",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Before building, choose reference images, a scoring rubric, [visual threshold], and [budget]. Build the most realistic Boeing 747 you can from Three.js primitives, then create a rig that screenshots nine repeatable angles. After each change, render and score the same views, have a critic identify the weakest feature, and fix it without regressing stronger views. Keep the best version. Stop at the threshold, stalled progress, or budget. Finish with the model, nine renders, scores, remaining gaps, and run summary.",
    verifyTitle: "The Boeing 747 meets the visual bar from all nine angles.",
    verifyDetail:
      "The same camera rig and rubric show every required view meeting the preset threshold, or the run reports stagnation, budget exhaustion, and remaining gaps.",
    useWhen:
      "Use this as a concrete Three.js vision benchmark, or adapt the same capture-and-critic pattern to another rendered subject.",
    steps: [
      "Choose reference images, a scoring rubric, a visual threshold, and a budget; then build the first Boeing 747 from Three.js primitives.",
      "Create a repeatable rig that renders the same nine angles after every meaningful change.",
      "Score each view against the references, have a critic identify the weakest feature, and fix it without losing stronger work.",
      "Keep the best version and repeat until all nine views clear the visual bar or another named stop is reached.",
    ],
    why:
      "The nine-angle rig turns a subjective 3D build into a repeatable visual test. Critiquing the same views after each change exposes problems that one hero render can hide.",
    note:
      "The source run used a Boeing 747, Three.js primitives, nine camera angles, and repeated critics. To adapt it, replace the subject and renderer but keep fixed views, a visible quality bar, and preserved comparison renders.",
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
    title: "War Loops: frontend reconstruction",
    summary:
      "Reconstructs a real interface and repairs its weakest visual and motion mismatches.",
    seoTitle: "War Loops Frontend Reconstruction Workflow | Loop Library",
    description:
      "A War Loops workflow that captures a real page, builds a static Pencil mirror and moving Forge version, then repairs the weakest fidelity signals.",
    categoryLabel: "AI frontend design workflow",
    author: "Swayam",
    sourceUrl: "https://github.com/0xtigerclaw/war_loops",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Point War Loops at an authorized URL or image. Capture it with a genuine browser and record the layout, styles, content, motion, and responsive behavior. Build a static Pencil mirror and a moving Forge version. Compare both with the source at desktop, tablet, and mobile sizes; repair only the weakest fidelity signals. Stop when every gate passes, progress stalls, or capture is blocked. Finish with the builds, spec, renders, scores, and remaining gaps.",
    verifyTitle: "The builds match the source across all three fidelity axes.",
    verifyDetail:
      "Static appearance, experiential motion, and responsive reflow pass their gates, or the run reports stagnation or a blocked capture.",
    useWhen:
      "Use War Loops when an authorized interface must be rebuilt from a URL or image and judged on appearance, motion, and responsive behavior.",
    steps: [
      "Capture the source with a genuine browser and extract its design spec, motion, and target viewports.",
      "Build the static Pencil mirror and moving Forge version from the verified spec.",
      "Judge both across static design, experiential motion, and responsive reflow.",
      "Repair the weakest signals without rebuilding what already matches, then repeat to a terminal fidelity decision.",
    ],
    why:
      "War Loops separates a page's still appearance from how it moves and reflows. Its surgical critic targets the weakest measured signals without churning areas that already match.",
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
    title: "The self-improving champion loop",
    summary:
      "Promotes prompt or policy changes only when they win on fresh holdout cases.",
    seoTitle: "Self-Improving Champion Evaluation Loop | Loop Library",
    description:
      "A prompt-optimization workflow that tests challengers on a working set, promotes only fresh holdout wins, and keeps the current champion on uncertainty.",
    categoryLabel: "AI product evaluation workflow",
    author: "Jose C. Munoz",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Improve a prompt, policy, or configuration. A support assistant's system prompt is one example. Save the champion, its score, a working set, untouched holdout cases, must-pass checks, and [budget]. Each round, change one thing based on a recorded failure. Promote the challenger only if it beats the champion on holdouts by [margin] without weakening a must-pass check; otherwise keep the champion. Stop at the target, budget limit, or no progress. Return the winner, scores, experiment log, and remaining failures.",
    verifyTitle: "The best holdout-tested champion is returned.",
    verifyDetail:
      "Every challenger is logged, and accepted changes beat the previous champion on untouched cases without weakening a must-pass check.",
    useWhen:
      "Use this to tune a prompt, policy, or configuration when cheap iteration is useful but final acceptance must use fresh examples.",
    steps: [
      "Save the current champion, working set, untouched holdout cases, must-pass checks, improvement margin, budget, and experiment log.",
      "Use a recorded failure to propose one targeted challenger and test it on the working set.",
      "Freeze promising challengers and evaluate them on the untouched holdout cases and every must-pass check.",
      "Promote only a meaningful, regression-free holdout win; log every result and return the champion at the stop condition.",
    ],
    why:
      "Separating the working set from fresh holdout cases limits overfitting. Keeping the current best by default prevents regressions, while a fixed budget bounds the search.",
    note:
      "Keep the working set and holdout cases separate: edit against the former, judge final acceptance on the latter. Choose the budget and margin before starting, and do not weaken a must-pass check after a failed challenger.",
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
    summary:
      "Challenges a design until every high-impact objection is resolved or explicitly accepted.",
    seoTitle: "Devil's-Advocate Design Review Loop | Loop Library",
    description:
      "A critic-and-builder workflow that attacks a design, tracks every objection, and requires evidence before an objection can be closed.",
    categoryLabel: "AI product evaluation workflow",
    author: "Anonymous contributor",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Before committing to an architecture, interface, or rollout plan, have a critic argue that it is wrong. Record each objection, impact, and status in a repository-local log at .agent-reviews/redteam.md. The builder must fix and verify each high-impact weakness or document why it is accepted; the critic may reopen unsupported answers. Stop when no high-impact objection remains or the same issues repeat for two rounds without new evidence. Finish with the decision, resolved and accepted objections, evidence, and any stalemate.",
    verifyTitle: "No high-impact objection remains open.",
    verifyDetail:
      "Every logged objection is verified as resolved or explicitly accepted with evidence, or the final report truthfully records a two-round stalemate.",
    useWhen:
      "Use this before committing to an architecture, interface, rollout plan, or other consequential design that benefits from structured adversarial review.",
    steps: [
      "Write the design goals and acceptance criteria, then initialize .agent-reviews/redteam.md inside the repository and keep it out of commits.",
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
    summary:
      "Repeats clean onboarding from the README until no hidden setup assumptions remain.",
    seoTitle: "Fresh Clone README Verification Loop | Loop Library",
    description:
      "A disposable-environment workflow that follows the README from scratch, fixes every hidden setup assumption, and restarts until onboarding works cleanly.",
    categoryLabel: "AI repository operations workflow",
    author: "0xUmbra",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "Clone [repository] into a disposable environment and follow only its README to the documented ready state, such as running the app or building the package. When a step fails or assumes missing knowledge, record the gap, fix the setup or documentation issue, discard the environment, and start again. Carry no dependencies, configuration, credentials, or repairs between attempts. Stop when one uninterrupted fresh clone reaches that state, progress stalls, or [budget] ends. Return exact commands, gaps closed, and remaining blockers.",
    verifyTitle: "A clean environment reaches the documented ready state using only the README.",
    verifyDetail:
      "The final run uses only the onboarding guide and needs no unstated dependency, configuration, or manual repair.",
    useWhen:
      "Use this to test whether a repository's onboarding instructions work in a clean environment without undocumented help.",
    steps: [
      "Create a disposable environment with no project dependencies or configuration carried over from another checkout.",
      "Fresh-clone the repository and follow only the README, recording every missing step, hidden assumption, and failure.",
      "Fix the smallest setup or documentation gap, discard the environment completely, and begin again.",
      "Repeat until one clean run reaches the documented ready state without intervention, then report the exact commands and gaps closed.",
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
    title: "The Infinite Clickbait thumbnail loop",
    summary:
      "Iterates thumbnail concepts until one clears the quality bar without misleading viewers.",
    seoTitle: "Infinite Clickbait Thumbnail Iteration Loop | Loop Library",
    description:
      "A thumbnail workflow that creates ten concepts, scores the top three against a relevant YouTube channel, and improves the winner without misleading viewers.",
    categoryLabel: "AI visual design workflow",
    author: "@Alex_FF",
    published: "2026-06-18",
    modified: "2026-06-19",
    prompt:
      "For [video], use [approved assets] to make ten thumbnail concepts. Score each at real YouTube sizes against [inspiration channel] for clarity, curiosity, emotional pull, contrast, and accuracy. Take the top three, improve each one's weakest dimension, and rescore them under the same rubric. Keep iterating the strongest concept until it clears [quality threshold] or [budget] ends. Reject anything the video cannot deliver. Return the winner, two runners-up, previews, final scores, and rationale.",
    verifyTitle: "One accurate thumbnail clears the fixed quality threshold.",
    verifyDetail:
      "The winner outscores the alternatives under the same conditions, remains legible at realistic sizes, and represents the video accurately.",
    useWhen:
      "Use this when a video topic and asset set are ready but the thumbnail needs several structured ideation and critique rounds before production.",
    steps: [
      "Define the video subject, approved assets, inspiration channel, quality threshold, budget, and five-part rubric.",
      "Create ten distinct concepts, inspect them at real YouTube sizes, and score each one under the same conditions.",
      "Select the top three, improve the weakest dimension of each, and rescore them.",
      "Stop at the quality bar or budget, reject misleading concepts, and return the winner plus two runners-up.",
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
    title: "The autonomy-loop builder-reviewer loop",
    summary:
      "Passes code between builder and reviewer until tests prove each accepted fix.",
    seoTitle: "autonomy-loop Builder-Reviewer Workflow | Loop Library",
    description:
      "An autonomy-loop workflow in which a builder and adversarial reviewer pass a git baton between worktrees and prove each new test can catch its fix.",
    categoryLabel: "AI coding agent workflow",
    author: "@inferencegod",
    sourceUrl: "https://github.com/inferencegod/autonomy-loop",
    published: "2026-06-19",
    modified: "2026-06-19",
    prompt:
      "Use autonomy-loop for [repository task] after the test, build, and lint gates pass. Run /autonomy-loop:autonomy-init, then start builder and reviewer in separate worktrees. The builder reads LOOP-STATE.md, makes one bounded change, and adds a red-before, green-after test. The reviewer reruns the gates and proves the test by reverting or mutating the fix. Accept only on both passes; park protected or repeated-failure work for a human. Finish with the commit, gate evidence, test proof, trust tier, and risks.",
    verifyTitle: "Every accepted wave passes autonomy-loop's proof-of-test gate.",
    verifyDetail:
      "The new test fails without the change, passes with it, every configured gate passes, and protected production changes remain human-gated.",
    useWhen:
      "Use autonomy-loop when a repository has deterministic test, build, and lint gates plus a task suited to repeated builder-reviewer handoffs.",
    steps: [
      "Initialize autonomy-loop, configure deterministic gates and protected paths, and create separate builder and reviewer worktrees.",
      "Have the builder read LOOP-STATE.md, implement one bounded change, add a red-before, green-after test, and hand off.",
      "Have the reviewer rerun every gate and use revert-or-mutate proof to show the test catches the change.",
      "Accept only on both passes; otherwise return findings or park the wave for a human when a circuit breaker fires.",
    ],
    why:
      "Separate worktrees and a git-backed LOOP-STATE.md baton keep the roles independent and resumable. The revert-or-mutate check catches tests that execute code without proving the fix.",
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
    title: "The Codex completion-contract loop",
    summary:
      "Defines completion up front and requires evidence for every reported result.",
    seoTitle: "Codex Completion Contract and Evidence Loop | Loop Library",
    description:
      "A goal-planner-codex workflow that defines completion up front, tracks proof for every requirement, and prevents partial Codex work from being reported as done.",
    categoryLabel: "AI coding agent workflow",
    author: "3goblack (@Dis_Trackted)",
    sourceUrl:
      "https://github.com/ranvier2d2/skills-share/tree/main/skills/goal-planner-codex",
    published: "2026-06-19",
    modified: "2026-06-19",
    prompt:
      "Run $goal-planner-codex [task] for long-running Codex work where partial work could be mistaken for done. Landing a PR and verifying production is one example. Before acting, define every required outcome and its evidence. After each bounded action, mark requirements proved, weak, missing, or contradicted. Complete the Goal only when all are proved; otherwise stop as blocked, stalled, or exhausted. Ask before creating Goal state. Finish with the requirement-to-evidence table, status, owner, and next action.",
    verifyTitle: "Every Codex Goal requirement has current, adequate proof.",
    verifyDetail:
      "The final audit contains no weak, missing, or contradicted required item; otherwise the work remains open, blocked, or exhausted.",
    useWhen:
      "Use this for long-running Codex work, pull requests, runtime checks, or user-visible artifacts where a plausible partial result could be mistaken for completion.",
    steps: [
      "Recover a measurable definition of done for every ambiguous requirement.",
      "Record the requirements, scope, non-goals, evidence plan, and current status without expanding the requested work.",
      "Execute one bounded action at a time and attach current evidence to each affected requirement.",
      "Audit every requirement before closure and preserve honest blocked, exhausted, stalled, or contradicted states.",
    ],
    why:
      "A durable completion contract keeps the definition of done visible across long sessions. Mapping every requirement to evidence makes false completion easy to detect.",
    note:
      "Use $goal-planner-codex only when the user explicitly asks for a Codex Goal or completion audit. Create native Goal state only with approval; ordinary task planning does not need it, and budget exhaustion never counts as success.",
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
    title: "The Revolve versioned-experiment loop",
    summary:
      "Improves prompts, code, or configurations through comparable, checkpointed experiments.",
    seoTitle: "Revolve Versioned Experiment Loop | Loop Library",
    description:
      "A Revolve workflow that improves prompts, code, or configurations through checkpointed experiments whose scores remain comparable across sessions.",
    categoryLabel: "AI product evaluation workflow",
    author: "Agent Zero",
    sourceUrl: "https://github.com/agent0ai/revolve",
    published: "2026-06-19",
    modified: "2026-06-19",
    prompt:
      "Use Revolve to improve a support prompt, code path, or testable subject. In revolve/, define the goal and [budget], freeze the tests and scoring, checkpoint the current version, and record a baseline. Each round, test one hypothesis; keep only a clear, regression-free win. If the evaluation changes, open a new revision and rerun the baseline. Ask before changing live files. Stop on success, no progress, a blocker, or exhausted budget. Return the best checkpoint, comparisons, rollback, and next action.",
    verifyTitle: "The best Revolve checkpoint wins within one evaluation revision.",
    verifyDetail:
      "The incumbent and candidates have comparable recorded runs, accepted changes pass every guard, rollback is available, and live promotion has approval.",
    useWhen:
      "Use Revolve to improve a prompt, policy, workflow, model configuration, code path, or dataset when experiments must remain comparable and resumable across sessions.",
    steps: [
      "Create or resume revolve/, define the objective and permissions, freeze an evaluation revision, checkpoint the incumbent, and record its baseline.",
      "Choose one evidence-backed hypothesis, create a candidate checkpoint, and test it under the unchanged revision.",
      "Promote internally only on a meaningful guard-safe win; if the evaluation changes, open a new revision and rerun the incumbent.",
      "Stop on a named condition, and require explicit approval plus verification before changing live files.",
    ],
    why:
      "Revolve's revision boundaries prevent scores from different tests or rubrics from being compared as equivalent. Checkpoints and an internal-before-live promotion boundary keep long-running research resumable and reversible.",
    note:
      "The source examples include improving CLI error messages, reducing image-export latency, tuning a support-assistant prompt, and hardening a parser. Replace the subject and metric, but keep the revision, checkpoint, and rollback discipline.",
    keywords: [
      "Revolve",
      "agent self improvement",
      "checkpoint evaluation",
      "revisioned experiments",
      "evidence based promotion",
    ],
    related: ["self-improving-champion-loop", "full-product-evaluation-loop"],
  },
  {
    number: "030",
    slug: "five-minute-repository-maintainer-loop",
    title: "The five-minute repository maintainer loop",
    summary:
      "Keeps repository work moving through dedicated threads without interrupting active agents.",
    seoTitle: "Five-Minute Repository Maintainer Loop | Loop Library",
    description:
      "A five-minute Codex workflow that triages repositories, directs bounded maintenance to dedicated threads, and requires proof and permission before work lands.",
    categoryLabel: "AI repository operations workflow",
    author: "Peter Steinberger",
    sourceUrl:
      "https://github.com/steipete/agent-scripts/blob/main/skills/maintainer-orchestrator/SKILL.md",
    published: "2026-06-19",
    modified: "2026-06-19",
    prompt:
      "While repository maintenance is active, wake every five minutes. Triage [repositories] and read each repository thread's latest state. Reuse one thread per repository; assign its highest-value bounded task only within granted permissions, and do not interrupt coherent active work. Require tests, live proof, autoreview, and green CI before work can land. Escalate product, access, security, or irreversible decisions. Record meaningful changes and stop when every item is landed, decision-ready, blocked, or has no work.",
    verifyTitle:
      "Every repository item reaches a proven handoff or terminal state.",
    verifyDetail:
      "Authorized autonomous work lands with evidence; other items are decision-ready, blocked with one exact ask, or recorded as a clean no-op.",
    useWhen:
      "Use this when Codex may coordinate maintenance across several active repositories and you want parallel work to stay steerable without duplicating or micromanaging threads.",
    steps: [
      "Define the repository scope, exclusions, and separate permissions for triage, delegation, implementation, push, CI repair, merge, and release.",
      "Every five minutes, refresh each repository queue and read the latest state of its existing thread before choosing the highest-value eligible item.",
      "Reuse one thread per repository, assign one bounded task, and let coherent active work continue unless it is blocked, stalled, unsafe, or off course.",
      "Require tests, live proof, autoreview, and green CI; record the evidence, then route the next item or present the owner with one exact decision.",
    ],
    why:
      "A five-minute heartbeat keeps the control plane current without turning polling into micromanagement. One thread per repository preserves context, while proof and authorization gates make autonomous landing auditable.",
    note:
      "The source pairs Maintainer Orchestrator with github-project-triage, autoreview, and computer use for live proof. A heartbeat automates observation, not authority: triage, delegation, implementation, push, merge, and release remain separate permissions. Read current thread state before steering, and never duplicate or interrupt active work.",
    keywords: [
      "Codex repository maintenance",
      "multi-repository orchestration",
      "five minute agent loop",
      "GitHub project triage",
      "thread delegation",
    ],
    related: ["ticket-to-pr-ready-loop", "stale-safe-batch-release-loop"],
  },
  {
    number: "031",
    slug: "recent-feedback-sweep",
    title: "The recent-feedback sweep",
    summary:
      "Turns recent user corrections into a project-wide audit and verified fixes.",
    seoTitle: "Recent-Feedback Project Audit | Loop Library",
    description:
      "A project audit that turns recent user-reported problems into reusable failure patterns, fixes every confirmed match, and verifies a clean final sweep.",
    categoryLabel: "AI coding agent workflow",
    author: "Matthew Berman",
    published: "2026-06-19",
    modified: "2026-06-19",
    prompt:
      "Review all available threads from [lookback window] where I reported something wrong with [project] and asked for a fix. Build a deduplicated issue list, group it into failure patterns, and verify current state. Audit the complete project for every pattern, fix each confirmed instance, and add regression coverage where practical. Repeat the full audit until it finds no remaining instance or [iteration budget] ends. Stop on blocked or approval-gated work. Return the issues, fixes, evidence, and blockers.",
    verifyTitle:
      "The issue inventory is closed and a fresh pattern audit is clean.",
    verifyDetail:
      "Every reported issue and newly found match has current proof of resolution; blocked, approval-gated, or budget-exhausted items remain explicitly open.",
    useWhen:
      "Use this after several days of project feedback when repeated mistakes may point to similar issues elsewhere and the agent can inspect both the conversation history and the complete current project.",
    steps: [
      "Define the lookback window and complete project surface, then collect every accessible thread in which the user reported a problem and requested a fix.",
      "Deduplicate the reported issues, verify their current status, and turn the concrete examples into explicit failure patterns and audit checks.",
      "Audit every in-scope project surface for each pattern, fix one confirmed instance at a time, and add regression coverage where practical.",
      "Run targeted checks after each fix, then rerun the complete pattern audit and relevant full checks before declaring the sweep clean.",
    ],
    why:
      "Recent corrections are concrete examples of the quality bar the project missed. Grouping them into failure patterns turns one-off feedback into a reusable audit rubric, while a fresh full sweep catches sibling defects and verifies the current project rather than trusting old thread state.",
    note:
      "Thread access and a complete surface inventory are prerequisites. Do not infer defects from neutral discussion, reopen resolved issues without checking current behavior, or claim success while an inaccessible, blocked, approval-gated, or budget-exhausted item remains. Get approval before destructive, production, or external actions.",
    keywords: [
      "recent user feedback",
      "project-wide issue audit",
      "failure pattern sweep",
      "regression prevention",
      "AI coding agent",
    ],
    related: ["full-product-evaluation-loop", "quality-streak-loop"],
  },
];
