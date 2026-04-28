#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "=============================="
echo " 智能在线设计平台 - 启动脚本"
echo "=============================="
echo ""

# ========== 后端 ==========
echo "[1/3] 安装后端依赖..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple -q 2>/dev/null || pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --break-system-packages -q 2>/dev/null

mkdir -p storage/{assets/{image,font,psd},fonts,projects,temp,layers}

echo "[2/3] 启动后端 (端口 8090)..."
uvicorn main:app --host 0.0.0.0 --port 8090 &
BACKEND_PID=$!
sleep 2

# ========== 前端 ==========
echo "[3/3] 启动前端 (端口 3000)..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    npm install
fi

npx vite --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!

echo ""
echo "=============================="
echo " 启动完成!"
echo " 前端: http://localhost:3000"
echo " 后端: http://localhost:8090"
echo " API文档: http://localhost:8090/docs"
echo "=============================="
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待任意子进程退出
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
