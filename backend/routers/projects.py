"""项目管理路由 — 含用户隔离"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.project import UserProject
from models.user import User
from services.auth import get_current_user
from services.image_composer import ImageComposer

router = APIRouter(prefix="/api/projects", tags=["项目管理"])


class ProjectSaveRequest(BaseModel):
    name: str = "未命名项目"
    canvas_width: int = 1080
    canvas_height: int = 1920
    canvas_json: dict
    referenced_asset_ids: list[int] = []
    source_template_id: Optional[int] = None


class ProjectExportRequest(BaseModel):
    canvas_json: dict
    format: str = "PNG"
    quality: int = 95


@router.post("/save")
async def save_project(
    req: ProjectSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = UserProject(
        user_id=current_user.id,
        name=req.name,
        canvas_width=req.canvas_width,
        canvas_height=req.canvas_height,
        canvas_json=req.canvas_json,
        referenced_asset_ids=req.referenced_asset_ids,
        source_template_id=req.source_template_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"id": project.id, "name": project.name, "message": "项目已保存"}


@router.put("/{project_id}")
async def update_project(
    project_id: int,
    req: ProjectSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(UserProject).filter(
        UserProject.id == project_id,
        UserProject.user_id == current_user.id,
    ).first()
    if not project:
        raise HTTPException(404, "项目不存在")

    project.name = req.name
    project.canvas_width = req.canvas_width
    project.canvas_height = req.canvas_height
    project.canvas_json = req.canvas_json
    project.referenced_asset_ids = req.referenced_asset_ids
    db.commit()
    return {"message": "项目已更新"}


@router.get("/list")
async def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = (
        db.query(UserProject)
        .filter(UserProject.user_id == current_user.id)
        .order_by(UserProject.updated_at.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "canvas_width": p.canvas_width,
            "canvas_height": p.canvas_height,
            "cover_image": p.cover_image,
            "is_template": p.is_template,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
        }
        for p in projects
    ]


@router.get("/{project_id}")
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(UserProject).filter(
        UserProject.id == project_id,
        UserProject.user_id == current_user.id,
    ).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    return {
        "id": project.id,
        "name": project.name,
        "canvas_width": project.canvas_width,
        "canvas_height": project.canvas_height,
        "canvas_json": project.canvas_json,
        "referenced_asset_ids": project.referenced_asset_ids,
        "source_template_id": project.source_template_id,
    }


@router.post("/export")
async def export_project(
    req: ProjectExportRequest,
    current_user: User = Depends(get_current_user),
):
    result = ImageComposer.compose(
        canvas_json=req.canvas_json,
        output_format=req.format,
        quality=req.quality,
    )
    return {"output_path": result["output_path"], "data_url": result["data_url"]}
