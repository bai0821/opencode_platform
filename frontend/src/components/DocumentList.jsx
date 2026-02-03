import React, { useState, useRef, useEffect } from 'react'
import { 
  FileText, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Check, 
  Loader2,
  AlertCircle,
  CheckCircle,
  File,
  X,
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Move,
  Edit2,
  FileSpreadsheet,
  FileImage,
  FileCode,
  FileArchive
} from 'lucide-react'
import clsx from 'clsx'

// 根據檔案類型獲取圖標和顏色
const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  if (['pdf'].includes(ext)) {
    return { icon: FileText, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' }
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' }
  }
  if (['doc', 'docx'].includes(ext)) {
    return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' }
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' }
  }
  if (['py', 'js', 'ts', 'json', 'html', 'css', 'md'].includes(ext)) {
    return { icon: FileCode, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { icon: FileArchive, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' }
  }
  return { icon: File, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700' }
}

function DocumentList({ documents, selectedDocs, onSelectDocs, onRefresh, apiBase }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const fileInputRef = useRef(null)
  
  // 資料夾相關狀態
  const [folders, setFolders] = useState([])
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']))
  const [currentFolder, setCurrentFolder] = useState('root')
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [fileToMove, setFileToMove] = useState(null)
  const [renamingFolder, setRenamingFolder] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  // 載入資料夾結構
  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = () => {
    const savedFolders = localStorage.getItem('opencode_folders')
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders))
    }
  }

  const saveFolders = (newFolders) => {
    setFolders(newFolders)
    localStorage.setItem('opencode_folders', JSON.stringify(newFolders))
  }

  // 組織文件到資料夾結構
  const getFilesInFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) {
      // root folder - 顯示未分類的文件
      const assignedFiles = folders.flatMap(f => f.files || [])
      return documents.filter(doc => {
        const docName = doc.name || doc.document_name
        return !assignedFiles.includes(docName)
      })
    }
    return documents.filter(doc => {
      const docName = doc.name || doc.document_name
      return (folder.files || []).includes(docName)
    })
  }

  const getSubFolders = (parentId) => {
    return folders.filter(f => f.parent === parentId)
  }

  // 切換資料夾展開
  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  // 創建新資料夾
  const createFolder = () => {
    if (!newFolderName.trim()) return
    
    const newFolder = {
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      parent: currentFolder === 'root' ? null : currentFolder,
      files: [],
      createdAt: new Date().toISOString()
    }
    
    saveFolders([...folders, newFolder])
    setNewFolderName('')
    setShowNewFolderDialog(false)
    setSuccess(`資料夾「${newFolder.name}」已創建`)
    
    // 自動展開父資料夾
    setExpandedFolders(prev => new Set([...prev, currentFolder]))
  }

  // 刪除資料夾
  const deleteFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return
    
    if (!confirm(`確定要刪除資料夾「${folder.name}」嗎？\n（資料夾內的文件將移到根目錄）`)) return
    
    // 移除資料夾
    saveFolders(folders.filter(f => f.id !== folderId && f.parent !== folderId))
    setSuccess(`資料夾「${folder.name}」已刪除`)
  }

  // 重命名資料夾
  const renameFolder = (folderId) => {
    if (!renameValue.trim()) {
      setRenamingFolder(null)
      return
    }
    
    const newFolders = folders.map(f => 
      f.id === folderId ? { ...f, name: renameValue.trim() } : f
    )
    saveFolders(newFolders)
    setRenamingFolder(null)
    setRenameValue('')
  }

  // 移動文件到資料夾
  const moveFile = (fileName, targetFolderId) => {
    // 從所有資料夾中移除文件
    const newFolders = folders.map(f => ({
      ...f,
      files: (f.files || []).filter(name => name !== fileName)
    }))
    
    // 如果目標不是 root，則添加到目標資料夾
    if (targetFolderId !== 'root') {
      const targetIdx = newFolders.findIndex(f => f.id === targetFolderId)
      if (targetIdx >= 0) {
        newFolders[targetIdx].files = [...(newFolders[targetIdx].files || []), fileName]
      }
    }
    
    saveFolders(newFolders)
    setShowMoveDialog(false)
    setFileToMove(null)
    setSuccess(`文件已移動`)
  }

  // 切換文件選擇
  const toggleDocument = (docName) => {
    if (selectedDocs.includes(docName)) {
      onSelectDocs(selectedDocs.filter(d => d !== docName))
    } else {
      onSelectDocs([...selectedDocs, docName])
    }
  }

  // 全選當前資料夾
  const toggleSelectAll = () => {
    const currentFiles = getFilesInFolder(currentFolder).map(d => d.name || d.document_name)
    const allSelected = currentFiles.every(f => selectedDocs.includes(f))
    
    if (allSelected) {
      onSelectDocs(selectedDocs.filter(d => !currentFiles.includes(d)))
    } else {
      onSelectDocs([...new Set([...selectedDocs, ...currentFiles])])
    }
  }

  // 上傳檔案
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    const newProgress = {}
    files.forEach(f => newProgress[f.name] = { status: 'pending', progress: 0 })
    setUploadProgress(newProgress)

    let successCount = 0
    let failCount = 0
    const uploadedFiles = []

    for (const file of files) {
      try {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'uploading', progress: 30 }
        }))

        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(`${apiBase}/upload`, {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'success', progress: 100 }
          }))
          successCount++
          uploadedFiles.push(file.name)
        } else {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.detail || '上傳失敗')
        }
      } catch (err) {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'error', progress: 0, error: err.message }
        }))
        failCount++
      }
    }

    // 如果在資料夾中上傳，自動將文件加入該資料夾
    if (currentFolder !== 'root' && uploadedFiles.length > 0) {
      const newFolders = folders.map(f => {
        if (f.id === currentFolder) {
          return { ...f, files: [...(f.files || []), ...uploadedFiles] }
        }
        return f
      })
      saveFolders(newFolders)
    }

    setUploading(false)

    if (successCount > 0) {
      setSuccess(`成功上傳 ${successCount} 個檔案`)
      onRefresh()
    }
    if (failCount > 0) {
      setError(`${failCount} 個檔案上傳失敗`)
    }

    setTimeout(() => setUploadProgress({}), 3000)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 刪除文件
  const deleteDocument = async (docName) => {
    if (!confirm(`確定要刪除 "${docName}" 嗎？`)) return

    setDeleting(docName)
    setError(null)

    try {
      const res = await fetch(`${apiBase}/documents/${encodeURIComponent(docName)}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        // 從所有資料夾中移除
        const newFolders = folders.map(f => ({
          ...f,
          files: (f.files || []).filter(name => name !== docName)
        }))
        saveFolders(newFolders)
        
        setSuccess(`已刪除 "${docName}"`)
        onSelectDocs(selectedDocs.filter(d => d !== docName))
        onRefresh()
      } else {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || '刪除失敗')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  // 渲染資料夾項目
  const renderFolder = (folderId, depth = 0) => {
    const folder = folders.find(f => f.id === folderId)
    const isExpanded = expandedFolders.has(folderId)
    const subFolders = getSubFolders(folderId)
    const filesInFolder = getFilesInFolder(folderId)
    const isRenaming = renamingFolder === folderId
    
    if (!folder && folderId !== 'root') return null

    const folderName = folder ? folder.name : '所有文件'
    const totalItems = filesInFolder.length + subFolders.length

    return (
      <div key={folderId} style={{ marginLeft: depth * 16 }}>
        {/* 資料夾標題 */}
        <div
          className={clsx(
            'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group',
            currentFolder === folderId 
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          onClick={() => {
            setCurrentFolder(folderId)
            toggleFolder(folderId)
          }}
        >
          {/* 展開/收起箭頭 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFolder(folderId)
            }}
            className="p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* 資料夾圖標 */}
          {isExpanded ? (
            <FolderOpen className="w-5 h-5 text-yellow-500" />
          ) : (
            <Folder className="w-5 h-5 text-yellow-500" />
          )}

          {/* 資料夾名稱 */}
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') renameFolder(folderId)
                if (e.key === 'Escape') setRenamingFolder(null)
              }}
              onBlur={() => renameFolder(folderId)}
              className="flex-1 px-2 py-0.5 text-sm bg-white dark:bg-gray-800 border rounded"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm font-medium truncate">{folderName}</span>
          )}

          {/* 文件數量 */}
          <span className="text-xs text-gray-400">{totalItems}</span>

          {/* 操作按鈕（非 root） */}
          {folderId !== 'root' && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setRenamingFolder(folderId)
                  setRenameValue(folderName)
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                title="重命名"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteFolder(folderId)
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                title="刪除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* 展開內容 - 子資料夾 */}
        {isExpanded && (
          <div className="ml-6 border-l border-gray-200 dark:border-gray-700">
            {subFolders.map(sf => renderFolder(sf.id, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // 當前資料夾的文件
  const currentFiles = getFilesInFolder(currentFolder)
  const currentFolderName = currentFolder === 'root' 
    ? '所有文件' 
    : folders.find(f => f.id === currentFolder)?.name || '未知資料夾'

  return (
    <div className="h-full flex">
      {/* 左側資料夾樹 */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">資料夾</h3>
          <button
            onClick={() => setShowNewFolderDialog(true)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="新增資料夾"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* 資料夾樹 */}
        <div className="space-y-1">
          {renderFolder('root')}
          {folders.filter(f => !f.parent).map(f => renderFolder(f.id))}
        </div>
      </div>

      {/* 右側文件列表 */}
      <div className="flex-1 flex flex-col p-4 min-w-0">
        {/* 標題列 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Folder className="w-5 h-5 text-yellow-500" />
              {currentFolderName}
              <span className="text-sm font-normal text-gray-500">
                ({currentFiles.length} 個文件)
              </span>
            </h2>
            
            {currentFiles.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {currentFiles.every(d => selectedDocs.includes(d.name || d.document_name)) ? '取消全選' : '全選'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="重新整理"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>上傳檔案</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt,.md,.json,.png,.jpg,.jpeg,.gif,.webp,.py,.js,.ts,.html,.css"
                multiple
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* 通知訊息 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 上傳進度 */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-4 space-y-2">
            {Object.entries(uploadProgress).map(([name, info]) => (
              <div 
                key={name}
                className={clsx(
                  'p-3 rounded-lg flex items-center gap-3',
                  info.status === 'success' && 'bg-green-50 dark:bg-green-900/20',
                  info.status === 'error' && 'bg-red-50 dark:bg-red-900/20',
                  info.status === 'uploading' && 'bg-blue-50 dark:bg-blue-900/20',
                  info.status === 'pending' && 'bg-gray-50 dark:bg-gray-800'
                )}
              >
                {info.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                {info.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {info.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                {info.status === 'pending' && <File className="w-4 h-4 text-gray-400" />}
                
                <span className="text-sm flex-1 truncate">{name}</span>
                
                {info.error && (
                  <span className="text-xs text-red-500">{info.error}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 文件列表 */}
        <div className="flex-1 overflow-y-auto">
          {currentFiles.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>此資料夾是空的</p>
                <p className="text-sm mt-1">上傳檔案或從其他資料夾移動</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {currentFiles.map((doc, idx) => {
                const docName = doc.name || doc.document_name
                const isSelected = selectedDocs.includes(docName)
                const isDeleting = deleting === docName
                const fileInfo = getFileIcon(docName)
                const FileIcon = fileInfo.icon
                
                return (
                  <div
                    key={idx}
                    className={clsx(
                      'p-4 rounded-lg border transition-all cursor-pointer group',
                      isSelected 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                    onClick={() => toggleDocument(docName)}
                  >
                    <div className="flex items-center gap-3">
                      {/* 選擇框 */}
                      <div className={clsx(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        isSelected 
                          ? 'bg-primary-600 border-primary-600 text-white' 
                          : 'border-gray-300 dark:border-gray-600'
                      )}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>

                      {/* 圖示 */}
                      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', fileInfo.bg)}>
                        <FileIcon className={clsx('w-5 h-5', fileInfo.color)} />
                      </div>

                      {/* 資訊 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{docName}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {doc.chunk_count && (
                            <span>{doc.chunk_count} 區塊</span>
                          )}
                          {doc.page_count && (
                            <span>{doc.page_count} 頁</span>
                          )}
                          {doc.uploaded_at && (
                            <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      {/* 操作按鈕 */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setFileToMove(docName)
                            setShowMoveDialog(true)
                          }}
                          className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="移動到資料夾"
                        >
                          <Move className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteDocument(docName)
                          }}
                          disabled={isDeleting}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="刪除"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 新增資料夾對話框 */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-yellow-500" />
              新增資料夾
            </h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="資料夾名稱"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') createFolder()
                if (e.key === 'Escape') setShowNewFolderDialog(false)
              }}
            />
            <p className="text-sm text-gray-500 mb-4">
              將在「{currentFolderName}」下建立新資料夾
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewFolderDialog(false)
                  setNewFolderName('')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                創建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 移動文件對話框 */}
      {showMoveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Move className="w-5 h-5" />
              移動到資料夾
            </h3>
            <p className="text-sm text-gray-500 mb-4 truncate">選擇要將「{fileToMove}」移動到的資料夾</p>
            
            <div className="space-y-1 mb-4">
              {/* Root 選項 */}
              <button
                onClick={() => moveFile(fileToMove, 'root')}
                className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <Folder className="w-5 h-5 text-yellow-500" />
                <span>所有文件（根目錄）</span>
              </button>
              
              {/* 資料夾列表 */}
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => moveFile(fileToMove, folder.id)}
                  className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  <Folder className="w-5 h-5 text-yellow-500" />
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowMoveDialog(false)
                setFileToMove(null)
              }}
              className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentList
