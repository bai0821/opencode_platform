import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, User, Bot, AlertCircle, Copy, Check, FileText, ChevronRight, ChevronLeft, X, Trash2, Plus, MessageSquare, MoreHorizontal, Image, Paperclip, File } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import ProcessSteps from './ProcessSteps'
import SourceCard from './SourceCard'
import FilePreview from './FilePreview'
import clsx from 'clsx'

// 本地存儲 key
const STORAGE_KEY = 'opencode_conversations'
const MAX_CONVERSATIONS = 50

// 支援的檔案類型
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

// 生成唯一 ID
const generateId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 獲取對話標題（取第一條用戶消息的前 30 字）
const getConversationTitle = (messages) => {
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (firstUserMsg) {
    const text = typeof firstUserMsg.content === 'string' 
      ? firstUserMsg.content 
      : firstUserMsg.content.find(c => c.type === 'text')?.text || '新對話'
    return text.slice(0, 30) + (text.length > 30 ? '...' : '')
  }
  return '新對話'
}

function ChatInterface({ documents = [], selectedDocs: initialSelectedDocs = [], onSelectDocs, apiBase }) {
  // 從 localStorage 讀取所有對話
  const loadConversations = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // 恢復 timestamp
        return parsed.map(conv => ({
          ...conv,
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          })),
          updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : new Date()
        }))
      }
    } catch (e) {
      console.error('載入對話失敗:', e)
    }
    return []
  }

  // 對話列表和當前對話
  const [conversations, setConversations] = useState(loadConversations)
  const [currentConvId, setCurrentConvId] = useState(() => {
    const convs = loadConversations()
    return convs.length > 0 ? convs[0].id : null
  })
  
  // 當前對話的消息
  const currentConv = conversations.find(c => c.id === currentConvId)
  const messages = currentConv?.messages || []
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamingContent, setStreamingContent] = useState('')
  
  // 步驟追蹤
  const [processSteps, setProcessSteps] = useState([])
  const [currentSources, setCurrentSources] = useState([])
  
  // 文件選擇和預覽
  const [selectedDocs, setSelectedDocs] = useState(initialSelectedDocs)
  const [showPanel, setShowPanel] = useState(true)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [panelWidth, setPanelWidth] = useState(450)
  const [isResizing, setIsResizing] = useState(false)
  
  // PDF 跳轉
  const [pdfTargetPage, setPdfTargetPage] = useState(null)
  const [pdfHighlightText, setPdfHighlightText] = useState('')
  
  // 側邊欄控制
  const [showHistorySidebar, setShowHistorySidebar] = useState(true)
  
  // 多模態附件
  const [attachments, setAttachments] = useState([]) // [{type: 'image'|'file', name, data, preview}]
  const [isDragging, setIsDragging] = useState(false)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  // 保存對話到 localStorage
  const saveConversations = useCallback((convs) => {
    try {
      const toSave = convs.slice(0, MAX_CONVERSATIONS).map(conv => ({
        ...conv,
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp?.toISOString?.() || new Date().toISOString()
        })),
        updatedAt: conv.updatedAt?.toISOString?.() || new Date().toISOString()
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) {
      console.error('保存對話失敗:', e)
    }
  }, [])

  // 當對話改變時保存
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations)
    }
  }, [conversations, saveConversations])

  // 新建對話
  const createNewConversation = () => {
    const newConv = {
      id: generateId(),
      title: '新對話',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setConversations(prev => [newConv, ...prev])
    setCurrentConvId(newConv.id)
    setProcessSteps([])
    setStreamingContent('')
  }

  // 切換對話
  const switchConversation = (convId) => {
    setCurrentConvId(convId)
    setProcessSteps([])
    setStreamingContent('')
    setError(null)
  }

  // 刪除對話
  const deleteConversation = (convId, e) => {
    e.stopPropagation()
    if (window.confirm('確定要刪除這個對話嗎？')) {
      setConversations(prev => {
        const updated = prev.filter(c => c.id !== convId)
        // 如果刪除的是當前對話，切換到第一個
        if (convId === currentConvId) {
          setCurrentConvId(updated.length > 0 ? updated[0].id : null)
        }
        return updated
      })
    }
  }

  // 更新當前對話的消息
  const setMessages = (updater) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === currentConvId) {
          const newMessages = typeof updater === 'function' 
            ? updater(conv.messages) 
            : updater
          return {
            ...conv,
            messages: newMessages,
            title: getConversationTitle(newMessages),
            updatedAt: new Date()
          }
        }
        return conv
      })
    })
  }

  // 清空當前對話
  const clearCurrentConversation = () => {
    if (window.confirm('確定要清空當前對話嗎？')) {
      setMessages([])
    }
  }

  // 處理來源點擊 - 跳轉到 PDF 對應頁面
  const handleSourceClick = (sourceInfo) => {
    const { fileName, page, text } = sourceInfo
    
    console.log('Source clicked:', sourceInfo)
    
    // 設置預覽文件
    if (fileName && fileName !== '未知來源') {
      setPreviewDoc(fileName)
    }
    
    // 設置跳轉頁碼（使用新的時間戳強制更新）
    if (page) {
      const pageNum = parseInt(page, 10)
      if (!isNaN(pageNum)) {
        // 先清空再設置，確保觸發更新
        setPdfTargetPage(null)
        setTimeout(() => {
          setPdfTargetPage(pageNum)
        }, 50)
      }
    }
    
    // 設置高亮文字
    if (text) {
      setPdfHighlightText(text.slice(0, 100))
    }
    
    // 確保面板打開
    setShowPanel(true)
  }

  // 同步外部選擇狀態
  useEffect(() => {
    if (onSelectDocs) {
      onSelectDocs(selectedDocs)
    }
    // 自動預覽第一個選中的文件
    if (selectedDocs.length > 0 && !previewDoc) {
      setPreviewDoc(selectedDocs[0])
    }
  }, [selectedDocs])

  // 拖曳調整寬度
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return
      const containerWidth = window.innerWidth
      const newWidth = containerWidth - e.clientX
      // 限制寬度範圍 300-900px（增加最大寬度）
      setPanelWidth(Math.min(Math.max(newWidth, 300), 900))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, processSteps])

  // 切換文件選擇
  const toggleDocSelection = (docName) => {
    setSelectedDocs(prev => {
      const isSelected = prev.includes(docName)
      if (isSelected) {
        // 取消選擇
        const newList = prev.filter(d => d !== docName)
        // 如果取消的是當前預覽的，切換到下一個
        if (previewDoc === docName) {
          setPreviewDoc(newList.length > 0 ? newList[0] : null)
        }
        return newList
      } else {
        // 新選擇 - 自動預覽
        setPreviewDoc(docName)
        return [...prev, docName]
      }
    })
  }

  // =============== 多模態附件處理 ===============
  
  // 處理檔案選擇
  const handleFileSelect = async (e, type = 'file') => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    for (const file of files) {
      // 檢查大小
      if (file.size > MAX_FILE_SIZE) {
        setError(`檔案 ${file.name} 超過 20MB 限制`)
        continue
      }
      
      // 判斷類型
      const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/')
      
      // 讀取檔案
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        const newAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: isImage ? 'image' : 'file',
          name: file.name,
          mimeType: file.type,
          size: file.size,
          data: base64,
          preview: isImage ? reader.result : null
        }
        setAttachments(prev => [...prev, newAttachment])
      }
      reader.readAsDataURL(file)
    }
    
    // 清除 input
    e.target.value = ''
  }
  
  // 移除附件
  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }
  
  // 拖放處理
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`檔案 ${file.name} 超過 20MB 限制`)
        continue
      }
      
      const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/')
      
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        const newAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: isImage ? 'image' : 'file',
          name: file.name,
          mimeType: file.type,
          size: file.size,
          data: base64,
          preview: isImage ? reader.result : null
        }
        setAttachments(prev => [...prev, newAttachment])
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 格式化檔案大小
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
  
  // 獲取檔案圖標
  const getFileIcon = (mimeType, name) => {
    if (mimeType?.includes('pdf')) return '📕'
    if (mimeType?.includes('word') || name?.endsWith('.doc') || name?.endsWith('.docx')) return '📘'
    if (mimeType?.includes('excel') || mimeType?.includes('sheet') || name?.endsWith('.xls') || name?.endsWith('.xlsx')) return '📗'
    if (mimeType?.includes('text') || name?.endsWith('.txt') || name?.endsWith('.md')) return '📝'
    if (mimeType?.includes('json')) return '📋'
    if (mimeType?.includes('csv')) return '📊'
    return '📄'
  }

  // 添加步驟的輔助函數
  const addStep = (step) => {
    setProcessSteps(prev => {
      // 檢查是否需要更新現有步驟
      const existingIdx = prev.findIndex(s => s.id === step.id)
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx] = { ...updated[existingIdx], ...step }
        return updated
      }
      return [...prev, step]
    })
  }

  // 更新最後一個步驟的狀態
  const updateLastStep = (updates) => {
    setProcessSteps(prev => {
      if (prev.length === 0) return prev
      const updated = [...prev]
      updated[updated.length - 1] = { ...updated[updated.length - 1], ...updates }
      return updated
    })
  }

  // 傳送訊息 - 統一入口，自動判斷使用 RAG 或 Multi-Agent
  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return

    // 如果沒有當前對話，先創建一個
    if (!currentConvId) {
      const newConv = {
        id: generateId(),
        title: input.trim().slice(0, 30) + (input.trim().length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setConversations(prev => [newConv, ...prev])
      setCurrentConvId(newConv.id)
      // 等待狀態更新
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    const userMessage = input.trim()
    const currentAttachments = [...attachments]
    
    setInput('')
    setAttachments([]) // 清空附件
    setError(null)
    setIsLoading(true)
    setStreamingContent('')
    setProcessSteps([])
    setCurrentSources([])

    // 構建用戶訊息（可能包含附件）
    const userMessageObj = {
      role: 'user',
      content: userMessage,
      attachments: currentAttachments.length > 0 ? currentAttachments.map(a => ({
        type: a.type,
        name: a.name,
        mimeType: a.mimeType,
        preview: a.preview
      })) : undefined,
      selectedDocs: [...selectedDocs],
      timestamp: new Date()
    }
    
    // 新增使用者訊息
    setMessages(prev => [...prev, userMessageObj])

    const token = localStorage.getItem('token')
    
    // 使用 Multi-Agent 流程（Streaming 模式即時顯示進度）
    try {
      // 添加初始分析步驟
      addStep({
        id: 'step_analyze',
        type: 'analysis',
        title: '🧠 理解問題',
        summary: currentAttachments.length > 0 
          ? `正在分析您的問題和 ${currentAttachments.length} 個附件...`
          : '正在分析您的問題...',
        status: 'running',
        autoExpand: true
      })

      // 構建請求體
      const requestBody = {
        request: userMessage,
        context: selectedDocs.length > 0 ? { selected_docs: selectedDocs } : null,
        stream: true,
        // 添加多模態附件
        attachments: currentAttachments.length > 0 ? currentAttachments.map(a => ({
          type: a.type,
          name: a.name,
          mime_type: a.mimeType,
          data: a.data  // base64
        })) : undefined
      }

      const response = await fetch(`${apiBase}/agents/process`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Multi-Agent unavailable')
      }

      // 處理 SSE 串流
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalContent = ''
      let finalUsage = null  // Token 使用量
      let allSources = []
      let stepCounter = 1  // 從 1 開始，因為已經有初始步驟
      let isSimpleQuery = false
      let currentAgentStep = null
      
      // 本地追蹤步驟（用於最終保存到訊息）
      let localSteps = [{
        id: 'step_analyze',
        type: 'analysis',
        title: '🧠 理解問題',
        summary: '正在分析您的問題...',
        status: 'running',
        autoExpand: true
      }]
      
      const updateLocalStep = (stepId, updates) => {
        localSteps = localSteps.map(step => 
          step.id === stepId ? { ...step, ...updates } : step
        )
      }
      
      const addLocalStep = (step) => {
        localSteps = [...localSteps, step]
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          
          try {
            const event = JSON.parse(line.slice(6))
            
            switch (event.type) {
              case 'thinking':
                // 更新初始步驟
                updateStepById('step_analyze', {
                  summary: event.content,
                  details: event.details,
                  status: 'running'
                })
                updateLocalStep('step_analyze', {
                  summary: event.content,
                  details: event.details,
                  status: 'running'
                })
                break

              case 'analysis_complete':
                isSimpleQuery = event.is_simple_query || false
                updateStepById('step_analyze', {
                  status: 'completed',
                  summary: event.content
                })
                updateLocalStep('step_analyze', {
                  status: 'completed',
                  summary: event.content
                })
                break

              case 'plan':
                isSimpleQuery = event.is_simple_query || false
                const subtasks = event.subtasks || []
                
                if (!isSimpleQuery && subtasks.length > 1) {
                  stepCounter++
                  const planStep = {
                    id: `step_${stepCounter}`,
                    type: 'planning',
                    title: '📋 任務規劃',
                    summary: `分解為 ${subtasks.length} 個子任務`,
                    subSteps: subtasks.map(t => ({
                      title: `${getAgentIcon(t.agent)} ${getAgentLabel(t.agent)}: ${t.description || t.task}`,
                      agent: t.agent,
                      status: 'pending'
                    })),
                    status: 'completed',
                    autoExpand: true
                  }
                  addStep(planStep)
                  addLocalStep(planStep)
                }
                break

              case 'agent_start':
                stepCounter++
                currentAgentStep = `step_${stepCounter}`
                const agentStep = {
                  id: currentAgentStep,
                  type: isSimpleQuery ? 'tool_call' : 'agent_execute',
                  agentType: event.agent,
                  title: isSimpleQuery 
                    ? '🔍 搜尋知識庫' 
                    : `${getAgentIcon(event.agent)} ${getAgentLabel(event.agent)} 執行中`,
                  summary: event.task,
                  status: 'running',
                  autoExpand: true
                }
                addStep(agentStep)
                addLocalStep(agentStep)
                break

              case 'tool_call':
                if (currentAgentStep) {
                  const toolCallData = {
                    tool: event.tool,
                    arguments: event.arguments,
                    result: event.result,
                    success: event.success
                  }
                  const queries = event.arguments?.queries || 
                    (event.arguments?.query ? [event.arguments.query] : [])
                  
                  setProcessSteps(prev => prev.map(step => {
                    if (step.id === currentAgentStep) {
                      const existingToolCalls = step.toolCalls || []
                      return {
                        ...step,
                        toolCalls: [...existingToolCalls, toolCallData],
                        queries: queries.length > 0 
                          ? [...(step.queries || []), ...queries]
                          : step.queries
                      }
                    }
                    return step
                  }))
                  
                  // 同步更新 localSteps
                  localSteps = localSteps.map(step => {
                    if (step.id === currentAgentStep) {
                      const existingToolCalls = step.toolCalls || []
                      return {
                        ...step,
                        toolCalls: [...existingToolCalls, toolCallData],
                        queries: queries.length > 0 
                          ? [...(step.queries || []), ...queries]
                          : step.queries
                      }
                    }
                    return step
                  })
                }
                break

              case 'code_execution':
                // 程式碼執行結果 - 更新當前步驟
                console.log('Code execution event:', event)
                if (currentAgentStep) {
                  const codeData = {
                    type: 'code_execution',
                    code: event.code,
                    executionResult: event.result
                  }
                  
                  setProcessSteps(prev => prev.map(step => {
                    if (step.id === currentAgentStep) {
                      return { ...step, ...codeData }
                    }
                    return step
                  }))
                  
                  // 同步更新 localSteps
                  localSteps = localSteps.map(step => {
                    if (step.id === currentAgentStep) {
                      return { ...step, ...codeData }
                    }
                    return step
                  })
                }
                break

              case 'step_result':
                const toolCalls = event.tool_calls || []
                const stepResultData = {
                  status: event.success ? 'completed' : 'error',
                  results: toolCalls.length > 0 
                    ? `找到 ${toolCalls[0]?.result?.count || toolCalls.length} 個結果`
                    : '完成',
                  executionTime: event.execution_time,
                  sources: toolCalls.flatMap(tc => tc.result?.results || []),
                  toolCalls: toolCalls.length > 0 ? toolCalls : undefined
                }
                
                if (currentAgentStep) {
                  updateStepById(currentAgentStep, stepResultData)
                  updateLocalStep(currentAgentStep, stepResultData)
                }
                
                // 收集來源
                toolCalls.forEach(tc => {
                  if (tc.result?.results) {
                    allSources.push(...tc.result.results)
                  }
                })
                currentAgentStep = null
                break

              case 'step_error':
                if (currentAgentStep) {
                  const errorData = { status: 'error', error: event.error }
                  updateStepById(currentAgentStep, errorData)
                  updateLocalStep(currentAgentStep, errorData)
                }
                currentAgentStep = null
                break

              case 'summarizing':
                stepCounter++
                const summaryStep = {
                  id: `step_${stepCounter}`,
                  type: 'generating',
                  title: '✨ 整理回答',
                  summary: event.content,
                  status: 'running'
                }
                addStep(summaryStep)
                addLocalStep(summaryStep)
                break

              case 'final':
                finalContent = event.content
                // 提取 usage 信息
                if (event.usage) {
                  finalUsage = event.usage
                }
                // 更新最後一個步驟為完成
                updateLastStep({ status: 'completed' })
                if (localSteps.length > 0) {
                  localSteps[localSteps.length - 1].status = 'completed'
                }
                break

              case 'error':
                const errorStep = {
                  id: `step_error`,
                  type: 'error',
                  title: '❌ 錯誤',
                  summary: event.content,
                  status: 'error'
                }
                addStep(errorStep)
                addLocalStep(errorStep)
                break
            }
          } catch (e) {
            console.error('Parse event error:', e)
          }
        }
      }

      setCurrentSources(allSources)

      // 使用 localSteps（已追蹤所有步驟變化）
      console.log('Saving steps to message:', localSteps)
      console.log('Token usage:', finalUsage)

      // 新增助手訊息（包含思考過程和 Token 使用量）
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: finalContent,
        sources: allSources,
        processSteps: localSteps,  // 使用本地追蹤的步驟
        usage: finalUsage,         // Token 使用量
        timestamp: new Date()
      }])

      // 清除當前處理步驟（但訊息中已保存）
      setProcessSteps([])
      setIsLoading(false)

    } catch (err) {
      console.log('Multi-Agent unavailable, falling back to RAG:', err.message)
      setProcessSteps([])
      await sendRAGMessage(userMessage, currentAttachments)
    }
  }

  // 根據 ID 更新特定步驟
  const updateStepById = (stepId, updates) => {
    setProcessSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  // RAG 模式處理（作為 fallback）
  const sendRAGMessage = async (userMessage, attachmentsToSend = []) => {
    try {
      const response = await fetch(`${apiBase}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: 'web_session',
          selected_docs: selectedDocs.length > 0 ? selectedDocs : null,
          // 添加附件
          attachments: attachmentsToSend.length > 0 ? attachmentsToSend.map(a => ({
            type: a.type,
            name: a.name,
            mime_type: a.mimeType,
            data: a.data
          })) : null
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let allSteps = []
      let sources = []
      let stepCounter = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          
          try {
            const data = JSON.parse(line.slice(6))
            
            switch (data.type) {
              case 'thinking':
                // 分析/思考步驟 - 檢查是否是生成回答
                stepCounter++
                if (data.data?.type === 'generating') {
                  // 這是生成回答的步驟
                  addStep({
                    id: `step_${stepCounter}`,
                    type: 'generating',
                    title: '生成回答',
                    summary: data.content,
                    status: 'running',
                    autoExpand: true
                  })
                } else {
                  // 這是分析問題的步驟
                  addStep({
                    id: `step_${stepCounter}`,
                    type: 'analysis',
                    title: '分析問題',
                    summary: data.content,
                    status: 'completed',
                    autoExpand: true
                  })
                }
                break
              
              case 'plan':
              case 'planning':
                // 規劃步驟 - 後端發送 EventType.PLAN
                stepCounter++
                const planData = data.data || {}
                addStep({
                  id: `step_${stepCounter}`,
                  type: 'planning',
                  title: '規劃搜尋策略',
                  summary: planData.summary || data.content || '分解問題並規劃搜尋策略',
                  queries: planData.queries || [],
                  subSteps: planData.tasks?.map(t => ({ 
                    title: t.description || t.tool, 
                    status: 'pending' 
                  })),
                  status: 'completed',
                  autoExpand: true
                })
                break
              
              case 'tool_call':
                // 工具呼叫
                stepCounter++
                const toolName = data.content || data.tool || data.name || 'unknown'
                const toolParams = data.data?.arguments || data.params || {}
                addStep({
                  id: `step_${stepCounter}`,
                  type: 'tool_call',
                  toolName: toolName,  // 保存工具名稱供圖標使用
                  title: getToolDisplayName(toolName),
                  summary: getToolSummary(toolName, toolParams),
                  queries: toolParams.queries || (toolParams.query ? [toolParams.query] : []),
                  code: toolParams.code,  // 保存程式碼供顯示
                  status: 'running',
                  autoExpand: true
                })
                break
              
              case 'tool_result':
                // 工具結果
                const toolResultData = data.data || {}
                
                // 檢查是否是程式碼執行結果
                if (toolResultData.figures !== undefined || toolResultData.stdout !== undefined) {
                  // 這是 sandbox 執行結果
                  updateLastStep({
                    status: toolResultData.success ? 'completed' : 'error',
                    executionResult: toolResultData,
                    results: toolResultData.success ? '執行成功' : '執行失敗'
                  })
                } else {
                  // 一般工具結果
                  updateLastStep({
                    status: 'completed',
                    results: data.data?.preview?.match(/results=(\d+)/)?.[1] || 
                             data.data?.results_count ||
                             '多個'
                  })
                }
                break
              
              case 'search_progress':
                // 搜尋進度（新事件類型）
                updateLastStep({
                  summary: data.content,
                  results: data.results_count
                })
                break
              
              case 'generating':
                // 生成回答中
                stepCounter++
                addStep({
                  id: `step_${stepCounter}`,
                  type: 'generating',
                  title: '生成回答',
                  summary: '根據搜尋結果生成回答...',
                  status: 'running'
                })
                break
              
              case 'token':
              case 'chunk':
                fullContent += data.content || data.text || ''
                setStreamingContent(fullContent)
                // 更新生成步驟
                updateLastStep({ status: 'running' })
                break
              
              case 'answer':
                fullContent = data.content || fullContent
                setStreamingContent(fullContent)
                updateLastStep({ status: 'completed' })
                break
              
              case 'source':
              case 'sources':
                const srcData = data.data?.sources || data.sources || []
                sources = srcData
                setCurrentSources(srcData)
                // 更新最後一個搜尋步驟的來源
                setProcessSteps(prev => {
                  const updated = [...prev]
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].type === 'tool_call' || updated[i].type === 'search') {
                      updated[i] = { ...updated[i], sources: srcData }
                      break
                    }
                  }
                  return updated
                })
                break
              
              case 'error':
                addStep({
                  id: `error_${Date.now()}`,
                  type: 'error',
                  title: '發生錯誤',
                  summary: data.content || 'Unknown error',
                  status: 'error'
                })
                throw new Error(data.content || 'Unknown error')
              
              case 'done':
              case 'end':
                // 標記所有步驟為完成
                setProcessSteps(prev => prev.map(s => ({ ...s, status: 'completed' })))
                break
            }
          } catch (e) {
            if (e.message !== 'Unknown error') {
              console.warn('Parse error:', e)
            }
          }
        }
      }

      // 新增助手訊息
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullContent,
        steps: processSteps,
        sources,
        timestamp: new Date()
      }])

    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message || '發生錯誤')
      
      // 嘗試使用同步 API
      try {
        const syncRes = await fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            session_id: 'web_session',
            selected_docs: selectedDocs.length > 0 ? selectedDocs : null
          })
        })
        
        if (syncRes.ok) {
          const data = await syncRes.json()
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
            timestamp: new Date()
          }])
          setError(null)
        }
      } catch {
        // 保持原本的錯誤
      }
    } finally {
      setIsLoading(false)
      setStreamingContent('')
    }
  }

  // Agent 標籤轉換
  const getAgentLabel = (agent) => {
    const labels = {
      'dispatcher': '總機',
      'researcher': '研究者',
      'writer': '寫作者',
      'coder': '編碼者',
      'analyst': '分析師',
      'reviewer': '審核者'
    }
    return labels[agent] || agent
  }

  // Agent 圖標
  const getAgentIcon = (agent) => {
    const icons = {
      'dispatcher': '🎯',
      'researcher': '🔍',
      'writer': '✍️',
      'coder': '💻',
      'analyst': '📊',
      'reviewer': '✅'
    }
    return icons[agent] || '🤖'
  }

  // 工具名稱顯示轉換
  const getToolDisplayName = (tool) => {
    const names = {
      'rag_search': '搜尋知識庫',
      'rag_search_multiple': '多角度搜尋',
      'rag_ask': '知識問答',
      'web_search': '🌐 網路搜尋',
      'web_search_summarize': '🌐 網路搜尋摘要',
      'sandbox_execute_python': '執行 Python',
      'execute_python': '執行 Python',
      'sandbox_execute_bash': '執行命令',
      'execute_bash': '執行命令',
      'git_clone': '📦 Clone 倉庫',
      'git_status': '📋 Git 狀態',
      'git_commit': '💾 Git 提交',
      'git_push': '⬆️ Git 推送',
      'git_pull': '⬇️ Git 拉取',
      'git_log': '📜 Git 歷史',
      'git_diff': '📝 Git 差異'
    }
    return names[tool] || tool
  }

  // 工具摘要生成
  const getToolSummary = (tool, params) => {
    if (tool === 'rag_search_multiple' && params.queries) {
      return `搜尋 ${params.queries.length} 個查詢: ${params.queries.slice(0, 2).join(', ')}...`
    }
    if (tool === 'rag_search' && params.query) {
      return `搜尋: ${params.query.slice(0, 50)}...`
    }
    if (tool === 'web_search' || tool === 'web_search_summarize') {
      return `搜尋網路: ${(params.query || '').slice(0, 50)}...`
    }
    if (tool === 'sandbox_execute_python' || tool === 'execute_python') {
      const code = params.code || ''
      return `執行程式碼 (${code.split('\n').length} 行)`
    }
    if (tool === 'git_clone') {
      return `Clone: ${(params.url || '').slice(0, 50)}...`
    }
    if (tool.startsWith('git_')) {
      return `路徑: ${params.path || '.'}`
    }
    return '執行中...'
  }

  // 處理按鍵
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex relative">
      {/* 左側對話歷史側邊欄 */}
      {showHistorySidebar && (
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col">
          {/* 新建對話按鈕 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              新對話
            </button>
          </div>
          
          {/* 對話列表 */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                還沒有對話記錄
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => switchConversation(conv.id)}
                    className={clsx(
                      'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      conv.id === currentConvId
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{conv.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {conv.messages.length} 條消息
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                      title="刪除對話"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 側邊欄切換按鈕 */}
      <button
        onClick={() => setShowHistorySidebar(!showHistorySidebar)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
        style={{ left: showHistorySidebar ? '256px' : '0' }}
        title={showHistorySidebar ? '收起歷史' : '展開歷史'}
      >
        {showHistorySidebar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* 主對話區 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 訊息區 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">開始對話</h3>
                <p className="text-sm">
                  輸入問題與知識庫對話
                  {selectedDocs.length > 0 && (
                    <span className="block mt-1 text-primary-600 dark:text-primary-400">
                      已選擇 {selectedDocs.length} 個文件
                    </span>
                  )}
                </p>
                <p className="text-xs mt-4 text-gray-400">
                  💡 系統會自動判斷：簡單問題直接搜尋，複雜任務啟動多 Agent 協作
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble 
              key={idx} 
              message={msg} 
              onDocClick={setPreviewDoc}
              onSourceClick={handleSourceClick}
            />
          ))}

          {/* 串流中的內容 */}
          {isLoading && (
            <div className="space-y-3">
              {/* 詳細步驟顯示 */}
              {processSteps.length > 0 && (
                <ProcessSteps steps={processSteps} isProcessing={true} />
              )}

              {/* 正在生成的回答 */}
              {streamingContent && (
                <div className="message-bubble message-assistant">
                  <div className="prose-chat">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* 初始載入狀態 */}
              {!streamingContent && processSteps.length === 0 && (
                <div className="message-bubble message-assistant">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>分析問題中...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 錯誤提示 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 輸入區 */}
        <div 
          className={clsx(
            "border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800",
            isDragging && "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 拖放提示 */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary-50/90 dark:bg-primary-900/90 z-10 rounded-lg border-2 border-dashed border-primary-500">
              <div className="text-center">
                <Image className="w-12 h-12 mx-auto text-primary-500 mb-2" />
                <p className="text-primary-600 dark:text-primary-400 font-medium">放開以上傳圖片或檔案</p>
              </div>
            </div>
          )}
          
          {/* 已選文件標籤 */}
          {selectedDocs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedDocs.map(doc => (
                <span 
                  key={doc}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                >
                  <FileText className="w-3 h-3" />
                  {doc}
                  <button 
                    onClick={() => toggleDocSelection(doc)}
                    className="hover:text-primary-900 dark:hover:text-primary-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* 附件預覽區 */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {attachments.map(att => (
                <div 
                  key={att.id}
                  className="relative group"
                >
                  {att.type === 'image' ? (
                    // 圖片預覽
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                      <img 
                        src={att.preview} 
                        alt={att.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    // 檔案預覽
                    <div className="w-20 h-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-2">
                      <span className="text-2xl">{getFileIcon(att.mimeType, att.name)}</span>
                      <span className="text-xs text-gray-500 truncate w-full text-center mt-1">{att.name.slice(0, 10)}</span>
                    </div>
                  )}
                  {/* 刪除按鈕 */}
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* 檔案大小 */}
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/50 text-white px-1 rounded">
                    {formatFileSize(att.size)}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* 隱藏的檔案輸入 */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.xls,.xlsx"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'file')}
          />
          
          <div className="flex gap-2 items-end">
            {/* 上傳按鈕組 */}
            <div className="flex gap-1">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 hover:text-primary-500"
                title="上傳圖片"
                disabled={isLoading}
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 hover:text-primary-500"
                title="上傳檔案"
                disabled={isLoading}
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
            
            {/* 文字輸入 */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachments.length > 0 
                ? "描述您想對這些檔案做什麼... (Enter 傳送)" 
                : "輸入問題或任務... (Enter 傳送, Shift+Enter 換行)"
              }
              className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[48px] max-h-32"
              rows={1}
              disabled={isLoading}
            />
            
            {/* 發送按鈕 */}
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={clsx(
                'px-4 py-3 rounded-xl font-medium transition-colors',
                (input.trim() || attachments.length > 0) && !isLoading
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* 智能提示和對話統計 */}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              💡 支援圖片識別和檔案分析 • 可拖放上傳
            </p>
            
            {/* 對話 Token 統計 */}
            {(() => {
              const totalTokens = messages
                .filter(m => m.role === 'assistant' && m.usage)
                .reduce((sum, m) => sum + (m.usage.total_tokens || 0), 0)
              const totalCost = messages
                .filter(m => m.role === 'assistant' && m.usage)
                .reduce((sum, m) => sum + (m.usage.estimated_cost_usd || 0), 0)
              
              if (totalTokens === 0) return null
              
              return (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    📊 本次對話: {totalTokens.toLocaleString()} tokens
                  </span>
                  {totalCost > 0 && (
                    <span className="text-amber-500 flex items-center gap-1">
                      💰 ${totalCost.toFixed(4)}
                    </span>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* 右側面板切換按鈕 */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={clsx(
          'absolute top-1/2 -translate-y-1/2 z-10 p-1 bg-gray-200 dark:bg-gray-700 rounded-l-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors',
        )}
        style={{ right: showPanel ? `${panelWidth}px` : '0' }}
      >
        {showPanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* 右側文件面板 */}
      {showPanel && (
        <div 
          ref={panelRef}
          className="border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col relative"
          style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px` }}
        >
          {/* 拖曳調整寬度的 handle */}
          <div
            onMouseDown={handleMouseDown}
            className={clsx(
              'absolute left-0 top-0 bottom-0 w-2 cursor-col-resize transition-colors z-20 group',
              'hover:bg-primary-400 dark:hover:bg-primary-600',
              isResizing && 'bg-primary-500'
            )}
            title="拖曳調整寬度"
          >
            {/* 視覺提示線 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50 group-hover:opacity-100 group-hover:bg-primary-500" />
          </div>
          {/* 文件選擇區 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              選擇文件
            </h3>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">尚無文件，請先上傳</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.map(doc => (
                  <label 
                    key={doc.name}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.name)}
                      onChange={() => toggleDocSelection(doc.name)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm truncate flex-1">{doc.name}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setPreviewDoc(doc.name)
                      }}
                      className="p-1 text-gray-400 hover:text-primary-600"
                      title="預覽"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* PDF 預覽區 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                {previewDoc ? `📄 ${previewDoc}` : '文件預覽'}
              </h3>
              {previewDoc && (
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              {previewDoc ? (
                <FilePreview 
                  filename={previewDoc} 
                  apiBase={apiBase} 
                  targetPage={pdfTargetPage}
                  highlightText={pdfHighlightText}
                  onPageChange={(page) => setPdfTargetPage(page)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">點擊文件預覽內容</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 訊息氣泡組件
function MessageBubble({ message, onDocClick, onSourceClick }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const copyContent = async () => {
    const text = typeof message.content === 'string' 
      ? message.content 
      : message.content.find(c => c.type === 'text')?.text || ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // 獲取文字內容
  const getTextContent = () => {
    if (typeof message.content === 'string') return message.content
    return message.content?.find(c => c.type === 'text')?.text || ''
  }

  return (
    <div className={clsx('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* 頭像 */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser 
          ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* 內容 */}
      <div className={clsx('flex flex-col gap-2 max-w-[75%]', isUser && 'items-end')}>
        {/* 使用的文件 */}
        {isUser && message.selectedDocs?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.selectedDocs.map(doc => (
              <span 
                key={doc}
                onClick={() => onDocClick?.(doc)}
                className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded cursor-pointer hover:bg-primary-200"
              >
                📄 {doc}
              </span>
            ))}
          </div>
        )}
        
        {/* 附件預覽 - 圖片和檔案 */}
        {isUser && message.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((att, idx) => (
              <div key={idx} className="relative">
                {att.type === 'image' && att.preview ? (
                  <img 
                    src={att.preview}
                    alt={att.name}
                    className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-200 dark:border-gray-600 object-cover"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-2 text-sm">
                    <span className="text-lg">
                      {att.mimeType?.includes('pdf') ? '📕' : 
                       att.mimeType?.includes('word') ? '📘' : 
                       att.mimeType?.includes('excel') || att.mimeType?.includes('sheet') ? '📗' : '📄'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 max-w-[150px] truncate">{att.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* 處理步驟 (保存的思考過程) */}
        {(message.processSteps?.length > 0 || message.steps?.length > 0) && (
          <ProcessSteps steps={message.processSteps || message.steps} isProcessing={false} />
        )}
        
        {/* 訊息內容 */}
        {getTextContent() && (
          <div className={clsx('message-bubble', isUser ? 'message-user' : 'message-assistant')}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{getTextContent()}</p>
            ) : (
              <div className="prose-chat">
                <ReactMarkdown>{getTextContent()}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* 來源 */}
        {message.sources?.length > 0 && (
          <div className="space-y-2 w-full">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              來源 ({message.sources.length})
            </p>
            <div className="grid gap-2">
              {message.sources.slice(0, 5).map((src, idx) => (
                <SourceCard 
                  key={idx} 
                  source={src} 
                  onSourceClick={onSourceClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* 操作按鈕和 Token 使用量 */}
        {!isUser && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={copyContent}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
              title="複製"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <span className="text-xs text-gray-400">
              {message.timestamp?.toLocaleTimeString()}
            </span>
            
            {/* Token 使用量顯示 */}
            {message.usage && message.usage.total_tokens > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                <span title="Token 使用量">
                  📊 {message.usage.total_tokens.toLocaleString()} tokens
                </span>
                {message.usage.estimated_cost_usd > 0 && (
                  <span title="估計成本" className="text-amber-500">
                    💰 ${message.usage.estimated_cost_usd.toFixed(4)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface
