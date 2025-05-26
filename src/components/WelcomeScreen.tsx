import React, { useState } from 'react'
import { Typography, Button, Space, Input } from 'antd'
import { Bot, MessageSquare, Sparkles, GitBranch, Image, Code, Rocket, Send, Paperclip } from 'lucide-react'
import './WelcomeScreen.css'

const { Title, Text } = Typography
const { TextArea } = Input

interface WelcomeScreenProps {
  isDarkTheme: boolean
  onNewChat?: () => void
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  isDarkTheme,
  onNewChat
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)

  // 主题颜色变量
  const theme = {
    colors: {
      // 背景色系
      bg: {
        primary: isDarkTheme ? '#121218' : '#f9fafb',
        secondary: isDarkTheme ? '#1e1e2a' : '#ffffff',
        tertiary: isDarkTheme ? '#262636' : '#f3f4f6',
        accent: isDarkTheme ? '#2a2a40' : '#e5e7eb',
      },
      // 文字色系
      text: {
        primary: isDarkTheme ? '#f0f0f8' : '#1f2937',
        secondary: isDarkTheme ? '#c0c0cf' : '#6b7280',
        tertiary: isDarkTheme ? '#8e8ea0' : '#9ca3af',
        accent: isDarkTheme ? '#6366f1' : '#3b82f6',
      },
      // 边框色系
      border: {
        light: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
        medium: isDarkTheme ? 'rgba(255, 255, 255, 0.12)' : '#d1d5db',
      },
      // 按钮颜色
      button: {
        primary: '#6366f1',
        primaryHover: '#4f46e5',
      }
    },
    // 阴影
    shadow: {
      card: isDarkTheme ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    // 玻璃态效果
    glass: {
      background: isDarkTheme ? 'rgba(30, 30, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
    }
  };

  // 功能卡片数据
  const features = [
    {
      icon: <MessageSquare size={24} />,
      title: '智能对话',
      description: '基于先进大模型的自然语言交流体验'
    },
    {
      icon: <Sparkles size={24} />,
      title: '创意助手',
      description: '激发灵感，协助创作与内容生成'
    },
    {
      icon: <Code size={24} />,
      title: '代码能力',
      description: '支持代码生成、调试与技术问题解答'
    },
    {
      icon: <Image size={24} />,
      title: '图像理解',
      description: '可分析图片内容并进行智能交互'
    }
  ]

  const handleSend = () => {
    if (inputValue.trim() && onNewChat) {
      // 这里可以先保存用户的输入到本地存储或上下文中，
      // 以便在新建会话后能直接使用该输入作为第一条消息
      localStorage.setItem('initialMessage', inputValue);
      
      // 调用新建会话方法
      onNewChat();
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={`welcome-container ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="welcome-content">
        <div className="welcome-header">
          <div className="logo-container">
            <Bot size={40} className="logo-icon" />
          </div>
          <Title level={2} className="welcome-title">欢迎使用 Koala AI 助手</Title>
          <Text className="welcome-subtitle">
            一款强大的AI助手，为您提供智能对话与创意支持
          </Text>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-container">
                {feature.icon}
              </div>
              <div className="feature-content">
                <Text strong className="feature-title">{feature.title}</Text>
                <Text className="feature-description">{feature.description}</Text>
              </div>
            </div>
          ))}
        </div>
        
        {/* 输入框区域 */}
        <div className="input-area-container">
          <div className="input-area-wrapper"
            style={{
              background: theme.glass.background,
              backdropFilter: theme.glass.backdropFilter,
              borderRadius: '16px',
              border: `1px solid ${isInputFocused ? theme.colors.button.primary : theme.colors.border.medium}`,
              padding: '16px',
              boxShadow: isInputFocused ?
                `0 0 0 2px ${isDarkTheme ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}` :
                theme.shadow.card,
              transition: 'all 0.3s ease',
            }}
          >
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="问点什么？可以通过@来引用工具、文件、资源..."
              autoSize={{ minRows: 1, maxRows: 6 }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              style={{
                background: 'transparent',
                border: 'none',
                resize: 'none',
                color: theme.colors.text.primary,
                padding: 0,
                boxShadow: 'none',
              }}
            />

            {/* 底部操作栏 */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: `1px solid ${theme.colors.border.light}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  type="text"
                  size="small"
                  icon={<Paperclip size={16} style={{ color: theme.colors.text.tertiary }} />}
                  style={{
                    color: theme.colors.text.tertiary,
                  }}
                />
              </div>

              <Button
                type="primary"
                icon={<Send size={16} />}
                onClick={handleSend}
                disabled={!inputValue.trim()}
                style={{
                  background: theme.colors.button.primary,
                  borderColor: theme.colors.button.primary,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                }}
                size="small"
              />
            </div>
          </div>
        </div>
        
        <div className="welcome-footer">
          <Space>
            <Button 
              type="text" 
              icon={<GitBranch size={14} />}
              className="footer-button"
            >
              版本 2.2.0
            </Button>
            <Button 
              type="text" 
              icon={<Rocket size={14} />}
              className="footer-button"
            >
              新功能
            </Button>
          </Space>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen 