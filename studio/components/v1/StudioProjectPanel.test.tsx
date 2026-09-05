import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { toUid } from "../../src/document";
import { StudioProjectPanel, type StudioProjectPanelProps } from "./StudioProjectPanel";

function props(): StudioProjectPanelProps {
  return {
    projects: [{ uid: toUid("first"), title: "First", revision: 2, updatedAt: "2026-09-05T08:00:00Z" }, { uid: toUid("second"), title: "Second", revision: 1, updatedAt: "2026-09-05T08:00:00Z" }],
    recovery: [], activeUid: toUid("first"), title: "First", legacy: { kind: "absent" }, disabled: false,
    onOpen: vi.fn(), onReload: vi.fn(), onCreate: vi.fn(), onDuplicate: vi.fn(), onRename: vi.fn(), onDelete: vi.fn(), onRestore: vi.fn(), onDiscardRecovery: vi.fn(), onMigrateLegacy: vi.fn(),
  };
}

describe("Studio project drawer", () => {
  it("switches projects through the accessible picker", async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<StudioProjectPanel {...callbacks} />);
    await user.click(screen.getByRole("combobox", { name: "Local project" }));
    await user.click(screen.getByRole("option", { name: "Second · r1" }));
    expect(callbacks.onOpen).toHaveBeenCalledWith("second");
  });

  it("keeps reload and deletion behind explicit confirmation", async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<StudioProjectPanel {...callbacks} />);
    await user.click(screen.getByRole("button", { name: "Project actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Reload saved version…" }));
    expect(callbacks.onReload).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("group", { name: "Confirm project reload" })).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("group", { name: "Confirm project reload" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Project actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete project…" }));
    expect(callbacks.onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(callbacks.onDelete).toHaveBeenCalledOnce();
    expect(callbacks.onReload).not.toHaveBeenCalled();
  });
});
