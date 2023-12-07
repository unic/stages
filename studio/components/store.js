import { create } from 'zustand';
import initialConfig from './initialConfig';

const useStagesStore = create((set) => ({
    data: {},
    isEditMode: false,
    editorTabIndex: 0,
    selectedElement: '',
    activeContextMenuInput: '',
    clipboard: null,
    currentConfig: initialConfig,
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