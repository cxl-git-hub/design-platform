"""AI 服务路由 — 含用户验证"""
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from models.user import User
from services.auth import get_current_user
from services.rembg_service import RembgService

router = APIRouter(prefix="/api/ai", tags=["AI 服务"])


@router.post("/cutout")
async def ai_cutout(
    file: UploadFile = File(...),
    alpha_matting: bool = Form(False),
    current_user: User = Depends(get_current_user),
):
    """AI 抠图接口"""
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(400, "请上传 JPG/PNG/WEBP 图片")

    image_bytes = await file.read()
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(413, "图片过大 (最大 20MB)")

    try:
        result = RembgService.remove_background(
            image_bytes=image_bytes,
            alpha_matting=alpha_matting,
        )
    except Exception as e:
        raise HTTPException(500, f"抠图失败: {str(e)}")

    return {"output_path": result["output_path"], "data_url": result["data_url"], "message": "抠图完成"}
