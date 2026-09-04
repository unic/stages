import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { toUid, type StudioFormDocument } from "../../src/document";
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
