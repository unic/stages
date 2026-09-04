import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StudioValidationEditor } from "./StudioValidationEditor";

describe("StudioValidationEditor", () => {
  it("adds a catalog validator and exposes synchronous policy controls", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StudioValidationEditor validators={[]} references={[]} ownerLabel="form" onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("Validator catalog"), "pattern");
    await user.click(screen.getByRole("button", { name: "Add validator" }));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "pattern.1", kind: "pattern", on: ["input", "submit"], revealOn: ["blur", "submit"], severity: "error" }),
    ], "Add pattern validator");
  });

  it("edits event, severity, disabled, dependency, and condition policies", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StudioValidationEditor validators={[{ id: "required.1", kind: "required", message: "Required" }]} references={[]} ownerLabel="field" onChange={onChange} />);
    await user.type(screen.getByLabelText("Run on events"), "submit");
    await user.selectOptions(screen.getByLabelText("Severity"), "warning");
    await user.click(screen.getByLabelText("Include disabled owner"));
    await user.type(screen.getByLabelText("Dependencies (one absolute path per line)"), "account.plan");
    await user.click(screen.getByLabelText("Conditional applicability"));
    expect(onChange).toHaveBeenCalledWith(expect.any(Array), expect.stringMatching(/^Edit validator/));
    expect(onChange).toHaveBeenCalledWith(expect.any(Array), "Edit disabled validation policy");
    expect(onChange).toHaveBeenCalledWith(expect.any(Array), "Edit validator dependencies");
    expect(onChange).toHaveBeenCalledWith(expect.any(Array), "Edit validator condition");
  });
});
