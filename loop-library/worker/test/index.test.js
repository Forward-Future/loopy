import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  FormGuard,
  handleRequest,
} from "../src/index.js";

const SITE_ORIGIN = "https://signals.forwardfuture.com";
const WORKER_ORIGIN = "https://loop-library-forms.mberman84.workers.dev";

class MemoryStorage {
  values = new Map();
  alarmAt = null;

  async deleteAll() {
    this.values.clear();
  }

  async deleteAlarm() {
    this.alarmAt = null;
  }

  async delete(key) {
    return this.values.delete(key);
  }

  async get(key) {
    return this.values.get(key);
  }

  async getAlarm() {
    return this.alarmAt;
  }

  async put(key, value) {
    this.values.set(key, structuredClone(value));
  }

  async setAlarm(scheduledTime) {
    this.alarmAt = Number(scheduledTime);
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

function makeEnv(options = {}) {
  return {
    ALLOWED_ORIGINS: `${SITE_ORIGIN},http://localhost:4173`,
    FORM_GUARD: new MemoryGuardNamespace(),
    HERENOW_API_KEY: "test-here-now-key",
    HERENOW_SITE_SLUG: "test-loop-library",
    TURNSTILE_RATE_LIMITER: {
      async limit({ key }) {
        options.rateLimitCalls?.push(key);
        return { success: options.verificationAllowed !== false };
      },
    },
    TURNSTILE_HOSTNAMES: "signals.forwardfuture.com,localhost",
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
              hostname: "signals.forwardfuture.com",
            });
          }

          if (token === "wrong-hostname-token") {
            return Response.json({
              success: true,
              action,
              hostname: "phishing.example.com",
            });
          }

          return Response.json({
            success: true,
            action,
            hostname: "signals.forwardfuture.com",
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

// Seeds the guard with events ~5h old so only the daily cap can trip.
async function seedRateEvents(env, ip, form, count) {
  const name = `rate:${createHash("sha256").update(ip).digest("hex")}`;
  env.FORM_GUARD.get(env.FORM_GUARD.idFromName(name));
  const guard = env.FORM_GUARD.objects.get(name);
  const at = Date.now() - 5 * 60 * 60 * 1000;
  await guard.state.storage.put(
    "events",
    Array.from({ length: count }, (_, index) => ({
      at: at + index,
      form,
      idempotencyKey: testUuid(900 + index),
      requestHash: "b".repeat(64),
    })),
  );
}

function suggestionBody(overrides = {}) {
  return {
    form_elapsed_ms: 1200,
    honeypot: "",
    idempotency_key: testUuid(1),
    payload: {
      instructions: "Run the checks until every result passes.",
      loop_title: "The verified submission loop",
      name: "Test Contributor",
      source_url: "https://example.com/source",
      x_handle: "test_builder",
    },
    permission: true,
    turnstile_token: "suggestion-token",
    ...overrides,
  };
}

function weeklyBody(overrides = {}) {
  return {
    form_elapsed_ms: 800,
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
    x_handle: "@test_builder",
  });
});

test("rejects malformed optional X handles without writing", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({
        payload: {
          instructions: "Run the checks until every result passes.",
          loop_title: "The verified submission loop",
          x_handle: "bad handle",
        },
      }),
    ),
    env,
    undefined,
    dependencies,
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, "invalid_x_handle");
  assert.equal(calls.turnstile.length, 0);
  assert.equal(calls.siteData.length, 0);
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

test("rejects Turnstile tokens verified for an unlisted hostname", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({ turnstile_token: "wrong-hostname-token" }),
    ),
    env,
    undefined,
    dependencies,
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, "verification_failed");
  assert.equal(calls.turnstile.length, 1);
  assert.equal(calls.siteData.length, 0);
});

test("rate limits invalid-token floods before calling Siteverify", async () => {
  const rateLimitCalls = [];
  const env = makeEnv({
    rateLimitCalls,
    verificationAllowed: false,
  });
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({ turnstile_token: "invalid-token" }),
    ),
    env,
    undefined,
    dependencies,
  );
  const body = await response.json();

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.equal(
    response.headers.get("Access-Control-Expose-Headers"),
    "Retry-After",
  );
  assert.equal(body.code, "rate_limited");
  assert.deepEqual(rateLimitCalls, ["suggestions:203.0.113.10"]);
  assert.equal(calls.turnstile.length, 0);
  assert.equal(calls.siteData.length, 0);
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

test("enforces the suggestion daily cap once the hourly window has cleared", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  await seedRateEvents(env, "203.0.113.10", "suggestions", 10);

  const blocked = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({
        idempotency_key: testUuid(110),
        payload: {
          instructions: "This request should exceed the daily allowance.",
          loop_title: "Daily limit loop blocked",
        },
        turnstile_token: "suggestion-token-daily",
      }),
    ),
    env,
    undefined,
    dependencies,
  );
  const body = await blocked.json();

  assert.equal(blocked.status, 429);
  assert.equal(body.code, "rate_limited");
  assert(Number(blocked.headers.get("Retry-After")) > 3600);
  assert.equal(calls.turnstile.length, 1);
  assert.equal(calls.siteData.length, 0);
});

