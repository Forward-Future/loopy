import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { loops, site } from "./loop-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const socialRoot = path.join(root, "site", "assets", "social");
const expectedScreenshots = [
  `loop-library-${site.socialImageVersion}.${site.socialImageExtension}`,
  ...loops.map(
    (loop) =>
      `${loop.slug}-${site.socialImageVersion}.${site.socialImageExtension}`,
  ),
];

const screenshots = await Promise.all(
  expectedScreenshots.map((name) =>
    readFile(path.join(socialRoot, name)).then((contents) => ({ name, contents })),
  ),
);

for (const { name, contents } of screenshots) {
  const repositoryPath = path.posix.join("site", "assets", "social", name);
  const committed = spawnSync("git", ["show", `HEAD:${repositoryPath}`], {
    cwd: root,
  });
  const error = committed.stderr.toString();
  const isNewVersion =
    committed.status === 128 &&
    (error.includes("exists on disk, but not in 'HEAD'") ||
      error.includes("does not exist in 'HEAD'"));

  if (committed.status === 0 && !committed.stdout.equals(contents)) {
    throw new Error(
      `Refusing to replace ${name} under the existing socialImageVersion. ` +
        "Bump the version before changing a screenshot.",
    );
  }

  if (committed.status !== 0 && !isNewVersion) {
    throw new Error(`Could not inspect committed screenshot ${name}: ${error}`);
  }
}

const homepagePath = path.join(root, "site", "index.html");
const homepage = await readFile(homepagePath, "utf8");
const escapedBaseUrl = site.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const homepageImagePattern = new RegExp(
  `${escapedBaseUrl}assets/social/loop-library-[a-zA-Z0-9.-]+\\.(?:jpg|png)`,
  "g",
);
const homepageImageMatches = homepage.match(homepageImagePattern) ?? [];
const homepageImageUrl = `${site.baseUrl}assets/social/loop-library-${site.socialImageVersion}.${site.socialImageExtension}`;
const homepageImageTypePattern =
  /(<meta property="og:image:type" content=")image\/(?:jpeg|png)(" \/>)/g;
const homepageImageTypeMatches = homepage.match(homepageImageTypePattern) ?? [];

if (homepageImageMatches.length !== 4) {
  throw new Error(
    `Expected four homepage social-image references; found ${homepageImageMatches.length}.`,
  );
}

if (homepageImageTypeMatches.length !== 1) {
  throw new Error(
    `Expected one homepage social-image type; found ${homepageImageTypeMatches.length}.`,
  );
}

const updatedHomepage = homepage
  .replaceAll(homepageImagePattern, homepageImageUrl)
  .replace(
    homepageImageTypePattern,
    `$1${site.socialImageMimeType}$2`,
  );
if (updatedHomepage !== homepage) {
  await writeFile(homepagePath, updatedHomepage);
  console.log(`Updated homepage social metadata to ${homepageImageUrl}.`);
}

console.log(`Validated ${expectedScreenshots.length} social page screenshots.`);
