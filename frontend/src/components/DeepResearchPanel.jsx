import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Search, 
  Globe, 
  Brain, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Zap,
  Monitor,
  Clock,
  Download,
  X,
  Maximize2,
  Minimize2,
  History,
  FolderOpen,
  File,
  Trash2,
  RefreshCw,
  AlertTriangle,
  BookOpen
} from 'lucide-react';

/**
 * 深度研究組件 v2
 * 
 * 功能：
 * 1. 網路搜尋 + 文件整合
 * 2. 文件選擇（RAG 整合）
 * 3. 歷史紀錄
 * 4. Wikipedia 風格引用
 */
export default function DeepResearchPanel({ apiBase = '/api' }) {
  // 基本狀態
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState('standard');
  const [isResearching, setIsResearching] = useState(false);
  const [steps, setSteps] = useState([]);
  const [report, setReport] = useState(null);
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [playwrightAvailable, setPlaywrightAvailable] = useState(null);
  
  // 截圖視窗
  const [currentScreenshot, setCurrentScreenshot] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showScreenshotPopup, setShowScreenshotPopup] = useState(true);
  const [isPopupMinimized, setIsPopupMinimized] = useState(false);
  
  // 文件選擇
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [showDocSelector, setShowDocSelector] = useState(false);
  
  // 歷史紀錄
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  
  // 相關性警告
  const [relevanceWarning, setRelevanceWarning] = useState(null);
  
  const abortControllerRef = useRef(null);
  const stepsContainerRef = useRef(null);

  // 載入文件列表
  useEffect(() => {
    loadDocuments();
    loadHistory();
  }, []);

  // 自動滾動到最新步驟
  useEffect(() => {
    if (stepsContainerRef.current) {
      stepsContainerRef.current.scrollTop = stepsContainerRef.current.scrollHeight;
    }
  }, [steps]);

  const loadDocuments = async () => {
    try {
      const res = await fetch(`${apiBase}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('載入文件列表失敗:', err);
    }
  };

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('research_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('載入歷史紀錄失敗:', err);
    }
  };

  const saveToHistory = (researchData) => {
    const newEntry = {
      id: Date.now(),
      query: researchData.query,
      depth: researchData.depth,
      selectedDocs: researchData.selectedDocs,
      report: researchData.report,
      sources: researchData.sources,
      stats: researchData.stats,
      timestamp: new Date().toISOString()
    };
    
    const updated = [newEntry, ...history].slice(0, 20); // 最多保存 20 條
    setHistory(updated);
    localStorage.setItem('research_history', JSON.stringify(updated));
  };

  const deleteHistory = (id) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('research_history', JSON.stringify(updated));
  };

  const loadFromHistory = (entry) => {
    setSelectedHistory(entry);
    setQuery(entry.query);
    setReport(entry.report);
    setSources(entry.sources || []);
    setStats(entry.stats);
    setSelectedDocs(entry.selectedDocs || []);
    setShowHistory(false);
  };

  const toggleDocSelection = (docName) => {
    setSelectedDocs(prev => 
      prev.includes(docName)
        ? prev.filter(d => d !== docName)
        : [...prev, docName]
    );
  };

  const startResearch = async () => {
    if (!query.trim() || isResearching) return;

    setIsResearching(true);
    setSteps([]);
    setReport(null);
    setSources([]);
    setStats(null);
    setError(null);
    setCurrentScreenshot(null);
    setShowScreenshotPopup(true);
    setIsPopupMinimized(false);
    setRelevanceWarning(null);
    setSelectedHistory(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${apiBase}/research/deep/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(), 
          depth,
          selected_docs: selectedDocs.length > 0 ? selectedDocs : null
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let finalReport = null;
      let finalSources = [];
      let finalStats = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const result = handleSSEEvent(data);
              if (result?.report) {
                finalReport = result.report;
                finalSources = result.sources || [];
                finalStats = result.stats;
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
      
      // 保存到歷史
      if (finalReport) {
        saveToHistory({
          query: query.trim(),
          depth,
          selectedDocs,
          report: finalReport,
          sources: finalSources,
          stats: finalStats
        });
      }
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsResearching(false);
    }
  };

  const handleSSEEvent = (event) => {
    switch (event.type) {
      case 'init':
        setPlaywrightAvailable(event.playwright_available);
        break;
      
      case 'relevance_warning':
        setRelevanceWarning(event.data);
        break;
        
      case 'thinking':
      case 'searching':
      case 'browsing':
      case 'reading':
      case 'analyzing':
      case 'rag_search':
        if (event.data?.screenshot && event.data.screenshot.length > 100) {
          setCurrentScreenshot(event.data.screenshot);
          setCurrentUrl(event.data.url || '');
        }
        
        setSteps(prev => {
          const lastStep = prev[prev.length - 1];
          if (lastStep && lastStep.type === event.type && lastStep.status === 'running') {
            return prev.map((s, i) => 
              i === prev.length - 1 
                ? { ...s, message: event.message, data: event.data, status: event.status }
                : s
            );
          }
          return [...prev, {
            type: event.type,
            status: event.status,
            message: event.message,
            data: event.data || {},
            timestamp: new Date().toISOString()
          }];
        });
        break;
        
      case 'complete':
        setSteps(prev => [...prev, {
          type: 'complete',
          status: 'completed',
          message: event.message,
          data: event.data || {},
          timestamp: new Date().toISOString()
        }]);
        
        if (event.data) {
          setReport(event.data.report);
          setSources(event.data.sources || []);
          setStats(event.data.stats);
        }
        setShowScreenshotPopup(false);
        return { report: event.data?.report, sources: event.data?.sources, stats: event.data?.stats };
        
      case 'error':
        setError(event.message);
        break;
        
      case 'done':
        break;
    }
    return null;
  };

  const cancelResearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsResearching(false);
  };

  const downloadReport = () => {
    if (!report) return;
    
    const filename = `研究報告_${query.slice(0, 20).replace(/[^\w\u4e00-\u9fa5]/g, '_')}_${new Date().toISOString().slice(0, 10)}.md`;
    
    let fullReport = report;
    if (sources.length > 0) {
      fullReport += '\n\n---\n\n## 參考來源\n\n';
      sources.forEach((s, i) => {
        const sourceType = s.type === 'document' ? '📄' : '🌐';
        fullReport += `${i + 1}. ${sourceType} [${s.title || s.url}](${s.url || '#'})\n`;
      });
    }
    
    const blob = new Blob([fullReport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (type, status) => {
    const isRunning = status === 'running';
    const baseClass = isRunning ? 'animate-pulse' : '';
    
    switch (type) {
      case 'thinking':
        return <Brain className={`w-5 h-5 text-purple-500 ${baseClass}`} />;
      case 'searching':
        return <Search className={`w-5 h-5 text-blue-500 ${isRunning ? 'animate-bounce' : ''}`} />;
      case 'browsing':
        return <Globe className={`w-5 h-5 text-green-500 ${isRunning ? 'animate-spin' : ''}`} />;
      case 'reading':
        return <FileText className={`w-5 h-5 text-teal-500 ${baseClass}`} />;
      case 'rag_search':
        return <BookOpen className={`w-5 h-5 text-orange-500 ${baseClass}`} />;
      case 'analyzing':
        return <Zap className={`w-5 h-5 text-yellow-500 ${baseClass}`} />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className={`w-5 h-5 text-gray-500 ${isRunning ? 'animate-spin' : ''}`} />;
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📕';
      case 'doc':
      case 'docx': return '📘';
      case 'xls':
      case 'xlsx': return '📗';
      case 'ppt':
      case 'pptx': return '📙';
      case 'txt': return '📄';
      case 'md': return '📝';
      case 'csv': return '📊';
      default: return '📁';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 relative">
      {/* 標題區 */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">深度研究</h1>
            <p className="text-white/80 text-xs">
              {playwrightAvailable ? '🟢 Playwright 已啟用' : '🟡 HTTP 模式'}
              {selectedDocs.length > 0 && ` • 📂 ${selectedDocs.length} 個文件`}
            </p>
          </div>
          {/* 歷史紀錄按鈕 */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition flex items-center gap-1 ${showHistory ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
            title="歷史紀錄"
          >
            <History className="w-5 h-5 text-white" />
            {history.length > 0 && (
              <span className="bg-purple-300 text-purple-900 text-xs font-bold px-1.5 rounded-full">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 輸入區 */}
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0 space-y-3">
        {/* 主輸入行 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && startResearch()}
            placeholder="輸入研究主題..."
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isResearching}
          />
          
          {/* 文件選擇按鈕 */}
          <button
            onClick={() => setShowDocSelector(!showDocSelector)}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 transition ${
              selectedDocs.length > 0 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
            }`}
            disabled={isResearching}
            title="選擇文件參與研究"
          >
            <FolderOpen className="w-5 h-5" />
            {selectedDocs.length > 0 && <span className="text-sm">{selectedDocs.length}</span>}
          </button>
          
          <select
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            className="px-3 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
            disabled={isResearching}
          >
            <option value="quick">⚡ 快速</option>
            <option value="standard">📊 標準</option>
            <option value="deep">🔬 深入</option>
          </select>
          
          {isResearching ? (
            <button
              onClick={cancelResearch}
              className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              停止
            </button>
          ) : (
            <button
              onClick={startResearch}
              disabled={!query.trim()}
              className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-xl flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              開始
            </button>
          )}
        </div>

        {/* 文件選擇面板 */}
        {showDocSelector && (
          <div className="bg-gray-750 rounded-xl p-3 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 font-medium">選擇要參與研究的文件</span>
              <button
                onClick={loadDocuments}
                className="p-1 hover:bg-gray-600 rounded"
                title="重新載入"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">尚無上傳的文件</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {documents.map(doc => (
                  <button
                    key={doc.name}
                    onClick={() => toggleDocSelection(doc.name)}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition ${
                      selectedDocs.includes(doc.name)
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span>{getFileIcon(doc.name)}</span>
                    <span className="truncate max-w-[150px]">{doc.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            {selectedDocs.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-600 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  已選擇 {selectedDocs.length} 個文件
                </span>
                <button
                  onClick={() => setSelectedDocs([])}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  清除選擇
                </button>
              </div>
            )}
          </div>
        )}

        {/* 相關性警告 */}
        {relevanceWarning && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 text-sm font-medium">相關性提醒</p>
              <p className="text-yellow-200/80 text-xs mt-1">{relevanceWarning.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* 主要內容區 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側：歷史紀錄或步驟進度 */}
        <div className="w-72 border-r border-gray-700 flex flex-col bg-gray-850 flex-shrink-0">
          {showHistory ? (
            // 歷史紀錄面板
            <>
              <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <span className="font-medium text-gray-300 text-sm">歷史紀錄</span>
                <span className="text-xs text-gray-500 ml-auto">{history.length} 條</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {history.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">尚無研究紀錄</p>
                  </div>
                ) : (
                  history.map(entry => (
                    <div
                      key={entry.id}
                      className={`relative group p-3 rounded-lg cursor-pointer transition ${
                        selectedHistory?.id === entry.id 
                          ? 'bg-purple-900/50 border border-purple-500' 
                          : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                      }`}
                      onClick={() => loadFromHistory(entry)}
                    >
                      <p className="text-sm text-gray-200 font-medium truncate pr-6">{entry.query}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </span>
                        {entry.selectedDocs?.length > 0 && (
                          <span className="text-xs text-orange-400">📂 {entry.selectedDocs.length}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteHistory(entry.id); }}
                        className="absolute right-2 top-2 p-1 hover:bg-red-900/50 rounded opacity-0 group-hover:opacity-100 transition"
                        title="刪除"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            // 步驟進度面板
            <>
              <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
                <Loader2 className={`w-4 h-4 text-purple-400 ${isResearching ? 'animate-spin' : ''}`} />
                <span className="font-medium text-gray-300 text-sm">研究進度</span>
                {stats && (
                  <span className="text-xs text-gray-500 ml-auto">
                    {stats.pages_browsed || stats.total_sources} 來源
                  </span>
                )}
              </div>
              
              <div 
                ref={stepsContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2"
              >
                {steps.length === 0 && !isResearching && (
                  <div className="text-center text-gray-500 py-8">
                    <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">輸入主題開始研究</p>
                  </div>
                )}
                
                {steps.map((step, idx) => (
                  <StepCard 
                    key={idx} 
                    step={step} 
                    getStepIcon={getStepIcon}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 右側：報告區 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="font-medium text-gray-300 text-sm">研究報告</span>
            {selectedHistory && (
              <span className="text-xs text-purple-400 ml-2">（歷史紀錄）</span>
            )}
            {report && (
              <button
                onClick={downloadReport}
                className="ml-auto flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition"
              >
                <Download className="w-3 h-3" />
                下載 Markdown
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
            {report ? (
              <div className="max-w-4xl mx-auto">
                <article className="research-report">
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => <h1 className="text-2xl font-bold text-purple-300 border-b border-gray-600 pb-2 mb-4 mt-6">{children}</h1>,
                      h2: ({children}) => <h2 className="text-xl font-semibold text-purple-300 border-b border-gray-700 pb-2 mb-3 mt-5">{children}</h2>,
                      h3: ({children}) => <h3 className="text-lg font-semibold text-purple-200 mb-2 mt-4">{children}</h3>,
                      p: ({children}) => <p className="text-gray-200 leading-relaxed mb-3">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside text-gray-200 mb-3 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside text-gray-200 mb-3 space-y-1">{children}</ol>,
                      li: ({children}) => <li className="text-gray-200">{children}</li>,
                      strong: ({children}) => <strong className="text-purple-200 font-semibold">{children}</strong>,
                      em: ({children}) => <em className="text-gray-300 italic">{children}</em>,
                      a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">{children}</a>,
                      blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 bg-gray-800/50 pl-4 py-2 my-3 text-gray-300 italic">{children}</blockquote>,
                      code: ({children}) => <code className="bg-gray-800 text-pink-300 px-1.5 py-0.5 rounded text-sm">{children}</code>,
                      pre: ({children}) => <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto my-3">{children}</pre>,
                    }}
                  >
                    {report}
                  </ReactMarkdown>
                </article>
                
                {/* 來源列表 - 分類顯示 */}
                {sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <h3 className="text-purple-400 font-semibold mb-4 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      參考來源 ({sources.length})
                    </h3>
                    
                    {/* 網路來源 */}
                    {sources.filter(s => s.type !== 'document').length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> 網路來源
                        </p>
                        <div className="grid gap-2">
                          {sources.filter(s => s.type !== 'document').map((s, i) => (
                            <a
                              key={i}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition group"
                            >
                              <span className="text-purple-400 text-sm font-mono font-bold">[{s.index || i + 1}]</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-blue-400 group-hover:text-blue-300 truncate">
                                  {s.title || '未知標題'}
                                </p>
                                <p className="text-gray-500 text-xs truncate">{s.url}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 文件來源 */}
                    {sources.filter(s => s.type === 'document').length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> 文件來源
                        </p>
                        <div className="grid gap-2">
                          {sources.filter(s => s.type === 'document').map((s, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg"
                            >
                              <span className="text-orange-400 text-sm font-mono font-bold">[{s.index || i + 1}]</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-orange-300 truncate">
                                  {s.title || s.file_name || '文件'}
                                </p>
                                {s.page && (
                                  <p className="text-gray-500 text-xs">第 {s.page} 頁</p>
                                )}
                              </div>
                              <File className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-16">
                {isResearching ? (
                  <>
                    <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-purple-500" />
                    <p className="text-gray-300">正在進行深度研究...</p>
                    <p className="text-sm mt-1 text-gray-500">
                      {selectedDocs.length > 0 
                        ? `整合 ${selectedDocs.length} 個文件 + 網路資料`
                        : '搜尋網路資料中'
                      }
                    </p>
                  </>
                ) : error ? (
                  <>
                    <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                    <p className="text-red-400">{error}</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-gray-300">輸入研究主題開始</p>
                    <p className="text-sm mt-1 text-gray-500">可選擇文件參與整合研究</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右下角浮動截圖視窗 */}
      {showScreenshotPopup && isResearching && currentScreenshot && (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isPopupMinimized ? 'w-48' : 'w-80'}`}>
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-600 overflow-hidden">
            <div className="px-3 py-2 bg-gray-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-xs text-gray-300 flex-1 truncate">
                {currentUrl ? new URL(currentUrl).hostname : '瀏覽中...'}
              </span>
              <button
                onClick={() => setIsPopupMinimized(!isPopupMinimized)}
                className="p-1 hover:bg-gray-600 rounded"
              >
                {isPopupMinimized ? (
                  <Maximize2 className="w-3 h-3 text-gray-400" />
                ) : (
                  <Minimize2 className="w-3 h-3 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setShowScreenshotPopup(false)}
                className="p-1 hover:bg-gray-600 rounded"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
            
            {!isPopupMinimized && (
              <div className="p-2">
                <img
                  src={`data:image/jpeg;base64,${currentScreenshot}`}
                  alt="網頁預覽"
                  className="w-full h-40 object-cover rounded border border-gray-600 bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 步驟卡片組件
function StepCard({ step, getStepIcon }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = step.data && (step.data.results || step.data.queries || step.data.rag_results);

  const getBgColor = () => {
    if (step.status === 'running') return 'bg-purple-900/30 border-purple-500/50';
    if (step.status === 'completed') return 'bg-gray-800/50 border-gray-600';
    if (step.status === 'failed') return 'bg-red-900/20 border-red-500/50';
    return 'bg-gray-800/30 border-gray-700';
  };

  return (
    <div className={`rounded-lg border ${getBgColor()} overflow-hidden`}>
      <div 
        className="p-3 flex items-start gap-2 cursor-pointer"
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 mt-0.5">
          {getStepIcon(step.type, step.status)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 break-words leading-relaxed">
            {step.message}
          </p>
          {step.data?.load_time && (
            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {step.data.load_time.toFixed(1)}s
            </span>
          )}
        </div>
        {hasDetails && (
          <div className="flex-shrink-0 text-gray-500">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        )}
      </div>
      
      {expanded && hasDetails && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-700/50 pt-2">
          {step.data.results && (
            <div className="space-y-1">
              {step.data.results.slice(0, 4).map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 truncate"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  {r.title}
                </a>
              ))}
            </div>
          )}
          
          {step.data.rag_results && (
            <div className="space-y-1">
              {step.data.rag_results.slice(0, 3).map((r, i) => (
                <div key={i} className="text-xs text-orange-400 truncate flex items-center gap-1">
                  <File className="w-3 h-3 flex-shrink-0" />
                  {r.file_name} (p.{r.page})
                </div>
              ))}
            </div>
          )}
          
          {step.data.queries && (
            <div className="flex flex-wrap gap-1">
              {step.data.queries.map((q, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                  {q}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
