import {
  LoopValidationError,
  normalizeLoopDocument,
} from "./loop-schema.js";
import {
  SITE,
  catalogObject,
  injectHomepage,
  renderAgentInstructions,
  renderCatalogMarkdown,
  renderFeed,
  renderHomepageFallback,
  renderLoopPage,
  renderSitemap,
} from "./render-loops.js";
import { voteStoreFetch } from "./auth-votes.js";

const MAX_ADMIN_BYTES = 512 * 1024;
const MAX_RESTORE_START_BYTES = 20 * 1024 * 1024;
const MAX_RESTORE_CHUNK_BYTES = 4 * 1024 * 1024;
const LEGACY_PUBLIC_DOMAIN = "forwardfuture.ai";
const CURRENT_PUBLIC_DOMAIN = "forwardfuture.com";
const CACHE_HEADERS = {
  // Public catalog surfaces embed vote totals for first-paint ordering (they
  // may be up to a minute stale; the client refreshes them from the no-store
  // /api/votes) and nothing per-viewer, so a short shared cache is safe.
  // Publishing may take up to max-age to appear; admin, session, and vote
  // routes stay no-store.
  "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
};
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function handleLoopRoute(
  request,
  env,
  dependencies = { fetch: (...args) => globalThis.fetch(...args) },
) {
  const url = new URL(request.url);
  const path = stripBasePath(url.pathname, env.PUBLIC_SITE_PATH || "/loop-library");
  const isAdmin = [
    "/admin/loops/import",
    "/admin/loops/export",
    "/admin/loops/restore/start",
    "/admin/loops/restore/chunk",
    "/admin/loops/restore/finalize",
  ].includes(path) || /^\/admin\/loops\/[a-z0-9-]+(?:\/revisions)?$/.test(path);
  const isPublicData = path === "/api/loops" || /^\/api\/loops\/[a-z0-9-]+$/.test(path);
  const isCatalog = ["/catalog.json", "/catalog.md", "/catalog.txt", "/llms.txt", "/sitemap.xml", "/feed.xml"].includes(path);
  const publicHostname = env.PUBLIC_SITE_HOSTNAME || "signals.forwardfuture.com";
  const publicBasePath = env.PUBLIC_SITE_PATH || "/loop-library";
  const normalizedBasePath = `/${String(publicBasePath).split("/").filter(Boolean).join("/")}`;
  const isCanonicalHostname = url.hostname === publicHostname;
  const isPublicSite = isCanonicalHostname ||
    url.pathname === normalizedBasePath ||
    url.pathname.startsWith(`${normalizedBasePath}/`);
  const detailMatch = path.match(/^\/loops\/([a-z0-9-]+)\/?$/);
  const isHomepage = isPublicSite && path === "/";

  if (!isAdmin && !isPublicData && !isCatalog && !detailMatch && !isHomepage) {
    return null;
  }

  if (!env.LOOP_CATALOG) {
    if (isHomepage || detailMatch) return null;
    return jsonResponse({ error: "Loop catalog is not configured.", code: "catalog_not_configured" }, 503);
  }

  if (isAdmin) {
    return handleAdminRequest(request, env, path);
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse(
      { error: "Method not allowed", code: "method_not_allowed" },
      405,
      { Allow: "GET, HEAD" },
    );
  }

  const catalog = await readPublishedCatalog(env);
  const loops = catalog.loops.map(normalizePublishedDomain);

  if (!catalog.initialized) {
    // A direct canonical route can safely read the legacy origin during a
    // cutover. Mounted here.now requests already came through that origin's
    // proxy manifest, so fetching it again would recurse back into the Worker.
    if (isCanonicalHostname && (isHomepage || isCatalog || detailMatch)) {
      return dependencies.fetch(publicOriginRequest(request, env));
    }

    return jsonResponse(
      {
        error: "The database-backed catalog is not active yet.",
        code: "catalog_not_active",
      },
      503,
      NO_STORE_HEADERS,
      request.method,
    );
  }

  if (isPublicData) {
    const publicCatalog = catalogObject(loops);
    if (detailMatch || path.startsWith("/api/loops/")) {
      const slug = path.split("/").at(-1);
      const loop = publicCatalog.loops.find((item) => item.slug === slug);
      return loop
        ? jsonResponse({ loop }, 200, CACHE_HEADERS, request.method)
        : jsonResponse(
            { error: "Loop not found", code: "not_found" },
            404,
            NO_STORE_HEADERS,
            request.method,
          );
    }

    return jsonResponse(
      {
        updated: publicCatalog.updated,
        count: publicCatalog.loopCount,
        loops: publicCatalog.loops,
      },
      200,
      CACHE_HEADERS,
      request.method,
    );
  }

  if (isCatalog) {
    return catalogResponse(path, loops, request.method);
  }

  if (detailMatch) {
    const loop = loops.find((item) => item.slug === detailMatch[1]);

    if (!loop) {
      return catalog.initialized
        ? textResponse(
            "Loop not found.\n",
            "text/plain; charset=utf-8",
            404,
            NO_STORE_HEADERS,
            request.method,
          )
        : null;
    }

    return textResponse(
      renderLoopPage(loop, loops),
      "text/html; charset=utf-8",
      200,
      CACHE_HEADERS,
      request.method,
    );
  }

  if (isHomepage && catalog.initialized) {
    const originRequest = request.method === "HEAD"
      ? publicOriginRequest(request, env, {
          method: "GET",
          conditional: false,
          range: false,
        })
      : publicOriginRequest(request, env, {
          conditional: false,
          range: false,
        });
    let originResponse;
    try {
      originResponse = await dependencies.fetch(originRequest);
    } catch {
      // The here.now shell is unreachable. Serve a branded fallback built from
      // the catalog the Worker already holds so every loop stays reachable,
      // rather than leaking the upstream failure. Report it honestly as 502.
      return textResponse(
        renderHomepageFallback(loops),
        "text/html; charset=utf-8",
        502,
        NO_STORE_HEADERS,
        request.method,
      );
    }

    if (originResponse.status >= 500) {
      // Upstream shell error: serve the same fallback and preserve the real
      // failure status instead of passing through the upstream error page.
      return textResponse(
        renderHomepageFallback(loops),
        "text/html; charset=utf-8",
        originResponse.status,
        NO_STORE_HEADERS,
        request.method,
      );
    }

    if (!originResponse.ok) {
      return originResponse;
    }

    const contentType = originResponse.headers.get("Content-Type") || "";

    if (!contentType.includes("text/html")) {
      return originResponse;
    }

    const html = injectHomepage(
      await originResponse.text(),
      loops,
      catalog.updated,
      await homepageVoteCounts(env),
    );
    // Allowlist: the response is publicly cacheable, so shell cookies, auth
    // challenges, and validators for the un-injected body must not leak in.
    const headers = new Headers(CACHE_HEADERS);
    for (const name of ["Content-Type", "Content-Language", "Vary"]) {
      const value = originResponse.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(request.method === "HEAD" ? null : html, {
      status: originResponse.status,
      headers,
    });
  }

  return null;
}

async function homepageVoteCounts(env) {
  if (!env.VOTE_STORE) return {};
  try {
    const response = await voteStoreFetch(env, "/votes");
    if (!response.ok) return {};
    return (await response.json()).votes || {};
  } catch (error) {
    // Vote totals only seed the first-paint sort; the homepage must still
    // render when the vote store is unavailable.
    console.warn("Homepage vote totals unavailable:", error);
    return {};
  }
}

export function publicOriginRequest(request, env, overrides = {}) {
  const incoming = new URL(request.url);
  const path = stripBasePath(
    incoming.pathname,
    env.PUBLIC_SITE_PATH || "/loop-library",
  );
  const shellUrl = path === "/" ? env.PUBLIC_SHELL_URL : null;
  const originBase = new URL(shellUrl || env.PUBLIC_ORIGIN_URL);
  if (!shellUrl) {
    originBase.pathname = `${originBase.pathname.replace(/\/$/, "")}${path}`;
  }
  originBase.search = incoming.search;
  const method = overrides.method || request.method;

  if (!["GET", "HEAD"].includes(method)) {
    throw new Error("Only GET and HEAD requests may fall through to the public origin.");
  }

  const headers = new Headers();
  const forwardedHeaders = ["Accept", "Accept-Language"];
  if (overrides.range !== false) {
    forwardedHeaders.push("Range", "If-Range");
  }
  if (overrides.conditional !== false) {
    forwardedHeaders.push("If-Modified-Since", "If-None-Match");
  }
  for (const name of forwardedHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Request(originBase, {
    method,
    headers,
    redirect: request.redirect,
  });
}

async function handleAdminRequest(request, env, path) {
  if (!env.LOOP_PUBLISH_TOKEN) {
    return jsonResponse({ error: "Publishing is not configured.", code: "publishing_not_configured" }, 503);
  }

  if (!(await authorized(request, env.LOOP_PUBLISH_TOKEN))) {
    return jsonResponse(
      { error: "Unauthorized", code: "unauthorized" },
      401,
      { "WWW-Authenticate": "Bearer" },
    );
  }

  if (path.endsWith("/revisions")) {
    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed", code: "method_not_allowed" }, 405, { Allow: "GET" });
    }
    const slug = path.split("/").at(-2);
    return catalogFetch(env, `/revisions/${slug}`);
  }

  if (path === "/admin/loops/export") {
    if (request.method !== "GET") {
      return jsonResponse(
        { error: "Method not allowed", code: "method_not_allowed" },
        405,
        { Allow: "GET" },
      );
    }
    const url = new URL(request.url);
    if (url.searchParams.has("after")) {
      try {
        const after = nonNegativeInteger(url.searchParams.get("after"), "after");
        const max = nonNegativeInteger(url.searchParams.get("max"), "max");
        const limit = nonNegativeInteger(url.searchParams.get("limit"), "limit");
        if (limit < 1 || limit > 250 || after > max) {
          throw new LoopValidationError("Invalid export page.");
        }
        return catalogFetch(
          env,
          `/export/revisions?after=${after}&max=${max}&limit=${limit}`,
        );
      } catch (error) {
        return adminError(error);
      }
    }
    return catalogFetch(env, "/export");
  }

  if (path.startsWith("/admin/loops/restore/")) {
    if (request.method !== "POST") {
      return jsonResponse(
        { error: "Method not allowed", code: "method_not_allowed" },
        405,
        { Allow: "POST" },
      );
    }
    try {
      const isStart = path.endsWith("/start");
      const body = await readAdminBody(
        request,
        isStart ? MAX_RESTORE_START_BYTES : MAX_RESTORE_CHUNK_BYTES,
      );
      const normalized = isStart
        ? await normalizeRestoreManifest(body)
        : path.endsWith("/chunk")
          ? normalizeRestoreChunk(body)
          : { restoreId: restoreId(body.restoreId) };
      return catalogFetch(env, path.replace("/admin/loops", ""), {
        method: "POST",
        body: JSON.stringify(normalized),
      });
    } catch (error) {
      return adminError(error);
    }
  }

  if (request.method === "GET" && /^\/admin\/loops\/[a-z0-9-]+$/.test(path)) {
    return catalogFetch(env, `/loops/${path.split("/").at(-1)}`);
  }

  if (path === "/admin/loops/import") {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed", code: "method_not_allowed" }, 405, { Allow: "POST" });
    }

    try {
      const body = await readAdminBody(request);

      if (!Array.isArray(body.loops) || body.loops.length < 1 || body.loops.length > 250) {
        throw new LoopValidationError("loops must contain between 1 and 250 loop records.");
      }

      const loops = body.loops.map(normalizeLoopDocument);
      assertUniqueCatalogFields(loops);
      const activate = body.activate === true;
      const bootstrapLoopCount = Number(env.BOOTSTRAP_LOOP_COUNT);
      const status = readStatus(body.status);

      if (activate && status !== "published") {
        throw new LoopValidationError(
          "Activation requires published import status.",
        );
      }

      if (
        activate &&
        (!Number.isInteger(bootstrapLoopCount) ||
          loops.length !== bootstrapLoopCount)
      ) {
        throw new LoopValidationError(
          `Activation requires exactly ${env.BOOTSTRAP_LOOP_COUNT || "the configured number of"} bootstrap loops.`,
        );
      }

      if (activate) {
        const digest = await sha256Hex(JSON.stringify(loops));
        if (!env.BOOTSTRAP_CATALOG_DIGEST || digest !== env.BOOTSTRAP_CATALOG_DIGEST) {
          throw new LoopValidationError(
            "Activation requires the reviewed bootstrap catalog digest.",
          );
        }
      }
      return catalogFetch(env, "/import", {
        method: "POST",
        body: JSON.stringify({
          loops,
          status,
          actor: readActor(request),
          activate,
        }),
      });
    } catch (error) {
      return adminError(error);
    }
  }

  if (request.method !== "PUT") {
    return jsonResponse({ error: "Method not allowed", code: "method_not_allowed" }, 405, { Allow: "PUT" });
  }

  try {
    const slug = path.split("/").at(-1);
    const body = await readAdminBody(request);
    const loop = normalizeLoopDocument(body.loop || body);
    const status = readStatus(body.status);
    const expectedRevision = body.expectedRevision;

    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
      throw new LoopValidationError(
        "expectedRevision must be the non-negative revision returned by the current-loop endpoint.",
      );
    }

    if (loop.slug !== slug) {
      throw new LoopValidationError("The URL slug must match loop.slug.");
    }

    return catalogFetch(env, `/loops/${slug}`, {
      method: "PUT",
      body: JSON.stringify({
        loop,
        status,
        actor: readActor(request),
        expectedRevision,
        action:
          status === "archived"
            ? "archive"
            : status === "draft"
              ? "draft"
              : "publish",
      }),
    });
  } catch (error) {
    return adminError(error);
  }
}

function adminError(error) {
  if (error instanceof LoopValidationError) {
    return jsonResponse({ error: error.message, code: "invalid_loop" }, 400);
  }
  if (error instanceof SyntaxError) {
    return jsonResponse({ error: "The request body is not valid JSON.", code: "invalid_json" }, 400);
  }
  console.error("Unexpected loop publishing failure", {
    message: error instanceof Error ? error.message : String(error),
  });
  return jsonResponse({ error: "The loop could not be published.", code: "publish_error" }, 500);
}

async function readAdminBody(request, maxBytes = MAX_ADMIN_BYTES) {
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    throw new LoopValidationError("Content-Type must be application/json.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new LoopValidationError("The publishing request is too large.");
  }
  const body = JSON.parse(text);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new LoopValidationError("The publishing request must be a JSON object.");
  }
  return body;
}

async function normalizeRestoreManifest(body) {
  if (body.schemaVersion !== 2) {
    throw new LoopValidationError("Restore schemaVersion must be 2.");
  }
  if (typeof body.active !== "boolean") {
    throw new LoopValidationError("Restore active must be a boolean.");
  }
  if (!Array.isArray(body.loops) || body.loops.length < 1 || body.loops.length > 250) {
    throw new LoopValidationError("Restore loops must contain between 1 and 250 records.");
  }
  if (
    !Number.isSafeInteger(body.revisionCount) ||
    body.revisionCount < body.loops.length ||
    !Number.isSafeInteger(body.maxRevisionId) ||
    body.maxRevisionId < body.revisionCount
  ) {
    throw new LoopValidationError(
      "Restore revisionCount and maxRevisionId must describe the complete revision history.",
    );
  }
  if (!/^[a-f0-9]{64}$/.test(body.revisionDigest || "")) {
    throw new LoopValidationError("Restore revisionDigest must be a SHA-256 digest.");
  }
  const providedRestoreId = restoreId(body.restoreId);
  const { restoreId: _restoreId, ...manifestWithoutId } = body;
  const expectedRestoreId = await sha256Hex(JSON.stringify(manifestWithoutId));
  if (providedRestoreId !== expectedRestoreId) {
    throw new LoopValidationError("Restore manifest digest is invalid.");
  }

  const loops = body.loops.map((entry) => ({
    loop: normalizeLoopDocument(entry),
    status: readStatus(entry.status),
  }));
  assertUniqueCatalogFields(loops.map(({ loop }) => loop));
  return {
    schemaVersion: 2,
    restoreId: providedRestoreId,
    active: body.active,
    activatedAt: body.activatedAt
      ? restoreTimestamp(body.activatedAt, "activatedAt")
      : null,
    exportedAt: restoreTimestamp(body.exportedAt, "exportedAt"),
    revisionCount: body.revisionCount,
    maxRevisionId: body.maxRevisionId,
    revisionDigest: body.revisionDigest,
    loops,
  };
}

function normalizeRestoreChunk(body) {
  if (!Array.isArray(body.revisions) || body.revisions.length < 1 || body.revisions.length > 50) {
    throw new LoopValidationError("Restore chunks must contain between 1 and 50 revisions.");
  }
  const revisionIds = new Set();
  const revisions = body.revisions.map((entry) => {
    if (!Number.isSafeInteger(entry.id) || entry.id < 1 || revisionIds.has(entry.id)) {
      throw new LoopValidationError("Restore revision ids must be unique positive integers.");
    }
    revisionIds.add(entry.id);
    const slug = requiredRestoreString(entry.slug, "revision.slug", 80);
    const loop = normalizeLoopDocument(entry.loop);
    if (loop.slug !== slug) {
      throw new LoopValidationError("Restore revision slug must match revision.loop.slug.");
    }
    return {
      id: entry.id,
      slug,
      action: requiredRestoreString(entry.action, "revision.action", 40),
      status: readStatus(entry.status),
      actor: requiredRestoreString(entry.actor, "revision.actor", 120),
      loop,
      createdAt: restoreTimestamp(entry.createdAt, "revision.createdAt"),
    };
  });
  return { restoreId: restoreId(body.restoreId), revisions };
}

function restoreId(value) {
  const id = requiredRestoreString(value, "restoreId", 64);
  if (!/^[a-f0-9]{64}$/.test(id)) {
    throw new LoopValidationError("restoreId must be a lowercase SHA-256 digest.");
  }
  return id;
}

function nonNegativeInteger(value, field) {
  if (!/^\d+$/.test(value || "")) {
    throw new LoopValidationError(`${field} must be a non-negative integer.`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number)) {
    throw new LoopValidationError(`${field} is too large.`);
  }
  return number;
}

function requiredRestoreString(value, field, maxLength) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new LoopValidationError(`${field} must be a non-empty string no longer than ${maxLength} characters.`);
  }
  return value.trim();
}

function restoreTimestamp(value, field) {
  const timestamp = requiredRestoreString(value, field, 40);
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== timestamp) {
    throw new LoopValidationError(`${field} must be an ISO timestamp.`);
  }
  return timestamp;
}

function readStatus(value) {
  const status = value || "published";
  if (!["draft", "published", "archived"].includes(status)) {
    throw new LoopValidationError("status must be draft, published, or archived.");
  }
  return status;
}

function readActor(request) {
  const actor = (request.headers.get("X-Loop-Publisher") || "publisher-token").trim();
  if (!actor || actor.length > 120) {
    throw new LoopValidationError("X-Loop-Publisher must be no longer than 120 characters.");
  }
  return actor;
}

function assertUniqueCatalogFields(loops) {
  for (const field of ["slug", "number"]) {
    const values = loops.map((loop) => loop[field]);
    if (new Set(values).size !== values.length) {
      throw new LoopValidationError(`${field} values must be unique.`);
    }
  }
}

async function authorized(request, expectedToken) {
  const authorization = request.headers.get("Authorization") || "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const [providedHash, expectedHash] = await Promise.all([
    sha256(provided),
    sha256(expectedToken),
  ]);
  let difference = providedHash.length ^ expectedHash.length;
  const length = Math.max(providedHash.length, expectedHash.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (providedHash[index] || 0) ^ (expectedHash[index] || 0);
  }
  return difference === 0 && provided.length > 0;
}

async function sha256(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function sha256Hex(value) {
  return [...(await sha256(value))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readPublishedCatalog(env) {
  const response = await catalogFetch(env, "/published");
  if (!response.ok) throw new Error(`Loop catalog returned ${response.status}`);
  return response.json();
}

function normalizePublishedDomain(value) {
  if (typeof value === "string") {
    return value.replaceAll(LEGACY_PUBLIC_DOMAIN, CURRENT_PUBLIC_DOMAIN);
  }
  if (Array.isArray(value)) {
    return value.map(normalizePublishedDomain);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizePublishedDomain(item)]),
    );
  }
  return value;
}

function catalogFetch(env, path, init) {
  const id = env.LOOP_CATALOG.idFromName("published-loops");
  return env.LOOP_CATALOG.get(id).fetch(`https://loop-catalog${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function catalogResponse(path, loops, method) {
  if (path === "/catalog.json") {
    return jsonResponse(catalogObject(loops), 200, CACHE_HEADERS, method);
  }
  if (path === "/sitemap.xml") {
    return textResponse(renderSitemap(loops), "application/xml; charset=utf-8", 200, CACHE_HEADERS, method);
  }
  if (path === "/feed.xml") {
    return textResponse(renderFeed(loops), "application/atom+xml; charset=utf-8", 200, CACHE_HEADERS, method);
  }
  if (path === "/llms.txt") {
    return textResponse(renderAgentInstructions(loops), "text/plain; charset=utf-8", 200, CACHE_HEADERS, method);
  }
  return textResponse(renderCatalogMarkdown(loops), path === "/catalog.md" ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8", 200, CACHE_HEADERS, method);
}

function stripBasePath(pathname, basePath) {
  const normalizedBase = `/${String(basePath).split("/").filter(Boolean).join("/")}`;
  if (pathname === normalizedBase || pathname === `${normalizedBase}/`) return "/";
  if (pathname.startsWith(`${normalizedBase}/`)) return pathname.slice(normalizedBase.length);
  return pathname;
}

function jsonResponse(body, status = 200, headers = {}, method = "GET") {
  return new Response(method === "HEAD" ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function textResponse(body, contentType, status = 200, headers = {}, method = "GET") {
  return new Response(method === "HEAD" ? null : body, {
    status,
    headers: {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
