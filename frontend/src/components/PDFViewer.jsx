import React, { useState, useEffect, useRef } from 'react'
import { Loader2, FileText, AlertCircle, ExternalLink, Download, Search, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

function PDFViewer({ filename, apiBase, targetPage, highlightText, onPageChange }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [refreshKey, setRefreshKey] = useState(0) // 用於強制刷新
  const iframeRef = useRef(null)
  
  // 構建 PDF URL（帶有頁碼和刷新參數）
  const buildPdfUrl = (page) => {
    let url = `${apiBase}/documents/${encodeURIComponent(filename)}/pdf`
    
    // 添加頁碼參數（使用 Chrome/Edge 的 PDF viewer 語法）
    if (page && page > 0) {
      url += `#page=${page}`
    }
    
    return url
  }
  
  // 基本 URL
  const basePdfUrl = `${apiBase}/documents/${encodeURIComponent(filename)}/pdf`
  // 下載 URL
  const downloadUrl = `${apiBase}/documents/${encodeURIComponent(filename)}/pdf?download=true`

  const handleLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleError = () => {
    setError('無法載入 PDF 文件')
    setLoading(false)
  }

  // 重置狀態當文件改變
  useEffect(() => {
    setLoading(true)
    setError(null)
    setCurrentPage(1)
    setPageInput('1')
    setRefreshKey(prev => prev + 1)
  }, [filename])

  // 當 targetPage 改變時，跳轉到指定頁面
  useEffect(() => {
    if (targetPage && targetPage > 0) {
      console.log(`PDFViewer: 跳轉到第 ${targetPage} 頁`)
      setCurrentPage(targetPage)
      setPageInput(String(targetPage))
      
      // 強制刷新 iframe
      if (iframeRef.current) {
        setLoading(true)
        // 使用時間戳強制重新加載
        const url = `${basePdfUrl}?t=${Date.now()}#page=${targetPage}`
        iframeRef.current.src = url
      }
    }
  }, [targetPage])

  // 頁面導航
  const goToPage = (page) => {
    if (page > 0 && iframeRef.current) {
      console.log(`PDFViewer: 導航到第 ${page} 頁`)
      setCurrentPage(page)
      setPageInput(String(page))
      setLoading(true)
      
      // 使用時間戳強制重新加載
      const url = `${basePdfUrl}?t=${Date.now()}#page=${page}`
      iframeRef.current.src = url
      
      if (onPageChange) {
        onPageChange(page)
      }
    }
  }

  // 處理頁碼輸入
  const handlePageInputChange = (e) => {
    setPageInput(e.target.value)
  }

  const handlePageInputSubmit = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput, 10)
      if (!isNaN(page) && page > 0) {
        goToPage(page)
      }
    }
  }

  // 在新視窗開啟（帶頁碼）
  const openInNewWindow = () => {
    const url = `${basePdfUrl}#page=${currentPage}`
    window.open(url, '_blank')
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium">{error}</p>
        <p className="text-gray-500 text-sm mt-2">
          請確認 PDF 文件已正確上傳
        </p>
        <a 
          href={basePdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-3 text-primary-600 hover:underline flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          在新視窗開啟
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 工具列 */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]" title={filename}>
          {filename}
        </span>
        
        {/* 頁碼導航 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title="上一頁"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">第</span>
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
              className="w-10 px-1 py-0.5 text-xs text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="輸入頁碼後按 Enter"
            />
            <span className="text-xs text-gray-500">頁</span>
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="下一頁"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={openInNewWindow}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="在新視窗開啟（大螢幕查看）"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <a 
            href={downloadUrl}
            download={filename}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="下載 PDF"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      {/* 高亮提示 - 點擊來源時顯示 */}
      {highlightText && (
        <div className="px-2 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
            <Search className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">相關內容：{highlightText.slice(0, 50)}...</span>
          </p>
        </div>
      )}

      {/* PDF 顯示區 */}
      <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">載入中...</p>
            </div>
          </div>
        )}
        
        <iframe
          key={refreshKey}
          ref={iframeRef}
          src={buildPdfUrl(currentPage)}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          title={`PDF: ${filename}`}
        />
      </div>
    </div>
  )
}

export default PDFViewer
