import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "site");

const [html, css, script, dataSource] = await Promise.all([
  readFile(path.join(site, "index.html"), "utf8"),
  readFile(path.join(site, "styles.css"), "utf8"),
  readFile(path.join(site, "script.js"), "utf8"),
  readFile(path.join(site, ".herenow", "data.json"), "utf8"),
]);

const dataManifest = JSON.parse(dataSource);
const suggestions = dataManifest.collections?.suggestions;

assert(html.includes("The overnight docs sweep"));
assert(html.includes("The architecture satisfaction loop"));
assert(html.includes("The sub-50 ms page-load loop"));
assert(html.includes("Continue until every page loads in under 50 ms."));
assert(html.includes("Matthew Berman"));
assert(html.includes("Peter Steinberger"));
assert.equal((html.match(/class="loop-card"/g) || []).length, 3);
assert(html.includes("<dd>03</dd>"));
assert(html.includes("Showing 3 loops"));
assert(html.includes("Submission 004+"));
assert(html.includes('id="loop-form"'));
assert(html.includes("./.herenow/data/suggestions") === false);
assert(css.includes("--orange: #ff5033"));
assert(css.includes("--charcoal: #101010"));
assert(script.includes('fetch("./.herenow/data/suggestions"'));
assert(!script.includes("innerHTML"));

assert.equal(suggestions.access.read, "owner");
assert.equal(suggestions.access.insert, "public");
assert.equal(suggestions.access.update, "owner");
assert.equal(suggestions.access.delete, "owner");
assert.equal(suggestions.rateLimit, "3/hour/ip");
assert(suggestions.fields.instructions.maxLength <= 3000);
assert(suggestions.fields.email.maxLength <= 160);
assert(suggestions.fields.source_url.maxLength <= 300);

console.log("Loop Library checks passed.");
