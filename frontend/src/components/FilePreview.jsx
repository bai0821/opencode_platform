import React, { useState, useEffect, useRef } from 'react'
import { 
  Loader2, 
  FileText, 
  AlertCircle, 
  ExternalLink, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Image as ImageIcon,
  Table,
  FileSpreadsheet,
  File,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react'

/**
 * 通用檔案預覽組件
 * 支援：PDF、圖片、Excel（提示）、其他檔案
 */
function FilePreview({ filename, apiBase, targetPage, highlightText, onPageChange }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [imageZoom, setImageZoom] = useState(100)
  const [imageRotation, setImageRotation] = useState(0)
  const iframeRef = useRef(null)
  const imageRef = useRef(null)

  // 判斷檔案類型
  const getFileType = (name) => {
    if (!name) return 'unknown'
    const ext = name.split('.').pop()?.toLowerCase()
    
    if (['pdf'].includes(ext)) return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image'
    if (['xls', 'xlsx', 'xlsm'].includes(ext)) return 'excel'
    if (['doc', 'docx'].includes(ext)) return 'word'
    if (['txt', 'md', 'json', 'csv', 'log'].includes(ext)) return 'text'
    if (['ppt', 'pptx'].includes(ext)) return 'powerpoint'
    return 'unknown'
  }

  const fileType = getFileType(filename)

  // 構建檔案 URL
  const getFileUrl = () => {
    if (!filename) return ''
    // 對於所有檔案類型，使用 pdf 端點（它會返回原始檔案）
    return `${apiBase}/documents/${encodeURIComponent(filename)}/pdf`
  }

  const downloadUrl = `${apiBase}/documents/${encodeURIComponent(filename)}/pdf?download=true`

  // 重置狀態當文件改變
  useEffect(() => {
    setLoading(true)
    setError(null)
    setCurrentPage(1)
    setPageInput('1')
    setImageZoom(100)
    setImageRotation(0)
  }, [filename])

  // 當 targetPage 改變時
  useEffect(() => {
    if (targetPage && targetPage > 0 && fileType === 'pdf') {
      setCurrentPage(targetPage)
      setPageInput(String(targetPage))
      
      if (iframeRef.current) {
        setLoading(true)
        const url = `${getFileUrl()}?t=${Date.now()}#page=${targetPage}`
        iframeRef.current.src = url
      }
    }
  }, [targetPage])

  const handleLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleError = () => {
    setError('無法載入檔案')
    setLoading(false)
  }

  // 圖片控制
  const zoomIn = () => setImageZoom(prev => Math.min(prev + 25, 300))
  const zoomOut = () => setImageZoom(prev => Math.max(prev - 25, 25))
  const rotateImage = () => setImageRotation(prev => (prev + 90) % 360)

  // PDF 頁面控制
  const goToPage = (page) => {
    const p = Math.max(1, parseInt(page) || 1)
    setCurrentPage(p)
    setPageInput(String(p))
    
    if (iframeRef.current) {
      const url = `${getFileUrl()}?t=${Date.now()}#page=${p}`
      iframeRef.current.src = url
    }
    
    if (onPageChange) onPageChange(p)
  }

  // 渲染不同類型的預覽
  const renderPreview = () => {
    switch (fileType) {
      case 'pdf':
        return (
          <div className="relative h-full bg-gray-100 dark:bg-gray-800">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
                <p className="text-sm text-gray-500">載入 PDF...</p>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              key={filename}
              src={`${getFileUrl()}#page=${currentPage}`}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
              title={filename}
            />
          </div>
        )

      case 'image':
        return (
          <div className="relative h-full bg-gray-900 flex items-center justify-center overflow-auto">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
                <p className="text-sm text-gray-400">載入圖片...</p>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            
            <img
              ref={imageRef}
              src={getFileUrl()}
              alt={filename}
              className="max-w-full transition-transform duration-200"
              style={{
                transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                display: loading ? 'none' : 'block'
              }}
              onLoad={handleLoad}
              onError={handleError}
            />
            
            {/* 圖片控制列 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-lg px-3 py-2">
              <button onClick={zoomOut} className="p-1 hover:bg-white/20 rounded" title="縮小">
                <ZoomOut className="w-4 h-4 text-white" />
              </button>
              <span className="text-white text-sm min-w-[50px] text-center">{imageZoom}%</span>
              <button onClick={zoomIn} className="p-1 hover:bg-white/20 rounded" title="放大">
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
              <div className="w-px h-4 bg-white/30 mx-1" />
              <button onClick={rotateImage} className="p-1 hover:bg-white/20 rounded" title="旋轉">
                <RotateCw className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )

      case 'excel':
        return (
          <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-6">
            <FileSpreadsheet className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excel 檔案
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              {filename}
            </p>
            <p className="text-xs text-gray-400 text-center mb-4">
              Excel 檔案無法在瀏覽器中直接預覽<br/>
              請下載後使用 Excel 或 Google Sheets 開啟
            </p>
            <a
              href={downloadUrl}
              download
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              下載檔案
            </a>
          </div>
        )

      case 'word':
        return (
          <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-6">
            <FileText className="w-16 h-16 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Word 檔案
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              {filename}
            </p>
            <p className="text-xs text-gray-400 text-center mb-4">
              Word 檔案無法在瀏覽器中直接預覽<br/>
              請下載後使用 Word 或 Google Docs 開啟
            </p>
            <a
              href={downloadUrl}
              download
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              下載檔案
            </a>
          </div>
        )

      case 'text':
        return (
          <div className="h-full bg-gray-900 p-4 overflow-auto">
            <TextFileViewer url={getFileUrl()} filename={filename} />
          </div>
        )

      default:
        return (
          <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-6">
            <File className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              無法預覽
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              {filename}
            </p>
            <a
              href={downloadUrl}
              download
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              下載檔案
            </a>
          </div>
        )
    }
  }

  // 獲取檔案類型圖標
  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />
      case 'image': return <ImageIcon className="w-4 h-4 text-purple-500" />
      case 'excel': return <FileSpreadsheet className="w-4 h-4 text-green-500" />
      case 'word': return <FileText className="w-4 h-4 text-blue-500" />
      case 'text': return <FileText className="w-4 h-4 text-gray-500" />
      default: return <File className="w-4 h-4 text-gray-400" />
    }
  }

  if (!filename) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>選擇文件以預覽</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 工具列 */}
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon()}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {filename}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* PDF 頁面控制 */}
          {fileType === 'pdf' && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => goToPage(pageInput)}
                onKeyDown={(e) => e.key === 'Enter' && goToPage(pageInput)}
                className="w-10 text-center text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
              />
              <span className="text-xs text-gray-500">頁</span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* 下載按鈕 */}
          <a
            href={downloadUrl}
            download
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
            title="下載"
          >
            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </a>
          
          {/* 新視窗開啟 */}
          <a
            href={getFileUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
            title="在新視窗開啟"
          >
            <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </a>
        </div>
      </div>

      {/* 預覽區 */}
      <div className="flex-1 overflow-hidden">
        {renderPreview()}
      </div>
    </div>
  )
}

// 文字檔案預覽組件
function TextFileViewer({ url, filename }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        const res = await fetch(url)
        if (!res.ok) throw new Error('載入失敗')
        const text = await res.text()
        setContent(text)
        setError(null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [url])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400">
        <AlertCircle className="w-6 h-6 mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
      {content}
    </pre>
  )
}

export default FilePreview
