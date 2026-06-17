import assert from "node:assert/strict";
import test from "node:test";

import {
  FormGuard,
  handleRequest,
} from "../src/index.js";

const SITE_ORIGIN = "https://signals.forwardfuture.ai";
const WORKER_ORIGIN = "https://loop-library-forms.forwardfuture.ai";

class MemoryStorage {
  values = new Map();

  async delete(key) {
    return this.values.delete(key);
  }

  async get(key) {
    return this.values.get(key);
  }

  async put(key, value) {
    this.values.set(key, structuredClone(value));
  }
}

class MemoryGuardNamespace {
  objects = new Map();

  idFromName(name) {
    return name;
  }

  get(id) {
    if (!this.objects.has(id)) {
      this.objects.set(
        id,
        new FormGuard({ storage: new MemoryStorage() }),
      );
    }

    const guard = this.objects.get(id);

    return {
      fetch(input, init) {
        return guard.fetch(new Request(input, init));
      },
    };
  }
}

function makeEnv() {
  return {
    ALLOWED_ORIGINS: `${SITE_ORIGIN},http://localhost:4173`,
    FORM_GUARD: new MemoryGuardNamespace(),
    HERENOW_API_KEY: "test-here-now-key",
    HERENOW_SITE_SLUG: "test-loop-library",
    TURNSTILE_HOSTNAMES: "signals.forwardfuture.ai,localhost",
    TURNSTILE_SECRET_KEY: "test-turnstile-secret",
    TURNSTILE_SITE_KEY: "test-turnstile-site-key",
  };
}

function makeDependencies(options = {}) {
  const calls = {
    siteData: [],
    turnstile: [],
  };
  let siteDataFailuresRemaining = options.siteDataFailures || 0;

  return {
    calls,
    dependencies: {
      async fetch(input, init = {}) {
        const url = String(input);

        if (url.includes("/turnstile/v0/siteverify")) {
          const body = new URLSearchParams(init.body);
          const token = body.get("response");
          const action =
            token?.startsWith("weekly") ? "weekly_signup" : "submit_loop";
          calls.turnstile.push({
            action,
            idempotencyKey: body.get("idempotency_key"),
            remoteIp: body.get("remoteip"),
            token,
          });

          if (token === "invalid-token") {
            return Response.json(
              {
                success: false,
                "error-codes": ["invalid-input-response"],
              },
              { status: 200 },
            );
          }

          if (token === "wrong-action-token") {
            return Response.json({
              success: true,
              action: "wrong_action",
              hostname: "signals.forwardfuture.ai",
            });
          }

          return Response.json({
            success: true,
            action,
            hostname: "signals.forwardfuture.ai",
          });
        }

        if (url.startsWith("https://here.now/api/v1/publishes/")) {
          calls.siteData.push({
            authorization: new Headers(init.headers).get("Authorization"),
            body: JSON.parse(init.body),
            idempotencyKey: new Headers(init.headers).get("Idempotency-Key"),
            url,
          });

          if (siteDataFailuresRemaining > 0) {
            siteDataFailuresRemaining -= 1;
            return Response.json({ error: "Unavailable" }, { status: 503 });
          }

          return Response.json({ ok: true }, { status: 201 });
        }

        throw new Error(`Unexpected fetch: ${url}`);
      },
    },
  };
}

function makeRequest(path, body, options = {}) {
  const headers = {
    "CF-Connecting-IP": options.ip || "203.0.113.10",
    "Content-Type": "application/json",
  };

  if (options.origin !== null) {
    headers.Origin = options.origin || SITE_ORIGIN;
  }

  return new Request(`${WORKER_ORIGIN}${path}`, {
    method: options.method || "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function testUuid(index) {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function suggestionBody(overrides = {}) {
  return {
    honeypot: "",
    idempotency_key: testUuid(1),
    payload: {
      instructions: "Run the checks until every result passes.",
      loop_title: "The verified submission loop",
      name: "Test Contributor",
      source_url: "https://example.com/source",
    },
    permission: true,
    turnstile_token: "suggestion-token",
    ...overrides,
  };
}

function weeklyBody(overrides = {}) {
  return {
    honeypot: "",
    idempotency_key: testUuid(2),
    payload: {
      email: "Reader@Example.com",
    },
    turnstile_token: "weekly-token",
    ...overrides,
  };
}

test("rejects requests from origins outside the allowlist", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest("/suggestions", suggestionBody(), { origin: null }),
    env,
    undefined,
    dependencies,
  );

  assert.equal(response.status, 403);
  assert.equal(calls.turnstile.length, 0);
  assert.equal(calls.siteData.length, 0);
});

test("returns public Turnstile configuration to allowed origins", async () => {
  const env = makeEnv();
  const response = await handleRequest(
    new Request(`${WORKER_ORIGIN}/config`, {
      headers: { Origin: SITE_ORIGIN },
    }),
    env,
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.turnstileSiteKey, env.TURNSTILE_SITE_KEY);
  assert.deepEqual(body.actions, {
    suggestions: "submit_loop",
    weeklySignups: "weekly_signup",
  });
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), SITE_ORIGIN);
});

