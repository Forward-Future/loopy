import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  assertActivationCatalog,
  assertCatalogIntegrity,
} from "../src/catalog-store.js";
import { handleRequest } from "../src/index.js";

const WORKER_ORIGIN = "https://loop-library-forms.mberman84.workers.dev";
const SITE_ORIGIN = "https://signals.forwardfuture.com";

class MemoryLoopCatalogNamespace {
  loops = new Map();
  revisions = new Map();
  restore = null;

  constructor(active = true, options = {}) {
    this.active = active;
    this.validateWrites = options.validateWrites === true;

    for (const loop of options.seedLoops || []) {
      this.loops.set(loop.slug, { ...loop });
    }
  }

  idFromName(name) {
    return name;
  }

  get() {
    return {
      fetch: async (input, init = {}) => {
        const url = new URL(input);

        if (init.method === "PUT" && url.pathname.startsWith("/loops/")) {
          const body = JSON.parse(init.body);
          const created = !this.loops.has(body.loop.slug);
          const currentRevision = this.revisions.get(body.loop.slug)?.length || 0;
          if (body.expectedRevision !== currentRevision) {
            return Response.json(
              { error: "Revision conflict", code: "revision_conflict" },
              { status: 409 },
            );
          }
          const catalogError = this.catalogIntegrityError([
            { loop: body.loop, status: body.status },
          ]);
          if (catalogError) return catalogError;
          this.loops.set(body.loop.slug, { ...body.loop, status: body.status });
          const revisions = this.revisions.get(body.loop.slug) || [];
          revisions.unshift({
            id: currentRevision + 1,
            slug: body.loop.slug,
            action: body.action,
            status: body.status,
            actor: body.actor,
            loop: body.loop,
            createdAt: new Date(Date.UTC(2026, 5, 21, 0, currentRevision)).toISOString(),
          });
          this.revisions.set(body.loop.slug, revisions);
          return Response.json(
            {
              created,
              revision: revisions.length,
              loop: this.loops.get(body.loop.slug),
            },
            { status: created ? 201 : 200 },
          );
        }

        if (init.method !== "PUT" && url.pathname.startsWith("/loops/")) {
          const slug = url.pathname.split("/").at(-1);
          const loop = this.loops.get(slug);
          return loop
            ? Response.json({
                loop: {
                  ...loop,
                  revision: this.revisions.get(slug)?.length || 0,
                },
              })
            : Response.json({ error: "Not found" }, { status: 404 });
        }

        if (init.method === "POST" && url.pathname === "/import") {
          const body = JSON.parse(init.body);
          const catalogError = this.catalogIntegrityError(
            body.loops.map((loop) => ({ loop, status: body.status })),
          );
          if (catalogError) return catalogError;
          for (const loop of body.loops) this.loops.set(loop.slug, { ...loop, status: body.status });
          if (body.activate) this.active = true;
          return Response.json({ imported: body.loops.length });
        }

        if (init.method === "POST" && url.pathname === "/restore/start") {
          const body = JSON.parse(init.body);
          if (this.restore?.restoreId === body.restoreId) {
            return Response.json({
              started: true,
              resumed: true,
              ...(this.restore.completed
                ? {
                    completed: true,
                    restored: this.loops.size,
                    revisions: [...this.revisions.values()].flat().length,
                    active: this.active,
                  }
                : {}),
            });
          }
          if (this.loops.size || this.revisions.size || this.restore) {
            return Response.json(
              { error: "Restore requires empty catalog", code: "restore_requires_empty_catalog" },
              { status: 409 },
            );
          }
          for (const entry of body.loops) {
            this.loops.set(entry.loop.slug, { ...entry.loop, status: entry.status });
          }
          this.restore = body;
          this.active = false;
          return Response.json({ started: true, resumed: false });
        }

        if (init.method === "POST" && url.pathname === "/restore/chunk") {
          const body = JSON.parse(init.body);
          for (const revision of body.revisions) {
            const revisions = this.revisions.get(revision.slug) || [];
            if (!revisions.some((item) => item.id === revision.id)) revisions.push(revision);
            revisions.sort((left, right) => right.id - left.id);
            this.revisions.set(revision.slug, revisions);
          }
          return Response.json({ accepted: body.revisions.length });
        }

        if (init.method === "POST" && url.pathname === "/restore/finalize") {
          const count = [...this.revisions.values()].flat().length;
          const completed = this.restore.completed === true;
          this.active = this.restore.active;
          this.restore.completed = true;
          return Response.json({
            restored: this.loops.size,
            revisions: count,
            active: this.active,
            ...(completed ? { completed: true } : {}),
          });
        }

        if (url.pathname === "/published") {
          const allLoops = [...this.loops.values()];
          const publishedLoops = allLoops.filter(
            (loop) => loop.status === "published",
          );
          return Response.json({
            initialized: this.active,
            updated: publishedLoops.length
              ? publishedLoops.reduce(
                  (latest, loop) => loop.modified > latest ? loop.modified : latest,
                  "1970-01-01",
                )
              : null,
            loops: publishedLoops
              .sort((left, right) => left.number.localeCompare(right.number))
              .map(({ status: _status, ...loop }) => loop),
          });
        }

        if (url.pathname === "/export/revisions") {
          const revisions = [...this.revisions.values()]
            .flat()
            .sort((left, right) => left.id - right.id);
          const after = Number(url.searchParams.get("after"));
          const max = Number(url.searchParams.get("max"));
          const limit = Number(url.searchParams.get("limit"));
          return Response.json({
            revisions: revisions
              .filter((revision) => revision.id > after && revision.id <= max)
              .slice(0, limit),
          });
        }

        if (url.pathname === "/export") {
          const revisions = [...this.revisions.values()]
            .flat()
            .sort((left, right) => left.id - right.id);
          return Response.json({
            schemaVersion: 2,
            exportedAt: "2026-06-21T23:59:00.000Z",
            active: this.active,
            activatedAt: "2026-06-21T23:00:00.000Z",
            loops: [...this.loops.values()],
            revisionCount: revisions.length,
            maxRevisionId: revisions.at(-1)?.id || 0,
          });
        }

        if (url.pathname.startsWith("/revisions/")) {
          return Response.json({ revisions: this.revisions.get(url.pathname.split("/").at(-1)) || [] });
        }

        return Response.json({ error: "Not found" }, { status: 404 });
      },
    };
  }

