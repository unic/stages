import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const packageNames = ["core", "dom", "react", "vue", "angular", "test-kit", "authoring"];
const exampleNames = ["vanilla", "react", "vue", "angular"];
const adapterNames = ["dom", "react", "vue", "angular"];
const adapterExamples = { dom: "vanilla", react: "react", vue: "vue", angular: "angular" };

export const commands = Object.freeze({
  "build:authoring": "npx tsc -p packages/authoring/tsconfig.build.json",
  "typecheck:authoring": "npx tsc -p packages/authoring/tsconfig.test.json --noEmit",
  "test:authoring": "node --test packages/authoring/test/*.test.mjs",
  "build:core": "npx tsc -p packages/core/tsconfig.build.json",
  "typecheck:core": "npx tsc -p packages/core/tsconfig.json --noEmit",
  "test:core": "node --test packages/core/test/*.test.mjs",
  "build:dom": "npx tsc -p packages/dom/tsconfig.build.json",
  "typecheck:dom": "npx tsc -p packages/dom/tsconfig.json --noEmit",
  "test:dom": "node --test packages/dom/test/*.test.mjs",
  "build:react": "npx tsc -p packages/react/tsconfig.build.json",
  "typecheck:react": "npx tsc -p packages/react/tsconfig.json --noEmit",
  "test:react": "node --test packages/react/test/*.test.mjs",
  "build:vue": "npx tsc -p packages/vue/tsconfig.build.json",
  "typecheck:vue": "npx tsc -p packages/vue/tsconfig.json --noEmit",
  "test:vue": "node --test packages/vue/test/*.test.mjs",
  "build:angular": "npx ngc -p packages/angular/tsconfig.build.json",
  "typecheck:angular": "npx ngc -p packages/angular/tsconfig.json --noEmit",
  "test:angular": "node --test packages/angular/test/*.test.mjs",
  "build:test-kit": "npx tsc -p packages/test-kit/tsconfig.build.json",
  "typecheck:test-kit": "npx tsc -p packages/test-kit/tsconfig.json --noEmit",
  "test:test-kit": "node --test packages/test-kit/test/*.test.mjs",
  "test:adapters": "node --test packages/dom/test/*.test.mjs packages/react/test/*.test.mjs packages/vue/test/*.test.mjs packages/angular/test/*.test.mjs packages/test-kit/test/*.test.mjs",
  "test:shared-example": "npm run test:example-contract:v1",
  "build:examples": "npm run build:examples:v1",
  "build:example:vanilla": "npm --prefix examples/vanilla run build",
  "build:example:react": "npm --prefix examples/react run build",
  "build:example:vue": "npm --prefix examples/vue run build",
  "build:example:angular": "npm --prefix examples/angular run build",
  "e2e:all": "npm run test:examples:v1",
  "e2e:vanilla": "npm run test:examples:v1 -- --adapter vanilla",
  "e2e:react": "npm run test:examples:v1 -- --adapter react",
  "e2e:vue": "npm run test:examples:v1 -- --adapter vue",
  "e2e:angular": "npm run test:examples:v1 -- --adapter angular",
  "check:docs": "npm run check:docs:v1",
  "build:docs": "npm --prefix docs run build",
  "test:studio": "npx tsc -p packages/core/tsconfig.build.json && npx tsc -p packages/authoring/tsconfig.build.json && npm --prefix studio run test:v1",
  "build:studio": "npm --prefix studio run build",
  "check:v1": "npm run check:v1",
  "test:v1": "npm run test:v1",
  "verify:packages": "npm run verify:packages:v1",
  "quality:knip": "npm run check:knip",
  "quality:react": "npm run doctor",
  "build:legacy": "npm run build",
  "release": "npm run release:check:v1",
});

const coreFocused = ["build:core", "typecheck:core", "test:core"];
const fallback = ["check:v1", "test:v1"];
const publicCoreFiles = new Set([
  "packages/core/src/events.ts",
  "packages/core/src/index.ts",
  "packages/core/src/schema.ts",
  "packages/core/src/serialization.ts",
  "packages/core/src/types.ts",
]);
const studioIntegrationFiles = new Set([
  "studio/components/App.jsx",
  "studio/components/StudioEditorPage.jsx",
  "studio/components/v1/StudioV1Preview.jsx",
]);

