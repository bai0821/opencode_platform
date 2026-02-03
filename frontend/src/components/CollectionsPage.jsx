import React, { useState, useEffect } from 'react';
import { 
  Plus, Database, Trash2, RefreshCw, Check, Star,
  Settings, FileText, HardDrive, Layers, ChevronRight,
  Image, FileType, Braces, Info
} from 'lucide-react';
import CollectionDetailPage from './CollectionDetailPage';

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [defaultId, setDefaultId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  
  const [newCollection, setNewCollection] = useState({
    name: '',
    display_name: '',
    description: '',
    embedding_provider: 'cohere',
    embedding_model: '',
    // 進階配置
    chunk_size: 500,
    chunk_overlap: 50,
    supported_types: ['pdf', 'txt', 'md', 'docx'],
  });

  const token = localStorage.getItem('token');

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCollections(data.collections || []);
      setDefaultId(data.default_id);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleAddCollection = async () => {
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCollection.name,
          display_name: newCollection.display_name,
          description: newCollection.description,
          embedding_provider: newCollection.embedding_provider,
          embedding_model: newCollection.embedding_model || null
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewCollection({
          name: '', display_name: '', description: '', 
          embedding_provider: 'cohere', embedding_model: '',
          chunk_size: 500, chunk_overlap: 50,
          supported_types: ['pdf', 'txt', 'md', 'docx']
        });
        fetchCollections();
      } else {
        const err = await res.json();
        alert('創建失敗：' + err.detail);
      }
    } catch (error) {
      console.error('Failed to add collection:', error);
    }
  };

  const handleSetDefault = async (collId) => {
    try {
      await fetch(`/api/collections/${collId}/set-default`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCollections();
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const handleDeleteCollection = async (collId) => {
    if (!confirm('確定要刪除這個知識庫嗎？這將同時刪除所有相關的向量數據！')) return;
    
    try {
      const res = await fetch(`/api/collections/${collId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchCollections();
      } else {
        const err = await res.json();
        alert('刪除失敗：' + err.detail);
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getProviderBadge = (provider) => {
    const colors = {
      cohere: 'bg-blue-100 text-blue-700',
      openai: 'bg-green-100 text-green-700'
    };
    return colors[provider] || 'bg-gray-100 text-gray-700';
  };

  // 如果選中了某個 Collection，顯示詳情頁
  if (selectedCollection) {
    return (
      <CollectionDetailPage 
        collectionId={selectedCollection} 
        onBack={() => setSelectedCollection(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Embedding 模型選項
  const embeddingModels = {
    cohere: [
      { value: '', label: '預設 (embed-multilingual-v3.0)' },
      { value: 'embed-multilingual-v3.0', label: 'embed-multilingual-v3.0 (多語言, 1024維)' },
      { value: 'embed-english-v3.0', label: 'embed-english-v3.0 (英文, 1024維)' },
      { value: 'embed-multilingual-light-v3.0', label: 'embed-multilingual-light-v3.0 (輕量, 384維)' },
    ],
    openai: [
      { value: '', label: '預設 (text-embedding-3-small)' },
      { value: 'text-embedding-3-small', label: 'text-embedding-3-small (1536維, 便宜)' },
      { value: 'text-embedding-3-large', label: 'text-embedding-3-large (3072維, 效果最好)' },
      { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002 (1536維, 舊版)' },
    ]
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">知識庫管理</h1>
          <p className="text-gray-500 mt-1">管理不同類型的向量資料庫，分類存放文件</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          創建知識庫
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">知識庫數量</p>
              <p className="text-xl font-bold">{collections.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Layers className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">總向量數</p>
              <p className="text-xl font-bold">
                {collections.reduce((sum, c) => sum + (c.points_count || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cohere 知識庫</p>
              <p className="text-xl font-bold">
                {collections.filter(c => c.embedding_provider === 'cohere').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <HardDrive className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">OpenAI 知識庫</p>
              <p className="text-xl font-bold">
                {collections.filter(c => c.embedding_provider === 'openai').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 知識庫列表 */}
      <div className="space-y-4">
        {collections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">尚未創建任何知識庫</p>
            <p className="text-sm text-gray-400 mt-2">
              點擊「創建知識庫」來建立第一個向量資料庫
            </p>
          </div>
        ) : (
          collections.map((coll) => (
            <div
              key={coll.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                coll.is_default 
                  ? 'border-purple-500 ring-2 ring-purple-200' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
              onClick={() => setSelectedCollection(coll.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Database className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {coll.display_name}
                      </h3>
                      {coll.is_default && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          <Star className="w-3 h-3" />
                          預設
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getProviderBadge(coll.embedding_provider)}`}>
                        {coll.embedding_provider}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(coll.status)}`} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{coll.description || '無描述'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Collection: {coll.name}</span>
                      <span>維度: {coll.vector_size}</span>
                      <span>向量數: {(coll.points_count || 0).toLocaleString()}</span>
                      <span>模型: {coll.embedding_model}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {!coll.is_default && (
                    <button
                      onClick={() => handleSetDefault(coll.id)}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      title="設為預設"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  {!coll.is_default && (
                    <button
                      onClick={() => handleDeleteCollection(coll.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="刪除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 創建知識庫 Modal - 增強版 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">創建知識庫</h2>
            
            <div className="space-y-4">
              {/* 基本資訊 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  基本資訊
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">顯示名稱 *</label>
                    <input
                      type="text"
                      value={newCollection.display_name}
                      onChange={(e) => setNewCollection({...newCollection, display_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                      placeholder="例如: 技術文檔"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Collection 名稱 * (英文)</label>
                    <input
                      type="text"
                      value={newCollection.name}
                      onChange={(e) => setNewCollection({
                        ...newCollection, 
                        name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                      })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                      placeholder="例如: tech_docs"
                    />
                    <p className="text-xs text-gray-400 mt-1">只能使用小寫字母、數字和底線</p>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">描述</label>
                  <textarea
                    value={newCollection.description}
                    onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                    rows={2}
                    placeholder="這個知識庫用於存放..."
                  />
                </div>
              </div>

              {/* Embedding 配置 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Braces className="w-4 h-4" />
                  Embedding 配置
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Embedding 提供者</label>
                    <select
                      value={newCollection.embedding_provider}
                      onChange={(e) => setNewCollection({
                        ...newCollection, 
                        embedding_provider: e.target.value,
                        embedding_model: '' // 重置模型選擇
                      })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                    >
                      <option value="cohere">Cohere (多語言, 推薦)</option>
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Embedding 模型</label>
                    <select
                      value={newCollection.embedding_model}
                      onChange={(e) => setNewCollection({...newCollection, embedding_model: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                    >
                      {embeddingModels[newCollection.embedding_provider]?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-sm">
                  <p className="text-blue-700 dark:text-blue-300">
                    💡 <strong>Cohere</strong> 支援多語言（中、英、日等），適合大部分場景。
                    <strong>OpenAI</strong> 效果更好但成本較高。
                  </p>
                </div>
              </div>

              {/* 支援的文件類型 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FileType className="w-4 h-4" />
                  支援的文件類型
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { type: 'pdf', label: 'PDF', icon: FileText },
                    { type: 'txt', label: 'TXT', icon: FileText },
                    { type: 'md', label: 'Markdown', icon: FileText },
                    { type: 'docx', label: 'Word', icon: FileText },
                    { type: 'csv', label: 'CSV', icon: FileText },
                    { type: 'json', label: 'JSON', icon: Braces },
                    { type: 'image', label: '圖片 (實驗性)', icon: Image },
                  ].map(item => (
                    <label 
                      key={item.type}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        newCollection.supported_types.includes(item.type)
                          ? 'bg-purple-100 border-purple-500 text-purple-700'
                          : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newCollection.supported_types.includes(item.type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCollection({
                              ...newCollection,
                              supported_types: [...newCollection.supported_types, item.type]
                            });
                          } else {
                            setNewCollection({
                              ...newCollection,
                              supported_types: newCollection.supported_types.filter(t => t !== item.type)
                            });
                          }
                        }}
                        className="hidden"
                      />
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  * 圖片支援需要多模態模型（如 GPT-4V），僅供實驗
                </p>
              </div>

              {/* 分塊配置 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  分塊配置
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Chunk 大小</label>
                    <input
                      type="number"
                      value={newCollection.chunk_size}
                      onChange={(e) => setNewCollection({...newCollection, chunk_size: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                      min={100}
                      max={2000}
                    />
                    <p className="text-xs text-gray-400 mt-1">每個 chunk 的字元數 (100-2000)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Chunk 重疊</label>
                    <input
                      type="number"
                      value={newCollection.chunk_overlap}
                      onChange={(e) => setNewCollection({...newCollection, chunk_overlap: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                      min={0}
                      max={500}
                    />
                    <p className="text-xs text-gray-400 mt-1">相鄰 chunks 的重疊字元數</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleAddCollection}
                disabled={!newCollection.name || !newCollection.display_name}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                創建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
