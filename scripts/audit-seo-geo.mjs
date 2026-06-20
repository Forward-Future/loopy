import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { loops, site } from "./loop-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(root, "site");
const benchmark = JSON.parse(
  await readFile(
    path.join(root, "scripts", "seo-geo-query-benchmark.json"),
    "utf8",
  ),
);

const findings = [];

function addFinding(severity, area, message, page = null) {
  findings.push({ severity, area, message, ...(page ? { page } : {}) });
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textContent(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/\s+/g, " ")
    .trim();
}

function elementText(html, tag, attributes = "") {
  const attributePattern = attributes
    ? `(?=[^>]*${escapePattern(attributes)})`
    : "";
  const match = html.match(
    new RegExp(`<${tag}\\b${attributePattern}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  return match ? textContent(match[1]) : "";
}

function attributeValue(html, tag, attribute, selectorAttribute, selectorValue) {
  const tagMatches = html.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) || [];
  const selectorPattern = new RegExp(
    `${selectorAttribute}=["']${escapePattern(selectorValue)}["']`,
    "i",
  );
  const selected = tagMatches.find((candidate) => selectorPattern.test(candidate));
  return selected?.match(
    new RegExp(`${attribute}=["']([^"']+)["']`, "i"),
  )?.[1] || "";
}

function jsonLd(html) {
  return (html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi) || [])
    .map((block) => block.replace(/^.*?<script type="application\/ld\+json">\s*/i, "").replace(/\s*<\/script>\s*$/i, ""))
    .map((source) => JSON.parse(source));
}

function normalize(value) {
  return value.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
}

const homepage = await readFile(path.join(siteRoot, "index.html"), "utf8");
const learningPage = await readFile(
  path.join(siteRoot, "learn", "index.html"),
  "utf8",
);
const agentPage = await readFile(
  path.join(siteRoot, "agents", "index.html"),
  "utf8",
);
const sitemap = await readFile(path.join(siteRoot, "sitemap.xml"), "utf8");
const pages = new Map([
  ["index.html", homepage],
  ["learn/index.html", learningPage],
  ["agents/index.html", agentPage],
]);

await Promise.all(
  loops.map(async (loop) => {
    const relativePath = `loops/${loop.slug}/index.html`;
    pages.set(
      relativePath,
      await readFile(path.join(siteRoot, relativePath), "utf8"),
    );
  }),
);

const expectedUrls = [
  site.baseUrl,
  `${site.baseUrl}learn/`,
  `${site.baseUrl}agents/`,
  ...loops.map((loop) => `${site.baseUrl}loops/${loop.slug}/`),
];
const siteUrl = new URL(site.baseUrl);
const internalTargets = new Map();

for (const url of expectedUrls) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    addFinding("critical", "crawlability", `Sitemap is missing ${url}.`);
  }
}

if ((sitemap.match(/<loc>/g) || []).length !== expectedUrls.length) {
  addFinding(
    "high",
    "crawlability",
    `Sitemap URL count does not match the ${expectedUrls.length} canonical HTML pages.`,
  );
}

const titles = new Map();
const descriptions = new Map();
const incomingLinks = new Map(expectedUrls.map((url) => [url, 0]));

