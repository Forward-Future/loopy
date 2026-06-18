# Loop Library Operating Rules

## Adding or editing loops

- Treat `scripts/loop-data.mjs` as the canonical SEO/GEO content catalog for
  every public loop.
- Keep the matching searchable row in `site/index.html` aligned with the
  catalog entry, including title, prompt, attribution, link, and visible
  count.
- Every loop must have a stable slug, unique search title and description,
  contributor attribution, published and modified dates, practical context,
  verification criteria, and related-loop links.
- After changing the catalog or homepage rows, run
  `node scripts/build-loop-pages.mjs`, capture the versioned page screenshots,
  and then run `node scripts/build-social-images.mjs`. Commit the screenshots,
  generated detail pages, `site/sitemap.xml`, and `site/feed.xml`.
- Run the full repository checks before committing:

  ```bash
  node scripts/build-loop-pages.mjs
  node scripts/build-social-images.mjs
  node --check scripts/build-social-images.mjs
  node --check site/script.js
  node --check scripts/build-loop-pages.mjs
  node --check scripts/loop-data.mjs
  node scripts/check.mjs
  npm --prefix worker run check
  python3 -m json.tool site/.herenow/data.json >/dev/null
  git diff --check
  ```

- Do not add a loop if the checks report drift between the homepage, catalog,
  generated pages, structured data, sitemap, or feed.

## Deployment

- Treat `deploy` in a thread as a request to commit and land only that thread's
  changes, then deploy the affected site from the newest `origin/main` commit
  that contains those changes.
- Never deploy from a task worktree, dirty checkout, feature branch, or partial
  file overlay. Publish the complete `site/` directory from a clean deployment
  checkout on latest integrated main.
- Serialize deployments with
  `/Users/matthewberman/.codex/deploy-locks/loop-library.lock`. Wait for an
  active deployment, then fetch and fast-forward again before selecting the
  deployment revision.
- Hold the lock through here.now finalize and production verification.
- Deploy and verify the form Worker before publishing a site revision that
  changes Site Data form collections to owner-only.
- Verify both `https://signals.forwardfuture.ai/loop-library/` and the backing
  here.now Site before reporting success.
