# OpenCode Platform - 雲端部署指南

## 📋 目錄

1. [系統需求](#系統需求)
2. [快速開始](#快速開始)
3. [Docker Compose 部署](#docker-compose-部署)
4. [Kubernetes 部署](#kubernetes-部署)
5. [反向代理配置](#反向代理配置)
6. [SSL/HTTPS 配置](#sslhttps-配置)
7. [環境變數](#環境變數)
8. [監控與日誌](#監控與日誌)
9. [備份與還原](#備份與還原)
10. [常見問題](#常見問題)

---

## 系統需求

### 最低配置

| 項目 | 規格 |
|------|------|
| CPU | 2 核心 |
| 記憶體 | 4 GB |
| 硬碟 | 20 GB SSD |
| 作業系統 | Ubuntu 22.04+ / CentOS 8+ |

### 推薦配置

| 項目 | 規格 |
|------|------|
| CPU | 4 核心 |
| 記憶體 | 8 GB |
| 硬碟 | 50 GB SSD |
| 作業系統 | Ubuntu 22.04 LTS |

### 必要軟體

- Docker 24.0+
- Docker Compose 2.20+
- Git

---

## 快速開始

### 1. 安裝 Docker

```bash
# Ubuntu
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 重新登入後驗證
docker --version
docker compose version
```

### 2. 下載專案

```bash
git clone https://github.com/your-repo/opencode-platform.git
cd opencode-platform
```

### 3. 配置環境變數

```bash
cp .env.example .env
nano .env
```

編輯 `.env` 文件：

```env
# API 密鑰（必填）
OPENAI_API_KEY=sk-your-openai-key
COHERE_API_KEY=your-cohere-key

# JWT 密鑰（生產環境務必修改）
JWT_SECRET_KEY=your-super-secret-key-change-this

# 端口配置
API_PORT=8000
FRONTEND_PORT=80
QDRANT_PORT=6333
```

### 4. 啟動服務

```bash
# 啟動所有服務
docker compose up -d

# 查看狀態
docker compose ps

# 查看日誌
docker compose logs -f
```

### 5. 訪問

- 前端：http://your-server-ip
- API：http://your-server-ip:8000
- API 文檔：http://your-server-ip:8000/docs

---

## Docker Compose 部署

### 服務架構

```
┌─────────────────────────────────────────────────────────────┐
│                     Nginx (80/443)                         │
│                    反向代理 + SSL                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Frontend │   │   API    │   │  Qdrant  │
    │  (3000)  │   │  (8000)  │   │  (6333)  │
    └──────────┘   └────┬─────┘   └──────────┘
                        │
                        ▼
                  ┌──────────┐
                  │ Sandbox  │
                  │ (Docker) │
                  └──────────┘
```

### 生產部署命令

```bash
# 拉取最新代碼
git pull origin main

# 構建映像
docker compose build --no-cache

# 啟動服務（背景執行）
docker compose up -d

# 驗證服務狀態
docker compose ps

# 健康檢查
curl http://localhost:8000/health
```

### 更新部署

```bash
# 拉取更新
git pull

# 重建並重啟
docker compose build
docker compose up -d --force-recreate

# 只重啟特定服務
docker compose restart backend
```

### 停止服務

```bash
# 停止但保留數據
docker compose down

# 停止並刪除所有數據
docker compose down -v
```

---

## 反向代理配置

### Nginx 配置

創建 `nginx/nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # 重定向到 HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL 優化
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

        # 前端
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # API
        location /api/ {
            proxy_pass http://api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # SSE 支援
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 300s;
        }

        # WebSocket
        location /ws/ {
            proxy_pass http://api/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

---

## SSL/HTTPS 配置

### 使用 Let's Encrypt

```bash
# 安裝 Certbot
sudo apt install certbot

# 獲取證書
sudo certbot certonly --standalone -d your-domain.com

# 複製證書
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/

# 自動續期
sudo certbot renew --dry-run
```

### 使用自簽證書（測試用）

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=localhost"
```

---

## 環境變數

### 完整環境變數列表

```env
# ===================
# API 密鑰（必填）
# ===================
OPENAI_API_KEY=sk-...
COHERE_API_KEY=...

# ===================
# 安全配置
# ===================
JWT_SECRET_KEY=your-super-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# ===================
# 服務端口
# ===================
API_PORT=8000
FRONTEND_PORT=80
QDRANT_PORT=6333

# ===================
# 資料庫配置
# ===================
QDRANT_HOST=qdrant
QDRANT_COLLECTION=opencode_documents

# ===================
# 日誌配置
# ===================
LOG_LEVEL=INFO
LOG_FORMAT=json

# ===================
# 沙箱配置
# ===================
SANDBOX_TIMEOUT=60
SANDBOX_MEMORY_LIMIT=512m
SANDBOX_CPU_LIMIT=1

# ===================
# 其他
# ===================
CORS_ORIGINS=*
MAX_UPLOAD_SIZE=20971520
```

---

## 監控與日誌

### 查看日誌

```bash
# 所有服務
docker compose logs -f

# 特定服務
docker compose logs -f backend

# 最近 100 行
docker compose logs --tail=100 backend
```

### 健康檢查

```bash
# API 健康檢查
curl http://localhost:8000/health

# Qdrant 健康檢查
curl http://localhost:6333/health

# 系統狀態
curl http://localhost:8000/stats
```

### 資源監控

```bash
# 容器資源使用
docker stats

# 磁碟使用
docker system df
```

---

## 備份與還原

### 備份

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR=/backup/opencode
DATE=$(date +%Y%m%d_%H%M%S)

# 創建備份目錄
mkdir -p $BACKUP_DIR

# 備份 Qdrant 數據
docker compose exec qdrant tar -czf - /qdrant/storage > $BACKUP_DIR/qdrant_$DATE.tar.gz

# 備份應用數據
tar -czf $BACKUP_DIR/data_$DATE.tar.gz ./data

# 備份配置
cp .env $BACKUP_DIR/env_$DATE.bak

echo "Backup completed: $BACKUP_DIR"
```

### 還原

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

# 停止服務
docker compose down

# 還原 Qdrant
docker run --rm -v qdrant_data:/restore -v $PWD:/backup alpine \
  tar -xzf /backup/qdrant_*.tar.gz -C /restore

# 還原應用數據
tar -xzf data_*.tar.gz

# 重啟服務
docker compose up -d
```

---

## 常見問題

### Q: 容器無法啟動

```bash
# 查看詳細日誌
docker compose logs backend

# 檢查配置
docker compose config
```

### Q: API 密鑰錯誤

確認 `.env` 文件中的 API 密鑰正確，且沒有多餘空格。

### Q: 無法連接 Qdrant

```bash
# 檢查 Qdrant 是否運行
docker compose ps qdrant

# 測試連接
curl http://localhost:6333/health
```

### Q: 前端無法連接 API

檢查 Nginx 配置中的 `proxy_pass` 設定是否正確。

### Q: 記憶體不足

增加 Docker 記憶體限制或升級伺服器配置。

---

## 聯繫支援

- GitHub Issues: https://github.com/your-repo/opencode-platform/issues
- Email: support@opencode.dev
