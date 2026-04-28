"""
智能在线设计平台 — FastAPI 主入口

启动: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
from routers import assets, projects, templates, ai, auth
from config import settings

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="智能在线设计平台",
    version="1.0.0",
    description="PSD × Canvas × AI × 素材库 × 持久化",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务
app.mount("/static/assets", StaticFiles(directory=str(settings.ASSETS_DIR)), name="assets")
app.mount("/static/fonts", StaticFiles(directory=str(settings.FONTS_DIR)), name="fonts")
app.mount("/static/temp", StaticFiles(directory=str(settings.TEMP_DIR)), name="temp")
app.mount("/static/layers", StaticFiles(directory=str(settings.LAYERS_DIR)), name="layers")

# 注册路由
app.include_router(auth.router)
app.include_router(assets.router)
app.include_router(projects.router)
app.include_router(templates.router)
app.include_router(ai.router)


@app.get("/")
async def root():
    return {
        "name": "智能在线设计平台",
        "version": "1.0.0",
        "endpoints": {
            "认证": "/api/auth",
            "素材管理": "/api/assets",
            "项目管理": "/api/projects",
            "模板管理": "/api/templates",
            "AI 服务": "/api/ai",
            "API 文档": "/docs",
        },
    }
