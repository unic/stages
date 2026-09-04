import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { StudioV1Form } from "./StudioV1Preview";
import useStagesStore from "../store";

const TEXT_CONFIG = [{ id: "name", type: "text", label: "Name" }];

describe("StudioV1Form", () => {
  it("renders a legacy studio field through the shadcn registry and reports edits", async () => {
    const onChange = vi.fn();
    function FormExample() {
      const [value, setValue] = useState({ name: "" });
      return (
        <StudioV1Form
          config={TEXT_CONFIG}
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

  it("does not rehydrate persistence while fields mount or change", async () => {
    const rehydrate = vi.spyOn(useStagesStore.persist, "rehydrate");
    function FormExample() {
      const [value, setValue] = useState({ name: "" });
      return <StudioV1Form config={TEXT_CONFIG} value={value} onChange={setValue} showCompatibilityDiagnostics={false} />;
    }

    render(<FormExample />);
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Ada" } });

    await waitFor(() => expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Ada"));
    expect(rehydrate).not.toHaveBeenCalled();
  });

  it("uses the shadcn submit button in preview mode", () => {
    render(
      <StudioV1Form
        config={TEXT_CONFIG}
        value={{ name: "Ada" }}
        onChange={() => {}}
        showCompatibilityDiagnostics={false}
        showSubmit
      />,
    );

    expect(screen.getByRole("button", { name: "Submit" })).toHaveClass("ui-button--default");
  });
});