function normalize(relativePath) {
  return relativePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function isConfigurationFile(file) {
  const basename = path.posix.basename(file);
  return basename === "package.json"
    || basename === "package-lock.json"
    || basename === "npm-shrinkwrap.json"
    || basename === ".nvmrc"
    || /^tsconfig(?:\.[^.]+)?\.json$/.test(basename)
    || file.startsWith("scripts/");
}

function adapterCommands(adapter) {
  const example = adapterExamples[adapter];
  return [
    "build:core",
    `build:${adapter}`,
    `typecheck:${adapter}`,
    `test:${adapter}`,
    `build:example:${example}`,
    `e2e:${example}`,
  ];
}

export function commandsForPath(inputPath) {
  const file = normalize(inputPath);

  if (file.startsWith("packages/") && file.endsWith("/package.json")) return ["release"];

  if (["packages/authoring/src/index.ts", "packages/authoring/src/studio.ts", "packages/authoring/src/portable.ts", "packages/authoring/src/document/types.ts", "packages/authoring/portable.schema.json"].includes(file)) return ["release"];

  if (file.startsWith("packages/authoring/")) {
    return ["build:core", "build:authoring", "typecheck:authoring", "test:authoring", "test:studio"];
  }

  if (file.startsWith("packages/core/src/")) {
    return publicCoreFiles.has(file) ? ["release"] : coreFocused;
  }

  for (const adapter of adapterNames) {
    if (file.startsWith(`packages/${adapter}/src/`)) return adapterCommands(adapter);
  }

  if (file.startsWith("packages/test-kit/")) {
    return ["build:core", "build:test-kit", "typecheck:test-kit", "test:test-kit", "test:adapters"];
  }

  if (file.startsWith("examples/shared/")) {
    return ["build:core", "test:shared-example", "build:examples", "e2e:all"];
  }

  for (const example of exampleNames) {
    if (file.startsWith(`examples/${example}/`)) {
      return [`build:example:${example}`, `e2e:${example}`];
    }
  }

  if (file.startsWith("examples/e2e/")) return ["build:examples", "e2e:all"];

  if (file.startsWith("docs/content/") || file.startsWith("docs/examples/")) {
    return file.endsWith(".mdx") || file.endsWith("/_meta.js") || file === "docs/content/_meta.js"
      ? ["check:docs", "build:docs"]
      : ["check:docs"];
  }

  if (file.startsWith("docs/components/") || file === "docs/mdx-components.jsx" || file === "docs/next.config.mjs") {
    return ["check:docs", "build:docs"];
  }

  if (studioIntegrationFiles.has(file)) return ["test:studio", "build:studio"];
  if (file.startsWith("studio/components/")) return ["test:studio"];
  if (file.startsWith("studio/pages/") || file === "studio/next.config.js") {
    return ["test:studio", "build:studio"];
  }

  if (file.startsWith("src/")) return ["build:legacy"];

  if (isConfigurationFile(file)) return ["check:v1", "test:v1", "verify:packages"];

  return fallback;
}

export function mapChangedPaths(paths) {
  const normalizedPaths = [...new Set(paths.map(normalize).filter(Boolean))].sort();
  const selected = new Set();
  for (const file of normalizedPaths) {
    for (const commandId of commandsForPath(file)) selected.add(commandId);
    if (/^(?:packages|examples|studio|docs)\//.test(file) && /\.(?:[cm]?[jt]sx?|vue)$/.test(file)) {
      selected.add("quality:knip");
    }
    if (/^(?:packages\/react|examples\/react|studio|docs)\//.test(file) && /\.[cm]?[jt]sx?$/.test(file)) {
      selected.add("quality:react");
    }
  }
  const commandIds = Object.keys(commands).filter((commandId) => selected.has(commandId));
  if (selected.has("release")) return { paths: normalizedPaths, commandIds: ["release"] };
  return { paths: normalizedPaths, commandIds };
}

function childDirectoriesWithManifest(parent, root) {
  const absoluteParent = path.join(root, parent);
  return readdirSync(absoluteParent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${parent}/${entry.name}`)
    .filter((directory) => {
      try {
        return statSync(path.join(root, directory, "package.json")).isFile();
      } catch {
        return false;
      }
    });
}

export function findUnmappedActiveDirectories(root = repositoryRoot) {
  const expected = new Set([
    ...packageNames.map((name) => `packages/${name}`),
    ...exampleNames.map((name) => `examples/${name}`),
    "examples/e2e",
    "examples/shared/event-launch",
  ]);
  const discovered = [
    ...childDirectoriesWithManifest("packages", root),
    ...childDirectoriesWithManifest("examples", root),
    ...childDirectoriesWithManifest("examples/shared", root),
  ];
  return discovered.filter((directory) => !expected.has(directory)).sort();
}

function printPlan(paths) {
  const result = mapChangedPaths(paths);
  if (result.paths.length === 0) {
    console.error("Usage: node scripts/agent/impact-map.mjs <changed-path> [...]");
    process.exitCode = 2;
    return;
  }
  for (const commandId of result.commandIds) console.log(`${commandId}: ${commands[commandId]}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  printPlan(process.argv.slice(2));
}
