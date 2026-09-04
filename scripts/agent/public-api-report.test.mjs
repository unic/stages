import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  canonicalizeDeclaration,
  checkReports,
  createPackageReport,
  updateReports,
} from "./public-api-report.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "stages-api-report-"));
  mkdirSync(path.join(root, "packages/example/dist/nested"), { recursive: true });
  writeFileSync(path.join(root, "packages/example/package.json"), JSON.stringify({ name: "@stages/example" }));
  writeFileSync(path.join(root, "packages/example/dist/index.d.ts"), "export interface Example { readonly value: string; }\n//# sourceMappingURL=index.d.ts.map\n");
  writeFileSync(path.join(root, "packages/example/dist/nested/helper.d.ts"), "export declare function helper(input:number): boolean;\n");
  return root;
}

test("canonicalizes TypeScript declarations and removes source-map noise", () => {
  assert.equal(
    canonicalizeDeclaration("export declare function value(input:string):number;\n//# sourceMappingURL=index.d.ts.map\n"),
    "export declare function value(input: string): number;",
  );
});

test("reports every emitted declaration in stable path order", async () => {
  const root = await fixture();
  try {
    assert.deepEqual(createPackageReport(root, "example"), {
      package: "@stages/example",
      files: [
        { path: "index.d.ts", declaration: "export interface Example {\n    readonly value: string;\n}" },
        { path: "nested/helper.d.ts", declaration: "export declare function helper(input: number): boolean;" },
      ],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("updates reports and detects subsequent declaration drift", async () => {
  const root = await fixture();
  try {
    updateReports(root, ["example"]);
    assert.deepEqual(checkReports(root, ["example"]), []);
    const report = readFileSync(path.join(root, "contracts/public-api/example.api.json"), "utf8");
    assert.match(report, /@stages\/example/);
    writeFileSync(path.join(root, "packages/example/dist/index.d.ts"), "export interface Example { readonly value: number; }\n");
    assert.deepEqual(checkReports(root, ["example"]), [
      "Public API changed: contracts/public-api/example.api.json (run with --update for an intentional change)",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("explains that packages must be built before checking", async () => {
  const root = await fixture();
  try {
    mkdirSync(path.join(root, "packages/unbuilt"), { recursive: true });
    writeFileSync(path.join(root, "packages/unbuilt/package.json"), JSON.stringify({ name: "@stages/unbuilt" }));
    assert.deepEqual(checkReports(root, ["unbuilt"]), [
      "No emitted declarations found for @stages/unbuilt; run npm run build:v1 first.",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
