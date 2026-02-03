import { useState, useEffect } from 'react';
import { 
  FileText, Filter, RefreshCw, Loader2, AlertCircle,
  CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';

const ACTION_LABELS = {
  login: '登入',
  logout: '登出',
  login_failed: '登入失敗',
  register: '註冊',
  upload_file: '上傳文件',
  delete_file: '刪除文件',
  chat_query: '對話查詢',
  search_query: '搜尋查詢',
  tool_execute: '工具執行',
  code_execute: '程式碼執行',
  web_search: '網路搜尋',
  git_operation: 'Git 操作',
  user_create: '創建用戶',
  user_update: '更新用戶',
  user_delete: '刪除用戶',
  system_reset: '系統重置',
  api_error: 'API 錯誤',
  rate_limit: '超出限制',
};

const LEVEL_COLORS = {
  info: 'text-blue-600 bg-blue-100',
  warning: 'text-yellow-600 bg-yellow-100',
  error: 'text-red-600 bg-red-100',
  critical: 'text-red-800 bg-red-200',
};

export default function AuditLogPanel({ apiBase = '/api', token }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    level: '',
    success: '',
    days: 7
  });
  const [showFilters, setShowFilters] = useState(false);

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.set('action', filters.action);
      if (filters.level) params.set('level', filters.level);
      if (filters.success !== '') params.set('success', filters.success);
      params.set('limit', '100');

      const res = await fetch(`${apiBase}/audit/logs?${params}`, { headers });
      if (!res.ok) throw new Error('載入失敗');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${apiBase}/audit/stats?days=${filters.days}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Load stats failed:', err);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold">審計日誌</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              showFilters ? 'bg-primary-50 border-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            篩選
          </button>
          <button
            onClick={() => { loadLogs(); loadStats(); }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_count}</div>
            <div className="text-sm text-gray-500">總記錄數</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-green-600">{stats.success_count}</div>
            <div className="text-sm text-gray-500">成功</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-red-600">{stats.error_count}</div>
            <div className="text-sm text-gray-500">錯誤</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-primary-600">${stats.total_cost?.toFixed(4) || 0}</div>
            <div className="text-sm text-gray-500">總成本</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">動作類型</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">全部</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">級別</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">全部</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">狀態</label>
            <select
              value={filters.success}
              onChange={(e) => setFilters({ ...filters, success: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">全部</option>
              <option value="true">成功</option>
              <option value="false">失敗</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Logs List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>無日誌記錄</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log, index) => (
              <div 
                key={log.id || index}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === index ? null : index)}
                >
                  <div className="flex items-center gap-4">
                    {log.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${LEVEL_COLORS[log.level] || 'bg-gray-100'}`}>
                          {log.level}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.username || 'anonymous'} • {formatTime(log.timestamp)}
                        {log.resource && ` • ${log.resource}`}
                      </div>
                    </div>
                  </div>
                  {expandedLog === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                {expandedLog === index && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-gray-500">用戶 ID:</span> {log.user_id || '-'}</div>
                        <div><span className="text-gray-500">IP:</span> {log.ip_address || '-'}</div>
                        <div><span className="text-gray-500">端點:</span> {log.endpoint || '-'}</div>
                        <div><span className="text-gray-500">方法:</span> {log.method || '-'}</div>
                        <div><span className="text-gray-500">Token 用量:</span> {log.tokens_used || 0}</div>
                        <div><span className="text-gray-500">成本:</span> ${log.api_cost?.toFixed(6) || 0}</div>
                      </div>
                      {log.error_message && (
                        <div className="mt-2 text-red-600">
                          <span className="text-gray-500">錯誤:</span> {log.error_message}
                        </div>
                      )}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2">
                          <span className="text-gray-500">詳情:</span>
                          <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
