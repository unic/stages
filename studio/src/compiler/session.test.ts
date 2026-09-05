import { describe, expect, it } from "vitest";
import { fieldEvent, stages } from "@stages/core";
import projectV1 from "../document/fixtures/project-v1.json";
import { toUid, type StudioFieldNode, type StudioProjectDocument } from "../document";
import { defineStudioAsyncServiceBindings } from "../registry";
import { createStudioCompilerSession } from "./session";

const project = projectV1 as unknown as StudioProjectDocument;
const form = project.forms[toUid("form_event")]!;

describe("Studio compiler session", () => {
  it("retains dynamic schema identity through fragment presentation edits but invalidates runtime inputs", () => {
    const field = form.nodes[toUid("field_title")] as StudioFieldNode;
    const fragmentUid = toUid("fragment_details");
    const instanceUid = toUid("instance_details");
    const source: typeof form = { ...form, rootNodeUids: [instanceUid], nodes: {
      [instanceUid]: { uid: instanceUid, kind: "fragment", runtimeId: "details", fragmentUid },
    } };
    const definition = { uid: fragmentUid, title: "Details", version: 1, parameters: [], rootNodeUids: [field.uid], nodes: {
      [field.uid]: { ...field, behavior: { presentWhen: { kind: "literal", value: true } as const } },
    } };
    const session = createStudioCompilerSession();
    const first = session.compile(source, { [fragmentUid]: definition });
    expect(typeof first.schemaInput).toBe("function");
    const edited: typeof form = { ...source, nodes: { [instanceUid]: {
      uid: instanceUid, kind: "fragment", runtimeId: "details", fragmentUid,
      overrides: { [field.uid]: { presentation: { blockWidth: { desktop: "medium" } } } },
    } } };
    const second = session.compile(edited, { [fragmentUid]: definition });
    expect(second.schema).toBe(first.schema);
    expect(second.schemaInput).toBe(first.schemaInput);
    expect(second.renderPlan).not.toEqual(first.renderPlan);
    expect(second.sourceMap).not.toBe(first.sourceMap);
    const changedDefinition = { ...definition, nodes: { [field.uid]: {
      ...field, behavior: { presentWhen: { kind: "literal", value: false } as const },
    } } };
    const third = session.compile(edited, { [fragmentUid]: changedDefinition });
    expect(third.schemaInput).not.toBe(second.schemaInput);
    const localized = session.compile(edited, { [fragmentUid]: changedDefinition }, { localization: { defaultLocale: "de", resources: {} } });
    expect(localized.schemaInput).not.toBe(third.schemaInput);
    const rebound = session.compile(edited, { [fragmentUid]: changedDefinition }, {
      localization: { defaultLocale: "de", resources: {} }, serviceBindings: defineStudioAsyncServiceBindings([]),
    });
    expect(rebound.schemaInput).not.toBe(localized.schemaInput);
  });

  it("reuses reducer definitions for presentation edits but refreshes rules and resolved targets", async () => {
    const field = form.nodes[toUid("field_title")] as StudioFieldNode;
    const targetUid = toUid("field_summary");
    const source: typeof form = { ...form, rootNodeUids: [field.uid, targetUid], nodes: {
      [field.uid]: { ...field, reducers: [{ id: "copy", on: "copy", actions: [{
        op: "set", target: { kind: "node", uid: targetUid }, value: { kind: "literal", value: "Copied" },
      }] }] },
      [targetUid]: { ...field, uid: targetUid, runtimeId: "summary" },
    } };
    const session = createStudioCompilerSession();
    const first = session.compile(source);
    const type = `text__studio__${field.uid}`;
    const relabeled: typeof form = { ...source, nodes: { ...source.nodes, [field.uid]: {
      ...source.nodes[field.uid]!, props: { label: "Headline" },
    } } };
    const second = session.compile(relabeled);
    expect(second).not.toBe(first);
    expect(second.fields[type]).toBe(first.fields[type]);
    expect(second.schema).not.toBe(first.schema);
    expect(createStudioCompilerSession().compile(relabeled).fields[type]).not.toBe(second.fields[type]);

    const moved: typeof form = { ...relabeled, nodes: { ...relabeled.nodes, [targetUid]: {
      ...relabeled.nodes[targetUid]!, runtimeId: "headline",
    } } };
    const third = session.compile(moved);
    expect(third.fields[type]).not.toBe(second.fields[type]);
    let proposed: unknown;
    const controller = stages({ schema: third.schemaInput, fields: third.fields,
      value: { title: "Title", headline: "" }, onChange: (change) => { proposed = change.value; } });
    controller.dispatch(fieldEvent("copy", ["title"]));
    await Promise.resolve();
    await Promise.resolve();
    expect(proposed).toEqual({ title: "Title", headline: "Copied" });
    controller.destroy();

    const changed = structuredClone(moved);
    const changedField = changed.nodes[field.uid] as StudioFieldNode;
    const changedRules = [{ ...changedField.reducers![0]!, on: "paste" }];
    const fourth = session.compile({ ...changed, nodes: { ...changed.nodes, [field.uid]: { ...changedField, reducers: changedRules } } });
    expect(fourth.fields[type]).not.toBe(third.fields[type]);
    const beforeRebind = session.compile(moved);
    const rebound = session.compile(moved, {}, { serviceBindings: defineStudioAsyncServiceBindings([]) });
    expect(rebound.fields[type]).not.toBe(beforeRebind.fields[type]);

    const missing = { ...source, rootNodeUids: [field.uid], nodes: { [field.uid]: source.nodes[field.uid]! } };
    const invalid = session.compile(missing);
    expect(invalid.diagnostics).toContainEqual(expect.objectContaining({ code: "compiler.invalid-patch-target" }));
    const invalidEdit = session.compile({ ...missing, title: "Still invalid" });
    expect(invalidEdit.diagnostics).toContainEqual(expect.objectContaining({ code: "compiler.invalid-patch-target" }));
  });

  it("reuses compilation for unchanged and equivalent immutable document inputs", () => {
    const session = createStudioCompilerSession();
    const first = session.compile(form, project.fragments);
    expect(session.compile(form, project.fragments)).toBe(first);
    const equivalent = { ...structuredClone(form), nodes: Object.fromEntries(Object.entries(form.nodes).reverse()) };
    expect(session.compile(equivalent, {})).toBe(first);
    expect(createStudioCompilerSession().compile(form)).not.toBe(first);
  });

  it("invalidates document, fragment, localization, and trusted binding changes", () => {
    const session = createStudioCompilerSession();
    const bindings = defineStudioAsyncServiceBindings([]);
    const localization = { defaultLocale: "en", resources: {} };
    const first = session.compile(form, {}, { serviceBindings: bindings, localization });
    expect(session.compile(form, {}, { serviceBindings: bindings, localization: structuredClone(localization) })).toBe(first);
    const rebound = session.compile(form, {}, { serviceBindings: defineStudioAsyncServiceBindings([]), localization });
    expect(rebound).not.toBe(first);
    const localized = session.compile(form, {}, { localization: { ...localization, defaultLocale: "de" } });
    expect(localized).not.toBe(rebound);
    const field = form.nodes[toUid("field_title")] as StudioFieldNode;
    const renamed = session.compile({ ...form, nodes: { ...form.nodes, [field.uid]: { ...field, props: { label: "Headline" } } } });
    expect(renamed).not.toBe(localized);
    const fragment = { uid: toUid("fragment"), title: "Fragment", version: 1, parameters: [], rootNodeUids: [], nodes: {} };
    const withFragment = session.compile(form, { [fragment.uid]: fragment });
    expect(session.compile(form, { [fragment.uid]: { ...fragment, version: 2 } })).not.toBe(withFragment);
    const invalid = session.compile({ ...form, rootNodeUids: [toUid("missing")] });
    expect(invalid.diagnostics.length).toBeGreaterThan(0);
    expect(session.compile(form).diagnostics).toEqual([]);
  });
});
