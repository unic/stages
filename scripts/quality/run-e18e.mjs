import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const npmCache = path.join(tmpdir(), "stages-e18e-npm-cache");
const cli = path.join(repositoryRoot, "node_modules/@e18e/cli/cli.js");
const reportAdvisories = process.argv.includes("--report");
const sourcePatterns = [
  "packages/*/src/**/*.{ts,tsx}",
  "examples/{shared,vanilla,react,vue,angular,e2e}/**/*.{js,jsx,mjs,ts,tsx}",
  "studio/{components,lib,pages,shared,test}/**/*.{js,jsx,mjs}",
  "docs/{components,examples}/**/*.{js,jsx,mjs,ts,tsx}",
];

mkdirSync(npmCache, { recursive: true });
const result = spawnSync(process.execPath, [
  cli,
  "analyze",
  "--log-level", reportAdvisories ? "warn" : "error",
  ...(reportAdvisories ? ["--report-level", "info"] : ["--quiet"]),
  ...sourcePatterns.flatMap((pattern) => ["--src", pattern]),
], {
  cwd: repositoryRoot,
  env: { ...process.env, npm_config_cache: npmCache },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
