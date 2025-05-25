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
import { processModelData } from '@/utils/modelDataProcessor'

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
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo')
  const [providers, setProviders] = useState<Provider[]>([])

  // 判断是否在欢迎页面模式
  const isWelcomeMode = !sessionId

  // 初始化默认服务商数据
  useEffect(() => {
    try {
      // 使用 processModelData 函数生成完整的 providers 数据
      const generatedProviders = processModelData()
      setProviders(generatedProviders)
      console.log('已加载提供商数据:', generatedProviders.length, '个提供商')
      console.log('提供商列表:', generatedProviders.map((p: Provider) => `${p.displayName} (${p.models.length} 个模型)`))
    } catch (error) {
      console.error('Failed to process model data:', error)
      message.error('模型数据处理失败')
      
      // 如果处理失败，使用默认的 OpenAI 提供商
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
      <div className="h-full bg-black flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    )
  }

  // 欢迎页面模式 - 输入框在中间
  if (isWelcomeMode) {
    return (
      <Layout className="h-full bg-black">
        {/* 左侧会话列表 */}
        <Sider
          width={280}
          collapsed={collapsed}
          collapsedWidth={0}
          trigger={null}
          className="transition-all duration-300 bg-gray-900 border-r border-gray-800"
          style={{
            overflow: 'hidden',
            height: '100%',
          }}
        >
          <div className="h-full flex flex-col">
            {/* 顶部新会话按钮 */}
            <div className="p-4">
              <Button
                onClick={handleNewChat}
                className="w-full bg-gray-800 hover:bg-gray-700 border-gray-700 text-white rounded-lg h-10 flex items-center justify-start px-3"
                icon={<Edit3 size={16} className="text-gray-400" />}
              >
                <span className="ml-2 text-gray-300">新会话</span>
              </Button>
            </div>

            {/* 会话列表 */}
            <div className="flex-1 overflow-y-auto px-4">
              {Object.entries(sessionGroups).map(([date, sessions]) => (
                <div key={date} className="mb-4">
                  <div className="text-xs text-gray-500 mb-2 px-2">
                    {date}
                  </div>
                  
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="group relative cursor-pointer transition-all duration-200 bg-gray-800 hover:bg-gray-700 rounded-lg p-3"
                        onClick={() => handleSessionClick(session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <Text 
                            className="text-sm flex-1 text-gray-300"
                            ellipsis
                          >
                            {session.title}
                          </Text>
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
            <div className="p-4 border-t border-gray-800">
              <Button
                type="text"
                icon={<Settings size={16} className="text-gray-400" />}
                className="w-full text-left text-gray-300 hover:bg-gray-800 rounded-lg h-10 flex items-center justify-start px-3"
                onClick={handleOpenSettings}
              >
                <span className="ml-2">设置</span>
              </Button>
            </div>
          </div>
        </Sider>

        {/* 主内容区域 - 欢迎页面 */}
        <Layout className="flex-1">
          <Content className="flex flex-col h-full bg-black">
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black">
              <Space>
                <Tooltip title={collapsed ? "展开菜单" : "收起菜单"}>
                  <Button
                    type="text"
                    icon={collapsed ? <PanelLeftOpen size={20} className="text-gray-400" /> : <PanelLeftClose size={20} className="text-gray-400" />}
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-center hover:bg-gray-800"
                  />
                </Tooltip>
              </Space>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6">

              <Title level={1} className="!text-5xl !font-bold !mb-4 !text-white text-center">
                你好呀
              </Title>
              
              <Text className="text-xl text-gray-300 mb-12 text-center">
                今天你想问点什么？
              </Text>

              <div className="w-full max-w-4xl">
                <div className="relative">
                  <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                    <TextArea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="问点什么？可以通过@来引用工具、文件、资源..."
                      autoSize={{ minRows: 1, maxRows: 6 }}
                      className="!bg-transparent !border-none !resize-none text-white placeholder-gray-400 !p-0"
                      style={{
                        boxShadow: 'none'
                      }}
                    />
                    
                    {/* 底部操作栏 */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Button
                          type="text"
                          size="small"
                          icon={<Paperclip size={16} className="text-gray-400" />}
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            providers={providers}
                            className="text-xs"
                          />
                        </div>
                        <Button
                          type="primary"
                          icon={<Send size={16} />}
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isLoading}
                          loading={isLoading}
                          className="bg-blue-600 hover:bg-blue-700 border-blue-600 rounded-lg"
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
  return (
    <Layout className="h-full bg-black">
      {/* 左侧会话列表 */}
      <Sider
        width={280}
        collapsed={collapsed}
        collapsedWidth={0}
        trigger={null}
        className="transition-all duration-300 bg-gray-900 border-r border-gray-800"
        style={{
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <div className="h-full flex flex-col">
          {/* 顶部新会话按钮 */}
          <div className="p-4">
            <Button
              onClick={handleNewChat}
              className="w-full bg-gray-800 hover:bg-gray-700 border-gray-700 text-white rounded-lg h-10 flex items-center justify-start px-3"
              icon={<Edit3 size={16} className="text-gray-400" />}
            >
              <span className="ml-2 text-gray-300">新会话</span>
            </Button>
          </div>

          {/* 会话列表 */}
          <div className="flex-1 overflow-y-auto px-4">
            {Object.entries(sessionGroups).map(([date, sessions]) => (
              <div key={date} className="mb-4">
                <div className="text-xs text-gray-500 mb-2 px-2">
                  {date}
                </div>
                
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group relative cursor-pointer transition-all duration-200 ${
                        sessionId === session.id
                          ? 'bg-gray-700'
                          : 'bg-gray-800 hover:bg-gray-700'
                      } rounded-lg p-3`}
                      onClick={() => handleSessionClick(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <Text 
                          className={`text-sm flex-1 ${
                            sessionId === session.id ? 'text-white' : 'text-gray-300'
                          }`}
                          ellipsis
                        >
                          {session.title}
                        </Text>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
          <div className="p-4 border-t border-gray-800">
            <Button
              type="text"
              icon={<Settings size={16} className="text-gray-400" />}
              className="w-full text-left text-gray-300 hover:bg-gray-800 rounded-lg h-10 flex items-center justify-start px-3"
              onClick={handleOpenSettings}
            >
              <span className="ml-2">设置</span>
            </Button>
          </div>
        </div>
      </Sider>

      {/* 主内容区域 - 会话模式 */}
      <Layout className="flex-1">
        <Content className="flex flex-col h-full bg-black">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black">
            <Space>
              <Tooltip title={collapsed ? "展开菜单" : "收起菜单"}>
                <Button
                  type="text"
                  icon={collapsed ? <PanelLeftOpen size={20} className="text-gray-400" /> : <PanelLeftClose size={20} className="text-gray-400" />}
                  onClick={() => setCollapsed(!collapsed)}
                  className="flex items-center justify-center hover:bg-gray-800"
                />
              </Tooltip>
              <Title level={5} className="!mb-0 text-white">
                {currentSession?.title || '会话不存在'}
              </Title>
            </Space>
            
            {/* 如果会话不存在，显示回到首页按钮 */}
            {!currentSession && (
              <Button
                type="primary"
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700"
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
            <div className="flex-1 flex items-center justify-center bg-black">
              <div className="text-center">
                <Text className="text-gray-500 block mb-4">
                  会话不存在或已被删除
                </Text>
                <Button
                  type="primary"
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  回到首页
                </Button>
              </div>
            </div>
          )}

          {/* 底部输入区域 - 只有在会话存在时才显示 */}
          {currentSession && (
            <div className="p-6 bg-black">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                    <TextArea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="问点什么？可以通过@来引用工具、文件、资源..."
                      autoSize={{ minRows: 1, maxRows: 6 }}
                      className="!bg-transparent !border-none !resize-none text-white placeholder-gray-400 !p-0"
                      style={{
                        boxShadow: 'none'
                      }}
                    />
                    
                    {/* 底部操作栏 */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Button
                          type="text"
                          size="small"
                          icon={<Paperclip size={16} className="text-gray-400" />}
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            providers={providers}
                            className="text-xs"
                          />
                        </div>
                        <Button
                          type="primary"
                          icon={<Send size={16} />}
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isLoading}
                          loading={isLoading}
                          className="bg-blue-600 hover:bg-blue-700 border-blue-600 rounded-lg"
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