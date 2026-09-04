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
