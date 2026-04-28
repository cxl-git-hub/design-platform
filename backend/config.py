"""应用配置"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # 数据库 (MySQL 生产环境)
    DB_URL: str = "mysql+pymysql://user:password@ip:3306/design_platform"

    # JWT
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 天

    # 存储路径
    STORAGE_ROOT: Path = Path(__file__).parent / "storage"
    ASSETS_DIR: Path = STORAGE_ROOT / "assets"
    FONTS_DIR: Path = STORAGE_ROOT / "fonts"
    PROJECTS_DIR: Path = STORAGE_ROOT / "projects"
    TEMP_DIR: Path = STORAGE_ROOT / "temp"
    LAYERS_DIR: Path = STORAGE_ROOT / "layers"

    # 上传限制
    MAX_UPLOAD_SIZE: int = 200 * 1024 * 1024  # 50MB

    class Config:
        env_file = ".env"


settings = Settings()

# 确保目录存在
for d in [
    settings.ASSETS_DIR,
    settings.FONTS_DIR,
    settings.PROJECTS_DIR,
    settings.TEMP_DIR,
    settings.LAYERS_DIR,
]:
    d.mkdir(parents=True, exist_ok=True)
