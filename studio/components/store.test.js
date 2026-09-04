import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import initialConfig from "./configTemplates/initialConfig";
import useStagesStore from "./store";

const initialState = useStagesStore.getState();

describe("Stages Studio store", () => {
  beforeEach(() => {
    useStagesStore.setState({
      ...initialState,
      currentConfig: initialConfig,
      data: {},
      undoData: [initialConfig],
      activeUndoIndex: 0,
    }, true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("does not notify subscribers for semantically equal form data", () => {
    let updates = 0;
    const unsubscribe = useStagesStore.subscribe(() => { updates += 1; });

    useStagesStore.getState().setData({});
    expect(updates).toBe(0);

    useStagesStore.getState().setData({ username: "Ada" });
    expect(updates).toBe(1);

    useStagesStore.getState().setData({ username: "Ada" });
    expect(updates).toBe(1);
    unsubscribe();
  });

  it("does not persist semantically equal form data", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    useStagesStore.getState().setData({});
    expect(setItem).not.toHaveBeenCalled();

    useStagesStore.getState().setData({ username: "Ada" });
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("updates nested config without mutating the previous state", () => {
    const previousConfig = useStagesStore.getState().currentConfig;
    const previousUsername = previousConfig[1];

    useStagesStore.getState().onUpdateLabel("username", "Full name");

    const nextConfig = useStagesStore.getState().currentConfig;
    expect(previousConfig[1].label).toBe("Username");
    expect(nextConfig[1].label).toBe("Full name");
    expect(nextConfig).not.toBe(previousConfig);
    expect(nextConfig[1]).not.toBe(previousUsername);
  });

  it("does not add duplicate configs to undo history", () => {
    useStagesStore.getState().updateCurrentConfig(structuredClone(initialConfig));

    expect(useStagesStore.getState().undoData).toHaveLength(1);
    expect(useStagesStore.getState().activeUndoIndex).toBe(0);
  });

  it("persists the complete legacy mixed-lifecycle state shape", () => {
    useStagesStore.getState().setData({ username: "Ada" });

    const persisted = JSON.parse(localStorage.getItem("stages-studio-storage-0.1"));
    expect(Object.keys(persisted.state).sort()).toEqual([
      "activeContextMenuInput",
      "activeStep",
      "activeUndoIndex",
      "clipboard",
      "currentConfig",
      "data",
      "editorTabIndex",
      "fieldsets",
      "generalConfig",
      "isEditMode",
      "previewSize",
      "selectedElement",
      "snapshots",
      "undoData",
    ]);
    expect(persisted.state.data).toEqual({ username: "Ada" });
  });

  it("rehydrates the legacy local-storage record", async () => {
    localStorage.setItem("stages-studio-storage-0.1", JSON.stringify({
      state: {
        currentConfig: [{ id: "restored", type: "text" }],
        data: { restored: "yes" },
        selectedElement: "restored",
        previewSize: "mobile",
      },
      version: 0,
    }));

    await useStagesStore.persist.rehydrate();

    expect(useStagesStore.getState()).toMatchObject({
      currentConfig: [{ id: "restored", type: "text" }],
      data: { restored: "yes" },
      selectedElement: "restored",
      previewSize: "mobile",
    });
  });

  it("branches history after undo and retains only the latest 25 configs", () => {
    const store = useStagesStore.getState();
    const second = [{ id: "second", type: "text" }];
    const discarded = [{ id: "discarded", type: "text" }];
    store.updateCurrentConfig(second);
    store.updateCurrentConfig(discarded);
    useStagesStore.getState().undo();
    useStagesStore.getState().updateCurrentConfig([{ id: "branch", type: "text" }]);

    expect(useStagesStore.getState().undoData.map((config) => config[0].id)).toEqual([
      initialConfig[0].id,
      "second",
      "branch",
    ]);

    for (let index = 0; index < 30; index += 1) {
      useStagesStore.getState().updateCurrentConfig([{ id: `revision-${index}`, type: "text" }]);
    }
    const history = useStagesStore.getState().undoData;
    expect(history).toHaveLength(25);
    expect(history[0][0].id).toBe("revision-5");
    expect(history.at(-1)[0].id).toBe("revision-29");
    expect(useStagesStore.getState().activeUndoIndex).toBe(24);
  });

  it("shift-toggles path-based selection and collapses arrays", () => {
    const store = useStagesStore.getState();
    store.setSelectedElement("username");
    useStagesStore.getState().setSelectedElement("passwords.password1", true);
    expect(useStagesStore.getState().selectedElement).toEqual([
      "username",
      "passwords.password1",
    ]);

    useStagesStore.getState().setSelectedElement("username", true);
    expect(useStagesStore.getState().selectedElement).toBe("passwords.password1");
    useStagesStore.getState().removePathFromSelectedElements("passwords.password1");
    expect(useStagesStore.getState().selectedElement).toBe("");
  });

  it("updates fieldset definitions outside current-config history", () => {
    const beforeHistory = useStagesStore.getState().undoData;
    useStagesStore.getState().updateFieldsetConfig(
      [{ id: "passwords", type: "group", fields: [] }],
      "passwords",
    );

    expect(useStagesStore.getState().fieldsets[0].config[0].fields).toEqual([]);
    expect(useStagesStore.getState().undoData).toBe(beforeHistory);
  });
});
