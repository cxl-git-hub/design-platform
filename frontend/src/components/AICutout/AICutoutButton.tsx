/**
 * AI 抠图按钮 — Fabric.js v6 适配
 */
import { useState, useCallback } from 'react';
import { Image as FabricImage } from 'fabric';
import { useEditorStore } from '../../stores/editorStore';
import { aiCutout } from '../../api';
import { Scissors, Loader2 } from 'lucide-react';

interface Props {
  slotObject: any;
}

export default function AICutoutButton({ slotObject }: Props) {
  const { canvas } = useEditorStore();
  const [processing, setProcessing] = useState(false);
  const [replaced, setReplaced] = useState(false);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !canvas) return;

      setProcessing(true);
      try {
        const result = await aiCutout(file);

        // v6: Image.fromURL 返回 Promise
        const img = await FabricImage.fromURL(result.data_url);

        const slotLeft = slotObject.left || 0;
        const slotTop = slotObject.top || 0;
        const slotWidth = (slotObject.width || 100) * (slotObject.scaleX || 1);
        const slotHeight = (slotObject.height || 100) * (slotObject.scaleY || 1);

        const scaleX = slotWidth / (img.width || 1);
        const scaleY = slotHeight / (img.height || 1);
        const scale = Math.min(scaleX, scaleY);

        img.set({
          left: slotLeft,
          top: slotTop,
          scaleX: scale,
          scaleY: scale,
          name: `cutout_result_${slotObject.name || 'slot'}`,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        setReplaced(true);
      } catch (err: any) {
        alert(`抠图失败: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    };
    input.click();
  }, [canvas, slotObject]);

  if (replaced) return null;

  return (
    <button
      onClick={handleClick}
      disabled={processing}
      className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg
        bg-black/40 backdrop-blur-sm border-2 border-dashed border-blue-400/50
        hover:bg-blue-500/20 hover:border-blue-400 transition cursor-pointer"
    >
      {processing ? (
        <>
          <Loader2 size={24} className="animate-spin text-blue-300" />
          <span className="text-xs text-blue-200">AI 抠图中...</span>
        </>
      ) : (
        <>
          <Scissors size={24} className="text-blue-300" />
          <span className="text-xs text-blue-200 font-medium">上传并智能抠图</span>
        </>
      )}
    </button>
  );
}
