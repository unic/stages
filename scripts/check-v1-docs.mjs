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
  `v1 documentation check passed (${guideEntries.length} pages, ${requiredDemos.length} live demos, ${exportCount} manifest exports, ${snapshotMemberCount} snapshot members, ${validationMemberCount} validation members, ${persistenceMemberCount} persistence members, ${reactMemberCount} React members, ${domMemberCount} DOM members, ${testKitMemberCount} test-kit members, ${manifest.contracts.diagnosticMembers.length} diagnostic members, ${manifest.contracts.serializedMetaMembers.length} serialized metadata members, ${manifest.contracts.serializationErrors.length} serialization errors, ${manifest.contracts.diagnostics.length} diagnostics, ${rootExports.length} legacy exports, ${legacyConcepts.length} migration concepts)`,
);
