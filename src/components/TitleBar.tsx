import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'
import { Button } from 'antd'
import ThemeToggle from './ThemeToggle'
import TabBar, { Tab } from './TabBar'

interface TitleBarProps {
  onThemeChange?: (isDark: boolean) => void
  tabs?: Tab[]
  onTabClick?: (tabId: string) => void
  onTabClose?: (tabId: string) => void
  onNewTab?: () => void
}

const TitleBar: React.FC<TitleBarProps> = ({ 
  onThemeChange, 
  tabs = [],
  onTabClick = () => {},
  onTabClose = () => {},
  onNewTab = () => {}
}) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  useEffect(() => {
    // 检查初始最大化状态
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized)
    }

    // 初始化主题状态
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDarkTheme(shouldUseDark)
  }, [])

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow()
    }
  }

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow().then(() => {
        // 切换最大化状态
        setIsMaximized(!isMaximized)
      })
    }
  }

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow()
    }
  }

  const handleThemeChange = (isDark: boolean) => {
    setIsDarkTheme(isDark)
    onThemeChange?.(isDark)
  }

  return (
    <div className={`flex items-center h-10 border-b select-none transition-colors duration-300 drag-region ${
      isDarkTheme 
        ? 'bg-gray-900 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      {/* 左侧可拖拽区域 */}
      <div className="flex-1 h-full flex items-center">
        {tabs.length > 0 ? (
          <div className="h-full no-drag-region">
            <TabBar
              tabs={tabs}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
              isDarkTheme={isDarkTheme}
            />
          </div>
        ) : (
          <div className="flex items-center h-full px-3 drag-region">
            <span className={`text-sm font-medium ${
              isDarkTheme ? 'text-gray-200' : 'text-gray-700'
            }`}>Koala Desktop</span>
          </div>
        )}
      </div>

      {/* 右侧：窗口控制按钮 */}
      <div className="flex no-drag-region">
        {/* 主题切换按钮 */}
        {onThemeChange && (
          <div className="flex items-center justify-center w-12 h-10">
            <ThemeToggle onThemeChange={handleThemeChange} />
          </div>
        )}
        
        <Button
          type='text'
          onClick={handleMinimize}
          className={`flex items-center justify-center w-12 h-10 transition-colors duration-150 group border-0 ${
            isDarkTheme 
              ? 'hover:bg-gray-700' 
              : 'hover:bg-gray-100'
          }`}
          title="最小化"
        >
          <Minus size={16} className={`transition-colors ${
            isDarkTheme 
              ? 'text-gray-300 group-hover:text-white' 
              : 'text-gray-600 group-hover:text-gray-900'
          }`} />
        </Button>
        <Button
          type='text'
          onClick={handleMaximize}
          className={`flex items-center justify-center w-12 h-10 transition-colors duration-150 group border-0 ${
            isDarkTheme 
              ? 'hover:bg-gray-700' 
              : 'hover:bg-gray-100'
          }`}
          title={isMaximized ? "还原" : "最大化"}
        >
          {isMaximized ? (
            <div className="relative">
              <Square size={12} className={`transition-colors absolute top-0.5 left-0.5 ${
                isDarkTheme 
                  ? 'text-gray-300 group-hover:text-white' 
                  : 'text-gray-600 group-hover:text-gray-900'
              }`} />
              <Square size={12} className={`transition-colors ${
                isDarkTheme 
                  ? 'text-gray-300 group-hover:text-white' 
                  : 'text-gray-600 group-hover:text-gray-900'
              }`} />
            </div>
          ) : (
            <Maximize2 size={14} className={`transition-colors ${
              isDarkTheme 
                ? 'text-gray-300 group-hover:text-white' 
                : 'text-gray-600 group-hover:text-gray-900'
            }`} />
          )}
        </Button>
        <Button
          type='text'
          onClick={handleClose}
          className="flex items-center justify-center w-12 h-10 hover:bg-red-600 transition-colors duration-150 group border-0"
          title="关闭"
        >
          <X size={16} className="text-gray-300 group-hover:text-white" />
        </Button>
      </div>
    </div>
  )
}

export default TitleBar 