import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function locate(query) {
  const result = spawnSync(process.execPath, [
    ".agents/skills/stages-find-context/scripts/locate.mjs",
    query,
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim().split("\n");
}

test("locates a controller method without dumping documents", () => {
  const lines = locate("StagesController.update");
  assert(lines.includes("Declaration: packages/core/src/index.ts"));
  assert(lines.includes("Guide: docs/content/core-concepts/controller-lifecycle.mdx"));
  assert(lines.length <= 6);
});

test("matches a natural-language public API topic", () => {
  const lines = locate("async validation cancellation");
  assert(lines.includes("Declaration: packages/core/src/index.ts"));
  assert(lines.some((line) => line.includes("validation/async-and-cancellation.mdx")));
  assert(lines.length <= 6);
});

test("falls back to the non-manifest map for repository topics", () => {
  assert.deepEqual(locate("studio"), [
    "Topic map: .agents/skills/stages-find-context/references/topic-map.md",
  ]);
});
