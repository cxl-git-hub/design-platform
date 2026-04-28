"""模板管理路由 — 含用户隔离"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.template import Template, TemplateLayer
from models.asset import Asset
from models.user import User
from services.auth import get_current_user

router = APIRouter(prefix="/api/templates", tags=["模板管理"])


class TemplateCreateRequest(BaseModel):
    asset_id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: list[str] = []


@router.post("/create")
async def create_template(
    req: TemplateCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    asset = db.query(Asset).filter(
        Asset.id == req.asset_id,
        Asset.type == "psd",
        Asset.user_id == current_user.id,
    ).first()
    if not asset:
        raise HTTPException(404, "PSD 素材不存在")

    meta = asset.meta_info or {}
    fabric_json = meta.get("fabric_json")
    layers = meta.get("layers", [])

    if not fabric_json:
        raise HTTPException(400, "PSD 解析数据不完整，请重新上传")

    template = Template(
        name=req.name,
        description=req.description,
        canvas_width=meta.get("canvas_width", 1080),
        canvas_height=meta.get("canvas_height", 1920),
        canvas_json=fabric_json,
        category=req.category,
        tags=req.tags,
        creator_id=current_user.id,
        is_public=False,
    )
    db.add(template)
    db.flush()

    for layer_meta in layers:
        layer = TemplateLayer(
            template_id=template.id,
            layer_name=layer_meta.get("layer_name", ""),
            fabric_object_id=layer_meta.get("fabric_object_id", ""),
            is_ai_cutout_slot=layer_meta.get("is_ai_cutout_slot", False),
            psd_layer_index=layer_meta.get("psd_layer_index"),
            psd_layer_name=layer_meta.get("layer_name"),
        )
        db.add(layer)

    db.commit()
    db.refresh(template)
    return {
        "id": template.id,
        "name": template.name,
        "layer_count": len(layers),
        "cutout_slots": sum(1 for l in layers if l.get("is_ai_cutout_slot")),
        "message": "模板创建成功",
    }


@router.get("/list")
async def list_templates(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 显示公共模板 + 自己的模板
    query = db.query(Template).filter(
        (Template.is_public == True) | (Template.creator_id == current_user.id)
    )
    if category:
        query = query.filter(Template.category == category)
    templates = query.order_by(Template.created_at.desc()).all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "cover_image": t.cover_image,
            "canvas_width": t.canvas_width,
            "canvas_height": t.canvas_height,
            "category": t.category,
            "tags": t.tags,
            "layer_count": len(t.layers),
            "cutout_slots": sum(1 for l in t.layers if l.is_ai_cutout_slot),
        }
        for t in templates
    ]


@router.get("/{template_id}")
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(404, "模板不存在")
    return {
        "id": template.id,
        "name": template.name,
        "canvas_width": template.canvas_width,
        "canvas_height": template.canvas_height,
        "canvas_json": template.canvas_json,
        "layers": [
            {
                "fabric_object_id": l.fabric_object_id,
                "layer_name": l.layer_name,
                "is_ai_cutout_slot": l.is_ai_cutout_slot,
                "placeholder_text": l.placeholder_text,
            }
            for l in template.layers
        ],
    }
