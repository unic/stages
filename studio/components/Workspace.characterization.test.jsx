import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import initialConfig from "./configTemplates/initialConfig";
import useStagesStore from "./store";
import Workspace from "./Workspace";

const initialState = useStagesStore.getState();

function resetEditor() {
  useStagesStore.setState({
    ...initialState,
    currentConfig: structuredClone(initialConfig),
    data: {},
    fieldsets: structuredClone(initialState.fieldsets),
    isEditMode: true,
    selectedElement: "",
    undoData: [structuredClone(initialConfig)],
    activeUndoIndex: 0,
  }, true);
}

describe("legacy Workspace structural commands", () => {
  beforeEach(resetEditor);

  function openActionsFor(path) {
    fireEvent.contextMenu(document.querySelector('input[name="username"]'));
    act(() => useStagesStore.getState().setActiveContextMenuInput(path));
  }

  it("inserts a field at a visible insertion slot and selects it", async () => {
    render(<Workspace />);
    openActionsFor("insert > username+");
    await userEvent.click(screen.getByRole("button", { name: "Insert Text Field" }));

    const state = useStagesStore.getState();
    expect(state.currentConfig[2]).toMatchObject({ id: "text", type: "text" });
    expect(state.selectedElement).toBe("text");
    expect(state.undoData).toHaveLength(2);
  });

  it("converts a collection to a group and removes collection-only props", async () => {
    render(<Workspace />);
    openActionsFor("hobbies");
    await userEvent.click(screen.getByRole("button", { name: "Convert to Group" }));

    const hobbies = useStagesStore.getState().currentConfig.find(({ id }) => id === "hobbies");
    expect(hobbies.type).toBe("group");
    expect(hobbies).not.toHaveProperty("init");
    expect(hobbies).not.toHaveProperty("min");
  });

  it("creates the fieldset-ID-as-type encoding emitted by the POC", async () => {
    render(<Workspace />);
    await waitFor(() => expect(document.querySelector('input[name="username"]')).toBeTruthy());
    openActionsFor("username");
    await userEvent.click(screen.getByRole("button", { name: "Create Fieldset" }));

    const state = useStagesStore.getState();
    expect(state.fieldsets.at(-1)).toMatchObject({
      id: "username",
      label: "Username",
      path: "username",
      config: [{ id: "username", type: "text", label: "Username" }],
    });
    expect(state.currentConfig[1]).toEqual({
      id: "username",
      type: "username",
    });
    expect(state.selectedElement).toBe("");
  });
});
