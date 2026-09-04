import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx", ".mdx"]);
const activeRoots = [
  "studio/components",
  "studio/pages",
  "docs/app",
  "docs/content",
  "examples/react/src",
  "examples/vue/src",
  "examples/angular/src",
  "examples/vanilla/src",
];
const activeManifests = [
  "studio/package.json",
  "docs/package.json",
  "examples/react/package.json",
  "examples/vue/package.json",
  "examples/angular/package.json",
  "examples/vanilla/package.json",
];
const activeStandaloneFiles = ["docs/mdx-components.jsx", "docs/next.config.mjs"];
const failures = [];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(target));
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(target);
  }
  return files;
}

for (const relativeRoot of activeRoots) {
  for (const file of await sourceFiles(path.join(root, relativeRoot))) {
    const source = await readFile(file, "utf8");
    if (/from\s+["']react-stages["']|require\(["']react-stages["']\)/.test(source)) {
      failures.push(`${path.relative(root, file)} imports the retired 0.x package.`);
    }
  }
}

for (const relativeFile of activeStandaloneFiles) {
  const source = await readFile(path.join(root, relativeFile), "utf8");
  if (/from\s+["']react-stages["']|require\(["']react-stages["']\)/.test(source)) {
    failures.push(`${relativeFile} imports the retired 0.x package.`);
  }
}

for (const relativeManifest of activeManifests) {
  const manifest = JSON.parse(await readFile(path.join(root, relativeManifest), "utf8"));
  for (const dependencyGroup of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    if (manifest[dependencyGroup]?.["react-stages"] !== undefined) {
      failures.push(`${relativeManifest} declares the retired 0.x package.`);
    }
  }
}

async function demoFiles(directory, relativeDirectory = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (relativeDirectory === "" && [".next", "node_modules"].includes(entry.name)) {
      continue;
    }
    const relativeTarget = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await demoFiles(path.join(directory, entry.name), relativeTarget));
    } else {
      files.push(relativeTarget);
    }
  }
  return files;
}

const retiredDemoFiles = (await demoFiles(path.join(root, "demo"))).sort();
const allowedDemoFiles = [".gitignore", "README.md"];
if (JSON.stringify(retiredDemoFiles) !== JSON.stringify(allowedDemoFiles)) {
  failures.push(`demo/ must remain retired; found: ${retiredDemoFiles.join(", ")}.`);
}

for (const retiredDirectory of [
  "docs/pages/fields",
  "docs/pages/form",
  "docs/pages/stages",
  "docs/content/fields",
  "docs/content/form",
  "docs/content/stages",
]) {
  try {
    await readdir(path.join(root, retiredDirectory));
    failures.push(`${retiredDirectory} must not be restored as active 0.x routes.`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("v1 active-application boundary check passed");
}
