#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}启动 Evelyn AI 学习助手...${NC}"

# 检查是否安装了必要的依赖
echo -e "${BLUE}检查依赖...${NC}"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}未找到 Python3，请安装 Python3${NC}"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}未找到 Node.js，请安装 Node.js${NC}"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}未找到 npm，请安装 npm${NC}"
    exit 1
fi

# 检查 Ollama
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}未找到 Ollama，请安装 Ollama${NC}"
    exit 1
fi

# 检查 Ollama 模型
echo -e "${BLUE}检查 Ollama 模型...${NC}"
if ! ollama list | grep -q "deepseek-r1:8b"; then
    echo -e "${BLUE}正在拉取 deepseek-r1:8b 模型...${NC}"
    ollama pull deepseek-r1:8b
fi

if ! ollama list | grep -q "bge-m3:latest"; then
    echo -e "${BLUE}正在拉取 bge-m3:latest 模型...${NC}"
    ollama pull bge-m3:latest
fi

# 启动后端
echo -e "${BLUE}启动后端服务...${NC}"
cd backend
pip install -r requirements.txt
python3 app.py &
BACKEND_PID=$!
echo -e "${GREEN}后端服务已启动，PID: ${BACKEND_PID}${NC}"

# 等待后端启动
echo -e "${BLUE}等待后端服务启动...${NC}"
sleep 3

# 启动前端
echo -e "${BLUE}启动前端服务...${NC}"
cd ../extension
npm install
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}前端服务已启动，PID: ${FRONTEND_PID}${NC}"

# 注册退出处理函数
function cleanup {
    echo -e "${BLUE}正在关闭服务...${NC}"
    kill $BACKEND_PID
    kill $FRONTEND_PID
    echo -e "${GREEN}服务已关闭${NC}"
    exit 0
}

trap cleanup SIGINT

echo -e "${GREEN}Evelyn AI 学习助手已启动${NC}"
echo -e "${GREEN}后端服务地址: http://127.0.0.1:5000${NC}"
echo -e "${GREEN}请在 Chrome 扩展程序页面加载插件: chrome://extensions/${NC}"
echo -e "${GREEN}按 Ctrl+C 停止服务${NC}"

# 保持脚本运行
wait