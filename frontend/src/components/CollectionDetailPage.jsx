import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Database, FileText, Layers, RefreshCw, 
  ChevronRight, Search, Eye, Copy, Check
} from 'lucide-react';

const CollectionDetailPage = ({ collectionId, onBack }) => {
  const [collection, setCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents'); // documents, chunks
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem('token');

  // 載入 Collection 詳情
  const fetchCollection = async () => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCollection(data);
    } catch (error) {
      console.error('Failed to fetch collection:', error);
    }
  };

  // 載入文檔列表
  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/collections/${collectionId}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  // 載入 Chunks
  const fetchChunks = async (fileName = null) => {
    try {
      let url = `/api/collections/${collectionId}/chunks?limit=50`;
      if (fileName) url += `&file_name=${encodeURIComponent(fileName)}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setChunks(data.chunks || []);
    } catch (error) {
      console.error('Failed to fetch chunks:', error);
    }
  };

  // 載入單個 Chunk 詳情
  const fetchChunkDetail = async (pointId) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}/chunks/${pointId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedChunk(data);
    } catch (error) {
      console.error('Failed to fetch chunk detail:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCollection();
      await fetchDocuments();
      await fetchChunks();
      setLoading(false);
    };
    loadData();
  }, [collectionId]);

  // 選擇文檔時載入該文檔的 chunks
  const handleSelectDocument = (doc) => {
    setSelectedDoc(doc);
    fetchChunks(doc.file_name);
    setActiveTab('chunks');
  };

  // 複製文字
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 過濾 chunks
  const filteredChunks = chunks.filter(chunk => 
    !searchQuery || 
    chunk.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chunk.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {collection?.display_name || '知識庫詳情'}
          </h1>
          <p className="text-sm text-gray-500">
            Collection: {collection?.name} • 
            維度: {collection?.vector_size} • 
            模型: {collection?.embedding_model}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">文檔數量</p>
              <p className="text-xl font-bold">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Layers className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">總 Chunks</p>
              <p className="text-xl font-bold">
                {documents.reduce((sum, d) => sum + d.chunk_count, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Embedding</p>
              <p className="text-lg font-bold">{collection?.embedding_provider}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${collection?.is_default ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <Database className={`w-5 h-5 ${collection?.is_default ? 'text-yellow-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">狀態</p>
              <p className="text-lg font-bold">{collection?.is_default ? '預設' : '一般'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => { setActiveTab('documents'); setSelectedDoc(null); fetchChunks(); }}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'documents' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          文檔列表
        </button>
        <button
          onClick={() => setActiveTab('chunks')}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'chunks' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Chunks 查看 {selectedDoc && `(${selectedDoc.file_name})`}
        </button>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-2">
          {documents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">此知識庫尚無文檔</p>
            </div>
          ) : (
            documents.map((doc, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectDocument(doc)}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 
                         hover:border-purple-500 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-500" />
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">
                        {doc.file_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {doc.chunk_count} chunks • {doc.page_count} 頁
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chunks Tab */}
      {activeTab === 'chunks' && (
        <div className="flex gap-4">
          {/* Chunks List */}
          <div className="flex-1">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋 chunks..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Chunks */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredChunks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Layers className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">無 chunks</p>
                </div>
              ) : (
                filteredChunks.map((chunk, idx) => (
                  <div
                    key={chunk.id}
                    onClick={() => fetchChunkDetail(chunk.id)}
                    className={`bg-white dark:bg-gray-800 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedChunk?.id === chunk.id 
                        ? 'border-purple-500 ring-2 ring-purple-200' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-gray-400">
                        #{idx + 1} • ID: {chunk.id.substring(0, 8)}...
                      </span>
                      <span className="text-xs text-gray-400">
                        {chunk.full_text_length} 字元
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {chunk.text}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{chunk.file_name}</span>
                      {chunk.page_label && <span>• 第 {chunk.page_label} 頁</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chunk Detail Panel */}
          {selectedChunk && (
            <div className="w-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Chunk 詳情</h3>
                <button
                  onClick={() => handleCopy(selectedChunk.text)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="複製內容"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-500">ID</label>
                  <p className="font-mono text-xs break-all">{selectedChunk.id}</p>
                </div>
                <div>
                  <label className="text-gray-500">文檔</label>
                  <p>{selectedChunk.file_name}</p>
                </div>
                <div>
                  <label className="text-gray-500">頁碼</label>
                  <p>{selectedChunk.page_label || selectedChunk.page_number || '-'}</p>
                </div>
                <div>
                  <label className="text-gray-500">Chunk 索引</label>
                  <p>{selectedChunk.chunk_index ?? '-'}</p>
                </div>
                <div>
                  <label className="text-gray-500">向量維度</label>
                  <p>{selectedChunk.vector_dimension}</p>
                </div>
                <div>
                  <label className="text-gray-500">向量預覽</label>
                  <p className="font-mono text-xs text-gray-400 break-all">
                    [{selectedChunk.vector_preview?.map(v => v.toFixed(4)).join(', ')}...]
                  </p>
                </div>
                <div>
                  <label className="text-gray-500">完整內容</label>
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded max-h-64 overflow-y-auto">
                    <p className="text-xs whitespace-pre-wrap">{selectedChunk.text}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionDetailPage;