  catalogIntegrityError(changes) {
    if (!this.validateWrites) return null;

    try {
      assertCatalogIntegrity([...this.loops.values()], changes);
      return null;
    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : "Invalid catalog graph",
          code: "invalid_catalog_graph",
        },
        { status: 409 },
      );
    }
  }
}

function makeEnv(options = {}) {
  return {
    LOOP_CATALOG: new MemoryLoopCatalogNamespace(options.active ?? true, {
      validateWrites: options.validateCatalog === true,
      seedLoops: options.seedLoops,
    }),
    LOOP_PUBLISH_TOKEN: "test-publish-token",
    BOOTSTRAP_CATALOG_DIGEST: options.bootstrapDigest || "test-bootstrap-digest",
    BOOTSTRAP_LOOP_COUNT: String(options.bootstrapLoopCount ?? 50),
    PUBLIC_ORIGIN_URL: "https://calm-mortar-jtek.here.now/",
    PUBLIC_SHELL_URL: "https://calm-mortar-jtek.here.now/index.html",
    PUBLIC_SITE_HOSTNAME: "signals.forwardfuture.com",
    PUBLIC_SITE_PATH: "/loop-library",
  };
}

function exampleLoop(overrides = {}) {
  return {
    number: "051",
    slug: "database-publishing-loop",
    title: "The database publishing loop",
    summary: "Publishes a validated loop without a GitHub content commit.",
    seoTitle: "Database Publishing Loop | Loop Library",
    description: "A complete loop used to test database-backed publishing.",
    category: "engineering",
    featured: false,
    categoryLabel: "AI agent workflow",
    author: "Test Publisher",
    published: "2026-06-21",
    modified: "2026-06-21",
    prompt: "Publish one validated record, verify its public surfaces, and stop when they agree.",
    verifyTitle: "Every public surface returns the new loop.",
    verifyDetail: "Check the homepage, detail page, catalog, feed, and sitemap.",
    useWhen: "Use this when a reviewed loop is ready to publish.",
    steps: [
      "Validate the complete loop record.",
      "Write it to the catalog database.",
      "Read every public representation back from the database.",
    ],
    why: "One source of truth removes generated-file and review overhead.",
    note: "Keep publishing authenticated and preserve revision history.",
    keywords: ["loop publishing", "database catalog", "content workflow"],
    related: ["overnight-docs-sweep"],
    ...overrides,
  };
}

function overnightDocsLoop(overrides = {}) {
  return exampleLoop({
    number: "900",
    slug: "overnight-docs-sweep",
    title: "The overnight docs sweep",
    summary: "Keeps documentation refreshed during a bounded maintenance pass.",
    seoTitle: "Overnight Docs Sweep | Loop Library",
    description: "A loop for refreshing docs with a concrete overnight check.",
    prompt: "Review stale docs, update the highest-value page, verify links, and stop.",
    verifyTitle: "Docs pass the configured link and freshness checks.",
    verifyDetail: "Run the documentation checks and inspect the changed page.",
    useWhen: "Use this when documentation has drifted after product or code changes.",
    steps: [
      "Find the stale documentation surface.",
      "Make one focused update.",
      "Run the documentation verification checks.",
    ],
    why: "Small bounded updates keep docs useful without broad rewrites.",
    note: "Stop when the check passes or when ownership is unclear.",
    keywords: ["documentation", "maintenance", "freshness"],
    related: ["catalog-support-loop"],
    ...overrides,
  });
}

function catalogSupportLoop(overrides = {}) {
  return exampleLoop({
    number: "901",
    slug: "catalog-support-loop",
    title: "The catalog support loop",
    summary: "Provides a stable fixture for catalog graph validation.",
    seoTitle: "Catalog Support Loop | Loop Library",
    description: "A support loop used to validate related-loop relationships.",
    prompt: "Check the catalog graph, confirm related links resolve, and stop.",
    verifyTitle: "Every related loop slug resolves.",
    verifyDetail: "Read the generated catalog and verify each related link.",
    useWhen: "Use this when validating catalog graph behavior.",
    steps: [
      "Load the catalog records.",
      "Trace each related-loop slug.",
      "Report any missing or unpublished relationship.",
    ],
    why: "Graph validation prevents public pages from hiding broken relationships.",
    note: "Keep the fixture plain so tests can assert the target loop explicitly.",
    keywords: ["catalog graph", "related loops", "validation"],
    related: ["overnight-docs-sweep"],
    ...overrides,
  });
}

function publishedSupportLoops() {
  return [
    { ...overnightDocsLoop(), status: "published" },
    { ...catalogSupportLoop(), status: "published" },
  ];
}

function adminRequest(loop, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (options.authorized !== false) headers.Authorization = "Bearer test-publish-token";
  return new Request(`${WORKER_ORIGIN}/admin/loops/${loop.slug}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      loop,
      status: options.status || "published",
      expectedRevision: options.expectedRevision ?? 0,
    }),
  });
}

test("publishes a loop and exposes it without an Origin header", async () => {
  const env = makeEnv();
  const publish = await handleRequest(
    adminRequest(exampleLoop({ sourceUrl: "https://private.example/source" })),
    env,
  );
  assert.equal(publish.status, 201);

  const response = await handleRequest(new Request(`${WORKER_ORIGIN}/api/loops`), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.count, 1);
  assert.equal(body.loops[0].slug, "database-publishing-loop");
  assert.equal(body.loops[0].sourceUrl, undefined);
  assert.equal(body.updated, "2026-06-21");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("rejects unauthorized and invalid publishing requests", async () => {
  const env = makeEnv();
  const unauthorized = await handleRequest(
    adminRequest(exampleLoop(), { authorized: false }),
    env,
  );
  assert.equal(unauthorized.status, 401);

  const invalid = await handleRequest(
    adminRequest(exampleLoop({ category: "mystery" })),
    env,
  );
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).code, "invalid_loop");
});

test("publishing routes reject invalid catalog graphs through the catalog store", async () => {
  const missingRelated = makeEnv({ validateCatalog: true });
  const missingRelatedResponse = await handleRequest(
    adminRequest(exampleLoop({ related: ["missing-loop"] })),
    missingRelated,
  );
  assert.equal(missingRelatedResponse.status, 409);
  assert.match(
    (await missingRelatedResponse.json()).error,
    /references unavailable related loop missing-loop/,
  );

  const invalidImport = makeEnv({ validateCatalog: true });
  const importResponse = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/import`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-publish-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loops: [exampleLoop({ related: ["missing-loop"] })],
        status: "published",
      }),
    }),
    invalidImport,
  );
  assert.equal(importResponse.status, 409);
  assert.equal((await importResponse.json()).code, "invalid_catalog_graph");

  const duplicateMetadata = makeEnv({
    validateCatalog: true,
    seedLoops: [
      ...publishedSupportLoops(),
      { ...exampleLoop({ related: ["overnight-docs-sweep"] }), status: "published" },
    ],
  });
  const duplicateResponse = await handleRequest(
    adminRequest(
      exampleLoop({
        number: "052",
        slug: "duplicate-title-loop",
        related: ["overnight-docs-sweep"],
      }),
    ),
    duplicateMetadata,
  );
  assert.equal(duplicateResponse.status, 409);
  assert.match(
    (await duplicateResponse.json()).error,
    /duplicate-title-loop.title duplicates database-publishing-loop.title/,
  );
});

