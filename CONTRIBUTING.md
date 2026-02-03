# 貢獻指南

感謝您有興趣為 OpenCode Platform 做出貢獻！本文檔將指導您如何參與專案開發。

## 📋 目錄

- [行為準則](#行為準則)
- [如何貢獻](#如何貢獻)
- [開發環境設置](#開發環境設置)
- [提交規範](#提交規範)
- [程式碼風格](#程式碼風格)
- [測試要求](#測試要求)
- [Pull Request 流程](#pull-request-流程)

---

## 行為準則

請遵守我們的行為準則，保持專業、友善的交流環境。

- 尊重所有貢獻者
- 接受建設性的批評
- 專注於對社群最有利的事情

---

## 如何貢獻

### 報告 Bug

1. 使用 [Issue 模板](https://github.com/bai0821/opencode_platform/issues/new)
2. 清楚描述問題
3. 提供復現步驟
4. 附上錯誤日誌

### 提出新功能

1. 先開 Issue 討論
2. 說明使用場景
3. 描述預期行為

### 提交程式碼

1. Fork 專案
2. 創建功能分支
3. 撰寫測試
4. 提交 PR

---

## 開發環境設置

### 後端

```bash
# 克隆專案
git clone https://github.com/bai0821/opencode_platform.git
cd opencode_platform

# 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 安裝依賴
pip install -r requirements.txt
pip install -r requirements-dev.txt  # 開發依賴

# 安裝 pre-commit hooks
pre-commit install
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

### 啟動服務

```bash
# 啟動 Qdrant
docker run -d -p 6333:6333 qdrant/qdrant

# 啟動後端
python run.py api

# 啟動前端（另一個終端）
cd frontend && npm run dev
```

---

## 提交規範

我們使用 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

| Type | 說明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修復 |
| `docs` | 文檔更新 |
| `style` | 程式碼格式（不影響功能） |
| `refactor` | 重構 |
| `test` | 測試相關 |
| `chore` | 構建/工具變更 |

### 範例

```
feat(agents): add Analyst agent for data analysis

- Implement data visualization capabilities
- Add support for pandas and matplotlib
- Include unit tests

Closes #123
```

---

## 程式碼風格

### Python

- 使用 [Black](https://black.readthedocs.io/) 格式化
- 使用 [isort](https://pycqa.github.io/isort/) 排序 import
- 遵循 [PEP 8](https://pep8.org/)
- 類型提示（Type Hints）

```python
# ✅ 好的範例
async def process_task(
    self,
    task: AgentTask,
    context: Optional[Dict[str, Any]] = None
) -> AgentResult:
    """
    處理任務
    
    Args:
        task: 要處理的任務
        context: 上下文資訊
        
    Returns:
        AgentResult: 處理結果
    """
    ...
```

### JavaScript/React

- 使用 [ESLint](https://eslint.org/)
- 使用 [Prettier](https://prettier.io/)
- 函數組件 + Hooks

```jsx
// ✅ 好的範例
function ChatMessage({ message, isUser }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={clsx('message', { 'user': isUser })}>
      {message.content}
    </div>
  );
}
```

---

## 測試要求

### 後端測試

```bash
# 運行所有測試
pytest

# 運行特定測試
pytest tests/test_agents.py

# 測試覆蓋率
pytest --cov=src/opencode --cov-report=html
```

### 測試規範

- 新功能必須有對應測試
- Bug 修復要有回歸測試
- 覆蓋率不低於 80%

```python
# tests/test_agents/test_dispatcher.py
import pytest
from opencode.agents import DispatcherAgent

class TestDispatcherAgent:
    @pytest.fixture
    def dispatcher(self):
        return DispatcherAgent()
    
    async def test_intent_recognition(self, dispatcher):
        """測試意圖識別"""
        result = await dispatcher.recognize_intent("分析這份報告")
        assert result.agent == "analyst"
```

---

## Pull Request 流程

### 1. 準備工作

- [ ] Fork 並克隆專案
- [ ] 創建功能分支：`git checkout -b feature/my-feature`
- [ ] 確保通過所有測試
- [ ] 更新文檔（如需要）

### 2. 提交 PR

- [ ] 填寫 PR 模板
- [ ] 關聯相關 Issue
- [ ] 等待 CI 通過
- [ ] 請求 Code Review

### 3. Review 後

- [ ] 回應評論
- [ ] 按需修改
- [ ] 等待合併

### PR 模板

```markdown
## 描述

簡要描述這個 PR 做了什麼

## 變更類型

- [ ] Bug 修復
- [ ] 新功能
- [ ] 重構
- [ ] 文檔更新

## 測試

- [ ] 已添加/更新測試
- [ ] 所有測試通過

## 相關 Issue

Closes #xxx
```

---

## 需要幫助？

- 📖 查看 [文檔](docs/)
- 💬 開 [Discussion](https://github.com/bai0821/opencode_platform/discussions)
- 🐛 提交 [Issue](https://github.com/bai0821/opencode_platform/issues)

感謝您的貢獻！ 🙏
