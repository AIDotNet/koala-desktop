import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Layout, Button, Typography, Space, Tooltip, message } from 'antd'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  MessageSquare,
  Plus,
  Menu,
  Settings,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Edit3,
  MoreHorizontal
} from 'lucide-react'
import ChatArea from '@/components/ChatArea/index'
import SessionMenu from '@/components/SessionMenu'
import ModelSelector from '@/components/ModelSelector'
import ChatInput from '@/components/ChatInput'
import { AssistantMessage, Message } from '@/types/chat'
import { UserMessageContent } from '@/types/chat'
import { chatSessionDB, ChatSession } from '@/utils/indexedDB'
import { Provider } from '@/types/model'
import { providerDB } from '@/utils/providerDB'
import { createStyles } from '@/theme'
import { v4 as uuidv4 } from 'uuid'
import { AIMessageService } from '@/services/AIMessageService'

const { Sider, Content } = Layout
const { Title, Text } = Typography

// 性能优化：使用React.memo优化加载动画组件
const LoadingSpinner: React.FC<{ isDarkTheme: boolean }> = React.memo(({ isDarkTheme }) => {
  // 性能优化：使用useMemo缓存样式对象
  const spinnerStyle = useMemo(() => ({
    width: '48px',
    height: '48px',
    border: `3px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderTop: `3px solid ${isDarkTheme ? '#1890ff' : '#3b82f6'}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }), [isDarkTheme])

  const textStyle = useMemo(() => ({
    fontSize: '16px',
    color: isDarkTheme ? '#b3b3b3' : '#6b7280',
    fontWeight: '500',
    letterSpacing: '0.5px'
  }), [isDarkTheme])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px'
    }}>
      {/* 主要的旋转圆环 */}
      <div style={spinnerStyle} />
      
      {/* 加载文本 */}
      <div style={textStyle}>
        正在初始化...
      </div>
      
      {/* CSS 动画定义 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
})

interface HomeProps {
  isDarkTheme: boolean
  addSettingsTab?: () => void
  sessionId?: string
  onNavigate?: (url: string) => void
  initialQuery?: string // 新增：用于非Router上下文的初始查询参数
  onSessionTitleUpdate?: (sessionId: string) => void // 新增：会话标题更新回调
}

const Home: React.FC<HomeProps> = ({
  isDarkTheme,
  addSettingsTab,
  sessionId: propSessionId,
  onNavigate,
  initialQuery,
  onSessionTitleUpdate
}) => {
  // 优先使用props传入的sessionId，如果没有则使用useParams
  let sessionId: string | undefined
  let navigate: any = (path: string, options?: any) => { }
  let location: any = { search: '', pathname: '' }

  try {
    const params = useParams()
    const routerNavigate = useNavigate()
    const routerLocation = useLocation()

    sessionId = propSessionId || params.sessionId
    navigate = onNavigate || routerNavigate
    location = routerLocation
  } catch (error) {
    // 如果不在Router上下文中，使用props传入的值
    sessionId = propSessionId
    navigate = onNavigate || (() => { })
    // 为非Router上下文提供一个mock的location对象
    if (initialQuery) {
      location = { search: `?q=${initialQuery}` }
    }
  }

  const [collapsed, setCollapsed] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [providersVersion, setProvidersVersion] = useState(0) // 用于强制重新加载providers
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]) // 新增：当前会话的消息列表
  const aiMessageService = AIMessageService.getInstance()
  const [streamingMessages, setStreamingMessages] = useState<{ [key: string]: Message }>({})
  const styles = createStyles(isDarkTheme);

  // 性能优化：使用useMemo缓存主题配置
  const theme = useMemo(() => ({
    colors: {
      // 背景色系
      bg: {
        primary: isDarkTheme ? '#0f0f0f' : '#f9fafb',
        secondary: isDarkTheme ? '#1a1a1a' : '#ffffff',
        tertiary: isDarkTheme ? '#2a2a2a' : '#f3f4f6',
        accent: isDarkTheme ? '#333333' : '#e5e7eb',
      },
      // 文字色系
      text: {
        primary: isDarkTheme ? '#ffffff' : '#1f2937',
        secondary: isDarkTheme ? '#b3b3b3' : '#6b7280',
        tertiary: isDarkTheme ? '#808080' : '#9ca3af',
        accent: isDarkTheme ? '#1890ff' : '#3b82f6',
      },
      // 边框色系
      border: {
        light: isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : '#e5e7eb',
        medium: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#d1d5db',
      },
      // 按钮颜色
      button: {
        primary: '#1890ff',
        primaryHover: '#40a9ff',
      }
    },
    // 阴影
    shadow: {
      card: isDarkTheme ? '0 2px 8px rgba(0, 0, 0, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    // 玻璃态效果
    glass: {
      background: isDarkTheme ? 'rgba(26, 26, 26, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
    }
  }), [isDarkTheme]);

  // 判断是否在欢迎页面模式
  const isWelcomeMode = !sessionId

  // 性能优化：使用useCallback优化函数
  const clearSessionData = useCallback(() => {
    setSessionMessages([])
    setStreamingMessages({})
  }, [])

  // 监听 sessionId 变化，确保切换会话时清空消息记录
  useEffect(() => {
    if (!sessionId) {
      // 如果没有 sessionId（回到首页），立即清空消息记录
      clearSessionData()
    }
  }, [sessionId, clearSessionData])

  // 性能优化：使用useCallback包装加载会话消息的方法
  const loadSessionMessages = useCallback(async (sid: string) => {
    try {
      // 先清空当前消息记录和流式消息
      clearSessionData()

      const messages = await chatSessionDB.getMessagesForSession(sid)
      setSessionMessages(messages)
    } catch (error) {
      console.error('Failed to load session messages:', error)
      message.error('加载会话消息失败')
      // 出错时也要清空消息记录
      clearSessionData()
    }
  }, [clearSessionData]);

  // 性能优化：使用useCallback优化providers加载
  const loadProviders = useCallback(async () => {
    try {
      // 首先尝试从数据库加载用户配置的提供商
      let dbProviders = await providerDB.getAllProviders()

      // 如果数据库为空，初始化默认提供商
      if (dbProviders.length === 0) {
        dbProviders = await providerDB.initializeDefaultProviders()
      }

      // 只保留启用的提供商，并且只保留启用的模型
      const enabledProviders = dbProviders
        .filter(provider => provider.enabled)
        .map(provider => ({
          ...provider,
          models: provider.models.filter(model => model.enabled)
        }))
        .filter(provider => provider.models.length > 0) // 只保留有启用模型的提供商

      setProviders(enabledProviders)

      // 如果当前没有选中模型，或者选中的模型不在启用列表中，自动选择第一个可用模型
      const allEnabledModels = enabledProviders.flatMap(p => p.models)
      if (!selectedModel || !allEnabledModels.find(m => m.id === selectedModel)) {
        if (allEnabledModels.length > 0) {
          setSelectedModel(allEnabledModels[0].id)
        }
      }

    } catch (error) {
      console.error('Failed to load provider data:', error)
      message.error('加载提供商数据失败')

      // 如果加载失败，使用默认的 OpenAI 提供商作为回退
      const fallbackProviders: Provider[] = [
        {
          id: 'openai',
          name: 'openai',
          displayName: 'OpenAI',
          description: 'OpenAI 官方 API 服务',
          apiUrl: 'https://api.openai.com/v1',
          apiKey: '',
          enabled: true,
          icon: 'OpenAI',
          website: 'https://openai.com',
          models: [
            {
              id: 'gpt-4-turbo',
              displayName: 'GPT-4 Turbo',
              description: '最新的 GPT-4 Turbo 模型具备视觉功能',
              provider: 'openai',
              type: 'chat',
              enabled: true,
              contextWindowTokens: 128000,
              maxOutput: 4096,
              abilities: {
                functionCall: true,
                vision: true
              }
            }
          ]
        }
      ]
      setProviders(fallbackProviders)
    }
  }, [selectedModel])

  // 初始化服务商数据 - 从数据库加载用户配置
  useEffect(() => {
    loadProviders()
  }, [providersVersion, loadProviders]) // 当providersVersion变化时重新加载

  // 性能优化：使用useCallback优化窗口焦点处理
  const handleWindowFocus = useCallback(() => {
    // 延迟一点时间再重新加载，确保设置页面的数据已经保存
    setTimeout(() => {
      setProvidersVersion(prev => prev + 1)
    }, 100)
  }, [])

  // 监听窗口焦点事件，当从设置页面返回时重新加载providers
  useEffect(() => {
    window.addEventListener('focus', handleWindowFocus)
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [handleWindowFocus])

  // 性能优化：使用useCallback优化数据库初始化
  const initializeDB = useCallback(async () => {
    try {
      await chatSessionDB.init()
      const sessions = await chatSessionDB.getAllSessions()
      setChatSessions(sessions)
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize database:', error)
      message.error('数据库初始化失败')
    }
  }, [])

  // 初始化数据库和加载会话
  useEffect(() => {
    initializeDB()
  }, [initializeDB])

  // 性能优化：使用useMemo缓存当前会话
  const currentSession = useMemo(() => 
    chatSessions.find(session => session.id === sessionId), 
    [chatSessions, sessionId]
  )

  // 性能优化：组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 清理流式消息状态
      setStreamingMessages({})
      // 清理AI服务资源
      aiMessageService.cleanup()
      // 清理数据库缓存
      if (chatSessionDB && typeof chatSessionDB.clearCache === 'function') {
        chatSessionDB.clearCache()
      }
    }
  }, [aiMessageService])

  // 验证会话是否存在，如果不存在则回到首页
  useEffect(() => {
    if (isInitialized && sessionId && chatSessions.length > 0) {
      const sessionExists = chatSessions.some(session => session.id === sessionId)
      if (!sessionExists) {
        console.log('会话不存在，回到首页')
        // 清空消息记录
        clearSessionData()
        navigate('/')
      } else {
        // 会话存在，加载该会话的消息
        loadSessionMessages(sessionId)

        // 恢复该会话的模型选择
        if (currentSession?.selectedModel && currentSession.selectedModel !== selectedModel) {
          // 验证模型是否仍然可用
          const allEnabledModels = providers.flatMap(p => p.models)
          const modelExists = allEnabledModels.find(m => m.id === currentSession.selectedModel)
          if (modelExists) {
            setSelectedModel(currentSession.selectedModel)
          }
        }
      }
    } else if (isInitialized && !sessionId) {
      // 如果没有会话ID（在首页），清空消息记录
      clearSessionData()
    }
  }, [isInitialized, sessionId, chatSessions, navigate, loadSessionMessages, providers, selectedModel, currentSession, clearSessionData])

  // 监听路由变化，检查URL中是否有初始消息
  useEffect(() => {
    const checkInitialMessageInURL = async () => {
      // 使用之前安全获取的location对象
      const params = new URLSearchParams(location.search);
      const initialMessage = params.get('q') || params.get('query') || initialQuery;

      if (initialMessage && initialMessage.trim() !== '') {
        if (!sessionId) {
          // 如果没有活跃会话，创建一个新会话
          try {
            const newSession = await chatSessionDB.createDefaultSession(selectedModel);
            const newSessionId = newSession.id;

            // 更新会话列表
            const updatedSessions = await chatSessionDB.getAllSessions();
            setChatSessions(updatedSessions);

            // 导航到新会话并带上初始消息
            navigate(`/chat/${newSessionId}`);

            // 保存初始消息以供会话加载后发送
            localStorage.setItem('initialMessage', initialMessage);
          } catch (error) {
            console.error('创建新会话失败:', error);
            message.error('创建新会话失败');
          }
        } else {
          // 如果已有活跃会话，直接发送消息
          setInputValue(initialMessage);
          handleSendWithFiles(initialMessage, []);
        }

        // 清除URL中的查询参数，仅在Router上下文中执行
        if (typeof navigate === 'function' && location.pathname) {
          navigate(location.pathname, { replace: true });
        }
      }
    };

    checkInitialMessageInURL();
  }, [location, sessionId, initialQuery, navigate, selectedModel]);

  // 更新页面标题
  useEffect(() => {
    if (currentSession) {
      document.title = `${currentSession.title} - Koala AI`;
    } else {
      document.title = 'Koala AI';
    }
  }, [currentSession]);

  // 性能优化：使用useCallback优化发送消息函数
  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputValue;
    if (!text.trim()) return;

    // 检查是否有可用的模型
    if (!selectedModel || providers.length === 0 || providers.every(p => p.models.length === 0)) {
      message.error('请先在设置中启用至少一个模型');
      return;
    }

    let targetSessionId = sessionId;

    // 如果在欢迎页面模式或没有会话ID，创建新会话
    if (isWelcomeMode || !targetSessionId) {
      try {
        const newSession = await chatSessionDB.createDefaultSession(selectedModel);
        targetSessionId = newSession.id;

        // 导航到新会话
        navigate(`/chat/${targetSessionId}`);

        // 更新会话列表
        const updatedSessions = await chatSessionDB.getAllSessions();
        setChatSessions(updatedSessions);
      } catch (error) {
        console.error('Failed to create new session:', error);
        message.error('创建会话失败');
        return;
      }
    }

    // 确保此时targetSessionId已定义
    if (!targetSessionId) {
      message.error('会话ID无效');
      return;
    }

    // 用户消息ID
    const userMessageId = uuidv4();

    // 创建用户消息
    const userMessage: Message = {
      id: userMessageId,
      content: {
        text: text,
        files: [],
        links: [],
        think: false,
        search: false
      },
      role: 'user',
      timestamp: Date.now(),
      avatar: '',
      name: '用户',
      model_name: '',
      model_id: '',
      model_provider: '',
      status: 'sent',
      error: '',
      usage: {
        tokens_per_second: 0,
        total_tokens: 0,
        generation_time: 0,
        first_token_time: 0,
        reasoning_start_time: 0,
        reasoning_end_time: 0,
        input_tokens: 0,
        output_tokens: 0
      },
      conversationId: targetSessionId,
      is_variant: 0
    };

    try {
      sessionMessages.push(userMessage);
      // 添加用户消息到数据库
      await chatSessionDB.addMessage(targetSessionId, userMessage);

      setInputValue('');
      setIsLoading(true);

      // 获取选中的模型和提供商
      const allModels = providers.flatMap(p => p.models);
      const selectedModelData = allModels.find(m => m.id === selectedModel);

      if (!selectedModelData) {
        message.error('未找到所选模型');
        setIsLoading(false);
        return;
      }

      const selectedProvider = providers.find(p => p.id === selectedModelData.provider);

      if (!selectedProvider) {
        message.error('未找到所选模型的提供商');
        setIsLoading(false);
        return;
      }

      // 准备助手消息的ID
      const assistantMessageId = uuidv4();

      // 创建一个初始的助手消息对象，确保正确设置 conversationId
      const initialAssistantMessage: AssistantMessage = {
        id: assistantMessageId,
        content: [
          {
            type: 'content',
            content: '',
            status: 'loading',
            timestamp: Date.now()
          }
        ],
        role: 'assistant',
        timestamp: Date.now(),
        avatar: '',
        name: 'AI助手',
        model_name: selectedModelData.displayName,
        model_id: selectedModelData.id,
        model_provider: selectedProvider.id,
        status: 'pending',
        error: '',
        usage: {
          tokens_per_second: 0,
          total_tokens: 0,
          generation_time: 0,
          first_token_time: 0,
          reasoning_start_time: 0,
          reasoning_end_time: 0,
          input_tokens: 0,
          output_tokens: 0
        },
        conversationId: targetSessionId,  // 确保设置正确的会话ID
        is_variant: 0
      };
      // 创建消息历史
      const messageHistory = [...sessionMessages, userMessage];

      // 使用 async iterator 处理流式消息
      try {
        // 获取流式消息生成器
        const messageStream = aiMessageService.streamMessageAsync(
          messageHistory,
          selectedModelData,
          selectedProvider,
          {
            temperature: 0.7,
            maxTokens: selectedModelData.maxOutput
          }
        );

        sessionMessages.push(initialAssistantMessage);
        // 添加初始助手消息到数据库
        await chatSessionDB.addMessage(targetSessionId, initialAssistantMessage);

        setStreamingMessages({
          [assistantMessageId]: initialAssistantMessage
        });

        // 使用 for await...of 迭代流式消息
        for await (const streamMessage of messageStream) {
          // 确保流式消息中的 conversationId 与目标会话ID一致
          const messageWithCorrect = {
            ...streamMessage,
            conversationId: targetSessionId,
            id: assistantMessageId
          };

          initialAssistantMessage.content = messageWithCorrect.content as any;

          // 更新流式消息状态
          setStreamingMessages(prev => ({
            ...prev,
            [assistantMessageId]: initialAssistantMessage
          }));

        }

        // 更新ai会话
        await chatSessionDB.updateMessage(targetSessionId, initialAssistantMessage.id, initialAssistantMessage);

        // await loadSessionMessages(targetSessionId);
      } catch (error: any) {
        console.error('AI请求失败:', error);
        message.error(`AI请求失败: ${error.message || '未知错误'}`);

        initialAssistantMessage.content = [
          {
            type: 'error',
            content: `请求失败: ${error.message || '未知错误'}`,
            status: 'error',
            timestamp: Date.now()
          }
        ]

        // 更新流式消息状态
        setStreamingMessages(prev => ({
          ...prev,
          [assistantMessageId]: initialAssistantMessage
        }));

        // 更新数据库
        await chatSessionDB.updateMessage(targetSessionId, assistantMessageId, initialAssistantMessage);

        // 延迟清除流式消息
        setTimeout(() => {
          setStreamingMessages(prev => {
            const newState = { ...prev };
            delete newState[assistantMessageId];
            return newState;
          });
        }, 500);

        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error('发送消息失败');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, selectedModel, providers, isWelcomeMode, sessionId, navigate, sessionMessages, aiMessageService]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = async () => {
    try {
      // 立即清空当前消息记录
      setSessionMessages([])
      setStreamingMessages({})

      const newSession = await chatSessionDB.createDefaultSession(selectedModel)
      const updatedSessions = await chatSessionDB.getAllSessions()
      setChatSessions(updatedSessions)
      navigate(`/chat/${newSession.id}`)
    } catch (error) {
      console.error('Failed to create new session:', error)
      message.error('创建新会话失败')
    }
  }

  const handleSessionClick = (sessionId: string) => {
    // 立即清空当前消息记录，避免显示上一个会话的消息
    setSessionMessages([])
    setStreamingMessages({})
    navigate(`/chat/${sessionId}`)
  }

  const handleEditSession = async (sessionId: string, newTitle: string) => {
    try {
      await chatSessionDB.updateSession(sessionId, { title: newTitle })
      const updatedSessions = await chatSessionDB.getAllSessions()
      setChatSessions(updatedSessions)

      // 通知父组件更新标签页标题
      if (onSessionTitleUpdate) {
        onSessionTitleUpdate(sessionId)
      }
    } catch (error) {
      console.error('Failed to edit session:', error)
      throw error
    }
  }

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    try {
      // 如果删除的是当前会话，先清空消息记录并导航到首页
      if (sessionIdToDelete === sessionId) {
        setSessionMessages([])
        setStreamingMessages({})
        navigate('/')
      }

      await chatSessionDB.deleteSession(sessionIdToDelete)
      const updatedSessions = await chatSessionDB.getAllSessions()
      setChatSessions(updatedSessions)
    } catch (error) {
      console.error('Failed to delete session:', error)
      throw error
    }
  }

  // 处理打开设置窗口
  const handleOpenSettings = async () => {
    try {
      // 如果有addSettingsTab函数，使用它来添加设置标签页
      if (addSettingsTab) {
        addSettingsTab()
        return
      }

      // 回退方案：尝试打开Electron设置窗口
      if (window.electronAPI && window.electronAPI.openSettingsWindow) {
        await window.electronAPI.openSettingsWindow()
      } else {
        // 如果不在 Electron 环境中，回退到路由导航
        navigate('/settings')
      }
    } catch (error) {
      console.error('Failed to open settings:', error)
      message.error('打开设置失败')
      // 出错时回退到路由导航
      navigate('/settings')
    }
  }

  // 按日期分组会话
  const groupSessionsByDate = () => {
    const groups: { [key: string]: ChatSession[] } = {}

    chatSessions.forEach(session => {
      const date = session.timestamp
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(session)
    })

    return groups
  }

  const sessionGroups = groupSessionsByDate()

  // 添加发送按钮点击处理函数
  const handleSendButtonClick = () => {
    handleSendMessage();
  };

  // 添加删除消息的处理函数
  const handleDeleteMessage = async (messageId: string) => {
    try {
      if (!sessionId) return;
      await chatSessionDB.deleteMessage(sessionId, messageId);

      // 重新加载消息
      await loadSessionMessages(sessionId);
      message.success('消息已删除');
    } catch (error) {
      console.error('删除消息失败:', error);
      message.error('删除消息失败');
    }
  };

  // 添加编辑消息的处理函数
  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      if (!sessionId) return;

      // 找到需要编辑的消息
      const messageToEdit = sessionMessages.find(msg => msg.id === messageId);
      if (!messageToEdit) {
        message.error('消息不存在');
        return;
      }

      let updatedMessage;

      if (messageToEdit.role === 'user') {
        // 更新用户消息内容
        updatedMessage = {
          ...messageToEdit,
          content: {
            ...(typeof messageToEdit.content === 'object' ? messageToEdit.content : {}),
            text: newContent
          }
        };
      } else {
        // 更新AI消息内容
        // 根据AI消息内容的格式来更新
        if (Array.isArray(messageToEdit.content)) {
          // 如果是数组格式，更新第一个内容块
          const updatedContent = [...messageToEdit.content];
          // 查找第一个内容块并更新
          const contentBlockIndex = updatedContent.findIndex(block => block.type === 'content');
          if (contentBlockIndex >= 0) {
            updatedContent[contentBlockIndex] = {
              ...updatedContent[contentBlockIndex],
              content: newContent
            };
          } else {
            // 如果没有内容块，添加一个
            const now = Date.now();
            updatedContent.push({
              type: 'content',
              content: newContent,
              status: 'success' as const,
              timestamp: now
            });
          }

          updatedMessage = {
            ...messageToEdit,
            content: updatedContent
          };
        } else {
          // 如果不是数组格式，直接替换内容
          updatedMessage = {
            ...messageToEdit,
            content: newContent
          };
        }
      }

      // 保存更新后的消息
      await chatSessionDB.updateMessage(sessionId, messageId, updatedMessage as Message);

      // 重新加载消息
      await loadSessionMessages(sessionId);
      message.success('消息已更新');
    } catch (error) {
      console.error('编辑消息失败:', error);
      message.error('编辑消息失败');
    }
  };

  // 添加重新生成AI消息的函数
  const handleRegenerateMessage = async (messageId: string) => {
    try {
      if (!sessionId) return;

      // 查找点击的消息
      const clickedMessage = sessionMessages.find(msg => msg.id === messageId);
      if (!clickedMessage) {
        message.error('无法找到对应的消息');
        return;
      }

      // 如果点击的是AI消息，找到对应的用户消息并直接重新生成回复
      if (clickedMessage.role === 'assistant') {
        // 查找这条AI消息之前的用户消息
        const userMessages = sessionMessages.filter(msg => msg.role === 'user');
        const assistantMessages = sessionMessages.filter(msg => msg.role === 'assistant');

        // 找出这条AI消息的索引
        const assistantIndex = assistantMessages.findIndex(msg => msg.id === messageId);
        if (assistantIndex < 0 || assistantIndex >= userMessages.length) {
          message.error('无法找到对应的用户消息');
          return;
        }

        // 获取对应的用户消息
        const userMessage = userMessages[assistantIndex];

        let userContent = '';
        // 处理不同类型的用户消息内容
        if (typeof userMessage.content === 'string') {
          userContent = userMessage.content;
        } else if (typeof userMessage.content === 'object') {
          // 安全地访问text属性
          const userMessageContent = userMessage.content as UserMessageContent;
          if (userMessageContent.text) {
            userContent = userMessageContent.text;
          }
        }

        if (!userContent) {
          message.error('用户消息内容为空');
          return;
        }

        // 删除当前AI消息以及之后的所有消息
        const messagesToDelete = sessionMessages.filter(msg => msg.timestamp >= clickedMessage.timestamp);

        // 先删除消息
        for (const msgToDelete of messagesToDelete) {
          await chatSessionDB.deleteMessage(sessionId, msgToDelete.id);
        }

        // 重新加载消息列表，此时应该只有用户消息，没有对应的AI消息
        await loadSessionMessages(sessionId);

        // 检查是否有可用的模型
        if (!selectedModel || providers.length === 0 || providers.every(p => p.models.length === 0)) {
          message.error('请先在设置中启用至少一个模型');
          return;
        }

        // 获取选中的模型和提供商
        const allModels = providers.flatMap(p => p.models);
        const selectedModelData = allModels.find(m => m.id === selectedModel);

        if (!selectedModelData) {
          message.error('未找到所选模型');
          return;
        }

        const selectedProvider = providers.find(p => p.id === selectedModelData.provider);

        if (!selectedProvider) {
          message.error('未找到所选模型的提供商');
          return;
        }

        setIsLoading(true);

        // 等待100ms,提供一个function 
        const wait = async () => {

          // 准备助手消息的ID
          const assistantMessageId = uuidv4();

          // 创建一个初始的助手消息对象
          const initialAssistantMessage: Message = {
            id: assistantMessageId,
            content: [
              {
                type: 'content',
                content: '',
                status: 'loading',
                timestamp: Date.now()
              }
            ],
            role: 'assistant',
            timestamp: Date.now(),
            avatar: '',
            name: 'AI助手',
            model_name: selectedModelData.displayName,
            model_id: selectedModelData.id,
            model_provider: selectedProvider.id,
            status: 'pending',
            error: '',
            usage: {
              tokens_per_second: 0,
              total_tokens: 0,
              generation_time: 0,
              first_token_time: 0,
              reasoning_start_time: 0,
              reasoning_end_time: 0,
              input_tokens: 0,
              output_tokens: 0
            },
            conversationId: sessionId,
            is_variant: 0
          };

          // 获取当前所有消息作为历史记录
          const messages = await chatSessionDB.getMessagesForSession(sessionId);

          setSessionMessages(messages);

          // 使用 async iterator 处理流式消息
          try {
            // 获取流式消息生成器
            const messageStream = aiMessageService.streamMessageAsync(
              messages,
              selectedModelData,
              selectedProvider,
              {
                temperature: 0.7,
                maxTokens: selectedModelData.maxOutput
              }
            );

            // 添加初始助手消息到数据库
            await chatSessionDB.addMessage(sessionId, initialAssistantMessage);

            // 重新加载消息数据
            await loadSessionMessages(sessionId);

            // 使用 for await...of 迭代流式消息
            for await (const streamMessage of messageStream) {
              // 确保流式消息中的 conversationId 与目标会话ID一致
              const messageWithCorrect = {
                ...streamMessage,
                conversationId: sessionId,
                id: assistantMessageId
              };

              initialAssistantMessage.content = messageWithCorrect.content;

              // 更新流式消息状态
              setStreamingMessages(prev => ({
                ...prev,
                [assistantMessageId]: initialAssistantMessage
              }));

            }

            // 更新initialAssistantMessage
            await chatSessionDB.updateMessage(sessionId, assistantMessageId, initialAssistantMessage);

            // 重新加载消息
            await loadSessionMessages(sessionId);


          } catch (error: any) {
            console.error('AI请求失败:', error);
            message.error(`AI请求失败: ${error.message || '未知错误'}`);

            // 创建错误消息
            const errorMessage: Message = {
              ...initialAssistantMessage,
              content: [
                {
                  type: 'error',
                  content: `请求失败: ${error.message || '未知错误'}`,
                  status: 'error',
                  timestamp: Date.now()
                }
              ],
              status: 'error',
              error: error.message || '未知错误'
            };

            // 更新流式消息状态
            setStreamingMessages(prev => ({
              ...prev,
              [assistantMessageId]: errorMessage
            }));

            // 更新数据库
            await chatSessionDB.updateMessage(sessionId, assistantMessageId, errorMessage);

            // 延迟清除流式消息
            setTimeout(() => {
              setStreamingMessages(prev => {
                const newState = { ...prev };
                delete newState[assistantMessageId];
                return newState;
              });
            }, 500);

            setIsLoading(false);
          }

          return new Promise(resolve => setTimeout(resolve, 100));
        }

        await wait();

        setIsLoading(false);
      }
      else if (clickedMessage.role === 'user') {
        let userContent = '';

        // 处理不同类型的用户消息内容
        if (typeof clickedMessage.content === 'string') {
          userContent = clickedMessage.content;
        } else if (typeof clickedMessage.content === 'object') {
          // 安全地访问text属性
          const userMessageContent = clickedMessage.content as UserMessageContent;
          if (userMessageContent.text) {
            userContent = userMessageContent.text;
          }
        }

        if (!userContent) {
          message.error('用户消息内容为空');
          return;
        }

        // 用户消息仍然使用handleSendMessage方法
        handleSendMessage(userContent);
      }
    } catch (error) {
      console.error('重新生成消息失败:', error);
      message.error('重新生成消息失败');
      setIsLoading(false);
    }
  };

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

    // 发送消息
    await handleSendMessage(finalMessage)
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

  // 渲染输入框组件
  const renderInputArea = () => (
    <ChatInput
      value={inputValue}
      onChange={setInputValue}
      onSend={handleSendButtonClick}
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
  );

  // 如果还没有初始化完成，显示加载状态
  if (!isInitialized) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: theme.colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <LoadingSpinner isDarkTheme={isDarkTheme} />
      </div>
    )
  }

  // 侧边栏样式
  const siderStyle = {
    overflow: 'hidden' as const,
    height: '100%',
    transition: 'all 0.3s ease',
    background: theme.colors.bg.secondary,
    borderRight: `1px solid ${theme.colors.border.light}`,
  };

  // 渲染侧边栏内容
  const renderSiderContent = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px' }}>
        <Button
          onClick={handleNewChat}
          style={{
            width: '100%',
            background: theme.colors.bg.tertiary,
            borderColor: theme.colors.border.light,
            color: theme.colors.text.primary,
            borderRadius: '10px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 12px',
            boxShadow: isDarkTheme ? '0 2px 6px rgba(0, 0, 0, 0.2)' : 'none',
          }}
          icon={<Edit3 size={16} style={{ color: theme.colors.text.tertiary }} />}
        >
          <span style={{
            marginLeft: '8px',
            color: theme.colors.text.secondary
          }}>新会话</span>
        </Button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px',
        ...styles.scrollbar
      }}>
        {Object.entries(sessionGroups).map(([date, sessions]) => (
          <div key={date} style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '12px',
              color: theme.colors.text.tertiary,
              marginBottom: '8px',
              padding: '0 8px',
            }}>
              {date}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="session-item"
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: sessionId === session.id
                      ? (isDarkTheme ? '#1a3a52' : '#E3F2FD')
                      : ('transparent'),
                    borderRadius: '10px',
                    padding: '3px',
                    fontSize: 12,
                    border: `1px solid ${sessionId === session.id
                      ? (isDarkTheme ? 'rgba(24, 144, 255, 0.3)' : '#90CAF9')
                      : 'transparent'}`,
                  }}
                  onClick={() => handleSessionClick(session.id)}
                  onMouseOver={(e) => {
                    const menuElement = e.currentTarget.querySelector('.session-menu-container') as HTMLElement;
                    if (menuElement) menuElement.style.opacity = '1';
                  }}
                  onMouseOut={(e) => {
                    const menuElement = e.currentTarget.querySelector('.session-menu-container') as HTMLElement;
                    if (menuElement && session.id !== sessionId) menuElement.style.opacity = '0';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Text
                      style={{
                        fontSize: '14px',
                        flex: 1,
                        color: sessionId === session.id
                          ? (isDarkTheme ? '#64b5f6' : '#1f2937')
                          : theme.colors.text.secondary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.title}
                    </Text>

                    <div
                      className="session-menu-container"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        opacity: sessionId === session.id ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                      }}>
                      <SessionMenu
                        session={session}
                        onEdit={handleEditSession}
                        onDelete={handleDeleteSession}
                        isDarkTheme={isDarkTheme}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );

  // 渲染顶部工具栏
  const renderHeader = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      borderBottom: `1px solid ${theme.colors.border.light}`,
      background: theme.colors.bg.secondary,
      backdropFilter: 'blur(10px)',
      height: 50,
      maxHeight: 50,
      minHeight: 50
    }}>
      <Space>
        <Tooltip title={collapsed ? "展开菜单" : "收起菜单"}>
          <Button
            type="text"
            icon={collapsed ?
              <PanelLeftOpen size={20} style={{ color: theme.colors.text.tertiary }} /> :
              <PanelLeftClose size={20} style={{ color: theme.colors.text.tertiary }} />
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Tooltip>
        {!isWelcomeMode && (
          <span
            style={{
              marginBottom: 0,
              fontSize: 22,
              fontWeight: 'bold',
              color: theme.colors.text.primary,
            }}
          >
            {currentSession?.title || '会话不存在'}
          </span>
        )}
      </Space>

      {/* 如果会话不存在，显示回到首页按钮 */}
      {!isWelcomeMode && !currentSession && (
        <Button
          type="primary"
          onClick={() => navigate('/')}
          style={{
            background: theme.colors.button.primary,
            borderColor: theme.colors.button.primary,
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
          }}
        >
          回到首页
        </Button>
      )}
    </div>
  );

  // 添加获取聊天区域内容的函数
  const getChatAreaContent = () => {
    // 创建会话消息的副本
    const allMessages = [...sessionMessages];

    // 合并流式消息，优先使用流式消息（它们是最新的）
    Object.values(streamingMessages).forEach(streamMessage => {
      const existingIndex = allMessages.findIndex(m => m.id === streamMessage.id);
      if (existingIndex >= 0) {
        // 替换现有消息
        allMessages[existingIndex] = streamMessage;
      } else {
        // 添加新消息
        allMessages.push(streamMessage);
      }
    });

    // 确保消息按时间戳排序
    allMessages.sort((a, b) => a.timestamp - b.timestamp);

    const handleMessageSend = (content: string) => {
      setInputValue(content);
      handleSendWithFiles(content, []);
    };

    return (
      <ChatArea
        isDarkTheme={isDarkTheme}
        messages={allMessages}
        isLoading={isLoading}
        onNewChat={handleNewChat}
        onSendMessage={handleMessageSend}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        onRegenerateMessage={handleRegenerateMessage}
      />
    );
  };

  // 处理模型变更的函数
  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId)

    // 如果当前有会话，保存模型选择到会话中
    if (sessionId) {
      try {
        await chatSessionDB.updateSessionModel(sessionId, modelId)
        console.log(`已保存模型选择 ${modelId} 到会话 ${sessionId}`)
      } catch (error) {
        console.error('保存模型选择失败:', error)
        // 即使保存失败，也不影响当前的模型选择
      }
    }
  }

  return (
    <Layout style={{ height: '100%', background: theme.colors.bg.primary }}>
      {/* 统一的左侧会话列表 */}
      <Sider
        width={240}
        collapsed={collapsed}
        collapsedWidth={0}
        trigger={null}
        style={siderStyle}
      >
        {renderSiderContent()}
      </Sider>

      <Layout style={{ flex: 1 }}>
        <Content style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: theme.colors.bg.primary
        }}>
          {/* 统一的顶部工具栏 */}
          {renderHeader()}

          {/* 欢迎页面内容 */}
          {isWelcomeMode ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 24px',
              background: isDarkTheme ? '#0f0f0f' : '#E3F2FD',
            }}>
              <Title
                level={1}
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: theme.colors.text.primary,
                  textAlign: 'center',
                }}
              >
                你好呀
              </Title>

              <Text style={{
                fontSize: '20px',
                color: theme.colors.text.secondary,
                marginBottom: '48px',
                textAlign: 'center',
              }}>
                嗨，我是KoalaAI，我可以帮助您解决一切难题！
              </Text>

              <div style={{ width: '100%',  }}>
                {renderInputArea()}
              </div>
            </div>
          ) : (
            // 会话模式内容
            <>
              {/* 聊天区域 */}
              {getChatAreaContent()}

              {/* 底部输入区域 - 只有在会话存在时才显示 */}
              {currentSession && (
                <div style={{
                }}>
                  <div style={{
                    margin: '24px',
                  }}>
                    {renderInputArea()}
                  </div>
                </div>
              )}
            </>
          )}
        </Content>
      </Layout>

    </Layout>
  );
}

export default Home 