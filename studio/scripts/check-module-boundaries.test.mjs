import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkStudioModuleBoundaries } from "./check-module-boundaries.mjs";

async function fixture(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "stages-studio-boundaries-"));
  for (const moduleName of ["document", "commands", "compiler", "expressions", "legacy"]) {
    await mkdir(path.join(root, moduleName), { recursive: true });
  }
  for (const [relativePath, source] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, source);
  }
  return root;
}

test("accepts browser-free domain and public Stages imports", async (context) => {
  const root = await fixture({
    "document/index.ts": "export interface Document { readonly id: string }",
    "commands/index.ts": "import type { Document } from '../document'; export type Command = Document;",
    "compiler/index.ts": "import type { StagesSchema } from '@stages/core'; export type Output = StagesSchema<unknown, {}, unknown>;",
    "expressions/index.ts": "export type Expression = { readonly kind: 'literal' };",
    "legacy/index.ts": "import type { Expression } from '../expressions'; export type Imported = Expression;",
  });
  context.after(() => rm(root, { recursive: true, force: true }));

  assert.deepEqual(await checkStudioModuleBoundaries(root), []);
});

test("rejects framework, browser, storage, and outward module dependencies", async (context) => {
  const root = await fixture({
    "document/react.ts": "import React from 'react'; export { React };",
    "commands/storage.ts": "export const saved = localStorage.getItem('project');",
    "compiler/runtime.ts": "import value from '../runtime'; export default value;",
    "legacy/browser.ts": "export const current = sessionStorage.getItem('legacy');",
  });
  context.after(() => rm(root, { recursive: true, force: true }));

  assert.deepEqual(await checkStudioModuleBoundaries(root), [
    "commands/storage.ts:1: pure modules cannot use browser global localStorage.",
    "compiler/runtime.ts: pure modules cannot import src/runtime.",
    "document/react.ts: pure modules cannot import react.",
    "legacy/browser.ts:1: pure modules cannot use browser global sessionStorage.",
  ]);
});

test("rejects source evaluation and network access in pure modules", async (context) => {
  const root = await fixture({
    "expressions/evaluate.ts": "export const a = eval('1'); export const b = new Function('return 1'); export const c = Function('return 2'); void globalThis.fetch('/');",
  });
  context.after(() => rm(root, { recursive: true, force: true }));

  assert.deepEqual(await checkStudioModuleBoundaries(root), [
    "expressions/evaluate.ts:1: pure modules cannot construct functions from source text.",
    "expressions/evaluate.ts:1: pure modules cannot evaluate source text.",
    "expressions/evaluate.ts:1: pure modules cannot evaluate source text.",
    "expressions/evaluate.ts:1: pure modules cannot use browser global fetch.",
  ]);
});
