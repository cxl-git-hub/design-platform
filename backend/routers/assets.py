"""素材管理路由 — 含用户隔离"""
import uuid
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.asset import Asset
from models.user import User
from services.auth import get_current_user
from services.psd_parser import PSDParser
from config import settings

router = APIRouter(prefix="/api/assets", tags=["素材管理"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/svg+xml", "image/webp"}
ALLOWED_FONT_TYPES = {"font/ttf", "font/otf", "application/octet-stream"}


@router.post("/upload")
async def upload_asset(
    file: UploadFile = File(...),
    asset_type: str = Form(...),
    save_to_library: bool = Form(True),
    tags: Optional[str] = Form(None),
    temp_session_token: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    统一素材上传接口

    分流逻辑:
    save_to_library=True  → 永久入库 (assets/)
    save_to_library=False → 临时存储 (temp/)
    """
    # 1. 验证文件类型
    content_type = file.content_type or "application/octet-stream"
    if asset_type == "image" and content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, f"不支持的图片格式: {content_type}")

    # 2. 读取文件
    file_bytes = await file.read()
    file_size = len(file_bytes)
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(413, "文件过大")

    # 3. 存储路径
    file_ext = Path(file.filename or "unknown").suffix
    unique_name = f"{uuid.uuid4().hex[:12]}{file_ext}"

    if save_to_library:
        type_dir = settings.ASSETS_DIR / asset_type
        type_dir.mkdir(parents=True, exist_ok=True)
        storage_path = type_dir / unique_name
        relative_path = f"assets/{asset_type}/{unique_name}"
    else:
        storage_path = settings.TEMP_DIR / unique_name
        relative_path = f"temp/{unique_name}"

    storage_path.write_bytes(file_bytes)

    # 4. 解析元信息
    meta_info = {}
    thumbnail_path = None

    if asset_type == "image":
        from PIL import Image
        from io import BytesIO
        img = Image.open(BytesIO(file_bytes))
        meta_info = {"width": img.width, "height": img.height, "format": img.format}

    elif asset_type == "psd":
        # ★ PSD 解析: 生成 Fabric.js JSON + 图层文件 (非 base64)
        psd_result = PSDParser.parse(storage_path, project_id=uuid.uuid4().hex[:8])
        meta_info = {
            "canvas_width": psd_result["canvas"]["width"],
            "canvas_height": psd_result["canvas"]["height"],
            "layer_count": len(psd_result["layers"]),
            "layers": psd_result["layers"],
            "fabric_json": psd_result["fabric_json"],
        }
        thumbnail_path = psd_result["thumbnail_path"]

    elif asset_type == "font":
        meta_info = {"font_name": Path(file.filename or "unknown").stem}

    # 5. 标签
    tag_list = []
    if tags:
        import json
        try:
            tag_list = json.loads(tags)
        except Exception:
            tag_list = [tags]

    # 6. 数据库记录
    asset = Asset(
        user_id=current_user.id,
        type=asset_type,
        original_name=file.filename or "unknown",
        file_path=relative_path,
        thumbnail_path=thumbnail_path,
        mime_type=content_type,
        file_size=file_size,
        is_public=False,
        save_to_library=save_to_library,
        tags=tag_list,
        meta_info=meta_info,
        temp_session_token=temp_session_token if not save_to_library else None,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return {
        "id": asset.id,
        "type": asset.type,
        "file_path": asset.file_path,
        "thumbnail_path": asset.thumbnail_path,
        "save_to_library": asset.save_to_library,
        "meta_info": asset.meta_info,
        "message": "已入库" if save_to_library else "临时使用",
    }


@router.get("/list")
async def list_assets(
    asset_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取当前用户的素材列表"""
    query = db.query(Asset).filter(
        Asset.user_id == current_user.id,
        Asset.save_to_library == True,
    )
    if asset_type:
        query = query.filter(Asset.type == asset_type)
    assets = query.order_by(Asset.created_at.desc()).all()

    return [
        {
            "id": a.id,
            "type": a.type,
            "original_name": a.original_name,
            "file_path": a.file_path,
            "thumbnail_path": a.thumbnail_path,
            "tags": a.tags,
            "meta_info": a.meta_info,
            "created_at": a.created_at.isoformat(),
        }
        for a in assets
    ]


@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id,
    ).first()
    if not asset:
        raise HTTPException(404, "素材不存在")

    file_path = settings.STORAGE_ROOT / asset.file_path
    if file_path.exists():
        file_path.unlink()

    db.delete(asset)
    db.commit()
    return {"message": "已删除"}
