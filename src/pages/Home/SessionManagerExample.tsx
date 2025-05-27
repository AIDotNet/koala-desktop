import React, { useEffect } from 'react'
import { Button, Card, Select, Space, Typography, message } from 'antd'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { ThemeProvider } from '@lobehub/ui'
import { 
  useSessionManager, 
  useTabManager, 
  useAppInitializer,
  useCurrentSession,
  useModelInfo,
  useSessionList
} from '@/stores/hooks'
import { useSessionStore } from '@/stores/sessionStore'

const { Title, Text } = Typography
const { Option } = Select

/**
 * 会话管理器示例组件
 * 展示如何在实际应用中使用 Zustand 状态管理
 */
const SessionManagerExample: React.FC = () => {
  // 使用组合 hooks
  const { isInitialized, initializeApp } = useAppInitializer()
  const {
    currentSession,
    selectedModel,
    switchToSession,
    deleteSessionWithCleanup,
    handleModelChange,
    getSelectedModelData,
  } = useSessionManager()
  
  const { navigateToSession } = useTabManager()
  
  // 使用选择器 hooks 优化性能
  const { sessions } = useSessionList()
  const { getEnabledModels } = useModelInfo()

  // 应用初始化
  useEffect(() => {
    if (!isInitialized) {
      initializeApp()
    }
  }, [isInitialized, initializeApp])

  // 创建新会话
  const handleCreateSession = async () => {
    try {
      const { createSession } = useSessionStore.getState()
      const newSession = await createSession(selectedModel)
      
      // 自动切换到新会话并同步模型
      await switchToSession(newSession.id)
      
      // 创建标签页
      navigateToSession(newSession.id, newSession.title)
      
      message.success(`已创建新会话: ${newSession.title}`)
    } catch (error) {
      console.error('创建会话失败:', error)
      message.error('创建会话失败')
    }
  }

  // 删除会话
  const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
    try {
      // 自动删除会话和相关标签页
      await deleteSessionWithCleanup(sessionId)
      message.success(`已删除会话: ${sessionTitle}`)
    } catch (error) {
      console.error('删除会话失败:', error)
      message.error('删除会话失败')
    }
  }

  // 切换会话
  const handleSwitchSession = async (sessionId: string) => {
    try {
      // 自动同步该会话的模型选择
      await switchToSession(sessionId)
      
      const session = sessions.find(s => s.id === sessionId)
      if (session) {
        // 创建或切换到标签页
        navigateToSession(sessionId, session.title)
        message.success(`已切换到会话: ${session.title}`)
      }
    } catch (error) {
      console.error('切换会话失败:', error)
      message.error('切换会话失败')
    }
  }

  // 模型变更
  const handleModelSelect = async (modelId: string) => {
    try {
      // 自动保存到当前会话
      await handleModelChange(modelId)
      
      const modelData = getSelectedModelData()
      message.success(`已切换模型: ${modelData?.displayName || modelId}`)
    } catch (error) {
      console.error('切换模型失败:', error)
      message.error('切换模型失败')
    }
  }

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

  const enabledModels = getEnabledModels()

  return (
    <ThemeProvider>
      <div className="p-6 max-w-4xl mx-auto">
        <Title level={2}>会话管理器示例</Title>
        <Text type="secondary">
          展示 Zustand 状态管理的实际使用：会话切换时自动同步模型，删除会话时自动清理标签页
        </Text>

        {/* 控制面板 */}
        <Card title="控制面板" className="mt-6">
          <Space direction="vertical" className="w-full" size="large">
            {/* 当前状态 */}
            <div>
              <Text strong>当前会话: </Text>
              <Text code>
                {currentSession ? currentSession.title : '无'}
              </Text>
              {currentSession && (
                <>
                  <br />
                  <Text strong>会话模型: </Text>
                  <Text code>
                    {getSelectedModelData()?.displayName || currentSession.selectedModel || '未设置'}
                  </Text>
                </>
              )}
            </div>

            {/* 模型选择 */}
            <div>
              <Text strong>选择模型: </Text>
              <Select
                value={selectedModel}
                onChange={handleModelSelect}
                style={{ width: 300, marginLeft: 8 }}
                placeholder="请选择模型"
              >
                {enabledModels.map(model => (
                  <Option key={model.id} value={model.id}>
                    {model.displayName}
                  </Option>
                ))}
              </Select>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                (模型变更会自动保存到当前会话)
              </Text>
            </div>

            {/* 操作按钮 */}
            <div>
              <Button 
                type="primary" 
                icon={<Plus size={16} />}
                onClick={handleCreateSession}
              >
                创建新会话
              </Button>
            </div>
          </Space>
        </Card>

        {/* 会话列表 */}
        <Card title={`会话列表 (${sessions.length})`} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                <Text type="secondary">暂无会话，点击上方按钮创建新会话</Text>
              </div>
            ) : (
              sessions.map((session) => (
                <Card 
                  key={session.id}
                  size="small"
                  className={`transition-all duration-200 ${
                    currentSession?.id === session.id 
                      ? 'border-blue-500 shadow-md' 
                      : 'hover:shadow-sm'
                  }`}
                  actions={[
                    <Button
                      key="switch"
                      type={currentSession?.id === session.id ? 'primary' : 'default'}
                      size="small"
                      onClick={() => handleSwitchSession(session.id)}
                    >
                      {currentSession?.id === session.id ? '当前会话' : '切换'}
                    </Button>,
                    <Button
                      key="delete"
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDeleteSession(session.id, session.title)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <div className="space-y-2">
                    <div>
                      <Text strong>{session.title}</Text>
                      {currentSession?.id === session.id && (
                        <Text type="success" style={{ marginLeft: 8 }}>
                          (当前)
                        </Text>
                      )}
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">
                        ID: {session.id.slice(0, 8)}...
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">
                        模型: {session.selectedModel || '未设置'}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">
                        最后消息: {session.lastMessage || '暂无消息'}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">
                        时间: {session.timestamp}
                      </Text>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* 功能说明 */}
        <Card title="功能说明" className="mt-6">
          <div className="space-y-3">
            <div>
              <Text strong>🔄 会话切换时同步模型：</Text>
              <br />
              <Text type="secondary">
                当您点击"切换"按钮切换到不同会话时，系统会自动将模型选择器切换到该会话之前保存的模型。
              </Text>
            </div>
            <div>
              <Text strong>🗑️ 删除会话时清理标签页：</Text>
              <br />
              <Text type="secondary">
                当您删除一个会话时，系统会自动删除所有与该会话相关的标签页，确保界面整洁。
              </Text>
            </div>
            <div>
              <Text strong>💾 模型选择自动保存：</Text>
              <br />
              <Text type="secondary">
                当您在有当前会话的情况下更改模型时，新的模型选择会自动保存到该会话中。
              </Text>
            </div>
            <div>
              <Text strong>🏷️ 智能标签页管理：</Text>
              <br />
              <Text type="secondary">
                系统会为每个会话创建对应的标签页，并在会话间切换时自动管理标签页状态。
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </ThemeProvider>
  )
}

export default SessionManagerExample 