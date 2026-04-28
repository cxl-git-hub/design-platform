/**
 * 左侧素材面板 — v6 适配 + 修复 JWT 上传
 */
import { useEffect, useState, useCallback } from 'react';
import { Image as FabricImage } from 'fabric';
import { useEditorStore } from '../../stores/editorStore';
import { listAssets, listTemplates, getTemplate, uploadAsset } from '../../api';
import type { Asset, Template } from '../../types';
import { Image, Type, FileImage, Layers, LayoutGrid, Upload, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

export default function AssetPanel() {
  const { activePanel, setActivePanel, canvas, addReferencedAsset } = useEditorStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (activePanel === 'assets') {
      listAssets().then(setAssets).catch(console.error);
    } else if (activePanel === 'templates') {
      listTemplates().then(setTemplates).catch(console.error);
    }
  }, [activePanel]);

  const handleDragStart = useCallback((e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // ★ 修复: 使用 API 客户端 (含 JWT) 而非原生 fetch
  const handleQuickUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files?.length) return;
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          const data = await uploadAsset(file, 'image', true);
          setAssets((prev) => [data, ...prev]);
        }
      } catch (err: any) {
        alert(`上传失败: ${err.response?.data?.detail || err.message}`);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, []);

  const handleAssetClick = useCallback(async (asset: Asset) => {
    if (!canvas) return;
    if (asset.type === 'image') {
      const img = await FabricImage.fromURL(`/static/${asset.file_path}`);
      const cw = canvas.getWidth();
      const ch = canvas.getHeight();
      img.set({
        left: cw / 2 - (img.width || 0) / 2,
        top: ch / 2 - (img.height || 0) / 2,
        scaleX: Math.min(300 / (img.width || 1), 1),
        scaleY: Math.min(300 / (img.height || 1), 1),
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      addReferencedAsset(asset.id);
    }
  }, [canvas, addReferencedAsset]);

  const loadTemplate = useCallback(async (templateId: number) => {
    if (!canvas) return;
    const detail = await getTemplate(templateId);
    await canvas.loadFromJSON(detail.canvas_json);
    canvas.requestRenderAll();
  }, [canvas]);

  // 图层排序
  const moveLayer = useCallback((obj: any, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!canvas) return;
    switch (direction) {
      case 'up': canvas.bringObjectForward(obj); break;
      case 'down': canvas.sendObjectBackwards(obj); break;
      case 'top': canvas.bringObjectToFront(obj); break;
      case 'bottom': canvas.sendObjectToBack(obj); break;
    }
    canvas.requestRenderAll();
  }, [canvas]);

  const layers = canvas?.getObjects() || [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-surface-700">
        {[
          { key: 'assets', icon: <Image size={14} />, label: '素材' },
          { key: 'templates', icon: <LayoutGrid size={14} />, label: '模板' },
          { key: 'layers', icon: <Layers size={14} />, label: '图层' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActivePanel(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs ${
              activePanel === tab.key
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-surface-200 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* 素材面板 */}
        {activePanel === 'assets' && (
          <>
            <button
              onClick={handleQuickUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-primary-600 hover:bg-primary-700 rounded text-sm mb-3"
            >
              <Upload size={14} />
              {uploading ? '上传中...' : '上传素材'}
            </button>

            {assets.length === 0 ? (
              <p className="text-surface-200 text-xs text-center mt-8">暂无素材，点击上方按钮上传</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, asset)}
                    onClick={() => handleAssetClick(asset)}
                    className="group relative bg-surface-700 rounded overflow-hidden cursor-grab hover:ring-2 hover:ring-primary-500 transition"
                  >
                    {asset.type === 'image' ? (
                      <img src={`/static/${asset.file_path}`} alt={asset.original_name} className="w-full h-24 object-cover" />
                    ) : asset.type === 'psd' && asset.thumbnail_path ? (
                      <img src={`/static/${asset.thumbnail_path.replace(/.*storage[\\/]/, '')}`} alt={asset.original_name} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center text-surface-200">
                        {asset.type === 'font' ? <Type size={24} /> : <FileImage size={24} />}
                      </div>
                    )}
                    <p className="text-xs text-surface-200 truncate px-1.5 py-1">{asset.original_name}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 模板面板 */}
        {activePanel === 'templates' && (
          <>
            {templates.length === 0 ? (
              <p className="text-surface-200 text-xs text-center mt-8">暂无模板，请先上传 PSD 并保存为模板</p>
            ) : (
              templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => loadTemplate(tpl.id)}
                  className="bg-surface-700 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition"
                >
                  {tpl.cover_image && <img src={tpl.cover_image} alt={tpl.name} className="w-full h-32 object-cover" />}
                  <div className="p-2">
                    <p className="text-sm font-medium">{tpl.name}</p>
                    <p className="text-xs text-surface-200">
                      {tpl.canvas_width}×{tpl.canvas_height} · {tpl.layer_count} 图层
                      {tpl.cutout_slots > 0 && ` · ${tpl.cutout_slots} 个AI占位符`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ★ 图层面板 — 增加排序和删除 */}
        {activePanel === 'layers' && (
          <>
            {layers.length === 0 ? (
              <p className="text-surface-200 text-xs text-center mt-8">画布为空</p>
            ) : (
              [...layers].reverse().map((obj: any, i) => {
                const realIndex = layers.length - 1 - i;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      canvas?.setActiveObject(obj);
                      canvas?.requestRenderAll();
                    }}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-xs ${
                      canvas?.getActiveObject() === obj
                        ? 'bg-primary-600/30 text-primary-500'
                        : 'hover:bg-surface-700 text-surface-200'
                    }`}
                  >
                    {obj.isAiCutoutSlot ? (
                      <span className="text-yellow-400"> </span>
                    ) : obj.type === 'image' ? (
                      <Image size={12} />
                    ) : obj.type === 'i-text' || obj.type === 'textbox' ? (
                      <Type size={12} />
                    ) : (
                      <FileImage size={12} />
                    )}
                    <span className="truncate flex-1">{obj.name || obj.type || `图层 ${i + 1}`}</span>

                    {/* 排序按钮 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayer(obj, 'up'); }}
                      className="p-0.5 hover:bg-surface-700 rounded"
                      title="上移"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayer(obj, 'down'); }}
                      className="p-0.5 hover:bg-surface-700 rounded"
                      title="下移"
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        canvas?.remove(obj);
                        canvas?.requestRenderAll();
                      }}
                      className="p-0.5 hover:bg-red-600 rounded"
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
