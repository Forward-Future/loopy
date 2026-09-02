import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { LoopCatalog } from "../src/catalog-store.js";
import { VoteStore } from "../src/vote-store.js";

// Smallest stand-in for the Cloudflare Durable Object `state` the classes use:
// `storage.sql.exec(query, ...bindings)` returning an iterable of row objects,
// and `storage.transactionSync(fn)`.
function makeState() {
  const db = new DatabaseSync(":memory:");
  return {
    storage: {
      sql: {
        exec(query, ...bindings) {
          if (/^\s*CREATE/i.test(query)) {
            db.exec(query);
            return [];
          }
          return db.prepare(query).all(...bindings);
        },
      },
      transactionSync(fn) {
        db.exec("BEGIN");
        try {
          const result = fn();
          db.exec("COMMIT");
          return result;
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      },
    },
  };
}

async function call(object, path, body) {
  const response = await object.fetch(
    new Request(`https://durable-object${path}`, {
      method: body === undefined ? "GET" : "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  return { status: response.status, body: await response.json() };
}

function vote(store, slug, value, voter = "octocat") {
  return call(store, `/votes/${slug}`, {
    value,
    voterKey: `github:${voter}`,
    provider: "github",
    username: voter,
  });
}

test("VoteStore keeps one vote per voter and slug", async () => {
  const store = new VoteStore(makeState());

  assert.equal((await vote(store, "loop-a", 1)).status, 200);
  const second = await vote(store, "loop-a", 1);

  assert.deepEqual(second.body, {
    slug: "loop-a",
    vote: 1,
    counts: { upvotes: 1, downvotes: 0, score: 1 },
  });
  assert.equal(
    store.sql.exec("SELECT COUNT(*) AS count FROM loop_votes")[0].count,
    1,
  );
});

test("VoteStore switches a vote in place instead of adding a row", async () => {
  const store = new VoteStore(makeState());

  await vote(store, "loop-a", -1);
  const switched = await vote(store, "loop-a", 1);

  assert.deepEqual(switched.body.counts, { upvotes: 1, downvotes: 0, score: 1 });
  const rows = store.sql.exec("SELECT value FROM loop_votes WHERE loop_slug = ?", "loop-a");
  assert.deepEqual([...rows].map((row) => row.value), [1]);
});

test("VoteStore removes a vote with value 0", async () => {
  const store = new VoteStore(makeState());

  await vote(store, "loop-a", 1);
  const removed = await vote(store, "loop-a", 0);

  assert.deepEqual(removed.body, {
    slug: "loop-a",
    vote: 0,
    counts: { upvotes: 0, downvotes: 0, score: 0 },
  });
  assert.equal(store.sql.exec("SELECT COUNT(*) AS count FROM loop_votes")[0].count, 0);
});

test("VoteStore rejects value 5 at the route and at the CHECK constraint", async () => {
  const store = new VoteStore(makeState());

  const rejected = await vote(store, "loop-a", 5);
  assert.equal(rejected.status, 400);
  assert.equal(rejected.body.code, "invalid_vote");

  // The route maps 0 to a delete; the schema itself must never store 0 or 5.
  for (const value of [0, 5]) {
    assert.throws(
      () =>
        store.sql.exec(
          `INSERT INTO loop_votes (
             loop_slug, voter_key, value, provider, username, created_at, updated_at
           ) VALUES ('loop-a', 'github:octocat', ?, 'github', 'octocat', 'now', 'now')`,
          value,
        ),
      /CHECK constraint failed/,
    );
  }
  assert.equal(store.sql.exec("SELECT COUNT(*) AS count FROM loop_votes")[0].count, 0);
});

test("VoteStore totals report per-slug counts and the viewer's own votes", async () => {
  const store = new VoteStore(makeState());

  await vote(store, "loop-a", 1, "octocat");
  await vote(store, "loop-a", -1, "hubot");
  await vote(store, "loop-b", -1, "octocat");

  const totals = await call(store, "/votes?voter=github:octocat");
  assert.equal(totals.status, 200);
  assert.deepEqual(totals.body, {
    votes: {
      "loop-a": { upvotes: 1, downvotes: 1, score: 0 },
      "loop-b": { upvotes: 0, downvotes: 1, score: -1 },
    },
    viewerVotes: { "loop-a": 1, "loop-b": -1 },
  });

  const anonymous = await call(store, "/votes");
  assert.deepEqual(anonymous.body.viewerVotes, {});
});

const EXAMPLE_LOOP = JSON.parse(
  readFileSync(new URL("../examples/loop.json", import.meta.url), "utf8"),
);

function makeLoop(overrides = {}) {
  return { ...EXAMPLE_LOOP, related: [], ...overrides };
}

function put(catalog, loop, status, expectedRevision = 0, action = status) {
  return catalog.fetch(
    new Request(`https://durable-object/loops/${loop.slug}`, {
      method: "PUT",
      body: JSON.stringify({ loop, status, actor: "tests", action, expectedRevision }),
    }),
  ).then(async (response) => ({ status: response.status, body: await response.json() }));
}

test("LoopCatalog serves a published record through the published route", async () => {
  const catalog = new LoopCatalog(makeState());
  const loop = makeLoop();

  const created = await put(catalog, loop, "published");
  assert.equal(created.status, 201);
  assert.deepEqual(created.body, {
    created: true,
    revision: 1,
    loop: { ...loop, status: "published" },
  });

  const published = await call(catalog, "/published");
  assert.deepEqual(published.body, {
    initialized: false,
    updated: loop.modified,
    loops: [loop],
  });

  const detail = await call(catalog, `/loops/${loop.slug}`);
  assert.deepEqual(detail.body.loop, { ...loop, status: "published", revision: 1 });
});

test("LoopCatalog writes a new revision row on republish and serves the latest", async () => {
  const catalog = new LoopCatalog(makeState());
  const loop = makeLoop();
  const updated = makeLoop({ title: "The example loop, revised", modified: "2026-06-22" });

  await put(catalog, loop, "published");
  const stale = await put(catalog, updated, "published", 0);
  assert.equal(stale.status, 409);
  assert.equal(stale.body.code, "revision_conflict");

  const second = await put(catalog, updated, "published", 1);
  assert.equal(second.status, 200);
  assert.deepEqual(second.body, {
    created: false,
    revision: 2,
    loop: { ...updated, status: "published" },
  });

  const revisions = (await call(catalog, `/revisions/${loop.slug}`)).body.revisions;
  assert.deepEqual(
    revisions.map((revision) => [revision.id, revision.loop.title]),
    [[2, updated.title], [1, loop.title]],
  );
  assert.deepEqual((await call(catalog, "/published")).body.loops, [updated]);
  assert.equal(
    catalog.sql.exec("SELECT COUNT(*) AS count FROM loops")[0].count,
    1,
  );
});

test("LoopCatalog leaves archived loops out of the published route", async () => {
  const catalog = new LoopCatalog(makeState());
  const live = makeLoop();
  const retired = makeLoop({
    slug: "retired-loop",
    number: "052",
    title: "The retired loop",
    seoTitle: "Retired Loop | Loop Library",
    description: "A loop that is no longer public.",
    prompt: "Retired prompt.",
  });

  await put(catalog, live, "published");
  const { revision } = (await put(catalog, retired, "published")).body;
  // Revision ids are global across slugs, so read the current one back.
  assert.equal(revision, 2);
  const archived = await put(catalog, retired, "archived", revision);
  assert.equal(archived.status, 200);

  const published = await call(catalog, "/published");
  assert.deepEqual(published.body.loops, [live]);
  assert.deepEqual(
    (await call(catalog, "/all")).body.loops.map((loop) => [loop.slug, loop.status]),
    [[live.slug, "published"], [retired.slug, "archived"]],
  );
});

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

test("LoopCatalog export restores into a fresh instance", async () => {
  const source = new LoopCatalog(makeState());
  const loop = makeLoop();
  const revised = makeLoop({ title: "The example loop, revised", modified: "2026-06-22" });
  const retired = makeLoop({
    slug: "retired-loop",
    number: "052",
    title: "The retired loop",
    seoTitle: "Retired Loop | Loop Library",
    description: "A loop that is no longer public.",
    prompt: "Retired prompt.",
  });

  const imported = await call(source, "/import", {
    loops: [loop],
    status: "published",
    actor: "tests",
    activate: true,
  });
  assert.equal(imported.status, 200);
  assert.equal((await put(source, revised, "published", 1)).status, 200);
  const { revision } = (await put(source, retired, "published")).body;
  assert.equal((await put(source, retired, "archived", revision)).status, 200);

  // Mirror bin/export-catalog.mjs: snapshot, page revisions, chain the digest.
  const snapshot = (await call(source, "/export")).body;
  assert.equal(snapshot.schemaVersion, 2);
  assert.equal(snapshot.active, true);
  assert.equal(snapshot.revisionCount, 4);
  assert.equal(snapshot.maxRevisionId, 4);
  const { revisions } = (await call(
    source,
    `/export/revisions?after=0&max=${snapshot.maxRevisionId}&limit=50`,
  )).body;
  assert.equal(revisions.length, 4);
  const chunk = revisions
    .map((revision) => `${JSON.stringify({ type: "revision", revision })}\n`)
    .join("");
  const manifestWithoutId = {
    ...snapshot,
    revisionDigest: sha256(`${"0".repeat(64)}\n${chunk}`),
  };
  const manifest = {
    ...manifestWithoutId,
    restoreId: sha256(JSON.stringify(manifestWithoutId)),
  };

  // Mirror loop-routes.js normalizeRestoreManifest: {..loop, status} -> {loop, status}.
  const fresh = new LoopCatalog(makeState());
  const start = await call(fresh, "/restore/start", {
    ...manifest,
    loops: manifest.loops.map(({ status, ...document }) => ({ loop: document, status })),
  });
  assert.deepEqual(start.body, { started: true, resumed: false, acceptedRevisions: 0 });

  const chunked = await call(fresh, "/restore/chunk", {
    restoreId: manifest.restoreId,
    revisions,
  });
  assert.deepEqual(chunked.body, { accepted: 4, total: 4 });

  const finalized = await call(fresh, "/restore/finalize", { restoreId: manifest.restoreId });
  assert.deepEqual(finalized.body, { restored: 2, revisions: 4, active: true });

  const restored = (await call(fresh, "/export")).body;
  assert.deepEqual(restored.loops, snapshot.loops);
  assert.equal(restored.activatedAt, snapshot.activatedAt);
  assert.deepEqual(
    (await call(fresh, "/published")).body,
    (await call(source, "/published")).body,
  );
  assert.deepEqual(
    (await call(fresh, `/export/revisions?after=0&max=4&limit=50`)).body.revisions,
    revisions,
  );

  const again = await call(fresh, "/restore/start", manifest);
  assert.equal(again.body.completed, true);
});
