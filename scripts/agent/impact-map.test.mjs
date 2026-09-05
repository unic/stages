import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  commands,
  commandsForPath,
  findUnmappedActiveDirectories,
  mapChangedPaths,
  repositoryRoot,
} from "./impact-map.mjs";

const cases = [
  ["packages/core/src/controller.ts", ["build:core", "typecheck:core", "test:core"]],
  ["packages/core/src/index.ts", ["release"]],
  ["packages/dom/src/index.ts", ["build:core", "build:dom", "typecheck:dom", "test:dom", "build:example:vanilla", "e2e:vanilla"]],
  ["packages/react/src/index.tsx", ["build:core", "build:react", "typecheck:react", "test:react", "build:example:react", "e2e:react"]],
  ["packages/vue/src/index.ts", ["build:core", "build:vue", "typecheck:vue", "test:vue", "build:example:vue", "e2e:vue"]],
  ["packages/angular/src/index.ts", ["build:core", "build:angular", "typecheck:angular", "test:angular", "build:example:angular", "e2e:angular"]],
  ["packages/authoring/src/index.ts", ["release"]],
  ["packages/authoring/src/portable.ts", ["release"]],
  ["packages/authoring/src/compiler/compiler.ts", ["build:core", "build:authoring", "typecheck:authoring", "test:authoring", "test:studio"]],
  ["packages/test-kit/src/index.ts", ["build:core", "build:test-kit", "typecheck:test-kit", "test:test-kit", "test:adapters"]],
  ["examples/shared/event-launch/schema.ts", ["build:core", "test:shared-example", "build:examples", "e2e:all"]],
  ["examples/react/src/App.tsx", ["build:example:react", "e2e:react"]],
  ["examples/e2e/event-launch.spec.ts", ["build:examples", "e2e:all"]],
  ["docs/examples/persistence.ts", ["check:docs"]],
  ["docs/content/core.mdx", ["check:docs", "build:docs"]],
  ["docs/components/StagesExample.jsx", ["check:docs", "build:docs"]],
  ["studio/components/store.js", ["test:studio"]],
  ["studio/components/StudioEditorPage.jsx", ["test:studio", "build:studio"]],
  ["studio/components/v1/StudioV1Preview.jsx", ["test:studio", "build:studio"]],
  ["studio/pages/index.jsx", ["test:studio", "build:studio"]],
  ["packages/react/package.json", ["release"]],
  ["packages/test-kit/package.json", ["release"]],
  ["package-lock.json", ["check:v1", "test:v1", "verify:packages"]],
  ["src/lib/index.js", ["build:legacy"]],
  ["new-app/source.ts", ["check:v1", "test:v1"]],
];

for (const [file, expected] of cases) {
  test(`maps ${file}`, () => assert.deepEqual(commandsForPath(file), expected));
}

test("deduplicates commands while preserving dependency order", () => {
  assert.deepEqual(
    mapChangedPaths(["packages/react/src/index.tsx", "packages/react/src/index.tsx", "examples/react/src/App.tsx"]).commandIds,
    ["build:core", "build:react", "typecheck:react", "test:react", "build:example:react", "e2e:react", "quality:knip", "quality:react"],
  );
});

test("a release-level path supersedes narrower verification", () => {
  assert.deepEqual(
    mapChangedPaths(["packages/core/src/controller.ts", "packages/core/src/types.ts"]).commandIds,
    ["release"],
  );
});

test("every public package manifest receives release-level verification", () => {
  for (const packageName of ["core", "dom", "react", "vue", "angular", "test-kit", "authoring"]) {
    assert.deepEqual(commandsForPath(`packages/${packageName}/package.json`), ["release"], packageName);
  }
});

test("every command id resolves to an executable command", () => {
  for (const [, expected] of cases) {
    for (const commandId of expected) assert.equal(typeof commands[commandId], "string", commandId);
  }
});

test("all current packages and examples are explicitly mapped", () => {
  assert.deepEqual(findUnmappedActiveDirectories(repositoryRoot), []);
});

test("detects a newly added package directory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "stages-impact-map-"));
  try {
    for (const directory of [
      "packages/core", "packages/dom", "packages/react", "packages/vue", "packages/angular", "packages/test-kit",
      "examples/vanilla", "examples/react", "examples/vue", "examples/angular", "examples/e2e", "examples/shared/event-launch",
      "packages/svelte",
    ]) {
      mkdirSync(path.join(root, directory), { recursive: true });
      writeFileSync(path.join(root, directory, "package.json"), "{}\n");
    }
    assert.deepEqual(findUnmappedActiveDirectories(root), ["packages/svelte"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
