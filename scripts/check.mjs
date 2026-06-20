import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  categories,
  featuredLoopSlugs,
  getLoopCategory,
  loops,
  site as siteMeta,
} from "./loop-data.mjs";
import {
  catalogSchemaVersion,
  renderCatalogJson,
  renderCatalogMarkdown,
} from "./build-skill-catalog.mjs";
import { escapeJsonForHtmlScript } from "./html-script-utils.mjs";
import { validateLoopData } from "./validate-loop-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(root, "site");
const workerRoot = path.join(root, "worker");
const skillRoot = path.join(root, "skills", "loop-library");

const [
  html,
  learnHtml,
  css,
  script,
  dataSource,
  workerSource,
  workerPackageSource,
  wranglerSource,
  sitemap,
  feed,
  hereNowIcon,
  loopDirectories,
  loopPages,
  skillSource,
  skillCatalog,
  skillAuditGuide,
  publicCatalogMarkdown,
  publicCatalogJsonSource,
  skillInterface,
] =
  await Promise.all([
    readFile(path.join(siteRoot, "index.html"), "utf8"),
    readFile(path.join(siteRoot, "learn", "index.html"), "utf8"),
    readFile(path.join(siteRoot, "styles.css"), "utf8"),
    readFile(path.join(siteRoot, "script.js"), "utf8"),
    readFile(path.join(siteRoot, ".herenow", "data.json"), "utf8"),
    readFile(path.join(workerRoot, "src", "index.js"), "utf8"),
    readFile(path.join(workerRoot, "package.json"), "utf8"),
    readFile(path.join(workerRoot, "wrangler.jsonc"), "utf8"),
    readFile(path.join(siteRoot, "sitemap.xml"), "utf8"),
    readFile(path.join(siteRoot, "feed.xml"), "utf8"),
    readFile(path.join(siteRoot, "assets", "here-now-icon.svg"), "utf8"),
    readdir(path.join(siteRoot, "loops")),
    Promise.all(
      loops.map((loop) =>
        readFile(
          path.join(siteRoot, "loops", loop.slug, "index.html"),
          "utf8",
        ),
      ),
    ),
    readFile(path.join(skillRoot, "SKILL.md"), "utf8"),
    readFile(path.join(skillRoot, "references", "catalog.md"), "utf8"),
    readFile(path.join(skillRoot, "references", "audit.md"), "utf8"),
    readFile(path.join(siteRoot, "catalog.md"), "utf8"),
    readFile(path.join(siteRoot, "catalog.json"), "utf8"),
    readFile(path.join(skillRoot, "agents", "openai.yaml"), "utf8"),
  ]);

