# OpenCode Platform - 專案開發指南

> **版本**: v1.0 (Phase 1 完成)
> **更新日期**: 2025-01-26
> **用途**: 供新對話快速了解專案現況並繼續開發

---

## 📦 專案基本資訊

| 項目 | 說明 |
|------|------|
| **專案名稱** | OpenCode Platform |
| **GitHub** | https://github.com/Zenobia000/core_agentic_brain.git |
| **分支** | bai0821-opencode-v1 |
| **本地路徑** | C:\Users\epicp\Desktop\opencode-platform |
| **部署環境** | Windows 11 + Python 3.13 + Node.js 18+ |

---

## ✅ Phase 1 已完成功能

### 核心功能
- [x] **RAG 問答系統** - 上傳 PDF，語意搜尋，生成回答
- [x] **多語言支援** - Cohere embed-multilingual-v3.0
- [x] **口語化理解** - 「這篇在講啥」→ 自動分解為多個搜尋查詢
- [x] **思考過程視覺化** - 類似 ChatGPT/Manus 的步驟顯示
- [x] **串流回應** - SSE 即時顯示生成內容
- [x] **PDF 預覽** - 內建預覽器，支援下載

### 技術棧
| 層級 | 技術 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS |
| 後端 | FastAPI + Uvicorn |
| 向量庫 | Qdrant (localhost:6333) |
| Embedding | Cohere embed-multilingual-v3.0 (1024 維) |
| LLM | OpenAI GPT-4o |
| PDF 解析 | Docling + PyMuPDF (fallback) |

---

## 🏗 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│   ChatInterface.jsx │ ProcessSteps.jsx │ PDFViewer.jsx     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)                      │
│   /chat/stream │ /search │ /upload │ /documents            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Orchestrator                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               OrchestratorActor                       │  │
│  │  process_intent() → _handle_plan() → _generate_final │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │  Planner   │ │   Router   │ │  Executor  │              │
│  │ 問題分解   │ │  任務路由   │ │  工具執行   │              │
│  └────────────┘ └────────────┘ └────────────┘              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 MCP Services (工具層)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ KnowledgeBase│  │   Sandbox    │  │   RepoOps    │      │
│  │   ✅ 完成    │  │   🚧 待開發  │  │   🚧 待開發  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure                            │
│         Qdrant ✅  │  Cohere ✅  │  OpenAI ✅               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 專案目錄結構

