import { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Activity, AlertTriangle,
  Calendar, RefreshCw, Loader2
} from 'lucide-react';

export default function CostDashboard({ apiBase = '/api', token }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/cost/dashboard`, { headers });
      if (!res.ok) throw new Error('載入失敗');
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold">成本追蹤</h2>
        </div>
        <button
          onClick={loadData}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Cost */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">今日成本</span>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${data?.today?.cost?.toFixed(4) || '0.0000'}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>預算使用</span>
              <span>{data?.today?.budget_used_percent || 0}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(data?.today?.budget_used_percent || 0)}`}
                style={{ width: `${Math.min(data?.today?.budget_used_percent || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Today Calls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">今日請求</span>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data?.today?.calls || 0}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            預算: ${data?.today?.budget || 10}
          </div>
        </div>

        {/* Month Cost */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">本月成本</span>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${data?.month?.cost?.toFixed(4) || '0.0000'}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>預算使用</span>
              <span>{data?.month?.budget_used_percent || 0}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(data?.month?.budget_used_percent || 0)}`}
                style={{ width: `${Math.min(data?.month?.budget_used_percent || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Month Calls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">本月請求</span>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data?.month?.calls || 0}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            預算: ${data?.month?.budget || 100}
          </div>
        </div>
      </div>

      {/* Trend Chart (Simple) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
        <h3 className="text-lg font-medium mb-4">最近 7 天趨勢</h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {data?.trend?.map((day, i) => {
            const maxCost = Math.max(...(data.trend?.map(d => d.cost) || [1]), 0.001);
            const height = (day.cost / maxCost) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '160px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-primary-500 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(day.date).toLocaleDateString('zh-TW', { weekday: 'short' })}
                </div>
                <div className="text-xs font-medium">
                  ${day.cost.toFixed(3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Model & Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Model */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <h3 className="text-lg font-medium mb-4">按模型分佈</h3>
          <div className="space-y-3">
            {Object.entries(data?.by_model || {}).map(([model, stats]) => (
              <div key={model} className="flex items-center justify-between">
                <span className="text-sm font-mono">{model}</span>
                <div className="text-right">
                  <div className="font-medium">${stats.cost?.toFixed(4)}</div>
                  <div className="text-xs text-gray-500">{stats.calls} 次</div>
                </div>
              </div>
            ))}
            {Object.keys(data?.by_model || {}).length === 0 && (
              <p className="text-gray-500 text-center py-4">今日無數據</p>
            )}
          </div>
        </div>

        {/* By Action */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <h3 className="text-lg font-medium mb-4">按操作分佈</h3>
          <div className="space-y-3">
            {Object.entries(data?.by_action || {}).map(([action, stats]) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-sm">{action}</span>
                <div className="text-right">
                  <div className="font-medium">${stats.cost?.toFixed(4)}</div>
                  <div className="text-xs text-gray-500">{stats.calls} 次</div>
                </div>
              </div>
            ))}
            {Object.keys(data?.by_action || {}).length === 0 && (
              <p className="text-gray-500 text-center py-4">今日無數據</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
