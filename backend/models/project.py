"""用户项目模型"""
from datetime import datetime
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, JSON, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class UserProject(Base):
    """
    用户个人设计项目
    保存 Fabric.js canvas JSON，支持持久化和导出
    """
    __tablename__ = "user_projects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(128), default="未命名项目")
    # 画布尺寸
    canvas_width: Mapped[int] = mapped_column(Integer, default=1080)
    canvas_height: Mapped[int] = mapped_column(Integer, default=1920)
    # ★ 核心数据: Fabric.js canvas JSON
    canvas_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # 封面图路径 (导出/保存时自动生成)
    cover_image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # 项目中引用的素材 ID 列表 (JSON 数组)
    referenced_asset_ids: Mapped[list | None] = mapped_column(
        JSON, nullable=True, default=list
    )
    # 是否已转为模板
    is_template: Mapped[bool] = mapped_column(Boolean, default=False)
    # 关联的模板 ID (若从模板创建)
    source_template_id: Mapped[int | None] = mapped_column(
        ForeignKey("templates.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # 关联
    owner = relationship("User", back_populates="projects")
    source_template = relationship("Template")
