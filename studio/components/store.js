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
  components: "prime",
  date: {
    from: "2024-01-01 00:00:00",
    to: "",
  },
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
      activeUndoIndex: 1,
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
      updateGeneralConfig: (generalConfig) => set(() => ({ generalConfig })),
      setEditMode: () => set(() => ({ isEditMode: true })),
      setEditorTabIndex: (index) => set(() => ({ editorTabIndex: index })),
      setPreviewMode: () => set(() => ({ isEditMode: false })),
      setData: (data) => set(() => ({ data })),
      addSnapshot: () =>
        set(() => ({
          snapshots: [...get().snapshots, get().data],
          editorTabIndex: 2,
        })),
      removeSnapshot: (index) =>
        set(() => ({
          snapshots: get().snapshots.filter((_, i) => i !== index),
        })),
      useSnapshot: (index) => set(() => ({ data: get().snapshots[index] })),
      setUndoData: (undoData) => set(() => ({ undoData })),
      setActiveUndoIndex: (activeUndoIndex) => set(() => ({ activeUndoIndex })),
      switchPreviewSize: (size) => set(() => ({ previewSize: size })),
      undo: () =>
        set((state) => {
          if (state.activeUndoIndex > 0) {
            const newIndex = state.activeUndoIndex - 1;
            const oldConfig = state.undoData[newIndex];
            return { activeUndoIndex: newIndex, currentConfig: oldConfig };
          } else {
            return { activeUndoIndex: 0 };
          }
        }),
      redo: () =>
        set((state) => {
          if (state.activeUndoIndex < state.undoData.length - 1) {
            const newIndex = state.activeUndoIndex + 1;
            const oldConfig = state.undoData[newIndex];
            return { activeUndoIndex: newIndex, currentConfig: oldConfig };
          } else {
            return { activeUndoIndex: state.activeUndoIndex };
          }
        }),
      updateCurrentConfig: (currentConfig) =>
        set((state) => {
          const newUndoData = [...state.undoData];
          if (state.activeUndoIndex < newUndoData.length - 1) {
            newUndoData.splice(state.activeUndoIndex + 1);
          }
          newUndoData.push(currentConfig);
          if (newUndoData.length > 25) newUndoData.shift();
          get().setActiveUndoIndex(newUndoData.length - 1);
          get().setUndoData(newUndoData);
          return { currentConfig };
        }),
      updateFieldsetConfig: (newFieldsetConfig, fieldsetId) =>
        set((state) => {
          const newFieldsets = [...state.fieldsets];
          const index = _.findIndex(newFieldsets, { id: fieldsetId });
          if (index > -1) {
            newFieldsets[index].config = newFieldsetConfig;
          }
          return { fieldsets: newFieldsets };
        }),
      setSelectedElement: (selectedElement, isShiftKey) =>
        set((state) => {
          if (isShiftKey && state.selectedElement) {
            if (Array.isArray(state.selectedElement)) {
              if (state.selectedElement.indexOf(selectedElement) !== -1) {
                return {
                  selectedElement: state.selectedElement.filter(
                    (p) => p !== selectedElement
                  ),
                };
              }
              return {
                selectedElement: [...state.selectedElement, selectedElement],
              };
            }
            return {
              selectedElement: [selectedElement, state.selectedElement],
            };
          } else {
            return { selectedElement };
          }
        }),
      setActiveContextMenuInput: (activeContextMenuInput) =>
        set(() => ({ activeContextMenuInput })),
      setClipboard: (clipboard) => set(() => ({ clipboard })),
      removePathFromSelectedElements: (path) =>
        set((state) => {
          if (Array.isArray(state.selectedElement)) {
            const newElements = state.selectedElement.filter((p) => p !== path);
            if (newElements.length > 1) {
              return { selectedElement: newElements };
            } else {
              return { selectedElement: newElements[0] };
            }
          } else if (path === state.selectedElement) {
            return { selectedElement: "" };
          }
          return { selectedElement: state.selectedElement };
        }),
      addFieldset: (id, label, config, path) =>
        set((state) => {
          const fieldsetIndex = _.findIndex(state.fieldsets, { id: id });
          const newFieldset = { id, label, config, path };
          if (fieldsetIndex === -1) {
            return { fieldsets: [...state.fieldsets, newFieldset] };
          }
          return { fieldsets: state.fieldsets };
        }),
      onChangeBlockWidth: (path, width) =>
        set((state) => {
          const newConfig = [...state.currentConfig];
          const previewSize = get().previewSize;
          _.set(
            newConfig,
            `${getConfigPathFromDataPath(
              path,
              state.currentConfig
            )}.blockWidth.${previewSize}`,
            width === "S" ? "small" : width === "M" ? "medium" : "large"
          );
          return { currentConfig: newConfig };
        }),
      onUpdateLabel: (path, label) =>
        set((state) => {
          const newConfig = [...state.currentConfig];
          _.set(
            newConfig,
            `${getConfigPathFromDataPath(path, state.currentConfig)}.label`,
            label
          );
          return { currentConfig: newConfig };
        }),
      onUpdateSecondaryText: (path, secondaryText) =>
        set((state) => {
          const newConfig = [...state.currentConfig];
          _.set(
            newConfig,
            `${getConfigPathFromDataPath(
              path,
              state.currentConfig
            )}.secondaryText`,
            secondaryText
          );
          return { currentConfig: newConfig };
        }),
      onUpdateTitle: (path, title) =>
        set((state) => {
          const newConfig = [...state.currentConfig];
          _.set(
            newConfig,
            `${getConfigPathFromDataPath(path, state.currentConfig)}.title`,
            title
          );
          return { currentConfig: newConfig };
        }),
      onUpdateText: (path, text) =>
        set((state) => {
          const newConfig = [...state.currentConfig];
          _.set(
            newConfig,
            `${getConfigPathFromDataPath(path, state.currentConfig)}.text`,
            text
          );
          return { currentConfig: newConfig };
        }),
      onUpdateFormTitle: (title) =>
        set((state) => {
          const newGeneralConfig = { ...state.generalConfig };
          newGeneralConfig.title = title;
          return { generalConfig: newGeneralConfig };
        }),
      onUpdatePath: (nonEditablePath, editablePath, newEditablePath) =>
        set((state) => {
          const newConfig = [...state.currentConfig];
          _.set(
            newConfig,
            `${getConfigPathFromDataPath(
              nonEditablePath + editablePath,
              state.currentConfig
            )}.id`,
            newEditablePath
          );
          return { currentConfig: newConfig };
        }),
    }),
    {
      name: "stages-studio-storage-0.1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

export default useStagesStore;
