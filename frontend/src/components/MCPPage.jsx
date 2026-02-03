import React, { useState, useEffect } from 'react';
import { 
  Plus, Plug, Trash2, RefreshCw, Check, X, 
  Settings, Play, Pause, Zap, Terminal, Globe 
} from 'lucide-react';

const MCPPage = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingId, setTestingId] = useState(null);
  
  const [newConnection, setNewConnection] = useState({
    name: '',
    description: '',
    transport: 'http',
    endpoint: '',
    command: '',
    args: '',
    env: ''
  });

  const token = localStorage.getItem('token');

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/mcp', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Failed to fetch MCP connections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAddConnection = async () => {
    try {
      const body = {
        name: newConnection.name,
        description: newConnection.description,
        transport: newConnection.transport,
        endpoint: newConnection.endpoint,
        command: newConnection.command,
        args: newConnection.args ? newConnection.args.split('\n').filter(a => a.trim()) : [],
        env: newConnection.env ? Object.fromEntries(
          newConnection.env.split('\n')
            .filter(line => line.includes('='))
            .map(line => line.split('=').map(s => s.trim()))
        ) : {}
      };

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewConnection({
          name: '', description: '', transport: 'http',
          endpoint: '', command: '', args: '', env: ''
        });
        fetchConnections();
      }
    } catch (error) {
      console.error('Failed to add connection:', error);
    }
  };

  const handleTestConnection = async (connId) => {
    setTestingId(connId);
    try {
      const res = await fetch(`/api/mcp/${connId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      alert(result.success ? `連接成功！發現 ${result.tools_count} 個工具` : `連接失敗：${result.error}`);
      fetchConnections();
    } catch (error) {
      alert('測試失敗：' + error.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleConnection = async (connId, enabled) => {
    try {
      await fetch(`/api/mcp/${connId}/${enabled ? 'disable' : 'enable'}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchConnections();
    } catch (error) {
      console.error('Failed to toggle connection:', error);
    }
  };

  const handleDeleteConnection = async (connId) => {
    if (!confirm('確定要刪除這個 MCP 連接嗎？')) return;
    
    try {
      await fetch(`/api/mcp/${connId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchConnections();
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-gray-400';
      case 'error': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getTransportIcon = (transport) => {
    switch (transport) {
      case 'http': return <Globe className="w-4 h-4" />;
      case 'stdio': return <Terminal className="w-4 h-4" />;
      default: return <Plug className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">MCP 連接管理</h1>
          <p className="text-gray-500 mt-1">管理外部 MCP 服務連接，擴展 AI 能力</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          添加連接
        </button>
      </div>

      {/* 連接列表 */}
      <div className="space-y-4">
        {connections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Plug className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">尚未添加任何 MCP 連接</p>
            <p className="text-sm text-gray-400 mt-2">
              點擊「添加連接」來連接外部 MCP 服務
            </p>
          </div>
        ) : (
          connections.map((conn) => (
            <div
              key={conn.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${conn.enabled ? 'bg-purple-100 dark:bg-purple-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    {getTransportIcon(conn.transport)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {conn.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        conn.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {conn.enabled ? '已啟用' : '已禁用'}
                      </span>
                      <span className={`text-xs ${getStatusColor(conn.status)}`}>
                        ● {conn.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{conn.description || '無描述'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>類型: {conn.transport.toUpperCase()}</span>
                      {conn.endpoint && <span>端點: {conn.endpoint}</span>}
                      {conn.tools?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {conn.tools.length} 個工具
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(conn.id)}
                    disabled={testingId === conn.id}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="測試連接"
                  >
                    {testingId === conn.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleConnection(conn.id, conn.enabled)}
                    className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                    title={conn.enabled ? '禁用' : '啟用'}
                  >
                    {conn.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteConnection(conn.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="刪除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 工具列表 */}
              {conn.tools?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 mb-2">可用工具:</p>
                  <div className="flex flex-wrap gap-2">
                    {conn.tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                        title={tool.description}
                      >
                        {tool.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 添加連接 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">添加 MCP 連接</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名稱 *</label>
                <input
                  type="text"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({...newConnection, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="例如: my-mcp-server"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <input
                  type="text"
                  value={newConnection.description}
                  onChange={(e) => setNewConnection({...newConnection, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="連接描述"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">傳輸類型</label>
                <select
                  value={newConnection.transport}
                  onChange={(e) => setNewConnection({...newConnection, transport: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="http">HTTP</option>
                  <option value="stdio">STDIO (本地命令)</option>
                </select>
              </div>
              
              {newConnection.transport === 'http' && (
                <div>
                  <label className="block text-sm font-medium mb-1">端點 URL *</label>
                  <input
                    type="text"
                    value={newConnection.endpoint}
                    onChange={(e) => setNewConnection({...newConnection, endpoint: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="http://localhost:3000"
                  />
                </div>
              )}
              
              {newConnection.transport === 'stdio' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">命令 *</label>
                    <input
                      type="text"
                      value={newConnection.command}
                      onChange={(e) => setNewConnection({...newConnection, command: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="npx 或 python"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">參數（每行一個）</label>
                    <textarea
                      value={newConnection.args}
                      onChange={(e) => setNewConnection({...newConnection, args: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      rows={3}
                      placeholder="-y&#10;@anthropics/mcp-server-example"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">環境變數（KEY=VALUE，每行一個）</label>
                    <textarea
                      value={newConnection.env}
                      onChange={(e) => setNewConnection({...newConnection, env: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      rows={2}
                      placeholder="API_KEY=xxx"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleAddConnection}
                disabled={!newConnection.name || (newConnection.transport === 'http' ? !newConnection.endpoint : !newConnection.command)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPPage;
