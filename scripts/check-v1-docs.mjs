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

const [baseline, migration, api, demoSource, exampleSource, mdxComponents, manifestSource] = await Promise.all([
  readRoot("docs/CURRENT_IMPLEMENTATION_API.md"),
  readRoot("docs/MIGRATING_TO_V1.md"),
  readRoot("docs/V1_API.md"),
  readRoot("docs/components/StagesDemo.jsx"),
  readRoot("docs/components/StagesExample.jsx"),
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

for (const { relativePath, source } of guideEntries) {
  for (const match of source.matchAll(/\]\((\/[a-zA-Z0-9_./-]+)(?:#[a-zA-Z0-9_-]+)?\)/g)) {
    assert.ok(routes.has(match[1]), `${relativePath} links to missing route ${match[1]}`);
  }
}

async function validateMeta(directory) {
  const metaPath = path.join(directory, "_meta.json");
  let meta;
  try {
    meta = JSON.parse(await readFile(metaPath, "utf8"));
  } catch (error) {
    assert.fail(`missing or invalid navigation metadata at ${path.relative(repositoryRoot, metaPath)}: ${error}`);
  }
  for (const [key, config] of Object.entries(meta)) {
    if (key === "*") continue;
    if (typeof config === "object" && config !== null && (config.type === "separator" || config.type === "menu" || config.href)) continue;
    const file = path.join(directory, `${key}.mdx`);
    const childDirectory = path.join(directory, key);
    const names = await readdir(directory, { withFileTypes: true });
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
  "reference/core/exports.mdx",
  "reference/core/controller.mdx",
  "reference/core/schema-types.mdx",
  "reference/core/field-types.mdx",
  "reference/core/event-types.mdx",
  "reference/core/snapshot-types.mdx",
  "reference/core/path-utilities.mdx",
  "reference/core/schema-utilities.mdx",
  "reference/standard-events.mdx",
  "project/contributing-to-docs.mdx",
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
    const reference = item.reference || packageRecord.defaultReference;
    assert.ok(reference, `${packageRecord.package}:${item.symbol} has no reference route`);
    assert.ok(routes.has(reference.split("#")[0]), `${packageRecord.package}:${item.symbol} has an invalid reference route ${reference}`);
    if (item.guide) assert.ok(routes.has(item.guide), `${packageRecord.package}:${item.symbol} has an invalid guide route ${item.guide}`);
  }
  const sourceExports = await entrypointExports(packageRecord.entrypoint);
  assertSameInventory(
    sourceExports.map(({ kind, symbol }) => `${kind}:${symbol}`),
    keys,
    `${packageRecord.package} public exports`,
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

const [controllerSource, schemaSource, collectionSource, serializationSource] = await Promise.all([
  readRoot("packages/core/src/controller.ts"),
  readRoot("packages/core/src/schema.ts"),
  readRoot("packages/core/src/collections.ts"),
  readRoot("packages/core/src/serialization.ts"),
]);
const diagnosticCodes = [...`${controllerSource}\n${schemaSource}\n${collectionSource}`.matchAll(
  /["']((?:schema|event|collection|field|transform|validation|wizard)\.[a-z0-9-]+)["']/g,
)].map((match) => match[1]);
assertSameInventory(diagnosticCodes, manifest.contracts.diagnostics, "diagnostic codes");

const serializationCodes = [...`${serializationSource}\n${controllerSource}`.matchAll(
  /["']((?:json|state|migration|extension)\.[a-z0-9-]+)["']/g,
)].map((match) => match[1]);
assertSameInventory(serializationCodes, manifest.contracts.serializationErrors, "serialization error codes");

const collectionRejections = [...collectionSource.matchAll(/reject\(["'](collection\.[a-z0-9-]+)["']/g)]
  .map((match) => match[1]);
assertSameInventory(collectionRejections, manifest.contracts.collectionRejections, "collection rejection codes");

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
];
for (const { fixture, region, page } of checkedRegions) {
  const fixtureSource = await readRoot(fixture);
  const displayedRegion = fixtureSource.match(new RegExp(`// source:start ${region}\\n([\\s\\S]*?)\\n// source:end ${region}`))?.[1].trim();
  assert.ok(displayedRegion, `${fixture} has no ${region} source region`);
  const pageSource = guideEntries.find(({ relativePath }) => relativePath === page)?.source;
  assert.ok(pageSource?.includes(displayedRegion), `${page} drifted from checked source region ${region}`);
}

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
console.log(
  `v1 documentation check passed (${guideEntries.length} pages, ${requiredDemos.length} live demos, ${exportCount} manifest exports, ${snapshotMemberCount} snapshot members, ${manifest.contracts.diagnostics.length} diagnostics, ${rootExports.length} legacy exports, ${legacyConcepts.length} migration concepts)`,
);
