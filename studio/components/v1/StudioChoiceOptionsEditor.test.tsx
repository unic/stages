import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudioChoiceOptionsEditor } from "./StudioChoiceOptionsEditor";

describe("Choice options editor compatibility", () => {
  it("reads existing newline options and rejects duplicate or empty drafts", () => {
    const onChange = vi.fn();
    const view = render(<StudioChoiceOptionsEditor value={"Design\nEngineering"} onChange={onChange} />);
    expect(screen.getByLabelText("Option 1")).toHaveValue("Design");
    fireEvent.change(screen.getByLabelText("Option 2"), { target: { value: "Design" } });
    expect(screen.getByRole("alert")).toHaveTextContent("unique");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Option 2"), { target: { value: "" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Option 2"), { target: { value: "Product" } });
    expect(onChange).toHaveBeenLastCalledWith("Design\nProduct", true);
    view.rerender(<StudioChoiceOptionsEditor value="Restored" onChange={onChange} />);
    expect(screen.getByLabelText("Option 1")).toHaveValue("Restored");
    expect(screen.queryByLabelText("Option 2")).toBeNull();
  });
});
