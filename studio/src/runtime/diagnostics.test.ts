import { nodeEvent } from "@stages/core";
import { describe, expect, it } from "vitest";
import { compileStudioForm, resolveStudioSourceEntry, studioRuntimePathKey } from "../compiler";
import { toUid, type StudioFormDocument, type StudioFragmentDefinition, type StudioNode } from "../document";
import { inspectStudioValidation } from "../validation/inspection";
import { createStudioPreviewHost } from "./preview-host";
import { translateStudioRuntimeDiagnostic } from "./diagnostics";
import type { StudioRuntimeDiagnostic } from "./types";

function variantForm(nested = false): StudioFormDocument {
  const nodes: Record<string, StudioNode> = {};
  for (const variant of ["person", "company"]) {
    const fieldUid = toUid(`${variant}_name`);
    const variantUid = toUid(variant);
    nodes[fieldUid] = {
      uid: fieldUid, kind: "field", runtimeId: "name", definition: { key: "text", version: 1 }, props: { label: "Name" },
      derivedProps: { helpText: { kind: "reference", scope: "context", path: ["missing"] } },
      validators: [{ id: `${variant}.required`, kind: "required" }],
    };
    nodes[variantUid] = { uid: variantUid, kind: "variant", runtimeId: variant, childUids: [fieldUid] };
  }
  const contacts = toUid("contacts");
  nodes[contacts] = { uid: contacts, kind: "collection", runtimeId: "contacts", discriminator: "kind", variantUids: [toUid("person"), toUid("company")] };
  if (nested) {
    nodes["groups"] = { uid: toUid("groups"), kind: "collection", runtimeId: "groups", discriminator: "type", variantUids: [toUid("team"), toUid("other")] };
    nodes["team"] = { uid: toUid("team"), kind: "variant", runtimeId: "team", childUids: [contacts] };
    nodes["other"] = { uid: toUid("other"), kind: "variant", runtimeId: "other", childUids: [] };
  }
  return {
    uid: toUid("form_variants"), title: "Variants", runtime: { schemaId: "variants", schemaVersion: 1 },
    rootNodeUids: [nested ? toUid("groups") : contacts], nodes, scenarios: [], settings: {},
  };
}

const rows = [{ kind: "person", name: "" }, { kind: "company", name: "" }];

