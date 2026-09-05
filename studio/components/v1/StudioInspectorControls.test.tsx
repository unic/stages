import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LayoutGrid } from "lucide-react";
import { studioLayout, type StudioLayoutSpec } from "../../src/registry";
import { InspectorSection, StudioLayoutControl } from "./StudioInspectorControls";

describe("Studio layout authoring controls", () => {
  it("edits one breakpoint and property without replacing other responsive settings", async () => {
    const user = userEvent.setup();
    const initial = studioLayout({ width: { mobile: "full", tablet: "third", desktop: "half" }, columns: { mobile: 1, tablet: 2, desktop: 3 }, align: { mobile: "start", tablet: "center", desktop: "end" } });
    const changed = vi.fn();
    function Harness() {
      const [layout, setLayout] = useState<StudioLayoutSpec>(initial);
      return <StudioLayoutControl layout={layout} onChange={(next, breakpoint, property) => { setLayout(next); changed(next, breakpoint, property); }} />;
    }
    render(<Harness />);
    await user.click(screen.getByRole("radio", { name: "Mobile" }));
    expect(changed).not.toHaveBeenCalled();
    await user.click(screen.getByRole("radio", { name: "Quarter width" }));
    expect(changed).toHaveBeenLastCalledWith({ ...initial, width: { ...initial.width, mobile: "quarter" } }, "mobile", "width");
    await user.click(screen.getByRole("radio", { name: "2 columns" }));
    expect(changed.mock.lastCall?.[0].columns).toEqual({ mobile: 2, tablet: 2, desktop: 3 });
    expect(changed.mock.lastCall?.[0].align).toEqual(initial.align);
    await user.click(screen.getByRole("radio", { name: "Tablet" }));
    expect(screen.getByRole("radio", { name: "Third width" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("radio", { name: "Third width" }));
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("supports keyboard selection and reveals collapsed settings", async () => {
    const user = userEvent.setup();
    render(<InspectorSection title="Responsive layout" icon={LayoutGrid} defaultOpen={false}><StudioLayoutControl layout={studioLayout(undefined)} onChange={vi.fn()} /></InspectorSection>);
    await user.tab();
    expect(screen.getByRole("button", { name: "Responsive layout" })).toHaveFocus();
    await user.keyboard("{Enter}");
    const devices = screen.getByRole("radiogroup", { name: "Layout breakpoint" });
    await user.tab();
    expect(screen.getByRole("button", { name: "Help: Responsive layout" })).toHaveFocus();
    await user.tab();
    expect(within(devices).getByRole("radio", { name: "Desktop" })).toHaveFocus();
    await user.keyboard("{ArrowRight} ");
    expect(within(devices).getByRole("radio", { name: "Tablet" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radiogroup", { name: "tablet width" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Responsive layout" }));
    expect(screen.queryByRole("radiogroup", { name: "tablet width" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Responsive layout" }));
    expect(screen.getByRole("radiogroup", { name: "tablet width" })).toBeVisible();
  });
});
