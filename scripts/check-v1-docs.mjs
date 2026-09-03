import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const contentRoot = path.join(repositoryRoot, "docs/content");
const fromRoot = (relativePath) => path.join(repositoryRoot, relativePath);
const readRoot = (relativePath) => readFile(fromRoot(relativePath), "utf8");

async function filesBelow(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(absolute, extension);
    return entry.name.endsWith(extension) ? [absolute] : [];
  }));
  return nested.flat();
}

function sorted(values) {
  return [...new Set(values)].sort();
}

function assertSameInventory(actual, expected, label) {
  assert.deepEqual(sorted(actual), sorted(expected), `${label} inventory drifted`);
}

const [baseline, migration, api, demoSource, exampleSource, checkedSourceComponent, mdxComponents, manifestSource] = await Promise.all([
  readRoot("docs/CURRENT_IMPLEMENTATION_API.md"),
  readRoot("docs/MIGRATING_TO_V1.md"),
  readRoot("docs/V1_API.md"),
  readRoot("docs/components/StagesDemo.jsx"),
  readRoot("docs/components/StagesExample.jsx"),
  readRoot("docs/components/CheckedSource.jsx"),
  readRoot("docs/mdx-components.jsx"),
  readRoot("docs/content/coverage-manifest.json"),
]);

const manifest = JSON.parse(manifestSource);
assert.equal(manifest.schemaVersion, 1);
assert.deepEqual(manifest.statusValues, ["complete", "partial", "missing"]);

const mdxPaths = await filesBelow(contentRoot, ".mdx");
const guideEntries = await Promise.all(mdxPaths.map(async (absolutePath) => ({
  absolutePath,
  relativePath: path.relative(contentRoot, absolutePath),
  source: await readFile(absolutePath, "utf8"),
})));
const guideCorpus = guideEntries.map(({ source }) => source).join("\n");

const routeFor = (relativePath) => {
  const withoutExtension = relativePath.replace(/\.mdx$/, "").split(path.sep).join("/");
  return withoutExtension === "index" ? "/" : `/${withoutExtension.replace(/\/index$/, "")}`;
};
const routes = new Set(guideEntries.map(({ relativePath }) => routeFor(relativePath)));

