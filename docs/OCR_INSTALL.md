# OCR 安裝指南

要讓系統能夠識別 PDF 中的圖片文字，需要安裝 Tesseract OCR。

## Windows 安裝

### 方法 1：使用安裝程式（推薦）

1. 下載 Tesseract 安裝程式：
   - https://github.com/UB-Mannheim/tesseract/wiki
   - 選擇最新版本，如 `tesseract-ocr-w64-setup-5.3.3.20231005.exe`

2. 安裝時：
   - 選擇「Add to PATH」
   - 選擇語言包：勾選 `Chinese (Traditional)` 和 `Chinese (Simplified)`

3. 重新開啟終端機

4. 測試安裝：
   ```powershell
   tesseract --version
   ```

### 方法 2：使用 Chocolatey

```powershell
# 以管理員身份執行
choco install tesseract
```

## Python 套件安裝

```bash
pip install pytesseract pillow
```

## 驗證

```python
import pytesseract
print(pytesseract.get_tesseract_version())
```

## 常見問題

### Q: 安裝後仍然找不到 tesseract？
A: 手動設定路徑：
```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Q: 中文識別效果不好？
A: 確保安裝了中文語言包：
- 下載 `chi_tra.traineddata`（繁體）
- 放到 `C:\Program Files\Tesseract-OCR\tessdata\`

## 替代方案：EasyOCR

如果 Tesseract 安裝困難，可以使用 EasyOCR（純 Python，無需系統安裝）：

```bash
pip install easyocr
```

注意：EasyOCR 首次使用會下載模型（約 200MB）
