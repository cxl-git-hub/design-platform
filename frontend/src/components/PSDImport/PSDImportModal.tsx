/**
 * PSD 导入模态框 — Fabric.js v6 适配
 */
import { useState, useCallback } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { uploadAsset, createTemplate } from '../../api';
import { X, FolderOpen, Save, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

type Step = 'select' | 'decide' | 'processing' | 'done';

export default function PSDImportModal({ onClose }: Props) {
  const { canvas, canvasWidth, canvasHeight, setCanvasSize } = useEditorStore();

  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setStep('decide');
  }, []);

  // ★ 方案A: 仅打开
  const handleOpenOnly = useCallback(async () => {
    if (!file || !canvas) return;
    setProcessing(true);
    setError('');
    try {
      const result = await uploadAsset(file, 'psd', false);
      const fabricJson = result.meta_info?.fabric_json;
      if (fabricJson) {
        await canvas.loadFromJSON(fabricJson);
        const w = result.meta_info?.canvas_width || canvasWidth;
        const h = result.meta_info?.canvas_height || canvasHeight;
        setCanvasSize(w, h);
        canvas.setDimensions({ width: w, height: h });
        canvas.requestRenderAll();
      }
      setStep('done');
    } catch (err: any) {
      setError(err.message || '导入失败');
    } finally {
      setProcessing(false);
    }
  }, [file, canvas, canvasWidth, canvasHeight, setCanvasSize]);

  // ★ 方案B: 保存为素材/模板
  const handleSaveToLibrary = useCallback(async () => {
    if (!file || !canvas) return;
    if (!templateName.trim()) { setError('请输入模板名称'); return; }
    setProcessing(true);
    setError('');
    try {
      const result = await uploadAsset(file, 'psd', true);
      await createTemplate(result.id, templateName.trim());
      const fabricJson = result.meta_info?.fabric_json;
      if (fabricJson) {
        await canvas.loadFromJSON(fabricJson);
        const w = result.meta_info?.canvas_width || canvasWidth;
        const h = result.meta_info?.canvas_height || canvasHeight;
        setCanvasSize(w, h);
        canvas.setDimensions({ width: w, height: h });
        canvas.requestRenderAll();
      }
      setStep('done');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setProcessing(false);
    }
  }, [file, canvas, templateName, canvasWidth, canvasHeight, setCanvasSize]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-800 rounded-xl w-[480px] shadow-2xl border border-surface-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold">导入 PSD 文件</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-700 rounded"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 'select' && (
            <label className="block w-full border-2 border-dashed border-surface-700 rounded-lg py-12 cursor-pointer hover:border-primary-500 transition text-center">
              <input type="file" accept=".psd" className="hidden" onChange={handleFileSelect} />
              <FolderOpen size={40} className="mx-auto mb-3 text-surface-200" />
              <p className="text-surface-200">点击选择 .psd 文件</p>
            </label>
          )}

          {step === 'decide' && (
            <div className="space-y-3">
              <p className="text-sm text-surface-200">已选择: <span className="text-white font-medium">{file?.name}</span></p>
              <p className="text-sm font-medium">如何处理此 PSD？</p>

              <button
                onClick={handleOpenOnly}
                disabled={processing}
                className="w-full flex items-start gap-3 p-4 bg-surface-700 hover:bg-surface-200/10 rounded-lg border border-surface-700 hover:border-primary-500 transition text-left"
              >
                <FolderOpen size={20} className="mt-0.5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium">仅作为当前项目打开</p>
                  <p className="text-xs text-surface-200 mt-1">临时加载，不保存到素材库。用完即走。</p>
                </div>
              </button>

              <div className="p-4 bg-surface-700 rounded-lg border border-surface-700 space-y-3">
                <div className="flex items-start gap-3">
                  <Save size={20} className="mt-0.5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">保存为我的素材/模板</p>
                    <p className="text-xs text-surface-200 mt-1">解析图层，永久存入素材库。可反复复用。</p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="模板名称 (如: 证件照模板)"
                  className="w-full px-3 py-2 bg-surface-800 rounded text-sm border border-surface-700 focus:border-primary-500 outline-none"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
                <button
                  onClick={handleSaveToLibrary}
                  disabled={processing || !templateName.trim()}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm"
                >
                  {processing ? '处理中...' : '确认保存'}
                </button>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 size={32} className="mx-auto animate-spin text-primary-500" />
              <p className="mt-3 text-surface-200">正在解析 PSD...</p>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-medium">导入完成！</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded text-sm">
                开始编辑
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
