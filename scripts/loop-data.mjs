export const site = {
  name: "Loop Library",
  publisher: "Forward Future",
  baseUrl: "https://signals.forwardfuture.ai/loop-library/",
  description:
    "Practical AI agent workflows for engineering, research, editorial work, evaluation, and operations.",
  updated: "2026-06-15",
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
];
