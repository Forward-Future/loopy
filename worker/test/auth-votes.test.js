import assert from "node:assert/strict";
import test from "node:test";

import { handleAuthVoteRoute } from "../src/auth-votes.js";

const ORIGIN = "https://signals.forwardfuture.ai";
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
    PUBLIC_SITE_HOSTNAME: "signals.forwardfuture.ai",
    PUBLIC_SITE_PATH: "/loop-library",
    SESSION_SECRET: "test-session-secret-that-is-more-than-32-characters",
    VOTING_UI_ENABLED: "true",
    VOTE_STORE: new MemoryVoteNamespace(),
  };
}

function cookiePair(setCookie, name) {
  const match = setCookie.match(new RegExp(`(?:^|, )(${name}=[^;]+)`));
  assert(match, `${name} cookie missing from ${setCookie}`);
  return match[1];
}

async function githubSession(env) {
  const start = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/github?return_to=%2Floop-library%2Floops%2Fovernight-docs-sweep%2F`),
    env,
  );
  assert.equal(start.status, 302);
  const authorization = new URL(start.headers.get("Location"));
  assert.equal(authorization.origin, "https://github.com");
  assert.equal(authorization.searchParams.get("scope"), "read:user");
  const state = authorization.searchParams.get("state");
  const oauthCookie = cookiePair(start.headers.get("Set-Cookie"), "ll_oauth");
  const calls = [];
  const callback = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/callback/github?code=test-code&state=${state}`, {
      headers: { Cookie: oauthCookie },
    }),
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
  assert.equal(callback.status, 302);
  assert.equal(
    callback.headers.get("Location"),
    `${BASE}/loops/overnight-docs-sweep/`,
  );
  assert.equal(calls.length, 2);
  assert.equal(
    new Headers(calls[1].init.headers).get("Authorization"),
    "Bearer github-access-token",
  );
  return cookiePair(callback.headers.get("Set-Cookie"), "ll_session");
}

test("GitHub OAuth creates a signed session that can cast, switch, and remove a vote", async () => {
  const env = makeEnv();
  const sessionCookie = await githubSession(env);
  const voteRequest = (value, origin = ORIGIN) => new Request(
    `${BASE}/api/loops/overnight-docs-sweep/vote`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
        Origin: origin,
      },
      body: JSON.stringify({ value }),
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

  const totals = await handleAuthVoteRoute(
    new Request(`${BASE}/api/votes`, { headers: { Cookie: sessionCookie } }),
    env,
  );
  const totalsBody = await totals.json();
  assert.deepEqual(totalsBody.viewer, {
    provider: "github",
    username: "octoloop",
    name: "Octo Loop",
  });
  assert.equal(totalsBody.viewerVotes["overnight-docs-sweep"], -1);
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

  const sessionCookie = await githubSession(env);
  const crossSite = await handleAuthVoteRoute(
    new Request(`${BASE}/api/loops/overnight-docs-sweep/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
        Origin: "https://phishing.example",
      },
      body: JSON.stringify({ value: 1 }),
    }),
    env,
  );
  assert.equal(crossSite.status, 403);

  const malformed = await handleAuthVoteRoute(
    new Request(`${BASE}/api/loops/overnight-docs-sweep/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
        Origin: ORIGIN,
      },
      body: JSON.stringify({ value: 2 }),
    }),
    env,
  );
  assert.equal(malformed.status, 400);

  const unpublished = await handleAuthVoteRoute(
    new Request(`${BASE}/api/loops/not-published/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
        Origin: ORIGIN,
      },
      body: JSON.stringify({ value: 1 }),
    }),
    env,
  );
  assert.equal(unpublished.status, 404);
});

test("GitHub OAuth state is verified and X routes are absent", async () => {
  const env = makeEnv();
  const githubStart = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/github?return_to=%2Floop-library%2F`),
    env,
  );

  const invalidCallback = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/callback/github?code=test-code&state=wrong-state`, {
      headers: { Cookie: cookiePair(githubStart.headers.get("Set-Cookie"), "ll_oauth") },
    }),
    env,
  );
  assert.equal(invalidCallback.status, 302);
  assert.match(invalidCallback.headers.get("Location"), /auth_error=invalid_state/);

  assert.equal(
    await handleAuthVoteRoute(new Request(`${BASE}/auth/x`), env),
    null,
  );
});

test("logout requires a trusted origin and clears the session", async () => {
  const env = makeEnv();
  const rejected = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/logout`, { method: "POST" }),
    env,
  );
  assert.equal(rejected.status, 403);

  const accepted = await handleAuthVoteRoute(
    new Request(`${BASE}/auth/logout`, {
      method: "POST",
      headers: { Origin: ORIGIN },
    }),
    env,
  );
  assert.equal(accepted.status, 200);
  assert.match(accepted.headers.get("Set-Cookie"), /ll_session=;/);
  assert.match(accepted.headers.get("Set-Cookie"), /Max-Age=0/);
});