function headingAnchor(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function pageAnchors(source) {
  const anchors = new Set();
  const occurrences = new Map();
  for (const match of source.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const base = headingAnchor(match[1]);
    if (base.length === 0) continue;
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    anchors.add(occurrence === 0 ? base : `${base}-${occurrence}`);
  }
  return anchors;
}

const anchorsByRoute = new Map(
  guideEntries.map(({ relativePath, source }) => [routeFor(relativePath), pageAnchors(source)]),
);

for (const { relativePath, source } of guideEntries) {
  for (const match of source.matchAll(/\]\((\/[a-zA-Z0-9_./-]+)(?:#([a-zA-Z0-9_-]+))?\)/g)) {
    const [, route, anchor] = match;
    assert.ok(routes.has(route), `${relativePath} links to missing route ${route}`);
    if (anchor !== undefined) {
      assert.ok(anchorsByRoute.get(route)?.has(anchor), `${relativePath} links to missing anchor ${route}#${anchor}`);
    }
  }
}

async function validateMeta(directory) {
  // Nextra 4 discovers executable metadata modules, not JSON metadata files.
  const metaPath = path.join(directory, "_meta.js");
  let meta;
  try {
    const source = await readFile(metaPath, "utf8");
    assert.match(source, /^export default\s+\{/);
    meta = JSON.parse(source.replace(/^export default\s+/, "").replace(/;\s*$/, ""));
  } catch (error) {
    assert.fail(`missing or invalid navigation metadata at ${path.relative(repositoryRoot, metaPath)}: ${error}`);
  }
  const names = await readdir(directory, { withFileTypes: true });
  assert.ok(
    names.every((entry) => entry.name !== "_meta.json"),
    `${path.relative(repositoryRoot, directory)} contains unsupported _meta.json metadata`,
  );
  const contentKeys = names.flatMap((entry) => {
    if (entry.isDirectory()) return [entry.name];
    if (entry.isFile() && entry.name.endsWith(".mdx")) return [entry.name.replace(/\.mdx$/, "")];
    return [];
  });
  const configuredContentKeys = Object.keys(meta).filter((key) => contentKeys.includes(key));
  assert.deepEqual(
    sorted(configuredContentKeys),
    sorted(contentKeys),
    `${path.relative(repositoryRoot, metaPath)} must explicitly order every page and section`,
  );
  for (const [key, config] of Object.entries(meta)) {
    if (key === "*") continue;
    if (typeof config === "object" && config !== null && (config.type === "separator" || config.type === "menu" || config.href)) continue;
    const childDirectory = path.join(directory, key);
    const hasFile = names.some((entry) => entry.isFile() && entry.name === `${key}.mdx`);
    const hasDirectory = names.some((entry) => entry.isDirectory() && entry.name === key);
    assert.ok(hasFile || hasDirectory, `${path.relative(repositoryRoot, metaPath)} points to missing ${key}`);
    if (hasDirectory) await validateMeta(childDirectory);
  }
}
await validateMeta(contentRoot);

const completePagePaths = [
  "start/introduction.mdx",
  "start/mental-model.mdx",
  "start/installation.mdx",
  "start/first-controller.mdx",
  "start/react-quickstart.mdx",
  "start/dom-quickstart.mdx",
  "core-concepts/controlled-values.mdx",
  "core-concepts/controller-lifecycle.mdx",
  "core-concepts/schemas.mdx",
  "core-concepts/paths-and-addresses.mdx",
  "core-concepts/field-registry.mdx",
  "core-concepts/events-and-reducers.mdx",
  "core-concepts/transforms-and-patches.mdx",
  "core-concepts/transactions-and-batching.mdx",
  "core-concepts/snapshots-and-subscriptions.mdx",
  "core-concepts/dynamic-configuration.mdx",
  "structures/groups.mdx",
  "structures/collections.mdx",
  "structures/collection-identity.mdx",
  "structures/discriminated-collections.mdx",
  "structures/wizards.mdx",
  "structures/wizard-validation-and-guards.mdx",
  "structures/recursive-composition.mdx",
  "validation/overview.mdx",
  "validation/validators-and-issues.mdx",
  "validation/execution-and-reveal.mdx",
  "validation/scopes-and-aggregation.mdx",
  "validation/dependencies.mdx",
  "validation/async-and-cancellation.mdx",
  "validation/disabled-and-conditional.mdx",
  "validation/failures-and-localization.mdx",
  "persistence/serialization.mdx",
  "persistence/durable-and-ephemeral-state.mdx",
  "persistence/value-codecs.mdx",
  "persistence/extension-state.mdx",
  "persistence/migrations.mdx",
  "persistence/storage-and-autosave.mdx",
  "diagnostics/overview.mdx",
  "diagnostics/recovery.mdx",
  "diagnostics/safety.mdx",
  "diagnostics/observability-and-troubleshooting.mdx",
  "adapters/overview.mdx",
  "adapters/react/lifecycle.mdx",
  "adapters/react/fields.mdx",
  "adapters/react/collections.mdx",
  "adapters/react/wizards.mdx",
  "adapters/react/accessibility.mdx",
  "adapters/react/performance.mdx",
  "adapters/dom/mounting.mdx",
  "adapters/dom/native-fields.mdx",
  "adapters/dom/custom-views.mdx",
  "adapters/dom/focus.mdx",
  "adapters/dom/accessibility.mdx",
  "adapters/custom/contract.mdx",
  "adapters/custom/framework-walkthrough.mdx",
  "adapters/custom/testing-with-test-kit.mdx",
  "reference/core/exports.mdx",
  "reference/core/controller.mdx",
  "reference/core/schema-types.mdx",
  "reference/core/field-types.mdx",
  "reference/core/event-types.mdx",
  "reference/core/snapshot-types.mdx",
  "reference/core/validation-types.mdx",
  "reference/core/persistence-types.mdx",
  "reference/core/path-utilities.mdx",
  "reference/core/collection-utilities.mdx",
  "reference/core/serialization-utilities.mdx",
  "reference/core/schema-utilities.mdx",
  "reference/react.mdx",
  "reference/dom.mdx",
  "reference/test-kit.mdx",
  "reference/standard-events.mdx",
  "reference/diagnostics.mdx",
  "reference/serialization-errors.mdx",
  "reference/package-compatibility.mdx",
  "project/architecture.mdx",
  "project/core-boundaries.mdx",
  "project/performance.mdx",
  "project/release-status.mdx",
  "project/contributing-to-docs.mdx",
  "migration/from-0.x.mdx",
  "migration/packages-and-rendering.mdx",
  "migration/schemas-and-data.mdx",
  "migration/processing-and-events.mdx",
  "migration/validation.mdx",
  "migration/collections-and-wizards.mdx",
  "migration/rollout-checklist.mdx",
  "recipes/index.mdx",
  "recipes/server-save-and-rejection.mdx",
  "recipes/async-options.mdx",
  "recipes/cross-field-calculation.mdx",
  "recipes/conditional-sections.mdx",
  "recipes/collection-crud-and-sort.mdx",
  "recipes/multi-step-checkout.mdx",
  "recipes/focus-error-summary.mdx",
  "recipes/localization.mdx",
  "recipes/persistence-and-resume.mdx",
  "recipes/schema-upgrades.mdx",
  "recipes/undo-redo.mdx",
  "recipes/wizard-routing.mdx",
  "recipes/observability.mdx",
  "recipes/ssr-and-teardown.mdx",
];
for (const relativePath of completePagePaths) {
  const page = guideEntries.find((entry) => entry.relativePath === relativePath);
  assert.ok(page, `missing planned page ${relativePath}`);
  assert.match(page.source, /\*\*For:\*\*/i, `${relativePath} has no audience`);
  assert.match(page.source, /\*\*Prerequisites:\*\*/i, `${relativePath} has no prerequisites`);
  assert.match(page.source, /\bNext:/i, `${relativePath} has no next step`);
  assert.match(page.source, /## Evidence/i, `${relativePath} has no evidence section`);
}

function namedExports(source) {
  const exports = [];
  for (const match of source.matchAll(/export\s+(type\s+)?\{([\s\S]*?)\}\s*(?:from\s+["'][^"']+["'])?\s*;/g)) {
    for (const item of match[2].split(",")) {
      const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[1] ?? item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
      if (name && !name.includes("\n")) exports.push({ symbol: name, kind: match[1] ? "type" : "runtime" });
    }
  }
  return exports;
}

function declarationExports(source) {
  const exports = [];
  for (const match of source.matchAll(/\bexport\s+(?:declare\s+)?(interface|type|class|function|const)\s+([A-Za-z_$][\w$]*)/g)) {
    exports.push({
      symbol: match[2],
      kind: match[1] === "interface" || match[1] === "type" ? "type" : "runtime",
    });
  }
  return exports;
}

async function entrypointExports(entrypoint) {
  const entryAbsolute = fromRoot(entrypoint);
  const entrySource = await readFile(entryAbsolute, "utf8");
  const exports = [...namedExports(entrySource), ...declarationExports(entrySource)];
  for (const match of entrySource.matchAll(/export\s+\*\s+from\s+["']([^"']+)["']/g)) {
    const sourcePath = match[1].replace(/\.js$/, ".ts");
    exports.push(...declarationExports(await readFile(path.resolve(path.dirname(entryAbsolute), sourcePath), "utf8")));
  }
  const unique = new Map(exports.map((item) => [`${item.kind}:${item.symbol}`, item]));
  return [...unique.values()];
}

for (const packageRecord of manifest.packages) {
  assert.ok(packageRecord.package && packageRecord.entrypoint && packageRecord.tests.length > 0);
  const keys = packageRecord.exports.map(({ kind, symbol }) => `${kind}:${symbol}`);
  assert.equal(new Set(keys).size, keys.length, `${packageRecord.package} has duplicate manifest exports`);
  for (const item of packageRecord.exports) {
    assert.ok(manifest.statusValues.includes(item.status), `${packageRecord.package}:${item.symbol} has invalid status`);
    assert.equal(item.status, "complete", `${packageRecord.package}:${item.symbol} is not fully documented`);
    const reference = item.reference || packageRecord.defaultReference;
    assert.ok(reference, `${packageRecord.package}:${item.symbol} has no reference route`);
    const [referenceRoute, referenceAnchor] = reference.split("#");
    assert.ok(routes.has(referenceRoute), `${packageRecord.package}:${item.symbol} has an invalid reference route ${reference}`);
    if (referenceAnchor !== undefined) {
      assert.ok(
        anchorsByRoute.get(referenceRoute)?.has(referenceAnchor),
        `${packageRecord.package}:${item.symbol} has an invalid reference anchor ${reference}`,
      );
    }
    if (item.guide) assert.ok(routes.has(item.guide), `${packageRecord.package}:${item.symbol} has an invalid guide route ${item.guide}`);
  }
  const sourceExports = await entrypointExports(packageRecord.entrypoint);
  assertSameInventory(
    sourceExports.map(({ kind, symbol }) => `${kind}:${symbol}`),
    keys,
    `${packageRecord.package} public exports`,
  );
}

const referencesByGuide = new Map();
const guidesByReference = new Map();
for (const packageRecord of manifest.packages) {
  for (const item of packageRecord.exports) {
    if (item.guide === undefined) continue;
    const referenceRoute = (item.reference || packageRecord.defaultReference).split("#")[0];
    const guideReferences = referencesByGuide.get(item.guide) ?? new Set();
    guideReferences.add(referenceRoute);
    referencesByGuide.set(item.guide, guideReferences);
    const referenceGuides = guidesByReference.get(referenceRoute) ?? new Set();
    referenceGuides.add(item.guide);
    guidesByReference.set(referenceRoute, referenceGuides);
  }
}
for (const [guideRoute, referenceRoutes] of referencesByGuide) {
  const guideSource = guideEntries.find(({ relativePath }) => routeFor(relativePath) === guideRoute)?.source;
  assert.ok(guideSource, `missing guide source for ${guideRoute}`);
  for (const referenceRoute of referenceRoutes) {
    assert.ok(
      guideSource.includes(`](${referenceRoute}`),
      `${guideRoute} does not link to its normative reference ${referenceRoute}`,
    );
  }
}
for (const [referenceRoute, guideRoutes] of guidesByReference) {
  const referenceSource = guideEntries.find(({ relativePath }) => routeFor(relativePath) === referenceRoute)?.source;
  assert.ok(referenceSource, `missing reference source for ${referenceRoute}`);
  assert.ok(
    [...guideRoutes].some((guideRoute) => referenceSource.includes(`](${guideRoute}`)),
    `${referenceRoute} does not link to any checked usage guide`,
  );
}

const controllerTypes = await readRoot("packages/core/src/types.ts");
const controllerBody = controllerTypes.match(/export interface StagesController[\s\S]*?\{([\s\S]*?)\n\}/)?.[1];
assert.ok(controllerBody, "could not find StagesController declaration");
const controllerMethods = [...controllerBody.matchAll(/^\s{2}([A-Za-z_$][\w$]*)(?:<[^\n]+>)?\(/gm)]
  .map((match) => `StagesController.${match[1]}`);
assertSameInventory(controllerMethods, manifest.contracts.controllerMethods, "controller methods");

function readonlyInterfaceMembers(source, interfaceName) {
  const escapedName = interfaceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = source.match(new RegExp(`(?:export )?interface ${escapedName}(?:<[^\\n]+>)?\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1];
  assert.ok(body, `could not find ${interfaceName} declaration`);
  return [...body.matchAll(/^\s{2}readonly\s+([A-Za-z_$][\w$]*)[?:]/gm)].map((match) => match[1]);
}

const snapshotReference = guideEntries.find(({ relativePath }) => relativePath === "reference/core/snapshot-types.mdx")?.source;
assert.ok(snapshotReference, "missing snapshot type reference");
for (const [interfaceName, expectedMembers] of Object.entries(manifest.contracts.snapshotMembers)) {
  assertSameInventory(readonlyInterfaceMembers(controllerTypes, interfaceName), expectedMembers, `${interfaceName} members`);
  for (const member of expectedMembers) {
    assert.ok(snapshotReference.includes(`\`${member}\``), `snapshot reference is missing ${interfaceName}.${member}`);
  }
}

function publicInterfaceMembers(source, interfaceName) {
  const escapedName = interfaceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = source.match(new RegExp(
    `(?:export )?interface ${escapedName}(?:<[^\\n]+>)?[^\\{]*\\{([\\s\\S]*?)\\n\\}`,
  ))?.[1];
  assert.ok(body, `could not find ${interfaceName} declaration`);
  return [...body.matchAll(/^\s{2}(?:readonly\s+)?([A-Za-z_$][\w$]*)(?:[?:]|\()/gm)]
    .map((match) => match[1]);
}

const validationReference = guideEntries.find(
  ({ relativePath }) => relativePath === "reference/core/validation-types.mdx",
)?.source;
assert.ok(validationReference, "missing validation type reference");
for (const [interfaceName, expectedMembers] of Object.entries(manifest.contracts.validationMembers)) {
  assertSameInventory(publicInterfaceMembers(controllerTypes, interfaceName), expectedMembers, `${interfaceName} validation members`);
  for (const member of expectedMembers) {
    assert.ok(validationReference.includes(`\`${member}\``), `validation reference is missing ${interfaceName}.${member}`);
  }
}

const persistenceReference = guideEntries.find(
  ({ relativePath }) => relativePath === "reference/core/persistence-types.mdx",
)?.source;
assert.ok(persistenceReference, "missing persistence type reference");
for (const [interfaceName, expectedMembers] of Object.entries(manifest.contracts.persistenceMembers)) {
  assertSameInventory(publicInterfaceMembers(controllerTypes, interfaceName), expectedMembers, `${interfaceName} persistence members`);
  for (const member of expectedMembers) {
    assert.ok(persistenceReference.includes(`\`${member}\``), `persistence reference is missing ${interfaceName}.${member}`);
  }
}

const reactSource = await readRoot("packages/react/src/index.tsx");
const reactReference = guideEntries.find(({ relativePath }) => relativePath === "reference/react.mdx")?.source;
assert.ok(reactReference, "missing React API reference");
for (const [interfaceName, expectedMembers] of Object.entries(manifest.contracts.reactMembers)) {
  assertSameInventory(publicInterfaceMembers(reactSource, interfaceName), expectedMembers, `${interfaceName} React members`);
  for (const member of expectedMembers) {
    assert.ok(reactReference.includes(`\`${member}\``), `React reference is missing ${interfaceName}.${member}`);
  }
}
const reactPackage = manifest.packages.find(({ package: packageName }) => packageName === "@stages/react");
assert.ok(reactPackage, "missing React package coverage record");
for (const { symbol } of reactPackage.exports) {
  assert.ok(reactReference.includes(symbol), `React reference is missing export ${symbol}`);
}

const domSource = await readRoot("packages/dom/src/index.ts");
const domReference = guideEntries.find(({ relativePath }) => relativePath === "reference/dom.mdx")?.source;
assert.ok(domReference, "missing DOM API reference");
for (const [interfaceName, expectedMembers] of Object.entries(manifest.contracts.domMembers)) {
  assertSameInventory(publicInterfaceMembers(domSource, interfaceName), expectedMembers, `${interfaceName} DOM members`);
  for (const member of expectedMembers) {
    assert.ok(domReference.includes(`\`${member}\``), `DOM reference is missing ${interfaceName}.${member}`);
  }
}
const domPackage = manifest.packages.find(({ package: packageName }) => packageName === "@stages/dom");
assert.ok(domPackage, "missing DOM package coverage record");
for (const { symbol } of domPackage.exports) {
  assert.ok(domReference.includes(symbol), `DOM reference is missing export ${symbol}`);
}

const testKitSource = await readRoot("packages/test-kit/src/index.ts");
const testKitReference = guideEntries.find(({ relativePath }) => relativePath === "reference/test-kit.mdx")?.source;
assert.ok(testKitReference, "missing test-kit API reference");
for (const [interfaceName, expectedMembers] of Object.entries(manifest.contracts.testKitMembers)) {
  assertSameInventory(
    publicInterfaceMembers(testKitSource, interfaceName),
    expectedMembers,
    `${interfaceName} test-kit members`,
  );
  for (const member of expectedMembers) {
    assert.ok(testKitReference.includes(`\`${member}\``), `test-kit reference is missing ${interfaceName}.${member}`);
  }
}
const testKitPackage = manifest.packages.find(({ package: packageName }) => packageName === "@stages/test-kit");
assert.ok(testKitPackage, "missing test-kit package coverage record");
for (const { symbol } of testKitPackage.exports) {
  assert.ok(testKitReference.includes(symbol), `test-kit reference is missing export ${symbol}`);
}

const architecturePage = guideEntries.find(({ relativePath }) => relativePath === "project/architecture.mdx")?.source;
const boundaryPage = guideEntries.find(({ relativePath }) => relativePath === "project/core-boundaries.mdx")?.source;
const releaseStatusPage = guideEntries.find(({ relativePath }) => relativePath === "project/release-status.mdx")?.source;
assert.ok(architecturePage && boundaryPage && releaseStatusPage, "missing project architecture pages");
for (const packageRecord of manifest.packages) {
  assert.ok(architecturePage.includes(`\`${packageRecord.package}\``), `architecture is missing ${packageRecord.package}`);
}
for (const nonFeature of manifest.contracts.architectureNonFeatures) {
  assert.ok(boundaryPage.includes(nonFeature), `core boundaries are missing ${nonFeature}`);
}
const packageManifests = await Promise.all(
  ["core", "dom", "react", "test-kit"].map(async (name) =>
    JSON.parse(await readRoot(`packages/${name}/package.json`))),
);
const packageVersions = packageManifests.map(({ version }) => version);
assert.equal(new Set(packageVersions).size, 1, "v1 package versions must stay aligned");
assert.ok(releaseStatusPage.includes(`\`${packageVersions[0]}\``), "release status has a stale package version");
const compatibilityPage = guideEntries.find(
  ({ relativePath }) => relativePath === "reference/package-compatibility.mdx",
)?.source;
assert.ok(compatibilityPage, "missing package compatibility reference");
for (const packageManifest of packageManifests) {
  assert.equal(packageManifest.type, "module", `${packageManifest.name} must stay ESM`);
  assert.equal(packageManifest.sideEffects, false, `${packageManifest.name} sideEffects changed`);
  assert.equal(packageManifest.exports?.["."]?.types, "./dist/index.d.ts", `${packageManifest.name} types export changed`);
  assert.equal(packageManifest.exports?.["."]?.import, "./dist/index.js", `${packageManifest.name} import export changed`);
  assert.ok(compatibilityPage.includes(`\`${packageManifest.name}\``), `compatibility is missing ${packageManifest.name}`);
  assert.ok(compatibilityPage.includes(`\`${packageManifest.version}\``), `compatibility is missing ${packageManifest.version}`);
  if (packageManifest.name === "@stages/core") {
    assert.equal(packageManifest.dependencies, undefined, "core gained a runtime dependency");
  } else {
    const coreVersion = packageManifest.dependencies?.["@stages/core"];
    assert.equal(coreVersion, packageManifest.version, `${packageManifest.name} core dependency is not aligned`);
    assert.ok(
      compatibilityPage.includes(`\`@stages/core@${coreVersion}\``),
      `compatibility is missing ${packageManifest.name} core dependency`,
    );
  }
  for (const [peer, range] of Object.entries(packageManifest.peerDependencies ?? {})) {
    assert.ok(
      compatibilityPage.includes(`\`${peer}@${range}\``),
      `compatibility is missing ${packageManifest.name} peer ${peer}@${range}`,
    );
  }
}
for (const statement of ["ESM-only", "ES2020", "Browser DOM globals", "CommonJS", "TypeScript"] ) {
  assert.ok(compatibilityPage.includes(statement), `compatibility is missing ${statement}`);
}
assert.match(manifest.reviewed, /^\d{4}-\d{2}-\d{2}$/, "coverage manifest needs an ISO review date");
const escapedPackageVersion = packageVersions[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const referenceEntries = guideEntries.filter(({ relativePath }) => relativePath.startsWith(`reference${path.sep}`));
for (const { relativePath, source } of referenceEntries) {
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1];
  assert.ok(frontmatter, `${relativePath} has no reference frontmatter`);
  assert.match(frontmatter, /^title:\s+.+$/m, `${relativePath} has no reference title metadata`);
  assert.match(frontmatter, /^description:\s+.+$/m, `${relativePath} has no reference description metadata`);
  assert.match(
    frontmatter,
    new RegExp(`^apiVersion:\\s+${escapedPackageVersion}$`, "m"),
    `${relativePath} does not target the current aligned package version`,
  );
  assert.match(
    frontmatter,
    new RegExp(`^lastReviewed:\\s+${manifest.reviewed}$`, "m"),
    `${relativePath} review metadata is stale`,
  );
}

const [controllerSource, schemaSource, collectionSource, serializationSource, eventSource] = await Promise.all([
  readRoot("packages/core/src/controller.ts"),
  readRoot("packages/core/src/schema.ts"),
  readRoot("packages/core/src/collections.ts"),
  readRoot("packages/core/src/serialization.ts"),
  readRoot("packages/core/src/events.ts"),
]);

function exportedInterfaceNames(source) {
  return [...source.matchAll(/\bexport\s+interface\s+([A-Za-z_$][\w$]*)/g)]
    .map((match) => match[1]);
}

function memberReferencePattern(member) {
  const escapedMember = member.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\\`${escapedMember}(?:\\(\\))?\\\``);
}

const publicInterfaceSources = [
  { packageName: "@stages/core", sources: [controllerTypes, schemaSource, eventSource] },
  { packageName: "@stages/react", sources: [reactSource] },
  { packageName: "@stages/dom", sources: [domSource] },
  { packageName: "@stages/test-kit", sources: [testKitSource] },
];
let publicInterfaceMemberCount = 0;
for (const { packageName, sources } of publicInterfaceSources) {
  const packageRecord = manifest.packages.find(({ package: current }) => current === packageName);
  assert.ok(packageRecord, `missing package coverage for ${packageName}`);
  for (const source of sources) {
    for (const interfaceName of exportedInterfaceNames(source)) {
      const exportRecord = packageRecord.exports.find(
        ({ kind, symbol }) => kind === "type" && symbol === interfaceName,
      );
      assert.ok(exportRecord, `${packageName}:${interfaceName} has no coverage record`);
      const members = publicInterfaceMembers(source, interfaceName);
      const referenceRoute = (exportRecord.reference || packageRecord.defaultReference).split("#")[0];
      const referenceSource = guideEntries.find(({ relativePath }) => routeFor(relativePath) === referenceRoute)?.source;
      assert.ok(referenceSource, `${packageName}:${interfaceName} has no readable reference page`);
      for (const member of members) {
        assert.match(
          referenceSource,
          memberReferencePattern(member),
          `${referenceRoute} is missing ${interfaceName}.${member}`,
        );
        publicInterfaceMemberCount += 1;
      }
    }
  }
}

function exportedDeclaration(source, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`\\bexport\\s+(?:type|interface)\\s+${escapedName}\\b`).exec(source);
  assert.ok(match, `could not find exported declaration ${name}`);
  const from = match.index;
  const nextExport = /\nexport\s+(?:type|interface|class|function|const)\s+/.exec(source.slice(from + match[0].length));
  return nextExport === null
    ? source.slice(from)
    : source.slice(from, from + match[0].length + nextExport.index);
}

const literalSourceByName = new Map([
  ...["NodeAddressSegment", "Diagnostic", "StagesEventSource", "StagesEventTarget", "StagesPatch",
    "ValidationIssue", "ValidationSnapshot", "FieldSnapshot", "ContainerSnapshot", "StagesChange"]
    .map((name) => [name, controllerTypes]),
  ["NormalizedBranch", schemaSource],
  ["CollectionCommand", collectionSource],
]);
let literalValueCount = 0;
const corePackage = manifest.packages.find(({ package: packageName }) => packageName === "@stages/core");
assert.ok(corePackage, "missing core package coverage record");
for (const [contract, expectedValues] of Object.entries(manifest.contracts.literalValues)) {
  const [name, member] = contract.split(".");
  const source = literalSourceByName.get(name);
  assert.ok(source, `missing literal source mapping for ${contract}`);
  const declaration = exportedDeclaration(source, name);
  let literalSource = declaration;
  if (member !== undefined) {
    const escapedMember = member.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    literalSource = [...declaration.matchAll(new RegExp(`\\b${escapedMember}\\??\\s*:\\s*([^;\\n}]+)`, "g"))]
      .map((match) => match[1])
      .join("\n");
    assert.ok(literalSource.length > 0, `could not find ${contract}`);
  }
  const actualValues = [...literalSource.matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
  assertSameInventory(actualValues, expectedValues, `${contract} literal values`);
  const exportRecord = corePackage.exports.find(({ kind, symbol }) => kind === "type" && symbol === name);
  assert.ok(exportRecord, `@stages/core:${name} has no coverage record`);
  const referenceRoute = (exportRecord.reference || corePackage.defaultReference).split("#")[0];
  const referenceSource = guideEntries.find(({ relativePath }) => routeFor(relativePath) === referenceRoute)?.source;
  assert.ok(referenceSource, `${name} has no readable reference page`);
  for (const value of expectedValues) {
    assert.ok(referenceSource.includes(`\`${value}\``), `${referenceRoute} is missing ${contract} literal ${value}`);
    literalValueCount += 1;
  }
}

function namedDeclaration(source, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|\\n)(?:export\\s+)?(?:type|interface)\\s+${escapedName}\\b`).exec(source);
  assert.ok(match, `could not find declaration ${name}`);
  const from = match.index;
  const remainder = source.slice(from + match[0].length);
  const next = /\n(?:export\s+)?(?:type|interface|class|function|const)\s+/.exec(remainder);
  return next === null ? source.slice(from) : source.slice(from, from + match[0].length + next.index);
}

function declaredObjectMembers(source, name) {
  return [...namedDeclaration(source, name).matchAll(
    /(?:\{|;)\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:/g,
  )].map((match) => match[1]);
}

function exportedTypeAliasNames(source) {
  return [...source.matchAll(/\bexport\s+type\s+([A-Za-z_$][\w$]*)/g)]
    .map((match) => match[1]);
}

const typeAliasMemberSources = new Map([
  ["NodeAddressSegment", { declarations: [[controllerTypes, "NodeAddressSegment"]] }],
  ["StagesEventTarget", { declarations: [[controllerTypes, "StagesEventTarget"]] }],
  ["StagesPatch", { declarations: [[controllerTypes, "StagesPatch"]] }],
  ["FieldReduceResult", { declarations: [[controllerTypes, "FieldReduceResult"]] }],
  ["FieldValidationIssue", { declarations: [[controllerTypes, "ValidationIssue"]], omit: ["path"] }],
  ["FieldNodeConfig", {
    declarations: [[controllerTypes, "NodeBehavior"], [controllerTypes, "FieldNodeConfig"]],
  }],
  ["CollectionNodeConfig", {
    declarations: [
      [controllerTypes, "NodeBehavior"],
      [controllerTypes, "CollectionNodeBase"],
      [controllerTypes, "CollectionNodeConfig"],
    ],
  }],
  ["StagesOptions", {
    declarations: [[controllerTypes, "StagesCommonOptions"], [controllerTypes, "StagesOptions"]],
  }],
  ["CollectionCommand", { declarations: [[collectionSource, "CollectionCommand"]] }],
  ["CollectionCommandResult", { declarations: [[collectionSource, "CollectionCommandResult"]] }],
]);
let typeAliasMemberCount = 0;
const directObjectAliasNames = [controllerTypes, collectionSource]
  .flatMap((source) => exportedTypeAliasNames(source)
    .filter((name) => declaredObjectMembers(source, name).length > 0));
assertSameInventory(
  [...directObjectAliasNames, "FieldValidationIssue"],
  Object.keys(manifest.contracts.typeAliasMembers),
  "public object-union type aliases",
);
for (const [name, expectedMembers] of Object.entries(manifest.contracts.typeAliasMembers)) {
  const config = typeAliasMemberSources.get(name);
  assert.ok(config, `missing type-alias member source mapping for ${name}`);
  const omitted = new Set(config.omit ?? []);
  const actualMembers = config.declarations
    .flatMap(([source, declarationName]) => declaredObjectMembers(source, declarationName))
    .filter((member) => !omitted.has(member));
  assertSameInventory(actualMembers, expectedMembers, `${name} object members`);
  const exportRecord = corePackage.exports.find(({ kind, symbol }) => kind === "type" && symbol === name);
  assert.ok(exportRecord, `@stages/core:${name} has no coverage record`);
  const referenceRoute = (exportRecord.reference || corePackage.defaultReference).split("#")[0];
  const referenceSource = guideEntries.find(({ relativePath }) => routeFor(relativePath) === referenceRoute)?.source;
  assert.ok(referenceSource, `${name} has no readable reference page`);
  for (const member of expectedMembers) {
    assert.match(
      referenceSource,
      memberReferencePattern(member),
      `${referenceRoute} is missing ${name}.${member}`,
    );
    typeAliasMemberCount += 1;
  }
}
const diagnosticCodes = [...`${controllerSource}\n${schemaSource}\n${collectionSource}`.matchAll(
  /["']((?:schema|event|collection|field|transform|validation|wizard)\.[a-z0-9-]+)["']/g,
)].map((match) => match[1]);
assertSameInventory(diagnosticCodes, manifest.contracts.diagnostics, "diagnostic codes");
const diagnosticReference = guideEntries.find(
  ({ relativePath }) => relativePath === "reference/diagnostics.mdx",
)?.source;
assert.ok(diagnosticReference, "missing diagnostic reference");
assertSameInventory(
  publicInterfaceMembers(controllerTypes, "Diagnostic"),
  manifest.contracts.diagnosticMembers,
  "Diagnostic members",
);
for (const member of manifest.contracts.diagnosticMembers) {
  assert.ok(diagnosticReference.includes(`\`${member}\``), `diagnostic reference is missing Diagnostic.${member}`);
}
for (const code of manifest.contracts.diagnostics) {
  assert.ok(diagnosticReference.includes(`\`${code}\``), `diagnostic reference is missing ${code}`);
}
for (const column of ["Severity", "Trigger", "Path / address", "Effect", "Recovery"]) {
  assert.ok(diagnosticReference.includes(column), `diagnostic reference is missing ${column} catalog detail`);
}
const diagnosticSeverities = [
  schemaSource.match(/function diagnostic\([\s\S]*?return \{[^\n]*severity: ["']([^"']+)["']/)?.[1],
  controllerSource.match(/function reportRuntimeDiagnostic\([\s\S]*?const item: Diagnostic = \{[^\n]*severity: ["']([^"']+)["']/)?.[1],
  ...[...controllerSource.matchAll(/const failure: Diagnostic = \{[\s\S]*?severity: ["']([^"']+)["']/g)]
    .map((match) => match[1]),
].filter((severity) => severity !== undefined);
assert.ok(diagnosticSeverities.length >= 4, "could not derive all Diagnostic construction severities");
assertSameInventory(diagnosticSeverities, [manifest.contracts.diagnosticSeverity], "built-in diagnostic severity");

const serializationCodes = [...`${serializationSource}\n${controllerSource}`.matchAll(
  /["']((?:json|state|migration|extension)\.[a-z0-9-]+)["']/g,
)].map((match) => match[1]);
assertSameInventory(serializationCodes, manifest.contracts.serializationErrors, "serialization error codes");
const serializationErrorReference = guideEntries.find(
  ({ relativePath }) => relativePath === "reference/serialization-errors.mdx",
)?.source;
assert.ok(serializationErrorReference, "missing serialization error reference");
for (const code of manifest.contracts.serializationErrors) {
  assert.ok(serializationErrorReference.includes(`\`${code}\``), `serialization error reference is missing ${code}`);
}

const serializationErrorBody = serializationSource.match(
  /export class SerializationError extends TypeError \{([\s\S]*?)\n\}/,
)?.[1];
assert.ok(serializationErrorBody, "could not find SerializationError declaration");
const serializationErrorMembers = [...serializationErrorBody.matchAll(
  /^\s{2}readonly\s+([A-Za-z_$][\w$]*):/gm,
)].map((match) => match[1]);
assertSameInventory(
  serializationErrorMembers,
  manifest.contracts.serializationErrorMembers,
  "SerializationError members",
);
for (const member of manifest.contracts.serializationErrorMembers) {
  assert.ok(serializationErrorReference.includes(`\`${member}\``), `serialization error reference is missing SerializationError.${member}`);
}

const serializedMetaBody = controllerSource.match(
  /function serialize\(\): SerializedStagesState \{[\s\S]*?\n\s{6}meta: \{([\s\S]*?)\n\s{6}\},\n\s{4}\};/,
)?.[1];
assert.ok(serializedMetaBody, "could not find serialized metadata object");
const serializedMetaMembers = [...serializedMetaBody.matchAll(
  /^\s{8}([A-Za-z_$][\w$]*):/gm,
)].map((match) => match[1]);
assertSameInventory(serializedMetaMembers, manifest.contracts.serializedMetaMembers, "serialized metadata members");
for (const member of manifest.contracts.serializedMetaMembers) {
  assert.ok(persistenceReference.includes(`\`${member}\``), `persistence reference is missing serialized meta.${member}`);
}

const collectionRejections = [...collectionSource.matchAll(/reject\(["'](collection\.[a-z0-9-]+)["']/g)]
  .map((match) => match[1]);
assertSameInventory(collectionRejections, manifest.contracts.collectionRejections, "collection rejection codes");

const collectionCommandDeclaration = collectionSource.match(
  /export type CollectionCommand =([\s\S]*?);\n\nexport type CollectionCommandResult/,
)?.[1];
assert.ok(collectionCommandDeclaration, "could not find CollectionCommand declaration");
const collectionCommands = [...collectionCommandDeclaration.matchAll(
  /\|\s+Readonly<\{\s*name:\s*["']([^"']+)["'];([\s\S]*?)\}>/g,
)].map((match) => ({
  symbol: match[1],
  fields: [...match[2].matchAll(/(?:^|;)\s*([A-Za-z_$][\w$]*)(\?)?:/g)]
    .map((field) => `${field[1]}${field[2] ?? ""}`),
}));
assertSameInventory(
  collectionCommands.map(({ symbol, fields }) => `${symbol}:${fields.join(",")}`),
  manifest.contracts.collectionCommands.map(({ symbol, fields }) => `${symbol}:${fields.join(",")}`),
  "collection command members",
);
const collectionUtilityReference = guideEntries.find(
  ({ relativePath }) => relativePath === "reference/core/collection-utilities.mdx",
)?.source;
assert.ok(collectionUtilityReference, "missing collection utility reference");
for (const { symbol, fields } of manifest.contracts.collectionCommands) {
  assert.ok(collectionUtilityReference.includes(`\`${symbol}\``), `collection utility reference is missing ${symbol}`);
  for (const field of fields) {
    const name = field.replace(/\?$/, "");
    assert.ok(collectionUtilityReference.includes(`\`${name}\``), `collection utility reference is missing ${symbol}.${name}`);
  }
}

const expectedEvents = [
  "focus", "blur", "reset", "collection:add", "collection:remove", "collection:replace",
  "collection:duplicate", "collection:move", "collection:sort", "wizard:previous",
  "wizard:next", "wizard:go", "init", "validate", "input", "submit",
];
assertSameInventory(
  manifest.contracts.events.map(({ symbol }) => symbol),
  expectedEvents,
  "standard events and conventions",
);
const standardEventsSource = guideEntries.find(({ relativePath }) => relativePath === "reference/standard-events.mdx")?.source;
assert.ok(standardEventsSource, "missing standard event reference");
for (const eventName of expectedEvents) {
  assert.ok(standardEventsSource.includes(`\`${eventName}\``), `standard event reference is missing ${eventName}`);
}

const checkedRegions = [
  { fixture: "docs/examples/first-controller.ts", region: "first-controller", page: "start/first-controller.mdx" },
  { fixture: "docs/examples/react-quickstart.tsx", region: "react-field", page: "start/react-quickstart.mdx" },
  { fixture: "docs/examples/react-quickstart.tsx", region: "react-owner", page: "start/react-quickstart.mdx" },
  { fixture: "docs/examples/dom-quickstart.ts", region: "dom-owner", page: "start/dom-quickstart.mdx" },
  { fixture: "docs/examples/schema-evaluation.ts", region: "recursive-schema", page: "core-concepts/schemas.mdx" },
  { fixture: "docs/examples/schema-evaluation.ts", region: "evaluate-schema", page: "reference/core/schema-utilities.mdx" },
  { fixture: "docs/examples/field-registry.ts", region: "field-registry", page: "core-concepts/field-registry.mdx" },
  { fixture: "docs/examples/path-utilities.ts", region: "path-utilities", page: "core-concepts/paths-and-addresses.mdx" },
  { fixture: "docs/examples/events-and-reducers.ts", region: "event-constructors", page: "core-concepts/events-and-reducers.mdx" },
  { fixture: "docs/examples/events-and-reducers.ts", region: "reducer-patterns", page: "core-concepts/events-and-reducers.mdx" },
  { fixture: "docs/examples/transforms-and-batching.ts", region: "transform-pipeline", page: "core-concepts/transforms-and-patches.mdx" },
  { fixture: "docs/examples/transforms-and-batching.ts", region: "explicit-batch", page: "core-concepts/transactions-and-batching.mdx" },
  { fixture: "docs/examples/dynamic-configuration.ts", region: "dynamic-schema", page: "core-concepts/dynamic-configuration.mdx" },
  { fixture: "docs/examples/dynamic-configuration.ts", region: "dynamic-updates", page: "core-concepts/dynamic-configuration.mdx" },
  { fixture: "docs/examples/snapshot-subscriptions.ts", region: "selector-subscriptions", page: "core-concepts/snapshots-and-subscriptions.mdx" },
  { fixture: "docs/examples/structures.ts", region: "group-schema", page: "structures/groups.mdx" },
  { fixture: "docs/examples/structures.ts", region: "homogeneous-collection", page: "structures/collections.mdx" },
  { fixture: "docs/examples/structures.ts", region: "collection-events", page: "structures/collections.mdx" },
  { fixture: "docs/examples/structures.ts", region: "collection-identity", page: "structures/collection-identity.mdx" },
  { fixture: "docs/examples/structures.ts", region: "discriminated-collection", page: "structures/discriminated-collections.mdx" },
  { fixture: "docs/examples/structures.ts", region: "wizard-schema", page: "structures/wizards.mdx" },
  { fixture: "docs/examples/structures.ts", region: "wizard-navigation", page: "structures/wizard-validation-and-guards.mdx" },
  { fixture: "docs/examples/structures.ts", region: "recursive-structure", page: "structures/recursive-composition.mdx" },
  { fixture: "docs/examples/collection-utilities.ts", region: "pure-collection-commands", page: "reference/core/collection-utilities.mdx" },
  { fixture: "docs/examples/validation.ts", region: "validation-overview", page: "validation/overview.mdx" },
  { fixture: "docs/examples/validation.ts", region: "validator-kinds", page: "validation/validators-and-issues.mdx" },
  { fixture: "docs/examples/validation.ts", region: "execution-and-reveal", page: "validation/execution-and-reveal.mdx" },
  { fixture: "docs/examples/validation.ts", region: "validation-scopes", page: "validation/scopes-and-aggregation.mdx" },
  { fixture: "docs/examples/validation.ts", region: "validation-dependencies", page: "validation/dependencies.mdx" },
  { fixture: "docs/examples/validation.ts", region: "async-cancellation", page: "validation/async-and-cancellation.mdx" },
  { fixture: "docs/examples/validation.ts", region: "disabled-and-conditional", page: "validation/disabled-and-conditional.mdx" },
  { fixture: "docs/examples/validation.ts", region: "failure-localization", page: "validation/failures-and-localization.mdx" },
  { fixture: "docs/examples/validation.ts", region: "validation-type-usage", page: "reference/core/validation-types.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "recreate-controller", page: "persistence/serialization.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "serialized-envelope", page: "persistence/durable-and-ephemeral-state.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "value-codec", page: "persistence/value-codecs.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "extension-state", page: "persistence/extension-state.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "state-migrations", page: "persistence/migrations.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "storage-and-autosave", page: "persistence/storage-and-autosave.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "serialized-envelope", page: "reference/core/persistence-types.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "serialization-utilities", page: "reference/core/serialization-utilities.mdx" },
  { fixture: "docs/examples/diagnostics.ts", region: "diagnostic-observation", page: "diagnostics/overview.mdx" },
  { fixture: "docs/examples/diagnostics.ts", region: "last-valid-recovery", page: "diagnostics/recovery.mdx" },
  { fixture: "docs/examples/diagnostics.ts", region: "safe-path-boundary", page: "diagnostics/safety.mdx" },
  { fixture: "docs/examples/diagnostics.ts", region: "diagnostic-troubleshooting", page: "diagnostics/observability-and-troubleshooting.mdx" },
  { fixture: "docs/examples/react-adapter.tsx", region: "react-lifecycle", page: "adapters/react/lifecycle.mdx" },
  { fixture: "docs/examples/react-adapter.tsx", region: "react-field-views", page: "adapters/react/fields.mdx" },
  { fixture: "docs/examples/react-adapter.tsx", region: "react-collection", page: "adapters/react/collections.mdx" },
  { fixture: "docs/examples/react-adapter.tsx", region: "react-wizard", page: "adapters/react/wizards.mdx" },
  { fixture: "docs/examples/react-adapter.tsx", region: "react-accessibility", page: "adapters/react/accessibility.mdx" },
  { fixture: "docs/examples/react-adapter.tsx", region: "react-performance", page: "adapters/react/performance.mdx" },
  { fixture: "docs/examples/dom-adapter.ts", region: "dom-native-fields", page: "adapters/dom/native-fields.mdx" },
  { fixture: "docs/examples/dom-adapter.ts", region: "dom-mount-lifecycle", page: "adapters/dom/mounting.mdx" },
  { fixture: "docs/examples/dom-adapter.ts", region: "dom-custom-views", page: "adapters/dom/custom-views.mdx" },
  { fixture: "docs/examples/dom-adapter.ts", region: "dom-focus", page: "adapters/dom/focus.mdx" },
  { fixture: "docs/examples/dom-adapter.ts", region: "dom-accessible-submit", page: "adapters/dom/accessibility.mdx" },
  { fixture: "docs/examples/custom-adapter.ts", region: "custom-adapter-loop", page: "adapters/custom/contract.mdx" },
  { fixture: "docs/examples/custom-adapter.ts", region: "custom-adapter-tree", page: "adapters/custom/contract.mdx" },
  { fixture: "docs/examples/custom-adapter.ts", region: "framework-mappings", page: "adapters/custom/framework-walkthrough.mdx" },
  { fixture: "docs/examples/custom-adapter.ts", region: "test-kit-harness", page: "adapters/custom/testing-with-test-kit.mdx" },
  { fixture: "scripts/check-v1-performance.mjs", region: "performance-budgets", page: "project/performance.mdx" },
  { fixture: "docs/examples/migration.ts", region: "migration-controlled", page: "migration/packages-and-rendering.mdx" },
  { fixture: "docs/examples/migration.ts", region: "migration-schema-data", page: "migration/schemas-and-data.mdx" },
  { fixture: "docs/examples/migration.ts", region: "migration-processing", page: "migration/processing-and-events.mdx" },
  { fixture: "docs/examples/migration.ts", region: "migration-validation", page: "migration/validation.mdx" },
  { fixture: "docs/examples/migration.ts", region: "migration-structures", page: "migration/collections-and-wizards.mdx" },
  { fixture: "docs/examples/migration.ts", region: "migration-application-boundaries", page: "migration/rollout-checklist.mdx" },
];
for (const { fixture, region, page } of checkedRegions) {
  const fixtureSource = await readRoot(fixture);
  const displayedRegion = fixtureSource.match(new RegExp(`// source:start ${region}\\n([\\s\\S]*?)\\n// source:end ${region}`))?.[1].trim();
  assert.ok(displayedRegion, `${fixture} has no ${region} source region`);
  const pageSource = guideEntries.find(({ relativePath }) => relativePath === page)?.source;
  assert.ok(pageSource?.includes(displayedRegion), `${page} drifted from checked source region ${region}`);
}

const recipePages = [
  "server-save-and-rejection.mdx",
  "async-options.mdx",
  "cross-field-calculation.mdx",
  "conditional-sections.mdx",
  "collection-crud-and-sort.mdx",
  "multi-step-checkout.mdx",
  "focus-error-summary.mdx",
  "localization.mdx",
  "persistence-and-resume.mdx",
  "schema-upgrades.mdx",
  "undo-redo.mdx",
  "wizard-routing.mdx",
  "observability.mdx",
  "ssr-and-teardown.mdx",
];
assertSameInventory(
  guideEntries
    .filter(({ relativePath }) => relativePath.startsWith(`recipes${path.sep}`) && relativePath !== `recipes${path.sep}index.mdx`)
    .map(({ relativePath }) => path.basename(relativePath)),
  recipePages,
  "real-world recipe pages",
);

const renderedRegions = [
  { fixture: "docs/examples/recipes.ts", region: "server-save-rejection", page: "recipes/server-save-and-rejection.mdx" },
  { fixture: "docs/examples/recipes.ts", region: "async-options", page: "recipes/async-options.mdx" },
  { fixture: "docs/examples/transforms-and-batching.ts", region: "transform-pipeline", page: "recipes/cross-field-calculation.mdx" },
  { fixture: "docs/examples/dynamic-configuration.ts", region: "dynamic-schema", page: "recipes/conditional-sections.mdx" },
  { fixture: "docs/examples/dynamic-configuration.ts", region: "dynamic-updates", page: "recipes/conditional-sections.mdx" },
  { fixture: "docs/examples/structures.ts", region: "collection-events", page: "recipes/collection-crud-and-sort.mdx" },
  { fixture: "docs/examples/structures.ts", region: "collection-identity", page: "recipes/collection-crud-and-sort.mdx" },
  { fixture: "docs/examples/recipes.ts", region: "multi-step-checkout", page: "recipes/multi-step-checkout.mdx" },
  { fixture: "docs/examples/recipes.ts", region: "focus-error-summary", page: "recipes/focus-error-summary.mdx" },
  { fixture: "docs/examples/recipes.ts", region: "localization", page: "recipes/localization.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "storage-and-autosave", page: "recipes/persistence-and-resume.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "serialization-utilities", page: "recipes/persistence-and-resume.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "recreate-controller", page: "recipes/persistence-and-resume.mdx" },
  { fixture: "docs/examples/persistence.ts", region: "state-migrations", page: "recipes/schema-upgrades.mdx" },
  { fixture: "docs/examples/recipes.ts", region: "undo-redo", page: "recipes/undo-redo.mdx" },
  { fixture: "docs/examples/recipes.ts", region: "wizard-routing", page: "recipes/wizard-routing.mdx" },
  { fixture: "docs/examples/diagnostics.ts", region: "diagnostic-observation", page: "recipes/observability.mdx" },
  { fixture: "docs/examples/diagnostics.ts", region: "diagnostic-troubleshooting", page: "recipes/observability.mdx" },
  { fixture: "docs/examples/recipes.ts", region: "ssr-teardown", page: "recipes/ssr-and-teardown.mdx" },
];
for (const { fixture, region, page } of renderedRegions) {
  const fixtureSource = await readRoot(fixture);
  assert.match(
    fixtureSource,
    new RegExp(`// source:start ${region}\\n[\\s\\S]*?\\n// source:end ${region}`),
    `${fixture} has no ${region} rendered source region`,
  );
  const pageSource = guideEntries.find(({ relativePath }) => relativePath === page)?.source;
  assert.ok(
    pageSource?.includes(`<CheckedSource fixture="${fixture}" region="${region}"`),
    `${page} does not render checked source region ${region}`,
  );
}
assert.match(checkedSourceComponent, /source:start/);
assert.match(checkedSourceComponent, /codeToHtml/);
assert.match(mdxComponents, /CheckedSource/);

const requiredDemos = [
  "controlled", "collection", "wizard", "transaction", "persistence",
  "asyncValidation", "diagnostics",
];
for (const name of requiredDemos) {
  assert.match(demoSource, new RegExp(`\\b${name}:`), `missing live demo ${name}`);
  assert.ok(guideCorpus.includes(`example="${name}"`), `live demo ${name} is not embedded in a guide`);
  const region = demoSource.match(new RegExp(`// source:start ${name}([\\s\\S]*?)// source:end ${name}`));
  assert.ok(region, `live demo ${name} has no displayable source region`);
  assert.match(region[1], /\/\//, `live demo ${name} source has no explanatory comments`);
  assert.match(exampleSource, new RegExp(`\\b${name}: \\{ filename:`), `live demo ${name} has no source metadata`);
}
assert.match(demoSource, /\/\/ source:start shared[\s\S]*\/\/ source:end shared/);
assert.match(mdxComponents, /StagesDemo: StagesExample/);

const documentedFeatureContracts = [
  "controlled", "subscribeSelector", "schema factory", "deriveProps",
  "includeDisabled", "revealOn", "dependencies", "signal.onCancel",
  "collection:add", "collection:remove", "collection:replace",
  "collection:duplicate", "collection:move", "collection:sort",
  "discriminator", "itemKey", "wizard:previous", "wizard:next", "wizard:go",
  "validateCurrent", "nonLinear", "validationFailureIssue", "extensionCodecs",
  "StagesStateMigration", "last valid", "Strict Mode", "focusFirstIssue",
];
for (const contract of documentedFeatureContracts) {
  assert.ok(guideCorpus.toLowerCase().includes(contract.toLowerCase()), `v1 guide is missing feature contract ${contract}`);
}

const obsoleteAllowances = [
  /There is no `controller\.reset\(\)`/,
  /No `reset\(\)` method is present/,
  /historical name\s+`focusFirstVisibleIssue\(\)` is not a v1 API/,
];
for (const { relativePath, source } of guideEntries) {
  const withoutAllowedStatements = obsoleteAllowances.reduce((current, allowance) => current.replace(allowance, ""), source);
  assert.doesNotMatch(withoutAllowedStatements, /controller\.reset\(\)|focusFirstVisibleIssue\(\)|Validator `events`/,
    `${relativePath} contains an obsolete v1 API name`);
}

const exportSection = baseline.match(/## 2\. Package and export surface([\s\S]*?)## 3\./);
assert.ok(exportSection, "could not locate the 0.x root-export inventory");
const rootExports = [...exportSection[1].matchAll(/^\| `([^`]+)` \|/gm)].map(([, name]) => name);
assert.deepEqual(rootExports, [
  "Stages", "HashRouter", "Navigation", "Progression", "Debugger", "Form",
  "Actions", "plainFields", "get",
]);

const legacyConcepts = [
  ...rootExports,
  "config", "fields", "data", "render", "renderFields", "onChange", "isVisible", "isDisabled", "id",
  "onValidation", "parentRunValidation", "validateOn", "throttleWait", "customEvents", "enableUndo",
  "undoMaxDepth", "customRuleHandlers", "autoSave", "typeValidations", "fieldsets", "initialInterfaceState",
  "hashSeparator", "fieldConfigs", "modifyConfig", "defaultValue", "computedValue", "computedOptions",
  "dynamicOptions", "filter", "transform", "cast.data", "cast.field", "cleanUp", "clearFields", "precision",
  "isRendered", "isInterfaceState", "disableAutoSave", "isUnique", "regexValidation", "customValidation",
  "errorRenderer", "group", "collection", "subform", "fieldset", "wizard", "stage", "add", "remove", "move",
  "sort", "duplicate", "update", "setInitialData", "uniqEntries", "children", "initialData", "initialStep",
  "validateOnStepChange", "onNav", "onChangeStep", "prefix", "hashFormat", "text", "number", "email",
  "password", "tel", "time", "date", "checkbox", "select", "radio", "checkboxGroup", "dummy",
];
const missingMigrationConcepts = legacyConcepts.filter((concept) => !migration.includes(concept));
assert.deepEqual(missingMigrationConcepts, [], `migration guide is missing 0.x concepts: ${missingMigrationConcepts.join(", ")}`);
const migrationCorpus = guideEntries
  .filter(({ relativePath }) => relativePath.startsWith(`migration${path.sep}`))
  .map(({ source }) => source)
  .join("\n");
const missingSiteMigrationConcepts = legacyConcepts.filter((concept) => !migrationCorpus.includes(concept));
assert.deepEqual(
  missingSiteMigrationConcepts,
  [],
  `migration site is missing 0.x concepts: ${missingSiteMigrationConcepts.join(", ")}`,
);
for (const disposition of ["Replace", "Move", "Remove"]) {
  assert.ok(migrationCorpus.includes(`**${disposition}**`), `migration site is missing ${disposition} dispositions`);
}
assert.match(migration, /\*\*Replace\*\*/);
assert.match(migration, /\*\*Move\*\*/);
assert.match(migration, /\*\*Remove\*\*/);
assert.doesNotMatch(migration, /controller\.reset\(\)|focusFirstVisibleIssue\(\)|Validator `events`/);
assert.match(api, /MIGRATING_TO_V1\.md/);

const packageReadmes = await Promise.all(
  ["core", "dom", "react", "test-kit"].map((name) => readRoot(`packages/${name}/README.md`)),
);
for (const readme of packageReadmes) assert.match(readme, /MIGRATING_TO_V1\.md/);

const exportCount = manifest.packages.reduce((count, item) => count + item.exports.length, 0);
const snapshotMemberCount = Object.values(manifest.contracts.snapshotMembers)
  .reduce((count, members) => count + members.length, 0);
const validationMemberCount = Object.values(manifest.contracts.validationMembers)
  .reduce((count, members) => count + members.length, 0);
const persistenceMemberCount = Object.values(manifest.contracts.persistenceMembers)
  .reduce((count, members) => count + members.length, 0);
const reactMemberCount = Object.values(manifest.contracts.reactMembers)
  .reduce((count, members) => count + members.length, 0);
const domMemberCount = Object.values(manifest.contracts.domMembers)
  .reduce((count, members) => count + members.length, 0);
const testKitMemberCount = Object.values(manifest.contracts.testKitMembers)
  .reduce((count, members) => count + members.length, 0);
console.log(
  `v1 documentation check passed (${guideEntries.length} pages, ${referenceEntries.length} versioned references, ${requiredDemos.length} live demos, ${exportCount} manifest exports, ${publicInterfaceMemberCount} public interface members, ${typeAliasMemberCount} public object-union members, ${literalValueCount} literal contract values, ${snapshotMemberCount} snapshot members, ${validationMemberCount} validation members, ${persistenceMemberCount} persistence members, ${reactMemberCount} React members, ${domMemberCount} DOM members, ${testKitMemberCount} test-kit members, ${manifest.contracts.diagnosticMembers.length} diagnostic members, ${manifest.contracts.serializedMetaMembers.length} serialized metadata members, ${manifest.contracts.serializationErrors.length} serialization errors, ${manifest.contracts.diagnostics.length} diagnostics, ${rootExports.length} legacy exports, ${legacyConcepts.length} migration concepts)`,
);
