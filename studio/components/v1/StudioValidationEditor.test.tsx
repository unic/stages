import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StudioValidationEditor } from "./StudioValidationEditor";

describe("StudioValidationEditor", () => {
  it("adds a catalog validator and exposes synchronous policy controls", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StudioValidationEditor validators={[]} references={[]} ownerLabel="field" target="text" onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("Validation rule"), "pattern");
    await user.click(screen.getByRole("button", { name: "Add rule" }));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "pattern.1", kind: "pattern", on: ["input", "submit"], revealOn: ["blur", "submit"], severity: "error" }),
    ], "Add pattern validator");
  });

  it("edits event, severity, disabled, dependency, and condition policies", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StudioValidationEditor validators={[{ id: "required.1", kind: "required", message: "Required" }]} references={[]} ownerLabel="field" target="text" onChange={onChange} />);
    await user.click(screen.getByText("Advanced settings"));
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

  it("authors a versioned async service reference without transport configuration", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StudioValidationEditor validators={[]} references={[]} ownerLabel="field" target="text" onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("Validation rule"), "service");
    await user.click(screen.getByRole("button", { name: "Add rule" }));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ kind: "service", service: { key: "availability", version: 1 } }),
    ], "Add service validator");
  });
  it("adds an email preset and resets an incompatible selection when changing fields", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<StudioValidationEditor references={[]} ownerLabel="field" target="email" onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("Validation rule"), "email");
    await user.click(screen.getByRole("button", { name: "Add rule" }));
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ kind: "pattern", code: "email", message: "Enter a valid email address." })], "Add email validator");
    rerender(<StudioValidationEditor references={[]} ownerLabel="field" target="range" onChange={onChange} />);
    expect(screen.queryByRole("option", { name: "Email address" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Range" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add rule" }));
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ kind: "required" })], "Add required validator");
  });

});
