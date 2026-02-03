import React from 'react'
import { FileText, Image, Table, Code, ExternalLink } from 'lucide-react'

// 內容類型對應的圖標和顏色
const contentTypeConfig = {
  text: { icon: FileText, color: 'text-blue-500', label: '文字' },
  image: { icon: Image, color: 'text-purple-500', label: '圖片' },
  table: { icon: Table, color: 'text-green-500', label: '表格' },
  code: { icon: Code, color: 'text-orange-500', label: '程式碼' },
  spreadsheet: { icon: Table, color: 'text-emerald-500', label: '試算表' },
  csv: { icon: Table, color: 'text-teal-500', label: 'CSV' },
  json: { icon: Code, color: 'text-yellow-500', label: 'JSON' },
  yaml: { icon: Code, color: 'text-amber-500', label: 'YAML' },
}

function SourceCard({ source, onSourceClick }) {
  const { 
    document_name, 
    file_name,
    title, 
    content, 
    text,
    score, 
    page,
    page_label,
    metadata 
  } = source

  // 優先使用 file_name
  const displayTitle = file_name || document_name || title || metadata?.file_name || metadata?.source || '未知來源'
  const displayContent = content || text || ''
  const displayScore = score ? (score * 100).toFixed(1) : null
  const displayPage = page || page_label || metadata?.page_label
  
  // 內容類型
  const contentType = metadata?.content_type || 'text'
  const typeConfig = contentTypeConfig[contentType] || contentTypeConfig.text
  const TypeIcon = typeConfig.icon

  const handleClick = () => {
    if (onSourceClick) {
      onSourceClick({
        fileName: displayTitle,
        page: displayPage,
        text: displayContent
      })
    }
  }

  return (
    <div 
      className="source-card cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg p-2 -m-2 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
      onClick={handleClick}
      title="點擊跳轉到文件對應位置"
    >
      <div className="flex items-start gap-2">
        <TypeIcon className={`w-4 h-4 ${typeConfig.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                {displayTitle}
              </h4>
              {contentType !== 'text' && (
                <span className={`text-[10px] px-1 py-0.5 rounded ${typeConfig.color} bg-gray-100 dark:bg-gray-700`}>
                  {typeConfig.label}
                </span>
              )}
            </div>
            {displayScore && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded flex-shrink-0">
                {displayScore}%
              </span>
            )}
          </div>
          
          {displayPage && (
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
              第 {displayPage} 頁
            </p>
          )}
          
          {displayContent && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {displayContent}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SourceCard
