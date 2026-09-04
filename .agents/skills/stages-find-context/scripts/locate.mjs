import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");
const manifest = JSON.parse(readFileSync(path.join(root, "docs/content/coverage-manifest.json"), "utf8"));
const query = process.argv.slice(2).join(" ").trim();

if (!query) {
  console.error("Usage: node .agents/skills/stages-find-context/scripts/locate.mjs <symbol|topic|path>");
  process.exit(2);
}

const routePath = (route) => `docs/content${route.split("#")[0]}.mdx`;
const docsExamples = readdirSync(path.join(root, "docs/examples")).filter((file) => /\.tsx?$/.test(file));
const examplePath = (region) => docsExamples.find((file) =>
  readFileSync(path.join(root, "docs/examples", file), "utf8").includes(`source:start ${region}`));
const normalized = query.replaceAll("\\", "/");
const symbolQuery = normalized.includes(".") ? normalized.split(".").at(-1) : normalized;
const queryTokens = normalized.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
let match;
let owner;

for (const packageRecord of manifest.packages) {
  const found = packageRecord.exports.find(({ symbol }) => symbol.toLowerCase() === symbolQuery.toLowerCase());
  if (found) {
    match = found;
    owner = packageRecord;
    break;
  }
  if (normalized.startsWith(packageRecord.entrypoint.split("/src/")[0])) owner ??= packageRecord;
}

if (!match && !normalized.includes("/") && !normalized.startsWith("StagesController.")) {
  let bestScore = 0;
  for (const packageRecord of manifest.packages) {
    for (const candidate of packageRecord.exports) {
      const searchable = `${candidate.symbol} ${candidate.guide ?? ""} ${candidate.reference ?? ""}`.toLowerCase();
      const score = queryTokens.filter((token) => searchable.includes(token)).length;
      if (score > bestScore) {
        bestScore = score;
        match = candidate;
        owner = packageRecord;
      }
    }
  }
}

if (!match && normalized.startsWith("StagesController.")) {
  owner = manifest.packages.find(({ package: packageName }) => packageName === "@stages/core");
  match = owner?.exports.find(({ symbol }) => symbol === "StagesController");
}

if (!owner) {
  console.log("Topic map: .agents/skills/stages-find-context/references/topic-map.md");
  process.exit(0);
}

const results = [];
const add = (label, value) => {
  if (value && !results.some((item) => item.value === value) && results.length < 6) results.push({ label, value });
};
add("Declaration", owner.entrypoint);
for (const test of owner.tests ?? []) add("Test", test);
if (match) {
  const guide = match.guide ?? (normalized.startsWith("StagesController.") ? "/core-concepts/controller-lifecycle" : undefined);
  if (guide) add("Guide", routePath(guide));
  if (match.reference) add("Reference", `${routePath(match.reference)}${match.reference.includes("#") ? `#${match.reference.split("#")[1]}` : ""}`);
  const example = match.examples?.[0];
  const source = example && examplePath(example);
  if (source) add("Checked example", `docs/examples/${source}#${example}`);
}
for (const result of results) console.log(`${result.label}: ${result.value}`);
