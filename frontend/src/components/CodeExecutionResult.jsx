import React, { useState } from 'react'
import { 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Check,
  Image,
  Code2,
  Clock
} from 'lucide-react'
import clsx from 'clsx'

/**
 * 程式碼執行結果組件
 * 
 * 顯示 sandbox 執行的結果，包含：
 * - 執行狀態
 * - stdout/stderr
 * - 圖表 (base64)
 * - 返回值
 */
function CodeExecutionResult({ result, code }) {
  const [expanded, setExpanded] = useState(true)
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!result) return null

  const {
    success,
    stdout,
    stderr,
    error,
    error_type,
    figures = [],
    return_value,
    execution_time
  } = result

  const copyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={clsx(
      "rounded-lg border overflow-hidden",
      success 
        ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
        : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
    )}>
      {/* 標題列 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          {success ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <Terminal className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
            程式碼執行 {success ? '成功' : '失敗'}
          </span>
          {execution_time && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {execution_time}s
            </span>
          )}
          {figures.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              {figures.length} 個圖表
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* 展開內容 */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {/* 程式碼（可選顯示）*/}
          {code && (
            <div className="p-3">
              <button
                onClick={() => setShowCode(!showCode)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showCode ? '隱藏' : '顯示'}程式碼</span>
              </button>
              
              {showCode && (
                <div className="mt-2 relative">
                  <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                    <code>{code}</code>
                  </pre>
                  <button
                    onClick={copyCode}
                    className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 標準輸出 */}
          {stdout && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>輸出</span>
              </div>
              <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                {stdout}
              </pre>
            </div>
          )}

          {/* 錯誤輸出 */}
          {(stderr || error) && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-red-500 mb-2">
                <XCircle className="w-3.5 h-3.5" />
                <span>{error_type || '錯誤'}</span>
              </div>
              <pre className="p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-800 dark:text-red-200 overflow-x-auto whitespace-pre-wrap">
                {error || stderr}
              </pre>
            </div>
          )}

          {/* 圖表 */}
          {figures.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-3">
                <Image className="w-3.5 h-3.5" />
                <span>圖表輸出</span>
              </div>
              <div className="grid gap-3">
                {figures.map((fig, idx) => (
                  <div 
                    key={idx}
                    className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <img 
                      src={`data:image/png;base64,${fig}`}
                      alt={`圖表 ${idx + 1}`}
                      className="max-w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 返回值 */}
          {return_value !== null && return_value !== undefined && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                <span>返回值</span>
              </div>
              <pre className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200 overflow-x-auto">
                {typeof return_value === 'object' 
                  ? JSON.stringify(return_value, null, 2)
                  : String(return_value)
                }
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CodeExecutionResult
