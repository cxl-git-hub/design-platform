# 智能在线设计平台

## 快速启动

```bash
chmod +x start.sh
./start.sh
```

启动后访问 http://localhost:3000

## 手动启动

### 后端
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

## 技术栈

- **前端**: React + TypeScript + Vite + Fabric.js v6 + TailwindCSS + Zustand
- **后端**: Python + FastAPI + SQLAlchemy + psd-tools + rembg + Pillow
- **数据库**: SQLite (开发阶段)

## 功能清单

- [x] 用户注册/登录 (JWT)
- [x] 空白画布创作 (文字/矩形/圆形)
- [x] 导入 PSD 文件 (分流: 临时打开 / 保存为模板)
- [x] 素材管理 (上传/列表/拖入画布)
- [x] 模板系统 (从 PSD 创建 / 加载模板)
- [x] AI 抠图占位符 ([cutout] 标记)
- [x] 属性面板 (位置/尺寸/旋转/透明度/文字/形状)
- [x] 图层管理 (排序/删除)
- [x] 撤销/重做 (Ctrl+Z / Ctrl+Shift+Z)
- [x] 画布背景色
- [x] 导出 PNG/JPEG
- [x] 项目保存/加载
- [x] 拖拽本地图片到画布

## API 文档

启动后访问 http://localhost:8000/docs (Swagger UI)
