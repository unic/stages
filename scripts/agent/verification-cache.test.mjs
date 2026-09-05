import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createVerificationCache } from "./verification-cache.mjs";
import { executeVerification } from "./verify-changed.mjs";

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "stages-cache-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.equal(spawnSync("git", ["init", "--quiet"], { cwd: root }).status, 0);
  const write = (file, content = file) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  };
  write(".gitignore", "**/dist/\nnode_modules/\nevidence.json\n");
  for (const name of ["core", "react"]) {
    write(`packages/${name}/src/index.ts`);
    write(`packages/${name}/test/runtime.test.mjs`);
    write(`packages/${name}/dist/index.js`);
  }
  write("package-lock.json", "{}");
  const cachePath = path.join(root, "evidence.json");
  const open = (environment = {}) => createVerificationCache({ root, cachePath, environment });
  return { root, write, open, cachePath };
}

test("reuses successful evidence across invocations and ignores unrelated source edits", (t) => {
  const { write, open } = fixture(t);
  open().record("test:react");
  assert.equal(open().has("test:react"), true);
  write("docs/content/introduction.mdx", "New prose");
  assert.equal(open().has("test:react"), true);
  write("packages/core/src/index.ts", "changed core");
  assert.equal(open().has("test:react"), false);
});

test("test-only changes invalidate tests without rebuilding package output", (t) => {
  const { write, open } = fixture(t);
  const cache = open();
  cache.record("build:react");
  cache.record("test:react");
  write("packages/react/test/runtime.test.mjs", "new assertion");
  assert.equal(cache.has("build:react"), true);
  assert.equal(cache.has("test:react"), false);
});

test("missing, modified, or additional generated output invalidates prior evidence", (t) => {
  const { root, write, open } = fixture(t);
  const cache = open();
  cache.record("build:react");
  cache.record("test:react");
  write("packages/core/dist/index.js", "changed externally");
  assert.equal(cache.has("build:react"), false);
  assert.equal(cache.has("test:react"), false);
  cache.record("build:react");
  write("packages/react/dist/extra.js");
  assert.equal(cache.has("build:react"), false);
  cache.record("build:react");
  rmSync(path.join(root, "packages/react/dist"), { recursive: true });
  assert.equal(cache.has("build:react"), false);
});

test("configuration, installs, and environment changes invalidate evidence", (t) => {
  const { write, open } = fixture(t);
  const cache = open();
  cache.record("test:react");
  assert.equal(open({ NODE_OPTIONS: "--conditions=development" }).has("test:react"), false);
  write("package-lock.json", '{"changed":true}');
  assert.equal(cache.has("test:react"), false);
  cache.record("test:react");
  write("node_modules/.package-lock.json", '{"installed":true}');
  assert.equal(cache.has("test:react"), false);
});

test("shell nesting and launch-service metadata do not discard successful evidence", (t) => {
  const { open } = fixture(t);
  open({ SHLVL: "1", XPC_SERVICE_NAME: "first" }).record("test:react");
  assert.equal(open({ SHLVL: "2", XPC_SERVICE_NAME: "second" }).has("test:react"), true);
});

test("deletions and newly added untracked inputs invalidate evidence", (t) => {
  const { root, write, open } = fixture(t);
  const cache = open();
  cache.record("test:react");
  write("packages/react/src/new.ts");
  assert.equal(cache.has("test:react"), false);
  cache.record("test:react");
  rmSync(path.join(root, "packages/react/src/index.ts"));
  assert.equal(cache.has("test:react"), false);
});

test("corrupt evidence is a miss; release, fallback, and browser checks never reuse evidence", (t) => {
  const { cachePath, open } = fixture(t);
  writeFileSync(cachePath, "not json");
  assert.equal(open().has("test:react"), false);
  const cache = open();
  for (const id of ["release", "check:v1", "test:v1", "e2e:react"]) {
    cache.record(id);
    assert.equal(cache.has(id), false);
  }
});

test("focused-to-change execution reuses successes; forced failure removes old success", (t) => {
  const { open } = fixture(t);
  const cache = open();
  const calls = [];
  const options = {
    cache, trackedState: () => "stable", logger: { log() {}, warn() {} },
    runCommand: (id) => { calls.push(id); return true; },
  };
  executeVerification(["build:core", "build:react", "test:react"], options);
  executeVerification(["build:core", "build:react", "test:react", "e2e:react"], options);
  assert.deepEqual(calls, ["build:core", "build:react", "test:react", "e2e:react"]);
  const failure = executeVerification(["test:react"], { ...options, force: true, runCommand: () => false });
  t.after(() => rmSync(failure.logDirectory, { recursive: true, force: true }));
  assert.equal(failure.success, false);
  assert.equal(open().has("test:react"), false);
});

test("does not certify inputs edited while a command runs", (t) => {
  const { open, write } = fixture(t);
  const cache = open();
  executeVerification(["test:react"], {
    cache, trackedState: () => "stable",
    runCommand: () => { write("packages/react/src/index.ts", "concurrent edit"); return true; },
  });
  assert.equal(cache.has("test:react"), false);
});

test("a cold build is recorded after output is produced", (t) => {
  const { root, write, open } = fixture(t);
  rmSync(path.join(root, "packages/core/dist"), { recursive: true });
  const cache = open();
  executeVerification(["build:core"], {
    cache, trackedState: () => "stable",
    runCommand: () => { write("packages/core/dist/index.js", "built"); return true; },
  });
  assert.equal(open().has("build:core"), true);
  assert.match(readFileSync(path.join(root, "packages/core/dist/index.js"), "utf8"), /built/);
});
