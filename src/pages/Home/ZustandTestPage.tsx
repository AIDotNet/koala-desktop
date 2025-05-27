import React, { useEffect, useState } from 'react'
import { Button, Card, Space, Typography, Divider, Tag, message } from 'antd'
import { ThemeProvider } from '@lobehub/ui'
import { 
  useSessionManager, 
  useTabManager, 
  useAppInitializer,
  useCurrentSession,
  useModelInfo,
  useSessionList,
  useTabInfo
} from '@/stores/hooks'
import { useSessionStore } from '@/stores/sessionStore'

const { Title, Text, Paragraph } = Typography

/**
 * Zustand 状态管理测试页面
 * 用于验证核心功能：会话切换时同步模型、删除会话时清理标签页
 */
const ZustandTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([])
  
  // 使用组合 hooks
  const { isInitialized, isDarkTheme, initializeApp } = useAppInitializer()
  const {
    currentSession,
    selectedModel,
    switchToSession,
    deleteSessionWithCleanup,
    handleModelChange,
    getSelectedModelData,
  } = useSessionManager()
  
  const { navigateToSession, createSessionTab } = useTabManager()
  
  // 使用选择器 hooks
  const { sessions } = useSessionList()
  const { providers, getEnabledModels } = useModelInfo()
  const { tabs } = useTabInfo()

  // 应用初始化
  useEffect(() => {
    if (!isInitialized) {
      initializeApp()
    }
  }, [isInitialized, initializeApp])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  // 测试1：创建会话并设置不同模型
  const testCreateSessionsWithModels = async () => {
    try {
      addTestResult('开始测试：创建会话并设置不同模型')
      
      const { createSession } = useSessionStore.getState()
      const enabledModels = getEnabledModels()
      
      if (enabledModels.length < 2) {
        addTestResult('❌ 需要至少2个可用模型来进行测试')
        return
      }

      // 创建第一个会话，使用第一个模型
      const session1 = await createSession(enabledModels[0].id)
      addTestResult(`✅ 创建会话1: ${session1.id}，模型: ${enabledModels[0].displayName}`)
      
      // 创建第二个会话，使用第二个模型
      const session2 = await createSession(enabledModels[1].id)
      addTestResult(`✅ 创建会话2: ${session2.id}，模型: ${enabledModels[1].displayName}`)
      
      addTestResult('✅ 会话创建测试完成')
    } catch (error) {
      addTestResult(`❌ 创建会话失败: ${error}`)
    }
  }

  // 测试2：会话切换时同步模型
  const testSessionSwitchWithModelSync = async () => {
    try {
      addTestResult('开始测试：会话切换时同步模型')
      
      if (sessions.length < 2) {
        addTestResult('❌ 需要至少2个会话来进行测试')
        return
      }

      const session1 = sessions[0]
      const session2 = sessions[1]
      
      // 切换到第一个会话
      await switchToSession(session1.id)
      addTestResult(`✅ 切换到会话1: ${session1.id}`)
      addTestResult(`当前选择的模型: ${selectedModel}`)
      addTestResult(`会话1保存的模型: ${session1.selectedModel}`)
      
      // 验证模型是否同步
      if (selectedModel === session1.selectedModel) {
        addTestResult('✅ 模型同步成功')
      } else {
        addTestResult('❌ 模型同步失败')
      }
      
      // 切换到第二个会话
      await switchToSession(session2.id)
      addTestResult(`✅ 切换到会话2: ${session2.id}`)
      addTestResult(`当前选择的模型: ${selectedModel}`)
      addTestResult(`会话2保存的模型: ${session2.selectedModel}`)
      
      // 验证模型是否同步
      if (selectedModel === session2.selectedModel) {
        addTestResult('✅ 模型同步成功')
      } else {
        addTestResult('❌ 模型同步失败')
      }
      
      addTestResult('✅ 会话切换模型同步测试完成')
    } catch (error) {
      addTestResult(`❌ 会话切换测试失败: ${error}`)
    }
  }

  // 测试3：为会话创建标签页
  const testCreateTabsForSessions = async () => {
    try {
      addTestResult('开始测试：为会话创建标签页')
      
      if (sessions.length < 2) {
        addTestResult('❌ 需要至少2个会话来进行测试')
        return
      }

      // 为前两个会话创建标签页
      const session1 = sessions[0]
      const session2 = sessions[1]
      
      const tab1Id = createSessionTab(session1.id, session1.title)
      addTestResult(`✅ 为会话1创建标签页: ${tab1Id}`)
      
      const tab2Id = createSessionTab(session2.id, session2.title)
      addTestResult(`✅ 为会话2创建标签页: ${tab2Id}`)
      
      addTestResult(`当前标签页数量: ${tabs.length}`)
      addTestResult('✅ 标签页创建测试完成')
    } catch (error) {
      addTestResult(`❌ 标签页创建测试失败: ${error}`)
    }
  }

  // 测试4：删除会话并清理标签页
  const testDeleteSessionWithCleanup = async () => {
    try {
      addTestResult('开始测试：删除会话并清理标签页')
      
      if (sessions.length === 0) {
        addTestResult('❌ 没有会话可以删除')
        return
      }

      const sessionToDelete = sessions[sessions.length - 1] // 删除最后一个会话
      const sessionId = sessionToDelete.id
      
      addTestResult(`准备删除会话: ${sessionId}`)
      addTestResult(`删除前标签页数量: ${tabs.length}`)
      
      // 查找相关标签页
      const relatedTabs = tabs.filter(tab => 
        tab.url && tab.url.includes(`/chat/${sessionId}`)
      )
      addTestResult(`找到相关标签页数量: ${relatedTabs.length}`)
      
      // 执行删除
      await deleteSessionWithCleanup(sessionId)
      
      addTestResult(`✅ 会话删除完成`)
      addTestResult(`删除后会话数量: ${sessions.length}`)
      addTestResult(`删除后标签页数量: ${tabs.length}`)
      
      // 验证相关标签页是否被删除
      const remainingRelatedTabs = tabs.filter(tab => 
        tab.url && tab.url.includes(`/chat/${sessionId}`)
      )
      
      if (remainingRelatedTabs.length === 0) {
        addTestResult('✅ 相关标签页已成功清理')
      } else {
        addTestResult('❌ 标签页清理失败')
      }
      
      addTestResult('✅ 删除会话清理标签页测试完成')
    } catch (error) {
      addTestResult(`❌ 删除会话测试失败: ${error}`)
    }
  }

  // 测试5：模型变更保存到会话
  const testModelChangeWithSessionSave = async () => {
    try {
      addTestResult('开始测试：模型变更保存到会话')
      
      if (!currentSession) {
        addTestResult('❌ 需要当前会话来进行测试')
        return
      }

      const enabledModels = getEnabledModels()
      if (enabledModels.length < 2) {
        addTestResult('❌ 需要至少2个可用模型来进行测试')
        return
      }

      const originalModel = selectedModel
      const newModel = enabledModels.find(m => m.id !== selectedModel)
      
      if (!newModel) {
        addTestResult('❌ 找不到不同的模型进行测试')
        return
      }

      addTestResult(`当前模型: ${originalModel}`)
      addTestResult(`准备切换到: ${newModel.displayName}`)
      
      // 执行模型变更
      await handleModelChange(newModel.id)
      
      addTestResult(`✅ 模型变更完成`)
      addTestResult(`新的选择模型: ${selectedModel}`)
      
      // 验证是否保存到会话
      const updatedSession = sessions.find(s => s.id === currentSession.id)
      if (updatedSession?.selectedModel === newModel.id) {
        addTestResult('✅ 模型选择已保存到会话')
      } else {
        addTestResult('❌ 模型选择保存到会话失败')
      }
      
      addTestResult('✅ 模型变更保存测试完成')
    } catch (error) {
      addTestResult(`❌ 模型变更测试失败: ${error}`)
    }
  }

  // 运行所有测试
  const runAllTests = async () => {
    setTestResults([])
    addTestResult('🚀 开始运行所有测试')
    
    await testCreateSessionsWithModels()
    await new Promise(resolve => setTimeout(resolve, 1000)) // 等待状态更新
    
    await testSessionSwitchWithModelSync()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testCreateTabsForSessions()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testModelChangeWithSessionSave()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testDeleteSessionWithCleanup()
    
    addTestResult('🎉 所有测试完成')
    message.success('测试完成，请查看结果')
  }

  // 清空测试结果
  const clearResults = () => {
    setTestResults([])
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

  return (
    <ThemeProvider>
      <div className="p-6 max-w-6xl mx-auto">
        <Title level={2}>Zustand 状态管理测试页面</Title>
        <Paragraph>
          此页面用于测试 Zustand 状态管理系统的核心功能：
          <br />
          1. 会话切换时同步获取当前会话的模型
          <br />
          2. 删除会话时清除相关标签页
        </Paragraph>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 当前状态显示 */}
          <Card title="当前状态" size="small">
            <Space direction="vertical" className="w-full">
              <div>
                <Text strong>当前会话: </Text>
                <Tag color={currentSession ? 'blue' : 'default'}>
                  {currentSession ? currentSession.title : '无'}
                </Tag>
              </div>
              <div>
                <Text strong>选择的模型: </Text>
                <Tag color="green">
                  {getSelectedModelData()?.displayName || selectedModel || '无'}
                </Tag>
              </div>
              <div>
                <Text strong>会话数量: </Text>
                <Tag color="orange">{sessions.length}</Tag>
              </div>
              <div>
                <Text strong>标签页数量: </Text>
                <Tag color="purple">{tabs.length}</Tag>
              </div>
              <div>
                <Text strong>可用模型数量: </Text>
                <Tag color="cyan">{getEnabledModels().length}</Tag>
              </div>
            </Space>
          </Card>

          {/* 测试控制 */}
          <Card title="测试控制" size="small">
            <Space direction="vertical" className="w-full">
              <Button 
                type="primary" 
                onClick={runAllTests}
                block
              >
                运行所有测试
              </Button>
              
              <Divider />
              
              <Button onClick={testCreateSessionsWithModels} block>
                测试1：创建会话并设置模型
              </Button>
              <Button onClick={testSessionSwitchWithModelSync} block>
                测试2：会话切换模型同步
              </Button>
              <Button onClick={testCreateTabsForSessions} block>
                测试3：创建会话标签页
              </Button>
              <Button onClick={testModelChangeWithSessionSave} block>
                测试4：模型变更保存
              </Button>
              <Button onClick={testDeleteSessionWithCleanup} block>
                测试5：删除会话清理标签页
              </Button>
              
              <Divider />
              
              <Button onClick={clearResults} block>
                清空测试结果
              </Button>
            </Space>
          </Card>
        </div>

        {/* 测试结果 */}
        <Card title="测试结果" className="mt-6">
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <Text type="secondary">暂无测试结果</Text>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1 font-mono text-sm">
                  {result}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 会话列表 */}
        <Card title="会话列表" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card 
                key={session.id} 
                size="small"
                className={currentSession?.id === session.id ? 'border-blue-500' : ''}
              >
                <div className="space-y-2">
                  <div>
                    <Text strong>{session.title}</Text>
                  </div>
                  <div>
                    <Text type="secondary">ID: {session.id.slice(0, 8)}...</Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      模型: {session.selectedModel || '未设置'}
                    </Text>
                  </div>
                  <Button 
                    size="small" 
                    onClick={() => switchToSession(session.id)}
                    type={currentSession?.id === session.id ? 'primary' : 'default'}
                  >
                    切换到此会话
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* 标签页列表 */}
        <Card title="标签页列表" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tabs.map((tab) => (
              <Card 
                key={tab.id} 
                size="small"
                className={tab.isActive ? 'border-green-500' : ''}
              >
                <div className="space-y-2">
                  <div>
                    <Text strong>{tab.title}</Text>
                  </div>
                  <div>
                    <Text type="secondary" className="text-xs">
                      URL: {tab.url || '无'}
                    </Text>
                  </div>
                  <div>
                    <Tag color={tab.isActive ? 'green' : 'default'}>
                      {tab.isActive ? '活跃' : '非活跃'}
                    </Tag>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </ThemeProvider>
  )
}

export default ZustandTestPage 