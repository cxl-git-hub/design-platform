"""
图像合成服务

核心职责:
1. 接收 Fabric.js canvas JSON
2. 按图层顺序逐层绘制到 Pillow Image 上
3. 输出最终高清 PNG/JPEG
"""
import base64
import json
import re
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont
from config import settings


class ImageComposer:
    """Canvas JSON → 最终合成图"""

    @staticmethod
    def compose(
        canvas_json: dict[str, Any],
        output_format: str = "PNG",
        quality: int = 95,
    ) -> dict[str, str]:
        """
        将 Fabric.js canvas JSON 合成为最终图片

        Args:
            canvas_json: Fabric.js canvas 数据
            output_format: PNG / JPEG
            quality: JPEG 质量

        Returns:
            {"output_path": str, "data_url": str}
        """
        width = canvas_json.get("width", 1080)
        height = canvas_json.get("height", 1920)
        objects = canvas_json.get("objects", [])

        # 创建画布
        if output_format == "JPEG":
            canvas = Image.new("RGB", (width, height), (255, 255, 255))
        else:
            canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))

        # 逐层绘制 (Fabric.js objects 按 z-index 排列)
        for obj in objects:
            ImageComposer._draw_object(canvas, obj)

        # 保存
        import uuid
        filename = f"export_{uuid.uuid4().hex[:12]}.{output_format.lower()}"
        output_path = settings.TEMP_DIR / filename

        save_kwargs = {}
        if output_format == "JPEG":
            canvas = canvas.convert("RGB")
            save_kwargs["quality"] = quality
        canvas.save(output_path, output_format, **save_kwargs)

        # data URL
        buf = BytesIO()
        canvas.save(buf, output_format, **save_kwargs)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        mime = "image/png" if output_format == "PNG" else "image/jpeg"
        data_url = f"data:{mime};base64,{b64}"

        return {
            "output_path": str(output_path),
            "data_url": data_url,
        }

    @staticmethod
    def _draw_object(canvas: Image.Image, obj: dict):
        """绘制单个 Fabric.js 对象到画布"""
        obj_type = obj.get("type", "")

        if obj_type == "image":
            ImageComposer._draw_image(canvas, obj)
        elif obj_type == "rect":
            ImageComposer._draw_rect(canvas, obj)
        elif obj_type == "circle":
            ImageComposer._draw_circle(canvas, obj)
        elif obj_type == "text":
            ImageComposer._draw_text(canvas, obj)
        elif obj_type == "i-text" or obj_type == "textbox":
            ImageComposer._draw_text(canvas, obj)

    @staticmethod
    def _draw_image(canvas: Image.Image, obj: dict):
        """绘制图片图层"""
        src = obj.get("src", "")
        if not src:
            return

        # 从 data URL 提取图片
        if src.startswith("data:"):
            # data:image/png;base64,xxxxx
            header, b64data = src.split(",", 1)
            img_bytes = base64.b64decode(b64data)
            layer_img = Image.open(BytesIO(img_bytes)).convert("RGBA")
        elif src.startswith("/") or src.startswith("./"):
            # 本地文件路径
            layer_img = Image.open(src).convert("RGBA")
        else:
            return

        # 缩放到指定尺寸
        target_w = int(obj.get("width", layer_img.width))
        target_h = int(obj.get("height", layer_img.height))
        if target_w != layer_img.width or target_h != layer_img.height:
            layer_img = layer_img.resize((target_w, target_h), Image.LANCZOS)

        # 透明度
        opacity = obj.get("opacity", 1.0)
        if opacity < 1.0:
            alpha = layer_img.split()[3]
            alpha = alpha.point(lambda p: int(p * opacity))
            layer_img.putalpha(alpha)

        # 粘贴到画布
        left = int(obj.get("left", 0))
        top = int(obj.get("top", 0))
        canvas.paste(layer_img, (left, top), layer_img)

    @staticmethod
    def _draw_rect(canvas: Image.Image, obj: dict):
        """绘制矩形 (含占位符)"""
        draw = ImageDraw.Draw(canvas)
        left = int(obj.get("left", 0))
        top = int(obj.get("top", 0))
        w = int(obj.get("width", 100))
        h = int(obj.get("height", 100))

        # 解析颜色
        fill = ImageComposer._parse_color(obj.get("fill", "transparent"))
        stroke = ImageComposer._parse_color(obj.get("stroke"))
        stroke_width = int(obj.get("strokeWidth", 0))

        if fill:
            draw.rectangle([left, top, left + w, top + h], fill=fill)
        if stroke and stroke_width > 0:
            draw.rectangle(
                [left, top, left + w, top + h],
                outline=stroke, width=stroke_width
            )

    @staticmethod
    def _draw_circle(canvas: Image.Image, obj: dict):
        """绘制圆形"""
        draw = ImageDraw.Draw(canvas)
        cx = int(obj.get("left", 0)) + int(obj.get("radius", 50))
        cy = int(obj.get("top", 0)) + int(obj.get("radius", 50))
        r = int(obj.get("radius", 50))
        fill = ImageComposer._parse_color(obj.get("fill", "transparent"))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)

    @staticmethod
    def _draw_text(canvas: Image.Image, obj: dict):
        """绘制文字"""
        draw = ImageDraw.Draw(canvas)
        text = obj.get("text", "")
        if not text:
            return

        left = int(obj.get("left", 0))
        top = int(obj.get("top", 0))
        font_size = int(obj.get("fontSize", 24))
        fill = ImageComposer._parse_color(obj.get("fill", "#000000"))

        # 尝试加载字体
        font = ImageFont.load_default()
        try:
            font_path = settings.FONTS_DIR / "default.ttf"
            if font_path.exists():
                font = ImageFont.truetype(str(font_path), font_size)
        except Exception:
            pass

        draw.text((left, top), text, fill=fill, font=font)

    @staticmethod
    def _parse_color(color_str: str | None) -> tuple | None:
        """解析颜色字符串 → RGBA tuple"""
        if not color_str or color_str == "transparent":
            return None

        # rgba(r,g,b,a)
        match = re.match(
            r"rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)",
            color_str
        )
        if match:
            r, g, b, a = match.groups()
            return (int(r), int(g), int(b), int(float(a) * 255))

        # hex
        if color_str.startswith("#"):
            hex_str = color_str.lstrip("#")
            if len(hex_str) == 3:
                hex_str = "".join(c * 2 for c in hex_str)
            if len(hex_str) >= 6:
                r = int(hex_str[0:2], 16)
                g = int(hex_str[2:4], 16)
                b = int(hex_str[4:6], 16)
                return (r, g, b, 255)

        return None