for (const [relativePath, html] of pages) {
  const isHome = relativePath === "index.html";
  const expectedUrl = isHome
    ? site.baseUrl
    : `${site.baseUrl}${relativePath.replace(/index\.html$/, "")}`;
  const title = elementText(html, "title");
  const description = attributeValue(html, "meta", "content", "name", "description");
  const robots = attributeValue(html, "meta", "content", "name", "robots");
  const robotsDirectives = new Set(
    robots
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(Boolean),
  );
  const canonical = attributeValue(html, "link", "href", "rel", "canonical");
  const h1 = elementText(html, "h1");
  const pageText = textContent(html);

  if (!title || !description || !h1) {
    addFinding("critical", "page intent", "Title, description, or H1 is missing.", relativePath);
  }
  if (
    !robotsDirectives.has("index") ||
    !robotsDirectives.has("follow") ||
    robotsDirectives.has("noindex") ||
    robotsDirectives.has("nofollow")
  ) {
    addFinding("critical", "indexation", "Page is not explicitly index,follow.", relativePath);
  }
  if (canonical !== expectedUrl) {
    addFinding("critical", "indexation", `Canonical should be ${expectedUrl}.`, relativePath);
  }

  titles.set(title, [...(titles.get(title) || []), relativePath]);
  descriptions.set(description, [
    ...(descriptions.get(description) || []),
    relativePath,
  ]);

  if (title.length > 60) {
    addFinding(
      "low",
      "titles",
      `Title is ${title.length} characters and may truncate in some results.`,
      relativePath,
    );
  }
  if (description.length > 160) {
    addFinding(
      "low",
      "titles",
      `Description is ${description.length} characters and may truncate in some results.`,
      relativePath,
    );
  }

  try {
    const graphs = jsonLd(html);
    if (graphs.length === 0 || !graphs.every((graph) => graph["@context"] === "https://schema.org")) {
      addFinding("high", "structured data", "Schema.org JSON-LD is missing.", relativePath);
    }
  } catch (error) {
    addFinding(
      "critical",
      "structured data",
      `JSON-LD does not parse: ${error.message}`,
      relativePath,
    );
  }

  for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)) {
    try {
      const linkedUrl = new URL(match[1], expectedUrl);
      const normalizedUrl = linkedUrl.href.split("#")[0];
      if (normalizedUrl !== expectedUrl && incomingLinks.has(normalizedUrl)) {
        incomingLinks.set(normalizedUrl, incomingLinks.get(normalizedUrl) + 1);
      }

      if (
        linkedUrl.origin === siteUrl.origin &&
        linkedUrl.pathname.startsWith(siteUrl.pathname)
      ) {
        const relativeUrlPath = decodeURIComponent(
          linkedUrl.pathname.slice(siteUrl.pathname.length),
        );
        const targetPath =
          relativeUrlPath === "" || relativeUrlPath.endsWith("/")
            ? `${relativeUrlPath}index.html`
            : relativeUrlPath;
        const key = `${targetPath}${linkedUrl.hash}`;
        const target = internalTargets.get(key) || {
          fragment: decodeURIComponent(linkedUrl.hash.slice(1)),
          sources: new Set(),
          targetPath,
        };
        target.sources.add(relativePath);
        internalTargets.set(key, target);
      }
    } catch {
      addFinding("medium", "internal links", `Invalid link ${match[1]}.`, relativePath);
    }
  }

  if (relativePath.startsWith("loops/")) {
    const loop = loops.find((candidate) => relativePath.includes(candidate.slug));
    const detailsIndex = html.indexOf('<details class="detail-more">');
    const ledeIndex = html.indexOf('class="detail-lede"');
    const promptIndex = html.indexOf("data-prompt");
    const verifyIndex = html.indexOf('class="verification-card"');

    if (
      detailsIndex < 0 ||
      ledeIndex < 0 ||
      promptIndex < 0 ||
      verifyIndex < 0 ||
      Math.max(ledeIndex, promptIndex, verifyIndex) > detailsIndex
    ) {
      addFinding(
        "high",
        "answer-first content",
        "Description, prompt, and verification must appear before collapsed guidance.",
        relativePath,
      );
    }

    if (loop.sourceUrl) {
      if (!html.includes(`href="${loop.sourceUrl}"`) || !html.includes("isBasedOn")) {
        addFinding(
          "high",
          "source citations",
          "Contributed loop is missing its visible source link or isBasedOn schema.",
          relativePath,
        );
      }
    } else if (!pageText.includes(`Contributed by ${loop.author}`)) {
      addFinding(
        "medium",
        "source citations",
        "Original loop is missing visible contributor attribution.",
        relativePath,
      );
    }
  }
}

