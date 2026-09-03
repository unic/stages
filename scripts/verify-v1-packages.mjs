import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = mkdtempSync(join(tmpdir(), "stages-v1-packages-"));
const packDirectory = join(temporaryRoot, "packs");
const consumerDirectory = join(temporaryRoot, "consumer");
const npmCache = join(temporaryRoot, "npm-cache");

function run(command, args, cwd = repository) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: npmCache },
  });
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`${command} ${args.join(" ")} failed.\n${output}`);
  }
  return result.stdout.trim();
}

const packageDirectories = ["core", "dom", "react", "test-kit"];

try {
  mkdirSync(packDirectory, { recursive: true });
  mkdirSync(consumerDirectory, { recursive: true });

  const artifacts = new Map();
  for (const directory of packageDirectories) {
    const packageDirectory = join(repository, "packages", directory);
    const sourceManifest = JSON.parse(readFileSync(join(packageDirectory, "package.json"), "utf8"));
    const records = JSON.parse(run("npm", [
      "pack",
      "--json",
      "--pack-destination",
      packDirectory,
      packageDirectory,
    ]));
    assert.equal(records.length, 1, `${sourceManifest.name} must produce one tarball.`);
    const record = records[0];
    assert.equal(record.name, sourceManifest.name);
    assert.equal(record.version, sourceManifest.version);

    const files = record.files.map(({ path }) => path);
    assert(files.includes("package.json"), `${sourceManifest.name} is missing package.json.`);
    assert(files.includes("README.md"), `${sourceManifest.name} is missing README.md.`);
    assert(files.includes("dist/index.js"), `${sourceManifest.name} is missing its ESM entry.`);
    assert(files.includes("dist/index.d.ts"), `${sourceManifest.name} is missing its declaration entry.`);
    assert(
      files.every((path) => path === "package.json" || path === "README.md" || path.startsWith("dist/")),
      `${sourceManifest.name} contains files outside package.json, README.md, and dist/.`,
    );
    assert.equal(sourceManifest.type, "module");
    assert.equal(sourceManifest.sideEffects, false);
    assert.equal(sourceManifest.exports?.["."]?.import, "./dist/index.js");
    assert.equal(sourceManifest.exports?.["."]?.types, "./dist/index.d.ts");
    artifacts.set(sourceManifest.name, join(packDirectory, record.filename));
  }

  const coreManifest = JSON.parse(readFileSync(join(repository, "packages/core/package.json"), "utf8"));
  assert.equal(coreManifest.dependencies, undefined, "@stages/core must not have runtime dependencies.");
  const domManifest = JSON.parse(readFileSync(join(repository, "packages/dom/package.json"), "utf8"));
  assert.deepEqual(domManifest.dependencies, { "@stages/core": coreManifest.version });
  const reactManifest = JSON.parse(readFileSync(join(repository, "packages/react/package.json"), "utf8"));
  assert.equal(reactManifest.peerDependencies?.react, ">=17.0.0");
  assert.deepEqual(reactManifest.dependencies, { "@stages/core": coreManifest.version });

  writeFileSync(join(consumerDirectory, "package.json"), JSON.stringify({
    private: true,
    type: "module",
  }, null, 2));
  run("npm", [
    "install",
    "--offline",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--package-lock=false",
    "--legacy-peer-deps",
    artifacts.get("@stages/core"),
    artifacts.get("@stages/dom"),
    artifacts.get("@stages/react"),
    artifacts.get("@stages/test-kit"),
  ], consumerDirectory);
  symlinkSync(join(repository, "node_modules/react"), join(consumerDirectory, "node_modules/react"), "dir");
  mkdirSync(join(consumerDirectory, "node_modules/@types"), { recursive: true });
  symlinkSync(
    join(repository, "node_modules/@types/react"),
    join(consumerDirectory, "node_modules/@types/react"),
    "dir",
  );

  writeFileSync(join(consumerDirectory, "smoke.mjs"), `
import assert from "node:assert/strict";
import { stages } from "@stages/core";
import { createDomFields } from "@stages/dom";
import { StagesField, useStagesCollection, useStagesWizard } from "@stages/react";
import { bindAdapter } from "@stages/test-kit";

assert.equal(typeof StagesField, "function");
assert.equal(typeof useStagesCollection, "function");
assert.equal(typeof useStagesWizard, "function");
const fields = createDomFields();
let controller;
controller = stages({
  schema: {
    id: "packed-consumer",
    version: 1,
    nodes: [{ kind: "field", id: "name", type: "text" }],
  },
  fields,
  value: { name: "Ada" },
  onChange: ({ value }) => controller.update({ value }),
});
const revisions = [];
const adapter = bindAdapter(controller, (snapshot) => revisions.push(snapshot.revision));
adapter.emit({ name: "input", target: { kind: "field", path: ["name"] }, payload: "Grace" });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(adapter.getSnapshot().value.name, "Grace");
assert.deepEqual(revisions, [0, 2]);
const state = controller.serialize();
assert.equal(state.format, "stages");
adapter.destroy();
controller.destroy();
const recreated = stages({ schema: {
  id: "packed-consumer",
  version: 1,
  nodes: [{ kind: "field", id: "name", type: "text" }],
}, fields, state });
assert.equal(recreated.getSnapshot().value.name, "Grace");
recreated.destroy();
`);
  run(process.execPath, [join(consumerDirectory, "smoke.mjs")], consumerDirectory);

  writeFileSync(join(consumerDirectory, "consumer.ts"), `
import { stages, type StagesSchema } from "@stages/core";
import { createDomFields } from "@stages/dom";
import { StagesField, type ReactFieldProps } from "@stages/react";
import { bindAdapter } from "@stages/test-kit";

interface Value { name: string }
const fields = createDomFields();
const schema = {
  id: "packed-types",
  version: 1,
  nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }],
} as const satisfies StagesSchema<Value, typeof fields>;
const controller = stages({ schema, fields, value: { name: "Ada" } });
const adapter = bindAdapter(controller, (snapshot) => void snapshot.value.name);
const reactField: typeof StagesField = StagesField;
type TextBinding = ReactFieldProps<string, { readonly label: string }>;
void reactField;
void (undefined as unknown as TextBinding);
adapter.destroy();
`);
  writeFileSync(join(consumerDirectory, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      module: "Node16",
      moduleResolution: "Node16",
      lib: ["ES2020", "DOM"],
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    include: ["consumer.ts"],
  }, null, 2));
  run(join(repository, "node_modules/.bin/tsc"), ["-p", join(consumerDirectory, "tsconfig.json")], consumerDirectory);

  console.log("Verified 4 package tarballs and an isolated packed runtime/type consumer.");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
