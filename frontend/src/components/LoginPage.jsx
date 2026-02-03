import { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage({ onLogin, apiBase = '/api' }) {
  const [mode, setMode] = useState('login'); // login or register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { username, password }
        : { username, password, email: email || null };

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || '操作失敗');
      }

      if (mode === 'login') {
        // 登入成功，保存 token
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user, data.access_token);
      } else {
        // 註冊成功，切換到登入
        setMode('login');
        setError(null);
        alert('註冊成功！請登入');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">OC</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">OpenCode</span>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">AI 驅動的知識管理平台</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex-1 pb-3 text-center font-medium transition-colors ${
                mode === 'login'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setMode('login')}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              登入
            </button>
            <button
              className={`flex-1 pb-3 text-center font-medium transition-colors ${
                mode === 'register'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setMode('register')}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              註冊
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用戶名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="輸入用戶名"
                required
                minLength={3}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email（可選）
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="輸入密碼"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  處理中...
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-5 h-5" />
                  登入
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  註冊
                </>
              )}
            </button>
          </form>

          {/* Default credentials hint */}
          {mode === 'login' && (
            <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-1">預設管理員帳號：</p>
              <p>用戶名: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">admin</code></p>
              <p>密碼: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">admin123</code></p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          OpenCode Platform © 2025
        </p>
      </div>
    </div>
  );
}
