import { describe, expect, it } from "vitest";
import {
  legacyFieldsetFixtures,
  legacyTemplateFixtures,
} from "../../components/configTemplates/legacyFixtures";
import { toUid } from "../document";
import { importLegacyStudioProject } from "./importer";
import type { LegacyStudioInput } from "./types";

const fieldTypes = [
  "buttons", "calendar", "checkbox", "chips", "color", "editor", "mask",
  "multiselect", "number", "password", "rating", "select", "slider", "switch",
  "text", "textarea", "toggle",
] as const;

describe("legacy Studio project importer", () => {
  it("imports every frozen POC template without mutation", () => {
    for (const [name, config] of Object.entries(legacyTemplateFixtures)) {
      const before = structuredClone(config);
      const result = importLegacyStudioProject(
        { config, generalConfig: { title: name, slug: name, locales: ["EN"], status: "draft" } },
        { fieldTypes },
      );
      expect(result.ok, name).toBe(true);
      expect(config, name).toEqual(before);
      expect(Object.isFrozen(config), name).toBe(true);
      if (result.ok) {
        expect(result.value.project.title).toBe(name);
        expect(result.value.project.defaultLocale).toBe("en");
        expect(Object.isFrozen(result.value), name).toBe(true);
      }
    }
  });

  it("accepts explicit and POC-type fieldset encodings", () => {
    for (const [encoding, fixture] of Object.entries(legacyFieldsetFixtures)) {
      const result = importLegacyStudioProject(fixture as LegacyStudioInput, { fieldTypes });
      expect(result.ok, encoding).toBe(true);
      if (!result.ok) continue;
      const form = result.value.forms[toUid("legacy_form")]!;
      const root = form.nodes[form.rootNodeUids[0]!]!;
      expect(root.kind).toBe("fragment");
      expect(root.legacy).toEqual(expect.objectContaining({
        fieldsetId: "address",
        fieldsetEncoding: encoding === "explicit" ? "explicit" : "poc-type",
      }));
      if (root.kind === "fragment") {
        const fragment = result.value.fragments[root.fragmentUid];
        expect(fragment?.rootNodeUids).toHaveLength(1);
        expect(Object.values(fragment?.nodes ?? {})).toEqual(expect.arrayContaining([
          expect.objectContaining({ kind: "field" }),
        ]));
      }
    }
  });

  it("maps layout, props, required rules, visibility, and computed values", () => {
    const result = importLegacyStudioProject({ config: [{
      id: "total",
      type: "number",
      label: "Total",
      blockWidth: { desktop: "medium" },
      placeholder: "0",
      isRequired: true,
      isDisabled: true,
      isRendered: "!!interfaceState.showTotal",
      computedValue: "data.a + data.b",
    }] }, { fieldTypes });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const form = result.value.forms[toUid("legacy_form")]!;
    const node = form.nodes[form.rootNodeUids[0]!]!;
    expect(node.presentation).toEqual({ label: "Total", blockWidth: { desktop: "medium" } });
    expect(node.behavior).toEqual(expect.objectContaining({ disabled: true }));
    expect(node.behavior?.when).toEqual(expect.objectContaining({ kind: "unary" }));
    expect(node.kind).toBe("field");
    if (node.kind === "field") {
      expect(node.props).toEqual({
        label: "Total",
        blockWidth: { desktop: "medium" },
        placeholder: "0",
        isRequired: true,
      });
      expect(node.validators?.[0]).toEqual({ kind: "required", message: "Total is required." });
      expect(node.computed).toEqual(expect.objectContaining({ kind: "binary", operator: "+" }));
    }
  });

  it("normalizes migrated legacy field aliases at the import boundary", () => {
    const result = importLegacyStudioProject({ config: [
      { id: "meal", type: "select", label: "Meal" },
      { id: "arrival", type: "calendar", label: "Arrival" },
    ] }, {
      fieldTypes: ["select", "calendar"],
      fieldDefinitionAliases: {
        select: { key: "choice", version: 1 },
        calendar: { key: "date", version: 1 },
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const form = result.value.forms[toUid("legacy_form")]!;
    expect(form.rootNodeUids.map((uid) => {
      const node = form.nodes[uid];
      return node?.kind === "field" ? node.definition : undefined;
    })).toEqual([
      { key: "choice", version: 1 },
      { key: "date", version: 1 },
    ]);
  });

  it("retains unsupported expression source inertly and never executes it", () => {
    let calls = 0;
    const source = () => { calls += 1; return true; };
    const result = importLegacyStudioProject({ config: [{
      id: "unsafe",
      type: "text",
      isRendered: source,
      computedValue: "service.lookup(data.value)",
    }] }, { fieldTypes });
    expect(calls).toBe(0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.diagnostics.filter((entry) => entry.code === "legacy.expression.unsupported")).toHaveLength(2);
    const form = result.value.forms[toUid("legacy_form")]!;
    const node = form.nodes[form.rootNodeUids[0]!]!;
    expect(node.legacy?.["unsupportedExpressions"]).toEqual([
      { property: "isRendered", source: String(source) },
      { property: "computedValue", source: "service.lookup(data.value)" },
    ]);
  });

  it("imports metadata and initial data into separate project and scenario state", () => {
    const result = importLegacyStudioProject({
      config: [],
      generalConfig: { title: "Demo", slug: "demo", locales: ["DE"], status: "published" },
      value: { name: "Ada" },
    }, { fieldTypes, projectUid: toUid("project_demo"), formUid: toUid("form_demo") });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.project).toEqual({ uid: "project_demo", title: "Demo", defaultLocale: "de" });
    expect(result.value.forms[toUid("form_demo")]?.settings).toEqual({
      legacyFormMetadata: { title: "Demo", slug: "demo", locales: ["DE"], status: "published" },
    });
    expect(result.value.forms[toUid("form_demo")]?.scenarios[0]?.value).toEqual({ name: "Ada" });
  });
});
