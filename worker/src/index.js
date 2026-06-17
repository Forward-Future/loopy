const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const HERENOW_API_BASE = "https://here.now/api/v1/publishes";
const MAX_REQUEST_BYTES = 16_384;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const FORM_DEFINITIONS = {
  "/suggestions": {
    action: "submit_loop",
    collection: "suggestions",
    hourlyLimit: 3,
    dailyLimit: 10,
    duplicateWindowMs: DAY_MS,
    rateLimitMessage:
      "This connection has reached the submission limit. Try again later.",
    fallbackMessage: "The suggestion could not be submitted.",
    validate: validateSuggestion,
    fingerprint(record) {
      return `${record.loop_title.toLowerCase()}\n${record.instructions
        .toLowerCase()
        .replace(/\s+/g, " ")}`;
    },
  },
  "/weekly-signups": {
    action: "weekly_signup",
    collection: "weekly_signups",
    hourlyLimit: 5,
    dailyLimit: 10,
    duplicateWindowMs: DAY_MS,
    rateLimitMessage:
      "This connection has reached the signup limit. Try again later.",
    fallbackMessage: "The signup could not be submitted.",
    validate: validateWeeklySignup,
    fingerprint(record) {
      return record.email;
    },
  },
};

class RequestError extends Error {
  constructor(status, code, message, headers = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

export default {
  fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};

export async function handleRequest(
  request,
  env,
  _ctx,
  dependencies = { fetch: globalThis.fetch },
) {
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin, env);

  if (!corsHeaders) {
    return jsonResponse(
      { error: "Forbidden", code: "origin_not_allowed" },
      403,
    );
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(request.url);

  if (url.pathname === "/config") {
    if (request.method !== "GET") {
      return methodNotAllowed(corsHeaders, "GET, OPTIONS");
    }

    if (!env.TURNSTILE_SITE_KEY) {
      return jsonResponse(
        {
          error: "Form protection is temporarily unavailable.",
          code: "gateway_not_configured",
        },
        503,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        turnstileSiteKey: env.TURNSTILE_SITE_KEY,
        actions: {
          suggestions: FORM_DEFINITIONS["/suggestions"].action,
          weeklySignups: FORM_DEFINITIONS["/weekly-signups"].action,
        },
      },
      200,
      corsHeaders,
    );
  }

  const definition = FORM_DEFINITIONS[url.pathname];

  if (!definition) {
    return jsonResponse(
      { error: "Not found", code: "not_found" },
      404,
      corsHeaders,
    );
  }

  if (request.method !== "POST") {
    return methodNotAllowed(corsHeaders, "POST, OPTIONS");
  }

  try {
    assertConfigured(env);
    const body = await readJsonBody(request);

    if (readOptionalString(body.honeypot, 200)) {
      return jsonResponse({ ok: true }, 202, corsHeaders);
    }

    const idempotencyKey = readIdempotencyKey(body.idempotency_key);
    const turnstileToken = readTurnstileToken(body.turnstile_token);
    const record = definition.validate(body.payload, body.permission);
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const turnstileResult = await verifyTurnstile(
      env,
      turnstileToken,
      definition.action,
      idempotencyKey,
      clientIp,
      dependencies.fetch,
    );

    if (!turnstileResult.valid) {
      console.warn("Turnstile rejected a form submission", {
        form: definition.collection,
        reason: turnstileResult.reason,
      });
      throw new RequestError(
        400,
        "verification_failed",
        "Complete the verification check and try again.",
      );
    }

    const requestHash = await sha256Hex(
      `${definition.collection}:${JSON.stringify(record)}`,
    );
    const fingerprint = await sha256Hex(
      `${definition.collection}:${definition.fingerprint(record)}`,
    );
    const existingBinding = await checkIdempotencyBinding(
      env,
      idempotencyKey,
      requestHash,
      definition.collection,
    );

    if (existingBinding.conflict) {
      throw new RequestError(
        409,
        "idempotency_conflict",
        "The form session is invalid. Refresh and try again.",
      );
    }

    if (!existingBinding.replay) {
      const rateResult = await checkRateLimit(
        env,
        clientIp,
        definition,
        idempotencyKey,
        requestHash,
      );

      if (rateResult.conflict) {
        throw new RequestError(
          409,
          "idempotency_conflict",
          "The form session is invalid. Refresh and try again.",
        );
      }

      if (!rateResult.allowed) {
        throw new RequestError(
          429,
          "rate_limited",
          definition.rateLimitMessage,
          { "Retry-After": String(rateResult.retryAfter) },
        );
      }

      const binding = await bindIdempotency(
        env,
        idempotencyKey,
        requestHash,
        definition.collection,
      );

      if (binding.conflict) {
        throw new RequestError(
          409,
          "idempotency_conflict",
          "The form session is invalid. Refresh and try again.",
        );
      }
    }

    const reservation = await reserveFingerprint(
      env,
      fingerprint,
      definition.duplicateWindowMs,
      idempotencyKey,
    );

    if (reservation.duplicate || reservation.replay) {
      return jsonResponse({ ok: true }, 202, corsHeaders);
    }

    try {
      await writeSiteData(
        env,
        definition.collection,
        record,
        idempotencyKey,
        definition.rateLimitMessage,
        definition.fallbackMessage,
        dependencies.fetch,
      );
    } catch (error) {
      await releaseFingerprint(env, fingerprint, idempotencyKey);
      throw error;
    }

    return jsonResponse({ ok: true }, 201, corsHeaders);
  } catch (error) {
    if (error instanceof RequestError) {
      return jsonResponse(
        { error: error.message, code: error.code },
        error.status,
        { ...corsHeaders, ...error.headers },
      );
    }

    console.error("Unexpected form gateway failure", {
      form: definition.collection,
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      {
        error: definition.fallbackMessage,
        code: "gateway_error",
      },
      502,
      corsHeaders,
    );
  }
}

function getCorsHeaders(origin, env) {
  if (!origin) {
    return null;
  }

  const exactOriginAllowed = parseList(env.ALLOWED_ORIGINS).includes(origin);
  let suffixOriginAllowed = false;

  if (!exactOriginAllowed) {
    try {
      const parsedOrigin = new URL(origin);
      suffixOriginAllowed =
        parsedOrigin.protocol === "https:" &&
        !parsedOrigin.port &&
        parseList(env.ALLOWED_ORIGIN_SUFFIXES).some((suffix) =>
          parsedOrigin.hostname.endsWith(suffix),
        );
    } catch {
      suffixOriginAllowed = false;
    }
  }

  if (!exactOriginAllowed && !suffixOriginAllowed) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function methodNotAllowed(corsHeaders, allow) {
  return jsonResponse(
    { error: "Method not allowed", code: "method_not_allowed" },
    405,
    { ...corsHeaders, Allow: allow },
  );
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function assertConfigured(env) {
  for (const name of [
    "FORM_GUARD",
    "HERENOW_API_KEY",
    "HERENOW_SITE_SLUG",
    "TURNSTILE_HOSTNAMES",
    "TURNSTILE_SECRET_KEY",
  ]) {
    if (!env[name]) {
      throw new RequestError(
        503,
        "gateway_not_configured",
        "Form protection is temporarily unavailable.",
      );
    }
  }
}

async function readJsonBody(request) {
  const contentType = request.headers.get("Content-Type") || "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new RequestError(
      415,
      "unsupported_media_type",
      "Send the form as JSON.",
    );
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    throw new RequestError(413, "request_too_large", "The form is too large.");
  }

  const text = await request.text();

  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    throw new RequestError(413, "request_too_large", "The form is too large.");
  }

  try {
    const body = JSON.parse(text);

    if (!isPlainObject(body)) {
      throw new Error("Expected an object");
    }

    return body;
  } catch {
    throw new RequestError(400, "invalid_json", "The form data is invalid.");
  }
}

function readIdempotencyKey(value) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new RequestError(
      400,
      "invalid_idempotency_key",
      "The form session is invalid. Refresh and try again.",
    );
  }

  return value;
}

function readTurnstileToken(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2048
  ) {
    throw new RequestError(
      400,
      "verification_required",
      "Complete the verification check and try again.",
    );
  }

  return value;
}

function validateSuggestion(payload, permission) {
  if (!isPlainObject(payload) || permission !== true) {
    throw new RequestError(
      400,
      "invalid_submission",
      "Confirm you have the right to share this loop.",
    );
  }

  const record = {
    loop_title: readRequiredString(payload.loop_title, 120, "Loop title"),
    instructions: readRequiredString(
      payload.instructions,
      3000,
      "Prompt or instructions",
    ),
  };
  const name = readOptionalString(payload.name, 80);
  const sourceUrl = readOptionalString(payload.source_url, 300);

  if (name) {
    record.name = name;
  }

  if (sourceUrl) {
    let parsedUrl;

    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      throw new RequestError(
        400,
        "invalid_source_url",
        "Enter a valid source link.",
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new RequestError(
        400,
        "invalid_source_url",
        "Enter a valid source link.",
      );
    }

    record.source_url = sourceUrl;
  }

  return record;
}

function validateWeeklySignup(payload) {
  if (!isPlainObject(payload)) {
    throw new RequestError(
      400,
      "invalid_signup",
      "Enter a valid email address.",
    );
  }

  const email = readRequiredString(payload.email, 160, "Email address")
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestError(
      400,
      "invalid_email",
      "Enter a valid email address.",
    );
  }

  return { email };
}

