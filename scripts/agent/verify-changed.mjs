import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { commands, mapChangedPaths, repositoryRoot } from "./impact-map.mjs";

const modes = new Set(["plan", "focused", "change", "release"]);
const focusedOmissions = new Set([
  "build:examples", "e2e:all", "e2e:vanilla", "e2e:react", "e2e:vue", "e2e:angular",
  "build:example:vanilla", "build:example:react", "build:example:vue", "build:example:angular",
  "build:docs", "build:studio", "verify:packages",
]);

function git(args) {
  const result = spawnSync("git", args, { cwd: repositoryRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  return result.stdout;
}

export function changedPaths() {
  const tracked = git(["diff", "--name-only", "HEAD"]);
  const untracked = git(["ls-files", "--others", "--exclude-standard"]);
  return [...new Set(`${tracked}\n${untracked}`.split("\n").filter(Boolean))].sort();
}

export function commandIdsForMode(paths, mode) {
  if (mode === "release") return ["release"];
  const selected = mapChangedPaths(paths).commandIds;
  if (mode !== "focused") return selected;
  const focused = selected.filter((id) => !focusedOmissions.has(id));
  return focused.length > 0 ? focused : selected;
}

function trackedStatus() {
  return git(["status", "--short", "--untracked-files=no"]);
}

export function runCommand(id, logDirectory, options = {}) {
  const logPath = path.join(logDirectory, `${id.replaceAll(":", "-")}.log`);
  const command = options.command ?? commands[id];
  const result = spawnSync(command, {
    cwd: options.cwd ?? repositoryRoot,
    encoding: "utf8",
    shell: true,
    env: process.env,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const logger = options.logger ?? console;
  writeFileSync(logPath, output);
  if (result.status !== 0) {
    const tail = readFileSync(logPath, "utf8").trim().split("\n").slice(-40).join("\n");
    logger.error(`${id} failed. Full log: ${logPath}\n${tail}`);
    return false;
  }
  logger.log(`✓ ${id}`);
  return true;
}

export function didTrackedStateChange(before, after) {
  return before !== after;
}

function main() {
  const mode = process.argv[2] ?? "change";
  if (!modes.has(mode)) {
    console.error("Usage: npm run verify:changed -- plan|focused|change|release");
    process.exitCode = 2;
    return;
  }
  const paths = changedPaths();
  if (paths.length === 0 && mode !== "release") {
    console.log("No changed files to verify.");
    return;
  }
  const ids = commandIdsForMode(paths, mode);
  console.log(`Changed files: ${paths.length}`);
  for (const file of paths) console.log(`  ${file}`);
  console.log("Commands:");
  for (const id of ids) console.log(`  ${commands[id]}`);
  if (mode === "plan") return;

  const before = trackedStatus();
  const logs = mkdtempSync(path.join(tmpdir(), "stages-verify-"));
  for (const id of ids) {
    if (!runCommand(id, logs)) {
      process.exitCode = 1;
      return;
    }
  }
  const after = trackedStatus();
  if (didTrackedStateChange(before, after)) console.warn("Warning: verification changed tracked working-tree state.");
  rmSync(logs, { recursive: true, force: true });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
