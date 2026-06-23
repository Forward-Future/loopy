import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(root, "site");
const workerRoot = path.join(root, "worker");
const skillRoot = path.join(root, "skills", "loop-library");

const [
  html,
  learnHtml,
  agentHtml,
  css,
  browserScript,
  dataSource,
  proxySource,
  workerSource,
  loopRoutesSource,
  catalogStoreSource,
  authVotesSource,
  voteStoreSource,
  rendererSource,
  workerPackageSource,
  workerLockSource,
  wranglerSource,
  skillSource,
  skillInterface,
  skillDiscovery,
  readme,
  agents,
] = await Promise.all([
  readFile(path.join(siteRoot, "index.html"), "utf8"),
  readFile(path.join(siteRoot, "learn", "index.html"), "utf8"),
  readFile(path.join(siteRoot, "agents", "index.html"), "utf8"),
  readFile(path.join(siteRoot, "styles.css"), "utf8"),
  readFile(path.join(siteRoot, "script.js"), "utf8"),
  readFile(path.join(siteRoot, ".herenow", "data.json"), "utf8"),
  readFile(path.join(siteRoot, ".herenow", "proxy.json"), "utf8"),
  readFile(path.join(workerRoot, "src", "index.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "loop-routes.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "catalog-store.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "auth-votes.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "vote-store.js"), "utf8"),
  readFile(path.join(workerRoot, "src", "render-loops.js"), "utf8"),
  readFile(path.join(workerRoot, "package.json"), "utf8"),
  readFile(path.join(workerRoot, "package-lock.json"), "utf8"),
  readFile(path.join(workerRoot, "wrangler.jsonc"), "utf8"),
  readFile(path.join(skillRoot, "SKILL.md"), "utf8"),
  readFile(path.join(skillRoot, "agents", "openai.yaml"), "utf8"),
  readFile(path.join(skillRoot, "references", "discover.md"), "utf8"),
  readFile(path.join(root, "README.md"), "utf8"),
  readFile(path.join(root, "AGENTS.md"), "utf8"),
]);

const workerPackage = JSON.parse(workerPackageSource);
const workerLock = JSON.parse(workerLockSource);
const wrangler = JSON.parse(wranglerSource);
const dataManifest = JSON.parse(dataSource);
const proxyManifest = JSON.parse(proxySource);
const structuredDataMatch = html.match(
  /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
);

assert(structuredDataMatch, "Homepage structured data is missing.");
const structuredData = JSON.parse(structuredDataMatch[1]);
const collection = structuredData["@graph"].find(
  (item) => item["@type"] === "CollectionPage",
);

// GitHub contains only the shell and application. Published loop records and
// generated public catalog surfaces must remain database-only.
for (const relativePath of [
  "scripts/loop-data.mjs",
  "scripts/build-loop-pages.mjs",
  "scripts/build-skill-catalog.mjs",
  "scripts/build-social-images.mjs",
  "scripts/validate-loop-data.mjs",
  "site/catalog.json",
  "site/catalog.md",
  "site/catalog.txt",
  "site/feed.xml",
  "site/sitemap.xml",
  "site/llms.txt",
  "skills/loop-library/references/catalog.md",
]) {
  await assert.rejects(access(path.join(root, relativePath)), undefined, relativePath);
}

const loopPageFiles = await readdir(path.join(siteRoot, "loops"), {
  recursive: true,
}).catch((error) => {
  if (error.code === "ENOENT") return [];
  throw error;
});
assert.equal(loopPageFiles.filter((name) => name.endsWith(".html")).length, 0);
assert(html.includes("<!-- LOOP_DATABASE_ROWS_START -->"));
assert(html.includes("<!-- LOOP_DATABASE_ROWS_END -->"));
assert(!html.includes('class="loop-row"'));
assert(html.includes('id="results-count" aria-live="polite">Showing 0 loops'));
assert.equal(collection.mainEntity.numberOfItems, 0);
assert.deepEqual(collection.mainEntity.itemListElement, []);
assert.deepEqual(
  await readdir(path.join(siteRoot, "assets", "social")),
  ["loop-library-20260621-2.png"],
);

