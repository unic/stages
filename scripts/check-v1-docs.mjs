import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const baselinePath = new URL("../docs/CURRENT_IMPLEMENTATION_API.md", import.meta.url);
const migrationPath = new URL("../docs/MIGRATING_TO_V1.md", import.meta.url);
const apiPath = new URL("../docs/V1_API.md", import.meta.url);

const [baseline, migration, api] = await Promise.all([
  readFile(baselinePath, "utf8"),
  readFile(migrationPath, "utf8"),
  readFile(apiPath, "utf8"),
]);

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
  `v1 documentation check passed (${rootExports.length} root exports, ${legacyConcepts.length} migration concepts)`,
);
