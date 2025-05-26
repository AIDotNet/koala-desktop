import React, { useState, useEffect } from 'react'
import { Layout, Button, Typography, Input, Space, Tooltip, message } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
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
import ChatArea from '@/components/ChatArea'
import SessionMenu from '@/components/SessionMenu'
import ModelSelector from '@/components/ModelSelector'
import { Message } from '@/types/chat'
import { chatSessionDB, ChatSession } from '@/utils/indexedDB'
import { Provider } from '@/types/model'
import { providerDB } from '@/utils/providerDB'
import { createStyles } from '@/theme'

const { Sider, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

interface HomeProps {
  isDarkTheme: boolean
  addSettingsTab?: () => void
  sessionId?: string
  onNavigate?: (url: string) => void
}

const Home: React.FC<HomeProps> = ({ isDarkTheme, addSettingsTab, sessionId: propSessionId, onNavigate }) => {
  // 优先使用props传入的sessionId，如果没有则使用useParams
  let sessionId: string | undefined
  let navigate: any
  
  try {
    const params = useParams()
    const routerNavigate = useNavigate()
    sessionId = propSessionId || params.sessionId
    navigate = onNavigate || routerNavigate
  } catch (error) {
    // 如果不在Router上下文中，使用props传入的值
    sessionId = propSessionId
    navigate = onNavigate || (() => {})
  }

  const [collapsed, setCollapsed] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [providersVersion, setProvidersVersion] = useState(0) // 用于强制重新加载providers

  const styles = createStyles(isDarkTheme);

  // 判断是否在欢迎页面模式
  const isWelcomeMode = !sessionId

  // 初始化服务商数据 - 从数据库加载用户配置
  useEffect(() => {
    const loadProviders = async () => {
      try {
        // 首先尝试从数据库加载用户配置的提供商
        let dbProviders = await providerDB.getAllProviders()
        
        // 如果数据库为空，初始化默认提供商
        if (dbProviders.length === 0) {
          console.log('数据库为空，初始化默认提供商...')
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
            console.log('自动选择模型:', allEnabledModels[0].displayName)
          }
        }
        
        console.log('已加载启用的提供商数据:', enabledProviders.length, '个提供商')
        console.log('启用的提供商列表:', enabledProviders.map((p: Provider) => 
          `${p.displayName} (${p.models.length} 个启用模型)`
        ))
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
        navigate('/')
      }
    }
  }, [isInitialized, sessionId, chatSessions, navigate])

  const currentSession = chatSessions.find(session => session.id === sessionId)

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // 检查是否有可用的模型
    if (!selectedModel || providers.length === 0 || providers.every(p => p.models.length === 0)) {
      message.error('请先在设置中启用至少一个模型')
      return
    }

    let targetSessionId = sessionId

    // 如果在欢迎页面模式，创建新会话
    if (isWelcomeMode) {
      try {
        const newSession = await chatSessionDB.createDefaultSession()
        targetSessionId = newSession.id
        
        // 导航到新会话
        navigate(`/chat/${targetSessionId}`)
        
        // 更新会话列表
        const updatedSessions = await chatSessionDB.getAllSessions()
        setChatSessions(updatedSessions)
      } catch (error) {
        console.error('Failed to create new session:', error)
        message.error('创建会话失败')
        return
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: {
        text: inputValue,
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
      conversationId: targetSessionId!,
      is_variant: 0
    }

    try {
      // 添加用户消息到数据库
      await chatSessionDB.addMessage(targetSessionId!, userMessage)
      
      // 更新会话标题（如果是第一条消息）
      const session = await chatSessionDB.getSession(targetSessionId!)
      if (session && session.messages.length === 1) {
        const newTitle = inputValue.slice(0, 20) + (inputValue.length > 20 ? '...' : '')
        await chatSessionDB.updateSession(targetSessionId!, { title: newTitle })
      }

      // 重新加载会话数据
      const updatedSessions = await chatSessionDB.getAllSessions()
      setChatSessions(updatedSessions)

      setInputValue('')
      setIsLoading(true)

      // 模拟AI回复
      setTimeout(async () => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: [
            {
              type: 'content',
              content: `这是一个模拟的AI回复（使用模型：${selectedModel}）。在实际应用中，这里会调用真实的AI API来生成回复。`,
              status: 'success',
              timestamp: Date.now()
            }
          ],
          role: 'assistant',
          timestamp: Date.now(),
          avatar: '',
          name: 'Assistant',
          model_name: selectedModel,
          model_id: selectedModel,
          model_provider: 'openai',
          status: 'sent',
          error: '',
          usage: {
            tokens_per_second: 25,
            total_tokens: 100,
            generation_time: 4000,
            first_token_time: 300,
            reasoning_start_time: 0,
            reasoning_end_time: 0,
            input_tokens: 15,
            output_tokens: 85
          },
          conversationId: targetSessionId!,
          is_variant: 0
        }

        try {
          await chatSessionDB.addMessage(targetSessionId!, assistantMessage)
          const updatedSessions = await chatSessionDB.getAllSessions()
          setChatSessions(updatedSessions)
        } catch (error) {
          console.error('Failed to save assistant message:', error)
          message.error('保存消息失败')
        }
        
        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to send message:', error)
      message.error('发送消息失败')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = async () => {
    try {
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
    navigate(`/chat/${sessionId}`)
  }

  const handleEditSession = async (sessionId: string, newTitle: string) => {
    try {
      await chatSessionDB.updateSession(sessionId, { title: newTitle })
      const updatedSessions = await chatSessionDB.getAllSessions()
      setChatSessions(updatedSessions)
    } catch (error) {
      console.error('Failed to edit session:', error)
      throw error
    }
  }

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    try {
      // 如果删除的是当前会话，先导航到首页
      if (sessionIdToDelete === sessionId) {
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

  // 如果还没有初始化完成，显示加载状态
  if (!isInitialized) {
    return (
      <div style={{
        height: '100%',
        background: isDarkTheme ? '#0a0a0f' : '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}>加载中...</div>
      </div>
    )
  }

  // 欢迎页面模式 - 输入框在中间
  if (isWelcomeMode) {
    const siderStyle = {
      overflow: 'hidden' as const,
      height: '100%',
      transition: 'all 0.3s ease',
      background: isDarkTheme ? '#1a1a24' : '#ffffff',
      borderRight: `1px solid ${isDarkTheme ? '#3a3a4a' : '#e5e7eb'}`,
    };

    return (
      <Layout style={{ height: '100%', background: isDarkTheme ? '#0a0a0f' : '#f5f5f5' }}>
        {/* 左侧会话列表 */}
        <Sider
          width={280}
          collapsed={collapsed}
          collapsedWidth={0}
          trigger={null}
          style={siderStyle}
        >
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 顶部新会话按钮 */}
            <div style={{ padding: '16px' }}>
              <Button
                onClick={handleNewChat}
                style={{
                  width: '100%',
                  background: isDarkTheme ? '#2a2a3a' : '#ffffff',
                  borderColor: isDarkTheme ? '#3a3a4a' : '#d1d5db',
                  color: isDarkTheme ? '#ffffff' : '#1f2937',
                  borderRadius: '8px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '0 12px',
                }}
                icon={<Edit3 size={16} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
              >
                <span style={{ 
                  marginLeft: '8px', 
                  color: isDarkTheme ? '#e0e0e8' : '#6b7280' 
                }}>新会话</span>
              </Button>
            </div>

            {/* 会话列表 */}
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
                    color: isDarkTheme ? '#9ca3af' : '#6b7280',
                    marginBottom: '8px',
                    padding: '0 8px',
                  }}>
                    {date}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        style={{
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: isDarkTheme ? '#374151' : '#f3f4f6',
                          borderRadius: '8px',
                          padding: '12px',
                        }}
                        onClick={() => handleSessionClick(session.id)}
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
                              color: isDarkTheme ? '#d1d5db' : '#374151',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {session.title}
                          </Text>
                          
                          <div style={{
                            opacity: 0,
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
              borderTop: `1px solid ${isDarkTheme ? '#3a3a4a' : '#e5e7eb'}` 
            }}>
              <Button
                type="text"
                icon={<Settings size={16} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  color: isDarkTheme ? '#e0e0e8' : '#6b7280',
                  borderRadius: '8px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '0 12px',
                }}
                onClick={handleOpenSettings}
              >
                <span style={{ marginLeft: '8px' }}>设置</span>
              </Button>
            </div>
          </div>
        </Sider>

        {/* 主内容区域 - 欢迎页面 */}
        <Layout style={{ flex: 1 }}>
          <Content style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            background: isDarkTheme ? '#0a0a0f' : '#f9fafb' 
          }}>
            {/* 顶部工具栏 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderBottom: `1px solid ${isDarkTheme ? '#3a3a4a' : '#e5e7eb'}`,
              background: isDarkTheme ? '#0a0a0f' : '#ffffff',
            }}>
              <Space>
                <Tooltip title={collapsed ? "展开菜单" : "收起菜单"}>
                  <Button
                    type="text"
                    icon={collapsed ? 
                      <PanelLeftOpen size={20} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} /> : 
                      <PanelLeftClose size={20} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />
                    }
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                </Tooltip>
              </Space>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 24px',
            }}>

              <Title 
                level={1} 
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: isDarkTheme ? '#ffffff' : '#1f2937',
                  textAlign: 'center',
                }}
              >
                你好呀
              </Title>
              
              <Text style={{
                fontSize: '20px',
                color: isDarkTheme ? '#d1d5db' : '#6b7280',
                marginBottom: '48px',
                textAlign: 'center',
              }}>
                今天你想问点什么？
              </Text>

              <div style={{ width: '100%', maxWidth: '1024px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderRadius: '16px',
                    border: `1px solid ${isDarkTheme ? '#4b5563' : '#d1d5db'}`,
                    padding: '16px',
                  }}>
                    <TextArea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="问点什么？可以通过@来引用工具、文件、资源..."
                      autoSize={{ minRows: 1, maxRows: 6 }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        resize: 'none',
                        color: isDarkTheme ? '#ffffff' : '#1f2937',
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
                      borderTop: `1px solid ${isDarkTheme ? '#4b5563' : '#e5e7eb'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<Paperclip size={16} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
                          style={{
                            color: isDarkTheme ? '#9ca3af' : '#6b7280',
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
                          icon={<Send size={16} />}
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isLoading}
                          loading={isLoading}
                          style={{
                            background: '#3b82f6',
                            borderColor: '#3b82f6',
                            borderRadius: '8px',
                          }}
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
    )
  }

  // 会话模式 - 输入框在底部
  const sessionSiderStyle = {
    overflow: 'hidden' as const,
    height: '100%',
    transition: 'all 0.3s ease',
    background: isDarkTheme ? '#374151' : '#ffffff',
    borderRight: `1px solid ${isDarkTheme ? '#4b5563' : '#e5e7eb'}`,
  };

  return (
    <Layout style={{ height: '100%', background: isDarkTheme ? '#0a0a0f' : '#f5f5f5' }}>
      {/* 左侧会话列表 */}
      <Sider
        width={280}
        collapsed={collapsed}
        collapsedWidth={0}
        trigger={null}
        style={sessionSiderStyle}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 顶部新会话按钮 */}
          <div style={{ padding: '16px' }}>
            <Button
              onClick={handleNewChat}
              style={{
                width: '100%',
                background: isDarkTheme ? '#4b5563' : '#ffffff',
                borderColor: isDarkTheme ? '#6b7280' : '#d1d5db',
                color: isDarkTheme ? '#ffffff' : '#1f2937',
                borderRadius: '8px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '0 12px',
              }}
              icon={<Edit3 size={16} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
            >
              <span style={{ 
                marginLeft: '8px', 
                color: isDarkTheme ? '#d1d5db' : '#6b7280' 
              }}>新会话</span>
            </Button>
          </div>

          {/* 会话列表 */}
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
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '8px',
                  padding: '0 8px',
                }}>
                  {date}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: sessionId === session.id
                          ? (isDarkTheme ? '#6b7280' : '#e5e7eb')
                          : (isDarkTheme ? '#4b5563' : '#f3f4f6'),
                        borderRadius: '8px',
                        padding: '12px',
                      }}
                      onClick={() => handleSessionClick(session.id)}
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
                              ? (isDarkTheme ? '#ffffff' : '#1f2937')
                              : (isDarkTheme ? '#d1d5db' : '#374151'),
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {session.title}
                        </Text>
                        
                        <div style={{
                          opacity: 0,
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
            borderTop: `1px solid ${isDarkTheme ? '#4b5563' : '#e5e7eb'}` 
          }}>
            <Button
              type="text"
              icon={<Settings size={16} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
              style={{
                width: '100%',
                textAlign: 'left',
                color: isDarkTheme ? '#d1d5db' : '#6b7280',
                borderRadius: '8px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '0 12px',
              }}
              onClick={handleOpenSettings}
            >
              <span style={{ marginLeft: '8px' }}>设置</span>
            </Button>
          </div>
        </div>
      </Sider>

      {/* 主内容区域 - 会话模式 */}
      <Layout style={{ flex: 1 }}>
        <Content style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          background: isDarkTheme ? '#0a0a0f' : '#f9fafb' 
        }}>
          {/* 顶部工具栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderBottom: `1px solid ${isDarkTheme ? '#4b5563' : '#e5e7eb'}`,
            background: isDarkTheme ? '#0a0a0f' : '#ffffff',
          }}>
            <Space>
              <Tooltip title={collapsed ? "展开菜单" : "收起菜单"}>
                <Button
                  type="text"
                  icon={collapsed ? 
                    <PanelLeftOpen size={20} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} /> : 
                    <PanelLeftClose size={20} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />
                  }
                  onClick={() => setCollapsed(!collapsed)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Tooltip>
              <Title 
                level={5} 
                style={{ 
                  marginBottom: 0,
                  color: isDarkTheme ? '#ffffff' : '#1f2937'
                }}
              >
                {currentSession?.title || '会话不存在'}
              </Title>
            </Space>
            
            {/* 如果会话不存在，显示回到首页按钮 */}
            {!currentSession && (
              <Button
                type="primary"
                onClick={() => navigate('/')}
                style={{
                  background: '#3b82f6',
                  borderColor: '#3b82f6',
                }}
              >
                回到首页
              </Button>
            )}
          </div>

          {/* 聊天区域 */}
          {currentSession ? (
            <ChatArea 
              isDarkTheme={true}
              messages={currentSession.messages || []}
              isLoading={isLoading}
            />
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDarkTheme ? '#0a0a0f' : '#f9fafb',
            }}>
              <div style={{ textAlign: 'center' }}>
                <Text style={{ 
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  display: 'block',
                  marginBottom: '16px'
                }}>
                  会话不存在或已被删除
                </Text>
                <Button
                  type="primary"
                  onClick={() => navigate('/')}
                  style={{
                    background: '#3b82f6',
                    borderColor: '#3b82f6',
                  }}
                >
                  回到首页
                </Button>
              </div>
            </div>
          )}

          {/* 底部输入区域 - 只有在会话存在时才显示 */}
          {currentSession && (
            <div style={{ 
              padding: '24px', 
              background: isDarkTheme ? '#0a0a0f' : '#f9fafb' 
            }}>
              <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderRadius: '16px',
                    border: `1px solid ${isDarkTheme ? '#4b5563' : '#d1d5db'}`,
                    padding: '16px',
                  }}>
                    <TextArea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="问点什么？可以通过@来引用工具、文件、资源..."
                      autoSize={{ minRows: 1, maxRows: 6 }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        resize: 'none',
                        color: isDarkTheme ? '#ffffff' : '#1f2937',
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
                      borderTop: `1px solid ${isDarkTheme ? '#4b5563' : '#e5e7eb'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<Paperclip size={16} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
                          style={{
                            color: isDarkTheme ? '#9ca3af' : '#6b7280',
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
                          icon={<Send size={16} />}
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isLoading}
                          loading={isLoading}
                          style={{
                            background: '#3b82f6',
                            borderColor: '#3b82f6',
                            borderRadius: '8px',
                          }}
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

export default Home 