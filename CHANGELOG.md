# Changelog

所有重大變更將記錄在此文件中。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
版本號遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

---

## [5.6.1] - 2025-02-03

### Fixed
- 沙箱執行時文件名處理問題
- 代碼模板自動使用上傳文件的真實名稱

### Changed
- 優化前端文件上傳提示

---

## [5.6.0] - 2025-02-03

### Added
- 🔄 工作流編排器（視覺化設計）
- 🏪 插件市場 UI（Mock 數據）
- 📊 WBS 專案文檔

### Changed
- 整合所有功能到統一版本

---

## [5.5.0] - 2025-02-02

### Added
- 🧩 插件系統
  - 熱插拔支援
  - Agent 插件類型
  - Tool 插件類型
  - ZIP 上傳安裝
  - Git Clone 安裝
- 📦 範例插件
  - 股票分析師 Agent
  - 天氣查詢工具
- 📖 插件開發指南

---

## [5.4.0] - 2025-01-30

### Added
- 📁 資料夾管理系統
  - 創建/重命名/刪除資料夾
  - 拖放排序
  - 文件分類
  - localStorage 持久化

---

## [5.3.0] - 2025-01-28

### Added
- 🖼️ 多模態對話
  - 圖片上傳分析
  - 文件內容識別
  - Vision API 整合
- 📎 文件路徑修復（Coder/Analyst Agent）

---

## [5.2.0] - 2025-01-26

### Added
- 💬 對話歷史功能
  - 自動保存對話
  - 歷史查詢
  - 會話管理

---

## [5.1.0] - 2025-01-24

### Added
- 🔍 深度研究功能（Manus 風格）
  - 多引擎搜尋（DuckDuckGo、Wikipedia、arXiv）
  - LLM 相關性檢查
  - 自動生成研究報告
  - 引用標註

---

## [5.0.0] - 2025-01-20

### Added
- 🤖 Multi-Agent 系統
  - Dispatcher（總機）
  - Researcher（研究員）
  - Writer（寫手）
  - Coder（程式師）
  - Analyst（分析師）
  - Reviewer（審稿員）
- 🎯 Agent Coordinator 協調器
- 🔐 JWT 認證系統

---

## [4.0.0] - 2025-01-15

### Added
- 📚 RAG 知識庫系統
  - PDF 上傳解析
  - Cohere 多語言嵌入
  - Qdrant 向量存儲
  - 語意搜尋
  - 智能問答

---

## [3.0.0] - 2025-01-10

### Added
- 💻 沙箱代碼執行
  - Docker 隔離環境
  - Python/Bash 支援
  - 圖表自動收集
  - 安全過濾

---

## [2.0.0] - 2025-01-05

### Added
- 🖥️ 前端介面
  - React + Tailwind CSS
  - 對話介面
  - SSE 串流顯示
  - 思考過程視覺化

---

## [1.0.0] - 2025-01-01

### Added
- 🚀 專案初始化
- FastAPI 後端框架
- 基礎 API 結構
