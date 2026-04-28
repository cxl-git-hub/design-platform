/**
 * Fabric.js v6 画布组件 — 完整版
 * 增加: 历史管理器(撤销/重做)、本地图片拖拽
 */
import { useEffect, useRef, useCallback } from 'react';
import { Canvas, Rect, IText, Image as FabricImage, FabricObject } from 'fabric';
import { useEditorStore } from '../../stores/editorStore';
import { CanvasHistory } from '../../stores/canvasHistory';
import AICutoutButton from '../AICutout/AICutoutButton';

// ★ 注册自定义属性 (v6 方式: 通过 FabricObject.customProperties)
FabricObject.customProperties = [
  ...(FabricObject.customProperties || []),
  'id', 'name', 'isAiCutoutSlot', 'cutoutPlaceholder',
];

// 全局 history 引用 (供 TopBar 调用)
let historyInstance: CanvasHistory | null = null;
export function getCanvasHistory() { return historyInstance; }

export default function DesignCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const {
    canvasWidth,
    canvasHeight,
    setCanvas,
    setSelectedObject,
    setCutoutSlots,
  } = useEditorStore();

  // 初始化
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const fc = new Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = fc;
    setCanvas(fc);

    // ★ 初始化历史管理器
    historyInstance = new CanvasHistory(fc);

    // 事件
    fc.on('selection:created', (e: any) => setSelectedObject(e.selected?.[0] || null));
    fc.on('selection:updated', (e: any) => setSelectedObject(e.selected?.[0] || null));
    fc.on('selection:cleared', () => setSelectedObject(null));

    // 键盘快捷键
    const handleKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Delete 删除选中
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = fc.getActiveObject();
        if (active && !(active as any).isEditing) {
          fc.remove(active);
          fc.discardActiveObject();
          fc.requestRenderAll();
        }
      }

      // Ctrl+Z 撤销
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        await historyInstance?.undo();
      }

      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        await historyInstance?.redo();
      }

      // Ctrl+C 复制
      if (e.ctrlKey && e.key === 'c') {
        const active = fc.getActiveObject();
        if (active) {
          active.clone(['id', 'name', 'isAiCutoutSlot', 'cutoutPlaceholder']).then((cloned: any) => {
            cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
            fc.add(cloned);
            fc.setActiveObject(cloned);
            fc.requestRenderAll();
          });
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      historyInstance?.destroy();
      historyInstance = null;
      fc.dispose();
      fabricRef.current = null;
    };
  }, []);

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.setDimensions({ width: canvasWidth, height: canvasHeight });
    fc.requestRenderAll();
  }, [canvasWidth, canvasHeight]);

  // 拖拽素材
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    containerRef.current?.classList.add('drop-zone-active');
  }, []);

  const handleDragLeave = useCallback(() => {
    containerRef.current?.classList.remove('drop-zone-active');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    containerRef.current?.classList.remove('drop-zone-active');

    const fc = fabricRef.current;
    if (!fc) return;

    // 从素材面板拖入
    const assetData = e.dataTransfer.getData('application/json');
    if (assetData) {
      const asset = JSON.parse(assetData);
      const pointer = fc.getScenePoint(e.nativeEvent);
      if (asset.type === 'image') {
        FabricImage.fromURL(`/static/${asset.file_path}`).then((img) => {
          img.set({
            left: pointer.x - (img.width || 0) / 2,
            top: pointer.y - (img.height || 0) / 2,
            scaleX: Math.min(300 / (img.width || 1), 1),
            scaleY: Math.min(300 / (img.height || 1), 1),
          });
          fc.add(img);
          fc.setActiveObject(img);
          fc.requestRenderAll();
        });
      }
      return;
    }

    // ★ 从本地拖入图片文件
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const reader = new FileReader();
        reader.onload = async () => {
          const img = await FabricImage.fromURL(reader.result as string);
          const pointer = fc.getScenePoint(e.nativeEvent);
          img.set({
            left: pointer.x - (img.width || 0) / 2,
            top: pointer.y - (img.height || 0) / 2,
            scaleX: Math.min(400 / (img.width || 1), 1),
            scaleY: Math.min(400 / (img.height || 1), 1),
          });
          fc.add(img);
          fc.setActiveObject(img);
          fc.requestRenderAll();
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  // 扫描 AI 占位符
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const scanSlots = () => {
      const slots = fc.getObjects().filter((obj: any) => obj.isAiCutoutSlot === true);
      setCutoutSlots(slots);
    };
    fc.on('object:added', scanSlots);
    fc.on('object:removed', scanSlots);
    return () => {
      fc.off('object:added', scanSlots);
      fc.off('object:removed', scanSlots);
    };
  }, [setCutoutSlots]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} />
      <CutoutOverlay />
    </div>
  );
}

function CutoutOverlay() {
  const { canvas, cutoutSlots } = useEditorStore();
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);

  if (!canvas || cutoutSlots.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ width: canvasWidth, height: canvasHeight }}>
      {cutoutSlots.map((slot: any) => {
        const bound = slot.getBoundingRect();
        return (
          <div
            key={slot.id || slot.name}
            className="absolute pointer-events-auto"
            style={{ left: bound.left, top: bound.top, width: bound.width, height: bound.height }}
          >
            <AICutoutButton slotObject={slot} />
          </div>
        );
      })}
    </div>
  );
}
