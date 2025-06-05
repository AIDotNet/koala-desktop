import { useState, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import TitleBar from '@/components/TitleBar'
import { Tab } from '@/components/TabBar'
import Home from '@/pages/Home/index'
import Settings from '@/pages/Settings'
import About from '@/pages/About'
import LoginPage from '@/pages/Login'
import LoginCallback from '@/pages/LoginCallback'
import { darkTheme, lightTheme, getThemeColors } from '@/theme'
import { chatSessionDB } from '@/utils/indexedDB'

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [currentUrl, setCurrentUrl] = useState('/')
  
  useEffect(() => {
    // 初始化主题状态，与TitleBar组件保持一致
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDarkTheme(shouldUseDark)
    
    // 为 body 添加深色主题标记类名
    if (shouldUseDark) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [])

  // 监听来自登录页面的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 放宽对消息来源的限制
      // if (event.origin !== window.location.origin) return
      
      console.log('App收到消息:', event.origin, event.data)
      
      if (event.data.type === 'LOGIN_SUCCESS' && event.data.token) {
        // 转发登录成功消息给整个应用
        // window.postMessage({
        //   type: 'LOGIN_SUCCESS',
        //   token: event.data.token
        // }, window.location.origin)
      }
      
      if (event.data.type === 'CLOSE_LOGIN_TAB') {
        // 关闭登录相关的标签页
        setTabs(prevTabs => {
          const filteredTabs = prevTabs.filter(tab => 
            tab.url !== '/login' && tab.url !== '/login-callback'
          )
          
          // 如果当前活动标签页被关闭，激活第一个可用标签页
          const currentActiveTab = prevTabs.find(tab => tab.isActive)
          if (currentActiveTab && (currentActiveTab.url === '/login' || currentActiveTab.url === '/login-callback')) {
            if (filteredTabs.length > 0) {
              filteredTabs[0].isActive = true
              setCurrentUrl(filteredTabs[0].url || '/')
            } else {
              // 如果没有其他标签页，创建默认标签页
              const defaultTab: Tab = {
                id: Date.now().toString(),
                title: '对话',
                url: '/',
                isActive: true,
                canClose: false
              }
              setCurrentUrl('/')
              return [defaultTab]
            }
          }
          
          return filteredTabs
        })
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])
  
  // 确保应用启动时有默认标签页
  useEffect(() => {
    if (tabs.length === 0) {
      const defaultTab: Tab = {
        id: Date.now().toString(),
        title: '对话',
        url: '/',
        isActive: true,
        canClose: false
      }
      setTabs([defaultTab])
    }
  }, [tabs.length])

  const handleThemeChange = (isDark: boolean) => {
    setIsDarkTheme(isDark)
    
    // 更新 body 类名以反映主题变化
    if (isDark) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }

  const handleTabClick = (tabId: string) => {
    const clickedTab = tabs.find(tab => tab.id === tabId)
    if (clickedTab && clickedTab.url) {
      setCurrentUrl(clickedTab.url)
    }
    
    setTabs(prevTabs => 
      prevTabs.map(tab => ({
        ...tab,
        isActive: tab.id === tabId
      }))
    )
  }

  const handleTabClose = (tabId: string) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId)
      
      // 如果关闭的是活动标签页，需要激活另一个标签页
      const closedTab = prevTabs.find(tab => tab.id === tabId)
      if (closedTab?.isActive && newTabs.length > 0) {
        // 激活最后一个标签页
        const lastTab = newTabs[newTabs.length - 1]
        lastTab.isActive = true
        if (lastTab.url) {
          setCurrentUrl(lastTab.url)
        }
      }
      
      return newTabs
    })
  }

  const handleNewTab = () => {
    const newTabId = Date.now().toString()
    
    // 如果当前没有标签页，创建默认主页标签
    if (tabs.length === 0) {
      const defaultTab: Tab = {
        id: newTabId,
        title: '对话',
        url: '/',
        isActive: true,
        canClose: false // 主页标签不能关闭
      }
      
      setTabs([defaultTab])
      setCurrentUrl('/')
      return
    }
    
    // 如果已有标签页，创建新的随机标签页
    const tabOptions = [
      { title: '新标签页', url: '/' },
      { title: '设置', url: '/settings' },
      { title: '帮助文档', url: '/' },
      { title: '关于我们', url: '/' },
      { title: '开发者工具', url: '/' }
    ]
    const randomTab = tabOptions[Math.floor(Math.random() * tabOptions.length)]
    
    const newTab: Tab = {
      id: newTabId,
      title: randomTab.title,
      url: randomTab.url,
      isActive: true,
      canClose: true
    }
    
    setTabs(prevTabs => [
      ...prevTabs.map(tab => ({ ...tab, isActive: false })),
      newTab
    ])
    setCurrentUrl(randomTab.url)
  }

  // 更新聊天标签页标题的函数
  const updateChatTabTitle = async (sessionId: string) => {
    try {
      const session = await chatSessionDB.getSession(sessionId)
      if (session) {
        setTabs(prevTabs => 
          prevTabs.map(tab => {
            if (tab.url === `/chat/${sessionId}`) {
              return { ...tab, title: session.title }
            }
            return tab
          })
        )
      }
    } catch (error) {
      console.error('更新标签页标题失败:', error)
    }
  }

  // 添加设置标签页的函数
  const addSettingsTab = () => {
    // 检查是否已经存在设置标签页
    const existingSettingsTab = tabs.find(tab => tab.url === '/settings')
    
    if (existingSettingsTab) {
      // 如果已存在，直接激活该标签页
      handleTabClick(existingSettingsTab.id)
      return
    }
    
    // 创建新的设置标签页
    const settingsTab: Tab = {
      id: Date.now().toString(),
      title: '设置',
      url: '/settings',
      isActive: true,
      canClose: true
    }
    
    // 添加新标签页并设为活动状态
    setTabs(prevTabs => [
      ...prevTabs.map(tab => ({ ...tab, isActive: false })),
      settingsTab
    ])
    setCurrentUrl('/settings')
  }

  // 添加登录标签页的函数
  const addLoginTab = () => {
    // 检查是否已经存在登录标签页
    const existingLoginTab = tabs.find(tab => tab.url === '/login')
    
    if (existingLoginTab) {
      // 如果已存在，直接激活该标签页
      handleTabClick(existingLoginTab.id)
      return
    }
    
    // 创建新的登录标签页
    const loginTab: Tab = {
      id: Date.now().toString(),
      title: '登录 - TokenAI',
      url: '/login',
      isActive: true,
      canClose: true
    }
    
    // 添加新标签页并设为活动状态
    setTabs(prevTabs => [
      ...prevTabs.map(tab => ({ ...tab, isActive: false })),
      loginTab
    ])
    setCurrentUrl('/login')
  }

  // 渲染当前页面内容
  const renderCurrentPage = () => {
    // 从当前URL中提取sessionId
    const sessionId = currentUrl.startsWith('/chat/') ? currentUrl.split('/chat/')[1] : undefined
    
    // 导航函数
    const handleNavigate = (url: string) => {
      setCurrentUrl(url)
      
      // 如果导航到聊天页面，需要更新或创建对应的标签页
      if (url.startsWith('/chat/')) {
        const sessionIdFromUrl = url.split('/chat/')[1]
        const existingTab = tabs.find(tab => tab.url === url)
        
        if (!existingTab) {
          // 创建新的聊天标签页
          const createChatTab = async () => {
            try {
              // 通过 chatSessionDB 获取会话信息
              const session = await chatSessionDB.getSession(sessionIdFromUrl)
              const sessionTitle = session?.title || `聊天 ${sessionIdFromUrl.slice(0, 8)}...`
              
              const chatTab: Tab = {
                id: Date.now().toString(),
                title: sessionTitle,
                url: url,
                isActive: true,
                canClose: true
              }
              
              setTabs(prevTabs => [
                ...prevTabs.map(tab => ({ ...tab, isActive: false })),
                chatTab
              ])
            } catch (error) {
              console.error('获取会话标题失败:', error)
              // 如果获取失败，使用默认标题
              const chatTab: Tab = {
                id: Date.now().toString(),
                title: `聊天 ${sessionIdFromUrl.slice(0, 8)}...`,
                url: url,
                isActive: true,
                canClose: true
              }
              
              setTabs(prevTabs => [
                ...prevTabs.map(tab => ({ ...tab, isActive: false })),
                chatTab
              ])
            }
          }
          
          createChatTab()
        } else {
          // 激活现有标签页
          setTabs(prevTabs => 
            prevTabs.map(tab => ({
              ...tab,
              isActive: tab.id === existingTab.id
            }))
          )
        }
      }
    }
    
    switch (currentUrl) {
      case '/settings':
        return <Settings isDarkTheme={isDarkTheme} onNavigate={handleNavigate} />
      case '/about':
        return <About />
      case '/login':
        return <LoginPage isDarkTheme={isDarkTheme} />
      case '/login-callback':
        return <LoginCallback isDarkTheme={isDarkTheme} />
      default:
        // 处理聊天路由 /chat/:sessionId 和主页
        return (
          <Home 
            isDarkTheme={isDarkTheme} 
            addSettingsTab={addSettingsTab}
            sessionId={sessionId}
            onNavigate={handleNavigate}
            onSessionTitleUpdate={updateChatTabTitle}
          />
        )
    }
  }

  const styles = getThemeColors(isDarkTheme);

  return (
    <ConfigProvider
      theme={isDarkTheme ? darkTheme : lightTheme}
    >
      <div className="app-container" style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column' as const,
        background: isDarkTheme ? 'rgb(10, 10, 15)' : 'rgb(245, 245, 245)',
        color: isDarkTheme ? '#ffffff' : '#1f2937',
        transition: 'all 0.3s ease'
      }}>
        <TitleBar 
          onThemeChange={handleThemeChange}
          tabs={tabs}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
          onSettingsClick={addSettingsTab}
          onAddLoginTab={addLoginTab}
        />
        
        {/* 主内容区域 - 直接渲染组件 */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {renderCurrentPage()}
        </div>
      </div>
    </ConfigProvider>
  )
}

export default App