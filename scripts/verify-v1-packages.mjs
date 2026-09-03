import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = mkdtempSync(join(tmpdir(), "stages-v1-packages-"));
const packDirectory = join(temporaryRoot, "packs");
const consumerDirectory = join(temporaryRoot, "consumer");
const npmCache = join(temporaryRoot, "npm-cache");
const coreManifest = JSON.parse(readFileSync(join(repository, "packages/core/package.json"), "utf8"));
const expectedVersion = coreManifest.version;

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
const expectedRepository = "git+https://github.com/unic/stages.git";
const rootLicense = readFileSync(join(repository, "LICENSE"), "utf8");

assert.match(
  expectedVersion,
  /^1\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/,
  "v1 packages must use a valid v1 SemVer version.",
);

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
    assert.match(record.shasum, /^[a-f0-9]{40}$/);
    assert.match(record.integrity, /^sha512-/);
    assert.equal(sourceManifest.version, expectedVersion);
    assert.equal(sourceManifest.license, "MIT");
    assert.equal(sourceManifest.author, "Fredi Bach");
    assert.equal(sourceManifest.repository?.url, expectedRepository);
    assert.equal(sourceManifest.repository?.directory, `packages/${directory}`);
    assert.equal(sourceManifest.homepage, "https://github.com/unic/stages#readme");
    assert.equal(sourceManifest.bugs?.url, "https://github.com/unic/stages/issues");
    assert.equal(sourceManifest.publishConfig?.access, "public");
    assert(Array.isArray(sourceManifest.keywords) && sourceManifest.keywords.length >= 4);

    const files = record.files.map(({ path }) => path);
    assert(files.includes("package.json"), `${sourceManifest.name} is missing package.json.`);
    assert(files.includes("README.md"), `${sourceManifest.name} is missing README.md.`);
    assert(files.includes("LICENSE"), `${sourceManifest.name} is missing LICENSE.`);
    assert(files.includes("dist/index.js"), `${sourceManifest.name} is missing its ESM entry.`);
    assert(files.includes("dist/index.d.ts"), `${sourceManifest.name} is missing its declaration entry.`);
    assert(
      files.every((path) => path === "package.json" || path === "README.md" || path === "LICENSE" || path.startsWith("dist/") || path.startsWith("src/")),
      `${sourceManifest.name} contains files outside package.json, README.md, LICENSE, dist/, and src/.`,
    );
    assert.equal(readFileSync(join(packageDirectory, "LICENSE"), "utf8"), rootLicense);
    assert.equal(sourceManifest.type, "module");
    assert.equal(sourceManifest.sideEffects, false);
    assert.equal(sourceManifest.exports?.["."]?.import, "./dist/index.js");
    assert.equal(sourceManifest.exports?.["."]?.types, "./dist/index.d.ts");

    for (const path of files.filter((path) => path.endsWith(".map"))) {
      const sourceMap = JSON.parse(readFileSync(join(packageDirectory, path), "utf8"));
      assert(Array.isArray(sourceMap.sources) && sourceMap.sources.length > 0);
      assert(
        sourceMap.sources.every((source) => typeof source === "string" && !source.startsWith("/")),
        `${sourceManifest.name} contains an absolute source-map path in ${path}.`,
      );
      if (sourceMap.sourcesContent === undefined) {
        for (const source of sourceMap.sources) {
          const mappedPath = posix.normalize(posix.join(posix.dirname(path), source));
          assert(
            files.includes(mappedPath),
            `${sourceManifest.name} source map ${path} points to missing ${mappedPath}.`,
          );
        }
      } else {
        assert.equal(
          sourceMap.sourcesContent.length,
          sourceMap.sources.length,
          `${sourceManifest.name} source map ${path} must embed every source.`,
        );
      }
    }
    artifacts.set(sourceManifest.name, join(packDirectory, record.filename));
  }

  assert.equal(coreManifest.dependencies, undefined, "@stages/core must not have runtime dependencies.");
  const domManifest = JSON.parse(readFileSync(join(repository, "packages/dom/package.json"), "utf8"));
  assert.deepEqual(domManifest.dependencies, { "@stages/core": coreManifest.version });
  const reactManifest = JSON.parse(readFileSync(join(repository, "packages/react/package.json"), "utf8"));
  assert.equal(reactManifest.peerDependencies?.react, ">=17.0.0");
  assert.deepEqual(reactManifest.dependencies, { "@stages/core": coreManifest.version });
  const testKitManifest = JSON.parse(readFileSync(join(repository, "packages/test-kit/package.json"), "utf8"));
  assert.deepEqual(testKitManifest.dependencies, { "@stages/core": coreManifest.version });

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

const dateCodec = {
  encode: (value) => ({ created: value.created.toISOString() }),
  decode: (value) => ({ created: new Date(value.created) }),
};
const codecSchema = { id: "packed-codec", version: 1, nodes: [] };
const codecController = stages({
  schema: codecSchema,
  fields: {},
  value: { created: new Date("2026-09-03T10:11:12.000Z") },
  codec: dateCodec,
});
const codecState = codecController.serialize();
codecController.destroy();
const codecRecreated = stages({
  schema: codecSchema,
  fields: {},
  state: codecState,
  codec: dateCodec,
});
assert.equal(codecRecreated.getSnapshot().value.created instanceof Date, true);
assert.equal(codecRecreated.getSnapshot().value.created.toISOString(), "2026-09-03T10:11:12.000Z");
codecRecreated.destroy();

const legacyState = {
  format: "stages",
  formatVersion: 1,
  schema: { id: "packed-migration", version: 1 },
  value: { first: "Ada" },
  baseline: { first: "Initial" },
  meta: {},
};
const migrated = stages({
  schema: { id: "packed-migration", version: 2, nodes: [] },
  fields: {},
  state: legacyState,
  migrations: [{
    schemaId: "packed-migration",
    fromVersion: 1,
    toVersion: 2,
    migrate: (state) => ({
      ...state,
      schema: { id: "packed-migration", version: 2 },
      value: { name: state.value.first },
      baseline: { name: state.baseline.first },
    }),
  }],
});
assert.deepEqual(migrated.getSnapshot().value, { name: "Ada" });
assert.deepEqual(migrated.serialize().baseline, { name: "Initial" });
migrated.destroy();
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

  console.log("Verified 4 release-candidate package tarballs and an isolated packed runtime/type consumer.");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
