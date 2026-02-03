import React, { useState, useEffect, useRef } from 'react'
import {
  Puzzle,
  Upload,
  RefreshCw,
  Settings,
  Play,
  Square,
  Trash2,
  RotateCw,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Package,
  GitBranch,
  Bot,
  Wrench,
  Eye,
  EyeOff,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react'
import clsx from 'clsx'

const PLUGIN_TYPE_ICONS = {
  agent: Bot,
  tool: Wrench,
  service: Package,
  processor: Settings,
  hook: GitBranch,
  ui: Eye
}

const PLUGIN_TYPE_LABELS = {
  agent: 'Agent',
  tool: '工具',
  service: '服務',
  processor: '處理器',
  hook: '鉤子',
  ui: 'UI'
}

const STATUS_COLORS = {
  enabled: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  disabled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  loaded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  discovered: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const STATUS_LABELS = {
  enabled: '已啟用',
  disabled: '已停用',
  loaded: '已載入',
  discovered: '已發現',
  error: '錯誤'
}

function PluginManager({ apiBase, token }) {
  const [plugins, setPlugins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  
  // 篩選
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // 對話框
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showGitDialog, setShowGitDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedPlugin, setSelectedPlugin] = useState(null)
  
  const fileInputRef = useRef(null)

  // 載入插件列表
  const loadPlugins = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiBase}/plugins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Failed to load plugins')
      
      const data = await res.json()
      setPlugins(data.plugins || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlugins()
  }, [apiBase, token])

  // 發現插件
  const discoverPlugins = async () => {
    try {
      setActionLoading('discover')
      const res = await fetch(`${apiBase}/plugins/discover`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Failed to discover plugins')
      
      const data = await res.json()
      setSuccess(`發現 ${data.count} 個插件`)
      await loadPlugins()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // 啟用/停用插件
  const togglePlugin = async (pluginId, currentStatus) => {
    const action = currentStatus === 'enabled' ? 'disable' : 'enable'
    
    try {
      setActionLoading(pluginId)
      const res = await fetch(`${apiBase}/plugins/${pluginId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || `Failed to ${action} plugin`)
      }
      
      setSuccess(`插件已${action === 'enable' ? '啟用' : '停用'}`)
      await loadPlugins()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // 重載插件
  const reloadPlugin = async (pluginId) => {
    try {
      setActionLoading(pluginId)
      const res = await fetch(`${apiBase}/plugins/${pluginId}/reload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Failed to reload plugin')
      
      setSuccess('插件已重載')
      await loadPlugins()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // 刪除插件
  const deletePlugin = async (pluginId, pluginName) => {
    if (!confirm(`確定要刪除插件「${pluginName}」嗎？此操作無法復原。`)) return
    
    try {
      setActionLoading(pluginId)
      const res = await fetch(`${apiBase}/plugins/${pluginId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Failed to delete plugin')
      
      setSuccess('插件已刪除')
      await loadPlugins()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // 上傳插件
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setActionLoading('upload')
      
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`${apiBase}/plugins/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to upload plugin')
      }
      
      const data = await res.json()
      setSuccess(`插件 ${data.plugin_id} 已安裝`)
      setShowUploadDialog(false)
      await loadPlugins()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 從 Git 安裝
  const installFromGit = async (url, branch) => {
    try {
      setActionLoading('git')
      
      const res = await fetch(`${apiBase}/plugins/install-git`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, branch })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to install from Git')
      }
      
      const data = await res.json()
      setSuccess(`插件 ${data.plugin_id} 已從 Git 安裝`)
      setShowGitDialog(false)
      await loadPlugins()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // 篩選插件
  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = 
      plugin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || plugin.plugin_type === typeFilter
    const matchesStatus = statusFilter === 'all' || plugin.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  // 清除通知
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="h-full flex flex-col p-6">
      {/* 標題欄 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Puzzle className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold">插件管理</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({plugins.length} 個插件)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={discoverPlugins}
            disabled={actionLoading === 'discover'}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {actionLoading === 'discover' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>發現插件</span>
          </button>
          
          <button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>安裝插件</span>
          </button>
        </div>
      </div>

      {/* 通知 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 篩選欄 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋插件..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        >
          <option value="all">所有類型</option>
          <option value="agent">Agent</option>
          <option value="tool">工具</option>
          <option value="service">服務</option>
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        >
          <option value="all">所有狀態</option>
          <option value="enabled">已啟用</option>
          <option value="disabled">已停用</option>
          <option value="discovered">已發現</option>
        </select>
      </div>

      {/* 插件列表 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Puzzle className="w-16 h-16 mb-4 opacity-50" />
            <p>沒有找到插件</p>
            <p className="text-sm mt-1">點擊「發現插件」掃描插件目錄，或「安裝插件」上傳新插件</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPlugins.map(plugin => {
              const TypeIcon = PLUGIN_TYPE_ICONS[plugin.plugin_type] || Package
              const isLoading = actionLoading === plugin.id
              
              return (
                <div
                  key={plugin.id}
                  className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* 圖標 */}
                    <div className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      plugin.status === 'enabled' 
                        ? 'bg-primary-100 dark:bg-primary-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    )}>
                      <TypeIcon className={clsx(
                        'w-6 h-6',
                        plugin.status === 'enabled' 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-gray-500'
                      )} />
                    </div>
                    
                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{plugin.name}</h3>
                        <span className="text-sm text-gray-500">v{plugin.version}</span>
                        <span className={clsx(
                          'px-2 py-0.5 text-xs rounded-full',
                          STATUS_COLORS[plugin.status]
                        )}>
                          {STATUS_LABELS[plugin.status]}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                        {plugin.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <TypeIcon className="w-3 h-3" />
                          {PLUGIN_TYPE_LABELS[plugin.plugin_type]}
                        </span>
                        {plugin.author && (
                          <span>作者: {plugin.author}</span>
                        )}
                        {plugin.tags?.length > 0 && (
                          <div className="flex items-center gap-1">
                            {plugin.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 操作按鈕 */}
                    <div className="flex items-center gap-2">
                      {/* 配置 */}
                      <button
                        onClick={() => {
                          setSelectedPlugin(plugin)
                          setShowConfigDialog(true)
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="配置"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      
                      {/* 重載 */}
                      <button
                        onClick={() => reloadPlugin(plugin.id)}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="重載"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCw className="w-4 h-4" />
                        )}
                      </button>
                      
                      {/* 啟用/停用 */}
                      <button
                        onClick={() => togglePlugin(plugin.id, plugin.status)}
                        disabled={isLoading}
                        className={clsx(
                          'p-2 rounded-lg',
                          plugin.status === 'enabled'
                            ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500'
                            : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500'
                        )}
                        title={plugin.status === 'enabled' ? '停用' : '啟用'}
                      >
                        {plugin.status === 'enabled' ? (
                          <Square className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      
                      {/* 刪除 */}
                      <button
                        onClick={() => deletePlugin(plugin.id, plugin.name)}
                        disabled={isLoading}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 上傳對話框 */}
      {showUploadDialog && (
        <UploadDialog
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleUpload}
          onGitInstall={() => {
            setShowUploadDialog(false)
            setShowGitDialog(true)
          }}
          fileInputRef={fileInputRef}
          loading={actionLoading === 'upload'}
        />
      )}

      {/* Git 安裝對話框 */}
      {showGitDialog && (
        <GitInstallDialog
          onClose={() => setShowGitDialog(false)}
          onInstall={installFromGit}
          loading={actionLoading === 'git'}
        />
      )}

      {/* 配置對話框 */}
      {showConfigDialog && selectedPlugin && (
        <ConfigDialog
          plugin={selectedPlugin}
          apiBase={apiBase}
          token={token}
          onClose={() => {
            setShowConfigDialog(false)
            setSelectedPlugin(null)
          }}
          onSave={() => {
            setSuccess('配置已保存')
            loadPlugins()
          }}
        />
      )}
    </div>
  )
}

// 上傳對話框組件
function UploadDialog({ onClose, onUpload, onGitInstall, fileInputRef, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[480px] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            安裝插件
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 上傳區域 */}
        <label className="block mb-6">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
            {loading ? (
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-600 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            )}
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              拖放 .zip 文件到這裡，或點擊選擇
            </p>
            <p className="text-sm text-gray-500">
              支援 ZIP 格式的插件包
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={onUpload}
            className="hidden"
            disabled={loading}
          />
        </label>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm text-gray-500">或</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* 從 Git 安裝 */}
        <button
          onClick={onGitInstall}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <GitBranch className="w-5 h-5" />
          <span>從 Git 倉庫安裝</span>
        </button>
      </div>
    </div>
  )
}

// Git 安裝對話框組件
function GitInstallDialog({ onClose, onInstall, loading }) {
  const [url, setUrl] = useState('')
  const [branch, setBranch] = useState('main')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[480px] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary-600" />
            從 Git 安裝
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Git URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/plugin-repo.git"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Branch</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={() => onInstall(url, branch)}
            disabled={!url || loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>安裝</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// 配置對話框組件
function ConfigDialog({ plugin, apiBase, token, onClose, onSave }) {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState({})

  useEffect(() => {
    loadConfig()
  }, [plugin.id])

  const loadConfig = async () => {
    try {
      const res = await fetch(`${apiBase}/plugins/${plugin.id}/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config || {})
      }
    } catch (err) {
      console.error('Failed to load config:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      const res = await fetch(`${apiBase}/plugins/${plugin.id}/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      })
      
      if (res.ok) {
        onSave()
        onClose()
      }
    } catch (err) {
      console.error('Failed to save config:', err)
    } finally {
      setSaving(false)
    }
  }

  const schema = plugin.config_schema || {}

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[520px] shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            {plugin.name} 配置
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : Object.keys(schema).length === 0 ? (
          <p className="text-gray-500 text-center py-8">此插件沒有可配置的選項</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(schema).map(([key, field]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">
                  {field.label || key}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.description && (
                  <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                )}
                
                {field.type === 'select' ? (
                  <select
                    value={config[key] || field.default || ''}
                    onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'boolean' ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config[key] || false}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span>{field.label}</span>
                  </label>
                ) : (
                  <div className="relative">
                    <input
                      type={field.secret && !showSecrets[key] ? 'password' : 'text'}
                      value={config[key] || ''}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                      placeholder={field.default || ''}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 pr-10"
                    />
                    {field.secret && (
                      <button
                        type="button"
                        onClick={() => setShowSecrets({ ...showSecrets, [key]: !showSecrets[key] })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PluginManager
