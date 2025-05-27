import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2, Settings } from 'lucide-react'
import { Button, theme, Layout, message } from 'antd'
import ThemeToggle from './ThemeToggle'
import TabBar, { Tab } from './TabBar'
import { getThemeColors } from '@/theme'
import './TitleBar.css'
import { Tooltip } from '@lobehub/ui'

interface TitleBarProps {
  onThemeChange?: (isDark: boolean) => void
  tabs?: Tab[]
  onTabClick?: (tabId: string) => void
  onTabClose?: (tabId: string) => void
  onNewTab?: () => void
  onSettingsClick?: () => void
}

const TitleBar: React.FC<TitleBarProps> = ({
  onThemeChange,
  tabs = [],
  onTabClick = () => { },
  onTabClose = () => { },
  onNewTab = () => { },
  onSettingsClick = () => { }
}) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const { token } = theme.useToken();
  const themeColors = getThemeColors(isDarkTheme);

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

  const handleSettings = async () => {
    onSettingsClick()
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
    <div className="titlebar" style={{ borderBottomColor: token.colorBorder }}>
      {/* 左侧可拖拽区域 */}
      <div className="titlebar-left">
        {tabs.length > 0 ? (
          <div className="titlebar-tabs">
            <TabBar
              tabs={tabs}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
              isDarkTheme={isDarkTheme}
            />
          </div>
        ) : (
          <div className="titlebar-app-title" style={{ color: themeColors.text.secondary }}>
            <span>Koala Desktop</span>
          </div>
        )}
      </div>

      {/* 右侧：窗口控制按钮 */}
      <div className="titlebar-right">
        <div className="titlebar-toggle-container">
          <Tooltip title={'打开系统设置'}>
            <Button
              type="text"
              icon={<Settings 
              size={15}
              />}
              onClick={handleSettings}
              className="theme-toggle-btn"
            />
          </Tooltip>
        </div>
        {/* 主题切换按钮 */}
        {onThemeChange && (
          <div className="titlebar-toggle-container">
            <ThemeToggle onThemeChange={handleThemeChange} />
          </div>
        )}

        <Button
          type="text"
          onClick={handleMinimize}
          className="window-button"
          title="最小化"
          icon={
            <Minus
              size={16}
              style={{ color: themeColors.text.tertiary }}
            />
          }
        />

        <Button
          type="text"
          onClick={handleMaximize}
          className="window-button"
          title={isMaximized ? "还原" : "最大化"}
          icon={
            isMaximized ? (
              <div className="restore-icon">
                <Square
                  size={12}
                  className="restore-icon-front"
                  style={{ color: themeColors.text.tertiary }}
                />
                <Square
                  size={12}
                  className="restore-icon-back"
                  style={{ color: themeColors.text.tertiary }}
                />
              </div>
            ) : (
              <Maximize2
                size={14}
                style={{ color: themeColors.text.tertiary }}
              />
            )
          }
        />

        <Button
          type="text"
          onClick={handleClose}
          className="window-button close-button"
          title="关闭"
          icon={
            <X
              size={16}
              style={{ color: themeColors.text.tertiary }}
            />
          }
        />
      </div>
    </div>
  )
}

export default TitleBar 