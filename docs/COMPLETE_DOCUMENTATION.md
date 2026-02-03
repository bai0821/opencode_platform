# OpenCode Platform - 完整技術文件

> **版本**: v4.9.0
> **最後更新**: 2025-01-30
> **作者**: AI Assistant

---

## 📋 目錄

1. [專案概述](#1-專案概述)
2. [技術棧](#2-技術棧)
3. [系統架構](#3-系統架構)
4. [目錄結構詳解](#4-目錄結構詳解)
5. [核心模組詳解](#5-核心模組詳解)
6. [Multi-Agent 系統](#6-multi-agent-系統)
7. [RAG 問答系統](#7-rag-問答系統)
8. [Sandbox 代碼執行](#8-sandbox-代碼執行)
9. [前端組件](#9-前端組件)
10. [API 端點](#10-api-端點)
11. [資料流程](#11-資料流程)
12. [配置說明](#12-配置說明)
13. [部署指南](#13-部署指南)

---

## 1. 專案概述

### 1.1 什麼是 OpenCode Platform？

OpenCode Platform 是一個企業級 AI 助手平台，整合了：

- **RAG (Retrieval-Augmented Generation)** - 基於文檔的智能問答
- **Multi-Agent 協作系統** - 多個專業 AI 代理協同工作
- **Sandbox 代碼執行** - 安全的 Python 代碼執行環境
- **Deep Research** - 深度研究報告生成

### 1.2 核心功能

| 功能 | 說明 |
|------|------|
| 📄 文檔問答 | 上傳 PDF，用自然語言提問 |
| 🤖 Multi-Agent | 複雜任務自動拆解並分配給專業 Agent |
| 💻 代碼執行 | 在安全沙箱中執行 Python，生成圖表 |
| 🔍 深度研究 | 多輪搜尋生成結構化報告 |
| 👁️ 思考過程 | 可視化 AI 的思考和決策過程 |

### 1.3 設計理念

```
用戶請求
    ↓
┌─────────────────────────────────────────┐
│           Dispatcher (總機)              │
│   分析問題 → 拆解任務 → 分配 Agent        │
└─────────────────────────────────────────┘
    ↓
┌─────────┬─────────┬─────────┬─────────┐
│Researcher│ Writer │  Coder  │ Analyst │
│  研究者  │ 寫作者  │ 編碼者  │ 分析師  │
└─────────┴─────────┴─────────┴─────────┘
    ↓
┌─────────────────────────────────────────┐
│              Tools (工具層)              │
│ RAG搜尋 │ 代碼執行 │ 網頁搜尋 │ 文件操作 │
└─────────────────────────────────────────┘
    ↓
最終回答
```

---

## 2. 技術棧

### 2.1 後端

| 技術 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 主要開發語言 |
| FastAPI | 0.108+ | Web 框架 |
| Uvicorn | 0.25+ | ASGI 伺服器 |
| Pydantic | 2.0+ | 資料驗證 |
| OpenAI | 1.0+ | GPT-4o LLM |
| Cohere | 5.0+ | Embedding 模型 |
| Qdrant | 1.7+ | 向量資料庫 |
| PyMuPDF | 1.23+ | PDF 解析 |
| Docling | 2.0+ | 文檔解析 (OCR) |

### 2.2 前端

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 18 | UI 框架 |
| Vite | 5.0+ | 建構工具 |
| Tailwind CSS | 3.0+ | CSS 框架 |
| Lucide React | - | 圖標庫 |
| React-PDF | - | PDF 預覽 |
| React-Markdown | - | Markdown 渲染 |

### 2.3 基礎設施

| 技術 | 用途 |
|------|------|
| Docker | 容器化部署 |
| Qdrant (Docker) | 向量資料庫 |
| JWT | 身份認證 |

### 2.4 依賴安裝

```bash
# Python 依賴
pip install -r requirements.txt

# 前端依賴
cd frontend && npm install
```

---

## 3. 系統架構

### 3.1 整體架構圖

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React)                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ChatInterface │ │ProcessSteps  │ │ PDFViewer    │ │ResearchPanel │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/SSE
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API Layer (FastAPI)                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ /chat/stream │ │ /agents/*    │ │ /documents   │ │ /research    │   │
│  │   SSE 串流   │ │ Multi-Agent  │ │  文件管理    │ │   深度研究   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Middleware (中間件)                            │   │
│  │  Authentication │ Audit Logging │ CORS │ Rate Limiting           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Multi-Agent System (Coordinator)                     │
│  ┌──────────────┐                                                        │
│  │  Dispatcher  │ ─────────────────────────────────────────────┐        │
│  │    (總機)    │                                              │        │
│  └──────────────┘                                              │        │
│         │                                                       │        │
│         ▼                                                       ▼        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐│
│  │ Researcher │ │   Writer   │ │   Coder    │ │  Analyst   │ │Reviewer││
│  │   研究者   │ │   寫作者   │ │   編碼者   │ │   分析師   │ │ 審核者 ││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Tools Layer (工具層)                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  RAG Search  │ │Code Execute  │ │  Web Search  │ │ File Tools   │   │
│  │   向量搜尋   │ │  代碼執行    │ │   網頁搜尋   │ │   文件操作   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Services Layer (服務層)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │KnowledgeBase │ │   Sandbox    │ │   Research   │ │  Web Search  │   │
│  │   知識庫     │ │   沙箱執行   │ │   深度研究   │ │   網頁搜尋   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Infrastructure (基礎設施)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│  │    Qdrant    │ │    Cohere    │ │   OpenAI     │                    │
│  │   向量 DB    │ │  Embedding   │ │    LLM       │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 請求處理流程

```
1. 用戶發送訊息
       │
       ▼
2. 前端 ChatInterface 發送 POST /agents/process (stream=true)
       │
       ▼
3. API 路由接收請求，調用 Coordinator
       │
       ▼
4. Coordinator 調用 Dispatcher 分析請求
       │
       ├── 簡單查詢 → 直接分配給 Researcher
       │
       └── 複雜任務 → 拆解為多個子任務
              │
              ▼
5. 按順序執行子任務
       │
       ├── Researcher → 調用 RAG 搜尋工具
       │
       ├── Coder → 調用 Sandbox 執行代碼
       │
       └── Writer → 生成文字內容
              │
              ▼
6. 聚合所有 Agent 結果
       │
       ▼
7. 通過 SSE 串流返回給前端
       │
       ▼
8. 前端即時更新 ProcessSteps 和訊息內容
```

---

## 4. 目錄結構詳解

### 4.1 根目錄

```
opencode-platform/
│
├── 📄 run.py                    # 主啟動腳本
├── 📄 requirements.txt          # Python 依賴
├── 📄 pyproject.toml            # 專案配置
├── 📄 docker-compose.yml        # Docker 編排
├── 📄 start.ps1                 # Windows 啟動腳本
├── 📄 stop.ps1                  # Windows 停止腳本
│
├── 📄 README.md                 # 專案說明
├── 📄 PROJECT_GUIDE.md          # 開發指南
├── 📄 PROGRESS_REPORT.md        # 進度報告
│
├── 📁 src/                      # 後端源碼
├── 📁 frontend/                 # 前端源碼
├── 📁 docs/                     # 文件
├── 📁 tests/                    # 測試
├── 📁 scripts/                  # 腳本工具
├── 📁 docker/                   # Docker 配置
└── 📁 plugins/                  # 插件
```

### 4.2 後端源碼 (`src/opencode/`)

```
src/opencode/
│
├── 📄 __init__.py               # 模組初始化
│
├── 📁 api/                      # API 層
│   ├── 📄 __init__.py
│   ├── 📄 main.py               # FastAPI 應用主體 ⭐
│   ├── 📁 middleware/           # 中間件
│   │   ├── 📄 audit.py          # 審計日誌中間件
│   │   └── 📄 __init__.py
│   └── 📁 routes/               # 額外路由
│       ├── 📄 qdrant.py         # Qdrant 調試路由
│       └── 📄 research.py       # 深度研究路由
│
├── 📁 agents/                   # Multi-Agent 系統 ⭐
│   ├── 📄 __init__.py
│   ├── 📄 base.py               # Agent 基類
│   ├── 📄 coordinator.py        # 協調器 ⭐
│   ├── 📄 dispatcher.py         # 總機 Agent
│   ├── 📄 specialists.py        # 專業 Agent ⭐
│   └── 📄 routes.py             # Agent API 路由
│
├── 📁 auth/                     # 認證系統
│   ├── 📄 __init__.py
│   ├── 📄 jwt.py                # JWT 處理
│   ├── 📄 models.py             # 用戶模型
│   ├── 📄 routes.py             # 認證路由
│   └── 📄 service.py            # 認證服務
│
├── 📁 cli/                      # 命令行界面
│   ├── 📄 __init__.py
│   ├── 📄 main.py               # CLI 主入口
│   ├── 📁 commands/             # CLI 命令
│   └── 📁 tui/                  # 終端 UI
│
├── 📁 config/                   # 配置
│   ├── 📄 __init__.py
│   └── 📄 settings.py           # 設定管理
│
├── 📁 control_plane/            # 控制平面
│   ├── 📁 audit/                # 審計日誌
│   │   ├── 📄 logger.py
│   │   ├── 📄 routes.py
│   │   └── 📄 service.py
│   ├── 📁 cost/                 # 成本追蹤
│   │   ├── 📄 routes.py
│   │   └── 📄 service.py
│   ├── 📁 ops/                  # 運維
│   │   └── 📄 tracer.py
│   └── 📁 policy/               # 策略引擎
│       └── 📄 engine.py
│
├── 📁 core/                     # 核心模組
│   ├── 📄 __init__.py
│   ├── 📄 context.py            # 上下文管理
│   ├── 📄 engine.py             # 主引擎
│   ├── 📄 env.py                # 環境變數
│   ├── 📄 events.py             # 事件系統
│   ├── 📄 protocols.py          # 協議定義
│   └── 📄 utils.py              # 工具函數
│
├── 📁 gateway/                  # 閘道
│   └── 📄 mcp_gateway.py        # MCP 閘道
│
├── 📁 marketplace/              # 市場
│   ├── 📄 routes.py
│   └── 📄 service.py
│
├── 📁 orchestrator/             # 編排器 (舊版)
│   └── 📁 actors/
│       ├── 📄 base.py
│       ├── 📄 executor.py
│       ├── 📄 memory.py
│       ├── 📄 orchestrator.py
│       ├── 📄 planner.py
│       └── 📄 router.py
│
├── 📁 plugins/                  # 插件系統
│   ├── 📄 manager.py
│   └── 📄 routes.py
│
├── 📁 services/                 # 服務層 ⭐
│   ├── 📁 knowledge_base/       # 知識庫服務 ⭐
│   │   ├── 📄 service.py        # 主服務
│   │   ├── 📄 parser.py         # 文檔解析
│   │   ├── 📄 multimodal_parser.py  # 多模態解析 ⭐
│   │   ├── 📄 indexer.py        # 向量索引
│   │   └── 📄 retriever.py      # 檢索器
│   │
│   ├── 📁 sandbox/              # 沙箱服務 ⭐
│   │   ├── 📄 service.py        # 代碼執行服務
│   │   └── 📁 runtimes/
│   │
│   ├── 📁 research/             # 深度研究服務
│   │   └── 📄 service.py
│   │
│   ├── 📁 web_search/           # 網頁搜尋服務
│   │   └── 📄 service.py
│   │
│   ├── 📁 collections/          # 集合管理
│   ├── 📁 mcp/                  # MCP 服務
│   └── 📁 repo_ops/             # Git 操作
│
└── 📁 tools/                    # 工具層 ⭐
    ├── 📄 __init__.py           # 工具註冊
    ├── 📄 base.py               # 工具基類
    ├── 📄 rag_tool.py           # RAG 搜尋工具
    ├── 📄 code_tool.py          # 代碼執行工具
    ├── 📄 web_tool.py           # 網頁搜尋工具
    └── 📄 file_tool.py          # 文件操作工具
```

### 4.3 前端源碼 (`frontend/src/`)

```
frontend/
├── 📄 index.html
├── 📄 package.json
├── 📄 vite.config.js            # Vite 配置
├── 📄 tailwind.config.js        # Tailwind 配置
├── 📄 postcss.config.js
│
└── 📁 src/
    ├── 📄 main.jsx              # 入口
    ├── 📄 App.jsx               # 主組件 + 路由
    ├── 📄 index.css             # 全局樣式
    │
    └── 📁 components/           # 組件
        ├── 📄 ChatInterface.jsx      # 聊天界面 ⭐
        ├── 📄 ProcessSteps.jsx       # 思考過程 ⭐
        ├── 📄 CodeExecutionResult.jsx # 代碼執行結果 ⭐
        ├── 📄 PDFViewer.jsx          # PDF 預覽
        ├── 📄 DocumentList.jsx       # 文件列表
        ├── 📄 SourceCard.jsx         # 來源卡片
        ├── 📄 ResearchPanel.jsx      # 深度研究面板
        ├── 📄 LoginPage.jsx          # 登入頁
        ├── 📄 AdminPanel.jsx         # 管理面板
        ├── 📄 AgentsPage.jsx         # Agent 頁面
        ├── 📄 AuditLogPanel.jsx      # 審計日誌
        ├── 📄 CostDashboard.jsx      # 成本儀表板
        └── 📄 UserManagement.jsx     # 用戶管理
```

---

## 5. 核心模組詳解

### 5.1 API 主入口 (`api/main.py`)

這是整個後端的入口點，負責：

1. **創建 FastAPI 應用**
2. **註冊所有路由**
3. **配置中間件**
4. **處理 SSE 串流**

```python
# 關鍵端點
app = FastAPI(title="OpenCode Platform")

# 文件操作
@app.post("/upload")           # 上傳 PDF
@app.get("/documents")         # 列出文件
@app.delete("/documents/{name}") # 刪除文件

# 聊天
@app.post("/chat/stream")      # SSE 串流對話
@app.post("/chat")             # 同步對話

# 搜尋
@app.post("/search")           # 語意搜尋
@app.post("/search/filtered")  # 指定文件搜尋

# 健康檢查
@app.get("/health")
@app.get("/stats")
```

**SSE 串流實現**:
```python
@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        async for event in engine.process_intent(intent):
            yield f"data: {json.dumps(event)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

### 5.2 核心引擎 (`core/engine.py`)

OpenCodeEngine 是舊版的核心引擎，處理 RAG 問答流程：

```python
class OpenCodeEngine:
    def __init__(self):
        self.kb_service = KnowledgeBaseService()  # 知識庫服務
        self.llm_client = AsyncOpenAI()           # LLM 客戶端
    
    async def process_intent(self, intent: Intent):
        # 1. 發送思考事件
        yield {"type": "thinking", "content": "分析問題..."}
        
        # 2. 搜尋知識庫
        results = await self.kb_service.search(intent.query)
        yield {"type": "tool_call", "tool": "rag_search", "results": results}
        
        # 3. 生成回答
        answer = await self._generate_answer(intent.query, results)
        yield {"type": "answer", "content": answer}
        
        # 4. 完成
        yield {"type": "done"}
```

### 5.3 事件系統 (`core/events.py`)

定義 SSE 事件類型和工廠函數：

```python
class EventType(str, Enum):
    THINKING = "thinking"      # 思考中
    PLAN = "plan"              # 規劃
    TOOL_CALL = "tool_call"    # 工具呼叫
    TOOL_RESULT = "tool_result"# 工具結果
    ANSWER = "answer"          # 回答
    SOURCE = "source"          # 來源
    DONE = "done"              # 完成
    ERROR = "error"            # 錯誤

def create_event(event_type: EventType, data: dict) -> dict:
    return {
        "type": event_type.value,
        "timestamp": datetime.now().isoformat(),
        **data
    }
```

---

## 6. Multi-Agent 系統

### 6.1 架構概述

Multi-Agent 系統是 v4.x 的核心功能，實現了多個 AI 代理協同工作。

```
┌─────────────────────────────────────────────────────────┐
│                    AgentCoordinator                      │
│                      (協調器)                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │              DispatcherAgent                     │   │
│  │               (總機 Agent)                       │   │
│  │  • 分析用戶請求                                  │   │
│  │  • 判斷是否需要拆解                              │   │
│  │  • 生成子任務列表                                │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                               │
│            ┌─────────────┼─────────────┐                │
│            ▼             ▼             ▼                │
│     ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│     │Researcher │ │  Coder    │ │  Writer   │          │
│     │  研究者   │ │  編碼者   │ │  寫作者   │          │
│     │           │ │           │ │           │          │
│     │ 工具:     │ │ 工具:     │ │ 工具:     │          │
│     │ rag_search│ │ code_exec │ │ file_write│          │
│     │ web_search│ │ code_anal │ │ rag_search│          │
│     └───────────┘ └───────────┘ └───────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Agent 基類 (`agents/base.py`)

所有 Agent 的基礎類別：

```python
class AgentType(str, Enum):
    DISPATCHER = "dispatcher"  # 總機
    RESEARCHER = "researcher"  # 研究者
    WRITER = "writer"          # 寫作者
    CODER = "coder"            # 編碼者
    ANALYST = "analyst"        # 分析師
    REVIEWER = "reviewer"      # 審核者

@dataclass
class AgentTask:
    id: str = ""
    type: str = ""
    description: str = ""
    parameters: Dict = field(default_factory=dict)
    context: Dict = field(default_factory=dict)

@dataclass
class AgentResult:
    task_id: str
    agent_type: str
    success: bool
    output: Any
    tool_calls: List[Dict] = field(default_factory=list)
    thinking: str = ""
    execution_time: float = 0.0
    error: str = None

class BaseAgent:
    def __init__(self, agent_type: AgentType, name: str):
        self.type = agent_type
        self.name = name
        self._llm_client = None
    
    async def think(self, prompt: str, use_tools: bool = True) -> Dict:
        """調用 LLM 進行思考"""
        response = await self._llm_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        return {"answer": response.choices[0].message.content}
    
    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """每個 Agent 的系統提示詞"""
        pass
    
    @abstractmethod
    async def process_task(self, task: AgentTask) -> AgentResult:
        """處理任務"""
        pass
```

### 6.3 協調器 (`agents/coordinator.py`)

管理整個 Multi-Agent 流程：

```python
class AgentCoordinator:
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}
        self._dispatcher: DispatcherAgent = None
    
    async def initialize(self):
        # 初始化工具
        await register_all_tools()
        
        # 創建 Dispatcher
        self._dispatcher = DispatcherAgent()
        await self._dispatcher.initialize()
        
        # 創建專業 Agent
        for agent_class in [ResearcherAgent, WriterAgent, CoderAgent, AnalystAgent]:
            agent = agent_class()
            await agent.initialize()
            self._agents[agent.type.value] = agent
    
    async def process_request(self, user_request: str, context: Dict = None):
        # 1. 發送思考事件
        yield {"type": "thinking", "content": "正在理解您的問題..."}
        
        # 2. Dispatcher 分析請求
        dispatch_result = await self._dispatcher.process_task(AgentTask(
            type="dispatch",
            description="分析用戶請求",
            parameters={"request": user_request},
            context=context
        ))
        
        analysis = dispatch_result.output.get("analysis")
        subtasks = dispatch_result.output.get("subtasks", [])
        
        # 3. 發送規劃事件
        yield {"type": "plan", "subtasks": subtasks}
        
        # 4. 按順序執行子任務
        results = {}
        for subtask in subtasks:
            agent = self.get_agent(subtask["agent"])
            
            # 發送 Agent 開始事件
            yield {"type": "agent_start", "agent": subtask["agent"]}
            
            result = await agent.process_task(AgentTask(
                description=subtask["description"],
                context=context
            ))
            results[subtask["id"]] = result
            
            # 發送工具呼叫事件
            for tc in result.tool_calls:
                yield {"type": "tool_call", "tool": tc["tool"], "result": tc["result"]}
            
            # 發送步驟完成事件
            yield {"type": "step_result", "success": result.success}
        
        # 5. 聚合結果
        yield {"type": "summarizing"}
        final_answer = await self._summarize_results(user_request, results)
        
        yield {"type": "final", "content": final_answer}
```

### 6.4 總機 Agent (`agents/dispatcher.py`)

負責分析請求和任務拆解：

```python
class DispatcherAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentType.DISPATCHER, "Dispatcher")
    
    @property
    def system_prompt(self) -> str:
        return """你是一個智能總機，負責分析用戶請求並分配任務。

判斷標準：
- **簡單查詢**：單一搜尋就能回答的問題
- **複雜任務**：需要多步驟、多個 Agent 協作

可用的 Agent：
- **researcher**: 研究者 - 搜尋知識庫、收集資料
- **writer**: 寫作者 - 撰寫文章、報告
- **coder**: 編碼者 - 編寫程式碼、執行計算、繪圖
- **analyst**: 分析師 - 數據分析、統計計算

特別注意：當用戶要求「計算」、「畫圖」時，必須分配給 coder！

輸出 JSON 格式：
{
  "is_simple_query": false,
  "analysis": "用戶想要...",
  "subtasks": [
    {
      "id": "task_1",
      "agent": "researcher",
      "description": "搜尋相關資料"
    },
    {
      "id": "task_2",
      "agent": "coder",
      "description": "計算並繪製圖表"
    }
  ]
}"""
```

### 6.5 專業 Agent (`agents/specialists.py`)

#### ResearcherAgent (研究者)
```python
class ResearcherAgent(BaseAgent):
    """負責搜集和分析資料"""
    
    @property
    def system_prompt(self) -> str:
        return """你是研究者 Agent。
        
可用工具：
- rag_search: 搜尋知識庫
- rag_multi_search: 多查詢搜尋
- web_search: 搜尋網路"""
    
    async def process_task(self, task: AgentTask) -> AgentResult:
        # 1. 構建搜尋查詢
        # 2. 調用 RAG 搜尋工具
        # 3. 整理搜尋結果
        pass
```

#### CoderAgent (編碼者) ⭐
```python
class CoderAgent(BaseAgent):
    """負責編寫和執行程式碼"""
    
    async def process_task(self, task: AgentTask) -> AgentResult:
        # 1. 讓 LLM 生成代碼
        result = await self.think(prompt, use_tools=False)
        
        # 2. 提取代碼
        code = self._extract_code(result["answer"])
        
        # 3. 執行代碼
        from opencode.tools import get_tool_registry
        registry = get_tool_registry()
        code_tool = registry.get("code_execute")
        
        execution_result = await code_tool.execute(
            code=code,
            language="python",
            timeout=60
        )
        
        # 4. 返回結果（包含圖表）
        return AgentResult(
            output={
                "code": code,
                "execution_result": execution_result,
                "figures": execution_result.get("figures", [])
            },
            tool_calls=[{
                "tool": "code_execute",
                "arguments": {"code": code},
                "result": execution_result
            }]
        )
```

---

## 7. RAG 問答系統

### 7.1 知識庫服務 (`services/knowledge_base/service.py`)

```python
class KnowledgeBaseService:
    def __init__(self):
        self.parser = MultimodalParser()    # 文檔解析
        self.indexer = DocumentIndexer()    # 向量索引
        self.retriever = DocumentRetriever() # 檢索器
    
    async def upload_document(self, file_path: str) -> Dict:
        """上傳並處理文檔"""
        # 1. 解析 PDF
        chunks = await self.parser.parse(file_path)
        
        # 2. 建立向量索引
        indexed = await self.indexer.index(chunks)
        
        return {"chunks": len(chunks), "indexed": indexed}
    
    async def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """語意搜尋"""
        return await self.retriever.search(query, top_k)
```

### 7.2 多模態解析器 (`services/knowledge_base/multimodal_parser.py`) ⭐

支援文字和圖片 OCR：

```python
class MultimodalParser:
    def __init__(self):
        self.chunk_size = 500
        self.chunk_overlap = 50
    
    async def parse(self, file_path: str) -> List[Dict]:
        """解析 PDF，提取文字和圖片"""
        import fitz  # PyMuPDF
        
        doc = fitz.open(file_path)
        chunks = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_label = str(page_num + 1)  # 正確的頁碼
            
            # 1. 提取文字
            text = page.get_text("text")
            
            # 2. 提取並 OCR 圖片
            images = page.get_images(full=True)
            for img in images:
                xref = img[0]
                image_bytes = doc.extract_image(xref)["image"]
                ocr_text = self._ocr_image(image_bytes)
                if ocr_text:
                    text += f"\n[圖片內容: {ocr_text}]"
            
            # 3. 分塊
            for chunk in self._split_text(text):
                chunks.append({
                    "content": chunk,
                    "page_label": page_label,
                    "file_name": os.path.basename(file_path)
                })
        
        return chunks
    
    def _ocr_image(self, image_bytes: bytes) -> str:
        """使用 Tesseract OCR 識別圖片文字"""
        try:
            from PIL import Image
            import pytesseract
            
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image, lang='chi_tra+eng')
            return text.strip()
        except:
            return ""
```

### 7.3 向量索引器 (`services/knowledge_base/indexer.py`)

使用 Cohere 生成 Embedding，存入 Qdrant：

```python
class DocumentIndexer:
    def __init__(self):
        self.cohere_client = cohere.Client(os.getenv("COHERE_API_KEY"))
        self.qdrant_client = QdrantClient(host="localhost", port=6333)
        self.collection_name = "documents"
        self.embed_model = "embed-multilingual-v3.0"  # 1024 維
    
    async def index(self, chunks: List[Dict]) -> int:
        """建立向量索引"""
        texts = [c["content"] for c in chunks]
        
        # 生成 Embedding
        response = self.cohere_client.embed(
            texts=texts,
            model=self.embed_model,
            input_type="search_document"
        )
        
        # 存入 Qdrant
        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "content": chunk["content"],
                    "page_label": chunk["page_label"],
                    "file_name": chunk["file_name"]
                }
            )
            for embedding, chunk in zip(response.embeddings, chunks)
        ]
        
        self.qdrant_client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        
        return len(points)
```

### 7.4 檢索器 (`services/knowledge_base/retriever.py`)

```python
class DocumentRetriever:
    async def search(
        self, 
        query: str, 
        top_k: int = 5,
        file_filter: List[str] = None
    ) -> List[Dict]:
        """語意搜尋"""
        
        # 1. Query Embedding
        query_embedding = self.cohere_client.embed(
            texts=[query],
            model=self.embed_model,
            input_type="search_query"  # 注意：查詢用不同的 input_type
        ).embeddings[0]
        
        # 2. 構建過濾條件
        filter_condition = None
        if file_filter:
            filter_condition = Filter(
                must=[
                    FieldCondition(
                        key="file_name",
                        match=MatchAny(any=file_filter)
                    )
                ]
            )
        
        # 3. 搜尋 Qdrant
        results = self.qdrant_client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=top_k,
            query_filter=filter_condition
        )
        
        return [
            {
                "content": r.payload["content"],
                "page_label": r.payload["page_label"],
                "file_name": r.payload["file_name"],
                "score": r.score
            }
            for r in results
        ]
```

---

## 8. Sandbox 代碼執行

### 8.1 服務架構

```
用戶請求「請計算 X 並畫圖」
        │
        ▼
Dispatcher 分配給 CoderAgent
        │
        ▼
CoderAgent 生成 Python 代碼
        │
        ▼
調用 code_execute 工具
        │
        ▼
┌─────────────────────────────────┐
│        SandboxService           │
│  ┌─────────────────────────────┐│
│  │    Windows?                 ││
│  │    ├─ Yes → 本地執行        ││
│  │    └─ No  → Docker 執行     ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
        │
        ▼
返回 {stdout, figures[], error}
        │
        ▼
前端顯示圖表 (base64 → <img>)
```

### 8.2 Sandbox 服務 (`services/sandbox/service.py`) ⭐

```python
class SandboxService:
    SANDBOX_IMAGE = "opencode-sandbox:latest"
    
    def __init__(self):
        self.docker_enabled = True
        self.timeout = 30
    
    async def initialize(self):
        import platform
        
        # Windows 上 Docker 有問題，使用本地執行
        if platform.system() == "Windows":
            self.docker_enabled = False
            return
        
        # 檢查 Docker
        try:
            import docker
            self.docker_client = docker.from_env()
        except:
            self.docker_enabled = False
    
    async def execute(self, method: str, params: Dict) -> Dict:
        if method == "execute_python":
            return await self._execute_python(
                code=params["code"],
                timeout=params.get("timeout", 30)
            )
    
    async def _execute_python(self, code: str, timeout: int) -> Dict:
        if self.docker_enabled:
            return await self._execute_python_docker(code, timeout)
        else:
            return await self._execute_python_local(code, timeout)
    
    async def _execute_python_local(self, code: str, timeout: int) -> Dict:
        """本地執行 Python（用於 Windows）"""
        import matplotlib
        matplotlib.use('Agg')  # 非交互式後端，不會彈窗
        import matplotlib.pyplot as plt
        
        # 攔截 plt.show()
        original_show = plt.show
        plt.show = lambda *args, **kwargs: None
        
        stdout_buffer = io.StringIO()
        figures = []
        
        try:
            # 重定向輸出
            sys.stdout = stdout_buffer
            
            # 執行代碼
            exec_globals = {'plt': plt, 'np': __import__('numpy')}
            exec(code, exec_globals)
            
            # 捕獲圖表
            for fig_num in plt.get_fignums():
                fig = plt.figure(fig_num)
                buf = io.BytesIO()
                fig.savefig(buf, format='png', dpi=100)
                buf.seek(0)
                img_base64 = base64.b64encode(buf.read()).decode('utf-8')
                figures.append(img_base64)
            
            return {
                "success": True,
                "stdout": stdout_buffer.getvalue(),
                "figures": figures
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
        
        finally:
            sys.stdout = sys.__stdout__
            plt.show = original_show
            plt.close('all')
```

### 8.3 代碼執行工具 (`tools/code_tool.py`)

```python
class CodeExecutorTool(BaseTool):
    @property
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="code_execute",
            description="在安全沙箱中執行 Python 程式碼",
            parameters=[
                ToolParameter(name="code", type="string", required=True),
                ToolParameter(name="language", type="string", default="python"),
                ToolParameter(name="timeout", type="integer", default=30)
            ]
        )
    
    async def initialize(self):
        from opencode.services.sandbox.service import SandboxService
        self._service = SandboxService()
        await self._service.initialize()
    
    async def execute(self, code: str, language: str = "python", timeout: int = 30) -> Dict:
        result = await self._service.execute(
            method="execute_python",
            params={"code": code, "timeout": timeout}
        )
        
        return {
            "success": result.get("success", False),
            "stdout": result.get("stdout", ""),
            "stderr": result.get("stderr", ""),
            "figures": result.get("figures", []),
            "execution_time": result.get("execution_time", 0)
        }
```

---

## 9. 前端組件

### 9.1 主應用 (`App.jsx`)

```jsx
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ChatInterface />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/research" element={<ResearchPanel />} />
      </Routes>
    </Router>
  )
}
```

### 9.2 聊天界面 (`ChatInterface.jsx`) ⭐

這是最核心的前端組件，約 1300 行：

```jsx
function ChatInterface() {
  // 狀態管理
  const [messages, setMessages] = useState([])
  const [processSteps, setProcessSteps] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState([])
  
  // 發送訊息
  const sendMessage = async () => {
    // 1. 添加初始步驟
    addStep({
      id: 'step_analyze',
      type: 'analysis',
      title: '🧠 理解問題',
      status: 'running'
    })
    
    // 2. 發送 SSE 請求
    const response = await fetch('/agents/process', {
      method: 'POST',
      body: JSON.stringify({
        request: userMessage,
        context: { selected_docs: selectedDocs },
        stream: true
      })
    })
    
    // 3. 處理 SSE 串流
    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      // 解析事件
      const event = JSON.parse(line.slice(6))
      
      switch (event.type) {
        case 'thinking':
          updateStep('step_analyze', { summary: event.content })
          break
        
        case 'plan':
          addStep({ type: 'planning', subtasks: event.subtasks })
          break
        
        case 'agent_start':
          addStep({ type: 'agent_execute', agent: event.agent })
          break
        
        case 'tool_call':
          updateCurrentStep({ toolCalls: [...toolCalls, event] })
          break
        
        case 'code_execution':
          updateCurrentStep({ executionResult: event.result })
          break
        
        case 'final':
          setMessages([...messages, { content: event.content }])
          break
      }
    }
  }
  
  return (
    <div className="chat-container">
      {/* 側邊欄 - 對話歷史 */}
      <Sidebar conversations={conversations} />
      
      {/* 主區域 */}
      <main>
        {/* 訊息列表 */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {/* 思考過程（處理中） */}
        {processSteps.length > 0 && (
          <ProcessSteps steps={processSteps} isProcessing={isLoading} />
        )}
        
        {/* 輸入區 */}
        <InputArea onSend={sendMessage} />
      </main>
      
      {/* 右側邊欄 - 文件列表 */}
      <DocumentList 
        selectedDocs={selectedDocs}
        onSelect={setSelectedDocs}
      />
    </div>
  )
}
```

### 9.3 思考過程組件 (`ProcessSteps.jsx`) ⭐

顯示 AI 的思考和執行過程：

```jsx
function ProcessSteps({ steps, isProcessing }) {
  return (
    <div className="process-steps">
      <div className="header">
        <Brain /> 思考與執行過程
      </div>
      
      {steps.map((step, index) => (
        <StepItem 
          key={step.id}
          step={step}
          isLast={index === steps.length - 1}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  )
}

function StepItem({ step, isLast, isProcessing }) {
  const [expanded, setExpanded] = useState(true)
  
  // 根據步驟類型顯示不同圖標
  const getIcon = () => {
    switch (step.type) {
      case 'analysis': return <Brain />
      case 'planning': return <ListTree />
      case 'tool_call': return <Search />
      case 'code_execution': return <Terminal />
      case 'generating': return <Sparkles />
    }
  }
  
  return (
    <div className="step-item">
      {/* 狀態指示器 */}
      {step.status === 'completed' && <CheckCircle />}
      {step.status === 'running' && <Loader className="animate-spin" />}
      
      {/* 標題 */}
      <span>{step.title}</span>
      
      {/* 展開內容 */}
      {expanded && (
        <div className="step-details">
          {/* 搜尋查詢 */}
          {step.queries?.map(q => <QueryBadge query={q} />)}
          
          {/* 子任務 */}
          {step.subSteps?.map(s => <SubStepItem subStep={s} />)}
          
          {/* 工具呼叫 */}
          {step.toolCalls?.map(tc => <ToolCallItem toolCall={tc} />)}
          
          {/* 代碼執行結果 */}
          {step.executionResult && (
            <CodeExecutionResult 
              result={step.executionResult}
              code={step.code}
            />
          )}
        </div>
      )}
    </div>
  )
}
```

### 9.4 代碼執行結果 (`CodeExecutionResult.jsx`) ⭐

顯示 Sandbox 執行結果和圖表：

```jsx
function CodeExecutionResult({ result, code }) {
  const { success, stdout, stderr, error, figures, execution_time } = result
  
  return (
    <div className={success ? "bg-green-50" : "bg-red-50"}>
      {/* 標題 */}
      <div className="header">
        {success ? <CheckCircle /> : <XCircle />}
        程式碼執行 {success ? '成功' : '失敗'}
        <span>{execution_time}s</span>
        {figures.length > 0 && <span>{figures.length} 個圖表</span>}
      </div>
      
      {/* 程式碼（可摺疊）*/}
      {code && (
        <CollapsibleCode code={code} />
      )}
      
      {/* 輸出 */}
      {stdout && (
        <pre className="stdout">{stdout}</pre>
      )}
      
      {/* 錯誤 */}
      {error && (
        <pre className="error">{error}</pre>
      )}
      
      {/* 圖表 ⭐ */}
      {figures.length > 0 && (
        <div className="figures">
          {figures.map((fig, i) => (
            <img 
              key={i}
              src={`data:image/png;base64,${fig}`}
              alt={`圖表 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 10. API 端點

### 10.1 完整端點列表

| 端點 | 方法 | 說明 | 認證 |
|------|------|------|------|
| `/health` | GET | 健康檢查 | ❌ |
| `/stats` | GET | 系統統計 | ❌ |
| `/chat/stream` | POST | SSE 串流對話 | ❌ |
| `/chat` | POST | 同步對話 | ❌ |
| `/search` | POST | 語意搜尋 | ❌ |
| `/search/filtered` | POST | 指定文件搜尋 | ❌ |
| `/upload` | POST | 上傳文件 | ❌ |
| `/documents` | GET | 列出文件 | ❌ |
| `/documents/{name}` | DELETE | 刪除文件 | ❌ |
| `/documents/{name}/pdf` | GET | PDF 預覽 | ❌ |
| `/agents/process` | POST | Multi-Agent 處理 | ✅ |
| `/agents` | GET | 列出 Agent | ✅ |
| `/agents/types` | GET | Agent 類型 | ❌ |
| `/agents/tools` | GET | 可用工具 | ✅ |
| `/auth/login` | POST | 登入 | ❌ |
| `/auth/register` | POST | 註冊 | ❌ |
| `/auth/me` | GET | 當前用戶 | ✅ |
| `/research/start` | POST | 開始研究 | ✅ |
| `/research/{id}/status` | GET | 研究狀態 | ✅ |
| `/audit/logs` | GET | 審計日誌 | ✅ (Admin) |
| `/cost/usage` | GET | 使用量 | ✅ |

### 10.2 關鍵端點詳解

#### POST /agents/process

Multi-Agent 處理的主入口：

**請求**:
```json
{
  "request": "請比較 Transformer 和 RNN 的優缺點",
  "context": {
    "selected_docs": ["paper.pdf"]
  },
  "stream": true
}
```

**SSE 響應事件**:
```
data: {"type": "thinking", "content": "正在理解您的問題..."}

data: {"type": "analysis_complete", "content": "用戶想要比較兩種模型"}

data: {"type": "plan", "subtasks": [...]}

data: {"type": "agent_start", "agent": "researcher", "task": "搜尋 Transformer"}

data: {"type": "tool_call", "tool": "rag_search", "result": {...}}

data: {"type": "step_result", "success": true, "execution_time": 2.5}

data: {"type": "summarizing"}

data: {"type": "final", "content": "根據搜尋結果..."}
```

#### POST /upload

上傳並處理文檔：

**請求**: `multipart/form-data`
- `file`: PDF 文件

**響應**:
```json
{
  "status": "completed",
  "file_name": "paper.pdf",
  "chunks": 45,
  "message": "已成功索引 45 個文本塊"
}
```

---

## 11. 資料流程

### 11.1 文檔上傳流程

```
1. 用戶上傳 PDF
       │
       ▼
2. POST /upload
       │
       ▼
3. 保存到 data/raw/
       │
       ▼
4. MultimodalParser 解析
   ├── 提取文字
   ├── 提取圖片 → OCR
   └── 分塊 (500 字符, 50 重疊)
       │
       ▼
5. DocumentIndexer 建立索引
   ├── Cohere Embedding (1024 維)
   └── 存入 Qdrant
       │
       ▼
6. 返回結果
```

### 11.2 問答流程

```
1. 用戶發送問題
       │
       ▼
2. POST /agents/process (stream=true)
       │
       ▼
3. Coordinator 接收請求
       │
       ▼
4. Dispatcher 分析
   ├── 簡單問題 → 1 個任務
   └── 複雜問題 → 多個任務
       │
       ▼
5. 執行任務
   ├── ResearcherAgent
   │   └── RAG 搜尋 → 返回相關文檔
   │
   ├── CoderAgent
   │   ├── LLM 生成代碼
   │   └── Sandbox 執行 → 返回圖表
   │
   └── WriterAgent
       └── 生成文字內容
       │
       ▼
6. 聚合結果
       │
       ▼
7. SSE 串流返回
       │
       ▼
8. 前端即時更新 UI
```

### 11.3 SSE 事件流

```
前端                              後端
  │                                 │
  │ ──POST /agents/process────────> │
  │                                 │
  │ <────data: {type: thinking}──── │  ← 開始思考
  │                                 │
  │ <────data: {type: plan}──────── │  ← 任務規劃
  │                                 │
  │ <────data: {type: agent_start}─ │  ← Agent 開始
  │                                 │
  │ <────data: {type: tool_call}─── │  ← 工具呼叫
  │                                 │
  │ <────data: {type: step_result}─ │  ← 步驟完成
  │                                 │
  │ <────data: {type: final}─────── │  ← 最終回答
  │                                 │
```

---

## 12. 配置說明

### 12.1 環境變數 (`.env`)

```bash
# ========================
# 必要配置
# ========================

# Embedding 模型
COHERE_API_KEY=your_cohere_key

# LLM
OPENAI_API_KEY=sk-proj-your_key

# ========================
# 可選配置
# ========================

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Cohere
COHERE_EMBED_MODEL=embed-multilingual-v3.0

# 日誌
LOG_LEVEL=INFO

# JWT
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# 資料目錄
DATA_DIR=./data
RAW_DIR=./data/raw
```

### 12.2 Vite 配置 (`frontend/vite.config.js`)

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### 12.3 Tailwind 配置 (`frontend/tailwind.config.js`)

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // 自定義顏色、字體等
    }
  },
  plugins: []
}
```

---

## 13. 部署指南

### 13.1 開發環境

```powershell
# 1. 克隆專案
git clone https://github.com/your/opencode-platform.git
cd opencode-platform

# 2. 建立 Python 虛擬環境
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. 安裝依賴
pip install -r requirements.txt

# 4. 配置環境變數
cp .env.example .env
# 編輯 .env 填入 API Key

# 5. 啟動 Qdrant
docker run -d -p 6333:6333 qdrant/qdrant

# 6. 啟動後端
python run.py api

# 7. 啟動前端
cd frontend
npm install
npm run dev
```

### 13.2 生產環境 (Docker)

```bash
# 使用 docker-compose
docker-compose up -d

# 或單獨構建
docker build -t opencode-backend -f docker/backend/Dockerfile .
docker build -t opencode-frontend -f docker/frontend/Dockerfile ./frontend
```

### 13.3 常見問題

| 問題 | 解決方案 |
|------|----------|
| Qdrant 連接失敗 | 確認 Docker 容器運行中 |
| Embedding 失敗 | 檢查 COHERE_API_KEY |
| Token 超限 | 升級 OpenAI 帳戶或減少輸入 |
| 圖表彈窗 | 確保使用 v4.9.0+（Agg 後端）|
| Docker 在 Windows 失敗 | 自動 fallback 到本地執行 |

---

## 附錄

### A. 檔案大小統計

| 目錄 | 大小 |
|------|------|
| src/opencode/ | ~780 KB |
| frontend/src/ | ~255 KB |
| 總計 | ~1.3 MB |

### B. 關鍵檔案行數

| 檔案 | 行數 | 說明 |
|------|------|------|
| api/main.py | ~800 | API 主入口 |
| ChatInterface.jsx | ~1300 | 聊天界面 |
| coordinator.py | ~400 | Agent 協調器 |
| specialists.py | ~500 | 專業 Agent |
| sandbox/service.py | ~550 | Sandbox 服務 |

### C. 版本歷史

| 版本 | 日期 | 主要更新 |
|------|------|----------|
| v4.9.0 | 2025-01-30 | Sandbox 圖表內嵌、Token 優化 |
| v4.8.x | 2025-01-30 | Multi-Agent、思考過程 |
| v4.0.0 | 2025-01-26 | Multi-Agent 系統 |
| v3.0.0 | 2025-01-25 | RAG + Deep Research |

---

**文件結束**

> 如有問題，請參考 `README.md` 或提交 Issue。
