# Sandbox Service 安裝和測試指南

## 📋 前置需求

1. **Docker Desktop** - 必須安裝並運行
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Mac: https://docs.docker.com/desktop/install/mac-install/

2. **Python docker 套件**
   ```bash
   pip install docker
   ```

---

## 🐳 構建 Sandbox Docker Image

### Windows (PowerShell)

```powershell
cd C:\Users\epicp\Desktop\opencode-platform\docker\sandbox
.\build.ps1
```

### Linux/Mac (Bash)

```bash
cd ~/opencode-platform/docker/sandbox
chmod +x build.sh
./build.sh
```

### 手動構建

```bash
cd docker/sandbox
docker build -t opencode-sandbox:latest .
```

---

## ✅ 驗證 Image

```bash
# 測試基本執行
echo '{"code": "print(1+1)"}' | docker run -i --rm opencode-sandbox:latest

# 預期輸出:
# {"success": true, "stdout": "2\n", "stderr": "", ...}
```

```bash
# 測試 numpy
echo '{"code": "import numpy as np\nprint(np.array([1,2,3]).sum())"}' | docker run -i --rm opencode-sandbox:latest

# 預期輸出:
# {"success": true, "stdout": "6\n", ...}
```

---

## 🚀 測試 API 端點

### 1. 啟動後端

```bash
cd C:\Users\epicp\Desktop\opencode-platform
python -m cli.main api
```

### 2. 測試 Sandbox 狀態

```bash
curl http://localhost:8000/sandbox/status
```

預期回應：
```json
{
  "status": "ready",
  "docker_enabled": true,
  "image_ready": true,
  "image_name": "opencode-sandbox:latest"
}
```

### 3. 測試程式碼執行

```bash
curl -X POST http://localhost:8000/sandbox/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(1+1)", "language": "python"}'
```

預期回應：
```json
{
  "success": true,
  "stdout": "2\n",
  "stderr": "",
  "figures": [],
  "execution_time": 0.5
}
```

### 4. 測試圖表生成

```bash
curl -X POST http://localhost:8000/sandbox/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import matplotlib.pyplot as plt\nplt.plot([1,2,3],[1,4,9])\nplt.title(\"Test\")\nprint(\"done\")",
    "language": "python"
  }'
```

預期回應包含 `figures` 陣列（base64 PNG）

---

## 💬 測試對話整合

啟動前端後，在對話中輸入：

```
幫我用 Python 計算 1+1
```

或

```
用 matplotlib 畫一個 sin 函數的圖
```

AI 應該會自動識別並使用 sandbox_execute_python 工具

---

## ⚠️ 故障排除

### Docker 未運行

```
❌ Error: Docker not available
```

**解決**: 啟動 Docker Desktop

### Image 未構建

```
⚠️ Sandbox image 'opencode-sandbox:latest' not found
```

**解決**: 執行 build.ps1 或 build.sh

### 執行超時

```
{"error": "Execution timed out after 30s"}
```

**解決**: 增加 timeout 參數或優化程式碼

---

## 📊 支援的套件

| 套件 | 版本 | 用途 |
|------|------|------|
| numpy | 1.26.4 | 數值計算 |
| pandas | 2.2.0 | 數據分析 |
| matplotlib | 3.8.2 | 繪圖 |
| seaborn | 0.13.2 | 統計繪圖 |
| scipy | 1.12.0 | 科學計算 |
| scikit-learn | 1.4.0 | 機器學習 |
| sympy | 1.12 | 符號計算 |
| requests | 2.31.0 | HTTP 請求（僅限容器內） |

---

## 🔒 安全特性

- 網路隔離 (network_mode="none")
- 記憶體限制 (512MB)
- CPU 限制 (50%)
- 執行時間限制 (30 秒)
- 非 root 用戶執行
- 唯讀文件系統

---

**最後更新**: 2025-01-26
