import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  categories,
  getLoopCategory,
  loops,
  site as siteMeta,
} from "./loop-data.mjs";
import { renderSkillCatalog } from "./build-skill-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(root, "site");
const workerRoot = path.join(root, "worker");
const skillRoot = path.join(root, "skills", "loop-library");

const [
  html,
  css,
  script,
  dataSource,
  workerSource,
  wranglerSource,
  sitemap,
  feed,
  hereNowIcon,
  loopDirectories,
  loopPages,
  skillSource,
  skillCatalog,
  skillInterface,
] =
  await Promise.all([
    readFile(path.join(siteRoot, "index.html"), "utf8"),
    readFile(path.join(siteRoot, "styles.css"), "utf8"),
    readFile(path.join(siteRoot, "script.js"), "utf8"),
    readFile(path.join(siteRoot, ".herenow", "data.json"), "utf8"),
    readFile(path.join(workerRoot, "src", "index.js"), "utf8"),
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
    readFile(path.join(skillRoot, "agents", "openai.yaml"), "utf8"),
  ]);

const dataManifest = JSON.parse(dataSource);
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

function pngSize(buffer) {
  assert(buffer.subarray(0, pngSignature.length).equals(pngSignature));
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

assert(structuredDataMatch);
const structuredData = JSON.parse(structuredDataMatch[1]);
const collection = structuredData["@graph"].find(
  (item) => item["@type"] === "CollectionPage",
);
const slugs = new Set(loops.map((loop) => loop.slug));
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
];

assert.equal(collection.mainEntity.numberOfItems, loops.length);
assert.equal(collection.mainEntity.itemListElement.length, loops.length);
assert.equal(loops.length, 26);
assert.equal(slugs.size, loops.length);
assert.equal(titles.size, loops.length);
assert.equal(prompts.size, loops.length);
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
assert.deepEqual(loopDirectories.sort(), [...slugs].sort());
assert.equal(skillCatalog, renderSkillCatalog());
assert(skillSource.startsWith("---\nname: loop-library\ndescription:"));
assert(skillSource.includes("reuse a published Loop Library loop"));
assert(!skillSource.includes("published Forward Future loop"));
assert(skillSource.includes("## Run the design interview"));
assert(skillSource.includes("Assume the user is new to loops."));
assert(skillSource.includes("What would you like the agent to get done?"));
assert(!skillSource.includes("What observable result should the loop produce"));
assert(skillSource.includes("## Deliver the loop"));
assert(skillInterface.includes('display_name: "Loop Library"'));
assert(skillInterface.includes("$loop-library"));

for (const [index, loop] of loops.entries()) {
  const url = `${siteMeta.baseUrl}loops/${loop.slug}/`;
  const imageUrl = `${siteMeta.baseUrl}assets/social/${loop.slug}-${siteMeta.socialImageVersion}.${siteMeta.socialImageExtension}`;
  const imageAlt = `${loop.title} — Forward Future Loop Library`;
  const page = loopPages[index];
  const listItem = collection.mainEntity.itemListElement[index];
  const homepageHref = `href="./loops/${loop.slug}/"`;
  const homepageHrefIndex = html.indexOf(homepageHref);
  const rowStart = html.lastIndexOf("<tr", homepageHrefIndex);
  const rowEnd = html.indexOf("</tr>", homepageHrefIndex);
  const homepageRow = html.slice(rowStart, rowEnd);
  const normalizedHomepageRow = homepageRow.replace(/\s+/g, " ");
  const category = getLoopCategory(loop);
  const pageStructuredDataMatch = page.match(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
  );

  assert(homepageHrefIndex >= 0);
  assert(rowStart >= 0);
  assert(rowEnd > homepageHrefIndex);
  assert.equal(listItem.position, index + 1);
  assert.equal(listItem.name, loop.title);
  assert.equal(listItem.url, url);
  assert(loop.related.every((relatedSlug) => slugs.has(relatedSlug)));
  assert(html.includes(loop.title));
  assert(normalizedHomepageRow.includes(loop.prompt));
  assert(homepageRow.includes(`<td class="cell-number">${loop.number}</td>`));
  assert(homepageRow.includes(`data-category="${category.slug}"`));
  assert(
    homepageRow.includes(
      `<span class="loop-category">${category.label}</span>`,
    ),
  );
  assert(homepageRow.includes(loop.author));
  assert(html.includes(homepageHref));
  assert(page.includes(`<title>${escapeHtml(loop.seoTitle)}</title>`));
  assert(page.includes(`<link rel="canonical" href="${url}"`));
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
  assert(page.includes("Use this when"));
  assert(page.includes("How to run it"));
  assert(page.includes("Why it works"));
  assert(page.includes("Implementation note"));
  assert(!page.includes("<h2>Topics</h2>"));
  assert(page.includes("Related loops"));
  assert(!page.includes("<dt>Type</dt>"));
  assert(page.includes('data-copy-root'));
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

  assert.equal(article.url, url);
  assert.equal(article.headline, loop.title);
  assert.equal(article.dateModified, loop.modified);
  assert.equal(article.image.url, imageUrl);
  assert.equal(article.image.width, 1200);
  assert.equal(article.image.height, 630);
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
assert(html.includes('class="loop-table"'));
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
assert(html.includes("./styles.css?v=20260619-skill-promo"));
assert(html.includes("./script.js?v=20260619-skill-promo"));
assert(html.includes('id="agent-skill"'));
assert(html.includes("Bring the Loop Library into your coding agent."));
assert(
  html.includes(
    "npx skills add mberman84/loop-library --skill loop-library",
  ),
);
assert(
  html.includes(
    "https://github.com/mberman84/loop-library/tree/main/skills/loop-library",
  ),
);
assert.equal((html.match(/data-here-now-credit/g) || []).length, 2);
assert.equal((html.match(/https:\/\/here\.now\/r\/signals/g) || []).length, 2);
assert.equal((html.match(/aria-label="Hosted by here\.now"/g) || []).length, 2);
assert.equal((html.match(/<small>Hosted by<\/small>/g) || []).length, 2);
assert.equal((html.match(/<strong>here\.now<\/strong>/g) || []).length, 2);
assert.equal((html.match(/\.\/assets\/here-now-icon\.svg/g) || []).length, 2);
assert(html.includes("Repeatable AI Agent Workflows"));
assert(html.includes('rel="sitemap"'));
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
assert(css.includes(".skill-promo"));
assert(css.includes(".skill-copy-button"));
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
assert(script.includes('searchInput.addEventListener("input", updateLibrary)'));
assert(script.includes('searchInput.addEventListener("search", updateLibrary)'));
assert(script.includes('document.querySelectorAll("[data-category-filter]")'));
assert(script.includes('let activeCategory = "all"'));
assert(script.includes('row.dataset.category === activeCategory'));
assert(script.includes('candidate.setAttribute("aria-pressed", String(isActive))'));
assert(script.includes('themeToggle.addEventListener("click"'));
assert(script.includes("window.localStorage.setItem(THEME_STORAGE_KEY, theme)"));
assert(script.includes('button.closest("[data-copy-root]")'));
assert(script.includes('document.querySelector("[data-copy-skill-command]")'));
assert(script.includes("Install command copied to clipboard."));
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
assert.equal(wranglerConfig.name, "loop-library-forms");
assert.equal(wranglerConfig.workers_dev, true);
assert.equal(wranglerConfig.routes, undefined);
assert.equal(
  wranglerConfig.durable_objects.bindings[0].class_name,
  "FormGuard",
);
assert(sitemap.includes(`<loc>${siteMeta.baseUrl}</loc>`));
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