```
opencode-platform/
│
├── src/                            # 🔷 Python 後端源碼
│   └── opencode/                   # 主套件
│       ├── __init__.py
│       ├── api/
│       │   └── main.py             # FastAPI 主程式
│       │                           # - /chat/stream (SSE 串流對話)
│       │                           # - /search, /upload, /documents
│       │                           # - /sandbox/execute
│       │
│       ├── cli/
│       │   └── main.py             # Typer CLI 工具
│       │
│       ├── core/
│       │   ├── engine.py           # OpenCodeEngine 主引擎
│       │   ├── context.py          # ContextManager
│       │   ├── events.py           # EventBus, create_event()
│       │   ├── protocols.py        # Event, EventType, Intent 定義
│       │   └── utils.py            # 路徑工具 (get_project_root, load_env)
│       │
│       ├── config/
│       │   └── settings.py         # Pydantic Settings 配置
│       │
│       ├── orchestrator/
│       │   └── actors/
│       │       ├── orchestrator.py # OrchestratorActor (主編排器)
│       │       ├── planner.py      # PlannerActor (問題分解、口語理解)
│       │       ├── router.py       # RouterActor (任務路由)
│       │       ├── executor.py     # ExecutorActor (執行工具)
│       │       └── memory.py       # MemoryActor
│       │
│       ├── services/
│       │   ├── knowledge_base/     # RAG 知識庫服務
│       │   │   ├── service.py      # 主服務 (rag_search, upload)
│       │   │   ├── parser.py       # PDF 解析 (Docling + PyMuPDF)
│       │   │   ├── indexer.py      # 向量索引 (Cohere)
│       │   │   └── retriever.py    # 語意搜尋 (Qdrant)
│       │   │
│       │   └── sandbox/            # 程式碼執行沙箱
│       │       └── service.py      # Docker 隔離執行
│       │
│       ├── gateway/
│       │   └── mcp_gateway.py      # MCP 統一閘道
│       │
│       └── control_plane/          # 控制平面 (待完善)
│           ├── audit/              # 審計日誌
│           ├── policy/             # 權限策略
│           └── ops/                # 運維工具
│
├── frontend/                       # 🔷 React 前端
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── ChatInterface.jsx   # 對話介面
│   │       ├── ProcessSteps.jsx    # 思考過程顯示
│   │       ├── CodeExecutionResult.jsx  # 程式碼結果顯示
│   │       ├── PDFViewer.jsx       # PDF 預覽
│   │       └── SourceCard.jsx      # 來源卡片
│   ├── package.json
│   └── vite.config.js
│
├── docker/                         # 🔷 Docker 配置
│   ├── Dockerfile                  # 主應用 Dockerfile
│   ├── docker-compose.yml
│   └── sandbox/                    # Sandbox 專用
│       ├── Dockerfile              # Python 執行環境
│       ├── runner.py               # 容器內執行器
│       └── build.ps1               # Windows 構建腳本
│
├── docs/                           # 🔷 文檔
│   └── SANDBOX_SETUP.md
│
├── scripts/                        # 🔷 開發腳本
│   └── upload_pdfs.py
│
├── tests/                          # 🔷 測試
│   ├── test_rag.py
│   └── RAG_TEST_PLAN.md
│
├── data/                           # 資料目錄（git ignore）
│   ├── raw/                        # 原始 PDF
│   └── documents/                  # 處理後文件
│
├── run.py                          # 快速啟動腳本
├── pyproject.toml                  # Python 專案配置
├── requirements.txt                # Python 依賴
├── .env.example                    # 環境變數範例
├── README.md                       # 專案說明
└── PROJECT_GUIDE.md                # 開發指南（本文件）
```
│   ├── raw/                    # 原始 PDF 存放
│   └── documents/              # 處理後文件
│
├── tests/
│   ├── RAG_TEST_PLAN.md        # 30 個測試用例
│   ├── test_rag.py             # 自動化測試腳本
│   └── QUICK_TEST_GUIDE.md     # 快速測試指南
│
├── .env.example                # 環境變數範例
├── requirements.txt            # Python 依賴
└── README.md                   # 完整說明文檔
```

---

## 🔑 關鍵實作細節

### 1. SSE 事件流程

```python
# 後端發送事件 (orchestrator.py)
EventType.THINKING  → 分析問題
EventType.PLAN      → 規劃搜尋策略 (含 queries 列表)
EventType.TOOL_CALL → 執行工具
EventType.TOOL_RESULT → 工具結果
EventType.ANSWER    → 最終回答
EventType.SOURCE    → 來源引用
EventType.DONE      → 完成

# 前端處理 (ChatInterface.jsx)
case 'thinking': addStep({ type: 'analysis', ... })
case 'plan':     addStep({ type: 'planning', queries: [...] })
case 'tool_call': addStep({ type: 'tool_call', ... })
case 'answer':   setStreamingContent(data.content)
```

### 2. Planner 口語理解 Prompt

```python
# planner.py 中的關鍵 prompt
"""
口語化問題處理：
- "這篇在講啥" → 搜尋：主題、背景、方法、結論
- "有沒有講到圖片" → 搜尋：image, visual, 圖像, 視覺
- "結果好不好" → 搜尋：results, performance, accuracy

輸出格式：
{
  "analysis": "用戶想了解...",
  "sub_questions": ["問題1", "問題2"],
  "tasks": [{
    "id": "task_1",
    "tool": "rag_search_multiple",
    "parameters": {
      "queries": ["查詢1", "查詢2", "查詢3"],
      "top_k": 5,
      "filters": {"file_name": ["xxx.pdf"]}
    }
  }]
}
"""
```

### 3. 向量搜尋流程

```python
# retriever.py
1. Query → Cohere embedding (input_type="search_query")
2. Qdrant query_points (with filters)
3. 返回 [{text, file_name, page_label, score}, ...]

# 多查詢搜尋
1. 並行執行多個 query
2. 合併結果並去重 (by point_id)
3. 按 score 排序返回
```

### 4. 文件選擇過濾

```python
# 前端傳送 selected_docs
{ "selected_docs": ["paper1.pdf", "paper2.pdf"] }

# Planner 加入 filters
"filters": {"file_name": selected_docs}

# Retriever 建構 Qdrant filter
Filter(must=[FieldCondition(key="file_name", match=MatchAny(any=file_names))])
```

---

## 🔧 環境配置

### .env 檔案
```env
# Embedding（必要）
COHERE_API_KEY=your_cohere_key

# LLM（必要）
OPENAI_API_KEY=sk-proj-your_key

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# 可選
COHERE_EMBED_MODEL=embed-multilingual-v3.0
LOG_LEVEL=INFO
```

### 啟動指令
```bash
# 1. Qdrant
docker run -d -p 6333:6333 qdrant/qdrant

