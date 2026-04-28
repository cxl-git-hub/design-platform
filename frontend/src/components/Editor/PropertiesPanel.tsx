/**
 * 右侧属性面板 — v6 适配 + 增强文字/形状属性
 */
import { useEditorStore } from '../../stores/editorStore';
import { Type, Bold, Italic, Underline } from 'lucide-react';

const FONT_FAMILIES = [
  'sans-serif',
  'serif',
  'monospace',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Microsoft YaHei',
  'SimSun',
  'SimHei',
  'KaiTi',
];

export default function PropertiesPanel() {
  const { selectedObject, canvas } = useEditorStore();

  if (!selectedObject) {
    return (
      <div className="p-4 text-surface-200 text-sm">
        <p className="text-center mt-8">选中画布上的对象以编辑属性</p>
      </div>
    );
  }

  const obj = selectedObject as any;
  const isCutout = obj.isAiCutoutSlot === true;
  const isText = obj.type === 'i-text' || obj.type === 'textbox';
  const isImage = obj.type === 'image';
  const isShape = obj.type === 'rect' || obj.type === 'circle' || obj.type === 'polygon';

  const updateProp = (key: string, value: any) => {
    obj.set(key, value);
    canvas?.requestRenderAll(); // ★ v6 API
  };

  return (
    <div className="p-4 space-y-4 text-sm">
      <h3 className="font-semibold text-white">
        {isCutout ? ' AI 抠图占位符' : isText ? '文字属性' : isImage ? '图片属性' : `属性 — ${obj.type}`}
      </h3>

      {/* 位置 */}
      <div className="grid grid-cols-2 gap-2">
        <label className="text-surface-200">
          X
          <input
            type="number"
            className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
            value={Math.round(obj.left || 0)}
            onChange={(e) => updateProp('left', Number(e.target.value))}
          />
        </label>
        <label className="text-surface-200">
          Y
          <input
            type="number"
            className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
            value={Math.round(obj.top || 0)}
            onChange={(e) => updateProp('top', Number(e.target.value))}
          />
        </label>
      </div>

      {/* 尺寸 */}
      <div className="grid grid-cols-2 gap-2">
        <label className="text-surface-200">
          宽
          <input
            type="number"
            className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
            value={Math.round((obj.width || 0) * (obj.scaleX || 1))}
            onChange={(e) => updateProp('scaleX', Number(e.target.value) / (obj.width || 1))}
          />
        </label>
        <label className="text-surface-200">
          高
          <input
            type="number"
            className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
            value={Math.round((obj.height || 0) * (obj.scaleY || 1))}
            onChange={(e) => updateProp('scaleY', Number(e.target.value) / (obj.height || 1))}
          />
        </label>
      </div>

      {/* 旋转 */}
      <label className="text-surface-200 block">
        旋转 (°)
        <input
          type="number"
          className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
          value={Math.round(obj.angle || 0)}
          onChange={(e) => updateProp('angle', Number(e.target.value))}
        />
      </label>

      {/* 透明度 */}
      <label className="text-surface-200 block">
        透明度
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          className="w-full mt-1"
          value={obj.opacity ?? 1}
          onChange={(e) => updateProp('opacity', Number(e.target.value))}
        />
      </label>

      {/* ★ 文字属性增强 */}
      {isText && (
        <>
          {/* 字体 */}
          <label className="text-surface-200 block">
            字体
            <select
              className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
              value={obj.fontFamily || 'sans-serif'}
              onChange={(e) => updateProp('fontFamily', e.target.value)}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>

          {/* 字号 */}
          <label className="text-surface-200 block">
            字号
            <input
              type="number"
              className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
              value={obj.fontSize || 24}
              onChange={(e) => updateProp('fontSize', Number(e.target.value))}
            />
          </label>

          {/* 粗体/斜体/下划线 */}
          <div className="flex gap-2">
            <button
              onClick={() => updateProp('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold')}
              className={`p-2 rounded ${obj.fontWeight === 'bold' ? 'bg-primary-600' : 'bg-surface-700'} hover:bg-primary-700`}
              title="粗体"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => updateProp('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic')}
              className={`p-2 rounded ${obj.fontStyle === 'italic' ? 'bg-primary-600' : 'bg-surface-700'} hover:bg-primary-700`}
              title="斜体"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => updateProp('underline', !obj.underline)}
              className={`p-2 rounded ${obj.underline ? 'bg-primary-600' : 'bg-surface-700'} hover:bg-primary-700`}
              title="下划线"
            >
              <Underline size={14} />
            </button>
          </div>

          {/* 颜色 */}
          <label className="text-surface-200 block">
            颜色
            <input
              type="color"
              className="w-full mt-1 h-8"
              value={obj.fill || '#000000'}
              onChange={(e) => updateProp('fill', e.target.value)}
            />
          </label>

          {/* 行高 */}
          <label className="text-surface-200 block">
            行高
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              className="w-full mt-1"
              value={obj.lineHeight ?? 1.16}
              onChange={(e) => updateProp('lineHeight', Number(e.target.value))}
            />
          </label>

          {/* 字间距 */}
          <label className="text-surface-200 block">
            字间距
            <input
              type="range"
              min={-200}
              max={800}
              step={10}
              className="w-full mt-1"
              value={obj.charSpacing ?? 0}
              onChange={(e) => updateProp('charSpacing', Number(e.target.value))}
            />
          </label>
        </>
      )}

      {/* ★ 形状属性 */}
      {isShape && !isCutout && (
        <>
          <label className="text-surface-200 block">
            填充色
            <input
              type="color"
              className="w-full mt-1 h-8"
              value={obj.fill || '#3b82f6'}
              onChange={(e) => updateProp('fill', e.target.value)}
            />
          </label>
          <label className="text-surface-200 block">
            边框色
            <input
              type="color"
              className="w-full mt-1 h-8"
              value={obj.stroke || '#000000'}
              onChange={(e) => updateProp('stroke', e.target.value)}
            />
          </label>
          <label className="text-surface-200 block">
            边框宽度
            <input
              type="number"
              min={0}
              className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
              value={obj.strokeWidth || 0}
              onChange={(e) => updateProp('strokeWidth', Number(e.target.value))}
            />
          </label>
          <label className="text-surface-200 block">
            圆角
            <input
              type="number"
              min={0}
              className="w-full mt-1 px-2 py-1 bg-surface-700 rounded text-white"
              value={obj.rx || 0}
              onChange={(e) => {
                updateProp('rx', Number(e.target.value));
                updateProp('ry', Number(e.target.value));
              }}
            />
          </label>
        </>
      )}

      {/* 锁定 */}
      <label className="flex items-center gap-2 text-surface-200">
        <input
          type="checkbox"
          checked={obj.lockMovementX && obj.lockMovementY}
          onChange={(e) => {
            const locked = e.target.checked;
            obj.set({
              lockMovementX: locked,
              lockMovementY: locked,
              lockRotation: locked,
              lockScalingX: locked,
              lockScalingY: locked,
              hasControls: !locked,
            });
            canvas?.requestRenderAll();
          }}
        />
        锁定对象
      </label>

      {/* 删除 */}
      <button
        onClick={() => {
          if (canvas && selectedObject) {
            canvas.remove(selectedObject);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
          }
        }}
        className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-white"
      >
        删除
      </button>
    </div>
  );
}
