import React, { useState, useRef, useEffect } from 'react'
import { 
  Play, 
  Loader2, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check,
  Trash2,
  Clock,
  Image,
  Code2,
  ChevronDown,
  FileCode,
  Sparkles,
  Download,
  Upload,
  Settings,
  RefreshCw
} from 'lucide-react'
import clsx from 'clsx'

// 預設程式碼範例
const CODE_TEMPLATES = {
  python: [
    {
      name: '基本計算',
      code: `# 基本數學計算
import math

# 計算圓的面積
radius = 5
area = math.pi * radius ** 2
print(f"半徑 {radius} 的圓面積: {area:.2f}")

# 複利計算
principal = 10000  # 本金
rate = 0.05        # 年利率 5%
years = 10         # 10 年
amount = principal * (1 + rate) ** years
print(f"複利 {years} 年後: {amount:.2f}")
`
    },
    {
      name: '數據分析',
      code: `import pandas as pd
import numpy as np

# 創建示例數據
data = {
    '產品': ['A', 'B', 'C', 'D', 'E'],
    '銷售量': [150, 200, 180, 220, 190],
    '單價': [50, 45, 60, 40, 55]
}

df = pd.DataFrame(data)
df['營收'] = df['銷售量'] * df['單價']

print("=== 銷售數據 ===")
print(df)
print()
print("=== 統計摘要 ===")
print(f"總營收: {df['營收'].sum()}")
print(f"平均營收: {df['營收'].mean():.2f}")
print(f"最高營收產品: {df.loc[df['營收'].idxmax(), '產品']}")
`
    },
    {
      name: '繪製圖表',
      code: `import matplotlib.pyplot as plt
import numpy as np

# 數據
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
sales = [120, 150, 180, 200, 175, 220]
expenses = [80, 90, 100, 110, 95, 120]

# 創建圖表
fig, ax = plt.subplots(figsize=(10, 6))

x = np.arange(len(months))
width = 0.35

bars1 = ax.bar(x - width/2, sales, width, label='Sales', color='#6366f1')
bars2 = ax.bar(x + width/2, expenses, width, label='Expenses', color='#f43f5e')

ax.set_xlabel('Month')
ax.set_ylabel('Amount ($)')
ax.set_title('Monthly Sales vs Expenses')
ax.set_xticks(x)
ax.set_xticklabels(months)
ax.legend()
ax.grid(axis='y', alpha=0.3)

# 添加數值標籤
for bar in bars1:
    height = bar.get_height()
    ax.annotate(f'{height}',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3),
                textcoords="offset points",
                ha='center', va='bottom', fontsize=8)

plt.tight_layout()
print("Chart generated!")
`
    },
    {
      name: '讀取 Excel',
      needsFile: true,
      fileTypes: ['.xlsx', '.xls'],
      code: `import pandas as pd

# 讀取 Excel 文件
# 文件名: {{FILENAME}}
df = pd.read_excel('{{FILENAME}}')

print("=== 數據預覽 ===")
print(df.head(10))

print("\\n=== 數據資訊 ===")
print(f"行數: {len(df)}")
print(f"列數: {len(df.columns)}")
print(f"欄位: {list(df.columns)}")

print("\\n=== 統計摘要 ===")
print(df.describe())
`
    },
    {
      name: '讀取 CSV',
      needsFile: true,
      fileTypes: ['.csv'],
      code: `import pandas as pd

# 讀取 CSV 文件
# 文件名: {{FILENAME}}
df = pd.read_csv('{{FILENAME}}')

print("=== 數據預覽 ===")
print(df.head(10))

print("\\n=== 數據資訊 ===")
print(f"行數: {len(df)}")
print(f"列數: {len(df.columns)}")
print(f"欄位: {list(df.columns)}")

print("\\n=== 統計摘要 ===")
print(df.describe())
`
    }
  ],
  javascript: [
    {
      name: 'Hello World',
      code: `// JavaScript 示例
console.log("Hello, World!");

// 計算
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum: \${sum}\`);

// 物件操作
const data = {
  name: "OpenCode",
  version: "5.5",
  features: ["Agent", "Plugin", "Sandbox"]
};

console.log(JSON.stringify(data, null, 2));
`
    }
  ],
  shell: [
    {
      name: '系統資訊',
      code: `#!/bin/sh
echo "=== System Info ==="
echo "Hostname: $(hostname)"
echo "OS: $(uname -s)"
echo "Kernel: $(uname -r)"
echo "Date: $(date)"

echo ""
echo "=== Disk Usage ==="
df -h | head -5

echo ""
echo "=== Memory ==="
free -h 2>/dev/null || echo "free command not available"
`
    }
  ]
}

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'javascript', label: 'JavaScript', icon: '📜' },
  { value: 'shell', label: 'Shell', icon: '🖥️' }
]

