"""模板与模板图层模型"""
from datetime import datetime
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, JSON, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Template(Base):
    """
    公共模板 / 用户私有模板
    存储 PSD 解析后的 Fabric.js JSON 结构
    """
    __tablename__ = "templates"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # 封面图路径
    cover_image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # 画布尺寸
    canvas_width: Mapped[int] = mapped_column(Integer, default=1080)
    canvas_height: Mapped[int] = mapped_column(Integer, default=1920)
    # Fabric.js JSON (核心数据)
    canvas_json: Mapped[dict] = mapped_column(JSON)
    # 分类标签
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    # 来源: 创建者 (NULL = 系统公共)
    creator_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # 关联
    layers = relationship(
        "TemplateLayer", back_populates="template",
        cascade="all, delete-orphan", lazy="selectin"
    )
    creator = relationship("User")


class TemplateLayer(Base):
    """
    模板图层配置表
    标记哪些图层是 AI 抠图占位符
    """
    __tablename__ = "template_layers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    template_id: Mapped[int] = mapped_column(
        ForeignKey("templates.id", ondelete="CASCADE"), index=True
    )
    # 图层在 Fabric.js 中的 object name (对应 PSD 图层名)
    layer_name: Mapped[str] = mapped_column(String(256))
    # 图层在 canvas JSON 中的 fabric object id
    fabric_object_id: Mapped[str] = mapped_column(String(64), index=True)
    # ★ 是否为 AI 抠图占位符
    is_ai_cutout_slot: Mapped[bool] = mapped_column(Boolean, default=False)
    # 占位符的默认提示文案
    placeholder_text: Mapped[str | None] = mapped_column(
        String(128), nullable=True, default="上传照片"
    )
    # 图层原始 PSD 信息
    psd_layer_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    psd_layer_name: Mapped[str | None] = mapped_column(
        String(256), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # 关联
    template = relationship("Template", back_populates="layers")