describe("variant-qualified runtime source mapping", () => {
  it.each([false, true])("maps resolver failures and validation targets to the actual row (nested=%s)", async (nested) => {
    const compiled = compileStudioForm(variantForm(nested));
    expect(compiled.diagnostics).toEqual([]);
    const value = nested ? { groups: [{ type: "team", contacts: rows }] } : { contacts: rows };
    const received: StudioRuntimeDiagnostic[] = [];
    const host = createStudioPreviewHost({ compiled, value, onDiagnostic: (diagnostic) => received.push(diagnostic) });
    try {
      expect(host.getDiagnostics().map(({ entityUid }) => entityUid)).toEqual(["person_name", "company_name"]);
      expect(received.map(({ entityUid }) => entityUid)).toEqual(["person_name", "company_name"]);
      const staticPath = nested ? ["groups", "contacts", "name"] : ["contacts", "name"];
      expect(compiled.sourceMap.uidByPath.has(studioRuntimePathKey(staticPath))).toBe(false);
      expect(compiled.sourceMap.entriesByPath.get(studioRuntimePathKey(staticPath))).toHaveLength(2);
      const first = host.controller.getSnapshot().diagnostics[0]!;
      expect(translateStudioRuntimeDiagnostic(first, compiled.sourceMap).entityUid).toBeUndefined();
      expect(resolveStudioSourceEntry(compiled.sourceMap, first.path, nested
        ? { groups: [{ type: "other", contacts: rows }] }
        : { contacts: [{ kind: "unknown" }] })).toBeUndefined();
      host.update({ compiled, value, context: { missing: "Help" } });
      await host.controller.validate({ event: "submit", reveal: true });
      expect(inspectStudioValidation(host.getSnapshot(), compiled.sourceMap).issues.map(({ targetUid }) => targetUid))
        .toEqual(["person_name", "company_name"]);
    } finally {
      host.destroy();
    }
  });

  it("retains nested fragment provenance for identical paths in different variants", () => {
    const base = variantForm();
    const name = toUid("shared_name");
    const nested = toUid("nested_instance");
    const inner: StudioFragmentDefinition = {
      uid: toUid("inner"), title: "Inner", version: 1, parameters: [], rootNodeUids: [name],
      nodes: { [name]: { ...base.nodes[toUid("person_name")]!, uid: name } },
    };
    const outer: StudioFragmentDefinition = {
      uid: toUid("outer"), title: "Outer", version: 1, parameters: [], rootNodeUids: [nested],
      nodes: { [nested]: { uid: nested, kind: "fragment", runtimeId: "inner", fragmentUid: inner.uid } },
    };
    const nodes = { ...base.nodes };
    for (const variant of ["person", "company"]) {
      const uid = toUid(`${variant}_name`);
      nodes[uid] = { uid, kind: "fragment", runtimeId: "details", fragmentUid: outer.uid };
    }
    const compiled = compileStudioForm({ ...base, nodes }, { [inner.uid]: inner, [outer.uid]: outer });
    expect(compiled.diagnostics).toEqual([]);
    const host = createStudioPreviewHost({ compiled, value: { contacts: rows.map((row) => ({ kind: row.kind, details: { inner: { name: "" } } })) } });
    try {
      expect(host.getDiagnostics()).toEqual(["person", "company"].map((variant) => expect.objectContaining({
        fragmentDefinitionUid: inner.uid, fragmentNodeUid: name,
        fragmentInstanceUids: [toUid(`${variant}_name`), nested],
      })));
      expect(new Set(host.getDiagnostics().map(({ entityUid }) => entityUid)).size).toBe(2);
    } finally {
      host.destroy();
    }
  });

  it("does not guess a variant during restore before the decoded value is available", () => {
    const compiled = compileStudioForm(variantForm());
    const received: StudioRuntimeDiagnostic[] = [];
    const host = createStudioPreviewHost({ compiled, value: { contacts: rows }, onDiagnostic: (diagnostic) => received.push(diagnostic) });
    try {
      const state = host.serialize();
      host.replaceValue({ contacts: [...rows].reverse() });
      received.length = 0;
      host.recreate(state);
      expect(received.length).toBeGreaterThan(0);
      expect(received.every(({ entityUid }) => entityUid === undefined)).toBe(true);
      expect(host.getDiagnostics().map(({ entityUid }) => entityUid)).toEqual(["person_name", "company_name"]);
    } finally {
      host.destroy();
    }
  });

  it("follows reordered rows and does not accept a pending move to resolve diagnostics", async () => {
    const compiled = compileStudioForm(variantForm());
    const value = { contacts: rows };
    const host = createStudioPreviewHost({ compiled, value });
    try {
      const before = host.getDiagnostics();
      host.controller.dispatch(nodeEvent("collection:move", [{ kind: "node", id: "contacts" }], { payload: { from: 0, to: 1 } }));
      await Promise.resolve();
      await Promise.resolve();
      const proposal = host.pendingProposal;
      expect(proposal).toBeDefined();
      expect(host.getDiagnostics().map(({ entityUid }) => entityUid)).toEqual(["person_name", "company_name"]);
      expect(host.pendingProposal).toBe(proposal);
      expect(host.canonicalValue).toBe(value);
      host.acceptProposal(proposal!.transactionId);
      expect(host.getDiagnostics().map(({ entityUid }) => entityUid)).toEqual(["company_name", "person_name"]);
      for (const diagnostic of host.getDiagnostics()) {
        expect(diagnostic.runtimeAddress).toEqual(before.find(({ entityUid }) => entityUid === diagnostic.entityUid)?.runtimeAddress);
      }
    } finally {
      host.destroy();
    }
  });
});
