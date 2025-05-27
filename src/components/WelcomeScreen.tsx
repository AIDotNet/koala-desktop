import React, { useState } from 'react'
import { Typography, Button, Space } from 'antd'
import { Bot, MessageSquare, Sparkles, GitBranch, Image, Code, Rocket } from 'lucide-react'
import ChatInput from '@/components/ChatInput'
import { Provider } from '@/types/model'
import './WelcomeScreen.css'

const { Title, Text } = Typography

interface WelcomeScreenProps {
  isDarkTheme: boolean
  onNewChat?: () => void
  selectedModel?: string
  onModelChange?: (modelId: string) => void
  providers?: Provider[]
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  isDarkTheme,
  onNewChat,
  selectedModel = '',
  onModelChange = () => {},
  providers = []
}) => {
  const [inputValue, setInputValue] = useState('')

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
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onKeyPress={handleKeyPress}
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            providers={providers}
            isDarkTheme={isDarkTheme}
            placeholder="问点什么？可以通过@来引用工具、文件、资源..."
          />
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen 