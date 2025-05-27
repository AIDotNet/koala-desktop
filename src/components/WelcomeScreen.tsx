import React, { useState } from 'react'
import { Typography, Button, Space, message } from 'antd'
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

  // 处理文件上传
  const handleFileUpload = async (files: { name: string; path: string; size: number }[]) => {
    try {
      // 只记录文件，不将内容插入到输入框中
      console.log('已上传文件:', files.map(f => ({ name: f.name, path: f.path, size: f.size })))
      // 这里可以根据需要保存文件信息到状态或其他地方
      // 文件内容将在发送消息时读取和处理
    } catch (error) {
      console.error('处理文件失败:', error)
      message.error('处理文件失败')
    }
  }

  // 读取文件内容 - 使用 Electron API
  const readFileContent = async (file: { name: string; path: string; size: number }): Promise<string> => {
    try {
      // 检查是否在 Electron 环境中
      if (!window.electronAPI || !window.electronAPI.readFile) {
        throw new Error('文件读取功能仅在桌面应用中可用')
      }

      const result = await window.electronAPI.readFile(file.path)
      
      if (!result.success) {
        throw new Error(result.error || '文件读取失败')
      }

      return result.content || ''
    } catch (error) {
      console.error(`读取文件 ${file.name} 失败:`, error)
      throw error
    }
  }

  // 根据文件扩展名获取语言标识
  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'vue': 'vue',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'bash',
      'bash': 'bash',
      'ps1': 'powershell',
      'bat': 'batch',
      'cmd': 'batch',
      'sql': 'sql',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'xml': 'xml',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'cfg': 'ini',
      'conf': 'ini',
      'md': 'markdown',
      'txt': 'text',
      'log': 'text',
      'dockerfile': 'dockerfile',
      'makefile': 'makefile',
      'cmake': 'cmake',
      'gradle': 'gradle'
    }
    return languageMap[ext || ''] || 'text'
  }

  // 处理带文件的消息发送
  const handleSendWithFiles = async (messageText: string, files: { name: string; path: string; size: number }[]) => {
    if (!messageText.trim() && files.length === 0) return

    let finalMessage = messageText.trim()

    // 如果有文件，将文件内容添加到消息中
    if (files.length > 0) {
      try {
        const fileContents: string[] = []
        
        for (const file of files) {
          const content = await readFileContent(file)
          const fileInfo = `\n\n**文件: ${file.name}**\n\`\`\`${getFileLanguage(file.name)}\n${content}\n\`\`\`\n`
          fileContents.push(fileInfo)
        }
        
        finalMessage = messageText + fileContents.join('')
      } catch (error) {
        console.error('读取文件失败:', error)
        message.error('读取文件失败')
        return
      }
    }

    // 保存最终消息并创建新会话
    if (finalMessage.trim() && onNewChat) {
      localStorage.setItem('initialMessage', finalMessage)
      onNewChat()
    }
  }

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
            onFileUpload={handleFileUpload}
            onSendWithFiles={handleSendWithFiles}
          />
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen 