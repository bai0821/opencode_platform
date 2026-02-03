# 🚀 快速啟動指南

5 分鐘內啟動 OpenCode Platform！

---

## 📋 前置需求

確保已安裝：

| 軟體 | 版本 | 檢查命令 |
|------|------|----------|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| Docker | 20+ | `docker --version` |
| Git | 2.0+ | `git --version` |

---

## ⚡ 一鍵啟動（5 步驟）

### Step 1: 克隆專案

```bash
git clone https://github.com/bai0821/opencode_platform.git
cd opencode_platform
```

### Step 2: 設置 API Keys

```bash
cp .env.example .env
```

編輯 `.env`，填入你的 API Keys：

```env
OPENAI_API_KEY=sk-proj-xxx        # 必填
COHERE_API_KEY=xxx                # 必填（用於 Embedding）
JWT_SECRET=your-secret-key        # 必填（安全密鑰）
```

> 📌 **取得 API Keys:**
> - OpenAI: https://platform.openai.com/api-keys
> - Cohere: https://dashboard.cohere.com/api-keys

### Step 3: 啟動 Qdrant

```bash
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
```

### Step 4: 安裝依賴

```bash
# 後端
pip install -r requirements.txt

# 前端
cd frontend && npm install && cd ..
```

### Step 5: 啟動服務

**終端 1 - 後端：**
```bash
python run.py api
```

**終端 2 - 前端：**
```bash
cd frontend && npm run dev
```

---

## 🎉 完成！

打開瀏覽器訪問：

| 服務 | 網址 |
|------|------|
| 🖥️ 前端介面 | http://localhost:5173 |
| 📡 API 文檔 | http://localhost:8000/docs |
| 🗄️ Qdrant | http://localhost:6333/dashboard |

**預設登入：**
- 帳號: `admin`
- 密碼: `admin123`（或 .env 中設定的）

---

## 🔧 常見問題

### ❌ Qdrant 連接失敗

```bash
# 確認容器運行中
docker ps | grep qdrant

# 如果沒有，重新啟動
docker start qdrant
```

### ❌ 前端連不上後端

確認後端在 8000 端口運行：
```bash
curl http://localhost:8000/health
```

### ❌ API Key 錯誤

確認 `.env` 文件：
- 沒有多餘空格
- Key 格式正確
- 文件已保存

---

## 📚 下一步

- 📖 閱讀 [完整文檔](README.md)
- 🧩 開發 [插件](plugins/PLUGIN_DEV_GUIDE.md)
- 🐳 部署 [Docker](DEPLOYMENT.md)

---

**遇到問題？** 開 [Issue](https://github.com/bai0821/opencode_platform/issues) 告訴我們！
