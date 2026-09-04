import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import initialConfig from "./configTemplates/initialConfig";
import _ from "lodash";
import { getConfigPathFromDataPath } from "./helpers";

const initialGeneralConfig = {
  title: "Demo Form",
  slug: "demo-form", // http://stages.studio/c/stages/f/demo-form
  locales: ["EN"],
  status: "draft",
  components: "shadcn",
  date: {
    from: "2024-01-01 00:00:00",
    to: "",
  },
};

const updateConfigProperty = (config, dataPath, property, value) => {
  const configPath = `${getConfigPathFromDataPath(dataPath, config)}.${property}`;
  if (_.get(config, configPath) === value) return null;
  const nextConfig = _.cloneDeep(config);
  _.set(nextConfig, configPath, value);
  return nextConfig;
};

const useStagesStore = create(
  persist(
    (set, get) => ({
      data: {},
      snapshots: [],
      isEditMode: false,
      editorTabIndex: 0,
      selectedElement: "",
      activeContextMenuInput: "",
      clipboard: null,
      currentConfig: initialConfig,
      generalConfig: initialGeneralConfig,
      activeStep: 0,
      undoData: [initialConfig],
      activeUndoIndex: 0,
      previewSize: "desktop",
      fieldsets: [
        {
          id: "passwords",
          label: "Passwords",
          config: [
            {
              id: "passwords",
              type: "group",
              label: "Passwords",
              secondaryText: "Must be at least 8 characters.",
              fields: [
                {
                  id: "password1",
                  label: "Password",
                  type: "password",
                  isRequired: true,
                },
                {
                  id: "password2",
                  label: "Repeat Password",
                  type: "password",
                  isRequired: true,
                },
              ],
            },
          ],
        },
      ],
      updateGeneralConfig: (generalConfig) => {
        if (_.isEqual(get().generalConfig, generalConfig)) return;
        set({ generalConfig });
      },
      setEditMode: () => {
        if (get().isEditMode) return;
        set({ isEditMode: true });
      },
      setEditorTabIndex: (index) => {
        if (get().editorTabIndex === index) return;
        set({ editorTabIndex: index });
      },
      setPreviewMode: () => {
        if (!get().isEditMode) return;
        set({ isEditMode: false });
      },
      setData: (data) => {
        if (_.isEqual(get().data, data)) return;
        set({ data });
      },
      addSnapshot: () =>
        set(() => ({
          snapshots: [...get().snapshots, get().data],
          editorTabIndex: 2,
        })),
      removeSnapshot: (index) => {
        const snapshots = get().snapshots;
        if (index < 0 || index >= snapshots.length) return;
        set({ snapshots: snapshots.filter((_, itemIndex) => itemIndex !== index) });
      },
      useSnapshot: (index) => {
        const state = get();
        const data = state.snapshots[index];
        if (data === undefined || _.isEqual(state.data, data)) return;
        set({ data });
      },
      setUndoData: (undoData) => {
        if (_.isEqual(get().undoData, undoData)) return;
        set({ undoData });
      },
      setActiveUndoIndex: (activeUndoIndex) => {
        if (get().activeUndoIndex === activeUndoIndex) return;
        set({ activeUndoIndex });
      },
      switchPreviewSize: (size) => {
        if (get().previewSize === size) return;
        set({ previewSize: size });
      },
      undo: () => {
        const state = get();
        if (state.activeUndoIndex <= 0) return;
        const activeUndoIndex = state.activeUndoIndex - 1;
        set({
          activeUndoIndex,
          currentConfig: state.undoData[activeUndoIndex],
        });
      },
      redo: () => {
        const state = get();
        if (state.activeUndoIndex >= state.undoData.length - 1) return;
        const activeUndoIndex = state.activeUndoIndex + 1;
        set({
          activeUndoIndex,
          currentConfig: state.undoData[activeUndoIndex],
        });
      },
      updateCurrentConfig: (currentConfig) => {
        const state = get();
        if (_.isEqual(state.currentConfig, currentConfig)) return;
        const newUndoData = [...state.undoData];
        if (state.activeUndoIndex < newUndoData.length - 1) {
          newUndoData.splice(state.activeUndoIndex + 1);
        }
        newUndoData.push(currentConfig);
        if (newUndoData.length > 25) newUndoData.shift();
        set({
          currentConfig,
          undoData: newUndoData,
          activeUndoIndex: newUndoData.length - 1,
        });
      },
      updateFieldsetConfig: (newFieldsetConfig, fieldsetId) => {
        const fieldsets = get().fieldsets;
        const index = _.findIndex(fieldsets, { id: fieldsetId });
        if (
          index === -1 ||
          _.isEqual(fieldsets[index].config, newFieldsetConfig)
        ) return;
        set({
          fieldsets: fieldsets.map((fieldset) =>
            fieldset.id === fieldsetId
              ? { ...fieldset, config: newFieldsetConfig }
              : fieldset
          ),
        });
      },
      setSelectedElement: (selectedElement, isShiftKey) => {
        if (!isShiftKey && Object.is(get().selectedElement, selectedElement)) {
          return;
        }
        set((state) => {
          if (isShiftKey && state.selectedElement) {
            if (Array.isArray(state.selectedElement)) {
              if (state.selectedElement.indexOf(selectedElement) !== -1) {
                const remaining = state.selectedElement.filter(
                  (path) => path !== selectedElement
                );
                return {
                  selectedElement: remaining.length === 0
                    ? ""
                    : remaining.length === 1
                      ? remaining[0]
                      : remaining,
                };
              }
              return {
                selectedElement: [...state.selectedElement, selectedElement],
              };
            }
            if (state.selectedElement === selectedElement) {
              return { selectedElement: "" };
            }
            return {
              selectedElement: [state.selectedElement, selectedElement],
            };
          }
          return { selectedElement };
        });
      },
      setActiveContextMenuInput: (activeContextMenuInput) => {
        if (get().activeContextMenuInput === activeContextMenuInput) return;
        set({ activeContextMenuInput });
      },
      setClipboard: (clipboard) => {
        if (_.isEqual(get().clipboard, clipboard)) return;
        set({ clipboard });
      },
      removePathFromSelectedElements: (path) => {
        const selectedElement = get().selectedElement;
        if (Array.isArray(selectedElement)) {
          if (!selectedElement.includes(path)) return;
          const remaining = selectedElement.filter((item) => item !== path);
          set({
            selectedElement: remaining.length === 0
              ? ""
              : remaining.length === 1
                ? remaining[0]
                : remaining,
          });
          return;
        }
        if (path === selectedElement) set({ selectedElement: "" });
      },
      addFieldset: (id, label, config, path) => {
        const fieldsets = get().fieldsets;
        if (_.findIndex(fieldsets, { id }) !== -1) return;
        set({ fieldsets: [...fieldsets, { id, label, config, path }] });
      },
      onChangeBlockWidth: (path, width) => {
        const state = get();
        const configPath = getConfigPathFromDataPath(path, state.currentConfig);
        const nextWidth =
          width === "S" ? "small" : width === "M" ? "medium" : "large";
        const widthPath = `${configPath}.blockWidth.${state.previewSize}`;
        if (_.get(state.currentConfig, widthPath) === nextWidth) return;
        const currentConfig = _.cloneDeep(state.currentConfig);
        _.set(currentConfig, widthPath, nextWidth);
        set({ currentConfig });
      },
      onUpdateLabel: (path, label) => {
        const currentConfig = updateConfigProperty(get().currentConfig, path, "label", label);
        if (currentConfig) set({ currentConfig });
      },
      onUpdateSecondaryText: (path, secondaryText) => {
        const currentConfig = updateConfigProperty(
          get().currentConfig,
          path,
          "secondaryText",
          secondaryText
        );
        if (currentConfig) set({ currentConfig });
      },
      onUpdateTitle: (path, title) => {
        const currentConfig = updateConfigProperty(get().currentConfig, path, "title", title);
        if (currentConfig) set({ currentConfig });
      },
      onUpdateText: (path, text) => {
        const currentConfig = updateConfigProperty(get().currentConfig, path, "text", text);
        if (currentConfig) set({ currentConfig });
      },
      onUpdateFormTitle: (title) => {
        const generalConfig = get().generalConfig;
        if (generalConfig.title === title) return;
        set({ generalConfig: { ...generalConfig, title } });
      },
      onUpdatePath: (nonEditablePath, editablePath, newEditablePath) => {
        if (editablePath === newEditablePath) return;
        const state = get();
        const currentConfig = _.cloneDeep(state.currentConfig);
        _.set(
          currentConfig,
          `${getConfigPathFromDataPath(
            nonEditablePath + editablePath,
            state.currentConfig
          )}.id`,
          newEditablePath
        );
        set({ currentConfig });
      },
    }),
    {
      name: "stages-studio-storage-0.1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

export default useStagesStore;
