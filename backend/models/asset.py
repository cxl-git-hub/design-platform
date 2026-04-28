"""素材模型 — 支持图片/字体/PSD三种类型，含分流标记"""
from datetime import datetime
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, JSON, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Asset(Base):
    """
    素材表

    分流逻辑说明:
    - 当用户上传 PSD 时，若选择「仅作为当前项目打开」，
      则 save_to_library=False，该记录仅供当前会话引用。
    - 若选择「保存为我的素材/模板」，则 save_to_library=True，
      永久入库，可在素材面板复用。
    """
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    # 类型: image / font / psd
    type: Mapped[str] = mapped_column(String(16), index=True)
    # 原始文件名
    original_name: Mapped[str] = mapped_column(String(256))
    # 存储路径 (相对 storage root)
    file_path: Mapped[str] = mapped_column(String(512))
    # 缩略图路径 (仅图片/PSD)
    thumbnail_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # MIME 类型
    mime_type: Mapped[str] = mapped_column(String(64))
    # 文件大小 (bytes)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    # 是否公开 (系统素材 = True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    # ★ 核心分流字段: True=永久入库, False=临时引用
    save_to_library: Mapped[bool] = mapped_column(Boolean, default=True)
    # 标签 (JSON 数组, 便于前端筛选)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    # 元信息 (图片尺寸、字体家族名、PSD图层数等)
    meta_info: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # 关联的临时项目 token (当 save_to_library=False 时使用)
    temp_session_token: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # 关联
    owner = relationship("User", back_populates="assets")