function readRequiredString(value, maxLength, label) {
  if (typeof value !== "string") {
    throw new RequestError(
      400,
      "invalid_field",
      `${label} is required.`,
    );
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > maxLength) {
    throw new RequestError(
      400,
      "invalid_field",
      `${label} is invalid.`,
    );
  }

  return normalized;
}

function readOptionalString(value, maxLength) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new RequestError(400, "invalid_field", "The form data is invalid.");
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new RequestError(400, "invalid_field", "The form data is invalid.");
  }

  return normalized || undefined;
}

async function verifyTurnstile(
  env,
  token,
  expectedAction,
  idempotencyKey,
  clientIp,
  fetchImpl,
) {
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    idempotency_key: idempotencyKey,
  });

  if (clientIp !== "unknown") {
    body.set("remoteip", clientIp);
  }

  let response;
  let result;

  try {
    response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    result = await response.json();
  } catch {
    return { valid: false, reason: "siteverify_unavailable" };
  }

  if (!response.ok || !result.success) {
    return { valid: false, reason: "siteverify_rejected" };
  }

  if (result.action !== expectedAction) {
    return { valid: false, reason: "action_mismatch" };
  }

  if (!parseList(env.TURNSTILE_HOSTNAMES).includes(result.hostname)) {
    return { valid: false, reason: "hostname_mismatch" };
  }

  return { valid: true };
}

async function checkRateLimit(
  env,
  clientIp,
  definition,
  idempotencyKey,
  requestHash,
) {
  const ipHash = await sha256Hex(clientIp);
  return callGuard(
    env,
    `rate:${ipHash}`,
    "/rate",
    {
      form: definition.collection,
      hourlyLimit: definition.hourlyLimit,
      dailyLimit: definition.dailyLimit,
      idempotencyKey,
      requestHash,
    },
  );
}

async function checkIdempotencyBinding(
  env,
  idempotencyKey,
  requestHash,
  form,
) {
  return callGuard(
    env,
    `idempotency:${idempotencyKey}`,
    "/idempotency/check",
    { form, idempotencyKey, requestHash },
  );
}

async function bindIdempotency(
  env,
  idempotencyKey,
  requestHash,
  form,
) {
  return callGuard(
    env,
    `idempotency:${idempotencyKey}`,
    "/idempotency/bind",
    {
      form,
      idempotencyKey,
      requestHash,
      ttlMs: DAY_MS,
    },
  );
}

async function reserveFingerprint(
  env,
  fingerprint,
  ttlMs,
  idempotencyKey,
) {
  return callGuard(
    env,
    `dedupe:${fingerprint}`,
    "/dedupe/reserve",
    { ttlMs, idempotencyKey },
  );
}

