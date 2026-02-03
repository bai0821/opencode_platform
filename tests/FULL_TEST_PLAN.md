# OpenCode Platform v4.0 - 完整測試計劃

> **版本**: v4.0
> **日期**: 2025-01-27
> **目的**: 逐一驗證所有功能，排查問題

---

## 📊 測試總覽

| 階段 | 測試項目數 | 預估時間 |
|------|-----------|----------|
| 0. 環境準備 | 5 | 10 分鐘 |
| 1. RAG 核心 | 12 | 20 分鐘 |
| 2. MCP Services | 10 | 15 分鐘 |
| 3. 企業功能 | 15 | 20 分鐘 |
| 4. 進階功能 | 12 | 20 分鐘 |
| **總計** | **54** | **~85 分鐘** |

---

## 🔧 Phase 0：環境準備

### 0.1 依賴檢查

```powershell
# 檢查 Python 版本
python --version
# 預期: Python 3.10+

# 檢查 Node.js 版本
node --version
# 預期: v18+

# 檢查 Docker
docker --version
docker-compose --version
```

| # | 檢查項目 | 命令 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 0.1.1 | Python 版本 | `python --version` | 3.10+ | | ⬜ |
| 0.1.2 | Node.js 版本 | `node --version` | 18+ | | ⬜ |
| 0.1.3 | Docker | `docker --version` | 已安裝 | | ⬜ |

### 0.2 依賴安裝

```powershell
# Python 依賴
pip install -r requirements.txt

# 前端依賴
cd frontend
npm install
```

| # | 檢查項目 | 命令 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 0.2.1 | Python 依賴 | `pip install -r requirements.txt` | 無錯誤 | | ⬜ |
| 0.2.2 | 前端依賴 | `npm install` | 無錯誤 | | ⬜ |

### 0.3 環境變數

```powershell
# 複製並編輯 .env
copy .env.example .env
# 填入 OPENAI_API_KEY（必要）
# 填入 COHERE_API_KEY（推薦）
```

| # | 檢查項目 | 預期結果 | 實際結果 | 狀態 |
|---|---------|---------|---------|------|
| 0.3.1 | .env 存在 | 文件已創建 | | ⬜ |
| 0.3.2 | OPENAI_API_KEY | 已設置 | | ⬜ |

### 0.4 服務啟動

```powershell
# 方式 1: 使用啟動腳本
.\start.ps1 -ResetQdrant

# 方式 2: 手動啟動
# Terminal 1: Qdrant
docker run -d -p 6333:6333 --name qdrant qdrant/qdrant

# Terminal 2: 後端
cd src
set PYTHONPATH=%CD%
uvicorn opencode.api.main:app --reload --port 8000

# Terminal 3: 前端
cd frontend
npm run dev
```

| # | 檢查項目 | 驗證方式 | 預期結果 | 實際結果 | 狀態 |
|---|---------|---------|---------|---------|------|
| 0.4.1 | Qdrant | http://localhost:6333 | 返回 JSON | | ⬜ |
| 0.4.2 | 後端 API | http://localhost:8000/health | `{"status": "ok"}` | | ⬜ |
| 0.4.3 | 前端 | http://localhost:5173 | 顯示登入頁 | | ⬜ |

---

## 📚 Phase 1：RAG 核心功能

### 1.1 健康檢查 API

```bash
# 測試命令
curl http://localhost:8000/health
curl http://localhost:8000/stats
```

| # | 測試項目 | API | 預期結果 | 實際結果 | 狀態 |
|---|---------|-----|---------|---------|------|
| 1.1.1 | Health Check | GET /health | status: ok | | ⬜ |
| 1.1.2 | Stats | GET /stats | 返回統計資料 | | ⬜ |

### 1.2 文件上傳

```bash
# 測試命令（需要準備一個 PDF 文件）
curl -X POST http://localhost:8000/upload \
  -F "file=@test.pdf"
```

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 1.2.1 | 上傳 PDF | 上傳任意 PDF | 成功，返回文件資訊 | | ⬜ |
| 1.2.2 | 上傳非 PDF | 上傳 .txt 文件 | 錯誤提示 | | ⬜ |
| 1.2.3 | 文件列表 | GET /documents | 顯示已上傳文件 | | ⬜ |

### 1.3 語意搜尋

```bash
# 測試命令
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "測試查詢", "top_k": 5}'
```

| # | 測試項目 | 查詢 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 1.3.1 | 基本搜尋 | "測試查詢" | 返回相關結果 | | ⬜ |
| 1.3.2 | 英文搜尋 | "test query" | 返回相關結果 | | ⬜ |
| 1.3.3 | 空查詢 | "" | 錯誤提示 | | ⬜ |

### 1.4 串流對話

```bash
# 測試命令（SSE 串流）
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "這篇文章在講什麼？", "session_id": "test"}'
```

| # | 測試項目 | 訊息 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 1.4.1 | 基本對話 | "你好" | 串流回應 | | ⬜ |
| 1.4.2 | RAG 問答 | "這篇在講什麼" | 思考過程 + 回答 | | ⬜ |
| 1.4.3 | 指定文件 | 勾選文件後提問 | 只搜尋選中文件 | | ⬜ |

### 1.5 前端功能

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 1.5.1 | 對話介面 | 發送訊息 | 顯示思考過程和回答 | | ⬜ |
| 1.5.2 | 文件管理 | 切換到文件頁 | 顯示文件列表 | | ⬜ |
| 1.5.3 | PDF 預覽 | 點擊預覽 | 顯示 PDF 內容 | | ⬜ |
| 1.5.4 | 文件選擇 | 勾選文件 | 顯示已選數量 | | ⬜ |

---

## 🔌 Phase 2：MCP Services

### 2.1 Sandbox（程式碼執行）

```bash
# 測試命令
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "用 Python 計算 1+1"}'
```

| # | 測試項目 | 訊息 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 2.1.1 | 簡單計算 | "計算 1+1" | 執行 Python，返回 2 | | ⬜ |
| 2.1.2 | 圖表生成 | "畫一個正弦波" | 返回 base64 圖片 | | ⬜ |
| 2.1.3 | 超時處理 | "無限迴圈" | 超時錯誤 | | ⬜ |

**注意**: Sandbox 需要先建立 Docker image：
```bash
cd docker/sandbox
docker build -t opencode-sandbox .
```

### 2.2 Web Search（網路搜尋）

```bash
# 測試命令
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "搜尋最新的 AI 新聞"}'
```

| # | 測試項目 | 訊息 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 2.2.1 | 網路搜尋 | "最新 AI 新聞" | 返回搜尋結果 | | ⬜ |
| 2.2.2 | 搜尋摘要 | "OpenAI 最新動態" | 搜尋並摘要 | | ⬜ |

### 2.3 RepoOps（Git 操作）

```bash
# 測試命令
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Clone https://github.com/example/repo"}'
```

| # | 測試項目 | 訊息 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 2.3.1 | Git Clone | "Clone 某 repo" | 成功 clone | | ⬜ |
| 2.3.2 | Git Status | "查看 git 狀態" | 顯示狀態 | | ⬜ |

### 2.4 Research（深度研究）

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 2.4.1 | 研究頁面 | 切換到研究頁 | 顯示研究介面 | | ⬜ |
| 2.4.2 | 啟動研究 | 輸入主題，開始 | 顯示進度 | | ⬜ |
| 2.4.3 | 研究報告 | 等待完成 | 生成報告 | | ⬜ |

---

## 🏢 Phase 3：企業功能

### 3.1 用戶認證

```bash
# 註冊
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "test123"}'

# 登入
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 3.1.1 | 預設管理員登入 | admin/admin123 | 成功，返回 token | | ⬜ |
| 3.1.2 | 用戶註冊 | 新用戶名/密碼 | 成功 | | ⬜ |
| 3.1.3 | 重複用戶名 | 已存在的用戶名 | 錯誤提示 | | ⬜ |
| 3.1.4 | 錯誤密碼 | 錯誤密碼登入 | 401 錯誤 | | ⬜ |
| 3.1.5 | 獲取當前用戶 | GET /auth/me | 返回用戶資訊 | | ⬜ |

### 3.2 RBAC 權限

```bash
# 使用 token 訪問管理員 API
curl http://localhost:8000/auth/users \
  -H "Authorization: Bearer <admin_token>"

