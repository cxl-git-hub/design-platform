"""
AI 抠图服务 (基于 rembg)

核心流程:
1. 接收用户上传的原始图片 (自拍/人像)
2. rembg 去除背景 → 透明 PNG
3. 返回处理后的图片路径 / base64
"""
import uuid
from pathlib import Path
from io import BytesIO

from PIL import Image
from rembg import remove
from config import settings


class RembgService:
    """AI 背景去除服务"""

    @staticmethod
    def remove_background(
        image_bytes: bytes,
        output_filename: str | None = None,
        alpha_matting: bool = False,
        alpha_matting_foreground_threshold: int = 240,
        alpha_matting_background_threshold: int = 10,
    ) -> dict[str, str]:
        """
        执行抠图

        Args:
            image_bytes: 原始图片字节
            output_filename: 输出文件名 (默认自动生成)
            alpha_matting: 是否启用精细边缘处理 (慢但质量高)

        Returns:
            {
                "output_path": str,     # 保存路径 (相对)
                "output_abs": str,      # 绝对路径
                "data_url": str,        # base64 data URL (前端即时预览)
            }
        """
        # 1. 打开输入图片
        input_image = Image.open(BytesIO(image_bytes))

        # 2. 执行抠图
        output_image = remove(
            input_image,
            alpha_matting=alpha_matting,
            alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
            alpha_matting_background_threshold=alpha_matting_background_threshold,
        )

        # 3. 保存结果
        if output_filename is None:
            output_filename = f"cutout_{uuid.uuid4().hex[:12]}.png"

        output_path = settings.TEMP_DIR / output_filename
        output_image.save(output_path, "PNG")

        # 4. 生成 data URL (前端即时预览用)
        buf = BytesIO()
        output_image.save(buf, format="PNG")
        import base64
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        data_url = f"data:image/png;base64,{b64}"

        return {
            "output_path": f"temp/{output_filename}",
            "output_abs": str(output_path),
            "data_url": data_url,
        }

    @staticmethod
    def remove_background_from_file(
        input_path: str | Path,
        alpha_matting: bool = False,
    ) -> dict[str, str]:
        """从文件路径执行抠图"""
        input_path = Path(input_path)
        image_bytes = input_path.read_bytes()
        return RembgService.remove_background(
            image_bytes, alpha_matting=alpha_matting
        )
