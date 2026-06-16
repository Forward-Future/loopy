import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { loops, site as siteMeta } from "./loop-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(root, "site");

const [
  html,
  css,
  script,
  dataSource,
  sitemap,
  feed,
  hereNowIcon,
  loopDirectories,
  loopPages,
] =
  await Promise.all([
    readFile(path.join(siteRoot, "index.html"), "utf8"),
    readFile(path.join(siteRoot, "styles.css"), "utf8"),
    readFile(path.join(siteRoot, "script.js"), "utf8"),
    readFile(path.join(siteRoot, ".herenow", "data.json"), "utf8"),
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
]);

const dataManifest = JSON.parse(dataSource);
const suggestions = dataManifest.collections?.suggestions;
const structuredDataMatch = html.match(
  /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

assert(structuredDataMatch);
const structuredData = JSON.parse(structuredDataMatch[1]);
const collection = structuredData["@graph"].find(
  (item) => item["@type"] === "CollectionPage",
);
const slugs = new Set(loops.map((loop) => loop.slug));
const titles = new Set(loops.map((loop) => loop.title));
const prompts = new Set(loops.map((loop) => loop.prompt));
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
];

assert.equal(collection.mainEntity.numberOfItems, loops.length);
assert.equal(collection.mainEntity.itemListElement.length, loops.length);
assert.equal(loops.length, 15);
assert.equal(slugs.size, loops.length);
assert.equal(titles.size, loops.length);
assert.equal(prompts.size, loops.length);
assert.equal(new Set(loops.map((loop) => loop.number)).size, loops.length);
assert.equal(new Set(loops.map((loop) => loop.seoTitle)).size, loops.length);
assert(loops.every((loop) => ["goal", "scheduled", "triggered"].includes(loop.typeSlug)));
assert(requestedConceptSlugs.every((slug) => slugs.has(slug)));
assert.deepEqual(loopDirectories.sort(), [...slugs].sort());

for (const [index, loop] of loops.entries()) {
  const url = `${siteMeta.baseUrl}loops/${loop.slug}/`;
  const page = loopPages[index];
  const listItem = collection.mainEntity.itemListElement[index];
  const homepageHref = `href="./loops/${loop.slug}/"`;
  const homepageHrefIndex = html.indexOf(homepageHref);
  const rowStart = html.lastIndexOf("<tr", homepageHrefIndex);
  const rowEnd = html.indexOf("</tr>", homepageHrefIndex);
  const homepageRow = html.slice(rowStart, rowEnd);
  const normalizedHomepageRow = homepageRow.replace(/\s+/g, " ");
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
  assert(homepageRow.includes(`data-type="${loop.typeSlug}"`));
  assert(homepageRow.includes(`<td class="cell-number">${loop.number}</td>`));
  assert(homepageRow.includes(loop.author));
  assert(html.includes(homepageHref));
  assert(page.includes(`<title>${loop.seoTitle}</title>`));
  assert(page.includes(`<link rel="canonical" href="${url}"`));
  assert(page.includes(loop.description));
  assert(page.includes(escapeHtml(loop.prompt)));
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
  assert(sitemap.includes(`<loc>${url}</loc>`));
  assert(sitemap.includes(`<lastmod>${loop.modified}</lastmod>`));
  assert(feed.includes(`<id>${url}</id>`));
}

assert(html.includes("Continue until every page loads in under 50 ms."));
assert(html.includes("If no actionable errors are"));
assert(html.includes("Add tests until we have 100% test coverage."));
assert(html.includes("the same crawl and target-query benchmark"));
assert(html.includes("Stop after [N] successful cases in a row."));
assert(html.includes("run the standard benchmarks"));
assert(html.includes("Matthew Berman"));
assert(html.includes("Peter Steinberger"));
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
assert(html.includes('data-filter="triggered"'));
assert(html.includes("./styles.css?v=20260616-loop-batch"));
assert(html.includes("./script.js?v=20260615-here-now"));
assert.equal((html.match(/data-here-now-credit/g) || []).length, 2);
assert.equal((html.match(/https:\/\/here\.now\/r\/signals/g) || []).length, 2);
assert.equal((html.match(/aria-label="Hosted by here\.now"/g) || []).length, 2);
assert.equal((html.match(/<small>Hosted by<\/small>/g) || []).length, 2);
assert.equal((html.match(/<strong>here\.now<\/strong>/g) || []).length, 2);
assert.equal((html.match(/\.\/assets\/here-now-icon\.svg/g) || []).length, 2);
assert(html.includes("Repeatable AI Agent Workflows"));
assert(html.includes('rel="sitemap"'));
assert(html.includes('type="application/ld+json"'));
assert(html.includes('class="about-library"'));
assert(html.includes('id="theme-toggle"'));
assert(html.includes('document.documentElement.dataset.theme = theme'));
assert(html.includes('"loop-library-theme"'));
assert(html.includes('href="#tips"'));
assert(html.includes('id="tips"'));
assert(html.includes("Tips &amp; best practices"));
assert(html.includes("tmp/&lt;file&gt;"));
assert(html.includes("Temporary workspace only. Never store secrets."));
assert(html.includes('class="practice-table"'));
assert(html.includes('id="loop-form"'));
assert(html.includes('id="setup"'));
assert(html.includes("Set up a loop"));
assert(html.includes("Open <strong>Automations</strong>"));
assert(html.includes(".cursor/skills/&lt;name&gt;/SKILL.md"));
assert(html.includes("/goal &lt;completion condition&gt;"));
assert(html.includes("/loop 30m &lt;prompt&gt;"));
assert(html.includes("./.herenow/data/suggestions") === false);
assert(css.includes("--orange: #ff5033"));
assert(css.includes("--charcoal: #101010"));
assert(css.includes(".tips-section"));
assert(css.includes(".loop-table"));
assert(css.includes(".setup-grid"));
assert(css.includes(".detail-layout"));
assert(css.includes(".related-loop-link"));
assert(css.includes(".about-library"));
assert(css.includes(".type-triggered::before"));
assert(css.includes(':root[data-theme="dark"]'));
assert(css.includes(".theme-toggle"));
assert(css.includes(".here-now-credit"));
assert(!css.includes("box-shadow"));
assert(script.includes('fetch("./.herenow/data/suggestions"'));
assert(script.includes('document.querySelectorAll(".loop-row")'));
assert(script.includes('searchInput.addEventListener("input", updateLibrary)'));
assert(script.includes('searchInput.addEventListener("search", updateLibrary)'));
assert(script.includes('themeToggle.addEventListener("click"'));
assert(script.includes("window.localStorage.setItem(THEME_STORAGE_KEY, theme)"));
assert(script.includes('button.closest("[data-copy-root]")'));
assert(!script.includes("innerHTML"));
assert(sitemap.includes(`<loc>${siteMeta.baseUrl}</loc>`));
assert(feed.includes(`<id>${siteMeta.baseUrl}</id>`));
assert(hereNowIcon.includes('<rect width="128" height="128" fill="#ffffff"/>'));
assert(hereNowIcon.includes('<circle cx="64" cy="64" r="26" fill="#000000"/>'));

assert.equal(suggestions.access.read, "owner");
assert.equal(suggestions.access.insert, "public");
assert.equal(suggestions.access.update, "owner");
assert.equal(suggestions.access.delete, "owner");
assert.equal(suggestions.rateLimit, "3/hour/ip");
assert(suggestions.fields.instructions.maxLength <= 3000);
assert(suggestions.fields.email.maxLength <= 160);
assert(suggestions.fields.source_url.maxLength <= 300);

console.log("Loop Library checks passed.");