# 2. 後端（三種方式）
cd C:\Users\epicp\Desktop\opencode-platform

# 方式 A: 使用 run.py
python run.py api

# 方式 B: 使用 uvicorn（需先設置 PYTHONPATH）
set PYTHONPATH=src
uvicorn opencode.api.main:app --reload --port 8000

# 方式 C: 使用 CLI（pip install -e . 後）
opencode api

# 3. 前端
cd frontend
npm run dev
```

---

## 🚀 Phase 2-4 開發計劃

### Phase 2：MCP Services 完善

#### 2.1 Sandbox Service（程式碼執行）✅ 已完成
```
目標：讓 AI 能安全執行 Python/JS 程式碼

已實現功能：
- Docker 隔離執行環境（opencode-sandbox image）
- 資源限制（512MB 記憶體、50% CPU、30 秒超時）
- 支援套件：pandas, numpy, matplotlib, scipy, sklearn, seaborn
- 返回：stdout, stderr, 圖表 (base64), return_value
- 前端顯示執行結果和圖表

工具定義：
{
  "tool": "sandbox_execute_python",
  "parameters": {
    "code": "print('hello')",
    "timeout": 30
  }
}

檔案位置：
- services/sandbox/service.py - 主服務
- services/sandbox/docker/Dockerfile - Docker 映像
- services/sandbox/docker/runner.py - 容器內執行器
- services/sandbox/docker/build.ps1 - Windows 構建腳本

API 端點：
- POST /sandbox/execute - 執行程式碼
- GET /sandbox/status - 檢查服務狀態
```

#### 2.2 RepoOps Service（Git 操作）🚧 待開發
```
功能：clone, read, write, commit, push
整合：GitPython 或 subprocess
```

#### 2.3 Web Search Tool 🚧 待開發
```
功能：搜尋網路，返回摘要
整合：SerpAPI / Bing Search API
```

### Phase 3：企業功能
- RBAC/ABAC 權限（control_plane/policy/）
- 審計日誌 UI（control_plane/audit/）
- 成本追蹤（control_plane/ops/）
- 多用戶支援

### Phase 4：進階功能
- 多 Agent 協作
- 技能市場
- 插件系統
- 雲端部署

---

## 📡 API 端點速查

| 端點 | 方法 | 用途 |
|------|------|------|
| `/chat/stream` | POST | 串流對話 (SSE) |
| `/chat` | POST | 同步對話 |
| `/search` | POST | 語意搜尋 |
| `/search/filtered` | POST | 指定文件搜尋 |
| `/documents` | GET | 列出文件 |
| `/upload` | POST | 上傳 PDF |
| `/documents/{name}/pdf` | GET | 預覽/下載 PDF |
| `/documents/{name}` | DELETE | 刪除文件 |
| `/sandbox/execute` | POST | 執行 Python 程式碼 |
| `/sandbox/status` | GET | Sandbox 服務狀態 |
| `/health` | GET | 健康檢查 |
| `/stats` | GET | 系統統計 |
| `/debug/qdrant/reset` | POST | 重置向量庫 |

---

## 🐛 已知問題與解決方案

| 問題 | 解決方案 |
|------|----------|
| Docling 解析失敗 | 自動 fallback 到 PyMuPDF |
| 串流無回應 | 檢查 event.type vs event.event_type |
| 搜尋無結果 | 確認 embedding 維度一致 (1024) |
| PDF 自動下載 | 使用 Content-Disposition: inline |

---

## 📝 開發注意事項

1. **新增工具時**：
   - 在 `services/` 新增 service
   - 在 `router.py` 註冊路由規則
   - 在 `planner.py` 更新工具描述
   - 在前端 `getToolDisplayName()` 加入顯示名稱

2. **新增事件類型時**：
   - 在 `protocols.py` 的 `EventType` 加入
   - 在 `orchestrator.py` 發送事件
   - 在 `ChatInterface.jsx` 處理事件

3. **測試**：
   - 先用 `/health` 確認服務正常
   - 用 `/debug/qdrant` 確認向量庫狀態
   - 查看後端 log 追蹤問題

---

## 🔗 參考資源

- [Cohere Embed 文檔](https://docs.cohere.com/docs/embeddings)
- [Qdrant 文檔](https://qdrant.tech/documentation/)
- [FastAPI SSE](https://fastapi.tiangolo.com/advanced/custom-response/)
- [React PDF](https://react-pdf.org/)

---

**最後更新**: 2025-01-26 by Claude
