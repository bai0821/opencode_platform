import React, { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  FileText, 
  Settings, 
  Database,
  Sun,
  Moon,
  Menu,
  X,
  Microscope,
  Users,
  DollarSign,
  FileText as AuditIcon,
  LogOut,
  Plug,
  Layers,
  Bot,
  Puzzle,
  Terminal,
  Store,
  GitBranch
} from 'lucide-react'
import ChatInterface from './components/ChatInterface'
import DocumentList from './components/DocumentList'
import AdminPanel from './components/AdminPanel'
import DeepResearchPanel from './components/DeepResearchPanel'
import LoginPage from './components/LoginPage'
import UserManagement from './components/UserManagement'
import CostDashboard from './components/CostDashboard'
import AuditLogPanel from './components/AuditLogPanel'
import MCPPage from './components/MCPPage'
import CollectionsPage from './components/CollectionsPage'
import AgentsPage from './components/AgentsPage'
import PluginManager from './components/PluginManager'
import CodePlayground from './components/CodePlayground'
import PluginMarketplace from './components/PluginMarketplace'
import WorkflowEditor from './components/WorkflowEditor'
import clsx from 'clsx'

const API_BASE = '/api'

// 根據用戶角色決定可見的導航項目
const getNavItems = (role) => {
  const items = [
    { id: 'chat', label: '對話', icon: MessageSquare },
    { id: 'documents', label: '文件', icon: FileText },
    { id: 'research', label: '研究', icon: Microscope },
  ]
  
  // 只有 admin 才能看到管理功能
  if (role === 'admin') {
    items.push(
      { id: 'agents', label: 'Agents', icon: Bot },
      { id: 'workflows', label: '工作流', icon: GitBranch },
      { id: 'sandbox', label: '沙箱', icon: Terminal },
      { id: 'admin', label: '系統', icon: Database },
      { id: 'collections', label: '知識庫', icon: Layers },
      { id: 'mcp', label: 'MCP', icon: Plug },
      { id: 'plugins', label: '插件', icon: Puzzle },
      { id: 'marketplace', label: '市場', icon: Store },
      { id: 'users', label: '用戶', icon: Users },
      { id: 'cost', label: '成本', icon: DollarSign },
      { id: 'audit', label: '日誌', icon: AuditIcon },
    )
  }
  
  return items
}

function App() {
  // 認證狀態
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  
  // UI 狀態
  const [activeTab, setActiveTab] = useState('chat')
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [documents, setDocuments] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [stats, setStats] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // 檢查本地存儲的認證
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      // 驗證 token 是否有效
      verifyToken(savedToken).then(isValid => {
        if (isValid) {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
        } else {
          // Token 無效或過期，清除並要求重新登入
          console.log('Token expired or invalid, clearing...')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
        setIsAuthChecking(false)
      })
    } else {
      setIsAuthChecking(false)
    }
  }, [])

  // 驗證 token 是否有效
  const verifyToken = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return res.ok
    } catch {
      return false
    }
  }

  // 全局 API 請求函數（帶自動登出）
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : ''
    }
    
    const res = await fetch(url, { ...options, headers })
    
    // 如果收到 401，自動登出
    if (res.status === 401) {
      console.log('Received 401, logging out...')
      handleLogout()
    }
    
    return res
  }

  // 載入深色模式設定
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // 切換深色模式
  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    document.documentElement.classList.toggle('dark', newMode)
  }

  // 處理登入
  const handleLogin = (userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
  }

  // 處理登出
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    setActiveTab('chat')
  }

  // 檢查連線狀態
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`)
        if (res.ok) {
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      } catch {
        setIsConnected(false)
      }
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  // 載入文件列表
  const loadDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('載入文件失敗:', error)
    }
  }

  // 載入統計資訊
  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('載入統計失敗:', error)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadDocuments()
      loadStats()
    }
  }, [isConnected])

  // 認證檢查中
  if (isAuthChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // 未登入
  if (!user) {
    return <LoginPage onLogin={handleLogin} apiBase={API_BASE} />
  }

  const navItems = getNavItems(user.role)

  // 渲染當前頁面內容
  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <ChatInterface 
            documents={documents}
            selectedDocs={selectedDocs}
            onSelectDocs={setSelectedDocs}
            apiBase={API_BASE}
          />
        )
      case 'documents':
        return (
          <DocumentList 
            documents={documents}
            selectedDocs={selectedDocs}
            onSelectDocs={setSelectedDocs}
            onRefresh={loadDocuments}
            apiBase={API_BASE}
          />
        )
      case 'research':
        return (
          <DeepResearchPanel apiBase={API_BASE} />
        )
      case 'admin':
        return (
          <AdminPanel 
            stats={stats}
            onRefresh={loadStats}
            apiBase={API_BASE}
          />
        )
      case 'users':
        return (
          <UserManagement apiBase={API_BASE} token={token} />
        )
      case 'cost':
        return (
          <CostDashboard apiBase={API_BASE} token={token} />
        )
      case 'audit':
        return (
          <AuditLogPanel apiBase={API_BASE} token={token} />
        )
      case 'mcp':
        return (
          <MCPPage />
        )
      case 'agents':
        return (
          <AgentsPage />
        )
      case 'collections':
        return (
          <CollectionsPage />
        )
      case 'plugins':
        return (
          <PluginManager apiBase={API_BASE} token={token} />
        )
      case 'sandbox':
        return (
          <CodePlayground apiBase={API_BASE} token={token} />
        )
      case 'marketplace':
        return (
          <PluginMarketplace apiBase={API_BASE} token={token} />
        )
      case 'workflows':
        return (
          <WorkflowEditor apiBase={API_BASE} token={token} />
        )
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 側邊欄 */}
      <aside 
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OC</span>
            </div>
            <span className="font-semibold text-lg">OpenCode</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 導航 */}
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx('sidebar-item w-full', activeTab === item.id && 'active')}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* 用戶資訊 & 登出 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-medium text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
              title="登出"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          
          {/* 連線狀態 */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span>{isConnected ? '已連線' : '離線'}</span>
          </div>
        </div>
      </aside>

      {/* 側邊欄遮罩 (手機) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主內容區 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 頂部欄 */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 選中文件數量 */}
            {selectedDocs.length > 0 && (
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full">
                {selectedDocs.length} 文件已選
              </span>
            )}
            
            {/* 深色模式切換 */}
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={darkMode ? '切換淺色模式' : '切換深色模式'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {/* 設定 */}
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="設定"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 頁面內容 */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default App
