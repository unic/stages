import { fieldEvent, stages, type ValidationCancellationSignal } from "@stages/core";
import { describe, expect, it } from "vitest";
import { compileStudioForm } from "../compiler";
import { toUid, type StudioCollectionNode, type StudioFieldNode, type StudioFormDocument, type StudioValidatorSpec } from "../document";

import { defineStudioAsyncServiceBindings, type StudioAsyncServiceResult } from "../registry";

function rowForm(): StudioFormDocument {
  const rows = toUid("rows");
  const a = toUid("a");
  const b = toUid("b");
  return {
    uid: toUid("row_dependencies"), title: "Row dependencies",
    runtime: { schemaId: "row-dependencies", schemaVersion: 1 },
    rootNodeUids: [rows], scenarios: [], settings: {},
    nodes: {
      [rows]: { uid: rows, kind: "collection", runtimeId: "rows", childUids: [a, b] },
      [a]: { uid: a, kind: "field", runtimeId: "a", definition: { key: "number", version: 1 }, props: { label: "Number" },
        validators: [{ kind: "comparison", operator: "<=", other: { kind: "reference", scope: "row", path: ["b"] } }] },
      [b]: { uid: b, kind: "field", runtimeId: "b", definition: { key: "number", version: 1 }, props: { label: "Number" } },
    },
  };
}

describe("relative validator dependencies", () => {
  it("invalidates accepted sibling changes before an explicit revalidation", async () => {
    const compiled = compileStudioForm(rowForm());
    expect(compiled.diagnostics).toEqual([]);
    const controller = stages({ schema: compiled.schemaInput, fields: compiled.fields, value: { rows: [{ a: 5, b: 10 }] } });
    expect((await controller.validate()).status).toBe("valid");
    controller.update({ value: { rows: [{ a: 5, b: 2 }] } });
    expect(controller.getSnapshot().validation.status).toBe("unknown");
    expect((await controller.validate()).status).toBe("invalid");
    controller.destroy();
  });
});

function withRule(spec: StudioValidatorSpec): StudioFormDocument {
  const form = rowForm();
  const a = form.nodes[toUid("a")] as StudioFieldNode;
  return { ...form, nodes: { ...form.nodes, [a.uid]: { ...a, validators: [spec] } } };
}

const comparison = (scope: "row" | "item" = "row"): StudioValidatorSpec => ({
  kind: "comparison", operator: "<=", other: { kind: "reference", scope, path: ["b"] },
});

it.each(["row", "item"] as const)("tracks %s in conditions as well as comparisons", async (scope) => {
  const compiled = compileStudioForm(withRule({
    kind: "range", max: 1,
    when: { kind: "binary", operator: "<", left: { kind: "reference", scope, path: ["b"] }, right: { kind: "literal", value: 5 } },
  }));
  const controller = stages({ schema: compiled.schema, fields: compiled.fields, value: { rows: [{ a: 5, b: 10 }] } });
  expect((await controller.validate()).status).toBe("valid");
  controller.update({ value: { rows: [{ a: 5, b: 2 }] } });
  expect(controller.getSnapshot().validation.status).toBe("unknown");
  expect((await controller.validate()).status).toBe("invalid");
  controller.destroy();
});

it("validates accepted values while proposals are pending or rejected", async () => {
  const compiled = compileStudioForm(withRule({ ...comparison(), on: "submit" }));
  const accepted = { rows: [{ a: 5, b: 10 }] };
  const proposals: (typeof accepted)[] = [];
  const controller = stages({ schema: compiled.schema, fields: compiled.fields, value: accepted, onChange: ({ value }) => { proposals.push(value); } });
  expect((await controller.validate()).status).toBe("valid");
  controller.dispatch(fieldEvent("input", ["rows", 0, "b"], { payload: 2 }));
  await Promise.resolve();
  expect(proposals).toEqual([{ rows: [{ a: 5, b: 2 }] }]);
  expect(controller.getSnapshot().value).toEqual(accepted);
  expect(controller.getSnapshot().validation.status).toBe("valid");
  controller.update({ value: accepted });
  expect(controller.getSnapshot().validation.status).toBe("valid");
  controller.update({ value: proposals[0]! });
  expect(controller.getSnapshot().validation.status).toBe("unknown");
  expect((await controller.validate()).status).toBe("invalid");
  controller.destroy();
});

