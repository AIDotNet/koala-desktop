import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { message } from 'antd'
import { ThemeProvider } from '@lobehub/ui'
import ChatArea from '@/components/ChatArea'
import ChatInput from '@/components/ChatInput'
import { 
  useSessionManager, 
  useTabManager, 
  useAppInitializer,
  useCurrentSession,
  useModelInfo,
  useAppInfo
} from '@/stores/hooks'
import { useSessionStore } from '@/stores/sessionStore'

/**
 * 使用 Zustand 状态管理的 Home 组件
 * 展示如何使用新的状态管理系统
 */
const HomeWithZustand: React.FC = () => {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const [inputValue, setInputValue] = useState('')
  
  // 使用组合 hooks
  const { isInitialized, isDarkTheme, initializeApp } = useAppInitializer()
  const {
    currentSession,
    sessions,
    selectedModel,
    switchToSession,
    deleteSessionWithCleanup,
    handleModelChange,
    getSelectedModelData,
    getSelectedProvider,
    loadSessions,
  } = useSessionManager()
  
  const { navigateToSession } = useTabManager()
  
  // 使用选择器 hooks 优化重渲染
  const { sessionMessages, streamingMessages, isLoadingMessages } = useCurrentSession()
  const { providers, getEnabledModels } = useModelInfo()
  const { isLoading } = useAppInfo()

  // 应用初始化
  useEffect(() => {
    if (!isInitialized) {
      initializeApp()
    }
  }, [isInitialized, initializeApp])

  // 处理会话切换
  useEffect(() => {
    if (isInitialized && sessionId) {
      // 验证会话是否存在
      const sessionExists = sessions.some(session => session.id === sessionId)
      if (!sessionExists) {
        console.log('会话不存在，回到首页')
        navigate('/')
        return
      }
      
      // 切换到指定会话（自动同步模型）
      switchToSession(sessionId)
    } else if (isInitialized && !sessionId) {
      // 清空当前会话
      switchToSession(null)
    }
  }, [isInitialized, sessionId, sessions, switchToSession, navigate])

  // 处理新建会话
  const handleNewChat = async () => {
    try {
      const { createSession } = useSessionStore.getState()
      const newSession = await createSession(selectedModel)
      
      // 创建标签页并导航
      navigateToSession(newSession.id, newSession.title, (url) => {
        navigate(url)
      })
    } catch (error) {
      console.error('Failed to create new session:', error)
      message.error('创建新会话失败')
    }
  }

  // 处理删除会话
  const handleDeleteSession = async (sessionIdToDelete: string) => {
    try {
      await deleteSessionWithCleanup(sessionIdToDelete)
      
      // 如果删除的是当前会话，导航到首页
      if (sessionIdToDelete === sessionId) {
        navigate('/')
      }
      
      message.success('会话已删除')
    } catch (error) {
      console.error('Failed to delete session:', error)
      message.error('删除会话失败')
    }
  }

  // 处理文件上传
  const handleFileUpload = async (files: { name: string; path: string; size: number }[]) => {
    try {
      // 只记录文件，不将内容插入到输入框中
      console.log('已上传文件:', files.map(f => ({ name: f.name, path: f.path, size: f.size })))
      // 这里可以根据需要保存文件信息到状态或其他地方
      // 文件内容将在发送消息时读取和处理
    } catch (error) {
      console.error('处理文件失败:', error)
      message.error('处理文件失败')
    }
  }

  // 处理带文件的消息发送
  const handleSendWithFiles = async (messageText: string, files: { name: string; path: string; size: number }[]) => {
    if (!messageText.trim() && files.length === 0) return

    let finalMessage = messageText.trim()

    // 如果有文件，将文件内容添加到消息中
    if (files.length > 0) {
      try {
        const fileContents: string[] = []
        
        for (const file of files) {
          const content = await readFileContent(file)
          const fileInfo = `\n\n**文件: ${file.name}**\n\`\`\`${getFileLanguage(file.name)}\n${content}\n\`\`\`\n`
          fileContents.push(fileInfo)
        }
        
        finalMessage = messageText + fileContents.join('')
      } catch (error) {
        console.error('读取文件失败:', error)
        message.error('读取文件失败')
        return
      }
    }

    // 使用最终消息调用原有的发送逻辑
    setInputValue(finalMessage)
    await handleSendMessage()
  }

  // 读取文件内容 - 使用 Electron API
  const readFileContent = async (file: { name: string; path: string; size: number }): Promise<string> => {
    try {
      // 检查是否在 Electron 环境中
      if (!window.electronAPI || !window.electronAPI.readFile) {
        throw new Error('文件读取功能仅在桌面应用中可用')
      }

      const result = await window.electronAPI.readFile(file.path)
      
      if (!result.success) {
        throw new Error(result.error || '文件读取失败')
      }

      return result.content || ''
    } catch (error) {
      console.error(`读取文件 ${file.name} 失败:`, error)
      throw error
    }
  }

  // 根据文件扩展名获取语言标识
  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'vue': 'vue',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'bash',
      'bash': 'bash',
      'ps1': 'powershell',
      'bat': 'batch',
      'cmd': 'batch',
      'sql': 'sql',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'xml': 'xml',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'cfg': 'ini',
      'conf': 'ini',
      'md': 'markdown',
      'txt': 'text',
      'log': 'text',
      'dockerfile': 'dockerfile',
      'makefile': 'makefile',
      'cmake': 'cmake',
      'gradle': 'gradle'
    }
    return languageMap[ext || ''] || 'text'
  }

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return
    
    const content = inputValue.trim()
    setInputValue('') // 清空输入框
    
    if (!currentSession) {
      // 如果没有当前会话，创建新会话
      await handleNewChat()
      return
    }

    try {
      const { addMessage } = useSessionStore.getState()
      
      // 创建用户消息
      const userMessage = {
        id: Date.now().toString(),
        content: {
          text: content,
          files: [],
          links: [],
          think: false,
          search: false,
        },
        role: 'user' as const,
        timestamp: Date.now(),
        avatar: '',
        name: '用户',
        model_name: '',
        model_id: '',
        model_provider: '',
        status: 'sent' as const,
        error: '',
        usage: {
          tokens_per_second: 0,
          total_tokens: 0,
          generation_time: 0,
          first_token_time: 0,
          reasoning_start_time: 0,
          reasoning_end_time: 0,
          input_tokens: 0,
          output_tokens: 0,
        },
        conversationId: currentSession.id,
        is_variant: 0,
      }
      
      // 添加到会话
      await addMessage(currentSession.id, userMessage)
      
      // 这里可以添加调用 AI 服务的逻辑
      // ...
      
    } catch (error) {
      console.error('Failed to send message:', error)
      message.error('发送消息失败')
    }
  }

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 如果应用未初始化，显示加载状态
  if (!isInitialized) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在初始化应用...</p>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* 侧边栏 - 会话列表 */}
        <div className="flex-1 flex">
          <div className="w-80 bg-white/5 border-r border-white/10 backdrop-blur-sm">
            <div className="p-4">
              <button
                onClick={handleNewChat}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 mb-4"
              >
                新建会话
              </button>
              
              {/* 会话列表 */}
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                      session.id === sessionId
                        ? 'bg-white/10 border border-white/20'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      navigateToSession(session.id, session.title, (url) => {
                        navigate(url)
                      })
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {session.title}
                        </h3>
                        <p className="text-gray-400 text-sm truncate">
                          {session.lastMessage || '暂无消息'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {session.timestamp}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(session.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all duration-200"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 主聊天区域 */}
          <div className="flex-1 flex flex-col">
            {/* 聊天消息区域 */}
            <div className="flex-1 overflow-hidden">
              <ChatArea
                messages={sessionMessages}
                isLoading={isLoadingMessages}
                isDarkTheme={isDarkTheme}
              />
            </div>

            {/* 输入区域 */}
            <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
                onKeyPress={handleKeyPress}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                providers={providers}
                isLoading={isLoading}
                isDarkTheme={isDarkTheme}
                placeholder="问点什么？可以通过@来引用工具、文件、资源..."
                onFileUpload={handleFileUpload}
                onSendWithFiles={handleSendWithFiles}
              />
            </div>
          </div>
        </div>

        {/* 状态信息显示 */}
        {currentSession && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
            当前会话: {currentSession.title}
            {currentSession.selectedModel && (
              <span className="ml-2 text-blue-400">
                模型: {getSelectedModelData()?.displayName || currentSession.selectedModel}
              </span>
            )}
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}

export default HomeWithZustand 