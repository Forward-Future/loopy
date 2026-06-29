const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const OAUTH_TTL_SECONDS = 10 * 60;
const MAX_VOTE_BODY_BYTES = 1024;
const OAUTH_NONCE_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const LOOP_CATALOG_INSTANCE = "published-loops";

export async function handleAuthVoteRoute(
  request,
  env,
  dependencies = { fetch: (...args) => globalThis.fetch(...args) },
) {
  const url = new URL(request.url);
  const path = stripBasePath(url.pathname, env.PUBLIC_SITE_PATH || "/loop-library");
  const voteMatch = path.match(/^\/api\/loops\/([a-z0-9-]+)\/vote$/);
  const recognized =
    path === "/api/votes" ||
    path === "/auth/session" ||
    path === "/auth/logout" ||
    path === "/auth/github" ||
    path === "/auth/callback/github" ||
    voteMatch;

  if (!recognized) return null;

  if (path === "/api/votes") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    if (!env.VOTE_STORE) return unavailable("Voting is not configured.");

    const response = await voteStoreFetch(env, "/votes");
    const body = await response.json();
    return jsonResponse({
      ...body,
      uiEnabled: env.VOTING_UI_ENABLED === "true",
      viewer: null,
      viewerVotes: {},
    });
  }

  if (path === "/auth/session") {
    if (request.method !== "POST") return methodNotAllowed("POST");
    const body = await readAuthBody(request);
    if (body instanceof Response) return body;
    const viewer = await readSession(body.sessionToken, env);
    if (!viewer) return jsonResponse({ viewer: null, viewerVotes: {} });
    if (!env.VOTE_STORE) return unavailable("Voting is not configured.");
    const response = await voteStoreFetch(
      env,
      `/votes?voter=${encodeURIComponent(viewer.sub)}`,
    );
    const votes = await response.json();
    return jsonResponse({
      viewer: publicViewer(viewer),
      viewerVotes: votes.viewerVotes || {},
    });
  }

  if (path === "/auth/logout") {
    if (request.method !== "POST") return methodNotAllowed("POST");
    if (!isTrustedMutationOrigin(request, env)) return forbidden();
    return jsonResponse({ ok: true });
  }

  if (path === "/auth/github") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    return startOAuth(url, env);
  }

  if (path === "/auth/callback/github") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    return finishOAuth(
      request,
      url,
      env,
      dependencies.fetch,
    );
  }

  if (voteMatch) {
    if (request.method !== "POST") return methodNotAllowed("POST");
    if (!isTrustedMutationOrigin(request, env)) return forbidden();
    if (!env.VOTE_STORE || !env.LOOP_CATALOG) {
      return unavailable("Voting is not configured.");
    }

    const vote = await readVoteBody(request);
    if (vote instanceof Response) return vote;
    const viewer = await readSession(vote.sessionToken, env);
    if (!viewer) {
      return jsonResponse(
        { error: "Sign in with GitHub to vote.", code: "authentication_required" },
        401,
      );
    }

    const slug = voteMatch[1];
    if (!(await isPublishedLoop(env, slug))) {
      return jsonResponse(
        { error: "Loop not found", code: "not_found" },
        404,
      );
    }

    const response = await voteStoreFetch(env, `/votes/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value: vote.value,
        voterKey: viewer.sub,
        provider: viewer.provider,
        username: viewer.username,
      }),
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return null;
}

async function startOAuth(requestUrl, env) {
  const configuration = githubConfiguration(env);
  if (configuration instanceof Response) return configuration;
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    return unavailable("Login is not configured.");
  }

  const requestedNonce = requestUrl.searchParams.get("client_nonce");
  if (requestedNonce === null) {
    return oauthStartBridge(requestUrl, env);
  }
  const clientNonce = requestedNonce;
  if (!OAUTH_NONCE_PATTERN.test(clientNonce)) {
    return jsonResponse(
      { error: "Invalid OAuth nonce", code: "invalid_oauth_nonce" },
      400,
    );
  }
  const returnTo = safeReturnTo(
    requestUrl.searchParams.get("return_to"),
    env,
  );
  const state = await signedValue(
    {
      v: 1,
      provider: "github",
      clientNonce,
      returnTo,
      exp: Math.floor(Date.now() / 1000) + OAUTH_TTL_SECONDS,
    },
    env.SESSION_SECRET,
  );
  const callback = callbackUrl(env);
  const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
  authorizationUrl.search = new URLSearchParams({
    client_id: configuration.clientId,
    redirect_uri: callback,
    scope: "read:user",
    state,
  });

  return jsonResponse({ authorizationUrl: authorizationUrl.toString() });
}

function oauthStartBridge(requestUrl, env) {
  const startUrl = new URL(
    `${canonicalOrigin(env)}${normalizeBasePath(
      env.PUBLIC_SITE_PATH || "/loop-library",
    )}/auth/github`,
  );
  startUrl.searchParams.set(
    "return_to",
    safeReturnTo(requestUrl.searchParams.get("return_to"), env),
  );
  const bridge = scriptJson({ startUrl: startUrl.toString() });
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><title>Starting GitHub sign-in</title></head>
<body><p data-auth-status>Starting GitHub sign-in…</p>
<script>
const bridge = ${bridge};
try {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  const nonce = btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
  sessionStorage.setItem("ll_oauth_nonce", nonce);
  const url = new URL(bridge.startUrl);
  url.searchParams.set("client_nonce", nonce);
  fetch(url, { headers: { Accept: "application/json" } })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.authorizationUrl) throw new Error("GitHub sign-in is unavailable.");
      location.replace(result.authorizationUrl);
    })
    .catch(() => { document.querySelector("[data-auth-status]").textContent = "GitHub sign-in is unavailable. Please try again."; });
} catch {
  document.querySelector("[data-auth-status]").textContent = "GitHub sign-in is unavailable in this browser.";
}
</script></body></html>`;
  return new Response(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": `default-src 'none'; script-src 'unsafe-inline'; connect-src 'self' ${canonicalOrigin(env)}; base-uri 'none'; frame-ancestors 'none'`,
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function finishOAuth(request, requestUrl, env, fetcher) {
  const state = requestUrl.searchParams.get("state") || "";
  const oauth = await readSignedValue(state, env.SESSION_SECRET);
  const fallback = safeReturnTo(null, env);
  const returnTo = oauth?.returnTo || fallback;

  if (
    !oauth ||
    oauth.v !== 1 ||
    oauth.provider !== "github" ||
    !OAUTH_NONCE_PATTERN.test(oauth.clientNonce || "")
  ) {
    return authBridge(authErrorUrl(returnTo, "invalid_state", env));
  }

  if (requestUrl.searchParams.get("error")) {
    return authBridge(
      authErrorUrl(returnTo, "access_denied", env),
      { clientNonce: oauth.clientNonce },
    );
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return authBridge(
      authErrorUrl(returnTo, "missing_code", env),
      { clientNonce: oauth.clientNonce },
    );
  }

  try {
    const configuration = githubConfiguration(env);
    if (configuration instanceof Response) return configuration;
    const identity = await githubIdentity(
      code,
      configuration,
      callbackUrl(env),
      fetcher,
    );
    const session = await signedValue(
      {
        v: 1,
        sub: `github:${identity.id}`,
        provider: "github",
        username: identity.username,
        name: identity.name,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      },
      env.SESSION_SECRET,
    );
    return authBridge(
      absoluteReturnTo(returnTo, env),
      {
        clientNonce: oauth.clientNonce,
        sessionToken: session,
      },
      authErrorUrl(returnTo, "invalid_state", env),
    );
  } catch (error) {
    console.error("OAuth login failed", {
      provider: "github",
      message: error instanceof Error ? error.message : String(error),
    });
    return authBridge(
      authErrorUrl(returnTo, "provider_error", env),
      { clientNonce: oauth.clientNonce },
    );
  }
}

async function githubIdentity(code, configuration, redirectUri, fetcher) {
  const tokenResponse = await fetcher("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) throw new Error("GitHub token exchange failed");

  const profileResponse = await fetcher("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.access_token}`,
      "User-Agent": "Forward-Future-Loop-Library",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const profile = await profileResponse.json();
  if (!profileResponse.ok || !profile.id || !profile.login) {
    throw new Error("GitHub profile lookup failed");
  }
  return {
    id: String(profile.id),
    username: String(profile.login).slice(0, 80),
    name: String(profile.name || profile.login).slice(0, 100),
  };
}

function githubConfiguration(env) {
  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
    return unavailable("GitHub login is not configured.");
  }
  return {
    clientId: env.GITHUB_OAUTH_CLIENT_ID,
    clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET,
  };
}

async function readSession(sessionToken, env) {
  if (!env.SESSION_SECRET) return null;
  const session = await readSignedValue(sessionToken, env.SESSION_SECRET);
  if (
    !session ||
    session.v !== 1 ||
    !/^github:[A-Za-z0-9_-]{1,128}$/.test(session.sub || "") ||
    session.provider !== "github" ||
    typeof session.username !== "string"
  ) {
    return null;
  }
  return session;
}

function publicViewer(viewer) {
  return viewer
    ? {
        provider: viewer.provider,
        username: viewer.username,
        name: viewer.name,
      }
    : null;
}

async function readVoteBody(request) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(length) && length > MAX_VOTE_BODY_BYTES) {
    return jsonResponse({ error: "Vote is too large", code: "invalid_vote" }, 413);
  }
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_VOTE_BODY_BYTES) {
      return jsonResponse({ error: "Vote is too large", code: "invalid_vote" }, 413);
    }
    const body = JSON.parse(text);
    if (
      !body ||
      ![-1, 0, 1].includes(body.value) ||
      (body.sessionToken !== undefined && typeof body.sessionToken !== "string") ||
      String(body.sessionToken || "").length > 900
    ) {
      throw new Error("invalid");
    }
    return { value: body.value, sessionToken: body.sessionToken || "" };
  } catch {
    return jsonResponse({ error: "Invalid vote", code: "invalid_vote" }, 400);
  }
}

async function readAuthBody(request) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(length) && length > MAX_VOTE_BODY_BYTES) {
    return jsonResponse(
      { error: "Session request is too large", code: "invalid_session" },
      413,
    );
  }
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_VOTE_BODY_BYTES) {
      return jsonResponse(
        { error: "Session request is too large", code: "invalid_session" },
        413,
      );
    }
    const body = JSON.parse(text);
    if (
      !body ||
      typeof body.sessionToken !== "string" ||
      body.sessionToken.length > 900
    ) {
      throw new Error("invalid");
    }
    return { sessionToken: body.sessionToken };
  } catch {
    return jsonResponse(
      { error: "Invalid session request", code: "invalid_session" },
      400,
    );
  }
}

async function isPublishedLoop(env, slug) {
  const id = env.LOOP_CATALOG.idFromName(LOOP_CATALOG_INSTANCE);
  const response = await env.LOOP_CATALOG.get(id).fetch("https://loop-catalog/published");
  if (!response.ok) return false;
  const catalog = await response.json();
  return catalog.initialized && catalog.loops.some((loop) => loop.slug === slug);
}

function voteStoreFetch(env, path, init) {
  const id = env.VOTE_STORE.idFromName("production");
  return env.VOTE_STORE.get(id).fetch(`https://vote-store${path}`, init);
}

function isTrustedMutationOrigin(request, env) {
  const origin = request.headers.get("Origin");
  // here.now intentionally strips browser Origin headers from proxy requests.
  // The signed bearer token remains required for every vote; reject only an
  // explicit, untrusted Origin so direct cross-site requests still fail.
  if (!origin) return true;
  const allowed = new Set([
    `https://${env.PUBLIC_SITE_HOSTNAME || "signals.forwardfuture.com"}`,
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ]);
  return allowed.has(origin);
}

function safeReturnTo(value, env) {
  const base = normalizeBasePath(env.PUBLIC_SITE_PATH || "/loop-library");
  if (
    typeof value === "string" &&
    value.startsWith(`${base}/`) &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value.slice(0, 1000);
  }
  return `${base}/`;
}

function callbackUrl(env) {
  return `${canonicalOrigin(env)}${normalizeBasePath(
    env.PUBLIC_SITE_PATH || "/loop-library",
  )}/auth/callback/github`;
}

function absoluteReturnTo(returnTo, env) {
  return new URL(returnTo, `${canonicalOrigin(env)}/`).toString();
}

function authErrorUrl(returnTo, code, env) {
  const url = new URL(absoluteReturnTo(returnTo, env));
  url.searchParams.set("auth_error", code);
  return url.toString();
}

function canonicalOrigin(env) {
  return env.OAUTH_CALLBACK_ORIGIN ||
    `https://${env.PUBLIC_SITE_HOSTNAME || "signals.forwardfuture.com"}`;
}

function normalizeBasePath(value) {
  const segments = String(value).split("/").filter(Boolean);
  return segments.length ? `/${segments.join("/")}` : "";
}

function stripBasePath(pathname, basePath) {
  const normalized = normalizeBasePath(basePath);
  if (pathname === normalized || pathname === `${normalized}/`) return "/";
  if (normalized && pathname.startsWith(`${normalized}/`)) {
    return pathname.slice(normalized.length);
  }
  return pathname;
}

async function signedValue(payload, secret) {
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${await hmac(encoded, secret)}`;
}

async function readSignedValue(value, secret) {
  if (!secret) return null;
  if (typeof value !== "string" || value.length > 2000) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const encoded = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!timingSafeEqual(signature, await hmac(encoded, secret))) return null;
  try {
    const payload = JSON.parse(fromBase64Url(encoded));
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64UrlBytes(
    new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))),
  );
}

function randomUrlSafe(size) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64UrlBytes(bytes);
}

function base64Url(value) {
  return base64UrlBytes(new TextEncoder().encode(value));
}

function base64UrlBytes(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  );
}

function timingSafeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  let different = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    different |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return different === 0;
}

function authBridge(destination, payload = {}, invalidStateDestination = destination) {
  const bridge = scriptJson({
    clientNonce: payload.clientNonce || null,
    destination,
    invalidStateDestination,
    sessionToken: payload.sessionToken || null,
  });
  const safeDestination = escapeHtml(destination);
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><title>Finishing GitHub sign-in</title></head>
<body><p>Finishing GitHub sign-in…</p><p><a href="${safeDestination}">Continue</a></p>
<script>
const bridge = ${bridge};
let destination = bridge.destination;
try {
  if (bridge.clientNonce) {
    const storedNonce = sessionStorage.getItem("ll_oauth_nonce");
    sessionStorage.removeItem("ll_oauth_nonce");
    if (bridge.sessionToken && storedNonce === bridge.clientNonce) {
      sessionStorage.setItem("ll_session", bridge.sessionToken);
    } else if (bridge.sessionToken) {
      destination = bridge.invalidStateDestination;
    }
  }
} catch {
  if (bridge.sessionToken) {
    destination = bridge.invalidStateDestination;
  }
}
location.replace(destination);
</script></body></html>`;
  return new Response(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function scriptJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonResponse(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function methodNotAllowed(allow) {
  return jsonResponse(
    { error: "Method not allowed", code: "method_not_allowed" },
    405,
    { Allow: allow },
  );
}

function forbidden() {
  return jsonResponse({ error: "Forbidden", code: "origin_not_allowed" }, 403);
}

function unavailable(message) {
  return jsonResponse({ error: message, code: "not_configured" }, 503);
}
