import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudioEditorPage from "./StudioEditorPage";
import useStagesStore from "./store";
import editorConfig from "./configTemplates/initialConfig";

describe("StudioEditorPage interactions", () => {
  beforeEach(() => {
    useStagesStore.setState({
      currentConfig: editorConfig,
      data: {},
      isEditMode: false,
      editorTabIndex: 0,
      selectedElement: "",
      activeContextMenuInput: "",
      undoData: [editorConfig],
      activeUndoIndex: 0,
      previewSize: "desktop",
    });
    vi.spyOn(useStagesStore.persist, "rehydrate").mockResolvedValue(undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("switches to editing, selects a field, and edits its configuration without an update loop", async () => {
    let updates = 0;
    const unsubscribe = useStagesStore.subscribe(() => { updates += 1; });
    const user = userEvent.setup();
    render(<StudioEditorPage />);

    await user.click(screen.getByRole("button", { name: "Switch to editor mode" }));
    const canvasInput = await waitFor(() => {
      const input = document.querySelector('input[name="username"]');
      expect(input).toBeTruthy();
      return input;
    });
    await user.hover(canvasInput);
    await user.click(canvasInput);
    await user.type(canvasInput, "Ada");
    await waitFor(() => expect(useStagesStore.getState().data.username).toBe("Ada"));
    const labelInput = await waitFor(() => {
      const input = document.querySelector('input[name="label"]');
      expect(input).toBeTruthy();
      return input;
    });
    const updatesBeforeTyping = updates;
    await user.clear(labelInput);
    await user.type(labelInput, "Full name");

    await waitFor(() => expect(useStagesStore.getState().currentConfig[1].label).toBe("Full name"));
    expect(updates - updatesBeforeTyping).toBeLessThanOrEqual(10);
    unsubscribe();
  });
});
