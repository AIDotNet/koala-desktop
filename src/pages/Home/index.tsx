import React, { useState, useEffect, useCallback } from 'react'
import { Layout, Button, Typography, Input, Space, Tooltip, message } from 'antd'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  MessageSquare,
  Plus,
  Menu,
  Settings,
  User,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Edit3,
  MoreHorizontal
} from 'lucide-react'
import ChatArea from '@/components/ChatArea/index'
import SessionMenu from '@/components/SessionMenu'
import ModelSelector from '@/components/ModelSelector'
import { Message } from '@/types/chat'
import { UserMessageContent } from '@/types/chat'
import { chatSessionDB, ChatSession } from '@/utils/indexedDB'
import { Provider } from '@/types/model'
import { providerDB } from '@/utils/providerDB'
import { createStyles } from '@/theme'
import { v4 as uuidv4 } from 'uuid'
import { AIMessageService } from '@/services/AIMessageService'

const { Sider, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

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

  const [collapsed, setCollapsed] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [providersVersion, setProvidersVersion] = useState(0) // 用于强制重新加载providers
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]) // 新增：当前会话的消息列表
  const aiMessageService = AIMessageService.getInstance()
  const [streamingMessages, setStreamingMessages] = useState<{ [key: string]: Message }>({})
  const styles = createStyles(isDarkTheme);

  // 优化的暗黑主题颜色变量
  const theme = {
    colors: {
      // 背景色系
      bg: {
        primary: isDarkTheme ? '#121218' : '#f9fafb',
        secondary: isDarkTheme ? '#1e1e2a' : '#ffffff',
        tertiary: isDarkTheme ? '#262636' : '#f3f4f6',
        accent: isDarkTheme ? '#2a2a40' : '#e5e7eb',
      },
      // 文字色系
      text: {
        primary: isDarkTheme ? '#f0f0f8' : '#1f2937',
        secondary: isDarkTheme ? '#c0c0cf' : '#6b7280',
        tertiary: isDarkTheme ? '#8e8ea0' : '#9ca3af',
        accent: isDarkTheme ? '#6366f1' : '#3b82f6',
      },
      // 边框色系
      border: {
        light: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
        medium: isDarkTheme ? 'rgba(255, 255, 255, 0.12)' : '#d1d5db',
      },
      // 按钮颜色
      button: {
        primary: '#6366f1',
        primaryHover: '#4f46e5',
      }
    },
    // 阴影
    shadow: {
      card: isDarkTheme ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    // 玻璃态效果
    glass: {
      background: isDarkTheme ? 'rgba(30, 30, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
    }
  };

  // 判断是否在欢迎页面模式
  const isWelcomeMode = !sessionId

  // 监听 sessionId 变化，确保切换会话时清空消息记录
  useEffect(() => {
    if (!sessionId) {
      // 如果没有 sessionId（回到首页），立即清空消息记录
      setSessionMessages([])
      setStreamingMessages({})
    }
  }, [sessionId])

  // 新增：加载会话消息的方法，使用useCallback包装
  const loadSessionMessages = useCallback(async (sid: string) => {
    try {
      // 先清空当前消息记录和流式消息
      setSessionMessages([])
      setStreamingMessages({})
      
      const messages = await chatSessionDB.getMessagesForSession(sid)
      setSessionMessages(messages)
    } catch (error) {
      console.error('Failed to load session messages:', error)
      message.error('加载会话消息失败')
      // 出错时也要清空消息记录
      setSessionMessages([])
      setStreamingMessages({})
    }
  }, []);

  // 初始化服务商数据 - 从数据库加载用户配置
  useEffect(() => {
    const loadProviders = async () => {
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
    }

    loadProviders()
  }, [providersVersion]) // 当providersVersion变化时重新加载

  // 监听窗口焦点事件，当从设置页面返回时重新加载providers
  useEffect(() => {
    const handleFocus = () => {
      // 延迟一点时间再重新加载，确保设置页面的数据已经保存
      setTimeout(() => {
        setProvidersVersion(prev => prev + 1)
      }, 100)
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // 初始化数据库和加载会话
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await chatSessionDB.init()
        const sessions = await chatSessionDB.getAllSessions()
        setChatSessions(sessions)
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize database:', error)
        message.error('数据库初始化失败')
      }
    }

    initializeDB()
  }, [])

  // 验证会话是否存在，如果不存在则回到首页
  useEffect(() => {
    if (isInitialized && sessionId && chatSessions.length > 0) {
      const sessionExists = chatSessions.some(session => session.id === sessionId)
      if (!sessionExists) {
        console.log('会话不存在，回到首页')
        // 清空消息记录
        setSessionMessages([])
        setStreamingMessages({})
        navigate('/')
      } else {
        // 会话存在，加载该会话的消息
        loadSessionMessages(sessionId)
      }
    } else if (isInitialized && !sessionId) {
      // 如果没有会话ID（在首页），清空消息记录
      setSessionMessages([])
      setStreamingMessages({})
    }
  }, [isInitialized, sessionId, chatSessions, navigate, loadSessionMessages])

  const currentSession = chatSessions.find(session => session.id === sessionId)

  // 监听路由变化，检查URL中是否有初始消息
  useEffect(() => {
    const checkInitialMessageInURL = async () => {
      // 使用之前安全获取的location对象
      const params = new URLSearchParams(location.search);
      const initialMessage = params.get('q') || params.get('query') || initialQuery;

      if (initialMessage && initialMessage.trim() !== '') {
        debugger;
        if (!sessionId) {
          // 如果没有活跃会话，创建一个新会话
          try {
            const newSession = await chatSessionDB.createDefaultSession();
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
          handleSendMessage(initialMessage);
        }

        // 清除URL中的查询参数，仅在Router上下文中执行
        if (typeof navigate === 'function' && location.pathname) {
          navigate(location.pathname, { replace: true });
        }
      }
    };

    checkInitialMessageInURL();
  }, [location, sessionId, initialQuery, navigate]);

  // 更新页面标题
  useEffect(() => {
    if (currentSession) {
      document.title = `${currentSession.title} - Koala AI`;
    } else {
      document.title = 'Koala AI';
    }
  }, [currentSession]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue;
    if (!text.trim()) return;

    // 检查是否有可用的模型
    if (!selectedModel || providers.length === 0 || providers.every(p => p.models.length === 0)) {
      message.error('请先在设置中启用至少一个模型');
      return;
    }

    debugger;

    let targetSessionId = sessionId;

    // 如果在欢迎页面模式或没有会话ID，创建新会话
    if (isWelcomeMode || !targetSessionId) {
      try {
        const newSession = await chatSessionDB.createDefaultSession();
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

      // // 重新加载会话数据
      // const updatedSessions = await chatSessionDB.getAllSessions();
      // setChatSessions(updatedSessions);

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

          initialAssistantMessage.content = messageWithCorrect.content;

          // 更新流式消息状态
          setStreamingMessages(prev => ({
            ...prev,
            [assistantMessageId]: initialAssistantMessage
          }));

        }

        // 更新ai会话
        await chatSessionDB.updateMessage(targetSessionId,initialAssistantMessage.id,initialAssistantMessage);

        await loadSessionMessages(targetSessionId);
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
    }
  };

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
      
      const newSession = await chatSessionDB.createDefaultSession()
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

  // 渲染输入框组件
  const renderInputArea = () => (
    <div style={{ position: 'relative' }}>
      <div style={{
        background: isDarkTheme ? '#121218' : '#f9fafb',
        backdropFilter: theme.glass.backdropFilter,
        borderRadius: '16px',
        border: `1px solid ${isInputFocused ? theme.colors.button.primary : theme.colors.border.medium}`,
        padding: '16px',
        boxShadow: isInputFocused ?
          `0 0 0 2px ${isDarkTheme ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}` :
          theme.shadow.card,
        transition: 'all 0.3s ease',
      }}>
        <TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="问点什么？可以通过@来引用工具、文件、资源..."
          autoSize={{ minRows: 1, maxRows: 6 }}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          style={{
            background: 'transparent',
            border: 'none',
            resize: 'none',
            color: theme.colors.text.primary,
            padding: 0,
            boxShadow: 'none',
          }}
        />

        {/* 底部操作栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: `1px solid ${theme.colors.border.light}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              type="text"
              size="small"
              icon={<Paperclip size={16} style={{ color: theme.colors.text.tertiary }} />}
              style={{
                color: theme.colors.text.tertiary,
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '128px' }}>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                providers={providers}
                disabled={providers.length === 0 || providers.every(p => p.models.length === 0)}
              />
            </div>
            <Button
              type="primary"
              icon={<Send size={18} />}
              onClick={handleSendButtonClick}
              disabled={!inputValue.trim() || isLoading}
              loading={isLoading}
              style={{
                background: theme.colors.button.primary,
                borderColor: theme.colors.button.primary,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                height: '40px',
                width: '80px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // 如果还没有初始化完成，显示加载状态
  if (!isInitialized) {
    return (
      <div style={{
        height: '100%',
        background: theme.colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: theme.colors.text.primary }}>加载中...</div>
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
                      ? (isDarkTheme ? 'rgba(99, 102, 241, 0.2)' : '#e5e7eb')
                      : theme.colors.bg.tertiary,
                    borderRadius: '10px',
                    padding: '12px',
                    boxShadow: theme.shadow.card,
                    border: `1px solid ${sessionId === session.id
                      ? (isDarkTheme ? 'rgba(99, 102, 241, 0.3)' : '#d1d5db')
                      : theme.colors.border.light}`,
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
                          ? (isDarkTheme ? '#a5b4fc' : '#1f2937')
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
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 底部设置按钮 */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${theme.colors.border.light}`
      }}>
        <Button
          type="text"
          icon={<Settings size={16} style={{ color: theme.colors.text.tertiary }} />}
          style={{
            width: '100%',
            textAlign: 'left',
            color: theme.colors.text.secondary,
            borderRadius: '10px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 12px',
            transition: 'all 0.3s ease',
            background: 'transparent',
          }}
          onClick={handleOpenSettings}
          onMouseOver={(e) => {
            e.currentTarget.style.background = theme.colors.bg.accent;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ marginLeft: '8px' }}>设置</span>
        </Button>
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
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
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
      handleSendMessage(content);
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
              background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
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

              <div style={{ width: '100%', maxWidth: '1024px' }}>
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
                    maxWidth: '1024px',
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