test("rejects a stale publisher instead of overwriting a newer revision", async () => {
  const env = makeEnv();
  const loop = exampleLoop();
  const created = await handleRequest(adminRequest(loop), env);
  assert.equal(created.status, 201);

  const current = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/${loop.slug}`, {
      headers: { Authorization: "Bearer test-publish-token" },
    }),
    env,
  );
  assert.equal((await current.json()).loop.revision, 1);

  const updated = await handleRequest(
    adminRequest(
      exampleLoop({ summary: "A newer reviewed summary." }),
      { expectedRevision: 1 },
    ),
    env,
  );
  assert.equal(updated.status, 200);

  const stale = await handleRequest(
    adminRequest(
      exampleLoop({ summary: "An older stale summary." }),
      { expectedRevision: 1 },
    ),
    env,
  );
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).code, "revision_conflict");
});

test("renders database content into the canonical homepage and detail page", async () => {
  const env = makeEnv();
  await handleRequest(
    adminRequest(
      exampleLoop({
        featured: true,
        searchText: "curated overnight on-demand alias",
      }),
    ),
    env,
  );
  const shell = `<!doctype html><script type="application/ld+json">{"old":true}</script><p id="results-count" aria-live="polite">Showing 50 loops</p><time datetime="2026-06-20">Updated June 20, 2026</time><tbody><!-- LOOP_DATABASE_ROWS_START --><tr><td>old</td></tr><!-- LOOP_DATABASE_ROWS_END --></tbody>`;
  const dependencies = {
    async fetch() {
      return new Response(shell, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    },
  };
  const homepage = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/`),
    env,
    undefined,
    dependencies,
  );
  const homepageHtml = await homepage.text();
  assert.match(homepageHtml, /The database publishing loop/);
  assert.match(homepageHtml, /Showing 1 loops/);
  assert.doesNotMatch(homepageHtml, />old</);
  assert.match(homepageHtml, /data-featured="true"/);
  assert.match(homepageHtml, /class="loop-featured">Featured/);
  assert.match(
    homepageHtml,
    /data-search="curated overnight on-demand alias"/,
  );
  const structuredData = JSON.parse(
    homepageHtml.match(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
    )[1],
  );
  const collection = structuredData["@graph"].find(
    (item) => item["@type"] === "CollectionPage",
  );
  assert.equal(collection.dateModified, "2026-06-21");
  assert.equal(collection.mainEntity.numberOfItems, 1);
  assert.equal(
    collection.mainEntity.itemListElement[0].name,
    "The database publishing loop",
  );

  const detail = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/loops/database-publishing-loop/`),
    env,
  );
  const detailHtml = await detail.text();
  assert.equal(detail.status, 200);
  assert.match(detailHtml, /Database Publishing Loop/);
  assert.match(detailHtml, /application\/ld\+json/);
  const detailData = JSON.parse(
    detailHtml.match(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
    )[1],
  );
  assert.deepEqual(
    detailData["@graph"].map((item) => item["@type"]),
    ["BreadcrumbList", "Article", "Organization"],
  );
  const article = detailData["@graph"][1];
  assert.equal(article.articleSection, "AI agent workflow");
  assert.deepEqual(article.keywords, exampleLoop().keywords);
  assert.equal(
    detailHtml.match(/aria-label="Loopy skill on GitHub"/g)?.length,
    2,
  );
  for (const href of [
    "feed.xml",
    "catalog.json",
    "catalog.md",
    "catalog.txt",
    "llms.txt",
    "agents/",
  ]) {
    assert.match(detailHtml, new RegExp(`href="[^"]*${href.replace(".", "\\.")}`));
  }
  for (const property of [
    "og:image:secure_url",
    "og:image:type",
    "og:image:alt",
  ]) {
    assert.match(detailHtml, new RegExp(`property="${property}"`));
  }
  assert.match(detailHtml, /name="twitter:image:alt"/);
});

test("renders related links from a catalog graph validated by the store", async () => {
  const env = makeEnv({
    validateCatalog: true,
    seedLoops: publishedSupportLoops(),
  });
  const publish = await handleRequest(
    adminRequest(exampleLoop({ related: ["overnight-docs-sweep"] })),
    env,
  );
  assert.equal(publish.status, 201);

  const detail = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/loops/database-publishing-loop/`),
    env,
  );
  const detailHtml = await detail.text();

  assert.equal(detail.status, 200);
  assert.match(detailHtml, /Related loops/);
  assert.match(
    detailHtml,
    /href="\.\.\/overnight-docs-sweep\/">The overnight docs sweep<\/a>/,
  );
});

