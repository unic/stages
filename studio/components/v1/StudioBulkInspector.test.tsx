import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { toUid, type StudioFieldNode } from "../../src/document";
import { StudioBulkInspector } from "./StudioBulkInspector";

const first: StudioFieldNode = { uid: toUid("first"), runtimeId: "first", kind: "field", definition: { key: "text", version: 1 }, props: { label: "First", placeholder: "One", helpText: "First help" }, presentation: { layout: { width: { desktop: "half", mobile: "full", tablet: "third" } } } };
const second: StudioFieldNode = { ...first, uid: toUid("second"), runtimeId: "second", definition: { key: "textarea", version: 1 }, props: { label: "Second", placeholder: "Two", rows: 6 }, presentation: { layout: { width: { desktop: "full", mobile: "half", tablet: "full" } } } };

describe("Shared property editing", () => {
  it("offers only compatible properties, marks mixed values, and preserves each item's other props", async () => {
    const user = userEvent.setup();
    const apply = vi.fn();
    render(<StudioBulkInspector nodes={[first, second]} onApply={apply} />);
    expect(screen.queryByRole("textbox", { name: "Rows" })).toBeNull();
    const placeholder = screen.getByRole("textbox", { name: /Placeholder/ });
    expect(placeholder).toHaveAttribute("placeholder", "Mixed values");
    expect(screen.getByRole("button", { name: "Apply Placeholder to selection" })).toBeDisabled();
    await user.type(placeholder, "Example answer");
    await user.click(screen.getByRole("button", { name: "Apply Placeholder to selection" }));
    expect(apply).toHaveBeenCalledWith([
      { node: first, changes: { props: { ...first.props, placeholder: "Example answer" } } },
      { node: second, changes: { props: { ...second.props, placeholder: "Example answer" } } },
    ], expect.any(String));
  });

  it("changes only the chosen layout property and breakpoint", async () => {
    const user = userEvent.setup();
    const apply = vi.fn();
    render(<StudioBulkInspector nodes={[first, second]} onApply={apply} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Screen size" }), "mobile");
    await user.selectOptions(screen.getByRole("combobox", { name: /Width/ }), "quarter");
    await user.click(screen.getByRole("button", { name: "Apply Width to selection" }));
    const updates = apply.mock.calls[0]![0];
    expect(updates[0].changes.presentation.layout.width).toEqual({ desktop: "half", tablet: "third", mobile: "quarter" });
    expect(updates[1].changes.presentation.layout.width).toEqual({ desktop: "full", tablet: "full", mobile: "quarter" });
  });

  it("validates against every field before applying any changes", async () => {
    const user = userEvent.setup();
    const apply = vi.fn();
    const number: StudioFieldNode = { ...first, definition: { key: "number", version: 1 }, props: { label: "Number" } };
    const slider: StudioFieldNode = { ...second, definition: { key: "range", version: 1 }, props: { label: "Slider", step: 1 } };
    render(<StudioBulkInspector nodes={[number, slider]} onApply={apply} />);
    await user.type(screen.getByRole("textbox", { name: /Step/ }), "0.001");
    await user.click(screen.getByRole("button", { name: "Apply Step to selection" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Slider");
    expect(apply).not.toHaveBeenCalled();
  });
});
