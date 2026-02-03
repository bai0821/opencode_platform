import { useState, useEffect } from 'react';
import { 
  Users, Shield, Trash2, Edit, Plus, X, Save, 
  AlertCircle, CheckCircle, Loader2, RefreshCw 
} from 'lucide-react';

const ROLES = [
  { value: 'admin', label: '管理員', color: 'text-red-600 bg-red-100' },
  { value: 'editor', label: '編輯者', color: 'text-blue-600 bg-blue-100' },
  { value: 'viewer', label: '檢視者', color: 'text-green-600 bg-green-100' },
  { value: 'guest', label: '訪客', color: 'text-gray-600 bg-gray-100' },
];

const STATUSES = [
  { value: 'active', label: '啟用', color: 'text-green-600 bg-green-100' },
  { value: 'inactive', label: '停用', color: 'text-gray-600 bg-gray-100' },
  { value: 'suspended', label: '封禁', color: 'text-red-600 bg-red-100' },
];

export default function UserManagementPanel({ apiBase = '/api', token }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '', role: 'viewer' });

  // 動態獲取 token（支援 props 和 localStorage）
  const getToken = () => token || localStorage.getItem('token');

  const loadUsers = async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setError('未登入或 Token 不存在');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    };
    
    try {
      const res = await fetch(`${apiBase}/auth/users`, { headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${res.status}: 載入用戶列表失敗`);
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('載入用戶失敗:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 延遲一點確保 token 已設置
    const timer = setTimeout(() => {
      loadUsers();
    }, 100);
    return () => clearTimeout(timer);
  }, [token]);

  const createUser = async () => {
    const currentToken = getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    };
    
    try {
      const res = await fetch(`${apiBase}/auth/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newUser)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || '創建失敗');
      }
      setShowCreateModal(false);
      setNewUser({ username: '', password: '', email: '', role: 'viewer' });
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateUser = async (userId, updates) => {
    const currentToken = getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    };
    
    try {
      const res = await fetch(`${apiBase}/auth/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('更新失敗');
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteUser = async (userId, username) => {
    if (!confirm(`確定要刪除用戶 "${username}" 嗎？`)) return;
    
    const currentToken = getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    };
    
    try {
      const res = await fetch(`${apiBase}/auth/users/${userId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || '刪除失敗');
      }
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleBadge = (role) => {
    const r = ROLES.find(r => r.value === role);
    return r ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.color}`}>
        {r.label}
      </span>
    ) : role;
  };

  const getStatusBadge = (status) => {
    const s = STATUSES.find(s => s.value === status);
    return s ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
        {s.label}
      </span>
    ) : status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold">用戶管理</h2>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            {users.length} 位用戶
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="刷新"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
            新增用戶
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">用戶名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">角色</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">狀態</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">配額</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">最後登入</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                  <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {user.email || '-'}
                </td>
                <td className="px-4 py-3">
                  {editingUser?.id === user.id ? (
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  ) : (
                    getRoleBadge(user.role)
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingUser?.id === user.id ? (
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  ) : (
                    getStatusBadge(user.status)
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <div>查詢: {user.queries_today}/{user.daily_query_limit}</div>
                  <div>上傳: {user.uploads_today}/{user.daily_upload_limit}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {user.last_login 
                    ? new Date(user.last_login).toLocaleString('zh-TW')
                    : '從未登入'}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingUser?.id === user.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => updateUser(user.id, { role: editingUser.role, status: editingUser.status })}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                        title="保存"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="取消"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser({ id: user.id, role: user.role, status: user.status })}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        title="編輯"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id, user.username)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">新增用戶</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">用戶名 *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="輸入用戶名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">密碼 *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="輸入密碼"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="選填"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">角色</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={createUser}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                創建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
