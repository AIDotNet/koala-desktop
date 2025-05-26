import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'
import { Button } from 'antd'
import ThemeToggle from './ThemeToggle'
import TabBar, { Tab } from './TabBar'
import { createStyles } from '@/theme'

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
  onTabClick = () => { },
  onTabClose = () => { },
  onNewTab = () => { }
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

  const styles = createStyles(isDarkTheme);

  const titleBarStyle = {
    ...styles.titleBar,
    display: 'flex',
    alignItems: 'center',
    height: '40px',
    borderBottom: `1px solid ${isDarkTheme ? '#3a3a4a' : '#e5e7eb'}`,
    userSelect: 'none' as const,
    transition: 'all 0.3s ease',
    WebkitAppRegion: 'drag' as any,
  };

  const leftAreaStyle = {
    flex: 1,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
  };

  const rightAreaStyle = {
    display: 'flex',
    WebkitAppRegion: 'no-drag' as any,
  };

  const windowButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '40px',
    border: 'none',
    background: 'transparent',
    transition: 'background-color 0.15s ease',
    cursor: 'pointer',
  };

  const closeButtonStyle = {
    ...windowButtonStyle,
  };

  const themeToggleContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '40px',
  };

  const appTitleStyle = {
    fontSize: '14px',
    fontWeight: 500,
    color: isDarkTheme ? '#e0e0e8' : '#6b7280',
    padding: '0 12px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    WebkitAppRegion: 'drag' as any,
  };

  const tabContainerStyle = {
    height: '100%',
    WebkitAppRegion: 'no-drag' as any,
  };

  return (
    <div style={titleBarStyle}>
      {/* 左侧可拖拽区域 */}
      <div style={leftAreaStyle}>
        {tabs.length > 0 ? (
          <div style={tabContainerStyle}>
            <TabBar
              tabs={tabs}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
              isDarkTheme={isDarkTheme}
            />
          </div>
        ) : (
          <div style={appTitleStyle}>
            <span>Koala Desktop</span>
          </div>
        )}
      </div>

      {/* 右侧：窗口控制按钮 */}
      <div style={rightAreaStyle}>
        {/* 主题切换按钮 */}
        {onThemeChange && (
          <div style={themeToggleContainerStyle}>
            <ThemeToggle onThemeChange={handleThemeChange} />
          </div>
        )}

        <Button
          type='text'
          onClick={handleMinimize}
          style={windowButtonStyle}
          title="最小化"
          icon={
            <Minus 
              size={16} 
              style={{ 
                color: isDarkTheme ? '#b0b0c0' : '#6b7280',
                transition: 'color 0.15s ease',
              }} 
            />
          }
        />
        
        <Button
          type='text'
          onClick={handleMaximize}
          style={windowButtonStyle}
          title={isMaximized ? "还原" : "最大化"}
          icon={
            isMaximized ? (
              <div style={{ position: 'relative' }}>
                <Square 
                  size={12} 
                  style={{ 
                    position: 'absolute', 
                    top: '2px', 
                    left: '2px',
                    color: isDarkTheme ? '#b0b0c0' : '#6b7280',
                  }} 
                />
                <Square 
                  size={12} 
                  style={{ 
                    color: isDarkTheme ? '#b0b0c0' : '#6b7280',
                  }} 
                />
              </div>
            ) : (
              <Maximize2 
                size={14} 
                style={{ 
                  color: isDarkTheme ? '#b0b0c0' : '#6b7280',
                  transition: 'color 0.15s ease',
                }} 
              />
            )
          }
        />
        
        <Button
          type='text'
          onClick={handleClose}
          style={closeButtonStyle}
          title="关闭"
          icon={
            <X 
              size={16} 
              style={{ 
                color: isDarkTheme ? '#b0b0c0' : '#6b7280',
                transition: 'color 0.15s ease',
              }} 
            />
          }
        />
      </div>
    </div>
  )
}

export default TitleBar 