test("renders homepage headers for HEAD by fetching the origin shell with GET", async () => {
  const env = makeEnv();
  await handleRequest(adminRequest(exampleLoop()), env);
  const shell = `<!doctype html><p id="results-count" aria-live="polite">Showing 50 loops</p><time datetime="2026-06-20">Updated June 20, 2026</time><tbody><!-- LOOP_DATABASE_ROWS_START --><!-- LOOP_DATABASE_ROWS_END --></tbody>`;
  const response = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/`, {
      method: "HEAD",
      headers: {
        "If-Modified-Since": "Sat, 20 Jun 2026 00:00:00 GMT",
        "If-None-Match": '"stale-shell"',
        Range: "bytes=0-100",
      },
    }),
    env,
    undefined,
    {
      async fetch(request) {
        assert.equal(request.url, "https://calm-mortar-jtek.here.now/index.html");
        assert.equal(request.method, "GET");
        assert.equal(request.headers.get("If-Modified-Since"), null);
        assert.equal(request.headers.get("If-None-Match"), null);
        assert.equal(request.headers.get("Range"), null);
        return new Response(shell, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Last-Modified": "Sat, 20 Jun 2026 00:00:00 GMT",
          },
        });
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Last-Modified"), null);
});

test("renders the mounted homepage through a here.now proxy", async () => {
  const env = makeEnv();
  await handleRequest(adminRequest(exampleLoop()), env);
  const shell = `<!doctype html><p id="results-count" aria-live="polite">Showing 50 loops</p><time datetime="2026-06-20">Updated June 20, 2026</time><tbody><!-- LOOP_DATABASE_ROWS_START --><!-- LOOP_DATABASE_ROWS_END --></tbody>`;
  const response = await handleRequest(
    new Request(`${WORKER_ORIGIN}/loop-library/`),
    env,
    undefined,
    {
      async fetch(request) {
        assert.equal(request.url, "https://calm-mortar-jtek.here.now/index.html");
        return new Response(shell, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
  );

  assert.equal(response.status, 200);
  assert.match(await response.text(), /The database publishing loop/);
});

test("normalizes legacy Forward Future domains on every public catalog surface", async () => {
  const env = makeEnv();
  await handleRequest(
    adminRequest(exampleLoop({
      prompt: "Read https://signals.forwardfuture.ai/loop-library/api/loops before continuing.",
    })),
    env,
  );
  const shell = `<!doctype html><p id="results-count" aria-live="polite">Showing 0 loops</p><time datetime="2026-06-20">Updated June 20, 2026</time><tbody><!-- LOOP_DATABASE_ROWS_START --><!-- LOOP_DATABASE_ROWS_END --></tbody>`;
  const responses = await Promise.all([
    handleRequest(
      new Request(`${SITE_ORIGIN}/loop-library/`),
      env,
      undefined,
      { async fetch() { return new Response(shell, { headers: { "Content-Type": "text/html" } }); } },
    ),
    handleRequest(new Request(`${SITE_ORIGIN}/loop-library/catalog.json`), env),
    handleRequest(new Request(`${SITE_ORIGIN}/loop-library/api/loops`), env),
  ]);

  for (const response of responses) {
    const body = await response.text();
    assert.doesNotMatch(body, /forwardfuture\.ai/);
    assert.match(body, /signals\.forwardfuture\.com\/loop-library\/api\/loops/);
  }
});

test("does not recurse through the here.now proxy before activation", async () => {
  const env = makeEnv({ active: false });
  let originFetches = 0;
  const dependencies = {
    async fetch() {
      originFetches += 1;
      throw new Error("The proxied request must not fetch its origin again.");
    },
  };

  for (const path of ["/", "/catalog.json", "/loops/database-publishing-loop/"]) {
    const response = await handleRequest(
      new Request(`${WORKER_ORIGIN}/loop-library${path}`),
      env,
      undefined,
      dependencies,
    );
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "catalog_not_active");
  }
  assert.equal(originFetches, 0);
});

test("replaces legacy static rows before the content-free shell is deployed", async () => {
  const env = makeEnv();
  await handleRequest(adminRequest(exampleLoop()), env);
  const legacyShell = `<!doctype html><script type="application/ld+json">{"old":true}</script><p id="results-count" aria-live="polite">Showing 50 loops</p><time datetime="2026-06-20">Updated June 20, 2026</time><table class="loop-table"><tbody><tr class="loop-row"><td>legacy record</td></tr></tbody></table>`;
  const response = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/`),
    env,
    undefined,
    { async fetch() { return new Response(legacyShell, { headers: { "Content-Type": "text/html" } }); } },
  );
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /The database publishing loop/);
  assert.doesNotMatch(body, /legacy record/);
  assert.match(body, /LOOP_DATABASE_ROWS_START/);
});