function CodePlayground({ apiBase, token }) {
  const [code, setCode] = useState(CODE_TEMPLATES.python[0].code)
  const [language, setLanguage] = useState('python')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [timeout, setTimeout] = useState(60)
  const [networkEnabled, setNetworkEnabled] = useState(true)
  const [history, setHistory] = useState([])
  const [sandboxStatus, setSandboxStatus] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // 載入沙箱狀態
  useEffect(() => {
    fetchSandboxStatus()
  }, [])

  const fetchSandboxStatus = async () => {
    try {
      const res = await fetch(`${apiBase}/sandbox/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSandboxStatus(data)
      }
    } catch (err) {
      console.error('Failed to fetch sandbox status:', err)
    }
  }

  // 執行代碼
  const executeCode = async () => {
    if (!code.trim()) return
    
    setRunning(true)
    setResult(null)
    
    const startTime = Date.now()
    
    try {
      // 準備文件（base64）
      const files = {}
      for (const file of uploadedFiles) {
        files[file.name] = file.base64
      }
      
      const res = await fetch(`${apiBase}/sandbox/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          language,
          timeout,
          network_enabled: networkEnabled,
          files: Object.keys(files).length > 0 ? files : null
        })
      })
      
      const data = await res.json()
      
      const executionResult = {
        ...data,
        timestamp: new Date().toISOString(),
        language,
        codeSnippet: code.substring(0, 100)
      }
      
      setResult(executionResult)
      
      // 添加到歷史
      setHistory(prev => [executionResult, ...prev.slice(0, 9)])
      
    } catch (err) {
      setResult({
        success: false,
        error: err.message,
        stdout: '',
        stderr: '',
        execution_time: (Date.now() - startTime) / 1000
      })
    } finally {
      setRunning(false)
    }
  }

  // 複製代碼
  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 上傳文件
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          size: file.size,
          base64
        }])
      }
      reader.readAsDataURL(file)
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 移除上傳的文件
  const removeFile = (fileName) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName))
  }

  // 載入範例
  const loadTemplate = (template) => {
    let templateCode = template.code
    
    // 如果模板需要文件，檢查是否有上傳的文件
    if (template.needsFile) {
      // 找到匹配類型的文件
      const matchingFile = uploadedFiles.find(f => {
        if (!template.fileTypes) return true
        return template.fileTypes.some(ext => f.name.toLowerCase().endsWith(ext))
      })
      
      if (matchingFile) {
        // 替換占位符為實際文件名
        templateCode = templateCode.replace(/\{\{FILENAME\}\}/g, matchingFile.name)
      } else {
        // 提示用戶先上傳文件
        const fileTypesStr = template.fileTypes?.join(', ') || '相關'
        alert(`請先上傳 ${fileTypesStr} 文件，然後再載入此範例`)
        return
      }
    }
    
    setCode(templateCode)
  }

  // 切換語言
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    // 載入該語言的第一個範例
    const templates = CODE_TEMPLATES[newLang]
    if (templates && templates.length > 0) {
      setCode(templates[0].code)
    }
  }

  // 下載結果
  const downloadResult = () => {
    if (!result) return
    
    const content = `=== Execution Result ===
Time: ${result.timestamp}
Language: ${result.language}
Success: ${result.success}
Execution Time: ${result.execution_time}s

=== STDOUT ===
${result.stdout}

=== STDERR ===
${result.stderr}

${result.error ? `=== ERROR ===\n${result.error}` : ''}
`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `execution_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const templates = CODE_TEMPLATES[language] || []

  return (
    <div className="h-full flex flex-col p-6">
      {/* 標題欄 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold">代碼執行環境</h1>
          {sandboxStatus && (
            <span className={clsx(
              'px-2 py-0.5 text-xs rounded-full',
              sandboxStatus.docker_enabled 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            )}>
              {sandboxStatus.docker_enabled ? '🐳 Docker' : '⚠️ Local'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              showSettings ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={fetchSandboxStatus}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="重新整理狀態"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 設定面板 */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium mb-3">執行設定</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">超時（秒）</label>
              <input
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(Math.min(300, Math.max(1, parseInt(e.target.value) || 60)))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                min="1"
                max="300"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">網路存取</label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={networkEnabled}
                  onChange={(e) => setNetworkEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">允許網路請求</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-4 min-h-0">
        {/* 左側：代碼編輯器 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 工具欄 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* 語言選擇 */}
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>

              {/* 範例選擇 */}
              <select
                onChange={(e) => {
                  const idx = parseInt(e.target.value)
                  if (templates[idx]) {
                    loadTemplate(templates[idx])
                  }
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                defaultValue=""
              >
                <option value="" disabled>📝 載入範例...</option>
                {templates.map((t, idx) => (
                  <option key={idx} value={idx}>
                    {t.needsFile ? '📎 ' : ''}{t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* 上傳文件 */}
              <label className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>上傳文件</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* 複製 */}
              <button
                onClick={copyCode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="複製代碼"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* 清除 */}
              <button
                onClick={() => setCode('')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="清除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 上傳的文件列表 */}
          {uploadedFiles.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-2 mb-1">
                {uploadedFiles.map(file => (
                  <div
                    key={file.name}
                    className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-sm group"
                  >
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <code 
                      className="font-mono text-blue-700 dark:text-blue-300 cursor-pointer hover:underline"
                      onClick={() => {
                        navigator.clipboard.writeText(file.name)
                        alert(`已複製文件名: ${file.name}`)
                      }}
                      title="點擊複製文件名"
                    >
                      {file.name}
                    </code>
                    <span className="text-gray-400">({(file.size / 1024).toFixed(1)}KB)</span>
                    <button
                      onClick={() => removeFile(file.name)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                💡 提示：在代碼中使用 <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">'{uploadedFiles[0]?.name}'</code> 來讀取文件
              </p>
            </div>
          )}

          {/* 代碼輸入 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="在此輸入代碼..."
              spellCheck={false}
            />
            
            {/* 執行按鈕 */}
            <button
              onClick={executeCode}
              disabled={running || !code.trim()}
              className={clsx(
                'absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                running 
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              )}
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>執行中...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>執行</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右側：結果顯示 */}
        <div className="w-1/2 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">執行結果</h3>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadResult}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="下載結果"
                >
                  <Download className="w-4 h-4" />
                </button>
                <span className={clsx(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-sm',
                  result.success 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}>
                  {result.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {result.success ? '成功' : '失敗'}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {result.execution_time?.toFixed(2)}s
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            {result ? (
              <>
                {/* 標準輸出 */}
                {result.stdout && (
                  <div className="flex-1 overflow-auto">
                    <div className="sticky top-0 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                      STDOUT
                    </div>
                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {result.stdout}
                    </pre>
                  </div>
                )}

                {/* 標準錯誤 */}
                {result.stderr && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-xs font-medium text-red-600 dark:text-red-400">
                      STDERR
                    </div>
                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap text-red-600 dark:text-red-400 max-h-40 overflow-auto">
                      {result.stderr}
                    </pre>
                  </div>
                )}

                {/* 錯誤訊息 */}
                {result.error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{result.error}</p>
                  </div>
                )}

                {/* 生成的圖片 */}
                {result.images && result.images.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      生成的圖表 ({result.images.length})
                    </div>
                    <div className="p-4 grid gap-4">
                      {result.images.map((img, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg p-2">
                          <img 
                            src={img} 
                            alt={`Output ${idx + 1}`}
                            className="max-w-full h-auto rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 生成的文件 */}
                {result.files && result.files.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <FileCode className="w-4 h-4" />
                      生成的文件 ({result.files.length})
                    </div>
                    <div className="p-2 space-y-2">
                      {result.files.map((file, idx) => (
                        <div key={idx} className="p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">{file.size} bytes</span>
                          </div>
                          <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 max-h-24 overflow-auto">
                            {file.content?.substring(0, 500)}
                            {file.content?.length > 500 && '...'}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 空結果 */}
                {!result.stdout && !result.stderr && !result.error && 
                 (!result.images || result.images.length === 0) && 
                 (!result.files || result.files.length === 0) && (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>執行完成，無輸出</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>執行結果將顯示在這裡</p>
                  <p className="text-sm mt-1">支援 Python、JavaScript、Shell</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodePlayground
