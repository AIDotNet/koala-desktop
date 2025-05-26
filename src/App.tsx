import { useState, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import UpdateElectron from '@/components/update'
import TitleBar from '@/components/TitleBar'
import { Tab } from '@/components/TabBar'
import Home from '@/pages/Home/index'
import Settings from '@/pages/Settings'
import ProviderDemo from '@/components/ProviderDemo'
import { Monitor, Smartphone, Tablet, Zap } from 'lucide-react'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import { darkTheme, lightTheme, createStyles } from '@/theme'

function App() {
  const [count, setCount] = useState(0)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [currentUrl, setCurrentUrl] = useState('/')
  
  useEffect(() => {
    // 初始化主题状态，与TitleBar组件保持一致
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDarkTheme(shouldUseDark)
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
      case '/providers':
        return <ProviderDemo />
      default:
        // 处理聊天路由 /chat/:sessionId 和主页
        return (
          <Home 
            isDarkTheme={isDarkTheme} 
            addSettingsTab={addSettingsTab}
            sessionId={sessionId}
            onNavigate={handleNavigate}
          />
        )
    }
  }

  const styles = createStyles(isDarkTheme);

  return (
    <ConfigProvider
      theme={isDarkTheme ? darkTheme : lightTheme}
          >
        <div style={styles.appContainer}>
          <TitleBar 
            onThemeChange={handleThemeChange}
            tabs={tabs}
            onTabClick={handleTabClick}
            onTabClose={handleTabClose}
            onNewTab={handleNewTab}
          />
          
          {/* 主内容区域 - 直接渲染组件 */}
          <div style={styles.mainContent}>
            {renderCurrentPage()}
          </div>
        </div>
    </ConfigProvider>
  )
}

export default App