test("returns bodyless HEAD responses for missing loops", async () => {
  const env = makeEnv();
  for (const url of [
    `${WORKER_ORIGIN}/api/loops/missing-loop`,
    `${SITE_ORIGIN}/loop-library/loops/missing-loop/`,
  ]) {
    const response = await handleRequest(
      new Request(url, { method: "HEAD" }),
      env,
    );
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(await response.text(), "");
  }
});

test("generates catalogs, sitemap, and feed from the same record", async () => {
  const env = makeEnv();
  await handleRequest(adminRequest(exampleLoop()), env);

  for (const [path, expected] of [
    ["catalog.json", '"loopCount":1'],
    ["catalog.md", "The database publishing loop"],
    ["catalog.txt", "The database publishing loop"],
    ["llms.txt", "Published loops: 1."],
    ["sitemap.xml", "/loops/database-publishing-loop/"],
    ["feed.xml", "The database publishing loop"],
  ]) {
    const response = await handleRequest(
      new Request(`${SITE_ORIGIN}/loop-library/${path}`),
      env,
    );
    assert.equal(response.status, 200, path);
    assert.match((await response.text()).replaceAll(" ", ""), new RegExp(expected.replaceAll(" ", "")), path);
  }

  const markdown = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/catalog.md`),
    env,
  ).then((response) => response.text());
  assert.match(markdown, /Plain-text catalog: .*catalog\.txt/);
  assert.match(markdown, /Agent instructions: .*llms\.txt/);
  assert.match(markdown, /Generated from the production catalog database/);
  assert.match(markdown, /Search by outcome, trigger, artifact/);

  const agentInstructions = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/llms.txt`),
    env,
  ).then((response) => response.text());
  assert.match(agentInstructions, /## Install Loopy/);
  assert.match(agentInstructions, /--skill loopy -g/);
  assert.match(agentInstructions, /compatibility alias/);
  assert.doesNotMatch(agentInstructions, /--skill loop-library/);

  const feed = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/feed.xml`),
    env,
  ).then((response) => response.text());
  assert.match(feed, /2026-06-21T00:00:00-07:00/);
});

test("passes non-catalog canonical assets through to the here.now origin", async () => {
  const env = makeEnv();
  let forwarded = false;
  const response = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/styles.css`, {
      headers: {
        Accept: "text/css",
        Authorization: "Bearer must-not-forward",
        Cookie: "session=must-not-forward",
        "CF-Ray": "must-not-forward",
      },
    }),
    env,
    undefined,
    {
      async fetch(request) {
        assert.equal(request.url, "https://calm-mortar-jtek.here.now/styles.css");
        assert.equal(request.headers.get("Accept"), "text/css");
        assert.equal(request.headers.get("Authorization"), null);
        assert.equal(request.headers.get("Cookie"), null);
        assert.equal(request.headers.get("CF-Ray"), null);
        forwarded = true;
        return new Response("body{}", { headers: { "Content-Type": "text/css" } });
      },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(forwarded, true);
});

