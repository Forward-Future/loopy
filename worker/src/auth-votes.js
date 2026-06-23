const SESSION_COOKIE = "ll_session";
const OAUTH_COOKIE = "ll_oauth";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const OAUTH_TTL_SECONDS = 10 * 60;
const MAX_VOTE_BODY_BYTES = 1024;

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

    const viewer = await readSession(request, env);
    const response = await voteStoreFetch(
      env,
      `/votes${viewer ? `?voter=${encodeURIComponent(viewer.sub)}` : ""}`,
    );
    const body = await response.json();
    return jsonResponse({
      ...body,
      uiEnabled: env.VOTING_UI_ENABLED === "true",
      viewer: publicViewer(viewer),
    });
  }

  if (path === "/auth/session") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    return jsonResponse({ viewer: publicViewer(await readSession(request, env)) });
  }

  if (path === "/auth/logout") {
    if (request.method !== "POST") return methodNotAllowed("POST");
    if (!isTrustedMutationOrigin(request, env)) return forbidden();
    return jsonResponse(
      { ok: true },
      200,
      { "Set-Cookie": clearCookie(SESSION_COOKIE, env) },
    );
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

    const viewer = await readSession(request, env);
    if (!viewer) {
      return jsonResponse(
        { error: "Sign in with GitHub to vote.", code: "authentication_required" },
        401,
      );
    }

    const value = await readVoteValue(request);
    if (value instanceof Response) return value;

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
        value,
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

  const state = randomUrlSafe(32);
  const returnTo = safeReturnTo(
    requestUrl.searchParams.get("return_to"),
    env,
  );
  const oauthCookie = await signedValue(
    {
      provider: "github",
      state,
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

  return redirect(authorizationUrl.toString(), {
    "Set-Cookie": setCookie(OAUTH_COOKIE, oauthCookie, OAUTH_TTL_SECONDS, env),
  });
}

async function finishOAuth(request, requestUrl, env, fetcher) {
  const oauth = await readSignedCookie(request, OAUTH_COOKIE, env.SESSION_SECRET);
  const fallback = safeReturnTo(null, env);
  const returnTo = oauth?.returnTo || fallback;
  const clearOAuth = clearCookie(OAUTH_COOKIE, env);

  if (
    !oauth ||
    oauth.provider !== "github" ||
    !requestUrl.searchParams.get("state") ||
    !timingSafeEqual(oauth.state, requestUrl.searchParams.get("state"))
  ) {
    return redirect(authErrorUrl(returnTo, "invalid_state", env), {
      "Set-Cookie": clearOAuth,
    });
  }

  if (requestUrl.searchParams.get("error")) {
    return redirect(authErrorUrl(returnTo, "access_denied", env), {
      "Set-Cookie": clearOAuth,
    });
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return redirect(authErrorUrl(returnTo, "missing_code", env), {
      "Set-Cookie": clearOAuth,
    });
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
    const headers = new Headers({
      "Cache-Control": "no-store",
      Location: absoluteReturnTo(returnTo, env),
      "Referrer-Policy": "no-referrer",
    });
    headers.append(
      "Set-Cookie",
      setCookie(SESSION_COOKIE, session, SESSION_TTL_SECONDS, env),
    );
    headers.append("Set-Cookie", clearOAuth);
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error("OAuth login failed", {
      provider: "github",
      message: error instanceof Error ? error.message : String(error),
    });
    return redirect(authErrorUrl(returnTo, "provider_error", env), {
      "Set-Cookie": clearOAuth,
    });
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

async function readSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  const session = await readSignedCookie(request, SESSION_COOKIE, env.SESSION_SECRET);
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

async function readVoteValue(request) {
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
    if (!body || ![-1, 0, 1].includes(body.value)) throw new Error("invalid");
    return body.value;
  } catch {
    return jsonResponse({ error: "Invalid vote", code: "invalid_vote" }, 400);
  }
}

async function isPublishedLoop(env, slug) {
  const id = env.LOOP_CATALOG.idFromName("production");
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
  if (!origin) return false;
  const allowed = new Set([
    `https://${env.PUBLIC_SITE_HOSTNAME || "signals.forwardfuture.ai"}`,
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
    `https://${env.PUBLIC_SITE_HOSTNAME || "signals.forwardfuture.ai"}`;
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

function setCookie(name, value, maxAge, env) {
  return `${name}=${value}; Path=${cookiePath(env)}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function clearCookie(name, env) {
  return `${name}=; Path=${cookiePath(env)}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function cookiePath(env) {
  return `${normalizeBasePath(env.PUBLIC_SITE_PATH || "/loop-library") || "/"}/`.replace("//", "/");
}

function cookieValue(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return "";
}

async function signedValue(payload, secret) {
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${await hmac(encoded, secret)}`;
}

async function readSignedCookie(request, name, secret) {
  if (!secret) return null;
  const value = cookieValue(request, name);
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

function redirect(location, headers = {}) {
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: location,
      "Referrer-Policy": "no-referrer",
      ...headers,
    },
  });
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
