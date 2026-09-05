import { useState } from "react";
import { createStudioHistory, dispatchStudioCommand, redoStudioHistory, undoStudioHistory } from "../../src/commands";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { serializeStudioProject, toUid, validateStudioProject, type StudioFieldNode, type StudioFormDocument, type StudioProjectDocument } from "../../src/document";
import { StudioEventEditor, StudioLogicEditor } from "./StudioLogicEditor";

const fieldUid = toUid("field_logic");
const form: StudioFormDocument = {
  uid: toUid("form_logic"),
  title: "Logic",
  runtime: { schemaId: "logic", schemaVersion: 1 },
  rootNodeUids: [fieldUid],
  nodes: {
    [fieldUid]: { uid: fieldUid, kind: "field", runtimeId: "amount", definition: { key: "number", version: 1 }, props: { label: "Amount" } },
  },
  scenarios: [],
  settings: {},
};

function PersistedLogicEditor({ kind }: { readonly kind: "transform" | "reducer" }) {
  const [history, setHistory] = useState(() => createStudioHistory({
    format: "stages-studio", formatVersion: 1,
    project: { uid: toUid("project_logic"), title: "Logic", defaultLocale: "en" },
    forms: { [form.uid]: form }, fragments: {}, resources: {},
  }));
  const currentForm = history.present.forms[form.uid]!;
  const node = currentForm.nodes[fieldUid] as StudioFieldNode;
  const property = kind === "transform" ? "transforms" : "reducers";
  return <>
    <StudioLogicEditor kind={kind} rules={node[property]} form={currentForm} references={[]} onChange={(rules, label) => {
      const result = dispatchStudioCommand(history, { type: "node.update", formUid: form.uid, uid: fieldUid, changes: { [property]: rules } }, { label });
      if (!result.ok) throw new Error(result.failure.message);
      setHistory(result.history);
    }} />
    <button onClick={() => setHistory(undoStudioHistory(history))}>Undo</button>
    <button onClick={() => setHistory(redoStudioHistory(history))}>Redo</button>
    <output aria-label="Saved project">{serializeStudioProject(history.present)}</output>
  </>;
}

describe("Studio logic authoring", () => {
  it("adds a field reducer with event-payload and current-target defaults", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StudioLogicEditor kind="reducer" rules={[]} form={form} references={[]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Add reducer" }));
    expect(onChange).toHaveBeenCalledWith([{
      id: "reducer_1",
      on: "input",
      actions: [{ op: "set", target: { kind: "event-target" }, value: { kind: "reference", scope: "event", path: ["payload"] } }],
    }], "Add reducer");
  });

  it.each(["transform", "reducer"] as const)("adds, edits, removes, and restores a persisted %s", async (kind) => {
    const user = userEvent.setup();
    render(<PersistedLogicEditor kind={kind} />);
    await user.click(screen.getByRole("button", { name: `Add ${kind}` }));
    expect(screen.getByLabelText("Rule ID")).toHaveValue(`${kind}_1`);
    await user.clear(screen.getByLabelText("Event name"));
    await user.type(screen.getByLabelText("Event name"), "blur");
    const saved = JSON.parse(screen.getByLabelText("Saved project").textContent!) as StudioProjectDocument;
    expect(validateStudioProject(saved, { supportedDefinitions: { number: [1] } }).ok).toBe(true);
    const node = saved.forms[form.uid]!.nodes[fieldUid] as StudioFieldNode;
    expect(node[kind === "transform" ? "transforms" : "reducers"]).toMatchObject([{ id: `${kind}_1`, on: "blur" }]);
    await user.click(screen.getByRole("button", { name: `Remove ${kind}` }));
    expect(screen.queryByLabelText("Rule ID")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByLabelText("Event name")).toHaveValue("blur");
    await user.click(screen.getByRole("button", { name: "Redo" }));
    expect(screen.queryByLabelText("Rule ID")).not.toBeInTheDocument();
  });

  it("adds a named form event and offers compiled node targets", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<StudioEventEditor events={[]} form={form} references={[]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Add event" }));
    const event = { id: "event_1", title: "Custom action", name: "custom:action", target: { kind: "form" as const }, source: "user" as const };
    expect(onChange).toHaveBeenCalledWith([event], "Add event definition");
    rerender(<StudioEventEditor events={[event]} form={form} references={[]} onChange={onChange} />);
    expect(screen.getByRole("option", { name: "amount" })).toHaveValue(fieldUid);
    await user.selectOptions(screen.getByLabelText("Target"), fieldUid);
    expect(onChange).toHaveBeenLastCalledWith([{ ...event, target: { kind: "node", uid: fieldUid } }], "Edit event definition");
  });
});