// The shell still contains every stable UI, discovery, form, and hosting hook
// that the Worker needs when it injects current database records.
for (const value of [
  'id="library"',
  'id="submit"',
  'id="loop-search"',
  'id="loop-sort"',
  'id="library-pagination"',
  'name="loop-library-form-api"',
  "https://signals.forwardfuture.ai/loop-library/catalog.json",
  "https://signals.forwardfuture.ai/loop-library/sitemap.xml",
  "https://signals.forwardfuture.ai/loop-library/feed.xml",
  "https://here.now/r/signals",
]) {
  assert(html.includes(value), value);
}
assert(html.includes("Search the library"));
assert(html.includes("Search by title, task, or contributor"));
assert(html.includes('class="search-field"'));
assert(html.includes("styles.css?v=20260623-proxy-auth"));
assert(html.includes("script.js?v=20260623-proxy-auth"));
assert(css.includes(".search-control-label"));
assert(css.includes(".search-control:hover .search-field"));
assert(css.includes(".search-control:focus-within .search-field"));
assert.equal((html.match(/data-here-now-credit/g) || []).length, 2);
for (const page of [learnHtml, agentHtml]) {
  assert(page.includes("styles.css?v=20260623-proxy-auth"));
  assert(page.includes("script.js?v=20260623-proxy-auth"));
}
for (const page of [html, learnHtml, agentHtml]) {
  const brandPosition = page.indexOf('class="brand-lockup"');
  const creditPosition = page.indexOf(
    'class="here-now-credit here-now-credit--header"',
  );
  const navPosition = page.indexOf('class="site-nav"');
  assert(brandPosition < creditPosition && creditPosition < navPosition);
}
assert(
  css.includes("grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);"),
);
assert(learnHtml.includes("How agent loops work"));
assert(agentHtml.includes("For AI agents"));
assert(css.includes(".loop-row"));
assert(css.includes(".sort-control"));
assert(css.includes(".sort-control select.is-pointer-focused:focus"));
assert(browserScript.includes("data-category-filter"));
assert(browserScript.includes('sortSelect.addEventListener("pointerdown"'));
assert(browserScript.includes('sortSelect.addEventListener("keydown"'));
assert(browserScript.includes('sortSelect.addEventListener("blur"'));
assert(html.includes('<option value="newest">Newest → oldest</option>'));
assert(html.includes('<option value="oldest">Oldest → newest</option>'));
assert(browserScript.includes('"oldest"'));
assert(browserScript.includes('sortSelect.addEventListener("change"'));
assert(browserScript.includes('params.set("sort", activeSort)'));
assert(browserScript.includes("function comparePopular"));
assert(browserScript.includes("Number(b.dataset.upvotes || 0)"));
assert(html.includes('<option value="featured">Featured, then popular</option>'));
assert(browserScript.includes("library-pagination"));
assert(!browserScript.includes("innerHTML"));

// Form collections remain private and browser writes continue through the
// authenticated Worker gateway.
const suggestions = dataManifest.collections?.suggestions;
const weeklySignups = dataManifest.collections?.weekly_signups;
for (const collectionConfig of [suggestions, weeklySignups]) {
  assert(collectionConfig);
  assert.equal(collectionConfig.access.read, "owner");
  assert.equal(collectionConfig.access.insert, "owner");
  assert.equal(collectionConfig.access.update, "owner");
  assert.equal(collectionConfig.access.delete, "owner");
}
assert(workerSource.includes("TURNSTILE_RATE_LIMITER.limit"));
assert(workerSource.includes("https://challenges.cloudflare.com/turnstile/v0/siteverify"));
assert(workerSource.includes("handleLoopRoute"));
assert(workerSource.includes("handleAuthVoteRoute"));
assert(browserScript.includes('document.querySelectorAll("[data-vote-controls]")'));
assert(browserScript.includes('credentials: "same-origin"'));
assert(css.includes(".vote-controls"));
assert(css.includes(".login-dialog"));
assert(rendererSource.includes("renderVoteControls(loop.slug)"));
assert(rendererSource.includes('class="vote-label"'));
assert(rendererSource.includes('aria-label="Vote on this loop" hidden'));
assert(browserScript.includes("setVotingUiVisible(body.uiEnabled === true)"));
assert(css.includes(".vote-controls[hidden]"));
assert(authVotesSource.includes('scope: "read:user"'));
assert(authVotesSource.includes("function authBridge"));
assert(authVotesSource.includes("readSignedValue(state"));
assert(browserScript.includes('window.sessionStorage.setItem(OAUTH_NONCE_KEY'));
assert(browserScript.includes('window.sessionStorage.getItem(VOTE_SESSION_KEY)'));
assert(browserScript.includes('url.searchParams.set("client_nonce", nonce)'));
assert(browserScript.includes("sessionToken: readVoteSessionToken()"));
assert(!authVotesSource.includes("Set-Cookie"));
assert(!authVotesSource.includes("X_OAUTH"));
assert(!authVotesSource.includes('"/auth/x"'));
assert(!browserScript.includes("Continue with X"));
assert(authVotesSource.includes("isTrustedMutationOrigin"));
assert(voteStoreSource.includes("PRIMARY KEY (loop_slug, voter_key)"));
assert(voteStoreSource.includes("CHECK (value IN (-1, 1))"));