it("uses the outer collection for nested rows and the parent object outside collections", async () => {
  for (const kind of ["collection", "group"] as const) {
    const base = rowForm();
    const outer = toUid("outer");
    const rows = toUid("rows");
    const inner = base.nodes[rows] as StudioCollectionNode;
    const form: StudioFormDocument = {
      ...base, rootNodeUids: [outer], nodes: {
        ...base.nodes,
        [outer]: { uid: outer, kind, runtimeId: "outer", childUids: [rows] },
        [rows]: kind === "collection" ? inner : { uid: rows, kind: "group", runtimeId: "rows", childUids: [toUid("a"), toUid("b")] },
      },
    };
    const value = (b: number) => kind === "collection" ? { outer: [{ rows: [{ a: 5, b }] }] } : { outer: { rows: { a: 5, b } } };
    const compiled = compileStudioForm(form);
    expect(compiled.diagnostics).toEqual([]);
    const controller = stages({ schema: compiled.schema, fields: compiled.fields, value: value(10) });
    expect((await controller.validate()).status).toBe("valid");
    controller.update({ value: value(2) });
    expect(controller.getSnapshot().validation.status).toBe("unknown");
    const result = await controller.validate();
    expect(result.issues[0]?.path).toEqual(kind === "collection" ? ["outer", 0, "rows", 0, "a"] : ["outer", "rows", "a"]);
    controller.destroy();
  }
});

it("tracks linked fragment occurrences independently outside collections", async () => {
  const base = rowForm();
  const fragment = toUid("pair");
  const first = toUid("first");
  const second = toUid("second");
  const a = toUid("a");
  const b = toUid("b");
  const form: StudioFormDocument = {
    ...base, rootNodeUids: [first, second], nodes: {
      [first]: { uid: first, kind: "fragment", runtimeId: "first", fragmentUid: fragment },
      [second]: { uid: second, kind: "fragment", runtimeId: "second", fragmentUid: fragment },
    },
  };
  const fragments = { [fragment]: {
    uid: fragment, title: "Pair", version: 1, parameters: [], rootNodeUids: [a, b],
    nodes: { [a]: base.nodes[a]!, [b]: base.nodes[b]! },
  } };
  const compiled = compileStudioForm(form, fragments);
  expect(compiled.diagnostics).toEqual([]);
  const controller = stages({ schema: compiled.schema, fields: compiled.fields, value: { first: { a: 5, b: 10 }, second: { a: 5, b: 10 } } });
  expect((await controller.validate()).status).toBe("valid");
  controller.update({ value: { first: { a: 5, b: 2 }, second: { a: 5, b: 10 } } });
  expect(controller.getSnapshot().validation.status).toBe("unknown");
  expect((await controller.validate()).issues.map(({ path }) => path)).toEqual([["first", "a"]]);
  controller.destroy();
});

it("keeps issues on their current paths after move, sort, removal and variant replacement", async () => {
  const base = rowForm();
  const rows = toUid("rows");
  const a = toUid("a");
  const b = toUid("b");
  const pair = toUid("pair");
  const empty = toUid("empty");
  const form: StudioFormDocument = { ...base, nodes: {
    ...base.nodes,
    [rows]: { uid: rows, kind: "collection", runtimeId: "rows", itemKey: { kind: "property", property: "id" }, discriminator: "kind", variantUids: [pair, empty] },
    [pair]: { uid: pair, kind: "variant", runtimeId: "pair", childUids: [a, b] },
    [empty]: { uid: empty, kind: "variant", runtimeId: "empty", childUids: [] },
  } };
  const compiled = compileStudioForm(form);
  expect(compiled.diagnostics).toEqual([]);
  const good = { id: "good", kind: "pair", a: 5, b: 10 };
  const bad = { id: "bad", kind: "pair", a: 5, b: 2 };
  const controller = stages({ schema: compiled.schema, fields: compiled.fields, value: { rows: [good, bad] } });
  expect((await controller.validate()).issues[0]?.path).toEqual(["rows", 1, "a"]);
  for (const moved of [[bad, good], [good, bad], [bad]]) {
    controller.update({ value: { rows: moved } });
    expect(controller.getSnapshot().validation.status).toBe("unknown");
    expect((await controller.validate()).issues[0]?.path).toEqual(["rows", moved.indexOf(bad), "a"]);
  }
  controller.update({ value: { rows: [{ ...bad, kind: "empty" }] } });
  expect((await controller.validate()).issues).toEqual([]);
  controller.destroy();
});

it("cancels row-dependent services and suppresses their late results", async () => {
  const pending: { signal: ValidationCancellationSignal; resolve: (result: StudioAsyncServiceResult) => void }[] = [];
  const bindings = defineStudioAsyncServiceBindings([{
    key: "pair", version: 1,
    invoke: ({ input, validation }) => {
      expect(input).toBe(10);
      return new Promise((resolve) => { pending.push({ signal: validation.signal, resolve }); });
    },
  }]);
  const compiled = compileStudioForm(withRule({ kind: "service", service: { key: "pair", version: 1 }, request: { kind: "reference", scope: "row", path: ["b"] } }), {}, { serviceBindings: bindings });
  const controller = stages({ schema: compiled.schema, fields: compiled.fields, value: { rows: [{ a: 5, b: 10 }, { a: 6, b: 10 }] } });
  const validation = controller.validate();
  expect(pending).toHaveLength(2);
  controller.update({ value: { rows: [{ a: 5, b: 2 }, { a: 6, b: 10 }] } });
  // The documented conservative collection dependency invalidates both rows.
  expect(pending.every(({ signal }) => signal.aborted)).toBe(true);
  for (const { resolve } of pending) resolve({ status: "failure", code: "stale" });
  await validation;
  expect(controller.getSnapshot().validation.status).toBe("unknown");
  expect(controller.getSnapshot().validation.issues).toEqual([]);
  controller.destroy();
});

it.each(["context", "interface", "extension"] as const)("invalidates %s references on trusted host updates", async (scope) => {
  const compiled = compileStudioForm(withRule({ kind: "comparison", operator: "<=", other: { kind: "reference", scope, path: ["limit"] } }));
  const controller = stages({ schema: compiled.schema, fields: compiled.fields, value: { rows: [{ a: 5, b: 10 }] }, context: { limit: 10 }, extensions: { limit: 10 }, extensionCodecs: { limit: { encode: (value) => Number(value), decode: (value) => value } } });
  expect((await controller.validate()).status).toBe("valid");
  controller.update(scope === "extension" ? { extensions: { limit: 2 } } : { context: { limit: 2 } });
  expect(controller.getSnapshot().validation.status).toBe("unknown");
  expect((await controller.validate()).status).toBe("invalid");
  controller.destroy();
});

it.each(["metadata", "event"] as const)("rejects untracked or unavailable %s validator scope", (scope) => {
  const compiled = compileStudioForm(withRule({ ...comparison(), when: { kind: "reference", scope, path: [] } }));
  expect(compiled.diagnostics).toContainEqual(expect.objectContaining({
    code: "compiler.unsupported-validator-scope", entityUid: "a", propertyPath: ["nodes", "a", "validators", 0],
  }));
});

it("retains computed documents but reports the exact unsupported property", () => {
  const base = rowForm();
  const a = base.nodes[toUid("a")] as StudioFieldNode;
  const compiled = compileStudioForm({ ...base, nodes: { ...base.nodes, [a.uid]: { ...a, computed: { kind: "literal", value: 5 } } } });
  expect(compiled.diagnostics).toContainEqual(expect.objectContaining({
    code: "compiler.unsupported-computed", severity: "error", entityUid: a.uid,
    propertyPath: ["nodes", a.uid, "computed"], message: expect.stringContaining("event transforms"),
  }));
});

it("bounds the documented invalidation fan-out to the containing collection", async () => {
  const base = rowForm();
  const serviceRule: StudioValidatorSpec = { kind: "service", service: { key: "pair", version: 1 }, request: { kind: "reference", scope: "row", path: ["b"] } };
  const form = withRule(serviceRule);
  const other = toUid("other");
  let calls = 0;
  const bindings = defineStudioAsyncServiceBindings([{
    key: "pair", version: 1, invoke: async () => { calls += 1; return { status: "success" }; },
  }]);
  const compiled = compileStudioForm({ ...form, rootNodeUids: [...form.rootNodeUids, other], nodes: {
    ...form.nodes,
    [other]: { ...(base.nodes[toUid("a")] as StudioFieldNode), uid: other, runtimeId: "other", validators: [{ kind: "required" }] },
  } }, {}, { serviceBindings: bindings });
  expect(compiled.diagnostics).toEqual([]);
  const rows = Array.from({ length: 1_000 }, () => ({ a: 5, b: 10 }));
  const controller = stages({ schema: compiled.schema, fields: compiled.fields, value: { rows, other: 1 } });
  expect((await controller.validate()).status).toBe("valid");
  expect(calls).toBe(1_000);
  controller.update({ value: { rows, other: 2 } });
  const retained = controller.getSnapshot().nodes[0];
  expect(retained?.kind === "collection" ? retained.validation?.status : undefined).toBe("valid");
  expect(calls).toBe(1_000);
  controller.update({ value: { rows: rows.map((row, index) => index === 0 ? { ...row, b: 2 } : row), other: 2 } });
  const invalidated = controller.getSnapshot().nodes[0];
  expect(invalidated?.kind === "collection" ? invalidated.validation?.status : undefined).toBe("unknown");
  expect((await controller.validate()).status).toBe("valid");
  expect(calls).toBe(2_000);
  controller.destroy();
});
