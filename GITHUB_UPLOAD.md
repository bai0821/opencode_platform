# 🚀 GitHub 上傳指南

本文檔說明如何將 OpenCode Platform 推送到 GitHub。

---

## 📋 上傳前檢查清單

### ✅ 必要文件

| 文件 | 用途 | 狀態 |
|------|------|------|
| `README.md` | 專案說明 | ✅ |
| `LICENSE` | MIT 授權 | ✅ |
| `CHANGELOG.md` | 版本記錄 | ✅ |
| `CONTRIBUTING.md` | 貢獻指南 | ✅ |
| `QUICKSTART.md` | 快速啟動 | ✅ |
| `.gitignore` | 忽略文件 | ✅ |
| `.env.example` | 環境變數範例 | ✅ |
| `requirements.txt` | Python 依賴 | ✅ |
| `docker-compose.yml` | Docker 配置 | ✅ |

### ⚠️ 確認不上傳的文件

以下文件/目錄已在 `.gitignore` 中，不會上傳：

```
❌ .env                 # 敏感資訊！
❌ __pycache__/         # Python 快取
❌ node_modules/        # Node 依賴
❌ venv/ .venv/         # 虛擬環境
❌ *.log                # 日誌文件
❌ data/                # 數據文件
❌ qdrant_storage/      # 向量資料庫
❌ nginx/ssl/*.pem      # SSL 證書
❌ .idea/ .vscode/      # IDE 配置
```

---

## 📤 上傳步驟

### 1. 初始化 Git（如果尚未）

```bash
cd opencode_platform
git init
```

### 2. 添加遠端倉庫

```bash
git remote add origin https://github.com/bai0821/opencode_platform.git
```

### 3. 添加所有文件

```bash
git add .
```

### 4. 確認要提交的文件

```bash
git status
```

確認沒有敏感文件（如 `.env`）被包含！

### 5. 提交

```bash
git commit -m "feat: OpenCode Platform v5.6.1 - 企業級 AI 智能平台

Features:
- Multi-Agent 系統（5 個專業 Agent）
- RAG 知識庫（PDF 上傳、語意搜尋）
- 深度研究（多引擎搜尋、報告生成）
- 多模態對話（圖片、文件分析）
- 沙箱代碼執行（Python/Bash）
- 插件系統（熱插拔）
- 工作流編排（視覺化設計）
"
```

### 6. 推送到 GitHub

```bash
# 首次推送
git branch -M main
git push -u origin main

# 後續推送
git push
```

---

## 🔒 安全提醒

### ⚠️ 絕對不要上傳的內容

1. **API Keys**
   - `.env` 文件
   - 任何包含 `sk-` 開頭的字串
   
2. **私鑰/證書**
   - `*.pem`, `*.key`, `*.crt`
   - SSH 私鑰

3. **數據庫**
   - `*.db`, `*.sqlite`
   - Qdrant 存儲目錄

4. **用戶數據**
   - 上傳的文件
   - 日誌文件

### 🔍 上傳前最後檢查

```bash
# 確認 .env 不在 staged 文件中
git status | grep ".env"

# 搜索可能的敏感資訊
grep -r "sk-proj" . --include="*.py" --include="*.js"
grep -r "password" . --include="*.py" --include="*.js"
```

---

## 📁 目錄結構

上傳後的 GitHub 目錄結構：

```
opencode_platform/
├── 📄 README.md           # 專案說明
├── 📄 LICENSE             # MIT 授權
├── 📄 CHANGELOG.md        # 版本記錄
├── 📄 CONTRIBUTING.md     # 貢獻指南
├── 📄 QUICKSTART.md       # 快速啟動
├── 📄 DEPLOYMENT.md       # 部署指南
├── 📄 .gitignore          # Git 忽略
├── 📄 .env.example        # 環境變數範例
├── 📄 requirements.txt    # Python 依賴
├── 📄 docker-compose.yml  # Docker 配置
├── 📄 pyproject.toml      # Python 專案配置
├── 📄 run.py              # 啟動腳本
│
├── 📁 src/opencode/       # 後端源碼
│   ├── api/              # API 路由
│   ├── agents/           # Agent 系統
│   ├── services/         # 服務層
│   ├── plugins/          # 插件系統
│   └── ...
│
├── 📁 frontend/           # 前端源碼
│   ├── src/
│   ├── package.json
│   └── ...
│
├── 📁 plugins/            # 插件目錄
│   ├── stock-analyst/
│   ├── weather-tool/
│   └── PLUGIN_DEV_GUIDE.md
│
├── 📁 docker/             # Docker 配置
├── 📁 nginx/              # Nginx 配置
├── 📁 tests/              # 測試文件
├── 📁 docs/               # 文檔
└── 📁 scripts/            # 腳本工具
```

---

## ✅ 上傳完成後

1. **設置 GitHub Secrets**（用於 CI/CD）
   - `OPENAI_API_KEY`
   - `COHERE_API_KEY`

2. **添加 Topics**
   - `ai`, `llm`, `rag`, `multi-agent`, `python`, `react`, `fastapi`

3. **撰寫 Release Notes**
   - 從 `CHANGELOG.md` 複製

4. **設置 Branch Protection**
   - 保護 `main` 分支
   - 要求 PR review

---

**🎉 恭喜！你的專案已經準備好上傳到 GitHub 了！**
