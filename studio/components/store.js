import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'
import initialConfig from './initialConfig';

const initialGeneralConfig = {
    title: "Demo Form",
    slug: "demo-form", // http://stages.studio/c/stages/f/demo-form
    locales: ["en"],
    status: "draft",
    date: {
        from: "2024-01-01 00:00:00",
        to: ""
    }
};

const useStagesStore = create(persist((set, get) => ({
    data: {},
    isEditMode: false,
    editorTabIndex: 0,
    selectedElement: '',
    activeContextMenuInput: '',
    clipboard: null,
    currentConfig: initialConfig,
    generalConfig: initialGeneralConfig,
    undoData: [JSON.stringify(initialConfig)],
    activeUndoIndex: 1,
    updateGeneralConfig: (generalConfig) => set(() => ({ generalConfig })),
    setEditMode: () => set(() => ({ isEditMode: true })),
    setEditorTabIndex: (index) => set(() => ({ editorTabIndex: index })),
    setPreviewMode: () => set(() => ({ isEditMode: false })),
    setData: (data) => set(() => ({ data })),
    setUndoData: (undoData) => set(() => ({ undoData })),
    setActiveUndoIndex: (activeUndoIndex) => set(() => ({ activeUndoIndex })),
    undo: () => set((state) => {
        console.log("undo", { state });
        if (state.activeUndoIndex > 0) {
            const newIndex = state.activeUndoIndex - 1;
            const oldConfig = JSON.parse(state.undoData[newIndex]);
            return { activeUndoIndex: newIndex, currentConfig: oldConfig };
        } else {
            return { activeUndoIndex: 0 };
        }
    }),
    redo: () => set((state) => {
        console.log("redo", { state });
        if (state.activeUndoIndex < state.undoData.length - 1) {
            const newIndex = state.activeUndoIndex + 1;
            const oldConfig = JSON.parse(state.undoData[newIndex]);
            return { activeUndoIndex: state.activeUndoIndex, currentConfig: oldConfig };
        } else {
            return { activeUndoIndex: state.activeUndoIndex };
        }
    }),
    updateCurrentConfig: (currentConfig) => set((state) => {
        console.log("updateCurrentConfig");
        const newUndoData = [...state.undoData];
        newUndoData.push(JSON.stringify(currentConfig));
        get().setActiveUndoIndex(newUndoData.length - 1);
        get().setUndoData(newUndoData);
        return { currentConfig };
    }),
    setSelectedElement: (selectedElement, isShiftKey) => set((state) => {
        if (isShiftKey && state.selectedElement) {
            if (Array.isArray(state.selectedElement)) {
                if (state.selectedElement.indexOf(selectedElement) !== -1) {
                    return { selectedElement: state.selectedElement.filter(p => p !== selectedElement) };
                }
                return { selectedElement: [...state.selectedElement, selectedElement] };
            }
            return { selectedElement: [selectedElement, state.selectedElement] };
        } else {
            if (state.selectedElement === selectedElement) {
                return { selectedElement: '' };
            }
            return { selectedElement };
        }
    }),
    setActiveContextMenuInput: (activeContextMenuInput) => set(() => ({ activeContextMenuInput })),
    setClipboard: (clipboard) => set(() => ({ clipboard })),
    removePathFromSelectedElements: (path) => set((state) => {
        if (Array.isArray(state.selectedElement)) {
            const newElements = state.selectedElement.filter(p => p !== path);
            if (newElements.length > 1) {
                return { selectedElement: newElements };
            } else {
                return { selectedElement: newElements[0] };
            }
        } else if (path === state.selectedElement) {
            return { selectedElement: '' };
        }
        return { selectedElement: state.selectedElement };
    })
}),
    {
        name: 'stages-studio-storage',
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
    }
));

export default useStagesStore;