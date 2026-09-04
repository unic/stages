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
});