const dataManifest = JSON.parse(dataSource);
const publicCatalog = JSON.parse(publicCatalogJsonSource);
const workerPackage = JSON.parse(workerPackageSource);
const wranglerConfig = JSON.parse(wranglerSource);
const suggestions = dataManifest.collections?.suggestions;
const weeklySignups = dataManifest.collections?.weekly_signups;
const structuredDataMatch = html.match(
  /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
);
const homeSocialImageName = `loop-library-${siteMeta.socialImageVersion}.${siteMeta.socialImageExtension}`;
const loopSocialImageNames = loops.map(
  (loop) =>
    `${loop.slug}-${siteMeta.socialImageVersion}.${siteMeta.socialImageExtension}`,
);
const expectedSocialImageNames = [homeSocialImageName, ...loopSocialImageNames];
const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const [socialImageNames, socialImages] = await Promise.all([
  readdir(path.join(siteRoot, "assets", "social")),
  Promise.all(
    expectedSocialImageNames.map((name) =>
      readFile(path.join(siteRoot, "assets", "social", name)),
    ),
  ),
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const scriptTerminationPayload = {
  value: "</ScRiPt><script>globalThis.compromised = true</script>",
};
const escapedScriptJson = escapeJsonForHtmlScript(
  JSON.stringify(scriptTerminationPayload),
);
assert.doesNotMatch(escapedScriptJson, /<\/script/i);
assert.deepEqual(JSON.parse(escapedScriptJson), scriptTerminationPayload);

function pngSize(buffer) {
  assert(buffer.subarray(0, pngSignature.length).equals(pngSignature));
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function wordCount(value) {
  return value.trim().split(/\s+/).length;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

assert(structuredDataMatch);
const structuredData = JSON.parse(structuredDataMatch[1]);
const collection = structuredData["@graph"].find(
  (item) => item["@type"] === "CollectionPage",
);
const agentLoopTerm = structuredData["@graph"].find(
  (item) => item["@type"] === "DefinedTerm",
);
const slugs = new Set(loops.map((loop) => loop.slug));
const loopBySlug = new Map(loops.map((loop) => [loop.slug, loop]));
const featuredLoops = featuredLoopSlugs.map((slug) => loopBySlug.get(slug));
const featuredSlugSet = new Set(featuredLoopSlugs);
const titles = new Set(loops.map((loop) => loop.title));
const prompts = new Set(loops.map((loop) => loop.prompt));
const categorySlugs = new Set(categories.map((category) => category.slug));
const requestedConceptSlugs = [
  "overnight-docs-sweep",
  "architecture-satisfaction-loop",
  "sub-50ms-page-load-loop",
  "production-error-sweep",
  "100-percent-test-coverage-loop",
  "exhaustive-logging-coverage-loop",
  "nightly-changelog-sweep",
  "quality-streak-loop",
  "full-product-evaluation-loop",
  "test-suite-speed-loop",
  "repository-cleanup-loop",
  "stale-safe-batch-release-loop",
  "production-data-cleanup-loop",
  "post-release-baseline-loop",
  "ticket-to-pr-ready-loop",
  "customer-ai-deployment-loop",
  "product-update-podcast-loop",
  "clodex-adversarial-review-loop",
  "loop-harness-verification-loop",
  "boeing-747-benchmark",
  "war-loops-frontend-designer",
  "self-improving-champion-loop",
  "devils-advocate-design-loop",
  "fresh-clone-loop",
  "infinite-clickbait-loop",
  "autonomy-loop",
  "codex-completion-contract-loop",
  "revolve-self-improvement-loop",
  "five-minute-repository-maintainer-loop",
  "recent-feedback-sweep",
  "promise-to-proof-loop",
  "propagation-compliance-loop",
  "multi-llm-convergence-loop",
  "goal-forge-loop",
  "ui-ux-score-loop",
  "cold-load-trimmer-loop",
  "pixel-safe-css-trim-loop",
  "easy-onboarding-loop",
  "accessibility-repair-loop",
  "housekeeper-loop",
  "axelrod-subagent-arena-loop",
];
const submissionPromptAnchors = new Map([
  ["ticket-to-pr-ready-loop", ["bug report", "customer complaint"]],
  ["customer-ai-deployment-loop", ["enriching leads", "updating a CRM"]],
  ["product-update-podcast-loop", ["Jellypod MCP", "three-to-five-minute"]],
  ["clodex-adversarial-review-loop", ["/clodex", "Claude", "Codex"]],
  ["loop-harness-verification-loop", ["Loop Harness", "CI triage"]],
  ["boeing-747-benchmark", ["Boeing 747", "Three.js", "nine"]],
  ["war-loops-frontend-designer", ["War Loops", "Pencil", "Forge"]],
  ["self-improving-champion-loop", ["support assistant", "holdout"]],
  ["devils-advocate-design-loop", ["architecture", ".agent-reviews/redteam.md"]],
  ["fresh-clone-loop", ["README", "running the app", "building the package"]],
  ["infinite-clickbait-loop", ["ten thumbnail", "top three", "YouTube"]],
  ["autonomy-loop", ["autonomy-loop", "LOOP-STATE.md", "red-before"]],
  ["codex-completion-contract-loop", ["$goal-planner-codex", "landing a PR"]],
  ["revolve-self-improvement-loop", ["Revolve", "revolve/", "support prompt"]],
  [
    "five-minute-repository-maintainer-loop",
    ["every five minutes", "one thread per repository", "autoreview"],
  ],
  ["promise-to-proof-loop", ["customer-facing promise", "proven", "riskiest mismatch"]],
  ["propagation-compliance-loop", ["old value", "zero stale values", "two rounds"]],
  [
    "multi-llm-convergence-loop",
    ["two genuinely different model families", "same unchanged version", "oscillation"],
  ],
  ["goal-forge-loop", ["SPEC.md", "GOAL.md", "done_when"]],
  ["ui-ux-score-loop", ["user flow", "fresh state", "two full passes"]],
  ["cold-load-trimmer-loop", ["transferred bytes", "pixel-identical", "revert"]],
  ["pixel-safe-css-trim-loop", ["one declaration or rule", "pixel-identical", "built CSS"]],
  ["easy-onboarding-loop", ["clean session", "onboarding", "product requirement"]],
  ["accessibility-repair-loop", ["highest-impact blocker", "same checks", "weaken the target"]],
  ["housekeeper-loop", ["dead code", "unused dependencies", "runtime checks"]],
  ["axelrod-subagent-arena-loop", ["Axelrod", "always-defect", "180 rounds"]],
]);
const beginnerClarityAnchors = new Map([
  ["promise-to-proof-loop", ["marketing", "current product behavior", "customer trust"]],
  ["propagation-compliance-loop", ["old value", "intentionally", "comes back for two rounds"]],
  ["multi-llm-convergence-loop", ["plan, specification", "same unchanged version", "model family means"]],
  ["goal-forge-loop", ["SPEC.md describes", "GOAL.md tells", "/goal is Codex's long-running task mode"]],
  ["ui-ux-score-loop", ["flow means a user goal", "screen size is sometimes called a viewport", "no saved login"]],
  ["cold-load-trimmer-loop", ["transferred bytes—the amount", "first screen", "screenshots protect only"]],
  ["pixel-safe-css-trim-loop", ["CSS is the code that controls", "coverage report can suggest", "pixel-identical"]],
  ["easy-onboarding-loop", ["clean session means", "first-time user", "visible guidance"]],
  ["accessibility-repair-loop", ["keyboard", "screen-reader", "automated tools can find likely problems"]],
  ["housekeeper-loop", ["repository means the code project", "dead code, meaning", "Never delete"]],
  ["axelrod-subagent-arena-loop", ["cooperate (C) or defect (D)", "both cooperate, 3 points each", "cooperation-stability"]],
]);

assert.equal(collection.mainEntity.numberOfItems, loops.length);
assert.equal(collection.mainEntity.itemListElement.length, loops.length);
assert.equal(
  collection.about["@id"],
  `${siteMeta.baseUrl}#ai-agent-loop`,
);
assert.equal(agentLoopTerm.name, "AI agent loop");
assert.equal(
  agentLoopTerm.url,
  `${siteMeta.baseUrl}learn/`,
);
assert.deepEqual(agentLoopTerm.sameAs, [
  "https://code.claude.com/docs/en/agent-sdk/agent-loop",
  "https://arxiv.org/abs/2210.03629",
]);
assert.equal(loops.length, 42);
assert.equal(slugs.size, loops.length);
assert.equal(featuredLoopSlugs.length, 3);
assert.equal(new Set(featuredLoopSlugs).size, featuredLoopSlugs.length);
assert(featuredLoops.every(Boolean));
assert.equal(titles.size, loops.length);
assert.equal(prompts.size, loops.length);
assert(
  loops.every((loop) => wordCount(loop.prompt) < 80),
  "Published loop prompts must stay under 80 words.",
);
assert.match(siteMeta.socialImageVersion, /^\d{8}(?:-\d+)?$/);
assert.equal(siteMeta.socialImageExtension, "png");
assert.equal(siteMeta.socialImageMimeType, "image/png");
assert.equal(new Set(loops.map((loop) => loop.number)).size, loops.length);
assert.equal(new Set(loops.map((loop) => loop.seoTitle)).size, loops.length);
assert.equal(categories.length, 5);
assert.equal(categorySlugs.size, categories.length);
assert.deepEqual(
  categories.map(({ label }) => label),
  ["Engineering", "Evaluation", "Operations", "Content", "Design"],
);
assert(loops.every((loop) => !Object.hasOwn(loop, "type")));
assert(loops.every((loop) => !Object.hasOwn(loop, "typeSlug")));
assert(requestedConceptSlugs.every((slug) => slugs.has(slug)));
const invalidRelatedLoops = structuredClone(loops);
invalidRelatedLoops.at(-1).related = ["missing-review-fixture"];
assert.throws(
  () => validateLoopData(invalidRelatedLoops),
  /axelrod-subagent-arena-loop references unknown related loop: missing-review-fixture/,
);
for (const [slug, anchors] of submissionPromptAnchors) {
  const prompt = loopBySlug.get(slug)?.prompt ?? "";
  const normalizedPrompt = prompt.toLowerCase();

  for (const anchor of anchors) {
    assert(
      normalizedPrompt.includes(anchor.toLowerCase()),
      `${slug} must preserve the source-specific prompt anchor: ${anchor}`,
    );
  }
}
for (const [slug, anchors] of beginnerClarityAnchors) {
  const loop = loopBySlug.get(slug);
  const publicCopy = [
    loop?.summary,
    loop?.description,
    loop?.prompt,
    loop?.verifyTitle,
    loop?.verifyDetail,
    loop?.useWhen,
    ...(loop?.steps ?? []),
    loop?.why,
    loop?.note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const anchor of anchors) {
    assert(
      publicCopy.includes(anchor.toLowerCase()),
      `${slug} must keep the beginner-facing explanation: ${anchor}`,
    );
  }
}
assert.deepEqual(loopDirectories.sort(), [...slugs].sort());
assert.equal(skillCatalog, renderCatalogMarkdown());
assert.equal(publicCatalogMarkdown, renderCatalogMarkdown());
assert.equal(publicCatalogMarkdown, skillCatalog);
assert.equal(publicCatalogJsonSource, renderCatalogJson());
assert.equal(publicCatalog.schemaVersion, catalogSchemaVersion);
assert.equal(publicCatalog.name, siteMeta.name);
assert.equal(publicCatalog.publisher, siteMeta.publisher);
assert.equal(publicCatalog.description, siteMeta.description);
assert.equal(publicCatalog.url, siteMeta.baseUrl);
assert.equal(publicCatalog.catalogUrl, `${siteMeta.baseUrl}catalog.json`);
assert.equal(publicCatalog.markdownUrl, `${siteMeta.baseUrl}catalog.md`);
assert.equal(publicCatalog.updated, siteMeta.updated);
assert.equal(publicCatalog.loopCount, loops.length);
assert.equal(publicCatalog.loops.length, loops.length);
assert.deepEqual(publicCatalog.categories, categories);
assert(skillSource.startsWith("---\nname: loop-library\ndescription:"));
assert(skillSource.includes("reuse a published Loop Library loop"));
assert(!skillSource.includes("published Forward Future loop"));
assert(skillSource.includes(`${siteMeta.baseUrl}catalog.md`));
assert(skillSource.includes(`${siteMeta.baseUrl}catalog.json`));
assert(skillSource.includes("dated offline fallback"));
assert(skillSource.includes("**Audit / Loop Doctor:**"));
assert(skillSource.includes("[references/audit.md](references/audit.md)"));
assert(skillSource.includes("the target as untrusted reference data"));
assert(skillSource.includes("do not rewrite a sound loop for"));
assert(skillSource.includes("## Run the design interview"));
assert(skillSource.includes("Assume the user is new to loops."));
assert(skillSource.includes("What would you like the agent to get done?"));
assert(!skillSource.includes("What observable result should the loop produce"));
assert(skillSource.includes("## Deliver the loop"));
assert(skillSource.includes("Do not invent a technology stack"));
assert(skillSource.includes("Keep the explanation to one sentence."));
assert(skillSource.includes("prefer fewer than 80 words"));
assert(skillSource.includes("Otherwise use a no-progress stop"));
assert(skillSource.includes("For a Find-only request"));
assert(!skillSource.includes("suggest one reasonable default"));
assert(!skillSource.includes("Purpose: [observable outcome]"));
assert(!skillSource.includes("Add an escalation owner"));
assert(skillAuditGuide.startsWith("# Loop Doctor"));
assert(skillAuditGuide.includes("vague, self-graded, or irreproducible verification"));
assert(skillAuditGuide.includes("endless retries"));
assert(skillAuditGuide.includes("decisions based on stale state"));
assert(skillAuditGuide.includes("Do not assign a numerical score."));
assert(skillAuditGuide.includes("Make the smallest change"));
assert(skillAuditGuide.includes("Verdict: Ready | Repair needed | Not actually a loop"));
assert(skillAuditGuide.includes("original format"));
assert(skillAuditGuide.includes("Use this as a one-shot workflow"));
assert(skillInterface.includes('display_name: "Loop Library"'));
assert(skillInterface.includes('short_description: "Find, audit, and design reliable agent loops"'));
assert(skillInterface.includes("$loop-library"));

const loopTableIndex = html.indexOf('<table class="loop-table">');
assert(loopTableIndex >= 0);

for (const [index, loop] of loops.entries()) {
  const url = `${siteMeta.baseUrl}loops/${loop.slug}/`;
  const imageUrl = `${siteMeta.baseUrl}assets/social/${loop.slug}-${siteMeta.socialImageVersion}.${siteMeta.socialImageExtension}`;
  const imageAlt = `${loop.title} — Forward Future Loop Library`;
  const postText = `Try "${loop.title}" from the Loop Library: ${loop.summary}`;
  const socialPost = `${postText}\n\n${url}`;
  const page = loopPages[index];
  const listItem = collection.mainEntity.itemListElement[index];
  const homepageHref = `href="./loops/${loop.slug}/"`;
  const homepageHrefIndex = html.indexOf(homepageHref, loopTableIndex);
  const rowStart = html.lastIndexOf("<tr", homepageHrefIndex);
  const rowEnd = html.indexOf("</tr>", homepageHrefIndex);
  const homepageRow = html.slice(rowStart, rowEnd);
  const normalizedHomepageRow = homepageRow.replace(/\s+/g, " ");
  const category = getLoopCategory(loop);
  const catalogLoop = publicCatalog.loops[index];
  const pageStructuredDataMatch = page.match(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
  );

  assert(homepageHrefIndex >= 0);
  assert(rowStart >= 0);
  assert(rowEnd > homepageHrefIndex);
  assert.equal(listItem.position, index + 1);
  assert.equal(listItem.name, loop.title);
  assert.equal(listItem.url, url);
  assert.equal(catalogLoop.number, loop.number);
  assert.equal(catalogLoop.slug, loop.slug);
  assert.equal(catalogLoop.title, loop.title);
  assert.equal(catalogLoop.url, url);
  assert.deepEqual(catalogLoop.category, category);
  assert.equal(catalogLoop.author, loop.author);
  assert.equal(catalogLoop.published, loop.published);
  assert.equal(catalogLoop.modified, loop.modified);
  assert.equal(catalogLoop.description, loop.description);
  assert(wordCount(loop.summary) >= 8);
  assert(wordCount(loop.summary) <= 15);
  assert(/[.!?]$/.test(loop.summary));
  assert.equal(catalogLoop.useWhen, loop.useWhen);
  assert.equal(catalogLoop.prompt, loop.prompt);
  assert.equal(catalogLoop.verification.title, loop.verifyTitle);
  assert.equal(catalogLoop.verification.detail, loop.verifyDetail);
  assert.deepEqual(catalogLoop.steps, loop.steps);
  assert.equal(catalogLoop.why, loop.why);
  assert.equal(catalogLoop.implementationNote, loop.note);
  assert.deepEqual(catalogLoop.keywords, loop.keywords);
  assert.deepEqual(
    catalogLoop.related.map(({ slug }) => slug),
    loop.related,
  );
  assert.deepEqual(
    catalogLoop.related.map(({ title }) => title),
    loop.related.map((relatedSlug) => loopBySlug.get(relatedSlug).title),
  );
  assert.deepEqual(
    catalogLoop.related.map(({ url: relatedUrl }) => relatedUrl),
    loop.related.map(
      (relatedSlug) => `${siteMeta.baseUrl}loops/${relatedSlug}/`,
    ),
  );
  assert.equal(catalogLoop.sourceUrl, loop.sourceUrl);
  assert(loop.related.every((relatedSlug) => slugs.has(relatedSlug)));
  assert(html.includes(loop.title));
  assert(normalizedHomepageRow.includes(loop.prompt));
  assert(
    homepageRow.includes(
      `<p class="loop-summary">${escapeHtml(loop.summary)}</p>`,
    ),
  );
  assert(!homepageRow.includes('class="cell-number"'));
  assert(homepageRow.includes(`data-category="${category.slug}"`));
  assert(
    homepageRow.includes(
      `<span class="loop-category">${category.label}</span>`,
    ),
  );
  assert(homepageRow.includes(loop.author));
  if (featuredSlugSet.has(loop.slug)) {
    assert(homepageRow.includes('data-featured="true"'));
    assert(homepageRow.includes('<span class="loop-featured">Featured</span>'));
  } else {
    assert(!homepageRow.includes('data-featured="true"'));
    assert(!homepageRow.includes('class="loop-featured"'));
  }
  assert(
    homepageRow.includes(
      `<span class="loop-attribution">By ${escapeHtml(loop.author)}</span>`,
    ),
  );
  assert(html.includes(homepageHref));
  assert(page.includes(`<title>${escapeHtml(loop.seoTitle)}</title>`));
  assert(
    page.includes(
      `<meta name="description" content="${escapeHtml(loop.description)}"`,
    ),
  );
  assert(
    page.includes(`<meta name="author" content="${escapeHtml(loop.author)}"`),
  );
  assert(page.includes(`<link rel="canonical" href="${url}"`));
  assert(
    page.includes(
      `type="application/json" title="${siteMeta.name} catalog" href="${siteMeta.baseUrl}catalog.json"`,
    ),
  );
  assert(
    page.includes(
      `type="text/markdown" title="${siteMeta.name} catalog in Markdown" href="${siteMeta.baseUrl}catalog.md"`,
    ),
  );
  assert(page.includes(`<meta property="og:image" content="${imageUrl}"`));
  assert(page.includes(`<meta property="og:image:secure_url" content="${imageUrl}"`));
  assert(page.includes(`<meta property="og:image:type" content="${siteMeta.socialImageMimeType}"`));
  assert(page.includes('<meta property="og:image:width" content="1200"'));
  assert(page.includes('<meta property="og:image:height" content="630"'));
  assert(
    page.includes(
      `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}"`,
    ),
  );
  assert(
    page.includes(
      `<meta property="article:published_time" content="${loop.published}"`,
    ),
  );
  assert(
    page.includes(
      `<meta property="article:modified_time" content="${loop.modified}"`,
    ),
  );
  assert(page.includes('<meta name="twitter:card" content="summary_large_image"'));
  assert(page.includes(`<meta name="twitter:image" content="${imageUrl}"`));
  assert(
    page.includes(
      `<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}"`,
    ),
  );
  assert(
    !page.includes(
      `<meta property="og:image" content="${siteMeta.baseUrl}assets/ff-mark.png"`,
    ),
  );
  assert(page.includes(loop.description));
  assert(page.includes(escapeHtml(loop.prompt)));
  assert(page.includes(`<p class="eyebrow">Loop ${loop.number}</p>`));
  assert(page.includes(`Contributed by <strong>${loop.author}</strong>`));
  assert(page.includes(escapeHtml(loop.verifyTitle)));
  assert(page.includes(escapeHtml(loop.verifyDetail)));
  assert(page.includes(escapeHtml(loop.useWhen)));
  assert(loop.steps.every((step) => page.includes(escapeHtml(step))));
  assert(page.includes(escapeHtml(loop.why)));
  assert(page.includes(escapeHtml(loop.note)));
  assert(
    loop.related.every((slug) => page.includes(`href="../${slug}/"`)),
  );
  assert(page.includes('class="detail-more"'));
  assert(!page.includes(`<p class="eyebrow">${loop.categoryLabel}</p>`));
  assert(page.includes("<dt>Published</dt>"));
  assert(page.includes("<dt>Updated</dt>"));
  assert(
    page.includes(
      `<time datetime="${loop.published}">${escapeHtml(formatDate(loop.published))}</time>`,
    ),
  );
  assert(
    page.includes(
      `<time datetime="${loop.modified}">${escapeHtml(formatDate(loop.modified))}</time>`,
    ),
  );
  assert(page.includes("Use this when"));
  assert(page.includes("How to run it"));
  assert(page.includes("Why it works"));
  assert(page.includes("Implementation note"));
  assert(!page.includes("<h2>Topics</h2>"));
  assert(page.includes("Related loops"));
  assert(!page.includes("<dt>Type</dt>"));
  assert(page.includes('href="../../learn/">What is a loop?</a>'));
  assert(!page.includes('href="../../#tips"'));
  assert(page.includes('data-copy-root'));
  assert(page.includes('class="share-actions" aria-label="Share this loop"'));
  assert(page.includes('data-copy-social-post'));
  assert(page.includes(`data-post-text="${escapeHtml(postText)}"`));
  assert(page.includes(`data-post-url="${url}"`));
  assert(page.includes(`<span>Share on social</span>`));
  assert(!page.includes("twitter.com/intent/tweet"));
  assert(!page.includes("Share on X"));
  assert(!page.includes(`<span>Copy link</span>`));
  assert(socialPost.length <= 280);
  assert.equal((page.match(/data-here-now-credit/g) || []).length, 2);
  assert.equal((page.match(/https:\/\/here\.now\/r\/signals/g) || []).length, 2);
  assert.equal((page.match(/aria-label="Hosted by here\.now"/g) || []).length, 2);
  assert.equal((page.match(/<small>Hosted by<\/small>/g) || []).length, 2);
  assert.equal((page.match(/<strong>here\.now<\/strong>/g) || []).length, 2);
  assert.equal((page.match(/\.\.\/\.\.\/assets\/here-now-icon\.svg/g) || []).length, 2);
  assert(pageStructuredDataMatch);

  const pageStructuredData = JSON.parse(pageStructuredDataMatch[1]);
  const article = pageStructuredData["@graph"].find(
    (item) => item["@type"] === "Article",
  );
  assert(article);

  const author = article.author;
  const relatedLinkMatches = [
    ...page.matchAll(
      /<a class="related-loop-link" href="\.\.\/([^/]+)\/">\s*([^<]+?)\s*<\/a>/g,
    ),
  ];

  assert.equal(article.url, url);
  assert.equal(article.headline, loop.title);
  assert.equal(article.description, loop.description);
  assert.equal(article.mainEntityOfPage, url);
  assert.equal(article.datePublished, loop.published);
  assert.equal(article.dateModified, loop.modified);
  assert.equal(article.articleSection, loop.categoryLabel);
  assert.deepEqual(article.keywords, loop.keywords);
  assert.equal(article.image.url, imageUrl);
  assert.equal(article.image.width, 1200);
  assert.equal(article.image.height, 630);
  assert.equal(author["@type"], "Person");
  assert.equal(author.name, loop.author.split(" / ")[0]);
  if (loop.author.includes(" / ")) {
    assert.deepEqual(author.affiliation, {
      "@id": `${siteMeta.baseUrl}#organization`,
    });
  } else {
    assert.equal(author.affiliation, undefined);
  }
  assert.deepEqual(article.publisher, {
    "@id": `${siteMeta.baseUrl}#organization`,
  });
  assert.deepEqual(article.isPartOf, {
    "@id": `${siteMeta.baseUrl}#collection`,
  });
  assert.deepEqual(
    relatedLinkMatches.map((match) => match[1]),
    loop.related,
  );
  assert.deepEqual(
    relatedLinkMatches.map((match) => match[2].trim()),
    loop.related.map((relatedSlug) =>
      escapeHtml(loopBySlug.get(relatedSlug).title),
    ),
  );
  if (loop.sourceUrl) {
    assert.equal(article.isBasedOn, loop.sourceUrl);
    assert(
      page.includes(
        `<a class="detail-source-link" href="${escapeHtml(loop.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a>`,
      ),
    );
  } else {
    assert.equal(article.isBasedOn, undefined);
    assert(!page.includes('class="detail-source-link"'));
  }
  assert(sitemap.includes(`<loc>${url}</loc>`));
  assert(sitemap.includes(`<lastmod>${loop.modified}</lastmod>`));
  assert(feed.includes(`<id>${url}</id>`));
}

assert(
  expectedSocialImageNames.every((name) => socialImageNames.includes(name)),
);
assert.equal(socialImages.length, loops.length + 1);
assert.equal(
  new Set(
    socialImages.map((image) =>
      createHash("sha256").update(image).digest("hex"),
    ),
  ).size,
  socialImages.length,
);
for (const image of socialImages) {
  assert.deepEqual(pngSize(image), { width: 1200, height: 630 });
  assert(image.length >= 20_000);
  assert(image.length < 5_000_000);
}

assert(html.includes("Continue until every page loads in under 50 ms."));
assert(html.includes("If no actionable errors are"));
assert(html.includes("Add tests until we have 100% test coverage."));
assert(html.includes("the same crawl and target-query benchmark"));
assert(html.includes("Stop after [N] successful cases in a row."));
assert(html.includes("run the standard benchmarks"));
assert(html.includes("Matthew Berman"));
assert(html.includes("Peter Steinberger"));
assert(html.includes("Hiten Shah"));
assert(html.includes("AgentLed.ai Agent"));
assert(html.includes("Pierson Marks"));
assert(html.includes("Lukas Kucinski"));
assert(html.includes("Istasha"));
assert(html.includes("@victormustar"));
assert(html.includes("Swayam"));
assert(html.includes("Jose C. Munoz"));
assert(html.includes("Anonymous contributor"));
assert(html.includes("0xUmbra"));
assert(html.includes("@Alex_FF"));
assert(html.includes("@inferencegod"));
assert(html.includes("3goblack (@Dis_Trackted)"));
assert(html.includes("Agent Zero"));
for (const removedSlug of [
  "focused-ai-signal-brief",
  "hands-on-tool-evaluation-loop",
  "archive-before-reset-loop",
  "approval-gated-overnight-production-loop",
]) {
  assert(!html.includes(removedSlug));
  assert(!sitemap.includes(removedSlug));
  assert(!feed.includes(removedSlug));
}
assert.equal((html.match(/class="loop-row"/g) || []).length, loops.length);
assert.equal((html.match(/data-copy-root/g) || []).length, loops.length);
assert.equal((html.match(/class="loop-meta"/g) || []).length, loops.length);
assert.equal((html.match(/class="loop-summary"/g) || []).length, loops.length);
assert.equal((html.match(/class="loop-attribution"/g) || []).length, loops.length);
assert(html.includes('class="loop-table"'));
assert(!html.includes('<th scope="col">ID</th>'));
assert(!html.includes('<th scope="col">No.</th>'));
assert(!html.includes('class="cell-number"'));
assert(!html.includes('class="cell-check"'));
assert(!html.includes("Verify / stop"));
assert.equal(
  (html.match(/<span>Copy loop<\/span>/g) || []).length,
  loops.length,
);
assert.equal(
  (html.match(/data-featured="true"/g) || []).length,
  featuredLoops.length,
);
assert.equal(
  (html.match(/class="loop-featured"/g) || []).length,
  featuredLoops.length,
);
assert(!html.includes('class="featured-loops"'));
assert(!html.includes('class="cell-attribution"'));
assert(!html.includes('<th scope="col">Attribution</th>'));
assert(!html.includes('class="loop-diagram"'));
assert(html.includes(`Showing ${loops.length} loops`));
assert(html.includes(`<time datetime="${siteMeta.updated}">`));
assert(
  html.includes(
    `${siteMeta.baseUrl}assets/social/${homeSocialImageName}`,
  ),
);
assert(html.includes(`<meta property="og:image:type" content="${siteMeta.socialImageMimeType}"`));
assert(html.includes('<meta property="og:image:width" content="1200"'));
assert(html.includes('<meta property="og:image:height" content="630"'));
assert(html.includes('<meta name="twitter:card" content="summary_large_image"'));
assert(html.includes('name="twitter:image:alt"'));
assert(!html.includes("Filter by loop type"));
assert.equal((html.match(/data-category-filter=/g) || []).length, categories.length + 1);
assert.equal((html.match(/class="loop-category"/g) || []).length, loops.length);
assert.equal((html.match(/data-category="/g) || []).length, loops.length);
assert(html.includes('aria-label="Filter loops by category"'));
assert(html.includes('data-category-filter="all"'));
assert(
  categories.every(({ slug, label }) =>
    html.includes(`data-category-filter="${slug}"`) && html.includes(`>${label}<`),
  ),
);
assert(!html.includes('data-type='));
assert(!html.includes('class="cell-type"'));
assert(!html.includes("type-badge"));
assert(!html.includes('<th scope="col">Type</th>'));
assert(html.includes("./styles.css?v=20260620-social-copy"));
assert(html.includes("./script.js?v=20260620-social-copy"));
const homepagePostText =
  "Find Loops and create your own - Loop Library";
assert(html.includes('class="share-actions" aria-label="Share Loop Library"'));
assert(html.includes('data-copy-social-post'));
assert(html.includes(`data-post-text="${homepagePostText}"`));
assert(html.includes(`data-post-url="${siteMeta.baseUrl}"`));
assert(html.includes('aria-label="Copy a Loop Library social post"'));
assert(!html.includes("twitter.com/intent/tweet"));
assert(!html.includes("Share on X"));
assert(!html.includes(`<span>Copy link</span>`));
assert(html.includes('href="./learn/"'));
assert(!html.includes('class="loop-guide"'));
assert(!html.includes("A useful loop specifies:"));
assert(!html.includes("Learn how loops work and run one"));
assert(!css.includes(".loop-guide"));
assert(html.includes('id="library-pagination"'));
assert(html.includes('aria-label="Loop pages"'));
assert(html.includes('id="pagination-previous"'));
assert(html.includes('id="pagination-status"'));
assert(html.includes('id="pagination-next"'));
assert(!html.includes('class="answer-capsule"'));
assert(!html.includes("Plain-language definition"));
assert(!html.includes("What is an AI agent loop?"));
assert(html.includes('id="agent-skill"'));
assert(html.includes("Use Loop Library in your coding agent."));
assert(
  html.includes(
    "npx skills add Forward-Future/loop-library --skill loop-library",
  ),
);
assert(
  html.includes(
    "https://github.com/Forward-Future/loop-library",
  ),
);
assert(html.includes("<span>Copy command</span>"));
assert(
  !html.includes(
    "https://github.com/Forward-Future/loop-library/tree/main/skills/loop-library",
  ),
);
assert.equal((html.match(/data-here-now-credit/g) || []).length, 2);
assert.equal((html.match(/https:\/\/here\.now\/r\/signals/g) || []).length, 2);
assert.equal((html.match(/aria-label="Hosted by here\.now"/g) || []).length, 2);
assert.equal((html.match(/<small>Hosted by<\/small>/g) || []).length, 2);
assert.equal((html.match(/<strong>here\.now<\/strong>/g) || []).length, 2);
assert.equal((html.match(/\.\/assets\/here-now-icon\.svg/g) || []).length, 2);
assert.equal((learnHtml.match(/data-here-now-credit/g) || []).length, 2);
assert.equal(
  (learnHtml.match(/href="https:\/\/here\.now\/r\/signals"/g) || []).length,
  2,
);
assert(learnHtml.includes("../styles.css?v=20260619-learn-page"));
assert(learnHtml.includes("../script.js?v=20260619-pagination"));
assert(learnHtml.includes("How agent loops work"));
assert(learnHtml.includes('<meta name="robots" content="index, follow"'));
assert(learnHtml.includes("What makes a loop useful"));
assert(learnHtml.includes("Write the prompt"));
assert(learnHtml.includes("Run it in your coding agent"));
assert(learnHtml.includes("Keep loops safe"));
assert(!learnHtml.includes("trigger-goal-graphic"));
assert(!learnHtml.includes("mini-loop-graphic"));
assert(!learnHtml.includes("<figure"));
assert(!learnHtml.includes("<ol"));
assert(!learnHtml.includes("<ul"));
assert(!learnHtml.includes("<pre"));
assert((learnHtml.match(/<p(?:\s|>)/g) || []).length >= 30);
assert.equal((learnHtml.match(/class="section-icon"/g) || []).length, 4);
assert(learnHtml.includes('id="cursor"'));
assert(learnHtml.includes('id="codex"'));
assert(learnHtml.includes('id="claude-code"'));
assert(learnHtml.includes('id="factory"'));
assert(learnHtml.includes('id="devin"'));
assert(html.includes("Repeatable AI Agent Workflows"));
assert(html.includes('rel="sitemap"'));
assert(html.includes(`href="${siteMeta.baseUrl}catalog.json"`));
assert(html.includes(`href="${siteMeta.baseUrl}catalog.md"`));
assert(html.includes('type="application/ld+json"'));
assert(html.includes('id="theme-toggle"'));
assert(html.includes('document.documentElement.dataset.theme = theme'));
assert(html.includes('"loop-library-theme"'));
assert(html.includes('id="loop-form"'));
assert(html.includes('id="weekly"'));
assert(html.includes('id="weekly-form"'));
assert(html.includes("One useful loop, once a week."));
assert(html.includes("Notify me weekly"));
assert(html.includes('name="loop-library-form-api"'));
assert(html.includes("https://loop-library-forms.mberman84.workers.dev"));
assert(html.includes('id="weekly-turnstile"'));
assert(html.includes('id="loop-turnstile"'));
assert.equal((html.match(/type="submit" disabled/g) || []).length, 2);
assert(!html.includes('class="workflow-help"'));
assert(!html.includes("How to use these loops"));
assert(html.includes("Share a loop"));
assert(html.includes("Submit loop"));
assert(html.includes('name="x_handle"'));
assert(html.includes("X handle <small>optional</small>"));
assert(html.includes('pattern="@?[A-Za-z0-9_]{1,15}"'));
assert(!html.includes("Why it works"));
assert(!html.includes("Loop type"));
assert(!html.includes("Email <small>optional, private</small>"));
assert(html.includes("./.herenow/data/suggestions") === false);
assert(html.includes("./.herenow/data/weekly_signups") === false);
assert(css.includes("--orange: #ff5033"));
assert(css.includes("--charcoal: #101010"));
assert(css.includes(".loop-table"));
assert(css.includes(".detail-stack"));
assert(css.includes(".verification-card"));
assert(css.includes(".detail-more"));
assert(!css.includes(".detail-layout"));
assert(css.includes(".related-loop-link"));
assert(css.includes(".category-filters"));
assert(css.includes(".category-filter.is-active"));
assert(css.includes(".loop-category"));
assert(css.includes(".loop-meta"));
assert(css.includes(".loop-summary"));
assert(!css.includes(".cell-number"));
assert(css.includes(".cell-loop .loop-summary {\n  display: none;\n}"));
assert(css.includes(".loop-prompt-toggle"));
const promptToggleRule = css.match(/\.loop-prompt-toggle \{([^}]*)\}/)?.[1] || "";
assert(!promptToggleRule.includes("text-decoration"));
assert(!css.includes(".loop-prompt-toggle:hover,"));
assert(css.includes("-webkit-line-clamp: 3"));
assert(css.includes("-webkit-line-clamp: 4"));
assert(!css.includes(".cell-check"));
assert(css.includes(".loop-attribution"));
assert(!css.includes(".cell-attribution"));
assert(css.includes(".pagination"));
assert(css.includes(".pagination-button:disabled"));
assert(css.includes("scroll-margin-top: 80px"));
assert(css.includes(".pagination-button,\n  .pagination-status"));
assert(css.includes(".skill-promo"));
assert(css.includes(".library-hero"));
assert(css.includes(".share-actions"));
assert(css.includes(".share-action-primary"));
assert(css.includes(".share-action.is-copied"));
assert(css.includes(".copy-fallback textarea"));
assert(!css.includes(".share-action-x"));
assert(css.includes(".loop-featured"));
assert(!css.includes(".answer-capsule"));
assert(css.includes(".skill-copy-button"));
assert(css.includes("border-left: 5px solid var(--orange)"));
assert(css.includes("background: var(--surface-muted)"));
assert(!css.includes("background: var(--orange);\n  grid-template-columns: minmax(0, 1.2fr)"));
assert(!css.includes(".type-badge"));
assert(!css.includes(".type-goal"));
assert(!css.includes(".type-triggered"));
assert(css.includes(':root[data-theme="dark"]'));
assert(css.includes(".theme-toggle"));
assert(
  css.includes(".search-control:focus-within {\n  color: var(--orange);\n}"),
);
assert(
  css.includes(
    ".search-control input:focus-visible {\n  border-bottom-color: currentColor;\n}",
  ),
);
assert(!css.includes("outline: 2px solid var(--orange)"));
assert(css.includes(".here-now-credit"));
assert(css.includes(".article-guide"));
assert(css.includes(".article-header"));
assert(css.includes(".article-section"));
assert(css.includes(".section-icon"));
assert(!css.includes(".learning-hero"));
assert(!css.includes(".cycle-visual"));
assert(!css.includes(".guide-hero"));
assert(css.includes(".newsletter-section"));
assert(css.includes(".newsletter-form"));
assert(!css.includes(".workflow-help"));
assert(css.includes(".submission-header"));
assert(!css.includes("box-shadow"));
assert(script.includes('postProtectedForm(\n        "/suggestions"'));
assert(script.includes('postProtectedForm(\n        "/weekly-signups"'));
assert(script.includes("https://challenges.cloudflare.com/turnstile/v0/api.js"));
assert(script.includes('appearance: "interaction-only"'));
assert(script.includes("turnstile_token"));
assert(script.includes('optionalValue(formData, "x_handle")'));
assert(script.includes("payload.x_handle = xHandle"));
assert(script.includes("bytes[6] = (bytes[6] & 0x0f) | 0x40"));
assert(script.includes("bytes[8] = (bytes[8] & 0x3f) | 0x80"));
assert(!script.includes("./.herenow/data/"));
assert(script.includes('document.querySelectorAll(".loop-row")'));
assert(!script.includes('querySelector(".cell-number")'));
assert(script.includes('querySelector(".loop-title-link")'));
assert(script.includes('b.dataset.featured === "true"'));
assert(script.includes('a.dataset.featured === "true"'));
assert(script.includes("loopRows.forEach((row) => loopTableBody.append(row))"));
assert(script.includes("const PAGE_SIZE = 25"));
assert(script.includes("const defaultLabel = label?.textContent"));
assert(script.includes("window.clearTimeout(copyLabelResetTimer)"));
assert(script.includes("label.textContent = defaultLabel"));
assert(script.includes('button.textContent = "Show more"'));
assert(script.includes('button.textContent = nextExpanded ? "Show less" : "Show more"'));
assert(script.includes('button.setAttribute("aria-controls", prompt.id)'));
assert(script.includes('button.setAttribute("aria-expanded", "false")'));
assert(script.includes("window.requestAnimationFrame(syncVisiblePromptToggles)"));
assert(script.includes("Math.ceil(totalMatches / PAGE_SIZE)"));
assert(script.includes("matchingRows.slice(pageStart, pageEnd)"));
assert(script.includes('searchInput.addEventListener("input", resetSearchPage)'));
assert(script.includes('searchInput.addEventListener("search", resetSearchPage)'));
assert(script.includes('document.querySelectorAll("[data-category-filter]")'));
assert(script.includes('let activeCategory = "all"'));
assert(script.includes("let currentPage = 1"));
assert(script.includes('row.dataset.category === activeCategory'));
assert(script.includes('paginationPrevious.addEventListener("click"'));
assert(script.includes('paginationNext.addEventListener("click"'));
assert(script.includes("pagination.hidden = totalPages <= 1"));
assert(script.includes("function focusFirstVisibleLoop()"));
assert(script.includes("firstVisibleTitle.focus({ preventScroll: true })"));
assert(
  script.includes(
    'firstVisibleTitle.scrollIntoView({ behavior: "instant", block: "start" })',
  ),
);
assert(script.includes('candidate.setAttribute("aria-pressed", String(isActive))'));
assert(script.includes('themeToggle.addEventListener("click"'));
assert(script.includes("window.localStorage.setItem(THEME_STORAGE_KEY, theme)"));
assert(script.includes('button.closest("[data-copy-root]")'));
assert(script.includes('document.querySelectorAll("[data-copy-social-post]")'));
assert(script.includes('const socialPost = `${postText}\\n\\n${postUrl}`'));
assert(script.includes("showCopyFallback(button, socialPost)"));
assert(script.includes('textArea.value = text'));
assert(script.includes('textArea.setAttribute("readonly", "")'));
assert(script.includes('showToast("Social post copied to clipboard.")'));
assert(script.includes('label.textContent = "Copied!"'));
assert(script.includes('document.querySelector("[data-copy-skill-command]")'));
assert(script.includes("Install command copied to clipboard."));
assert(script.includes('label.textContent = "Copy command"'));
assert(!script.includes("innerHTML"));
assert(
  workerSource.includes(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  ),
);
assert(workerSource.includes("result.action !== expectedAction"));
assert(workerSource.includes("TURNSTILE_HOSTNAMES"));
assert(workerSource.includes('request.headers.get("CF-Connecting-IP")'));
assert(workerSource.includes("hourlyLimit: 3"));
assert(workerSource.includes("dailyLimit: 10"));
assert(workerSource.includes("idempotency_conflict"));
assert(workerSource.includes("`idempotency:${idempotencyKey}`"));
assert(workerSource.includes("requestHash: body.requestHash"));
assert(workerSource.includes("reserveFingerprint"));
assert(workerSource.includes("Authorization: `Bearer ${env.HERENOW_API_KEY}`"));
assert(workerSource.includes("export class FormGuard"));
assert(workerSource.includes("async alarm()"));
assert(workerSource.includes("TURNSTILE_RATE_LIMITER.limit"));
assert.equal(workerPackage.devDependencies.wrangler, "4.103.0");
assert.equal(workerPackage.scripts.deploy, "wrangler deploy");
assert.equal(workerPackage.scripts.dev, "wrangler dev");
assert.equal(wranglerConfig.name, "loop-library-forms");
assert.equal(wranglerConfig.workers_dev, true);
assert.equal(wranglerConfig.routes, undefined);
assert.deepEqual(wranglerConfig.ratelimits, [
  {
    name: "TURNSTILE_RATE_LIMITER",
    namespace_id: "31573134555896",
    simple: { limit: 30, period: 60 },
  },
]);
assert.equal(
  wranglerConfig.durable_objects.bindings[0].class_name,
  "FormGuard",
);
assert(sitemap.includes(`<loc>${siteMeta.baseUrl}</loc>`));
assert(sitemap.includes(`<loc>${siteMeta.baseUrl}learn/</loc>`));
assert(feed.includes(`<id>${siteMeta.baseUrl}</id>`));
assert(hereNowIcon.includes('<rect width="128" height="128" fill="#ffffff"/>'));
assert(hereNowIcon.includes('<circle cx="64" cy="64" r="26" fill="#000000"/>'));

assert.equal(suggestions.access.read, "owner");
assert.equal(suggestions.access.insert, "owner");
assert.equal(suggestions.access.update, "owner");
assert.equal(suggestions.access.delete, "owner");
assert.equal(suggestions.rateLimit, "3/hour/ip");
assert.equal(suggestions.fields.name.required, undefined);
assert.equal(suggestions.fields.x_handle.type, "string");
assert.equal(suggestions.fields.x_handle.required, undefined);
assert.equal(suggestions.fields.x_handle.maxLength, 16);
assert.equal(suggestions.fields.loop_type, undefined);
assert(suggestions.fields.instructions.maxLength <= 3000);
assert(suggestions.fields.email.maxLength <= 160);
assert(suggestions.fields.source_url.maxLength <= 300);
assert.equal(suggestions.fields.review_status.type, "string");
assert(suggestions.fields.review_status.maxLength <= 24);
assert.equal(suggestions.fields.review_note.type, "string");
assert(suggestions.fields.review_note.maxLength <= 500);
assert.equal(suggestions.fields.published_slug.type, "string");
assert(suggestions.fields.published_slug.maxLength <= 120);
assert.equal(suggestions.fields.published_at.type, "datetime");
assert.equal(weeklySignups.access.read, "owner");
assert.equal(weeklySignups.access.insert, "owner");
assert.equal(weeklySignups.access.update, "owner");
assert.equal(weeklySignups.access.delete, "owner");
assert.equal(weeklySignups.rateLimit, "5/hour/ip");
assert.equal(weeklySignups.fields.email.type, "email");
assert.equal(weeklySignups.fields.email.required, true);
assert(weeklySignups.fields.email.maxLength <= 160);

console.log("Loop Library checks passed.");