test("preserves conditional range semantics for origin assets", async () => {
  const env = makeEnv();
  const response = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/assets/social/example.png`, {
      headers: {
        Range: "bytes=0-99",
        "If-Range": '"asset-v1"',
      },
    }),
    env,
    undefined,
    {
      async fetch(request) {
        assert.equal(request.headers.get("Range"), "bytes=0-99");
        assert.equal(request.headers.get("If-Range"), '"asset-v1"');
        return new Response("full-current-asset", { status: 200 });
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "full-current-asset");
});

test("returns 404 for an archived bootstrap loop instead of exposing its static page", async () => {
  const env = makeEnv();
  const loop = exampleLoop();
  await handleRequest(adminRequest(loop), env);
  await handleRequest(
    adminRequest(loop, { status: "archived", expectedRevision: 1 }),
    env,
  );

  const response = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/loops/${loop.slug}/`),
    env,
    undefined,
    {
      async fetch() {
        throw new Error("Archived detail routes must not reach the static origin.");
      },
    },
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("preserves the catalog v2 contributor playbook contract", async () => {
  const env = makeEnv();
  const contributorPlaybook = {
    whenNotToUse: ["The source has no evidence of success."],
    expectedOutputs: ["A reusable method."],
    implementationGuidance: ["Preserve the checks, not the surface style."],
    reviewerHandoff: ["Describe the independent test."],
  };
  await handleRequest(
    adminRequest(exampleLoop({ contributorPlaybook })),
    env,
  );
  const response = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/catalog.json`),
    env,
  );
  const catalog = await response.json();

  assert.equal(catalog.schemaVersion, 2);
  assert.deepEqual(catalog.loops[0].contributorPlaybook, contributorPlaybook);
});

test("records draft writes as draft revisions", async () => {
  const env = makeEnv();
  const loop = exampleLoop();
  await handleRequest(adminRequest(loop, { status: "draft" }), env);
  const response = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/${loop.slug}/revisions`, {
      headers: { Authorization: "Bearer test-publish-token" },
    }),
    env,
  );
  const body = await response.json();

  assert.equal(body.revisions[0].action, "draft");
  assert.equal(body.revisions[0].status, "draft");
});

test("does not expose private draft dates in public catalog metadata", async () => {
  const env = makeEnv();
  await handleRequest(adminRequest(exampleLoop()), env);
  await handleRequest(
    adminRequest(
      exampleLoop({
        number: "052",
        slug: "future-draft-loop",
        title: "A future draft loop",
        published: "2026-06-22",
        modified: "2026-06-22",
      }),
      { status: "draft" },
    ),
    env,
  );
  const response = await handleRequest(
    new Request(`${WORKER_ORIGIN}/api/loops`),
    env,
  );
  const body = await response.json();

  assert.equal(body.updated, "2026-06-21");
  assert.equal(body.count, 1);
});

test("keeps the origin shell live until the bootstrap import activates cutover", async () => {
  const env = makeEnv({ active: false });
  await handleRequest(
    adminRequest(exampleLoop(), { status: "draft" }),
    env,
  );
  const dependencies = {
    async fetch() {
      return new Response("STATIC FALLBACK", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    },
  };
  const homepage = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/`),
    env,
    undefined,
    dependencies,
  );
  const detail = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/loops/overnight-docs-sweep/`),
    env,
    undefined,
    dependencies,
  );

  assert.equal(await homepage.text(), "STATIC FALLBACK");
  assert.equal(await detail.text(), "STATIC FALLBACK");
});

