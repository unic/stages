import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const criteria = [
  ["Core has zero runtime dependencies", [["packages/core/package.json", "\"sideEffects\": false"], ["scripts/verify-v1-packages.mjs", "coreManifest.dependencies"]]],
  ["Package import is SSR-safe", [["scripts/verify-v1-packages.mjs", "from \"@stages/core\""], ["scripts/verify-v1-packages.mjs", "from \"@stages/react\""]]],
  ["Strict TypeScript build has no explicit `any` escape hatches", [["packages/core/tsconfig.json", "\"strict\": true"], ["package.json", "packages/test-kit/tsconfig.json --noEmit"]]],
  ["Every supported structural node can nest", [["packages/core/test/nesting.test.mjs", "every structural nesting permutation and a deep mixed tree preserve runtime contracts"]]],
  ["Input/config objects remain unchanged", [["packages/core/test/property.test.mjs", "input mutation"], ["packages/core/test/schema.test.mjs", "evaluation does not mutate frozen schema or values"]]],
  ["`demo/pages/dynamicfields.jsx`", [["packages/core/test/schema.test.mjs", "dynamic schemas and resolvers recursively derive paths and stable row addresses"], ["docs/LEGACY_DEMO_COVERAGE.md", "`dynamicfields`"]]],
  ["A schema factory can add/remove nested fields", [["packages/core/test/controller-property.test.mjs", "dynamic schema mismatch"], ["packages/core/test/controller.test.mjs", "conditional nodes retain metadata while structural removals discard it"]]],
  ["A schema factory runs at most once per transaction", [["packages/core/test/controller-property.test.mjs", "schema factory ran"], ["scripts/check-v1-performance.mjs", "maximumResolverEvaluationsPerField"]]],
  ["One hundred synchronous dispatches", [["packages/core/test/controller.test.mjs", "one hundred batched events publish once and reevaluate dynamics once"]]],
  ["Selector subscribers for unaffected field snapshots", [["packages/core/test/controller.test.mjs", "selector subscribers skip structurally shared unaffected fields"], ["scripts/check-v1-performance.mjs", "Exactly one field selector must publish."]]],
  ["Two controllers with identical paths", [["packages/core/test/controller.test.mjs", "controllers have independent batches and metadata"]]],
  ["Async validation cancellation", [["packages/core/test/validation.test.mjs", "pending validators are cooperatively cancelled"], ["packages/core/test/validation.test.mjs", "out-of-order event validation cannot publish"]]],
  ["`snapshot.validation.isValid`", [["packages/core/test/validation.test.mjs", "wizard validation gates unknown, pending, invalid, warning, and hidden-stage navigation"]]],
  ["Serialization either round-trips exactly", [["packages/core/test/serialization.test.mjs", "a value codec round-trips non-JSON domain values"], ["packages/core/test/serialization.test.mjs", "JSON encoding rejects unsupported values with precise paths"]]],
  ["Recreated state preserves value", [["packages/core/test/serialization.test.mjs", "revealed validation state survives recreation"], ["packages/core/test/controller.test.mjs", "engine row keys and touched state follow rows through moves and recreation"]]],
  ["A custom non-native component", [["packages/dom/test/dom.test.mjs", "DOM view tokens can render arbitrary custom controls"], ["packages/react/test/react.test.mjs", "React field binding renders an opaque view"]]],
  ["The same core controller contract", [["packages/test-kit/test/adapter-contract.test.mjs", "Vue-style refs consume snapshots"], ["packages/test-kit/test/adapter-contract.test.mjs", "Angular-style change detection consumes the identical contract"]]],
  ["Migration docs explicitly map or reject", [["scripts/check-v1-docs.mjs", "legacyConcepts"], ["docs/MIGRATING_TO_V1.md", "Package and root-export map"]]],
];

const architecture = await readFile(path.join(root, "docs/V1_ARCHITECTURE_PLAN.md"), "utf8");
const acceptanceSection = architecture
  .split("## 17. v1.0 acceptance criteria\n")[1]
  ?.split("\n## 18. Decisions to ratify before implementation")[0];
assert(acceptanceSection, "The architecture plan must retain its v1 acceptance section.");
const architectureCriteria = acceptanceSection.match(/^- .+$/gm) ?? [];
assert.equal(architectureCriteria.length, criteria.length, "Every architecture acceptance criterion must have executable evidence.");

const review = await readFile(path.join(root, "docs/V1_ACCEPTANCE_REVIEW.md"), "utf8");
for (const [index, [fragment, evidence]] of criteria.entries()) {
  const id = `AC-${String(index + 1).padStart(2, "0")}`;
  assert(architectureCriteria[index].includes(fragment), `${id} no longer matches the architecture criterion it audits.`);
  assert(review.includes(`| ${id} | Automated |`), `${id} is missing from the acceptance review.`);
  for (const [relativeFile, needle] of evidence) {
    const source = await readFile(path.join(root, relativeFile), "utf8");
    assert(source.includes(needle), `${id} lost evidence ${relativeFile}: ${needle}`);
  }
}

async function TypeScriptSources(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await TypeScriptSources(target));
    else if (/\.tsx?$/.test(entry.name)) files.push(target);
  }
  return files;
}

for (const packageName of ["core", "dom", "react", "test-kit"]) {
  for (const file of await TypeScriptSources(path.join(root, "packages", packageName, "src"))) {
    const source = await readFile(file, "utf8");
    assert(!/\bany\b/.test(source), `${path.relative(root, file)} contains an explicit any escape hatch.`);
    assert(!/@ts-(?:ignore|nocheck)/.test(source), `${path.relative(root, file)} disables TypeScript checking.`);
  }
}

const coreManifest = JSON.parse(await readFile(path.join(root, "packages/core/package.json"), "utf8"));
assert.equal(coreManifest.dependencies, undefined, "@stages/core must have zero runtime dependencies.");
for (const file of await TypeScriptSources(path.join(root, "packages/core/src"))) {
  const source = await readFile(file, "utf8");
  const importSpecifiers = [...source.matchAll(/^\s*import\s+[\s\S]*?\sfrom\s+["']([^"']+)["'];/gm)];
  const exportSpecifiers = [...source.matchAll(/^\s*export\s+(?:\*|\{)[^;]*?\sfrom\s+["']([^"']+)["'];/gm)];
  const specifiers = [...importSpecifiers, ...exportSpecifiers].map((match) => match[1]);
  assert(specifiers.every((specifier) => specifier.startsWith(".")), `${path.relative(root, file)} imports a non-core runtime.`);
  assert(!/\b(?:document|window|HTMLElement|customElements|navigator)\b/.test(source), `${path.relative(root, file)} contains a browser global.`);
}

console.log(`v1 acceptance evidence check passed (${criteria.length} criteria)`);
