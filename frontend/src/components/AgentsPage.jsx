import React, { useState, useEffect } from 'react';
import { 
  Bot, Users, Wrench, RefreshCw,
  Brain, FileText, Code, CheckCircle, Search, BarChart,
  ChevronRight, Terminal, PenTool, MessageSquare
} from 'lucide-react';

/**
 * AgentsPage - Multi-Agent 管理頁面
 * 
 * 僅顯示 Agents 和 Tools 列表
 * 對話功能已整合到 ChatInterface
 */
const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agents');

  const token = localStorage.getItem('token');

  // Agent 配置
  const agentConfig = {
    dispatcher: { icon: Users, color: '#ef4444', label: '總機', desc: '分析需求、拆解任務、分配給專業 Agent' },
    researcher: { icon: Search, color: '#3b82f6', label: '研究者', desc: '搜集資料、搜尋知識庫和網路' },
    writer: { icon: PenTool, color: '#22c55e', label: '寫作者', desc: '撰寫文章、報告、文檔' },
    coder: { icon: Terminal, color: '#a855f7', label: '編碼者', desc: '編寫程式碼、執行代碼' },
    analyst: { icon: BarChart, color: '#f97316', label: '分析師', desc: '數據分析、統計計算' },
    reviewer: { icon: CheckCircle, color: '#14b8a6', label: '審核者', desc: '審核內容品質、提供改進建議' }
  };

  // 工具分類配置
  const toolCategoryConfig = {
    knowledge: { icon: Brain, color: '#3b82f6', label: '知識庫' },
    web: { icon: Search, color: '#22c55e', label: '網路' },
    code: { icon: Code, color: '#a855f7', label: '程式' },
    file: { icon: FileText, color: '#f97316', label: '文件' },
    data: { icon: BarChart, color: '#14b8a6', label: '數據' },
    utility: { icon: Wrench, color: '#6b7280', label: '工具' }
  };

  // 載入 Agents
  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  // 載入 Tools
  const fetchTools = async () => {
    try {
      const res = await fetch('/api/agents/tools', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAgents(), fetchTools()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              Multi-Agent 系統
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              管理 AI Agents 和可用工具
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'agents'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              <Bot className="w-4 h-4" />
              Agents ({agents.length})
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'tools'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Tools ({tools.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 提示 */}
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-purple-500 mt-0.5" />
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                如何使用 Multi-Agent？
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                直接在「對話」頁面輸入問題即可！系統會自動判斷：
              </p>
              <ul className="text-sm text-purple-600 dark:text-purple-400 mt-2 space-y-1 list-disc list-inside">
                <li><strong>簡單問題</strong>（如「這篇講什麼」）→ 直接搜尋知識庫</li>
                <li><strong>複雜任務</strong>（如「研究 AI 趨勢並寫報告」）→ 多 Agent 協作</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div>
            {/* Agent 列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {agents.map((agent) => {
                const config = agentConfig[agent.type] || { icon: Bot, color: '#6b7280', label: agent.type, desc: '' };
                const Icon = config.icon;
                return (
                  <div
                    key={agent.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{config.label}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{config.desc}</p>
                        
                        {agent.available_tools && agent.available_tools.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-1">可用工具:</p>
                            <div className="flex flex-wrap gap-1">
                              {agent.available_tools.slice(0, 4).map(tool => (
                                <span key={tool} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                                  {tool}
                                </span>
                              ))}
                              {agent.available_tools.length > 4 && (
                                <span className="px-2 py-0.5 text-xs text-gray-400">
                                  +{agent.available_tools.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 協作流程圖 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">協作流程</h3>
              <div className="flex items-center justify-between flex-wrap gap-4">
                {[
                  { icon: MessageSquare, label: '用戶請求', color: '#6b7280' },
                  { icon: Users, label: '總機分析', color: '#ef4444' },
                  { icon: Bot, label: '專業 Agent', color: '#3b82f6' },
                  { icon: Wrench, label: '調用工具', color: '#a855f7' },
                  { icon: CheckCircle, label: '聚合結果', color: '#22c55e' }
                ].map((step, i, arr) => (
                  <React.Fragment key={i}>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                        <step.icon className="w-6 h-6" style={{ color: step.color }} />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{step.label}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-400 hidden md:block" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const config = toolCategoryConfig[tool.category] || toolCategoryConfig.utility;
              const Icon = config.icon;
              return (
                <div
                  key={tool.name}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono text-sm font-semibold text-gray-800 dark:text-white truncate">
                          {tool.name}
                        </h3>
                        <span 
                          className="px-2 py-0.5 rounded text-xs flex-shrink-0"
                          style={{ 
                            backgroundColor: `${config.color}20`,
                            color: config.color
                          }}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{tool.description}</p>
                      {tool.parameters && tool.parameters.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                          參數: {tool.parameters.map(p => (
                            <span key={p.name} className="font-mono">
                              {p.name}{p.required ? '*' : ''}
                            </span>
                          )).reduce((prev, curr, i) => i === 0 ? [curr] : [...prev, ', ', curr], [])}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsPage;
