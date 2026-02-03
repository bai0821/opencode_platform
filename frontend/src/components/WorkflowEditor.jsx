import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  GitBranch,
  Play,
  Save,
  Plus,
  Trash2,
  Settings,
  ChevronRight,
  Circle,
  Square,
  Diamond,
  Hexagon,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
  FileCode,
  Bot,
  Wrench,
  Zap,
  X,
  ArrowRight,
  Code,
  Timer,
  Split
} from 'lucide-react'
import clsx from 'clsx'

// 節點類型配置
const NODE_TYPES = {
  start: { icon: Play, color: 'bg-green-500', label: '開始' },
  end: { icon: Square, color: 'bg-red-500', label: '結束' },
  agent: { icon: Bot, color: 'bg-blue-500', label: 'Agent' },
  tool: { icon: Wrench, color: 'bg-purple-500', label: '工具' },
  condition: { icon: Diamond, color: 'bg-yellow-500', label: '條件' },
  code: { icon: Code, color: 'bg-gray-500', label: '代碼' },
  delay: { icon: Timer, color: 'bg-orange-500', label: '延遲' },
  parallel: { icon: Split, color: 'bg-cyan-500', label: '並行' }
}

// Agent 類型選項
const AGENT_TYPES = [
  { value: 'researcher', label: '研究員' },
  { value: 'writer', label: '撰寫員' },
  { value: 'coder', label: '程式員' },
  { value: 'analyst', label: '分析師' },
  { value: 'reviewer', label: '審核員' }
]

// 工具選項
const TOOL_OPTIONS = [
  { value: 'rag_search', label: '知識庫搜尋' },
  { value: 'web_search', label: '網路搜尋' },
  { value: 'code_execute', label: '代碼執行' }
]

