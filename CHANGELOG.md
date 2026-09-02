# Changelog

## 2026-09-02

### Added

- Enforced the minimum form completion time in the Worker: submissions
  without a plausible `form_elapsed_ms` receive the silent 202 instead of a
  record.
- Rate limited vote writes per signed-in account through the shared
  `TURNSTILE_RATE_LIMITER` binding, returning the same 429 shape as the forms.
- Tested the `LoopCatalog` and `VoteStore` Durable Objects against real
  SQLite instead of stubs.
- Self-hosted Inter and IBM Plex Mono with `font-display: swap`, preloads,
  and OFL licenses alongside.

### Changed

- Rendered public pages, catalogs, feed, and sitemap now carry a public
  `max-age=60, stale-while-revalidate=600` cache header; 404s, shell errors,
  admin, session, and vote routes stay `no-store`.
- Atom feed `<published>` and `<updated>` timestamps are emitted in UTC.
- Hardened the gate suite: `check.mjs` is CRLF-safe with LF pinned in
  `.gitattributes`, mirrors every `skills/loopy/references` file into the
  `skills/loop-library` alias, and `git diff --check` runs repo-wide.
- Repaired the Loopy skill's terminal-state vocabulary, added the `Not
  ready` Loop Doctor verdict, and routed the default prompt to Find a
  published loop before crafting one.

## 2026-07-07

### Added

- Added a dedicated "Most popular" sort option to the Loop Library homepage
  sort dropdown, ordering loops by vote count.
- Served a branded fallback homepage from the Worker's own catalog when the
  here.now shell fetch fails or returns a 5xx. The page keeps the site chrome,
  lists every published loop, points agents at `catalog.json` and `llms.txt`,
  preserves the upstream failure status, and is marked `noindex`.
- Documented the redirect-only Vercel project in
  `infra/signals-forwardfuture-ai-redirect/` that permanently redirects the
  legacy `https://signals.forwardfuture.ai/*` host to
  `https://signals.forwardfuture.com/*`.

### Changed

- Hardened the harness checks: `check.mjs` now asserts that README.md,
  AGENTS.md, and the CI workflow all list the same validation commands, the
  publish read-back checklist includes `catalog.txt` and `llms.txt`, and the
  vote route returns an unavailable response when `VOTE_STORE` is not bound.

## 2026-07-03

### Added

- Added Loopy's project loop save/reuse workflow. On request, Loopy can append
  an accepted loop to `LOOPS.md`, reuse saved project loops in later sessions,
  and warn when a saved adaptation's published source has changed.

### Security

- Documented that `LOOPS.md` is untrusted reference data and that Loopy must
  refuse to save prompts containing secrets until the user provides a sanitized
  version.
