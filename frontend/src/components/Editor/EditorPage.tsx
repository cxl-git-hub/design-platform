/**
 * 编辑器主页面 — 完整版
 * 增加: 项目列表对话框、画布拖拽本地图片
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useEditorStore } from '../../stores/editorStore';
import { Image as FabricImage } from 'fabric';
import DesignCanvas from './DesignCanvas';
import AssetPanel from '../AssetPanel/AssetPanel';
import PropertiesPanel from './PropertiesPanel';
import PSDImportModal from '../PSDImport/PSDImportModal';
import TopBar from './TopBar';
import { getProject, listProjects } from '../../api';
import type { Project } from '../../types';
import { X, FolderOpen } from 'lucide-react';

export default function EditorPage() {
  const { projectId } = useParams();
  const [showPSDModal, setShowPSDModal] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    setCanvasSize,
    setCurrentProjectId,
    setProjectName,
    canvas,
  } = useEditorStore();

  // 加载项目
  useEffect(() => {
    if (projectId && canvas) {
      setLoading(true);
      getProject(Number(projectId))
        .then(async (project) => {
          setCurrentProjectId(project.id);
          setProjectName(project.name);
          setCanvasSize(project.canvas_width, project.canvas_height);
          if (project.canvas_json) {
            await canvas.loadFromJSON(project.canvas_json);
            canvas.requestRenderAll();
          }
        })
        .finally(() => setLoading(false));
    }
  }, [projectId, canvas]);

  // ★ 画布拖拽本地图片 (不经过素材库)
  const handleCanvasDrop = useCallback(async (e: React.DragEvent) => {
    if (!canvas) return;
    const files = e.dataTransfer.files;
    if (!files.length) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      // 读取为 data URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const img = await FabricImage.fromURL(dataUrl);
      const pointer = canvas.getScenePoint(e.nativeEvent);
      img.set({
        left: pointer.x - (img.width || 0) / 2,
        top: pointer.y - (img.height || 0) / 2,
        scaleX: Math.min(400 / (img.width || 1), 1),
        scaleY: Math.min(400 / (img.height || 1), 1),
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    }
  }, [canvas]);

  return (
    <div className="h-screen flex flex-col bg-surface-900">
      <TopBar
        onImportPSD={() => setShowPSDModal(true)}
        onOpenProjectList={() => setShowProjectList(true)}
      />
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 border-r border-surface-700 flex-shrink-0 overflow-y-auto">
          <AssetPanel />
        </aside>
        <main
          className="flex-1 flex items-center justify-center bg-surface-800 p-4 overflow-auto"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
          onDrop={handleCanvasDrop}
        >
          {loading ? <div className="text-surface-200">加载中...</div> : <DesignCanvas />}
        </main>
        <aside className="w-72 border-l border-surface-700 flex-shrink-0 overflow-y-auto">
          <PropertiesPanel />
        </aside>
      </div>

      {showPSDModal && <PSDImportModal onClose={() => setShowPSDModal(false)} />}
      {showProjectList && <ProjectListDialog onClose={() => setShowProjectList(false)} />}
    </div>
  );
}

/**
 * 项目列表对话框
 */
function ProjectListDialog({ onClose }: { onClose: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { canvas, setProjectName, setCurrentProjectId, setCanvasSize } = useEditorStore();

  useEffect(() => {
    listProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  const handleOpen = async (project: Project) => {
    if (!canvas) return;
    const detail = await getProject(project.id);
    setCurrentProjectId(project.id);
    setProjectName(project.name);
    setCanvasSize(project.canvas_width, project.canvas_height);
    if (detail.canvas_json) {
      await canvas.loadFromJSON(detail.canvas_json);
      canvas.requestRenderAll();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-800 rounded-xl w-[520px] max-h-[70vh] border border-surface-700 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold">我的项目</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-700 rounded"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <p className="text-center text-surface-200">加载中...</p>
          ) : projects.length === 0 ? (
            <p className="text-center text-surface-200">暂无项目</p>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                onClick={() => handleOpen(p)}
                className="flex items-center gap-3 p-3 bg-surface-700 rounded cursor-pointer hover:ring-2 hover:ring-primary-500 transition"
              >
                <FolderOpen size={20} className="text-surface-200" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-surface-200">
                    {p.canvas_width}×{p.canvas_height} · 更新于 {new Date(p.updated_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
