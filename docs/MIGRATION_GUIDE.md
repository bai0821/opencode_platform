# 目錄結構重構說明

## 📋 變更摘要

v1.1 版本對專案進行了重大重構，將所有後端 Python 程式碼移至 `src/opencode/` 目錄下。

## 🔄 主要變更

### 舊結構 → 新結構

```
舊:                              新:
opencode-platform/              opencode-platform/
├── api/                   →    ├── src/
├── cli/                   →    │   └── opencode/
├── config/                →    │       ├── api/
├── control_plane/         →    │       ├── cli/
├── core/                  →    │       ├── config/
├── gateway/               →    │       ├── control_plane/
├── orchestrator/          →    │       ├── core/
├── services/              →    │       ├── gateway/
│   └── sandbox/           →    │       ├── orchestrator/
│       └── docker/        →    │       └── services/
├── docker/                     ├── docker/
│                               │   └── sandbox/  ← 從 services 移出
├── frontend/              →    ├── frontend/
├── docs/                  →    ├── docs/
├── scripts/               →    ├── scripts/
└── tests/                 →    └── tests/
```

## 📦 Import 變更

所有 import 路徑需要加上 `opencode.` 前綴：

```python
# 舊
from core.engine import OpenCodeEngine
from config.settings import settings
from services.knowledge_base.service import KnowledgeBaseService

# 新
from opencode.core.engine import OpenCodeEngine
from opencode.config.settings import settings
from opencode.services.knowledge_base.service import KnowledgeBaseService
```

## 🚀 啟動方式變更

### 方式 1: 使用 run.py（推薦）

```bash
# 啟動 API
python run.py api

# 啟動 CLI
python run.py cli

# 啟動 TUI
python run.py tui
```

### 方式 2: 使用 uvicorn

```bash
# 設置 PYTHONPATH
# Windows
set PYTHONPATH=src

# Linux/Mac
export PYTHONPATH=src

# 啟動
uvicorn opencode.api.main:app --reload --port 8000
```

### 方式 3: 安裝後使用

```bash
# 安裝套件
pip install -e .

# 使用 opencode 命令
opencode api
opencode chat -i
```

## 🐳 Docker Sandbox 位置變更

Sandbox 的 Docker 文件已移至專案根目錄：

```
舊: services/sandbox/docker/
新: docker/sandbox/
```

構建指令更新為：

```bash
cd docker/sandbox
.\build.ps1      # Windows
./build.sh       # Linux/Mac
```

## 📁 新增檔案

- `src/opencode/core/utils.py` - 統一的路徑工具
  - `get_project_root()` - 取得專案根目錄
  - `load_env()` - 載入環境變數
  - `PROJECT_ROOT`, `DATA_DIR`, `RAW_DIR` - 常用路徑常數

## ⚠️ 注意事項

1. **環境變數載入**：所有模組現在使用 `utils.py` 統一載入 `.env`
2. **pyproject.toml** 已更新為 src layout
3. **tests/** 目錄保持在根目錄，但 import 需要更新

## 🔧 如果遇到 Import 錯誤

確保 `PYTHONPATH` 包含 `src` 目錄：

```python
# 在腳本開頭加入
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))
```

或使用 `run.py` 啟動，它會自動設置路徑。
