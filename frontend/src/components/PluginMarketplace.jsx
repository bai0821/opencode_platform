import React, { useState, useEffect } from 'react'
import {
  Store,
  Search,
  Star,
  Download,
  CheckCircle,
  Loader2,
  Filter,
  TrendingUp,
  Clock,
  User,
  Tag,
  ExternalLink,
  Bot,
  Wrench,
  Package,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react'
import clsx from 'clsx'

// 模擬的市場插件數據（實際應該從 API 獲取）
const MARKETPLACE_PLUGINS = [
  {
    id: 'stock-analyst-pro',
    name: '股票分析師 Pro',
    description: '專業級股票分析工具，支援技術分析、基本面分析、AI 預測',
    version: '2.0.0',
    author: 'FinTech Labs',
    type: 'agent',
    downloads: 1250,
    rating: 4.8,
    ratingCount: 89,
    tags: ['finance', 'analysis', 'ai'],
    icon: '📈',
    featured: true,
    price: 'free'
  },
  {
    id: 'web-scraper',
    name: '網頁爬蟲工具',
    description: '強大的網頁數據提取工具，支援動態頁面、反爬蟲繞過',
    version: '1.5.0',
    author: 'DataPro',
    type: 'tool',
    downloads: 980,
    rating: 4.6,
    ratingCount: 67,
    tags: ['scraping', 'data', 'automation'],
    icon: '🕷️',
    featured: true,
    price: 'free'
  },
  {
    id: 'email-assistant',
    name: '郵件助手',
    description: '智能郵件撰寫、回覆、分類和摘要',
    version: '1.2.0',
    author: 'AI Tools Inc',
    type: 'agent',
    downloads: 756,
    rating: 4.5,
    ratingCount: 45,
    tags: ['email', 'productivity', 'ai'],
    icon: '📧',
    featured: false,
    price: 'free'
  },
  {
    id: 'code-reviewer',
    name: '代碼審查 Agent',
    description: '自動審查代碼品質、安全漏洞、最佳實踐',
    version: '1.0.0',
    author: 'DevOps Team',
    type: 'agent',
    downloads: 623,
    rating: 4.7,
    ratingCount: 38,
    tags: ['code', 'review', 'security'],
    icon: '🔍',
    featured: true,
    price: 'free'
  },
  {
    id: 'database-connector',
    name: '資料庫連接器',
    description: '連接 MySQL、PostgreSQL、MongoDB 等資料庫',
    version: '2.1.0',
    author: 'DB Tools',
    type: 'tool',
    downloads: 890,
    rating: 4.4,
    ratingCount: 52,
    tags: ['database', 'sql', 'nosql'],
    icon: '🗄️',
    featured: false,
    price: 'free'
  },
  {
    id: 'translation-agent',
    name: '多語言翻譯 Agent',
    description: '支援 100+ 語言的專業翻譯，保留格式和術語',
    version: '1.3.0',
    author: 'LangTech',
    type: 'agent',
    downloads: 1100,
    rating: 4.9,
    ratingCount: 78,
    tags: ['translation', 'language', 'ai'],
    icon: '🌐',
    featured: true,
    price: 'free'
  },
  {
    id: 'pdf-processor',
    name: 'PDF 處理工具',
    description: '合併、分割、壓縮、OCR 識別 PDF 文件',
    version: '1.1.0',
    author: 'Doc Tools',
    type: 'tool',
    downloads: 567,
    rating: 4.3,
    ratingCount: 29,
    tags: ['pdf', 'document', 'ocr'],
    icon: '📄',
    featured: false,
    price: 'free'
  },
  {
    id: 'slack-notifier',
    name: 'Slack 通知工具',
    description: '發送格式化訊息到 Slack 頻道',
    version: '1.0.0',
    author: 'Integration Team',
    type: 'tool',
    downloads: 445,
    rating: 4.2,
    ratingCount: 21,
    tags: ['slack', 'notification', 'integration'],
    icon: '💬',
    featured: false,
    price: 'free'
  }
]

const TYPE_ICONS = {
  agent: Bot,
  tool: Wrench,
  service: Package
}

const TYPE_LABELS = {
  agent: 'Agent',
  tool: '工具',
  service: '服務'
}

function PluginMarketplace({ apiBase, token, installedPlugins = [], onInstall }) {
  const [plugins, setPlugins] = useState(MARKETPLACE_PLUGINS)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('downloads')
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState(null)
  const [selectedPlugin, setSelectedPlugin] = useState(null)

  // 篩選和排序
  const filteredPlugins = plugins
    .filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesType = typeFilter === 'all' || p.type === typeFilter
      
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads
        case 'rating':
          return b.rating - a.rating
        case 'newest':
          return 0 // 實際應該按日期排序
        default:
          return 0
      }
    })

  const featuredPlugins = plugins.filter(p => p.featured)

  // 檢查是否已安裝
  const isInstalled = (pluginId) => {
    return installedPlugins.some(p => p.id === pluginId || p.id === pluginId.split('-')[0])
  }

  // 安裝插件
  const installPlugin = async (plugin) => {
    setInstalling(plugin.id)
    
    try {
      // 模擬安裝過程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 實際應該調用 API
      // const res = await fetch(`${apiBase}/marketplace/install/${plugin.id}`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // })
      
      if (onInstall) {
        onInstall(plugin)
      }
      
      alert(`✅ ${plugin.name} 安裝成功！`)
    } catch (err) {
      alert(`安裝失敗: ${err.message}`)
    } finally {
      setInstalling(null)
    }
  }

  // 渲染星星評分
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={clsx(
              'w-3 h-3',
              i <= Math.round(rating) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
    )
  }

  // 插件卡片
  const PluginCard = ({ plugin, featured = false }) => {
    const TypeIcon = TYPE_ICONS[plugin.type] || Package
    const installed = isInstalled(plugin.id)
    const isInstalling = installing === plugin.id

    return (
      <div 
        className={clsx(
          'p-4 bg-white dark:bg-gray-800 border rounded-xl transition-all hover:shadow-lg cursor-pointer',
          featured 
            ? 'border-primary-200 dark:border-primary-800' 
            : 'border-gray-200 dark:border-gray-700'
        )}
        onClick={() => setSelectedPlugin(plugin)}
      >
        <div className="flex items-start gap-3">
          {/* 圖標 */}
          <div className="text-3xl">{plugin.icon}</div>
          
          <div className="flex-1 min-w-0">
            {/* 標題行 */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{plugin.name}</h3>
              {featured && (
                <span className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded">
                  精選
                </span>
              )}
            </div>
            
            {/* 描述 */}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {plugin.description}
            </p>
            
            {/* 元信息 */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <TypeIcon className="w-3 h-3" />
                {TYPE_LABELS[plugin.type]}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {plugin.downloads}
              </span>
              <div className="flex items-center gap-1">
                {renderStars(plugin.rating)}
                <span>({plugin.ratingCount})</span>
              </div>
            </div>
          </div>
          
          {/* 安裝按鈕 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!installed && !isInstalling) {
                installPlugin(plugin)
              }
            }}
            disabled={installed || isInstalling}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              installed
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : isInstalling
                  ? 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
            )}
          >
            {installed ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                已安裝
              </span>
            ) : isInstalling ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                安裝中
              </span>
            ) : (
              '安裝'
            )}
          </button>
        </div>
        
        {/* 標籤 */}
        <div className="flex flex-wrap gap-1 mt-3">
          {plugin.tags.map(tag => (
            <span 
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* 標題欄 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold">插件市場</h1>
          <span className="text-sm text-gray-500">
            ({plugins.length} 個可用插件)
          </span>
        </div>
        
        <button
          onClick={() => setLoading(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
        >
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          <span>重新整理</span>
        </button>
      </div>

      {/* 搜尋和篩選 */}
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
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        >
          <option value="downloads">最多下載</option>
          <option value="rating">最高評分</option>
          <option value="newest">最新發布</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 精選插件 */}
        {!searchTerm && typeFilter === 'all' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              精選插件
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {featuredPlugins.slice(0, 4).map(plugin => (
                <PluginCard key={plugin.id} plugin={plugin} featured />
              ))}
            </div>
          </div>
        )}

        {/* 所有插件 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {searchTerm || typeFilter !== 'all' ? '搜尋結果' : '所有插件'}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredPlugins.length})
            </span>
          </h2>
          
          {filteredPlugins.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>沒有找到匹配的插件</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredPlugins.map(plugin => (
                <PluginCard key={plugin.id} plugin={plugin} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 插件詳情 Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{selectedPlugin.icon}</div>
                <div>
                  <h2 className="text-xl font-bold">{selectedPlugin.name}</h2>
                  <p className="text-sm text-gray-500">v{selectedPlugin.version} · {selectedPlugin.author}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPlugin(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedPlugin.description}
            </p>

            <div className="flex items-center gap-6 mb-4 text-sm">
              <div className="flex items-center gap-2">
                {renderStars(selectedPlugin.rating)}
                <span>{selectedPlugin.rating} ({selectedPlugin.ratingCount} 評價)</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {selectedPlugin.downloads} 次下載
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {selectedPlugin.tags.map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  installPlugin(selectedPlugin)
                  setSelectedPlugin(null)
                }}
                disabled={isInstalled(selectedPlugin.id) || installing === selectedPlugin.id}
                className={clsx(
                  'flex-1 py-2 rounded-lg font-medium',
                  isInstalled(selectedPlugin.id)
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                )}
              >
                {isInstalled(selectedPlugin.id) ? '已安裝' : '立即安裝'}
              </button>
              <button
                onClick={() => setSelectedPlugin(null)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PluginMarketplace
