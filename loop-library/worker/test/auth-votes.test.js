import assert from "node:assert/strict";
import test from "node:test";

import { handleAuthVoteRoute } from "../src/auth-votes.js";

const ORIGIN = "https://signals.forwardfuture.com";
const BASE = `${ORIGIN}/loop-library`;

class MemoryVoteNamespace {
  votes = new Map();

  idFromName(name) {
    return name;
  }

  get() {
    return {
      fetch: async (input, init = {}) => {
        const url = new URL(input);
        const match = url.pathname.match(/^\/votes\/([a-z0-9-]+)$/);

        if (url.pathname === "/votes") {
          const counts = {};
          const viewerVotes = {};
          const viewer = url.searchParams.get("voter");
          for (const [key, value] of this.votes) {
            const [slug, voterKey] = key.split("|");
            counts[slug] ||= { upvotes: 0, downvotes: 0, score: 0 };
            if (value === 1) counts[slug].upvotes += 1;
            if (value === -1) counts[slug].downvotes += 1;
            counts[slug].score += value;
            if (viewer === voterKey) viewerVotes[slug] = value;
          }
          return Response.json({ votes: counts, viewerVotes });
        }

        if (match && init.method === "POST") {
          const body = JSON.parse(init.body);
          const key = `${match[1]}|${body.voterKey}`;
          if (body.value === 0) this.votes.delete(key);
          else this.votes.set(key, body.value);
          const values = [...this.votes]
            .filter(([entry]) => entry.startsWith(`${match[1]}|`))
            .map(([, value]) => value);
          return Response.json({
            slug: match[1],
            vote: body.value,
            counts: {
              upvotes: values.filter((value) => value === 1).length,
              downvotes: values.filter((value) => value === -1).length,
              score: values.reduce((sum, value) => sum + value, 0),
            },
          });
        }

        return Response.json({ error: "Not found" }, { status: 404 });
      },
    };
  }
}

class MemoryCatalogNamespace {
  idFromName(name) {
    assert.equal(name, "published-loops");
    return name;
  }

  get() {
    return {
      fetch: async () => Response.json({
        initialized: true,
        loops: [{ slug: "overnight-docs-sweep" }],
      }),
    };
  }
}

function makeEnv() {
  return {
    GITHUB_OAUTH_CLIENT_ID: "github-client-id",
    GITHUB_OAUTH_CLIENT_SECRET: "github-client-secret",
    LOOP_CATALOG: new MemoryCatalogNamespace(),
    OAUTH_CALLBACK_ORIGIN: ORIGIN,
    PUBLIC_SITE_HOSTNAME: "signals.forwardfuture.com",
    PUBLIC_SITE_PATH: "/loop-library",
    SESSION_SECRET: "test-session-secret-that-is-more-than-32-characters",
    VOTING_UI_ENABLED: "true",
    VOTE_STORE: new MemoryVoteNamespace(),
  };
}

async function githubSession(env) {
  const clientNonce = "test-browser-nonce-that-is-at-least-32-chars";
  const start = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/github?return_to=%2Floop-library%2Floops%2Fovernight-docs-sweep%2F&client_nonce=${clientNonce}`),
    env,
  );
  assert.equal(start.status, 200);
  const authorization = new URL((await start.json()).authorizationUrl);
  assert.equal(authorization.origin, "https://github.com");
  assert.equal(authorization.searchParams.get("scope"), "read:user");
  const state = authorization.searchParams.get("state");
  const calls = [];
  const callback = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/callback/github?code=test-code&state=${encodeURIComponent(state)}`),
    env,
    {
      fetch: async (input, init = {}) => {
        calls.push({ input, init });
        if (input === "https://github.com/login/oauth/access_token") {
          return Response.json({ access_token: "github-access-token" });
        }
        if (input === "https://api.github.com/user") {
          return Response.json({ id: 42, login: "octoloop", name: "Octo Loop" });
        }
        throw new Error(`Unexpected request: ${input}`);
      },
    },
  );
  assert.equal(callback.status, 200);
  const callbackBody = await callback.text();
  assert.match(callbackBody, /sessionStorage\.setItem\("ll_session"/);
  assert.match(callbackBody, /loop-library\/loops\/overnight-docs-sweep/);
  assert.match(callbackBody, new RegExp(clientNonce));
  assert.equal(calls.length, 2);
  assert.equal(
    new Headers(calls[1].init.headers).get("Authorization"),
    "Bearer github-access-token",
  );
  const sessionMatch = callbackBody.match(
    /"sessionToken":"([A-Za-z0-9_.-]+)"/,
  );
  assert(sessionMatch, "session token missing from OAuth bridge");
  return sessionMatch[1];
}

test("GitHub OAuth creates a signed session that can cast, switch, and remove a vote", async () => {
  const env = makeEnv();
  const sessionToken = await githubSession(env);
  const voteRequest = (value, origin = ORIGIN) => new Request(
    `${BASE}/api/loops/overnight-docs-sweep/vote`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({ value, sessionToken }),
    },
  );

  const upvote = await handleAuthVoteRoute(voteRequest(1), env);
  assert.equal(upvote.status, 200);
  assert.deepEqual((await upvote.json()).counts, {
    upvotes: 1,
    downvotes: 0,
    score: 1,
  });

  const downvote = await handleAuthVoteRoute(voteRequest(-1), env);
  assert.deepEqual((await downvote.json()).counts, {
    upvotes: 0,
    downvotes: 1,
    score: -1,
  });

  const session = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    }),
    env,
  );
  const sessionBody = await session.json();
  assert.deepEqual(sessionBody.viewer, {
    provider: "github",
    username: "octoloop",
    name: "Octo Loop",
  });
  assert.equal(sessionBody.viewerVotes["overnight-docs-sweep"], -1);

  const totals = await handleAuthVoteRoute(new Request(`${BASE}/api/votes`), env);
  const totalsBody = await totals.json();
  assert.equal(totalsBody.viewer, null);
  assert.deepEqual(totalsBody.viewerVotes, {});
  assert.equal(totalsBody.uiEnabled, true);

  const removed = await handleAuthVoteRoute(voteRequest(0), env);
  assert.deepEqual((await removed.json()).counts, {
    upvotes: 0,
    downvotes: 0,
    score: 0,
  });
});

test("voting UI is fail-closed unless the launch flag is exactly true", async () => {
  const env = makeEnv();
  delete env.VOTING_UI_ENABLED;

  const disabled = await handleAuthVoteRoute(
    new Request(`${BASE}/api/votes`),
    env,
  );
  assert.equal((await disabled.json()).uiEnabled, false);

  env.VOTING_UI_ENABLED = "TRUE";
  const malformed = await handleAuthVoteRoute(
    new Request(`${BASE}/api/votes`),
    env,
  );
  assert.equal((await malformed.json()).uiEnabled, false);

  env.VOTING_UI_ENABLED = "true";
  const enabled = await handleAuthVoteRoute(
    new Request(`${BASE}/api/votes`),
    env,
  );
  assert.equal((await enabled.json()).uiEnabled, true);
});

test("session lookup fails closed when vote storage is unavailable", async () => {
  const env = makeEnv();
  const sessionToken = await githubSession(env);
  delete env.VOTE_STORE;

  const session = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    }),
    env,
  );

  assert.equal(session.status, 503);
  assert.equal((await session.json()).code, "not_configured");
});

test("vote writes reject anonymous, cross-site, malformed, and unpublished requests", async () => {
  const env = makeEnv();
  const anonymous = await handleAuthVoteRoute(
    new Request(`${BASE}/api/loops/overnight-docs-sweep/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify({ value: 1 }),
    }),
    env,
  );
  assert.equal(anonymous.status, 401);

  const sessionToken = await githubSession(env);
  const crossSite = await handleAuthVoteRoute(
    new Request(`${BASE}/api/loops/overnight-docs-sweep/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://phishing.example",
      },
      body: JSON.stringify({ value: 1, sessionToken }),
    }),
    env,
  );
  assert.equal(crossSite.status, 403);

  const malformed = await handleAuthVoteRoute(
    new Request(`${BASE}/api/loops/overnight-docs-sweep/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: ORIGIN,
      },
      body: JSON.stringify({ value: 2, sessionToken }),
    }),
    env,
  );
  assert.equal(malformed.status, 400);

  const unpublished = await handleAuthVoteRoute(
    new Request(`${BASE}/api/loops/not-published/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: ORIGIN,
      },
      body: JSON.stringify({ value: 1, sessionToken }),
    }),
    env,
  );
  assert.equal(unpublished.status, 404);
});

test("GitHub OAuth state is verified and X routes are absent", async () => {
  const env = makeEnv();
  const clientNonce = "another-browser-nonce-that-is-at-least-32-chars";
  const githubStart = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/github?return_to=%2Floop-library%2F&client_nonce=${clientNonce}`),
    env,
  );
  assert.equal(githubStart.status, 200);

  const invalidCallback = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/callback/github?code=test-code&state=wrong-state`),
    env,
  );
  assert.equal(invalidCallback.status, 200);
  assert.match(await invalidCallback.text(), /auth_error=invalid_state/);

  const missingNonce = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/github?return_to=%2Floop-library%2F`),
    env,
  );
  assert.equal(missingNonce.status, 200);
  const startBridge = await missingNonce.text();
  assert.match(startBridge, /sessionStorage\.setItem\("ll_oauth_nonce"/);
  assert.match(startBridge, /client_nonce/);
  assert.match(startBridge, /GitHub sign-in/);

  const malformedNonce = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/github?client_nonce=too-short`),
    env,
  );
  assert.equal(malformedNonce.status, 400);

  assert.equal(
    await handleAuthVoteRoute(new Request(`${BASE}/auth/x`), env),
    null,
  );
});

test("mutation origins reject explicit cross-site requests and allow stripped proxy origins", async () => {
  const env = makeEnv();
  const rejected = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/logout`, {
      method: "POST",
      headers: { Origin: "https://phishing.example" },
    }),
    env,
  );
  assert.equal(rejected.status, 403);

  const accepted = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/logout`, { method: "POST" }),
    env,
  );
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { ok: true });
});
