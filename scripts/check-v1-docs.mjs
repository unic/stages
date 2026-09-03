import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const baselinePath = new URL("../docs/CURRENT_IMPLEMENTATION_API.md", import.meta.url);
const migrationPath = new URL("../docs/MIGRATING_TO_V1.md", import.meta.url);
const apiPath = new URL("../docs/V1_API.md", import.meta.url);

const guideNames = [
  "index", "installation", "architecture", "core", "schema",
  "fields-events", "dynamic-behavior", "transforms", "validation",
  "collections", "wizards", "persistence", "diagnostics", "react", "dom",
  "custom-adapters", "utilities", "i18n", "migration", "feature-coverage",
];

const [baseline, migration, api] = await Promise.all([
  readFile(baselinePath, "utf8"),
  readFile(migrationPath, "utf8"),
  readFile(apiPath, "utf8"),
]);

const guides = await Promise.all(guideNames.map((name) =>
  readFile(new URL(`../docs/content/${name}.mdx`, import.meta.url), "utf8"),
));
const guideCorpus = guides.join("\n");
const demoSource = await readFile(
  new URL("../docs/components/StagesDemo.jsx", import.meta.url),
  "utf8",
);
const exampleSource = await readFile(
  new URL("../docs/components/StagesExample.jsx", import.meta.url),
  "utf8",
);
const mdxComponents = await readFile(
  new URL("../docs/mdx-components.jsx", import.meta.url),
  "utf8",
);

const documentedRuntimeExports = [
  "stages", "fieldEvent", "nodeEvent", "formEvent", "evaluateSchema",
  "initialFieldValue", "reduceCollectionCommand", "getAtPath", "setAtPath",
  "removeAtPath", "applyPatches", "pathsEqual", "isSafePathSegment",
  "assertSafePath", "encodeJson", "decodeJson", "validateSerializedState",
  "migrateSerializedState", "SerializationError", "useStages",
  "useStagesController", "useStagesField", "StagesField",
  "useStagesCollection", "useStagesWizard", "createDomFields", "mountStages",
  "bindAdapter",
];
for (const name of documentedRuntimeExports) {
  assert.ok(guideCorpus.includes(name), `v1 guide is missing runtime export ${name}`);
}

const requiredDemos = [
  "controlled", "collection", "wizard", "transaction", "persistence",
  "asyncValidation", "diagnostics",
];
for (const name of requiredDemos) {
  assert.match(demoSource, new RegExp(`\\b${name}:`), `missing live demo ${name}`);
  assert.ok(guideCorpus.includes(`example=\"${name}\"`), `live demo ${name} is not embedded in a guide`);
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

const exportSection = baseline.match(
  /## 2\. Package and export surface([\s\S]*?)## 3\./,
);
assert.ok(exportSection, "could not locate the 0.x root-export inventory");

const rootExports = [...exportSection[1].matchAll(/^\| `([^`]+)` \|/gm)].map(
  ([, name]) => name,
);
assert.deepEqual(rootExports, [
  "Stages",
  "HashRouter",
  "Navigation",
  "Progression",
  "Debugger",
  "Form",
  "Actions",
  "plainFields",
  "get",
]);

const legacyConcepts = [
  ...rootExports,
  // Form inputs and runtime configuration.
  "config",
  "fields",
  "data",
  "render",
  "renderFields",
  "onChange",
  "isVisible",
  "isDisabled",
  "id",
  "onValidation",
  "parentRunValidation",
  "validateOn",
  "throttleWait",
  "customEvents",
  "enableUndo",
  "undoMaxDepth",
  "customRuleHandlers",
  "autoSave",
  "typeValidations",
  "fieldsets",
  "initialInterfaceState",
  "hashSeparator",
  "fieldConfigs",
  "modifyConfig",
  // Field processing and validation.
  "defaultValue",
  "computedValue",
  "computedOptions",
  "dynamicOptions",
  "filter",
  "transform",
  "cast.data",
  "cast.field",
  "cleanUp",
  "clearFields",
  "precision",
  "isRendered",
  "isInterfaceState",
  "disableAutoSave",
  "isUnique",
  "regexValidation",
  "customValidation",
  "errorRenderer",
  // Structural nodes and collection commands.
  "group",
  "collection",
  "subform",
  "fieldset",
  "wizard",
  "stage",
  "add",
  "remove",
  "move",
  "sort",
  "duplicate",
  "update",
  "setInitialData",
  "uniqEntries",
  // Outer wizard and routing inputs.
  "children",
  "initialData",
  "initialStep",
  "validateOnStepChange",
  "onNav",
  "onChangeStep",
  "prefix",
  "hashFormat",
  // The complete plainFields key set.
  "text",
  "number",
  "email",
  "password",
  "tel",
  "time",
  "date",
  "checkbox",
  "select",
  "radio",
  "checkboxGroup",
  "dummy",
];

const missing = legacyConcepts.filter((concept) => !migration.includes(concept));
assert.deepEqual(
  missing,
  [],
  `migration guide is missing 0.x concepts: ${missing.join(", ")}`,
);

assert.match(migration, /\*\*Replace\*\*/);
assert.match(migration, /\*\*Move\*\*/);
assert.match(migration, /\*\*Remove\*\*/);
assert.match(api, /MIGRATING_TO_V1\.md/);

const packageReadmes = await Promise.all(
  ["core", "dom", "react", "test-kit"].map((name) =>
    readFile(new URL(`../packages/${name}/README.md`, import.meta.url), "utf8"),
  ),
);
for (const readme of packageReadmes) {
  assert.match(readme, /MIGRATING_TO_V1\.md/);
}

console.log(
  `v1 documentation check passed (${guideNames.length} guides, ${requiredDemos.length} live demos, ${documentedRuntimeExports.length} runtime exports, ${rootExports.length} legacy exports, ${legacyConcepts.length} migration concepts)`,
);
