#!/bin/bash
# OpenCode Platform - 一鍵部署腳本

set -e

echo "🚀 OpenCode Platform 部署腳本"
echo "=================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 檢查 Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安裝${NC}"
        echo "請先安裝 Docker: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker 已安裝${NC}"
}

# 檢查 Docker Compose
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安裝${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose 已安裝${NC}"
}

# 檢查環境變數
check_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️ .env 文件不存在，從範本創建...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}請編輯 .env 文件設置 API 密鑰${NC}"
    fi
    
    # 檢查必要的環境變數
    source .env
    
    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your-openai-api-key" ]; then
        echo -e "${RED}❌ OPENAI_API_KEY 未設置${NC}"
        echo "請編輯 .env 文件設置正確的 API 密鑰"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 環境變數已配置${NC}"
}

# 建構映像
build_images() {
    echo ""
    echo "📦 建構 Docker 映像..."
    docker compose build --no-cache
    echo -e "${GREEN}✅ 映像建構完成${NC}"
}

# 啟動服務
start_services() {
    echo ""
    echo "🚀 啟動服務..."
    docker compose up -d
    echo -e "${GREEN}✅ 服務已啟動${NC}"
}

# 等待服務就緒
wait_for_services() {
    echo ""
    echo "⏳ 等待服務就緒..."
    
    # 等待 API
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null; then
            echo -e "${GREEN}✅ API 服務就緒${NC}"
            break
        fi
        echo "等待 API... ($i/30)"
        sleep 2
    done
    
    # 等待前端
    for i in {1..30}; do
        if curl -s http://localhost:80 > /dev/null 2>&1 || curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 前端服務就緒${NC}"
            break
        fi
        echo "等待前端... ($i/30)"
        sleep 2
    done
}

# 顯示狀態
show_status() {
    echo ""
    echo "=================================="
    echo "🎉 部署完成！"
    echo "=================================="
    echo ""
    echo "📊 服務狀態:"
    docker compose ps
    echo ""
    echo "🌐 訪問地址:"
    echo "  - 前端: http://localhost"
    echo "  - API:  http://localhost:8000"
    echo "  - API 文檔: http://localhost:8000/docs"
    echo ""
    echo "📝 預設帳號:"
    echo "  - 用戶名: admin"
    echo "  - 密碼: admin123"
    echo ""
    echo "📋 常用命令:"
    echo "  - 查看日誌: docker compose logs -f"
    echo "  - 停止服務: docker compose down"
    echo "  - 重啟服務: docker compose restart"
    echo ""
}

# 主函數
main() {
    echo ""
    check_docker
    check_docker_compose
    check_env
    
    echo ""
    read -p "是否開始部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消部署"
        exit 0
    fi
    
    build_images
    start_services
    wait_for_services
    show_status
}

# 處理參數
case "$1" in
    "start")
        docker compose up -d
        ;;
    "stop")
        docker compose down
        ;;
    "restart")
        docker compose restart
        ;;
    "logs")
        docker compose logs -f
        ;;
    "status")
        docker compose ps
        ;;
    "build")
        build_images
        ;;
    *)
        main
        ;;
esac