async function releaseFingerprint(env, fingerprint, idempotencyKey) {
  try {
    await callGuard(
      env,
      `dedupe:${fingerprint}`,
      "/dedupe/release",
      { idempotencyKey },
    );
  } catch (error) {
    console.error("Failed to release a form deduplication reservation", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function callGuard(env, name, pathname, body) {
  const id = env.FORM_GUARD.idFromName(name);
  const response = await env.FORM_GUARD.get(id).fetch(
    `https://form-guard${pathname}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error(`Form guard failed with ${response.status}`);
  }

  return response.json();
}

async function writeSiteData(
  env,
  collection,
  record,
  idempotencyKey,
  rateLimitMessage,
  fallbackMessage,
  fetchImpl,
) {
  const slug = encodeURIComponent(env.HERENOW_SITE_SLUG);
  const endpoint = `${HERENOW_API_BASE}/${slug}/data/${collection}`;
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.HERENOW_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(record),
  });

  if (response.ok) {
    return;
  }

  console.error("here.now Site Data write failed", {
    collection,
    status: response.status,
  });

  if (response.status === 429) {
    throw new RequestError(
      429,
      "rate_limited",
      rateLimitMessage,
    );
  }

  throw new RequestError(
    502,
    "storage_unavailable",
    `${fallbackMessage} Try again in a moment.`,
  );
}

function parseList(value = "") {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export class FormGuard {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid request" }, 400);
    }

    if (url.pathname === "/rate") {
      return this.rate(body);
    }

    if (url.pathname === "/dedupe/reserve") {
      return this.reserve(body);
    }

    if (url.pathname === "/dedupe/release") {
      return this.release(body);
    }

    if (url.pathname === "/idempotency/check") {
      return this.idempotency(body, false);
    }

    if (url.pathname === "/idempotency/bind") {
      return this.idempotency(body, true);
    }

    return jsonResponse({ error: "Not found" }, 404);
  }

  async rate(body) {
    const now = Date.now();
    const hourlyLimit = Number(body.hourlyLimit);
    const dailyLimit = Number(body.dailyLimit);

    if (
      typeof body.form !== "string" ||
      typeof body.idempotencyKey !== "string" ||
      typeof body.requestHash !== "string" ||
      !/^[0-9a-f]{64}$/.test(body.requestHash) ||
      !Number.isInteger(hourlyLimit) ||
      hourlyLimit < 1 ||
      !Number.isInteger(dailyLimit) ||
      dailyLimit < hourlyLimit
    ) {
      return jsonResponse({ error: "Invalid request" }, 400);
    }

    const stored = (await this.state.storage.get("events")) || [];
    const events = stored.filter(
      (event) =>
        Number.isFinite(event.at) &&
        event.at > now - DAY_MS &&
        typeof event.form === "string" &&
        typeof event.idempotencyKey === "string" &&
        typeof event.requestHash === "string",
    );
    const priorRequest = events.find(
      (event) => event.idempotencyKey === body.idempotencyKey,
    );

    if (
      priorRequest &&
      priorRequest.form === body.form &&
      priorRequest.requestHash === body.requestHash
    ) {
      return jsonResponse({ allowed: true, replay: true });
    }

    if (priorRequest) {
      return jsonResponse({
        allowed: false,
        conflict: true,
        retryAfter: 0,
      });
    }

    const formEvents = events
      .filter((event) => event.form === body.form)
      .sort((left, right) => left.at - right.at);
    const hourEvents = formEvents.filter((event) => event.at > now - HOUR_MS);
    const hourRetry =
      hourEvents.length >= hourlyLimit
        ? Math.ceil((hourEvents[0].at + HOUR_MS - now) / 1000)
        : 0;
    const dayRetry =
      formEvents.length >= dailyLimit
        ? Math.ceil((formEvents[0].at + DAY_MS - now) / 1000)
        : 0;
    const retryAfter = Math.max(hourRetry, dayRetry);

    if (retryAfter > 0) {
      if (events.length !== stored.length) {
        await this.state.storage.put("events", events);
      }

      return jsonResponse({
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
      });
    }

    events.push({
      at: now,
      form: body.form,
      idempotencyKey: body.idempotencyKey,
      requestHash: body.requestHash,
    });
    await this.state.storage.put("events", events);

    return jsonResponse({ allowed: true, replay: false });
  }

  async reserve(body) {
    const now = Date.now();
    const ttlMs = Number(body.ttlMs);

    if (
      typeof body.idempotencyKey !== "string" ||
      !Number.isInteger(ttlMs) ||
      ttlMs < 1000 ||
      ttlMs > 30 * DAY_MS
    ) {
      return jsonResponse({ error: "Invalid request" }, 400);
    }

    const entry = await this.state.storage.get("reservation");

    if (entry?.expiresAt > now) {
      return jsonResponse({
        duplicate: entry.idempotencyKey !== body.idempotencyKey,
        replay: entry.idempotencyKey === body.idempotencyKey,
      });
    }

    await this.state.storage.put("reservation", {
      expiresAt: now + ttlMs,
      idempotencyKey: body.idempotencyKey,
    });

    return jsonResponse({ duplicate: false, replay: false });
  }

  async idempotency(body, shouldBind) {
    const now = Date.now();
    const ttlMs = Number(body.ttlMs || DAY_MS);

    if (
      typeof body.form !== "string" ||
      typeof body.idempotencyKey !== "string" ||
      typeof body.requestHash !== "string" ||
      !/^[0-9a-f]{64}$/.test(body.requestHash) ||
      !Number.isInteger(ttlMs) ||
      ttlMs < 1000 ||
      ttlMs > 30 * DAY_MS
    ) {
      return jsonResponse({ error: "Invalid request" }, 400);
    }

    const entry = await this.state.storage.get("idempotency");

    if (entry?.expiresAt > now) {
      const replay =
        entry.form === body.form &&
        entry.idempotencyKey === body.idempotencyKey &&
        entry.requestHash === body.requestHash;

      return jsonResponse({
        conflict: !replay,
        replay,
      });
    }

    if (entry) {
      await this.state.storage.delete("idempotency");
    }

    if (shouldBind) {
      await this.state.storage.put("idempotency", {
        expiresAt: now + ttlMs,
        form: body.form,
        idempotencyKey: body.idempotencyKey,
        requestHash: body.requestHash,
      });
    }

    return jsonResponse({ conflict: false, replay: false });
  }

  async release(body) {
    const entry = await this.state.storage.get("reservation");

    if (entry?.idempotencyKey === body.idempotencyKey) {
      await this.state.storage.delete("reservation");
    }

    return jsonResponse({ released: true });
  }
}