test("exports a private database backup through the authenticated admin route", async () => {
  const env = makeEnv();
  await handleRequest(adminRequest(exampleLoop()), env);
  const response = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/export`, {
      headers: { Authorization: "Bearer test-publish-token" },
    }),
    env,
  );
  const backup = await response.json();

  assert.equal(response.status, 200);
  assert.equal(backup.schemaVersion, 2);
  assert.equal(backup.loops[0].slug, "database-publishing-loop");
  assert.equal(backup.revisionCount, 1);
});

test("restores an evolved backup into a fresh catalog with revision history", async () => {
  const source = makeEnv();
  const loop = exampleLoop();
  await handleRequest(adminRequest(loop), source);
  await handleRequest(
    adminRequest(exampleLoop({ summary: "Updated after bootstrap." }), {
      expectedRevision: 1,
    }),
    source,
  );
  const backupResponse = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/export`, {
      headers: { Authorization: "Bearer test-publish-token" },
    }),
    source,
  );
  const backup = await backupResponse.json();
  const revisionPage = await handleRequest(
    new Request(
      `${WORKER_ORIGIN}/admin/loops/export?after=0&max=${backup.maxRevisionId}&limit=50`,
      { headers: { Authorization: "Bearer test-publish-token" } },
    ),
    source,
  ).then((response) => response.json());
  backup.revisionDigest = createHash("sha256")
    .update(
      `${"0".repeat(64)}\n${revisionPage.revisions
        .map((revision) => `${JSON.stringify({ type: "revision", revision })}\n`)
        .join("")}`,
    )
    .digest("hex");
  backup.restoreId = createHash("sha256")
    .update(JSON.stringify(backup))
    .digest("hex");

  const destination = makeEnv({ active: false });
  const start = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/restore/start`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-publish-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backup),
    }),
    destination,
  );
  assert.equal(start.status, 200);
  const chunk = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/restore/chunk`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-publish-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        restoreId: backup.restoreId,
        revisions: revisionPage.revisions,
      }),
    }),
    destination,
  );
  assert.equal(chunk.status, 200);
  const finalize = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/restore/finalize`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-publish-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ restoreId: backup.restoreId }),
    }),
    destination,
  );
  assert.deepEqual(await finalize.json(), {
    restored: 1,
    revisions: 2,
    active: true,
  });
  const finalizeRetry = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/restore/finalize`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-publish-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ restoreId: backup.restoreId }),
    }),
    destination,
  ).then((response) => response.json());
  assert.deepEqual(finalizeRetry, {
    restored: 1,
    revisions: 2,
    active: true,
    completed: true,
  });

  const current = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/${loop.slug}`, {
      headers: { Authorization: "Bearer test-publish-token" },
    }),
    destination,
  ).then((response) => response.json());
  assert.equal(current.loop.summary, "Updated after bootstrap.");
  assert.equal(current.loop.revision, 2);
});

test("does not expose staged published records before catalog activation", async () => {
  const env = makeEnv({ active: false });
  const loop = exampleLoop();
  await handleRequest(adminRequest(loop), env);
  const api = await handleRequest(
    new Request(`${WORKER_ORIGIN}/api/loops`),
    env,
  );
  const canonicalDetail = await handleRequest(
    new Request(`${SITE_ORIGIN}/loop-library/loops/${loop.slug}/`),
    env,
    undefined,
    {
      async fetch() {
        return new Response("STATIC NOT STAGED");
      },
    },
  );

  assert.equal(api.status, 503);
  assert.equal((await api.json()).code, "catalog_not_active");
  assert.equal(await canonicalDetail.text(), "STATIC NOT STAGED");
});

test("refuses to activate a partial bootstrap import", async () => {
  const env = makeEnv({ active: false });
  const response = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/import`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-publish-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loops: [exampleLoop()],
        status: "published",
        activate: true,
      }),
    }),
    env,
  );

  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, "invalid_loop");
});

test("refuses to activate an unpublished bootstrap import", async () => {
  const env = makeEnv({ active: false, bootstrapLoopCount: 1 });
  const response = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/import`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-publish-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loops: [exampleLoop()],
        status: "draft",
        activate: true,
      }),
    }),
    env,
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /published import status/);
});

test("refuses to activate an unreviewed bootstrap digest", async () => {
  const env = makeEnv({ active: false, bootstrapLoopCount: 1 });
  const response = await handleRequest(
    new Request(`${WORKER_ORIGIN}/admin/loops/import`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-publish-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loops: [exampleLoop()],
        status: "published",
        activate: true,
      }),
    }),
    env,
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /reviewed bootstrap catalog digest/);
});

test("rejects published relationships to unavailable loops", () => {
  assert.throws(
    () =>
      assertCatalogIntegrity([], [
        {
          loop: exampleLoop({ related: ["missing-loop"] }),
          status: "published",
        },
      ]),
    /references unavailable related loop missing-loop/,
  );
});

test("rejects duplicate published search metadata", () => {
  const existing = { ...exampleLoop(), status: "published" };
  const duplicate = exampleLoop({
    number: "052",
    slug: "duplicate-title-loop",
    related: [existing.slug],
  });

  assert.throws(
    () =>
      assertCatalogIntegrity([existing], [
        { loop: duplicate, status: "published" },
      ]),
    /duplicate-title-loop.title duplicates database-publishing-loop.title/,
  );
});

test("rejects activation when an existing published slug is omitted", () => {
  assert.throws(
    () =>
      assertActivationCatalog(
        [exampleLoop({ slug: "existing-extra-loop" })],
        [exampleLoop()],
      ),
    /does not include existing published loop existing-extra-loop/,
  );
});
