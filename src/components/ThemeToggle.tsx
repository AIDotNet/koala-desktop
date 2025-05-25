import React, { useState, useEffect } from 'react'
import { Button, Tooltip } from 'antd'
import { SunOutlined, MoonOutlined } from '@ant-design/icons'

interface ThemeToggleProps {
  onThemeChange: (isDark: boolean) => void
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ onThemeChange }) => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 从本地存储读取主题设置
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    
    setIsDark(shouldUseDark)
    onThemeChange(shouldUseDark)
  }, [onThemeChange])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    onThemeChange(newTheme)
  }

  return (
    <Tooltip title={isDark ? '切换到亮色主题' : '切换到暗色主题'}>
      <Button
        type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggleTheme}
        className="theme-toggle-btn"
      />
    </Tooltip>
  )
}

export default ThemeToggle 