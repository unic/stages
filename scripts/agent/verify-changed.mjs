import { spawnSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { commands, mapChangedPaths, orderCommands, repositoryRoot } from "./impact-map.mjs";
import { createVerificationCache } from "./verification-cache.mjs";

const modes = new Set(["plan", "focused", "change", "release"]);
const focusedOmissions = new Set([
  "build:examples", "e2e:all", "e2e:vanilla", "e2e:react", "e2e:vue", "e2e:angular",
  "build:example:vanilla", "build:example:react", "build:example:vue", "build:example:angular",
  "build:docs", "build:studio", "verify:packages",
]);

function git(args, root = repositoryRoot) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  return result.stdout;
}

export function changedPaths(base, root = repositoryRoot) {
  const baseline = base ? git(["merge-base", base, "HEAD"], root).trim() : "HEAD";
  const tracked = git(["diff", "--name-only", "--no-renames", "-z", baseline], root);
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"], root);
  return [...new Set(`${tracked}${untracked}`.split("\0").filter(Boolean))].sort();
}

export function commandIdsForMode(paths, mode) {
  if (mode === "release") return ["release"];
  const selected = mapChangedPaths(paths, { expandDependencies: false }).commandIds;
  if (mode !== "focused") return orderCommands(selected);
  const focused = selected.filter((id) => !focusedOmissions.has(id));
  return orderCommands(focused.length > 0 ? focused : selected);
}

function trackedState() {
  return git(["diff", "--binary", "HEAD"]);
}

export function runCommand(id, logDirectory, options = {}) {
  const logPath = path.join(logDirectory, `${id.replaceAll(":", "-")}.log`);
  const command = options.command ?? commands[id];
  const log = openSync(logPath, "w");
  let result;
  try {
    result = spawnSync(command, {
      cwd: options.cwd ?? repositoryRoot,
      encoding: "utf8",
      shell: true,
      env: process.env,
      stdio: ["ignore", log, log],
    });
  } finally {
    closeSync(log);
  }
  const logger = options.logger ?? console;
  if (result.status !== 0) {
    const tail = readFileSync(logPath, "utf8").trim().split("\n").slice(-40).join("\n");
    logger.error(`${id} failed${result.error ? `: ${result.error.message}` : ""}. Full log: ${logPath}\n${tail}`);
    return false;
  }
  logger.log(`✓ ${id}`);
  return true;
}

export function didTrackedStateChange(before, after) {
  return before !== after;
}

export function executeVerification(ids, options = {}) {
  const state = options.trackedState ?? trackedState;
  const runner = options.runCommand ?? runCommand;
  const logger = options.logger ?? console;
  const before = state();
  const logs = mkdtempSync(path.join(tmpdir(), "stages-verify-"));
  const cache = options.cache;
  for (const id of ids) {
    if (!options.force && cache?.has(id)) {
      logger.log(`↷ ${id} (unchanged since successful verification)`);
      continue;
    }
    const inputsBefore = cache?.fingerprint(id, { includeOwnOutput: false });
    cache?.forget(id);
    if (!runner(id, logs)) {
      if (didTrackedStateChange(before, state())) {
        logger.warn("Warning: verification changed tracked working-tree state.");
      }
      return { success: false, logDirectory: logs };
    }
    if (inputsBefore !== undefined && inputsBefore === cache?.fingerprint(id, { includeOwnOutput: false })) cache.record(id);
  }
  if (didTrackedStateChange(before, state())) {
    logger.warn("Warning: verification changed tracked working-tree state.");
  }
  rmSync(logs, { recursive: true, force: true });
  return { success: true };
}

function main() {
  const mode = process.argv[2] ?? "change";
  const args = process.argv.slice(3);
  let base;
  let force = false;
  let valid = true;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--force") force = true;
    else if (args[index] === "--base" && args[index + 1] && !args[index + 1].startsWith("-")) base = args[++index];
    else valid = false;
  }
  if (!modes.has(mode) || !valid) {
    console.error("Usage: npm run verify:changed -- plan|focused|change|release [--base <ref>] [--force]");
    process.exitCode = 2;
    return;
  }
  const paths = changedPaths(base);
  if (paths.length === 0 && mode !== "release") {
    console.log("No changed files to verify.");
    return;
  }
  const ids = commandIdsForMode(paths, mode);
  const cache = createVerificationCache();
  console.log(`Changed files: ${paths.length}`);
  for (const file of paths) console.log(`  ${file}`);
  console.log("Commands:");
  for (const id of ids) console.log(`  ${!force && cache.has(id) ? "reuse" : "run"}: ${commands[id]}`);
  if (ids.length === 0) console.log("  No executable checks needed for these paths.");
  if (mode === "plan") return;

  if (!executeVerification(ids, { cache, force }).success) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