test("validates Turnstile before writing a loop suggestion", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest("/suggestions", suggestionBody()),
    env,
    undefined,
    dependencies,
  );

  assert.equal(response.status, 201);
  assert.equal(calls.turnstile.length, 1);
  assert.equal(calls.turnstile[0].action, "submit_loop");
  assert.equal(calls.turnstile[0].remoteIp, "203.0.113.10");
  assert.equal(calls.siteData.length, 1);
  assert.equal(
    calls.siteData[0].url,
    "https://here.now/api/v1/publishes/test-loop-library/data/suggestions",
  );
  assert.equal(
    calls.siteData[0].authorization,
    "Bearer test-here-now-key",
  );
  assert.equal(
    calls.siteData[0].idempotencyKey,
    testUuid(1),
  );
  assert.deepEqual(calls.siteData[0].body, {
    instructions: "Run the checks until every result passes.",
    loop_title: "The verified submission loop",
    name: "Test Contributor",
    source_url: "https://example.com/source",
  });
});

test("rejects invalid or mismatched Turnstile tokens without writing", async () => {
  for (const token of ["invalid-token", "wrong-action-token"]) {
    const env = makeEnv();
    const { calls, dependencies } = makeDependencies();
    const response = await handleRequest(
      makeRequest(
        "/suggestions",
        suggestionBody({ turnstile_token: token }),
      ),
      env,
      undefined,
      dependencies,
    );

    assert.equal(response.status, 400);
    assert.equal(calls.siteData.length, 0);
  }
});

test("normalizes and stores weekly signups only after verification", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest("/weekly-signups", weeklyBody()),
    env,
    undefined,
    dependencies,
  );

  assert.equal(response.status, 201);
  assert.equal(calls.turnstile[0].action, "weekly_signup");
  assert.equal(calls.siteData.length, 1);
  assert.deepEqual(calls.siteData[0].body, {
    email: "reader@example.com",
  });
  assert.match(calls.siteData[0].url, /data\/weekly_signups$/);
});

test("honeypot submissions receive a fake success without external calls", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({
        honeypot: "Spam Incorporated",
        turnstile_token: "",
      }),
    ),
    env,
    undefined,
    dependencies,
  );

  assert.equal(response.status, 202);
  assert.equal(calls.turnstile.length, 0);
  assert.equal(calls.siteData.length, 0);
});

test("enforces hourly limits after valid Turnstile checks", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();

  for (let index = 0; index < 3; index += 1) {
    const response = await handleRequest(
      makeRequest(
        "/suggestions",
        suggestionBody({
          idempotency_key: testUuid(100 + index),
          payload: {
            instructions: `Run distinct verification sequence ${index}.`,
            loop_title: `Rate limit loop ${index}`,
          },
          turnstile_token: `suggestion-token-${index}`,
        }),
      ),
      env,
      undefined,
      dependencies,
    );

    assert.equal(response.status, 201);
  }

  const blocked = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({
        idempotency_key: testUuid(103),
        payload: {
          instructions: "This request should exceed the hourly allowance.",
          loop_title: "Rate limit loop blocked",
        },
        turnstile_token: "suggestion-token-blocked",
      }),
    ),
    env,
    undefined,
    dependencies,
  );

  assert.equal(blocked.status, 429);
  assert(Number(blocked.headers.get("Retry-After")) > 0);
  assert.equal(calls.siteData.length, 3);
});

test("suppresses duplicate content after verification", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const first = await handleRequest(
    makeRequest("/suggestions", suggestionBody()),
    env,
    undefined,
    dependencies,
  );
  const duplicate = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({
        idempotency_key: testUuid(3),
        turnstile_token: "suggestion-token-2",
      }),
    ),
    env,
    undefined,
    dependencies,
  );

  assert.equal(first.status, 201);
  assert.equal(duplicate.status, 202);
  assert.equal(calls.turnstile.length, 2);
  assert.equal(calls.siteData.length, 1);
});

test("releases duplicate reservations when Site Data is unavailable", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies({
    siteDataFailures: 1,
  });
  const first = await handleRequest(
    makeRequest("/suggestions", suggestionBody()),
    env,
    undefined,
    dependencies,
  );
  const retry = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({
        idempotency_key: testUuid(4),
        turnstile_token: "suggestion-token-retry",
      }),
    ),
    env,
    undefined,
    dependencies,
  );

  assert.equal(first.status, 502);
  assert.equal(retry.status, 201);
  assert.equal(calls.siteData.length, 2);
});

test("rejects reuse of an idempotency key for a changed record", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const first = await handleRequest(
    makeRequest("/suggestions", suggestionBody()),
    env,
    undefined,
    dependencies,
  );
  const conflict = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({
        payload: {
          instructions: "Run the checks until every result passes.",
          loop_title: "The verified submission loop",
          name: "A different contributor",
          source_url: "https://example.com/another-source",
        },
        turnstile_token: "suggestion-token-conflict",
      }),
      { ip: "203.0.113.11" },
    ),
    env,
    undefined,
    dependencies,
  );
  const body = await conflict.json();

  assert.equal(first.status, 201);
  assert.equal(conflict.status, 409);
  assert.equal(body.code, "idempotency_conflict");
  assert.equal(calls.siteData.length, 1);
});

test("replays the same idempotent request across an IP change", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const first = await handleRequest(
    makeRequest("/suggestions", suggestionBody()),
    env,
    undefined,
    dependencies,
  );
  const replay = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({ turnstile_token: "suggestion-token-replay" }),
      { ip: "203.0.113.12" },
    ),
    env,
    undefined,
    dependencies,
  );

  assert.equal(first.status, 201);
  assert.equal(replay.status, 202);
  assert.equal(calls.siteData.length, 1);
});