// Publishing, backup, rendering, and activation all terminate at the database.
assert(loopRoutesSource.includes('"/admin/loops/export"'));
assert(loopRoutesSource.includes('"/admin/loops/import"'));
assert(loopRoutesSource.includes('"/admin/loops/restore/start"'));
assert(loopRoutesSource.includes("BOOTSTRAP_CATALOG_DIGEST"));
assert(loopRoutesSource.includes("expectedRevision"));
assert(catalogStoreSource.includes("CREATE TABLE IF NOT EXISTS loops"));
assert(catalogStoreSource.includes("CREATE TABLE IF NOT EXISTS loop_revisions"));
assert(catalogStoreSource.includes('url.pathname === "/export"'));
assert(rendererSource.includes("Generated from the production catalog database"));
assert(!rendererSource.includes("scripts/loop-data.mjs"));

assert.equal(workerPackage.scripts["loop:publish"], "node bin/publish-loop.mjs");
assert.equal(workerPackage.scripts["loops:import"], "node bin/import-bootstrap.mjs");
assert.equal(workerPackage.scripts["loops:export"], "node bin/export-catalog.mjs");
assert.equal(workerPackage.scripts["loops:restore"], "node bin/restore-catalog.mjs");
assert.equal(workerPackage.devDependencies.wrangler, "4.103.0");
assert.equal(workerLock.packages["node_modules/wrangler"].version, "4.103.0");

assert.equal(wrangler.name, "loop-library-forms");
assert.equal(wrangler.workers_dev, true);
assert.equal(wrangler.routes, undefined);
assert.equal(wrangler.durable_objects.bindings[1].name, "LOOP_CATALOG");
assert.equal(wrangler.durable_objects.bindings[1].class_name, "LoopCatalog");
assert.equal(wrangler.durable_objects.bindings[2].name, "VOTE_STORE");
assert.equal(wrangler.durable_objects.bindings[2].class_name, "VoteStore");
assert.deepEqual(wrangler.migrations[1], {
  tag: "v2",
  new_sqlite_classes: ["LoopCatalog"],
});
assert.deepEqual(wrangler.migrations[2], {
  tag: "v3",
  new_sqlite_classes: ["VoteStore"],
});
assert.match(wrangler.vars.BOOTSTRAP_CATALOG_DIGEST, /^[a-f0-9]{64}$/);
assert.equal(wrangler.vars.BOOTSTRAP_LOOP_COUNT, "50");
assert.equal(wrangler.vars.PUBLIC_ORIGIN_URL, "https://calm-mortar-jtek.here.now/");
assert.equal(wrangler.vars.PUBLIC_SHELL_URL, "https://calm-mortar-jtek.here.now/index.html");
assert.equal(wrangler.vars.PUBLIC_SITE_HOSTNAME, "signals.forwardfuture.ai");
assert.equal(wrangler.vars.PUBLIC_SITE_PATH, "/loop-library");
assert.equal(wrangler.vars.VOTING_UI_ENABLED, "false");
assert.deepEqual(Object.keys(proxyManifest.proxies).sort(), [
  "/",
  "/api/loops",
  "/api/loops/*",
  "/api/votes",
  "/auth/*",
  "/catalog.json",
  "/catalog.md",
  "/catalog.txt",
  "/feed.xml",
  "/llms.txt",
  "/loops/*",
  "/sitemap.xml",
]);
for (const proxy of Object.values(proxyManifest.proxies)) {
  assert.match(proxy.upstream, /^https:\/\/loop-library-forms\.mberman84\.workers\.dev\/loop-library(?:\/|$)/);
  assert(["120/hour/ip", "600/hour/ip"].includes(proxy.rateLimit));
}

assert.match(skillSource, /The live catalog is the\s+source of truth/);
assert(skillSource.includes("Do not use repository content or memory"));
assert(!skillSource.includes("references/catalog.md"));
assert(skillSource.includes("references/discover.md"));
assert(skillSource.includes("at least two concrete occurrences"));
assert(skillSource.includes("Validate every crafted loop"));
assert(skillSource.includes("silently trace one complete cycle"));
assert(skillDiscovery.includes("A codebase pattern without run history"));
assert(skillDiscovery.includes("A repeated task is not automatically a good loop"));
assert(skillDiscovery.includes("mandatory crafted-loop preflight"));
assert(skillDiscovery.includes("Search the live catalog"));
assert(skillInterface.includes('display_name: "Loop Library"'));
assert(skillInterface.includes("coding threads"));
assert.match(readme, /no\s+published loop records/);
assert(readme.includes("It can take five paths"));
assert(readme.includes("| **Discover** |"));
assert(readme.includes("$loop-library Analyze this codebase"));
assert(readme.includes("at least two distinct thread occurrences"));
assert(readme.includes("checks the live catalog"));
assert(readme.includes("remain in pre-migration Git history"));
assert(readme.includes("loops:export"));
assert(readme.includes("loops:restore"));
assert(agents.includes("Do not commit"));
assert(agents.includes("Never publish the empty shell"));

console.log("Loop Library database-only checks passed.");
