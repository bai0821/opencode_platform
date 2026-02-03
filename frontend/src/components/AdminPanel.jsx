import React, { useState, useEffect } from 'react'
import { 
  Database, 
  FileText, 
  HardDrive, 
  RefreshCw, 
  Activity,
  Server,
  Cpu,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Layers,
  ChevronDown,
  Eye,
  Search
} from 'lucide-react'
import clsx from 'clsx'

function AdminPanel({ stats, onRefresh, apiBase }) {
  const [health, setHealth] = useState(null)
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  // 知識庫相關狀態
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [collectionStats, setCollectionStats] = useState(null)
  const [documents, setDocuments] = useState([])
  const [chunks, setChunks] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showChunks, setShowChunks] = useState(false)
  const [chunkSearch, setChunkSearch] = useState('')

  const token = localStorage.getItem('token')

  // 載入健康狀態
  const loadHealth = async () => {
    try {
      const res = await fetch(`${apiBase}/health`)
      if (res.ok) {
        setHealth(await res.json())
      }
    } catch (error) {
      console.error('載入健康狀態失敗:', error)
    }
  }

  // 載入服務列表
  const loadServices = async () => {
    try {
      const res = await fetch(`${apiBase}/services`)
      if (res.ok) {
        setServices(await res.json())
      }
    } catch (error) {
      console.error('載入服務列表失敗:', error)
    }
  }

  // 載入知識庫列表
  const loadCollections = async () => {
    try {
      const res = await fetch(`${apiBase}/collections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCollections(data.collections || [])
        // 自動選擇預設知識庫
        const defaultColl = data.collections?.find(c => c.is_default) || data.collections?.[0]
        if (defaultColl && !selectedCollection) {
          setSelectedCollection(defaultColl.id)
        }
      }
    } catch (error) {
      console.error('載入知識庫失敗:', error)
    }
  }

  // 載入選中知識庫的統計
  const loadCollectionStats = async (collId) => {
    if (!collId) return
    try {
      const res = await fetch(`${apiBase}/collections/${collId}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setCollectionStats(await res.json())
      }
    } catch (error) {
      console.error('載入知識庫統計失敗:', error)
    }
  }

  // 載入知識庫文檔
  const loadDocuments = async (collId) => {
    if (!collId) return
    try {
      const res = await fetch(`${apiBase}/collections/${collId}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('載入文檔失敗:', error)
    }
  }

  // 載入 chunks
  const loadChunks = async (collId, fileName = null) => {
    if (!collId) return
    try {
      let url = `${apiBase}/collections/${collId}/chunks?limit=50`
      if (fileName) url += `&file_name=${encodeURIComponent(fileName)}`
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setChunks(data.chunks || [])
      }
    } catch (error) {
      console.error('載入 chunks 失敗:', error)
    }
  }

  useEffect(() => {
    loadHealth()
    loadServices()
    loadCollections()
  }, [apiBase])

  // 當選中的知識庫變化時，載入相關數據
  useEffect(() => {
    if (selectedCollection) {
      loadCollectionStats(selectedCollection)
      loadDocuments(selectedCollection)
      loadChunks(selectedCollection, selectedDoc)
    }
  }, [selectedCollection])

  const handleRefresh = async () => {
    setIsLoading(true)
    await Promise.all([
      loadHealth(), 
      loadServices(), 
      loadCollections(),
      selectedCollection && loadCollectionStats(selectedCollection),
      selectedCollection && loadDocuments(selectedCollection),
      onRefresh()
    ])
    setIsLoading(false)
  }

  const handleSelectDocument = (doc) => {
    setSelectedDoc(doc.file_name)
    loadChunks(selectedCollection, doc.file_name)
    setShowChunks(true)
  }

  // 過濾 chunks
  const filteredChunks = chunks.filter(chunk =>
    !chunkSearch || chunk.text.toLowerCase().includes(chunkSearch.toLowerCase())
  )

  // 當前選中的知識庫
  const currentCollection = collections.find(c => c.id === selectedCollection)

  // 統計卡片資料
  const statCards = [
    {
      label: '文件數量',
      value: documents.length || stats?.document_count || 0,
      icon: FileText,
      color: 'blue'
    },
    {
      label: '向量數量',
      value: collectionStats?.points_count || stats?.vector_count || 0,
      icon: Database,
      color: 'green'
    },
    {
      label: '索引大小',
      value: formatBytes(stats?.index_size || 0),
      icon: HardDrive,
      color: 'purple'
    },
    {
      label: '系統狀態',
      value: health?.status === 'healthy' ? '正常' : '異常',
      icon: Activity,
      color: health?.status === 'healthy' ? 'green' : 'red'
    }
  ]

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">系統管理</h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          <span>重新整理</span>
        </button>
      </div>

      {/* 知識庫選擇 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            選擇知識庫
          </h3>
        </div>
        <select
          value={selectedCollection || ''}
          onChange={(e) => {
            setSelectedCollection(e.target.value)
            setSelectedDoc(null)
            setShowChunks(false)
          }}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">請選擇知識庫</option>
          {collections.map(coll => (
            <option key={coll.id} value={coll.id}>
              {coll.display_name} ({coll.name}) - {coll.points_count || 0} 向量
              {coll.is_default ? ' [預設]' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <StatCard key={idx} {...card} />
        ))}
      </div>

      {/* 詳細統計 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Qdrant 狀態 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-500" />
            Qdrant 向量資料庫
          </h3>
          
          <div className="space-y-3">
            <InfoRow 
              label="Collection" 
              value={currentCollection?.name || stats?.collection_name || 'rag_knowledge_base'} 
            />
            <InfoRow 
              label="狀態" 
              value={
                <span className={clsx(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  collectionStats?.status === 'green' || stats?.status === 'green'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                )}>
                  {collectionStats?.status || stats?.status || 'unknown'}
                </span>
              }
            />
            <InfoRow 
              label="向量維度" 
              value={currentCollection?.vector_size || collectionStats?.config?.vector_size || stats?.vector_dim || 1024} 
            />
            <InfoRow 
              label="Embedding" 
              value={currentCollection?.embedding_provider || 'cohere'} 
            />
            <InfoRow 
              label="模型" 
              value={currentCollection?.embedding_model || 'embed-multilingual-v3.0'} 
            />
          </div>
        </div>

        {/* API 健康狀態 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            API 服務狀態
          </h3>
          
          <div className="space-y-3">
            <InfoRow 
              label="狀態" 
              value={
                health?.status === 'healthy' ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" /> 正常運行
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" /> 異常
                  </span>
                )
              }
            />
            <InfoRow 
              label="引擎就緒" 
              value={health?.engine_ready ? '是' : '否'} 
            />
            <InfoRow 
              label="版本" 
              value={health?.version || '1.0.0'} 
            />
          </div>
        </div>
      </div>

      {/* 文件列表和 Chunks 查看 */}
      {selectedCollection && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              文件和 Chunks ({documents.length} 個文件)
            </h3>
            {showChunks && (
              <button
                onClick={() => { setShowChunks(false); setSelectedDoc(null); }}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                返回文件列表
              </button>
            )}
          </div>
          
          {!showChunks ? (
            // 文件列表
            <div className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-center py-8 text-gray-500">此知識庫尚無文件</p>
              ) : (
                documents.map((doc, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectDocument(doc)}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.chunk_count} chunks • {doc.page_count} 頁
                        </p>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          ) : (
            // Chunks 查看
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={chunkSearch}
                    onChange={(e) => setChunkSearch(e.target.value)}
                    placeholder="搜尋 chunks 內容..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                </div>
                <span className="text-sm text-gray-500">
                  {selectedDoc} - {filteredChunks.length} chunks
                </span>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredChunks.map((chunk, idx) => (
                  <div
                    key={chunk.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-gray-400">
                        Chunk #{idx + 1} • ID: {chunk.id.substring(0, 12)}...
                      </span>
                      <span className="text-xs text-gray-400">
                        {chunk.full_text_length} 字元
                        {chunk.page_label && ` • 第 ${chunk.page_label} 頁`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {chunk.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 可用服務 */}
      {services.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-500" />
            可用服務 ({services.length})
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((service, idx) => (
              <ServiceCard key={idx} service={service} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 統計卡片組件
function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  )
}

// 資訊列組件
function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

// 服務卡片組件
function ServiceCard({ service }) {
  const { id, name, description, status } = service

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{name || id}</span>
        <span className={clsx(
          'w-2 h-2 rounded-full',
          status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'
        )} />
      </div>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {description}
        </p>
      )}
    </div>
  )
}

// 格式化位元組
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default AdminPanel
