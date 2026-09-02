# Changelog

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
