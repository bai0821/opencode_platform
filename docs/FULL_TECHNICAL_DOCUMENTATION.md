# OpenCode Platform 完整技術文件

> **版本**: v4.9.0  
> **更新日期**: 2025-01-30  
> **文件類型**: 完整技術規格書  
> **總行數**: 約 15,000+ 行程式碼

---

# 📚 目錄

1. [專案總覽](#第一章-專案總覽)
2. [技術架構](#第二章-技術架構)
3. [目錄結構完整說明](#第三章-目錄結構完整說明)
4. [後端模組詳解](#第四章-後端模組詳解)
5. [Multi-Agent 系統詳解](#第五章-multi-agent-系統詳解)
6. [RAG 知識庫系統詳解](#第六章-rag-知識庫系統詳解)
7. [Sandbox 代碼執行系統詳解](#第七章-sandbox-代碼執行系統詳解)
8. [工具系統詳解](#第八章-工具系統詳解)
9. [前端組件詳解](#第九章-前端組件詳解)
10. [API 端點完整說明](#第十章-api-端點完整說明)
11. [資料流程圖解](#第十一章-資料流程圖解)
12. [配置與部署](#第十二章-配置與部署)

---

# 第一章 專案總覽

## 1.1 什麼是 OpenCode Platform？

OpenCode Platform 是一個**企業級 AI 智能助手平台**，整合了多項先進 AI 技術：

| 功能模組 | 說明 | 狀態 |
|---------|------|------|
| **RAG 問答系統** | 基於上傳文檔的智能問答 | ✅ 完成 |
| **Multi-Agent 系統** | 多個 AI 代理協同工作 | ✅ 完成 |
| **Sandbox 代碼執行** | 安全執行 Python 代碼並生成圖表 | ✅ 完成 |
| **Deep Research** | 多輪搜尋生成深度報告 | ✅ 完成 |
| **思考過程可視化** | 展示 AI 的思考和決策過程 | ✅ 完成 |
| **OCR 圖片識別** | 從 PDF 圖片中提取文字 | ✅ 完成 |

## 1.2 核心設計理念

```
┌─────────────────────────────────────────────────────────────────┐
│                      用戶請求                                    │
│              "請比較 Transformer 和 RNN，並畫出複雜度圖"          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Dispatcher (總機)                             │
│                                                                  │
│  分析請求 → 判斷複雜度 → 拆解為子任務 → 分配給專業 Agent          │
│                                                                  │
│  輸出：                                                          │
│  [                                                               │
│    { agent: "researcher", task: "搜尋 Transformer 資料" },       │
│    { agent: "researcher", task: "搜尋 RNN 資料" },               │
│    { agent: "coder", task: "計算複雜度並繪製圖表" },              │
│    { agent: "writer", task: "整理比較報告" }                      │
│  ]                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Researcher    │ │     Coder       │ │     Writer      │
│                 │ │                 │ │                 │
│ 工具:           │ │ 工具:           │ │ 工具:           │
│ - rag_search    │ │ - code_execute  │ │ - rag_search    │
│ - web_search    │ │ - code_analyze  │ │ - file_write    │
│                 │ │                 │ │                 │
│ 執行搜尋        │ │ 生成並執行代碼  │ │ 撰寫報告        │
│ 返回相關文檔    │ │ 返回圖表        │ │ 返回文字        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      結果聚合                                    │
│                                                                  │
│  將所有 Agent 的結果整合為一個完整回答                           │
│  包含：文字說明 + 圖表 + 參考來源                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SSE 串流返回                                │
│                                                                  │
│  即時發送事件：thinking → plan → agent_start → tool_call →       │
│               code_execution → step_result → final               │
└─────────────────────────────────────────────────────────────────┘
```

## 1.3 技術棧總覽

### 後端技術

| 技術 | 版本 | 用途 | 為什麼選擇 |
|------|------|------|-----------|
| Python | 3.11+ | 開發語言 | AI 生態系統最完整 |
| FastAPI | 0.108+ | Web 框架 | 異步支援、自動文檔 |
| Uvicorn | 0.25+ | ASGI 伺服器 | 高效能異步 |
| Pydantic | 2.0+ | 資料驗證 | 類型安全 |
| OpenAI | 1.0+ | LLM 服務 | GPT-4o 最強模型 |
| Cohere | 5.0+ | Embedding | 多語言支援最佳 |
| Qdrant | 1.7+ | 向量資料庫 | 高效能、易部署 |
| PyMuPDF | 1.23+ | PDF 解析 | 速度快、功能全 |
| Docling | 2.0+ | OCR | 準確度高 |

### 前端技術

| 技術 | 版本 | 用途 | 為什麼選擇 |
|------|------|------|-----------|
| React | 18 | UI 框架 | 生態系統豐富 |
| Vite | 5.0+ | 建構工具 | 極速開發體驗 |
| Tailwind CSS | 3.0+ | CSS 框架 | 快速開發 |
| Lucide React | - | 圖標 | 美觀、輕量 |
| React-PDF | - | PDF 預覽 | 功能完整 |

---

# 第二章 技術架構

## 2.1 整體架構圖

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                 FRONTEND                                       ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                          React Application                               │  ║
║  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ │  ║
║  │  │   Chat    │ │  Process  │ │    PDF    │ │  Research │ │   Admin   │ │  ║
║  │  │ Interface │ │   Steps   │ │  Viewer   │ │   Panel   │ │   Panel   │ │  ║
║  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘ │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                      │
                                      │ HTTP / SSE (Server-Sent Events)
                                      ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                 API LAYER                                      ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                           FastAPI Application                            │  ║
║  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  ║
║  │  │ /chat/*     │ │ /agents/*   │ │ /documents  │ │ /research   │       │  ║
║  │  │ RAG 對話    │ │ Multi-Agent │ │ 文件管理    │ │ 深度研究    │       │  ║
║  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │  ║
║  │                                                                          │  ║
║  │  ┌─────────────────────────────────────────────────────────────────┐    │  ║
║  │  │                        Middleware                                │    │  ║
║  │  │  Authentication │ CORS │ Audit Logging │ Error Handling         │    │  ║
║  │  └─────────────────────────────────────────────────────────────────┘    │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                      │
                                      ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                            MULTI-AGENT SYSTEM                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                          AgentCoordinator                                │  ║
║  │  ┌─────────────────────────────────────────────────────────────────┐    │  ║
║  │  │                      DispatcherAgent                             │    │  ║
║  │  │         分析請求 → 判斷複雜度 → 生成任務計劃                     │    │  ║
║  │  └─────────────────────────────────────────────────────────────────┘    │  ║
║  │                                  │                                       │  ║
║  │      ┌───────────────┬───────────┼───────────┬───────────────┐          │  ║
║  │      ▼               ▼           ▼           ▼               ▼          │  ║
║  │  ┌────────┐    ┌────────┐   ┌────────┐  ┌────────┐    ┌────────┐       │  ║
║  │  │Research│    │ Writer │   │ Coder  │  │Analyst │    │Reviewer│       │  ║
║  │  │  Agent │    │ Agent  │   │ Agent  │  │ Agent  │    │ Agent  │       │  ║
║  │  └────────┘    └────────┘   └────────┘  └────────┘    └────────┘       │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                      │
                                      ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              TOOLS LAYER                                       ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                           ToolRegistry                                   │  ║
║  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ │  ║
║  │  │ RAG Search│ │Code Execute│ │Web Search │ │ File Read │ │File Write │ │  ║
║  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘ │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                      │
                                      ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                             SERVICES LAYER                                     ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │  ║
║  │  │ KnowledgeBase │ │    Sandbox    │ │   Research    │ │  WebSearch  │ │  ║
║  │  │    Service    │ │    Service    │ │    Service    │ │   Service   │ │  ║
║  │  │               │ │               │ │               │ │             │ │  ║
║  │  │ - Parser      │ │ - Python Exec │ │ - Multi-round │ │ - DDG API   │ │  ║
║  │  │ - Indexer     │ │ - Chart Gen   │ │ - Report Gen  │ │ - Fetch URL │ │  ║
║  │  │ - Retriever   │ │ - Timeout     │ │ - Citation    │ │             │ │  ║
║  │  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘ │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                      │
                                      ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                            INFRASTRUCTURE                                      ║
║  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                  ║
║  │     Qdrant      │ │     Cohere      │ │     OpenAI      │                  ║
║  │   Vector DB     │ │    Embedding    │ │    GPT-4o       │                  ║
║  │  localhost:6333 │ │ embed-multi-v3  │ │   LLM API       │                  ║
║  └─────────────────┘ └─────────────────┘ └─────────────────┘                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

## 2.2 請求處理流程

### 簡單查詢流程

```
用戶: "Transformer 的注意力機制是什麼？"
                │
                ▼
        ┌───────────────┐
        │   Dispatcher  │  判斷: is_simple_query = true
        └───────────────┘
                │
                ▼
        ┌───────────────┐
        │  Researcher   │  調用 rag_search 工具
        │    Agent      │  搜尋相關文檔
        └───────────────┘
                │
                ▼
        ┌───────────────┐
        │    聚合結果    │  直接使用搜尋結果生成回答
        └───────────────┘
                │
                ▼
           最終回答
```

### 複雜任務流程

```
用戶: "比較 Transformer 和 RNN，計算複雜度並畫圖"
                │
                ▼
        ┌───────────────┐
        │   Dispatcher  │  判斷: is_simple_query = false
        └───────────────┘  生成 4 個子任務
                │
    ┌───────────┼───────────┬───────────┐
    ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Research│ │Research│ │ Coder  │ │ Writer │
│  #1    │ │  #2    │ │        │ │        │
│搜尋    │ │搜尋    │ │計算    │ │整理    │
│Transf..│ │RNN     │ │繪圖    │ │報告    │
└────────┘ └────────┘ └────────┘ └────────┘
    │           │           │           │
    └───────────┴───────────┴───────────┘
                │
                ▼
        ┌───────────────┐
        │    聚合結果    │  整合所有 Agent 輸出
        └───────────────┘  包含文字、圖表、來源
                │
                ▼
           最終回答
```

---

# 第三章 目錄結構完整說明

## 3.1 根目錄結構

```
opencode-platform/                    # 專案根目錄
│
├── 📄 run.py                         # 主啟動腳本 (231 行)
│   │                                 # 功能：統一入口點
│   │                                 # 命令：
│   │                                 #   python run.py api    - 啟動 API 伺服器
│   │                                 #   python run.py cli    - 啟動命令行界面
│   │                                 #   python run.py demo   - 執行演示
│   │                                 #   python run.py check  - 檢查配置
│   │
├── 📄 requirements.txt               # Python 依賴列表
│   │                                 # 包含約 40 個依賴套件
│   │
├── 📄 pyproject.toml                 # 專案配置 (Poetry/pip)
│   │                                 # 定義專案元數據和依賴
│   │
├── 📄 docker-compose.yml             # Docker 編排配置
│   │                                 # 定義 Qdrant、Backend、Frontend 服務
│   │
├── 📄 start.ps1                      # Windows 啟動腳本
│   │                                 # 一鍵啟動 Qdrant + Backend + Frontend
│   │
├── 📄 stop.ps1                       # Windows 停止腳本
│   │
├── 📄 .env.example                   # 環境變數範例
│   │                                 # 包含所有需要配置的環境變數
│   │
├── 📄 README.md                      # 專案說明文件
├── 📄 PROJECT_GUIDE.md               # 開發指南
├── 📄 PROGRESS_REPORT.md             # 進度報告
│
├── 📁 src/                           # 後端源碼 (主要)
├── 📁 frontend/                      # 前端源碼
├── 📁 docs/                          # 文件目錄
├── 📁 tests/                         # 測試目錄
├── 📁 scripts/                       # 腳本工具
├── 📁 docker/                        # Docker 配置
├── 📁 plugins/                       # 插件目錄
└── 📁 data/                          # 資料目錄 (runtime 生成)
```

## 3.2 後端源碼結構 (`src/opencode/`)

```
src/opencode/                         # 後端主模組
│
├── 📄 __init__.py                    # 模組初始化
│                                     # 導出版本號和主要類別
│
├── 📁 api/                           # ═══ API 層 ═══
│   │                                 # 處理 HTTP 請求和響應
│   │
│   ├── 📄 __init__.py
│   │
│   ├── 📄 main.py                    # ⭐ API 主入口 (915 行)
│   │   │
│   │   │ # ═══ 文件結構 ═══
│   │   │ # 1. 導入和初始化 (1-50 行)
│   │   │ # 2. FastAPI 應用創建 (51-80 行)
│   │   │ # 3. 中間件配置 (81-120 行)
│   │   │ # 4. 啟動事件處理 (121-180 行)
│   │   │ # 5. 文件上傳端點 (181-280 行)
│   │   │ # 6. 文件管理端點 (281-380 行)
│   │   │ # 7. 搜尋端點 (381-450 行)
│   │   │ # 8. 聊天端點 (451-600 行)
│   │   │ # 9. SSE 串流處理 (601-750 行)
│   │   │ # 10. 健康檢查和統計 (751-915 行)
│   │   │
│   │   │ # ═══ 核心邏輯 ═══
│   │   │ # 
│   │   │ # @app.on_event("startup")
│   │   │ # async def startup():
│   │   │ #     1. 初始化知識庫服務
│   │   │ #     2. 初始化 OpenCodeEngine
│   │   │ #     3. 創建資料目錄
│   │   │ #     4. 連接 Qdrant
│   │   │ #
│   │   │ # @app.post("/chat/stream")
│   │   │ # async def chat_stream():
│   │   │ #     1. 解析請求
│   │   │ #     2. 創建 Intent 對象
│   │   │ #     3. 調用 engine.process_intent()
│   │   │ #     4. 以 SSE 格式返回事件流
│   │   │
│   │
│   ├── 📁 middleware/                # 中間件目錄
│   │   │
│   │   ├── 📄 __init__.py
│   │   │
│   │   └── 📄 audit.py               # 審計日誌中間件
│   │       │                         # 記錄所有 API 請求
│   │       │
│   │       │ # class AuditMiddleware:
│   │       │ #     async def __call__(request, call_next):
│   │       │ #         1. 記錄請求開始時間
│   │       │ #         2. 執行請求
│   │       │ #         3. 計算處理時間
│   │       │ #         4. 記錄到審計日誌
│   │
│   └── 📁 routes/                    # 額外路由目錄
│       │
│       ├── 📄 __init__.py
│       │
│       ├── 📄 qdrant.py              # Qdrant 調試路由
│       │   │                         # /debug/qdrant/status
│       │   │                         # /debug/qdrant/reset
│       │   │                         # /debug/qdrant/collections
│       │
│       └── 📄 research.py            # 深度研究路由
│           │                         # /research/start
│           │                         # /research/{id}/status
│           │                         # /research/{id}/result
│
├── 📁 agents/                        # ═══ Multi-Agent 系統 ═══
│   │                                 # 實現多代理協作
│   │
│   ├── 📄 __init__.py                # 導出所有 Agent 類別
│   │
│   ├── 📄 base.py                    # ⭐ Agent 基類 (257 行)
│   │   │
│   │   │ # ═══ 類別定義 ═══
│   │   │ #
│   │   │ # class AgentType(Enum):
│   │   │ #     DISPATCHER = "dispatcher"  # 總機
│   │   │ #     RESEARCHER = "researcher"  # 研究者
│   │   │ #     WRITER = "writer"          # 寫作者
│   │   │ #     CODER = "coder"            # 編碼者
│   │   │ #     ANALYST = "analyst"        # 分析師
│   │   │ #     REVIEWER = "reviewer"      # 審核者
│   │   │ #
│   │   │ # @dataclass
│   │   │ # class AgentTask:
│   │   │ #     id: str              # 任務 ID
│   │   │ #     type: str            # 任務類型
│   │   │ #     description: str     # 任務描述
│   │   │ #     parameters: Dict     # 任務參數
│   │   │ #     context: Dict        # 上下文
│   │   │ #
│   │   │ # @dataclass
│   │   │ # class AgentResult:
│   │   │ #     task_id: str         # 對應任務 ID
│   │   │ #     agent_type: str      # 執行的 Agent 類型
│   │   │ #     success: bool        # 是否成功
│   │   │ #     output: Any          # 輸出結果
│   │   │ #     tool_calls: List     # 工具調用記錄
│   │   │ #     execution_time: float # 執行時間
│   │   │ #
│   │   │ # class BaseAgent(ABC):
│   │   │ #     def __init__(agent_type, name):
│   │   │ #         初始化 Agent
│   │   │ #
│   │   │ #     async def initialize():
│   │   │ #         初始化 LLM 客戶端和工具
│   │   │ #
│   │   │ #     @abstractmethod
│   │   │ #     def system_prompt -> str:
│   │   │ #         返回系統提示詞 (子類實現)
│   │   │ #
│   │   │ #     @abstractmethod
│   │   │ #     async def process_task(task) -> AgentResult:
│   │   │ #         處理任務 (子類實現)
│   │   │ #
│   │   │ #     async def think(prompt, use_tools) -> Dict:
│   │   │ #         使用 LLM 進行思考
│   │   │ #         1. 構建消息列表
│   │   │ #         2. 準備可用工具
│   │   │ #         3. 調用 OpenAI API
│   │   │ #         4. 處理工具調用 (如果有)
│   │   │ #         5. 返回答案和工具記錄
│   │   │ #
│   │   │ #     async def call_tool(tool_name, **kwargs) -> Dict:
│   │   │ #         調用指定工具
│   │
│   ├── 📄 coordinator.py             # ⭐ 協調器 (428 行)
│   │   │
│   │   │ # ═══ 核心職責 ═══
│   │   │ # 1. 管理所有 Agent 的生命週期
│   │   │ # 2. 協調任務分配和執行
│   │   │ # 3. 聚合結果並生成最終回答
│   │   │ # 4. 發送 SSE 事件流
│   │   │ #
│   │   │ # class AgentCoordinator:
│   │   │ #     _agents: Dict[str, BaseAgent]  # Agent 實例池
│   │   │ #     _dispatcher: DispatcherAgent   # 總機 Agent
│   │   │ #
│   │   │ #     async def initialize():
│   │   │ #         1. 註冊所有工具 (register_all_tools)
│   │   │ #         2. 創建 Dispatcher Agent
│   │   │ #         3. 創建各專業 Agent
│   │   │ #         4. 初始化所有 Agent
│   │   │ #
│   │   │ #     async def process_request(request, context):
│   │   │ #         ═══ 主處理流程 ═══
│   │   │ #         
│   │   │ #         # Step 1: 發送思考事件
│   │   │ #         yield {"type": "thinking", "content": "分析中..."}
│   │   │ #         
│   │   │ #         # Step 2: Dispatcher 分析請求
│   │   │ #         dispatch_result = await dispatcher.process_task(...)
│   │   │ #         
│   │   │ #         # Step 3: 發送規劃事件
│   │   │ #         yield {"type": "plan", "subtasks": [...]}
│   │   │ #         
│   │   │ #         # Step 4: 按順序執行子任務
│   │   │ #         for subtask in subtasks:
│   │   │ #             yield {"type": "agent_start", ...}
│   │   │ #             result = await agent.process_task(...)
│   │   │ #             
│   │   │ #             # 發送工具調用事件
│   │   │ #             for tc in result.tool_calls:
│   │   │ #                 yield {"type": "tool_call", ...}
│   │   │ #                 
│   │   │ #                 # 如果是代碼執行
│   │   │ #                 if "execute" in tc.tool:
│   │   │ #                     yield {"type": "code_execution", ...}
│   │   │ #             
│   │   │ #             yield {"type": "step_result", ...}
│   │   │ #         
│   │   │ #         # Step 5: 聚合結果
│   │   │ #         yield {"type": "summarizing", ...}
│   │   │ #         final = await _summarize_results(...)
│   │   │ #         
│   │   │ #         # Step 6: 發送最終回答
│   │   │ #         yield {"type": "final", "content": final}
│   │   │ #
│   │   │ #     async def _summarize_results(request, results):
│   │   │ #         將所有 Agent 結果整合為最終回答
│   │   │ #         1. 截斷過長內容 (避免 token 超限)
│   │   │ #         2. 移除 base64 圖片 (只保留數量)
│   │   │ #         3. 調用 LLM 生成總結
│   │
│   ├── 📄 dispatcher.py              # ⭐ 總機 Agent (195 行)
│   │   │
│   │   │ # ═══ 核心職責 ═══
│   │   │ # 1. 分析用戶請求的意圖
│   │   │ # 2. 判斷是簡單查詢還是複雜任務
│   │   │ # 3. 將複雜任務拆解為子任務
│   │   │ # 4. 為每個子任務分配合適的 Agent
│   │   │ #
│   │   │ # class DispatcherAgent(BaseAgent):
│   │   │ #     @property
│   │   │ #     def system_prompt(self):
│   │   │ #         """
│   │   │ #         你是一個智能總機，負責分析用戶請求並分配任務。
│   │   │ #         
│   │   │ #         判斷標準：
│   │   │ #         - 簡單查詢：單一搜尋就能回答
│   │   │ #         - 複雜任務：需要多步驟、多 Agent 協作
│   │   │ #         
│   │   │ #         可用的 Agent：
│   │   │ #         - researcher: 研究者 - 搜尋知識庫
│   │   │ #         - writer: 寫作者 - 撰寫內容
│   │   │ #         - coder: 編碼者 - 寫代碼、計算、畫圖
│   │   │ #         - analyst: 分析師 - 數據分析
│   │   │ #         
│   │   │ #         特別注意：「計算」「畫圖」必須分配給 coder！
│   │   │ #         
│   │   │ #         輸出 JSON：
│   │   │ #         {
│   │   │ #           "is_simple_query": false,
│   │   │ #           "analysis": "用戶想要...",
│   │   │ #           "subtasks": [
│   │   │ #             {"id": "task_1", "agent": "researcher", ...},
│   │   │ #             {"id": "task_2", "agent": "coder", ...}
│   │   │ #           ]
│   │   │ #         }
│   │   │ #         """
│   │   │ #
│   │   │ #     async def process_task(task):
│   │   │ #         1. 提取用戶請求
│   │   │ #         2. 調用 LLM 分析
│   │   │ #         3. 解析 JSON 輸出
│   │   │ #         4. 返回分析結果和子任務列表
│   │
│   ├── 📄 specialists.py             # ⭐ 專業 Agent (493 行)
│   │   │
│   │   │ # ═══ ResearcherAgent ═══ (約 80 行)
│   │   │ # 職責：搜集和分析資料
│   │   │ # 工具：rag_search, rag_multi_search, web_search
│   │   │ #
│   │   │ # async def process_task(task):
│   │   │ #     1. 構建搜尋查詢
│   │   │ #     2. 調用 RAG 搜尋工具
│   │   │ #     3. 整理搜尋結果
│   │   │ #     4. 返回結果和來源
│   │   │ #
│   │   │ # ═══ WriterAgent ═══ (約 70 行)
│   │   │ # 職責：撰寫內容
│   │   │ # 工具：rag_search, file_write
│   │   │ #
│   │   │ # async def process_task(task):
│   │   │ #     1. 理解寫作需求
│   │   │ #     2. 搜尋相關資料 (如果需要)
│   │   │ #     3. 生成內容
│   │   │ #     4. 保存文件 (如果需要)
│   │   │ #
│   │   │ # ═══ CoderAgent ═══ (約 150 行) ⭐重要
│   │   │ # 職責：編寫和執行程式碼
│   │   │ # 工具：code_execute, code_analyze
│   │   │ #
│   │   │ # async def process_task(task):
│   │   │ #     # Step 1: 讓 LLM 生成代碼
│   │   │ #     result = await self.think(prompt, use_tools=False)
│   │   │ #     
│   │   │ #     # Step 2: 提取代碼塊
│   │   │ #     code = extract_code(result["answer"])
│   │   │ #     
│   │   │ #     # Step 3: 執行代碼
│   │   │ #     registry = get_tool_registry()
│   │   │ #     code_tool = registry.get("code_execute")
│   │   │ #     
│   │   │ #     execution_result = await code_tool.execute(
│   │   │ #         code=code,
│   │   │ #         language="python",
│   │   │ #         timeout=60
│   │   │ #     )
│   │   │ #     
│   │   │ #     # Step 4: 返回結果 (包含圖表)
│   │   │ #     return AgentResult(
│   │   │ #         output={
│   │   │ #             "code": code,
│   │   │ #             "execution_result": execution_result,
│   │   │ #             "figures": execution_result.get("figures", [])
│   │   │ #         },
│   │   │ #         tool_calls=[{
│   │   │ #             "tool": "code_execute",
│   │   │ #             "arguments": {"code": code},
│   │   │ #             "result": execution_result
│   │   │ #         }]
│   │   │ #     )
│   │   │ #
│   │   │ # ═══ AnalystAgent ═══ (約 80 行)
│   │   │ # 職責：數據分析
│   │   │ # 工具：rag_search, code_execute
│   │   │ #
│   │   │ # ═══ ReviewerAgent ═══ (約 60 行)
│   │   │ # 職責：審核品質
│   │   │ # 工具：rag_search, code_analyze
│   │
│   └── 📄 routes.py                  # Agent API 路由 (約 150 行)
│       │                             # POST /agents/process
│       │                             # GET /agents
│       │                             # GET /agents/types
│       │                             # GET /agents/tools
│
├── 📁 services/                      # ═══ 服務層 ═══
│   │                                 # 提供核心業務邏輯
│   │
│   ├── 📄 __init__.py
│   │
│   ├── 📁 knowledge_base/            # ═══ 知識庫服務 ═══
│   │   │
│   │   ├── 📄 __init__.py
│   │   │
│   │   ├── 📄 service.py             # ⭐ 知識庫主服務 (469 行)
│   │   │   │
│   │   │   │ # class KnowledgeBaseService:
│   │   │   │ #     parser: MultimodalParser    # 文檔解析器
│   │   │   │ #     indexer: DocumentIndexer    # 向量索引器
│   │   │   │ #     retriever: DocumentRetriever # 檢索器
│   │   │   │ #
│   │   │   │ #     async def upload_document(file_path):
│   │   │   │ #         1. 解析 PDF (提取文字和圖片)
│   │   │   │ #         2. 分塊處理 (chunk_size=500)
│   │   │   │ #         3. 生成 Embedding
│   │   │   │ #         4. 存入 Qdrant
│   │   │   │ #
│   │   │   │ #     async def search(query, top_k, filters):
│   │   │   │ #         1. 生成查詢 Embedding
│   │   │   │ #         2. 搜尋 Qdrant
│   │   │   │ #         3. 返回相關文檔片段
│   │   │   │ #
│   │   │   │ #     async def search_multiple(queries, top_k):
│   │   │   │ #         並行執行多個查詢
│   │   │
│   │   ├── 📄 parser.py              # 文檔解析器 (約 200 行)
│   │   │   │                         # 使用 PyMuPDF 解析 PDF
│   │   │
│   │   ├── 📄 multimodal_parser.py   # ⭐ 多模態解析器 (約 300 行)
│   │   │   │
│   │   │   │ # class MultimodalParser:
│   │   │   │ #     async def parse(file_path):
│   │   │   │ #         for page in pdf:
│   │   │   │ #             # 提取文字
│   │   │   │ #             text = page.get_text()
│   │   │   │ #             
│   │   │   │ #             # 提取圖片並 OCR
│   │   │   │ #             for image in page.get_images():
│   │   │   │ #                 ocr_text = pytesseract.image_to_string(image)
│   │   │   │ #                 text += f"\n[圖片內容: {ocr_text}]"
│   │   │   │ #             
│   │   │   │ #             # 分塊
│   │   │   │ #             chunks.extend(split_text(text))
│   │   │   │ #         
│   │   │   │ #         return chunks
│   │   │
│   │   ├── 📄 indexer.py             # 向量索引器 (約 200 行)
│   │   │   │
│   │   │   │ # class DocumentIndexer:
│   │   │   │ #     cohere_client: Cohere       # Embedding 客戶端
│   │   │   │ #     qdrant_client: QdrantClient # 向量 DB 客戶端
│   │   │   │ #
│   │   │   │ #     async def index(chunks):
│   │   │   │ #         # 生成 Embedding
│   │   │   │ #         embeddings = cohere.embed(
│   │   │   │ #             texts=[c.content for c in chunks],
│   │   │   │ #             model="embed-multilingual-v3.0",
│   │   │   │ #             input_type="search_document"  # 文檔用
│   │   │   │ #         )
│   │   │   │ #         
│   │   │   │ #         # 存入 Qdrant
│   │   │   │ #         qdrant.upsert(points=[...])
│   │   │
│   │   └── 📄 retriever.py           # 檢索器 (約 150 行)
│   │       │
│   │       │ # class DocumentRetriever:
│   │       │ #     async def search(query, top_k, filters):
│   │       │ #         # 生成查詢 Embedding
│   │       │ #         query_embedding = cohere.embed(
│   │       │ #             texts=[query],
│   │       │ #             input_type="search_query"  # 查詢用
│   │       │ #         )
│   │       │ #         
│   │       │ #         # 搜尋 Qdrant
│   │       │ #         results = qdrant.search(
│   │       │ #             query_vector=query_embedding,
│   │       │ #             limit=top_k,
│   │       │ #             query_filter=filters
│   │       │ #         )
│   │       │ #         
│   │       │ #         return [
│   │       │ #             {
│   │       │ #                 "content": r.payload["content"],
│   │       │ #                 "page_label": r.payload["page_label"],
│   │       │ #                 "file_name": r.payload["file_name"],
│   │       │ #                 "score": r.score
│   │       │ #             }
│   │       │ #             for r in results
│   │       │ #         ]
│   │
│   ├── 📁 sandbox/                   # ═══ 沙箱服務 ═══
│   │   │
│   │   ├── 📄 __init__.py
│   │   │
│   │   ├── 📄 service.py             # ⭐ 沙箱服務 (578 行)
│   │   │   │
│   │   │   │ # class SandboxService:
│   │   │   │ #     docker_enabled: bool       # 是否使用 Docker
│   │   │   │ #     docker_client: DockerClient
│   │   │   │ #     SANDBOX_IMAGE = "opencode-sandbox:latest"
│   │   │   │ #
│   │   │   │ #     async def initialize():
│   │   │   │ #         # Windows 上自動禁用 Docker (有 bug)
│   │   │   │ #         if platform.system() == "Windows":
│   │   │   │ #             docker_enabled = False
│   │   │   │ #             return
│   │   │   │ #         
│   │   │   │ #         # 嘗試連接 Docker
│   │   │   │ #         try:
│   │   │   │ #             docker_client = docker.from_env()
│   │   │   │ #         except:
│   │   │   │ #             docker_enabled = False
│   │   │   │ #
│   │   │   │ #     async def execute(method, params):
│   │   │   │ #         if method == "execute_python":
│   │   │   │ #             return await _execute_python(params)
│   │   │   │ #
│   │   │   │ #     async def _execute_python(code, timeout):
│   │   │   │ #         if docker_enabled:
│   │   │   │ #             return await _execute_python_docker(code)
│   │   │   │ #         else:
│   │   │   │ #             return await _execute_python_local(code)
│   │   │   │ #
│   │   │   │ #     async def _execute_python_local(code, timeout):
│   │   │   │ #         """本地執行 (用於 Windows)"""
│   │   │   │ #         
│   │   │   │ #         # 使用 Agg 後端 (不彈窗)
│   │   │   │ #         import matplotlib
│   │   │   │ #         matplotlib.use('Agg')
│   │   │   │ #         import matplotlib.pyplot as plt
│   │   │   │ #         
│   │   │   │ #         # 攔截 plt.show() (防止彈窗)
│   │   │   │ #         plt.show = lambda: None
│   │   │   │ #         
│   │   │   │ #         # 執行代碼
│   │   │   │ #         exec(code, exec_globals)
│   │   │   │ #         
│   │   │   │ #         # 捕獲圖表 (轉 base64)
│   │   │   │ #         figures = []
│   │   │   │ #         for fig_num in plt.get_fignums():
│   │   │   │ #             fig = plt.figure(fig_num)
│   │   │   │ #             buf = io.BytesIO()
│   │   │   │ #             fig.savefig(buf, format='png')
│   │   │   │ #             figures.append(base64.b64encode(buf.read()))
│   │   │   │ #         
│   │   │   │ #         return {
│   │   │   │ #             "success": True,
│   │   │   │ #             "stdout": stdout,
│   │   │   │ #             "figures": figures
│   │   │   │ #         }
│   │   │
│   │   └── 📁 runtimes/              # 運行時環境 (預留)
│   │
│   ├── 📁 research/                  # ═══ 深度研究服務 ═══
│   │   │
│   │   ├── 📄 __init__.py
│   │   │
│   │   └── 📄 service.py             # 深度研究服務 (約 400 行)
│   │       │                         # 多輪搜尋生成報告
│   │
│   ├── 📁 web_search/                # ═══ 網頁搜尋服務 ═══
│   │   │
│   │   ├── 📄 __init__.py
│   │   │
│   │   └── 📄 service.py             # 網頁搜尋服務 (約 150 行)
│   │       │                         # 使用 DuckDuckGo API
│   │
│   ├── 📁 collections/               # 集合管理服務
│   ├── 📁 mcp/                       # MCP 服務
│   └── 📁 repo_ops/                  # Git 操作服務
│
├── 📁 tools/                         # ═══ 工具系統 ═══
│   │
│   ├── 📄 __init__.py                # ⭐ 工具註冊入口 (167 行)
│   │   │
│   │   │ # async def register_all_tools():
│   │   │ #     """在系統啟動時註冊所有工具"""
│   │   │ #     registry = get_tool_registry()
│   │   │ #     
│   │   │ #     tools = [
│   │   │ #         RAGSearchTool(),
│   │   │ #         RAGMultiSearchTool(),
│   │   │ #         WebSearchTool(),
│   │   │ #         WebFetchTool(),
│   │   │ #         CodeExecutorTool(),
│   │   │ #         CodeAnalyzeTool(),
│   │   │ #         FileReadTool(),
│   │   │ #         FileWriteTool(),
│   │   │ #         FileListTool(),
│   │   │ #     ]
│   │   │ #     
│   │   │ #     for tool in tools:
│   │   │ #         registry.register(tool)
│   │   │ #     
│   │   │ #     await registry.initialize_all()
│   │   │ #
│   │   │ # def get_tools_for_agent(agent_type):
│   │   │ #     """根據 Agent 類型返回可用工具"""
│   │   │ #     tool_mapping = {
│   │   │ #         "researcher": ["rag_search", "web_search", ...],
│   │   │ #         "coder": ["code_execute", "code_analyze", ...],
│   │   │ #         ...
│   │   │ #     }
│   │
│   ├── 📄 base.py                    # ⭐ 工具基類 (約 250 行)
│   │   │
│   │   │ # class ToolCategory(Enum):
│   │   │ #     RAG = "rag"
│   │   │ #     WEB = "web"
│   │   │ #     CODE = "code"
│   │   │ #     FILE = "file"
│   │   │ #
│   │   │ # @dataclass
│   │   │ # class ToolParameter:
│   │   │ #     name: str
│   │   │ #     type: str
│   │   │ #     description: str
│   │   │ #     required: bool
│   │   │ #     default: Any
│   │   │ #
│   │   │ # @dataclass
│   │   │ # class ToolDefinition:
│   │   │ #     name: str
│   │   │ #     description: str
│   │   │ #     category: ToolCategory
│   │   │ #     parameters: List[ToolParameter]
│   │   │ #
│   │   │ # class BaseTool(ABC):
│   │   │ #     @property
│   │   │ #     @abstractmethod
│   │   │ #     def definition(self) -> ToolDefinition:
│   │   │ #         pass
│   │   │ #
│   │   │ #     @abstractmethod
│   │   │ #     async def execute(self, **kwargs) -> Dict:
│   │   │ #         pass
│   │   │ #
│   │   │ #     def to_openai_function(self) -> Dict:
│   │   │ #         """轉換為 OpenAI Function Calling 格式"""
│   │   │ #
│   │   │ # class ToolRegistry:
│   │   │ #     _tools: Dict[str, BaseTool]
│   │   │ #
│   │   │ #     def register(tool: BaseTool)
│   │   │ #     def get(name: str) -> BaseTool
│   │   │ #     async def execute(name, **kwargs) -> Dict
│   │   │ #     async def initialize_all()
│   │
│   ├── 📄 rag_tool.py                # RAG 搜尋工具 (約 150 行)
│   │   │
│   │   │ # class RAGSearchTool(BaseTool):
│   │   │ #     @property
│   │   │ #     def definition(self):
│   │   │ #         return ToolDefinition(
│   │   │ #             name="rag_search",
│   │   │ #             description="搜尋知識庫中的相關文檔",
│   │   │ #             parameters=[
│   │   │ #                 ToolParameter("query", "string", required=True),
│   │   │ #                 ToolParameter("top_k", "integer", default=5),
│   │   │ #                 ToolParameter("filters", "object", required=False)
│   │   │ #             ]
│   │   │ #         )
│   │   │ #
│   │   │ #     async def execute(query, top_k, filters):
│   │   │ #         return await kb_service.search(query, top_k, filters)
│   │
│   ├── 📄 code_tool.py               # ⭐ 代碼執行工具 (約 200 行)
│   │   │
│   │   │ # class CodeExecutorTool(BaseTool):
│   │   │ #     _service: SandboxService
│   │   │ #
│   │   │ #     async def initialize(self):
│   │   │ #         self._service = SandboxService()
│   │   │ #         await self._service.initialize()
│   │   │ #
│   │   │ #     async def execute(code, language, timeout):
│   │   │ #         result = await self._service.execute(
│   │   │ #             method="execute_python",
│   │   │ #             params={"code": code, "timeout": timeout}
│   │   │ #         )
│   │   │ #         
│   │   │ #         return {
│   │   │ #             "success": result.get("success"),
│   │   │ #             "stdout": result.get("stdout"),
│   │   │ #             "stderr": result.get("stderr"),
│   │   │ #             "figures": result.get("figures", []),
│   │   │ #             "execution_time": result.get("execution_time")
│   │   │ #         }
│   │
│   ├── 📄 web_tool.py                # 網頁搜尋工具 (約 150 行)
│   │
│   └── 📄 file_tool.py               # 文件操作工具 (約 200 行)
│
├── 📁 core/                          # ═══ 核心模組 ═══
│   │
│   ├── 📄 __init__.py
│   │
│   ├── 📄 engine.py                  # OpenCodeEngine (舊版核心)
│   │   │                             # 處理 RAG 對話流程
│   │
│   ├── 📄 protocols.py               # 協議定義
│   │   │                             # Intent, Context, Event 等
│   │
│   ├── 📄 events.py                  # 事件系統
│   │   │                             # EventType, create_event()
│   │
│   ├── 📄 context.py                 # 上下文管理
│   │
│   └── 📄 env.py                     # 環境變數
│
├── 📁 auth/                          # ═══ 認證系統 ═══
│   │
│   ├── 📄 __init__.py
│   ├── 📄 jwt.py                     # JWT 處理
│   ├── 📄 models.py                  # 用戶模型
│   ├── 📄 routes.py                  # 認證路由
│   └── 📄 service.py                 # 認證服務
│
├── 📁 control_plane/                 # ═══ 控制平面 ═══
│   │
│   ├── 📁 audit/                     # 審計日誌
│   │   ├── 📄 logger.py
│   │   ├── 📄 routes.py
│   │   └── 📄 service.py
│   │
│   ├── 📁 cost/                      # 成本追蹤
│   │   ├── 📄 routes.py
│   │   └── 📄 service.py
│   │
│   ├── 📁 ops/                       # 運維
│   │   └── 📄 tracer.py
│   │
│   └── 📁 policy/                    # 策略引擎
│       └── 📄 engine.py
│
├── 📁 cli/                           # ═══ 命令行界面 ═══
│   │
│   ├── 📄 __init__.py
│   ├── 📄 main.py                    # CLI 主入口
│   ├── 📁 commands/                  # CLI 命令
│   └── 📁 tui/                       # 終端 UI
│
├── 📁 config/                        # ═══ 配置 ═══
│   │
│   ├── 📄 __init__.py
│   └── 📄 settings.py                # 設定管理
│
├── 📁 gateway/                       # ═══ 閘道 ═══
│   │
│   └── 📄 mcp_gateway.py             # MCP 閘道
│
├── 📁 orchestrator/                  # ═══ 編排器 (舊版) ═══
│   │
│   └── 📁 actors/
│       ├── 📄 base.py
│       ├── 📄 orchestrator.py
│       ├── 📄 planner.py
│       ├── 📄 router.py
│       ├── 📄 executor.py
│       └── 📄 memory.py
│
├── 📁 plugins/                       # ═══ 插件系統 ═══
│   │
│   ├── 📄 manager.py                 # 插件管理器
│   └── 📄 routes.py                  # 插件路由
│
└── 📁 marketplace/                   # ═══ 市場 ═══
    │
    ├── 📄 routes.py
    └── 📄 service.py
```

## 3.3 前端源碼結構 (`frontend/`)

```
frontend/                             # 前端根目錄
│
├── 📄 index.html                     # HTML 入口
│
├── 📄 package.json                   # NPM 依賴配置
│   │                                 # 主要依賴:
│   │                                 # - react: ^18.2.0
│   │                                 # - react-dom: ^18.2.0
│   │                                 # - react-router-dom: ^6.x
│   │                                 # - lucide-react: 圖標
│   │                                 # - react-pdf: PDF 預覽
│   │                                 # - react-markdown: Markdown 渲染
│   │                                 # - clsx: 類名工具
│   │
├── 📄 vite.config.js                 # Vite 配置
│   │                                 # 配置代理、端口等
│   │
├── 📄 tailwind.config.js             # Tailwind 配置
│   │                                 # 自定義主題、顏色
│   │
├── 📄 postcss.config.js              # PostCSS 配置
│
└── 📁 src/                           # 源碼目錄
    │
    ├── 📄 main.jsx                   # React 入口
    │   │                             # ReactDOM.createRoot(...)
    │
    ├── 📄 index.css                  # 全局樣式
    │   │                             # Tailwind 導入
    │   │                             # 自定義 CSS 變數
    │
    ├── 📄 App.jsx                    # 主應用組件
    │   │
    │   │ # function App() {
    │   │ #     return (
    │   │ #         <Router>
    │   │ #             <Routes>
    │   │ #                 <Route path="/login" element={<LoginPage />} />
    │   │ #                 <Route path="/" element={<ChatInterface />} />
    │   │ #                 <Route path="/admin" element={<AdminPanel />} />
    │   │ #                 <Route path="/agents" element={<AgentsPage />} />
    │   │ #                 <Route path="/research" element={<ResearchPanel />} />
    │   │ #                 <Route path="/collections" element={<CollectionsPage />} />
    │   │ #             </Routes>
    │   │ #         </Router>
    │   │ #     )
    │   │ # }
    │
    └── 📁 components/                # 組件目錄
        │
        ├── 📄 ChatInterface.jsx      # ⭐⭐ 聊天界面 (1386 行)
        │   │
        │   │ # ═══ 這是最重要的前端組件 ═══
        │   │ #
        │   │ # 狀態管理:
        │   │ # const [messages, setMessages] = useState([])
        │   │ # const [processSteps, setProcessSteps] = useState([])
        │   │ # const [isLoading, setIsLoading] = useState(false)
        │   │ # const [selectedDocs, setSelectedDocs] = useState([])
        │   │ # const [streamingContent, setStreamingContent] = useState('')
        │   │ # const [conversations, setConversations] = useState([])
        │   │ #
        │   │ # 核心函數:
        │   │ #
        │   │ # const sendMessage = async () => {
        │   │ #     // 1. 添加初始分析步驟
        │   │ #     addStep({
        │   │ #         id: 'step_analyze',
        │   │ #         type: 'analysis',
        │   │ #         title: '🧠 理解問題',
        │   │ #         status: 'running'
        │   │ #     })
        │   │ #     
        │   │ #     // 2. 發送 SSE 請求
        │   │ #     const response = await fetch('/agents/process', {
        │   │ #         method: 'POST',
        │   │ #         body: JSON.stringify({
        │   │ #             request: userMessage,
        │   │ #             context: { selected_docs: selectedDocs },
        │   │ #             stream: true
        │   │ #         })
        │   │ #     })
        │   │ #     
        │   │ #     // 3. 處理 SSE 串流
        │   │ #     const reader = response.body.getReader()
        │   │ #     while (true) {
        │   │ #         const { done, value } = await reader.read()
        │   │ #         if (done) break
        │   │ #         
        │   │ #         // 解析 SSE 事件
        │   │ #         const event = JSON.parse(line.slice(6))
        │   │ #         
        │   │ #         switch (event.type) {
        │   │ #             case 'thinking':
        │   │ #                 updateStepById('step_analyze', {...})
        │   │ #                 break
        │   │ #             
        │   │ #             case 'plan':
        │   │ #                 addStep({ type: 'planning', subtasks: ... })
        │   │ #                 break
        │   │ #             
        │   │ #             case 'agent_start':
        │   │ #                 addStep({ type: 'agent_execute', ... })
        │   │ #                 break
        │   │ #             
        │   │ #             case 'tool_call':
        │   │ #                 updateCurrentStep({ toolCalls: [...] })
        │   │ #                 break
        │   │ #             
        │   │ #             case 'code_execution':
        │   │ #                 updateCurrentStep({ executionResult: ... })
        │   │ #                 break
        │   │ #             
        │   │ #             case 'final':
        │   │ #                 setMessages([...messages, { content: ... }])
        │   │ #                 break
        │   │ #         }
        │   │ #     }
        │   │ #     
        │   │ #     // 4. 保存步驟到消息
        │   │ #     setMessages([...messages, {
        │   │ #         content: finalContent,
        │   │ #         processSteps: localSteps,
        │   │ #         sources: allSources
        │   │ #     }])
        │   │ # }
        │   │ #
        │   │ # JSX 結構:
        │   │ # <div className="flex h-screen">
        │   │ #     {/* 側邊欄 - 對話歷史 */}
        │   │ #     <Sidebar conversations={conversations} />
        │   │ #     
        │   │ #     {/* 主區域 */}
        │   │ #     <main className="flex-1">
        │   │ #         {/* 訊息列表 */}
        │   │ #         {messages.map(msg => <MessageBubble />)}
        │   │ #         
        │   │ #         {/* 思考過程 (處理中) */}
        │   │ #         {processSteps.length > 0 && (
        │   │ #             <ProcessSteps steps={processSteps} />
        │   │ #         )}
        │   │ #         
        │   │ #         {/* 輸入區 */}
        │   │ #         <InputArea onSend={sendMessage} />
        │   │ #     </main>
        │   │ #     
        │   │ #     {/* 右側邊欄 - 文件列表 */}
        │   │ #     <DocumentList selectedDocs={selectedDocs} />
        │   │ # </div>
        │
        ├── 📄 ProcessSteps.jsx       # ⭐ 思考過程組件 (414 行)
        │   │
        │   │ # 顯示 AI 的思考和執行過程
        │   │ #
        │   │ # function ProcessSteps({ steps, isProcessing }) {
        │   │ #     return (
        │   │ #         <div className="process-steps">
        │   │ #             <div className="header">
        │   │ #                 <Brain /> 思考與執行過程
        │   │ #             </div>
        │   │ #             
        │   │ #             {steps.map((step, i) => (
        │   │ #                 <StepItem step={step} />
        │   │ #             ))}
        │   │ #         </div>
        │   │ #     )
        │   │ # }
        │   │ #
        │   │ # function StepItem({ step }) {
        │   │ #     // 根據步驟類型顯示不同圖標
        │   │ #     const Icon = {
        │   │ #         analysis: Brain,
        │   │ #         planning: ListTree,
        │   │ #         tool_call: Search,
        │   │ #         code_execution: Terminal,
        │   │ #         generating: Sparkles
        │   │ #     }[step.type]
        │   │ #     
        │   │ #     return (
        │   │ #         <div className="step-item">
        │   │ #             {/* 狀態指示器 */}
        │   │ #             {step.status === 'completed' && <CheckCircle />}
        │   │ #             {step.status === 'running' && <Loader spinning />}
        │   │ #             
        │   │ #             {/* 標題 */}
        │   │ #             <Icon /> {step.title}
        │   │ #             
        │   │ #             {/* 展開內容 */}
        │   │ #             {expanded && (
        │   │ #                 <>
        │   │ #                     {/* 搜尋查詢 */}
        │   │ #                     {step.queries?.map(q => <QueryBadge />)}
        │   │ #                     
        │   │ #                     {/* 子任務 */}
        │   │ #                     {step.subSteps?.map(s => <SubStep />)}
        │   │ #                     
        │   │ #                     {/* 工具調用 */}
        │   │ #                     {step.toolCalls?.map(tc => <ToolCall />)}
        │   │ #                     
        │   │ #                     {/* 代碼執行結果 */}
        │   │ #                     {step.executionResult && (
        │   │ #                         <CodeExecutionResult 
        │   │ #                             result={step.executionResult}
        │   │ #                             code={step.code}
        │   │ #                         />
        │   │ #                     )}
        │   │ #                 </>
        │   │ #             )}
        │   │ #         </div>
        │   │ #     )
        │   │ # }
        │
        ├── 📄 CodeExecutionResult.jsx # ⭐ 代碼執行結果 (約 200 行)
        │   │
        │   │ # 顯示 Sandbox 執行結果和圖表
        │   │ #
        │   │ # function CodeExecutionResult({ result, code }) {
        │   │ #     const { success, stdout, stderr, figures } = result
        │   │ #     
        │   │ #     return (
        │   │ #         <div className={success ? "bg-green-50" : "bg-red-50"}>
        │   │ #             {/* 標題 */}
        │   │ #             <div className="header">
        │   │ #                 {success ? <CheckCircle /> : <XCircle />}
        │   │ #                 程式碼執行 {success ? '成功' : '失敗'}
        │   │ #                 {figures.length > 0 && `📊 ${figures.length} 個圖表`}
        │   │ #             </div>
        │   │ #             
        │   │ #             {/* 程式碼 (可摺疊) */}
        │   │ #             {code && <CollapsibleCode code={code} />}
        │   │ #             
        │   │ #             {/* 輸出 */}
        │   │ #             {stdout && <pre>{stdout}</pre>}
        │   │ #             
        │   │ #             {/* 錯誤 */}
        │   │ #             {stderr && <pre className="error">{stderr}</pre>}
        │   │ #             
        │   │ #             {/* 圖表 ⭐ */}
        │   │ #             {figures.map((fig, i) => (
        │   │ #                 <img 
        │   │ #                     src={`data:image/png;base64,${fig}`}
        │   │ #                     alt={`圖表 ${i + 1}`}
        │   │ #                 />
        │   │ #             ))}
        │   │ #         </div>
        │   │ #     )
        │   │ # }
        │
        ├── 📄 PDFViewer.jsx          # PDF 預覽組件 (約 200 行)
        │   │                         # 使用 react-pdf 庫
        │
        ├── 📄 DocumentList.jsx       # 文件列表組件 (約 250 行)
        │   │                         # 顯示已上傳的文件
        │   │                         # 支援選擇文件進行搜尋
        │
        ├── 📄 SourceCard.jsx         # 來源卡片組件 (約 100 行)
        │   │                         # 顯示搜尋結果來源
        │
        ├── 📄 ResearchPanel.jsx      # 深度研究面板 (約 400 行)
        │   │                         # 啟動和追蹤深度研究任務
        │
        ├── 📄 LoginPage.jsx          # 登入頁面 (約 150 行)
        │
        ├── 📄 AdminPanel.jsx         # 管理面板 (約 300 行)
        │   │                         # 系統配置、用戶管理
        │
        ├── 📄 AgentsPage.jsx         # Agent 頁面 (約 200 行)
        │   │                         # 顯示 Agent 狀態
        │
        ├── 📄 AuditLogPanel.jsx      # 審計日誌面板 (約 200 行)
        │
        ├── 📄 CostDashboard.jsx      # 成本儀表板 (約 250 行)
        │
        ├── 📄 UserManagement.jsx     # 用戶管理 (約 200 行)
        │
        ├── 📄 CollectionsPage.jsx    # 集合頁面 (約 300 行)
        │
        ├── 📄 MCPPage.jsx            # MCP 頁面 (約 200 行)
        │
        ├── 📄 ThinkingBlock.jsx      # 舊版思考區塊 (已被 ProcessSteps 取代)
        │
        └── 📄 ToolCallBlock.jsx      # 工具調用區塊 (約 100 行)
```

---

# 第四章 後端模組詳解

(由於篇幅限制，以下章節將在文件繼續中呈現)

---

# 第十章 API 端點完整說明

## 10.1 端點總覽

| 端點 | 方法 | 說明 | 認證 | 串流 |
|------|------|------|------|------|
| `/health` | GET | 健康檢查 | ❌ | ❌ |
| `/stats` | GET | 系統統計 | ❌ | ❌ |
| `/chat/stream` | POST | RAG 串流對話 | ❌ | ✅ |
| `/chat` | POST | RAG 同步對話 | ❌ | ❌ |
| `/search` | POST | 語意搜尋 | ❌ | ❌ |
| `/search/filtered` | POST | 指定文件搜尋 | ❌ | ❌ |
| `/upload` | POST | 上傳文件 | ❌ | ❌ |
| `/documents` | GET | 列出文件 | ❌ | ❌ |
| `/documents/{name}` | DELETE | 刪除文件 | ❌ | ❌ |
| `/documents/{name}/pdf` | GET | PDF 預覽 | ❌ | ❌ |
| `/agents/process` | POST | Multi-Agent 處理 | ✅ | ✅ |
| `/agents` | GET | 列出 Agent | ✅ | ❌ |
| `/agents/types` | GET | Agent 類型 | ❌ | ❌ |
| `/agents/tools` | GET | 可用工具 | ✅ | ❌ |
| `/auth/login` | POST | 登入 | ❌ | ❌ |
| `/auth/register` | POST | 註冊 | ❌ | ❌ |
| `/auth/me` | GET | 當前用戶 | ✅ | ❌ |
| `/research/start` | POST | 開始研究 | ✅ | ❌ |
| `/research/{id}/status` | GET | 研究狀態 | ✅ | ❌ |
| `/audit/logs` | GET | 審計日誌 | ✅ Admin | ❌ |
| `/cost/usage` | GET | 使用量 | ✅ | ❌ |

## 10.2 SSE 事件類型

| 事件類型 | 說明 | 載荷 |
|---------|------|------|
| `thinking` | 開始思考 | `{content: string}` |
| `analysis_complete` | 分析完成 | `{content, is_simple_query}` |
| `plan` | 任務規劃 | `{subtasks: [{agent, description}]}` |
| `agent_start` | Agent 開始 | `{agent, task}` |
| `tool_call` | 工具調用 | `{tool, arguments, result, success}` |
| `code_execution` | 代碼執行 | `{code, result: {success, figures}}` |
| `step_result` | 步驟完成 | `{success, output, tool_calls}` |
| `step_error` | 步驟錯誤 | `{error}` |
| `summarizing` | 整理結果 | `{content}` |
| `final` | 最終回答 | `{content}` |

---

# 第十二章 配置與部署

## 12.1 環境變數 (.env)

```bash
# ═══════════════════════════════════════
# 必要配置
# ═══════════════════════════════════════

# LLM (OpenAI)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx

# Embedding (Cohere)
COHERE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# ═══════════════════════════════════════
# 可選配置
# ═══════════════════════════════════════

# API 伺服器
API_HOST=0.0.0.0
API_PORT=8888

# Qdrant 向量資料庫
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Cohere 模型
COHERE_EMBED_MODEL=embed-multilingual-v3.0

# LLM 模型
LLM_MODEL=gpt-4o

# 日誌級別
LOG_LEVEL=INFO

# JWT 配置
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# 資料目錄
DATA_DIR=./data
RAW_DIR=./data/raw
```

## 12.2 快速啟動

### Windows (PowerShell)

```powershell
# 1. 啟動 Qdrant
docker run -d -p 6333:6333 qdrant/qdrant

# 2. 創建虛擬環境
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. 安裝依賴
pip install -r requirements.txt

# 4. 配置環境變數
cp .env.example .env
# 編輯 .env 填入 API Key

# 5. 啟動後端
python run.py api

# 6. 啟動前端 (新終端)
cd frontend
npm install
npm run dev

# 訪問 http://localhost:5173
```

### 一鍵啟動

```powershell
# 使用 start.ps1
.\start.ps1
```

---

# 附錄

## A. 文件統計

| 類別 | 文件數 | 總行數 |
|------|--------|--------|
| 後端 Python | 約 70 個 | 約 12,000 行 |
| 前端 JSX | 約 20 個 | 約 5,000 行 |
| 配置/文件 | 約 15 個 | 約 1,000 行 |
| **總計** | **約 105 個** | **約 18,000 行** |

## B. 關鍵文件行數

| 文件 | 行數 | 重要性 |
|------|------|--------|
| ChatInterface.jsx | 1,386 | ⭐⭐⭐ |
| api/main.py | 915 | ⭐⭐⭐ |
| sandbox/service.py | 578 | ⭐⭐⭐ |
| specialists.py | 493 | ⭐⭐⭐ |
| knowledge_base/service.py | 469 | ⭐⭐ |
| coordinator.py | 428 | ⭐⭐⭐ |
| ProcessSteps.jsx | 414 | ⭐⭐ |

## C. 版本歷史

| 版本 | 日期 | 主要更新 |
|------|------|----------|
| v4.9.0 | 2025-01-30 | Sandbox 圖表內嵌、Token 優化 |
| v4.8.x | 2025-01-30 | Multi-Agent 思考過程 |
| v4.0.0 | 2025-01-26 | Multi-Agent 系統上線 |
| v3.0.0 | 2025-01-25 | Deep Research 功能 |
| v2.0.0 | 2025-01-24 | OCR 支援 |
| v1.0.0 | 2025-01-20 | RAG 基礎功能 |

---

**文件結束**

> 如有問題，請參考 README.md 或提交 Issue。