for (const { fragment, sources, targetPath } of internalTargets.values()) {
  const targetFile = path.resolve(siteRoot, targetPath);
  const sourceList = [...sources].join(", ");

  if (!targetFile.startsWith(`${siteRoot}${path.sep}`)) {
    addFinding(
      "critical",
      "internal links",
      `Internal link escapes the site root: ${targetPath}.`,
      sourceList,
    );
    continue;
  }

  try {
    await access(targetFile);
  } catch {
    addFinding(
      "critical",
      "internal links",
      `Internal link target does not exist: ${targetPath}.`,
      sourceList,
    );
    continue;
  }

  if (fragment && targetPath.endsWith(".html")) {
    const targetHtml = pages.get(targetPath) || (await readFile(targetFile, "utf8"));
    const fragmentPattern = new RegExp(
      `(?:id|name)=["']${escapePattern(fragment)}["']`,
      "i",
    );
    if (!fragmentPattern.test(targetHtml)) {
      addFinding(
        "high",
        "internal links",
        `Internal fragment does not exist: ${targetPath}#${fragment}.`,
        sourceList,
      );
    }
  }
}

for (const [title, titlePages] of titles) {
  if (titlePages.length > 1) {
    addFinding("high", "titles", `Duplicate title: ${title}.`, titlePages.join(", "));
  }
}

for (const [description, descriptionPages] of descriptions) {
  if (descriptionPages.length > 1) {
    addFinding(
      "high",
      "page intent",
      `Duplicate description: ${description}.`,
      descriptionPages.join(", "),
    );
  }
}

for (const [url, count] of incomingLinks) {
  if (url !== site.baseUrl && count === 0) {
    addFinding("high", "internal links", `No internal link points to ${url}.`);
  }
}

for (const item of benchmark.queries) {
  const html = pages.get(item.expectedPath);
  if (!html) {
    addFinding(
      "critical",
      "priority queries",
      `${item.id} has no mapped page at ${item.expectedPath}.`,
    );
    continue;
  }

  const normalizedPage = normalize(textContent(html));
  for (const phrase of item.requiredPhrases) {
    if (!normalizedPage.includes(normalize(phrase))) {
      addFinding(
        "high",
        "priority queries",
        `${item.id} is mapped to ${item.expectedPath}, but the page does not clearly answer with “${phrase}”.`,
        item.expectedPath,
      );
    }
  }
}

for (const loop of loops) {
  const relativePath = `loops/${loop.slug}/index.html`;
  const html = pages.get(relativePath);
  const expectedPhrases = [loop.title.replace(/^The /, ""), loop.description];
  if (!expectedPhrases.every((phrase) => normalize(textContent(html)).includes(normalize(phrase)))) {
    addFinding(
      "high",
      "priority queries",
      `${loop.seoTitle} does not map to a clear answer-ready detail page.`,
      relativePath,
    );
  }
}

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
findings.sort(
  (left, right) =>
    severityOrder[left.severity] - severityOrder[right.severity] ||
    left.area.localeCompare(right.area) ||
    (left.page || "").localeCompare(right.page || ""),
);

const summary = {
  pages: pages.size,
  priorityQueries: benchmark.queries.length + loops.length,
  findings: {
    critical: findings.filter(({ severity }) => severity === "critical").length,
    high: findings.filter(({ severity }) => severity === "high").length,
    medium: findings.filter(({ severity }) => severity === "medium").length,
    low: findings.filter(({ severity }) => severity === "low").length,
  },
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ summary, findings }, null, 2));
} else {
  console.log(
    `SEO/GEO audit: ${summary.pages} pages, ${summary.priorityQueries} priority-query mappings`,
  );
  console.log(
    `Findings: ${summary.findings.critical} critical, ${summary.findings.high} high, ${summary.findings.medium} medium, ${summary.findings.low} low`,
  );
  for (const finding of findings) {
    console.log(
      `- ${finding.severity.toUpperCase()} [${finding.area}]${finding.page ? ` ${finding.page}:` : ""} ${finding.message}`,
    );
  }
}

if (summary.findings.critical > 0 || summary.findings.high > 0) {
  process.exitCode = 1;
}
