/**
 * 顶部工具栏 — 完整版
 * 增加: 撤销/重做、画布背景色、导出格式选择、新建项目
 */
import { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { saveProject, exportProject } from '../../api';
import { getCanvasHistory } from './DesignCanvas';
import {
  Save, Download, Upload, Type, Square, Circle,
  Undo2, Redo2, Palette, Plus, FolderOpen,
} from 'lucide-react';
import { IText, Rect, Circle as FCircle } from 'fabric';

interface Props {
  onImportPSD: () => void;
  onOpenProjectList: () => void;
}

export default function TopBar({ onImportPSD, onOpenProjectList }: Props) {
  const {
    canvas, projectName, setProjectName,
    canvasWidth, canvasHeight, setCanvasSize,
    currentProjectId, setCurrentProjectId,
    referencedAssetIds,
  } = useEditorStore();

  const [showNewProject, setShowNewProject] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JPEG'>('PNG');

  // ★ 撤销/重做
  const handleUndo = async () => {
    await getCanvasHistory()?.undo();
  };
  const handleRedo = async () => {
    await getCanvasHistory()?.redo();
  };

  const handleSave = async () => {
    if (!canvas) return;
    const canvasJson = canvas.toJSON();
    const payload = {
      name: projectName,
      canvas_width: canvasWidth,
      canvas_height: canvasHeight,
      canvas_json: canvasJson,
      referenced_asset_ids: referencedAssetIds,
    };
    if (currentProjectId) {
      await saveProject(payload);
    } else {
      const result = await saveProject(payload);
      setCurrentProjectId(result.id);
    }
    alert('保存成功');
  };

  const handleExport = async () => {
    if (!canvas) return;
    const canvasJson = canvas.toJSON();
    const result = await exportProject(canvasJson, exportFormat);
    const link = document.createElement('a');
    link.href = result.data_url;
    link.download = `${projectName}.${exportFormat.toLowerCase()}`;
    link.click();
  };

  const addText = () => {
    if (!canvas) return;
    const text = new IText('双击编辑文字', {
      left: canvasWidth / 2 - 100,
      top: canvasHeight / 2 - 20,
      fontSize: 32,
      fill: '#ffffff',
      fontFamily: 'sans-serif',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
  };

  const addRect = () => {
    if (!canvas) return;
    const rect = new Rect({
      left: canvasWidth / 2 - 50,
      top: canvasHeight / 2 - 50,
      width: 100,
      height: 100,
      fill: 'rgba(59, 130, 246, 0.5)',
      stroke: '#3b82f6',
      strokeWidth: 2,
    });
    canvas.add(rect);
    canvas.requestRenderAll();
  };

  const addCircle = () => {
    if (!canvas) return;
    const circle = new FCircle({
      left: canvasWidth / 2 - 50,
      top: canvasHeight / 2 - 50,
      radius: 50,
      fill: 'rgba(239, 68, 68, 0.5)',
      stroke: '#ef4444',
      strokeWidth: 2,
    });
    canvas.add(circle);
    canvas.requestRenderAll();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // 画布背景色
  const handleBgChange = (color: string) => {
    if (!canvas) return;
    canvas.backgroundColor = color;
    canvas.requestRenderAll();
  };

  return (
    <header className="h-12 bg-surface-800 border-b border-surface-700 flex items-center px-4 gap-2">
      {/* 新建项目 */}
      <button
        onClick={() => setShowNewProject(true)}
        className="p-1.5 hover:bg-surface-700 rounded"
        title="新建项目"
      >
        <Plus size={18} />
      </button>

      {/* 打开项目 */}
      <button
        onClick={onOpenProjectList}
        className="p-1.5 hover:bg-surface-700 rounded"
        title="打开项目"
      >
        <FolderOpen size={18} />
      </button>

      <div className="w-px h-6 bg-surface-700" />

      {/* 项目名 */}
      <input
        className="bg-transparent text-white font-medium text-sm w-32 border-none outline-none"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
      />

      <div className="w-px h-6 bg-surface-700" />

      {/* 撤销/重做 */}
      <button onClick={handleUndo} className="p-1.5 hover:bg-surface-700 rounded" title="撤销 (Ctrl+Z)">
        <Undo2 size={18} />
      </button>
      <button onClick={handleRedo} className="p-1.5 hover:bg-surface-700 rounded" title="重做 (Ctrl+Shift+Z)">
        <Redo2 size={18} />
      </button>

      <div className="w-px h-6 bg-surface-700" />

      {/* 绘图工具 */}
      <button onClick={addText} className="p-1.5 hover:bg-surface-700 rounded" title="文字">
        <Type size={18} />
      </button>
      <button onClick={addRect} className="p-1.5 hover:bg-surface-700 rounded" title="矩形">
        <Square size={18} />
      </button>
      <button onClick={addCircle} className="p-1.5 hover:bg-surface-700 rounded" title="圆形">
        <Circle size={18} />
      </button>

      {/* 画布背景色 */}
      <div className="relative">
        <button
          onClick={() => setShowBgPicker(!showBgPicker)}
          className="p-1.5 hover:bg-surface-700 rounded"
          title="画布背景色"
        >
          <Palette size={18} />
        </button>
        {showBgPicker && (
          <div className="absolute top-full left-0 mt-1 bg-surface-700 rounded p-2 shadow-lg z-50">
            <input
              type="color"
              value={canvas?.backgroundColor as string || '#ffffff'}
              onChange={(e) => handleBgChange(e.target.value)}
            />
            <div className="flex gap-1 mt-2">
              {['#ffffff', '#000000', '#f87171', '#60a5fa', '#34d399', '#fbbf24'].map((c) => (
                <button
                  key={c}
                  onClick={() => handleBgChange(c)}
                  className="w-6 h-6 rounded border border-surface-200"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-surface-700" />

      {/* 导入 */}
      <button
        onClick={onImportPSD}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded text-sm"
      >
        <Upload size={14} />
        导入 PSD
      </button>

      <div className="flex-1" />

      {/* 导出格式选择 */}
      <select
        className="bg-surface-700 text-white text-xs px-2 py-1 rounded border-none"
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value as 'PNG' | 'JPEG')}
      >
        <option value="PNG">PNG</option>
        <option value="JPEG">JPEG</option>
      </select>

      <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-surface-700 rounded text-sm">
        <Save size={14} />
        保存
      </button>
      <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm">
        <Download size={14} />
        导出
      </button>
      <button onClick={handleLogout} className="px-2 py-1.5 text-xs text-surface-200 hover:text-white">
        退出
      </button>

      {/* 新建项目对话框 */}
      {showNewProject && (
        <NewProjectDialog
          onClose={() => setShowNewProject(false)}
          onCreate={(w, h, name) => {
            if (!canvas) return;
            setCanvasSize(w, h);
            setProjectName(name);
            setCurrentProjectId(null);
            canvas.clear();
            canvas.backgroundColor = '#ffffff';
            canvas.setDimensions({ width: w, height: h });
            canvas.requestRenderAll();
            setShowNewProject(false);
          }}
        />
      )}
    </header>
  );
}

function NewProjectDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (w: number, h: number, name: string) => void;
}) {
  const [name, setName] = useState('未命名项目');
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1920);

  const presets = [
    { label: '手机海报', w: 1080, h: 1920 },
    { label: '电脑壁纸', w: 1920, h: 1080 },
    { label: '正方形', w: 1080, h: 1080 },
    { label: 'A4', w: 2480, h: 3508 },
    { label: '名片', w: 1050, h: 600 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-800 rounded-xl w-96 p-6 border border-surface-700">
        <h3 className="text-lg font-semibold mb-4">新建项目</h3>
        <label className="text-sm text-surface-200 block mb-3">
          项目名称
          <input
            className="w-full mt-1 px-3 py-2 bg-surface-700 rounded text-white outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <p className="text-sm text-surface-200 mb-2">预设尺寸</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => { setWidth(p.w); setHeight(p.h); }}
              className={`px-2 py-1.5 rounded text-xs ${
                width === p.w && height === p.h ? 'bg-primary-600' : 'bg-surface-700 hover:bg-surface-200/10'
              }`}
            >
              {p.label}
              <br />
              <span className="text-surface-200">{p.w}×{p.h}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <label className="text-sm text-surface-200">
            宽度
            <input
              type="number"
              className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </label>
          <label className="text-sm text-surface-200">
            高度
            <input
              type="number"
              className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-surface-700 hover:bg-surface-200/10 rounded">
            取消
          </button>
          <button
            onClick={() => onCreate(width, height, name)}
            className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 rounded"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