# 使用普通用戶 token
curl http://localhost:8000/auth/users \
  -H "Authorization: Bearer <viewer_token>"
```

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 3.2.1 | Admin 訪問用戶列表 | GET /auth/users | 成功 | | ⬜ |
| 3.2.2 | Viewer 訪問用戶列表 | GET /auth/users | 403 禁止 | | ⬜ |
| 3.2.3 | Admin 創建用戶 | POST /auth/users | 成功 | | ⬜ |
| 3.2.4 | Admin 修改用戶角色 | PUT /auth/users/{id} | 成功 | | ⬜ |

### 3.3 審計日誌

```bash
# 獲取審計日誌（需要 admin token）
curl http://localhost:8000/audit/logs \
  -H "Authorization: Bearer <admin_token>"

# 獲取統計
curl http://localhost:8000/audit/stats \
  -H "Authorization: Bearer <admin_token>"
```

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 3.3.1 | 獲取日誌 | GET /audit/logs | 返回日誌列表 | | ⬜ |
| 3.3.2 | 獲取統計 | GET /audit/stats | 返回統計資料 | | ⬜ |
| 3.3.3 | 日誌篩選 | ?action=login | 只返回登入日誌 | | ⬜ |
| 3.3.4 | 操作被記錄 | 執行任意操作 | 產生新日誌 | | ⬜ |

### 3.4 成本追蹤

```bash
# 獲取成本儀表板
curl http://localhost:8000/cost/dashboard \
  -H "Authorization: Bearer <admin_token>"
```

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 3.4.1 | 成本儀表板 | GET /cost/dashboard | 返回成本數據 | | ⬜ |
| 3.4.2 | 每日成本 | GET /cost/daily | 返回今日成本 | | ⬜ |
| 3.4.3 | LLM 調用記錄 | 發送對話 | 成本增加 | | ⬜ |

### 3.5 前端管理介面

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 3.5.1 | 登入頁面 | 訪問首頁 | 顯示登入表單 | | ⬜ |
| 3.5.2 | 登入成功 | admin/admin123 | 進入主介面 | | ⬜ |
| 3.5.3 | 管理員選單 | 登入後 | 顯示用戶/成本/日誌 | | ⬜ |
| 3.5.4 | 用戶管理頁 | 點擊用戶 | 顯示用戶列表 | | ⬜ |
| 3.5.5 | 成本頁面 | 點擊成本 | 顯示成本圖表 | | ⬜ |
| 3.5.6 | 日誌頁面 | 點擊日誌 | 顯示審計日誌 | | ⬜ |
| 3.5.7 | 登出 | 點擊登出 | 返回登入頁 | | ⬜ |

---

## 🚀 Phase 4：進階功能

### 4.1 插件系統

```bash
# 發現插件
curl -X POST http://localhost:8000/plugins/discover \
  -H "Authorization: Bearer <admin_token>"

# 列出插件
curl http://localhost:8000/plugins

# 載入插件
curl -X POST http://localhost:8000/plugins/example-translator/load \
  -H "Authorization: Bearer <admin_token>"
```

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 4.1.1 | 發現插件 | POST /plugins/discover | 找到示例插件 | | ⬜ |
| 4.1.2 | 列出插件 | GET /plugins | 顯示插件列表 | | ⬜ |
| 4.1.3 | 載入插件 | POST /plugins/{id}/load | 成功載入 | | ⬜ |
| 4.1.4 | 啟用插件 | POST /plugins/{id}/enable | 成功啟用 | | ⬜ |

### 4.2 技能市場

```bash
# 列出技能
curl http://localhost:8000/marketplace/skills

# 創建技能
curl -X POST http://localhost:8000/marketplace/skills \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "測試技能", "description": "測試用"}'
```

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 4.2.1 | 列出技能 | GET /marketplace/skills | 返回技能列表 | | ⬜ |
| 4.2.2 | 創建技能 | POST /marketplace/skills | 成功創建 | | ⬜ |
| 4.2.3 | 獲取分類 | GET /marketplace/categories | 返回分類列表 | | ⬜ |
| 4.2.4 | 下載技能 | GET /skills/{id}/download | 返回 zip 文件 | | ⬜ |

### 4.3 多 Agent 協作

```bash
# 列出 Agent
curl http://localhost:8000/agents

# 創建 Agent
curl -X POST http://localhost:8000/agents \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Researcher", "role": "researcher"}'

# 執行工作流
curl -X POST http://localhost:8000/agents/workflow \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"steps": [{"role": "researcher", "task": {"topic": "AI"}}]}'
```

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 4.3.1 | 獲取角色列表 | GET /agents/roles | 返回角色列表 | | ⬜ |
| 4.3.2 | 創建 Agent | POST /agents | 成功創建 | | ⬜ |
| 4.3.3 | 列出 Agent | GET /agents | 顯示已創建的 | | ⬜ |
| 4.3.4 | 執行工作流 | POST /agents/workflow | 返回結果 | | ⬜ |

### 4.4 Docker 部署

```bash
# 構建並啟動
docker-compose up -d

# 檢查狀態
docker-compose ps

# 查看日誌
docker-compose logs -f backend
```

| # | 測試項目 | 操作 | 預期結果 | 實際結果 | 狀態 |
|---|---------|------|---------|---------|------|
| 4.4.1 | 構建後端 | docker-compose build backend | 成功 | | ⬜ |
| 4.4.2 | 構建前端 | docker-compose build frontend | 成功 | | ⬜ |
| 4.4.3 | 啟動服務 | docker-compose up -d | 所有服務運行 | | ⬜ |
| 4.4.4 | 訪問前端 | http://localhost | 顯示登入頁 | | ⬜ |

---

## 🐛 問題記錄表

| # | 發現時間 | 測試項目 | 問題描述 | 錯誤訊息 | 優先級 | 狀態 |
|---|---------|---------|---------|---------|--------|------|
| 1 | | | | | | ⬜ |
| 2 | | | | | | ⬜ |
| 3 | | | | | | ⬜ |
| 4 | | | | | | ⬜ |
| 5 | | | | | | ⬜ |

---

## 📝 測試執行步驟

### 建議順序

1. **Phase 0** - 確保環境就緒
2. **Phase 3.1** - 先測試認證（後續測試需要 token）
3. **Phase 1** - 測試核心 RAG 功能
4. **Phase 2** - 測試 MCP 服務
5. **Phase 3.2-3.5** - 測試其餘企業功能
6. **Phase 4** - 測試進階功能

### 快速測試腳本

```powershell
# test_quick.ps1 - 快速 API 測試

$BASE = "http://localhost:8000"

Write-Host "=== Phase 0: Health Check ===" -ForegroundColor Cyan
Invoke-RestMethod "$BASE/health"

Write-Host "`n=== Phase 3.1: Login ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Method POST "$BASE/auth/login" `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'
$token = $login.access_token
Write-Host "Token: $($token.Substring(0,20))..."

Write-Host "`n=== Phase 1: Documents ===" -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod "$BASE/documents"

Write-Host "`n=== Phase 3.3: Audit ===" -ForegroundColor Cyan
Invoke-RestMethod "$BASE/audit/stats" -Headers $headers

Write-Host "`n=== Phase 4.1: Plugins ===" -ForegroundColor Cyan
Invoke-RestMethod "$BASE/plugins"

Write-Host "`n=== All basic checks passed! ===" -ForegroundColor Green
```

---

## ✅ 測試完成檢查清單

- [ ] Phase 0: 環境準備 (5/5)
- [ ] Phase 1: RAG 核心 (12/12)
- [ ] Phase 2: MCP Services (10/10)
- [ ] Phase 3: 企業功能 (15/15)
- [ ] Phase 4: 進階功能 (12/12)

**總計**: 0/54 完成

---

## 📌 注意事項

1. **測試前確保**：
   - Qdrant 運行中
   - .env 已配置
   - 後端和前端已啟動

2. **Sandbox 測試**：
   - 需要先 build Docker image
   - 確保 Docker daemon 運行中

3. **網路搜尋**：
   - DuckDuckGo 免費但有限制
   - 建議設置 TAVILY_API_KEY

4. **遇到問題時**：
   - 記錄到問題記錄表
   - 包含完整錯誤訊息
   - 標記優先級
