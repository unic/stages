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
    setEditMode: () => set(() => ({ isEditMode: true })),
    setEditorTabIndex: (index) => set(() => ({ editorTabIndex: index })),
    setPreviewMode: () => set(() => ({ isEditMode: false })),
    setData: (data) => set(() => ({ data })),
    setSelectedElement: (selectedElement) => set(() => ({ selectedElement })),
    setActiveContextMenuInput: (activeContextMenuInput) => set(() => ({ activeContextMenuInput })),
    setClipboard: (clipboard) => set(() => ({ clipboard })),
    updateCurrentConfig: (currentConfig) => set(() => ({ currentConfig })),
}));

export default useStagesStore;