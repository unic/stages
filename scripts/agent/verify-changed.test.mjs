import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { changedPaths, commandIdsForMode, didTrackedStateChange, executeVerification, runCommand } from "./verify-changed.mjs";

test("release mode always delegates to the complete release gate", () => {
  assert.deepEqual(commandIdsForMode(["docs/examples/persistence.ts"], "release"), ["release"]);
});

test("change mode retains the complete adapter impact selection", () => {
  assert.deepEqual(commandIdsForMode(["packages/react/src/index.tsx"], "change"), [
    "build:core", "build:react", "typecheck:react", "test:react", "build:shared-example", "build:example:react", "e2e:react",
    "quality:knip", "quality:react",
  ]);
});

test("focused mode rebuilds and tests packages while omitting application verification", () => {
  assert.deepEqual(commandIdsForMode(["packages/react/src/index.tsx"], "focused"), [
    "build:core", "build:react", "typecheck:react", "test:react", "quality:knip", "quality:react",
  ]);
});

test("unknown files keep the safe fallback in focused mode", () => {
  assert.deepEqual(commandIdsForMode(["future/source.ts"], "focused"), ["check:v1", "test:v1"]);
});

test("failed commands retain their complete log", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "stages-verify-failure-"));
  try {
    const success = runCommand("controlled:failure", directory, {
      command: `${JSON.stringify(process.execPath)} -e ${JSON.stringify("console.error('controlled failure'); process.exit(7)")}`,
      logger: { error() {}, log() {} },
    });
    const log = path.join(directory, "controlled-failure.log");
    assert.equal(success, false);
    assert.equal(existsSync(log), true);
    assert.match(readFileSync(log, "utf8"), /controlled failure/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("detects tracked-state mutation without flagging stable state", () => {
  assert.equal(didTrackedStateChange(" M package.json\n", " M package.json\n"), false);
  assert.equal(didTrackedStateChange("", " M generated-cache.json\n"), true);
});

test("warns about tracked mutations even when verification fails", async () => {
  const warnings = [];
  const states = ["before", "after"];
  const result = executeVerification(["controlled"], {
    trackedState: () => states.shift(),
    runCommand: () => false,
    logger: { warn: (message) => warnings.push(message) },
  });
  try {
    assert.equal(result.success, false);
    assert.deepEqual(warnings, ["Warning: verification changed tracked working-tree state."]);
    assert.equal(existsSync(result.logDirectory), true);
  } finally {
    await rm(result.logDirectory, { recursive: true, force: true });
  }
});

test("change discovery includes staged, unstaged, untracked, and both sides of renames", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "stages-change-paths-"));
  const git = (...args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  try {
    git("init", "--quiet");
    writeFileSync(path.join(root, "original.ts"), "original");
    git("add", ".");
    git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--quiet", "-m", "base");
    const base = git("rev-parse", "HEAD");
    renameSync(path.join(root, "original.ts"), path.join(root, "renamed.ts"));
    git("add", ".");
    assert.deepEqual(changedPaths(undefined, root), ["original.ts", "renamed.ts"]);
    git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--quiet", "-m", "rename");
    writeFileSync(path.join(root, "renamed.ts"), "unstaged edit");
    writeFileSync(path.join(root, "untracked\nname.ts"), "new");
    writeFileSync(path.join(root, "staged.ts"), "staged");
    git("add", "staged.ts");
    assert.deepEqual(changedPaths(base, root), ["original.ts", "renamed.ts", "staged.ts", "untracked\nname.ts"]);
    assert.deepEqual(changedPaths(undefined, root), ["renamed.ts", "staged.ts", "untracked\nname.ts"]);
    renameSync(path.join(root, "renamed.ts"), path.join(root, "original.ts"));
    writeFileSync(path.join(root, "original.ts"), "original");
    git("add", "original.ts", "renamed.ts");
    assert.deepEqual(changedPaths(base, root), ["staged.ts", "untracked\nname.ts"], "exclude branch edits reverted back to the merge base");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
