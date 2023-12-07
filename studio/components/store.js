import { create } from 'zustand';
import initialConfig from './initialConfig';

const useStagesStore = create((set) => ({
    data: {},
    isEditMode: false,
    selectedElement: '',
    activeContextMenuInput: '',
    clipboard: null,
    currentConfig: initialConfig,
    setEditMode: () => set(() => ({ isEditMode: true })),
    setPreviewMode: () => set(() => ({ isEditMode: false })),
    setData: (data) => set(() => ({ data })),
    setSelectedElement: (selectedElement) => set(() => ({ selectedElement })),
    setActiveContextMenuInput: (activeContextMenuInput) => set(() => ({ activeContextMenuInput })),
    setClipboard: (clipboard) => set(() => ({ clipboard })),
    updateCurrentConfig: (currentConfig) => set(() => ({ currentConfig })),
}));

export default useStagesStore;