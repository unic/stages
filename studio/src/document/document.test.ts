import { describe, expect, it } from "vitest";
import projectV0 from "./fixtures/project-v0.json";
import projectV1 from "./fixtures/project-v1.json";
import {
  createUid,
  openStudioProject,
  serializeStudioProject,
  toUid,
  validateStudioProject,
} from "./index";

const definitions = { text: [1] } as const;

function validProject(): Record<string, unknown> {
  return structuredClone(projectV1) as Record<string, unknown>;
}

function expectCode(input: unknown, code: string, options = {}): void {
  const result = validateStudioProject(input, { supportedDefinitions: definitions, ...options });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.diagnostics.map((entry) => entry.code)).toContain(code);
}

describe("Studio document UIDs", () => {
  it("brands safe injected IDs and rejects unsafe keys", () => {
    expect(createUid(() => "field_01")).toBe("field_01");
    expect(() => toUid("__proto__")).toThrow(TypeError);
    expect(() => toUid("contains spaces")).toThrow(TypeError);
  });
});

describe("Studio document validation", () => {
  it("returns a detached, deeply frozen v1 value", () => {
    const input = validProject();
    const before = structuredClone(input);
    const result = validateStudioProject(input, { supportedDefinitions: definitions });
    expect(result.ok).toBe(true);
    expect(input).toEqual(before);
    if (result.ok) {
      expect(result.value).not.toBe(input);
      expect(Object.isFrozen(result.value)).toBe(true);
      expect(Object.isFrozen(result.value.forms[toUid("form_event")]?.nodes)).toBe(true);
    }
  });

  it("reports unsafe keys with their exact property path", () => {
    const input = JSON.parse('{"format":"stages-studio","formatVersion":1,"__proto__":{}}') as unknown;
    const result = validateStudioProject(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: "document.unsafe-key",
      propertyPath: ["__proto__"],
    }));
  });

  it("rejects non-JSON values and object cycles before structural processing", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic["self"] = cyclic;
    expectCode(cyclic, "document.object-cycle");
    expectCode({ value: Number.POSITIVE_INFINITY }, "document.non-finite-number");
    expectCode({ value: undefined }, "document.non-json-value");
  });

  it("rejects duplicate UIDs, broken references, graph cycles, and unreachable nodes", () => {
    const duplicate = validProject();
    const duplicateForm = (duplicate["forms"] as Record<string, Record<string, unknown>>)["form_event"]!;
    duplicateForm["scenarios"] = [{ uid: "field_title", title: "Duplicate", value: {} }];
    expectCode(duplicate, "document.duplicate-uid");

    const missing = validProject();
    const missingForm = (missing["forms"] as Record<string, Record<string, unknown>>)["form_event"]!;
    missingForm["rootNodeUids"] = ["missing"];
    expectCode(missing, "document.missing-node-reference");
    expectCode(missing, "document.unreachable-node");

    const cyclic = validProject();
    const nodes = ((cyclic["forms"] as Record<string, Record<string, unknown>>)["form_event"]!["nodes"] as Record<string, Record<string, unknown>>);
    nodes["field_title"] = { uid: "field_title", kind: "group", runtimeId: "title", childUids: ["group_event"] };
    expectCode(cyclic, "document.node-cycle");
  });

  it("validates linked fragment resources, references, and dependency cycles", () => {
    const input = validProject();
    const forms = input["forms"] as Record<string, Record<string, unknown>>;
    const form = forms["form_event"]!;
    form["rootNodeUids"] = ["fragment_instance"];
    form["nodes"] = {
      fragment_instance: { uid: "fragment_instance", kind: "fragment", runtimeId: "billing", fragmentUid: "fragment_address" },
    };
    input["fragments"] = {
      fragment_address: {
        uid: "fragment_address", title: "Address", version: 1, parameters: [],
        rootNodeUids: ["fragment_street"],
        nodes: { fragment_street: { uid: "fragment_street", kind: "field", runtimeId: "street", definition: { key: "text", version: 1 }, props: {} } },
      },
    };
    expect(validateStudioProject(input, { supportedDefinitions: definitions }).ok).toBe(true);

    (form["nodes"] as Record<string, Record<string, unknown>>)["fragment_instance"]!["fragmentUid"] = "fragment_missing";
    expectCode(input, "document.unresolved-fragment");

    (form["nodes"] as Record<string, Record<string, unknown>>)["fragment_instance"]!["fragmentUid"] = "fragment_address";
    const fragment = (input["fragments"] as Record<string, Record<string, unknown>>)["fragment_address"]!;
    fragment["rootNodeUids"] = ["fragment_recursive"];
    fragment["nodes"] = { fragment_recursive: { uid: "fragment_recursive", kind: "fragment", runtimeId: "recursive", fragmentUid: "fragment_address" } };
    expectCode(input, "document.fragment-cycle");
  });

  it("enforces depth, node, scenario, byte, and definition-version limits", () => {
    expectCode(validProject(), "document.form-node-limit", { limits: { maxNodesPerForm: 1 } });
    expectCode(validProject(), "document.project-node-limit", { limits: { maxNodesPerProject: 1 } });
    expectCode(validProject(), "document.depth-limit", { limits: { maxDepth: 1 } });
    expectCode(validProject(), "document.json-depth-limit", { limits: { maxJsonDepth: 2 } });
    expectCode(validProject(), "document.scenario-limit", { limits: { maxScenariosPerForm: -1 } });
    expectCode(validProject(), "document.size-limit", { limits: { maxBytes: 10 } });
    expectCode(validProject(), "document.unsupported-definition-version", {
      supportedDefinitions: { text: [2] },
    });
    const noRegistry = validateStudioProject(validProject());
    expect(noRegistry.ok).toBe(false);
    if (!noRegistry.ok) expect(noRegistry.diagnostics.map((entry) => entry.code))
      .toContain("document.unsupported-definition-version");
  });

  it("rejects executable-shaped behavior instead of treating it as an expression", () => {
    const input = validProject();
    const form = (input["forms"] as Record<string, Record<string, unknown>>)["form_event"]!;
    const nodes = form["nodes"] as Record<string, Record<string, unknown>>;
    nodes["field_title"]!["computed"] = { kind: "call", callee: "alert", arguments: [1] };
    expectCode(input, "document.invalid-expression");
  });

  it("validates dynamic presence and derived-property expression maps", () => {
    const invalidPresence = validProject();
    const presenceNodes = ((invalidPresence["forms"] as Record<string, Record<string, unknown>>)["form_event"]!["nodes"] as Record<string, Record<string, unknown>>);
    presenceNodes["field_title"]!["behavior"] = { presentWhen: { kind: "call", source: "feature()" } };
    expectCode(invalidPresence, "document.invalid-expression");

    const invalidDerived = validProject();
    const derivedNodes = ((invalidDerived["forms"] as Record<string, Record<string, unknown>>)["form_event"]!["nodes"] as Record<string, Record<string, unknown>>);
    derivedNodes["field_title"]!["derivedProps"] = [];
    expectCode(invalidDerived, "document.invalid-derived-props");
  });

  it("validates discriminated collection and wizard structural references", () => {
    const input = validProject();
    const form = (input["forms"] as Record<string, Record<string, unknown>>)["form_event"]!;
    form["rootNodeUids"] = ["collection_contacts", "wizard_flow"];
    form["nodes"] = {
      collection_contacts: { uid: "collection_contacts", kind: "collection", runtimeId: "contacts", discriminator: "kind", variantUids: ["variant_person"], initialRows: 1 },
      variant_person: { uid: "variant_person", kind: "variant", runtimeId: "person", childUids: [] },
      wizard_flow: { uid: "wizard_flow", kind: "wizard", runtimeId: "flow", stageUids: ["stage_intro"], initialStageUid: "stage_missing", navigation: { nonLinear: "yes" } },
      stage_intro: { uid: "stage_intro", kind: "stage", runtimeId: "intro", childUids: [] },
    };
    expectCode(input, "document.missing-initial-variant");
    expectCode(input, "document.invalid-initial-stage");
    expectCode(input, "document.invalid-navigation");

    const misplaced = validProject();
    const misplacedForm = (misplaced["forms"] as Record<string, Record<string, unknown>>)["form_event"]!;
    misplacedForm["rootNodeUids"] = ["stage_root"];
    misplacedForm["nodes"] = { stage_root: { uid: "stage_root", kind: "stage", runtimeId: "root", childUids: [] } };
    expectCode(misplaced, "document.invalid-node-placement");
  });
});

describe("Studio project migrations and serialization", () => {
  it("migrates the golden v0 fixture to v1 without mutating its input", () => {
    const input = structuredClone(projectV0);
    const before = structuredClone(input);
    const result = openStudioProject(input, { supportedDefinitions: definitions });
    expect(input).toEqual(before);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.migrations).toEqual(["studio-project-0-to-1"]);
      expect(result.value).toEqual(projectV1);
    }
  });

  it("round-trips through stable canonical JSON", () => {
    const opened = openStudioProject(JSON.stringify(projectV1), { supportedDefinitions: definitions });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    const first = serializeStudioProject(opened.value);
    const reopened = openStudioProject(first, { supportedDefinitions: definitions });
    expect(reopened.ok).toBe(true);
    if (reopened.ok) expect(serializeStudioProject(reopened.value)).toBe(first);
  });

  it("rejects malformed JSON and versions without a complete ordered chain", () => {
    expect(openStudioProject("{").ok).toBe(false);
    const future = { ...projectV1, formatVersion: 2 };
    const result = openStudioProject(future, { supportedDefinitions: definitions });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics[0]?.code).toBe("document.unsupported-format-version");
  });
});