function WorkflowEditor({ apiBase, token }) {
  // 狀態
  const [workflows, setWorkflows] = useState([])
  const [currentWorkflow, setCurrentWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState([])
  const [executionResult, setExecutionResult] = useState(null)

  const canvasRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [connecting, setConnecting] = useState(null)

  // 載入工作流列表
  useEffect(() => {
    loadWorkflows()
    loadTemplates()
  }, [])

  const loadWorkflows = async () => {
    try {
      const res = await fetch(`${apiBase}/workflows`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data.workflows || [])
      }
    } catch (err) {
      console.error('Failed to load workflows:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const res = await fetch(`${apiBase}/workflows/templates/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  // 創建新工作流
  const createWorkflow = async (name, templateId = null) => {
    try {
      let res
      if (templateId) {
        res = await fetch(`${apiBase}/workflows/from-template/${templateId}?name=${encodeURIComponent(name)}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      } else {
        res = await fetch(`${apiBase}/workflows`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
        })
      }

      if (res.ok) {
        const workflow = await res.json()
        setWorkflows([...workflows, workflow])
        setCurrentWorkflow(workflow)
        setShowNewDialog(false)
        setShowTemplates(false)
      }
    } catch (err) {
      console.error('Failed to create workflow:', err)
    }
  }

  // 保存工作流
  const saveWorkflow = async () => {
    if (!currentWorkflow) return

    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/workflows/${currentWorkflow.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nodes: currentWorkflow.nodes,
          edges: currentWorkflow.edges,
          variables: currentWorkflow.variables
        })
      })

      if (res.ok) {
        const updated = await res.json()
        setCurrentWorkflow(updated)
      }
    } catch (err) {
      console.error('Failed to save workflow:', err)
    } finally {
      setSaving(false)
    }
  }

  // 執行工作流
  const executeWorkflow = async () => {
    if (!currentWorkflow) return

    setExecuting(true)
    setExecutionResult(null)

    try {
      const res = await fetch(`${apiBase}/workflows/${currentWorkflow.id}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input_data: currentWorkflow.variables || {} })
      })

      if (res.ok) {
        const result = await res.json()
        setExecutionResult(result)
      }
    } catch (err) {
      console.error('Failed to execute workflow:', err)
      setExecutionResult({ status: 'failed', error: err.message })
    } finally {
      setExecuting(false)
    }
  }

  // 添加節點
  const addNode = (type) => {
    if (!currentWorkflow) return

    const newNode = {
      id: `${type}_${Date.now()}`,
      type,
      name: NODE_TYPES[type]?.label || type,
      config: {},
      position: { x: 300, y: 200 }
    }

    setCurrentWorkflow({
      ...currentWorkflow,
      nodes: [...currentWorkflow.nodes, newNode]
    })
  }

  // 更新節點
  const updateNode = (nodeId, updates) => {
    if (!currentWorkflow) return

    setCurrentWorkflow({
      ...currentWorkflow,
      nodes: currentWorkflow.nodes.map(n =>
        n.id === nodeId ? { ...n, ...updates } : n
      )
    })
  }

  // 刪除節點
  const deleteNode = (nodeId) => {
    if (!currentWorkflow) return

    setCurrentWorkflow({
      ...currentWorkflow,
      nodes: currentWorkflow.nodes.filter(n => n.id !== nodeId),
      edges: currentWorkflow.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
    })
    setSelectedNode(null)
  }

  // 添加連接
  const addEdge = (source, target) => {
    if (!currentWorkflow) return

    // 檢查是否已存在
    const exists = currentWorkflow.edges.some(e => e.source === source && e.target === target)
    if (exists) return

    const newEdge = {
      id: `edge_${Date.now()}`,
      source,
      target
    }

    setCurrentWorkflow({
      ...currentWorkflow,
      edges: [...currentWorkflow.edges, newEdge]
    })
  }

  // 刪除連接
  const deleteEdge = (edgeId) => {
    if (!currentWorkflow) return

    setCurrentWorkflow({
      ...currentWorkflow,
      edges: currentWorkflow.edges.filter(e => e.id !== edgeId)
    })
  }

  // 拖拽處理
  const handleMouseMove = useCallback((e) => {
    if (!dragging || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - 50
    const y = e.clientY - rect.top - 25

    updateNode(dragging, { position: { x, y } })
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
    setConnecting(null)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // 渲染節點
  const renderNode = (node) => {
    const config = NODE_TYPES[node.type] || { icon: Circle, color: 'bg-gray-500' }
    const Icon = config.icon
    const isSelected = selectedNode?.id === node.id

    return (
      <div
        key={node.id}
        className={clsx(
          'absolute flex items-center gap-2 px-4 py-2 rounded-lg shadow-md cursor-move transition-shadow',
          'bg-white dark:bg-gray-800 border-2',
          isSelected ? 'border-primary-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
        )}
        style={{
          left: node.position?.x || 0,
          top: node.position?.y || 0,
          minWidth: 120
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          setDragging(node.id)
          setSelectedNode(node)
        }}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedNode(node)
        }}
      >
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-white', config.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{node.name}</div>
          <div className="text-xs text-gray-500">{config.label}</div>
        </div>

        {/* 連接點 */}
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full cursor-crosshair"
          onMouseDown={(e) => {
            e.stopPropagation()
            setConnecting(node.id)
          }}
          onMouseUp={(e) => {
            e.stopPropagation()
            if (connecting && connecting !== node.id) {
              addEdge(connecting, node.id)
            }
            setConnecting(null)
          }}
        />
      </div>
    )
  }

  // 渲染連接線
  const renderEdges = () => {
    if (!currentWorkflow) return null

    return currentWorkflow.edges.map(edge => {
      const sourceNode = currentWorkflow.nodes.find(n => n.id === edge.source)
      const targetNode = currentWorkflow.nodes.find(n => n.id === edge.target)

      if (!sourceNode || !targetNode) return null

      const x1 = (sourceNode.position?.x || 0) + 120
      const y1 = (sourceNode.position?.y || 0) + 25
      const x2 = targetNode.position?.x || 0
      const y2 = (targetNode.position?.y || 0) + 25

      return (
        <g key={edge.id}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#6366f1"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          {edge.label && (
            <text
              x={(x1 + x2) / 2}
              y={(y1 + y2) / 2 - 5}
              fill="#666"
              fontSize="12"
              textAnchor="middle"
            >
              {edge.label}
            </text>
          )}
        </g>
      )
    })
  }

  return (
    <div className="h-full flex">
      {/* 左側：工作流列表 */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary-600" />
            工作流
          </h2>
          <button
            onClick={() => setShowNewDialog(true)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {workflows.map(wf => (
            <button
              key={wf.id}
              onClick={() => setCurrentWorkflow(wf)}
              className={clsx(
                'w-full p-3 rounded-lg text-left transition-colors',
                currentWorkflow?.id === wf.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <div className="font-medium truncate">{wf.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {wf.nodes?.length || 0} 節點
              </div>
            </button>
          ))}
        </div>

        {/* 節點工具箱 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="text-sm font-medium mb-2">添加節點</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(NODE_TYPES).filter(([k]) => !['start', 'end'].includes(k)).map(([type, config]) => {
              const Icon = config.icon
              return (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  disabled={!currentWorkflow}
                  className="flex items-center gap-2 p-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <div className={clsx('w-6 h-6 rounded flex items-center justify-center text-white', config.color)}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="truncate">{config.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 中間：畫布 */}
      <div className="flex-1 flex flex-col">
        {/* 工具欄 */}
        <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {currentWorkflow && (
              <>
                <span className="font-semibold">{currentWorkflow.name}</span>
                <span className="text-sm text-gray-500">
                  ({currentWorkflow.nodes?.length || 0} 節點, {currentWorkflow.edges?.length || 0} 連接)
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveWorkflow}
              disabled={!currentWorkflow || saving}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>保存</span>
            </button>

            <button
              onClick={executeWorkflow}
              disabled={!currentWorkflow || executing}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>執行</span>
            </button>
          </div>
        </div>

        {/* 畫布區域 */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-auto bg-gray-50 dark:bg-gray-900"
          style={{ backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          onClick={() => setSelectedNode(null)}
        >
          {currentWorkflow ? (
            <>
              {/* SVG 連接線 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                  </marker>
                </defs>
                {renderEdges()}
              </svg>

              {/* 節點 */}
              {currentWorkflow.nodes?.map(renderNode)}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>選擇或創建一個工作流開始編輯</p>
              </div>
            </div>
          )}
        </div>

        {/* 執行結果 */}
        {executionResult && (
          <div className={clsx(
            'p-4 border-t',
            executionResult.status === 'completed' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          )}>
            <div className="flex items-center gap-2">
              {executionResult.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">
                執行{executionResult.status === 'completed' ? '成功' : '失敗'}
              </span>
              {executionResult.error && (
                <span className="text-red-600">{executionResult.error}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 右側：節點屬性 */}
      {selectedNode && (
        <div className="w-72 border-l border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">節點屬性</h3>
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">名稱</label>
              <input
                type="text"
                value={selectedNode.name || ''}
                onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">類型</label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                {NODE_TYPES[selectedNode.type]?.label || selectedNode.type}
              </div>
            </div>

            {/* Agent 配置 */}
            {selectedNode.type === 'agent' && (
              <div>
                <label className="block text-sm font-medium mb-1">Agent 類型</label>
                <select
                  value={selectedNode.config?.agent_type || ''}
                  onChange={(e) => updateNode(selectedNode.id, {
                    config: { ...selectedNode.config, agent_type: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">選擇 Agent</option>
                  {AGENT_TYPES.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tool 配置 */}
            {selectedNode.type === 'tool' && (
              <div>
                <label className="block text-sm font-medium mb-1">工具</label>
                <select
                  value={selectedNode.config?.tool || ''}
                  onChange={(e) => updateNode(selectedNode.id, {
                    config: { ...selectedNode.config, tool: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">選擇工具</option>
                  {TOOL_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 條件配置 */}
            {selectedNode.type === 'condition' && (
              <div>
                <label className="block text-sm font-medium mb-1">條件表達式</label>
                <input
                  type="text"
                  value={selectedNode.config?.condition || ''}
                  onChange={(e) => updateNode(selectedNode.id, {
                    config: { ...selectedNode.config, condition: e.target.value }
                  })}
                  placeholder="例如: count > 0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                />
              </div>
            )}

            {/* 延遲配置 */}
            {selectedNode.type === 'delay' && (
              <div>
                <label className="block text-sm font-medium mb-1">延遲時間（秒）</label>
                <input
                  type="number"
                  value={selectedNode.config?.seconds || 1}
                  onChange={(e) => updateNode(selectedNode.id, {
                    config: { ...selectedNode.config, seconds: parseInt(e.target.value) || 1 }
                  })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 新建工作流對話框 */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">新建工作流</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const name = e.target.name.value
              if (name) createWorkflow(name)
            }}>
              <input
                name="name"
                type="text"
                placeholder="工作流名稱"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewDialog(false)
                    setShowTemplates(true)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  從模板
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  空白
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDialog(false)}
                className="w-full mt-2 px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 模板選擇對話框 */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">選擇模板</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 cursor-pointer"
                  onClick={() => {
                    const name = prompt('工作流名稱', template.name)
                    if (name) createWorkflow(name, template.id)
                  }}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {template.nodes?.length || 0} 節點
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowEditor
