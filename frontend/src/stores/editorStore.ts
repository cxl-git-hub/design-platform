/**
 * 编辑器全局状态 (Zustand) — Fabric.js v6
 */
import { create } from 'zustand';
import type { Canvas, Object as FabricObject } from 'fabric';

interface EditorState {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas) => void;

  currentProjectId: number | null;
  setCurrentProjectId: (id: number | null) => void;

  projectName: string;
  setProjectName: (name: string) => void;

  canvasWidth: number;
  canvasHeight: number;
  setCanvasSize: (w: number, h: number) => void;

  selectedObject: FabricObject | null;
  setSelectedObject: (obj: FabricObject | null) => void;

  cutoutSlots: FabricObject[];
  setCutoutSlots: (slots: FabricObject[]) => void;

  referencedAssetIds: number[];
  addReferencedAsset: (id: number) => void;

  activePanel: 'assets' | 'templates' | 'layers' | 'properties';
  setActivePanel: (panel: EditorState['activePanel']) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),

  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  projectName: '未命名项目',
  setProjectName: (name) => set({ projectName: name }),

  canvasWidth: 1080,
  canvasHeight: 1920,
  setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),

  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj }),

  cutoutSlots: [],
  setCutoutSlots: (slots) => set({ cutoutSlots: slots }),

  referencedAssetIds: [],
  addReferencedAsset: (id) =>
    set((s) => ({
      referencedAssetIds: s.referencedAssetIds.includes(id)
        ? s.referencedAssetIds
        : [...s.referencedAssetIds, id],
    })),

  activePanel: 'assets',
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
