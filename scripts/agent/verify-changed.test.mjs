import assert from "node:assert/strict";
import test from "node:test";
import { commandIdsForMode } from "./verify-changed.mjs";

test("release mode always delegates to the complete release gate", () => {
  assert.deepEqual(commandIdsForMode(["docs/examples/persistence.ts"], "release"), ["release"]);
});

test("change mode retains the complete adapter impact selection", () => {
  assert.deepEqual(commandIdsForMode(["packages/react/src/index.tsx"], "change"), [
    "build:core", "build:react", "typecheck:react", "test:react", "build:example:react", "e2e:react",
  ]);
});

test("focused mode rebuilds and tests packages while omitting application verification", () => {
  assert.deepEqual(commandIdsForMode(["packages/react/src/index.tsx"], "focused"), [
    "build:core", "build:react", "typecheck:react", "test:react",
  ]);
});

test("unknown files keep the safe fallback in focused mode", () => {
  assert.deepEqual(commandIdsForMode(["future/source.ts"], "focused"), ["check:v1", "test:v1"]);
});
