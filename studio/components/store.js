import { create } from 'zustand';
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

const useStagesStore = create((set) => ({
    data: {},
    isEditMode: false,
    editorTabIndex: 0,
    selectedElement: '',
    activeContextMenuInput: '',
    clipboard: null,
    currentConfig: initialConfig,
    generalConfig: initialGeneralConfig,
    updateGeneralConfig: (generalConfig) => set(() => ({ generalConfig })),
    setEditMode: () => set(() => ({ isEditMode: true })),
    setEditorTabIndex: (index) => set(() => ({ editorTabIndex: index })),
    setPreviewMode: () => set(() => ({ isEditMode: false })),
    setData: (data) => set(() => ({ data })),
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
    updateCurrentConfig: (currentConfig) => set(() => ({ currentConfig })),
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
}));

export default useStagesStore;