import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { StudioV1Form } from "./StudioV1Preview";

describe("StudioV1Form", () => {
  it("renders a legacy studio field through the shadcn registry and reports edits", async () => {
    const onChange = vi.fn();
    function FormExample() {
      const [value, setValue] = useState({ name: "" });
      return (
        <StudioV1Form
          config={[{ id: "name", type: "text", label: "Name" }]}
          value={value}
          onChange={(nextValue) => { setValue(nextValue); onChange(nextValue); }}
          showCompatibilityDiagnostics={false}
        />
      );
    }
    render(<FormExample />);

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Ada" } });

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ name: "Ada" }));
  });

  it("uses the shadcn submit button in preview mode", () => {
    render(
      <StudioV1Form
        config={[{ id: "name", type: "text", label: "Name" }]}
        value={{ name: "Ada" }}
        onChange={() => {}}
        showCompatibilityDiagnostics={false}
        showSubmit
      />,
    );

    expect(screen.getByRole("button", { name: "Submit" })).toHaveClass("ui-button--default");
  });
});