test("enforces hourly limits on weekly signups", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();

  for (let index = 0; index < 5; index += 1) {
    const response = await handleRequest(
      makeRequest(
        "/weekly-signups",
        weeklyBody({
          idempotency_key: testUuid(200 + index),
          payload: { email: `reader-${index}@example.com` },
          turnstile_token: `weekly-token-${index}`,
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
      "/weekly-signups",
      weeklyBody({
        idempotency_key: testUuid(205),
        payload: { email: "reader-blocked@example.com" },
        turnstile_token: "weekly-token-blocked",
      }),
    ),
    env,
    undefined,
    dependencies,
  );
  const body = await blocked.json();

  assert.equal(blocked.status, 429);
  assert.equal(body.code, "rate_limited");
  assert(Number(blocked.headers.get("Retry-After")) > 0);
  assert.equal(calls.siteData.length, 5);
});

test("enforces the weekly signup daily cap once the hourly window has cleared", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  await seedRateEvents(env, "203.0.113.10", "weekly_signups", 10);

  const blocked = await handleRequest(
    makeRequest(
      "/weekly-signups",
      weeklyBody({
        idempotency_key: testUuid(210),
        payload: { email: "reader-daily@example.com" },
        turnstile_token: "weekly-token-daily",
      }),
    ),
    env,
    undefined,
    dependencies,
  );
  const body = await blocked.json();

  assert.equal(blocked.status, 429);
  assert.equal(body.code, "rate_limited");
  assert(Number(blocked.headers.get("Retry-After")) > 3600);
  assert.equal(calls.turnstile.length, 1);
  assert.equal(calls.siteData.length, 0);
});

test("suffix-allowed origins still depend on Turnstile hostname verification", async () => {
  const env = { ...makeEnv(), ALLOWED_ORIGIN_SUFFIXES: ".here.now" };
  const { calls, dependencies } = makeDependencies();
  const origin = "https://evil.here.now";
  const response = await handleRequest(
    makeRequest(
      "/suggestions",
      suggestionBody({ turnstile_token: "wrong-hostname-token" }),
      { origin },
    ),
    env,
    undefined,
    dependencies,
  );
  const body = await response.json();

  // The suffix branch admits the origin; Turnstile's hostname check is the gate.
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.notEqual(body.code, "origin_not_allowed");
  assert.equal(response.status, 400);
  assert.equal(body.code, "verification_failed");
  assert.equal(calls.turnstile.length, 1);
  assert.equal(calls.siteData.length, 0);
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

test("Durable Object alarms physically remove expired guard state", async () => {
  const originalNow = Date.now;
  let now = 1_800_000_000_000;
  Date.now = () => now;

  try {
    const requestHash = "a".repeat(64);
    const cases = [
      {
        path: "/rate",
        body: {
          dailyLimit: 10,
          form: "suggestions",
          hourlyLimit: 3,
          idempotencyKey: testUuid(901),
          requestHash,
        },
        expiresAt: () => now + 24 * 60 * 60 * 1000,
      },
      {
        path: "/dedupe/reserve",
        body: {
          idempotencyKey: testUuid(902),
          ttlMs: 1000,
        },
        expiresAt: () => now + 1000,
      },
      {
        path: "/idempotency/bind",
        body: {
          form: "suggestions",
          idempotencyKey: testUuid(903),
          requestHash,
          ttlMs: 1000,
        },
        expiresAt: () => now + 1000,
      },
    ];

    for (const entry of cases) {
      const storage = new MemoryStorage();
      const guard = new FormGuard({ storage });
      const expiresAt = entry.expiresAt();
      const response = await guard.fetch(
        new Request(`https://form-guard${entry.path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry.body),
        }),
      );

      assert.equal(response.status, 200);
      assert.equal(storage.alarmAt, expiresAt);
      assert(storage.values.size > 0);

      now = expiresAt + 1;
      await guard.alarm();

      assert.equal(storage.values.size, 0);
      assert.equal(storage.alarmAt, null);
      now += 1000;
    }
  } finally {
    Date.now = originalNow;
  }
});

test("suggestions submitted too fast receive the honeypot response without external calls", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest("/suggestions", suggestionBody({ form_elapsed_ms: 10 })),
    env,
    undefined,
    dependencies,
  );

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(calls.turnstile.length, 0);
  assert.equal(calls.siteData.length, 0);
});

test("weekly signups submitted too fast receive the honeypot response without external calls", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest("/weekly-signups", weeklyBody({ form_elapsed_ms: 10 })),
    env,
    undefined,
    dependencies,
  );

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(calls.turnstile.length, 0);
  assert.equal(calls.siteData.length, 0);
});

test("missing or non-integer form_elapsed_ms receives the honeypot response", async () => {
  for (const form_elapsed_ms of [undefined, "1200", 1200.5]) {
    const env = makeEnv();
    const { calls, dependencies } = makeDependencies();
    const response = await handleRequest(
      makeRequest("/suggestions", suggestionBody({ form_elapsed_ms })),
      env,
      undefined,
      dependencies,
    );

    assert.equal(response.status, 202);
    assert.equal(calls.turnstile.length, 0);
    assert.equal(calls.siteData.length, 0);
  }
});

test("suggestions at the minimum completion time proceed normally", async () => {
  const env = makeEnv();
  const { calls, dependencies } = makeDependencies();
  const response = await handleRequest(
    makeRequest("/suggestions", suggestionBody({ form_elapsed_ms: 1200 })),
    env,
    undefined,
    dependencies,
  );

  assert.equal(response.status, 201);
  assert.equal(calls.turnstile.length, 1);
  assert.equal(calls.siteData.length, 1);
});
