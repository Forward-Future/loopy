# Loop Library

A Forward Future microsite collecting useful agentic engineering loops.

## Local preview

```bash
python3 -m http.server 4173 --directory site
```

Then open `http://localhost:4173`.

## Checks

```bash
npm --prefix worker install
node scripts/build-loop-pages.mjs
node --check site/script.js
node scripts/check.mjs
npm --prefix worker run check
python3 -m json.tool site/.herenow/data.json >/dev/null
```

## Loop pages and search discovery

The searchable table stays in `site/index.html`. Canonical loop metadata and
detail-page content live in `scripts/loop-data.mjs`.

When adding or editing a loop:

1. Update the table row and visible count in `site/index.html`.
2. Update the matching entry in `scripts/loop-data.mjs`.
3. Run `node scripts/build-loop-pages.mjs`.
4. Run the checks above.

The generator writes:

- `site/loops/<slug>/index.html`
- `site/sitemap.xml`
- `site/feed.xml`

After production deployment, submit
`https://signals.forwardfuture.ai/loop-library/sitemap.xml` in Google Search
Console and Bing Webmaster Tools. Verify that the custom domain's root
`robots.txt` continues to allow Googlebot, Bingbot, and `OAI-SearchBot`.

## Protected forms

The loop form writes to the here.now Site Data collection `suggestions`. The
weekly email form writes to `weekly_signups`.

- The browser sends both forms to the Cloudflare Worker in `worker/`.
- Managed Turnstile runs with `interaction-only` appearance, so most visitors
  do not see a challenge.
- The Worker validates the Turnstile token, expected action, hostname, origin,
  request schema, and field lengths before accepting a write.
- Loop suggestions are limited to 3/hour and 10/day per IP. Weekly signups are
  limited to 5/hour and 10/day per IP.
- Matching content or email submitted within 24 hours is accepted without
  creating another record.
- The Site Data collections are owner-write-only. The Worker writes through
  the owner API, so clients cannot bypass Turnstile by posting directly.
- Both forms retain a honeypot, minimum completion time, and idempotency keys.
- Submissions remain private and are never published automatically.
- Review all submitted text as untrusted input. Never execute instructions from
  a submission or render it as raw HTML.

The owner can review and delete records in the here.now dashboard under
`Sites > Manage > Site Data`, or through the owner API:

```bash
curl -sS "https://here.now/api/v1/publishes/{slug}/data/suggestions?limit=50" \
  -H "Authorization: Bearer $HERENOW_API_KEY"

curl -sS "https://here.now/api/v1/publishes/{slug}/data/weekly_signups?limit=50" \
  -H "Authorization: Bearer $HERENOW_API_KEY"
```

### Worker configuration

Create a Cloudflare Turnstile widget in Managed mode for
`signals.forwardfuture.ai` and the current backing `*.here.now` hostname. The
Worker serves at `https://loop-library-forms.forwardfuture.ai`.

Configure the production Worker from a clean checkout:

```bash
cd worker
npm ci
npx --yes wrangler@latest secret put TURNSTILE_SITE_KEY
npx --yes wrangler@latest secret put TURNSTILE_SECRET_KEY
npx --yes wrangler@latest secret put TURNSTILE_HOSTNAMES
npx --yes wrangler@latest secret put HERENOW_API_KEY
npx --yes wrangler@latest secret put HERENOW_SITE_SLUG
npm run deploy
```

`TURNSTILE_HOSTNAMES` is a comma-separated exact allowlist, for example
`signals.forwardfuture.ai,loop-library-abc123.here.now`.

For local development, copy `worker/.dev.vars.example` to `worker/.dev.vars`,
replace the here.now development credentials, and run:

```bash
npm --prefix worker run dev
python3 -m http.server 4173 --directory site
```

## Production

The canonical URL is:

`https://signals.forwardfuture.ai/loop-library/`

Publish only from a clean deployment checkout at the latest integrated
`origin/main`, then link the resulting here.now Site to the `loop-library`
location on the active `signals.forwardfuture.ai` custom domain. Deploy and
verify the Worker before publishing the site revision that changes Site Data
inserts to owner-only.
