import { useCallback, useEffect } from 'react'
import { useAppStore } from './appStore'
import { useSessionStore } from './sessionStore'
import { useTabStore } from './tabStore'
import { useModelStore } from './modelStore'

/**
 * 会话管理组合 Hook
 * 处理会话切换时的模型同步和相关状态更新
 */
export const useSessionManager = () => {
  const { 
    currentSession, 
    setCurrentSession, 
    deleteSession,
    updateSessionModel,
    loadSessions,
    sessions
  } = useSessionStore()
  
  const { 
    syncSessionModel, 
    setSelectedModel, 
    selectedModel,
    getSelectedModelData,
    getSelectedProvider
  } = useModelStore()
  
  const { 
    removeSessionTabs, 
    updateSessionTabTitle 
  } = useTabStore()

  /**
   * 切换到指定会话
   * 自动同步该会话的模型选择
   */
  const switchToSession = useCallback(async (sessionId: string | null) => {
    await setCurrentSession(sessionId)
    
    if (sessionId) {
      // 从会话列表中找到对应的会话
      const targetSession = sessions.find(s => s.id === sessionId)
      if (targetSession?.selectedModel) {
        // 同步会话的模型选择
        syncSessionModel(targetSession.selectedModel)
      }
    }
  }, [setCurrentSession, sessions, syncSessionModel])

  /**
   * 删除会话并清理相关标签页
   */
  const deleteSessionWithCleanup = useCallback(async (sessionId: string) => {
    try {
      // 先删除相关的标签页
      removeSessionTabs(sessionId)
      
      // 然后删除会话
      await deleteSession(sessionId)
      
      console.log(`已删除会话 ${sessionId} 及其相关标签页`)
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
  }, [deleteSession, removeSessionTabs])

  /**
   * 更新会话标题并同步到标签页
   */
  const updateSessionTitleWithSync = useCallback(async (sessionId: string, title: string) => {
    try {
      // 更新会话标题
      await useSessionStore.getState().updateSession(sessionId, { title })
      
      // 同步更新标签页标题
      updateSessionTabTitle(sessionId, title)
      
      console.log(`已更新会话 ${sessionId} 标题为: ${title}`)
    } catch (error) {
      console.error('更新会话标题失败:', error)
      throw error
    }
  }, [updateSessionTabTitle])

  /**
   * 处理模型变更
   * 如果当前有会话，保存模型选择到会话中
   */
  const handleModelChange = useCallback(async (modelId: string) => {
    // 更新当前选择的模型
    setSelectedModel(modelId)
    
    // 如果当前有会话，保存模型选择到会话中
    if (currentSession?.id) {
      try {
        await updateSessionModel(currentSession.id, modelId)
        console.log(`已保存模型选择 ${modelId} 到会话 ${currentSession.id}`)
      } catch (error) {
        console.error('保存模型选择失败:', error)
        // 即使保存失败，也不影响当前的模型选择
      }
    }
  }, [setSelectedModel, currentSession, updateSessionModel])

  return {
    // 状态
    currentSession,
    sessions,
    selectedModel,
    
    // 操作
    switchToSession,
    deleteSessionWithCleanup,
    updateSessionTitleWithSync,
    handleModelChange,
    
    // 工具函数
    getSelectedModelData,
    getSelectedProvider,
    loadSessions,
  }
}

/**
 * 标签页管理组合 Hook
 * 处理标签页与会话的同步
 */
export const useTabManager = () => {
  const { 
    tabs, 
    activeTabId, 
    addTab, 
    removeTab, 
    setActiveTab,
    removeSessionTabs,
    updateSessionTabTitle,
    getActiveTab
  } = useTabStore()

  /**
   * 为会话创建标签页
   */
  const createSessionTab = useCallback((sessionId: string, title: string = '新会话') => {
    const existingTab = tabs.find(tab => 
      tab.url && tab.url.includes(`/chat/${sessionId}`)
    )
    
    if (existingTab) {
      // 如果标签页已存在，切换到该标签页
      setActiveTab(existingTab.id)
      return existingTab.id
    }
    
    // 创建新标签页
    const tabId = addTab({
      title,
      url: `/chat/${sessionId}`,
      canClose: true,
    })
    
    return tabId
  }, [tabs, addTab, setActiveTab])

  /**
   * 导航到会话并创建/切换标签页
   */
  const navigateToSession = useCallback((sessionId: string, title: string = '新会话', onNavigate?: (url: string) => void) => {
    const tabId = createSessionTab(sessionId, title)
    
    if (onNavigate) {
      onNavigate(`/chat/${sessionId}`)
    }
    
    return tabId
  }, [createSessionTab])

  return {
    // 状态
    tabs,
    activeTabId,
    
    // 操作
    addTab,
    removeTab,
    setActiveTab,
    removeSessionTabs,
    updateSessionTabTitle,
    createSessionTab,
    navigateToSession,
    
    // 工具函数
    getActiveTab,
  }
}

/**
 * 应用初始化 Hook
 * 处理应用启动时的状态初始化
 */
export const useAppInitializer = () => {
  const { isInitialized, setIsInitialized, isDarkTheme, setIsDarkTheme } = useAppStore()
  const { loadSessions } = useSessionStore()
  const { loadProviders } = useModelStore()
  const { tabs, addTab } = useTabStore()

  /**
   * 初始化应用状态
   */
  const initializeApp = useCallback(async () => {
    try {
      // 初始化主题状态
      const savedTheme = localStorage.getItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
      setIsDarkTheme(shouldUseDark)

      // 并行加载数据
      await Promise.all([
        loadSessions(),
        loadProviders(),
      ])

      // 确保应用启动时有默认标签页
      if (tabs.length === 0) {
        addTab({
          title: '对话',
          url: '/',
          canClose: false,
        })
      }

      setIsInitialized(true)
    } catch (error) {
      console.error('应用初始化失败:', error)
      // 即使部分初始化失败，也标记为已初始化，避免无限加载
      setIsInitialized(true)
    }
  }, [setIsDarkTheme, loadSessions, loadProviders, tabs.length, addTab, setIsInitialized])

  // 监听窗口焦点事件，当从设置页面返回时重新加载providers
  useEffect(() => {
    const handleFocus = () => {
      // 延迟一点时间再重新加载，确保设置页面的数据已经保存
      setTimeout(() => {
        useModelStore.getState().refreshProviders()
      }, 100)
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return {
    isInitialized,
    isDarkTheme,
    initializeApp,
  }
}

/**
 * 选择器 Hooks - 优化组件重渲染
 */

// 获取当前会话信息
export const useCurrentSession = () => {
  return useSessionStore(state => ({
    currentSession: state.currentSession,
    currentSessionId: state.currentSessionId,
    sessionMessages: state.sessionMessages,
    streamingMessages: state.streamingMessages,
    isLoadingMessages: state.isLoadingMessages,
  }))
}

// 获取会话列表
export const useSessionList = () => {
  return useSessionStore(state => ({
    sessions: state.sessions,
    isLoadingSessions: state.isLoadingSessions,
  }))
}

// 获取模型信息
export const useModelInfo = () => {
  return useModelStore(state => ({
    selectedModel: state.selectedModel,
    providers: state.providers,
    isLoadingProviders: state.isLoadingProviders,
    getSelectedModelData: state.getSelectedModelData,
    getSelectedProvider: state.getSelectedProvider,
    getEnabledModels: state.getEnabledModels,
  }))
}

// 获取标签页信息
export const useTabInfo = () => {
  return useTabStore(state => ({
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    getActiveTab: state.getActiveTab,
  }))
}

// 获取应用状态
export const useAppInfo = () => {
  return useAppStore(state => ({
    isDarkTheme: state.isDarkTheme,
    isInitialized: state.isInitialized,
    sidebarCollapsed: state.sidebarCollapsed,
    isLoading: state.isLoading,
    error: state.error,
  }))
} 