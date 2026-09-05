import { describe, expect, it } from "vitest";
import projectV1 from "../document/fixtures/project-v1.json";
import { toUid, type StudioFieldNode, type StudioProjectDocument } from "../document";
import { defineStudioAsyncServiceBindings } from "../registry";
import { createStudioCompilerSession } from "./session";

const project = projectV1 as unknown as StudioProjectDocument;
const form = project.forms[toUid("form_event")]!;

describe("Studio compiler session", () => {
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
