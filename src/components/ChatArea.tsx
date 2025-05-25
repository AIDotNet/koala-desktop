import React, { useState, useRef, useEffect } from 'react'
import { Avatar, Typography, Space, Button, Spin } from 'antd'
import { User, Bot, Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'
import { Message } from '@/types/chat'

const { Text, Paragraph } = Typography

interface ChatAreaProps {
  isDarkTheme: boolean
  messages: Message[]
  isLoading?: boolean
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  isDarkTheme, 
  messages, 
  isLoading = false 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleRegenerate = (messageId: string) => {
    console.log('重新生成消息:', messageId)
  }

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user'
    
    // 正确处理不同类型的消息内容
    let content = ''
    if (isUser) {
      // 用户消息内容
      const userContent = message.content as any
      if (typeof userContent === 'object' && userContent.text) {
        content = userContent.text
      } else if (typeof userContent === 'string') {
        content = userContent
      }
    } else {
      // 助手消息内容
      const assistantContent = message.content as any[]
      if (Array.isArray(assistantContent)) {
        content = assistantContent
          .filter(block => block.type === 'content' && block.content)
          .map(block => block.content)
          .join('\n')
      } else if (typeof assistantContent === 'string') {
        content = assistantContent
      }
    }

    return (
      <div
        key={message.id}
        className={`flex gap-4 p-6 ${
          isUser 
            ? 'justify-end' 
            : isDarkTheme 
              ? 'bg-gray-800/30' 
              : 'bg-gray-50'
        }`}
      >
        {!isUser && (
          <Avatar
            icon={<Bot size={16} />}
            className={`flex-shrink-0 ${
              isDarkTheme ? 'bg-blue-600' : 'bg-blue-500'
            }`}
          />
        )}
        
        <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block ${
            isUser 
              ? isDarkTheme
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : isDarkTheme
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-900'
          } rounded-lg p-4 ${
            isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
          }`}>
            <Paragraph 
              className={`!mb-0 ${
                isUser ? 'text-white' : isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {content}
            </Paragraph>
          </div>
          
          {!isUser && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="text"
                size="small"
                icon={<Copy size={14} />}
                onClick={() => handleCopy(content)}
                className={`${
                  isDarkTheme ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              />
              <Button
                type="text"
                size="small"
                icon={<ThumbsUp size={14} />}
                className={`${
                  isDarkTheme ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              />
              <Button
                type="text"
                size="small"
                icon={<ThumbsDown size={14} />}
                className={`${
                  isDarkTheme ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              />
              <Button
                type="text"
                size="small"
                icon={<RotateCcw size={14} />}
                onClick={() => handleRegenerate(message.id)}
                className={`${
                  isDarkTheme ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              />
            </div>
          )}
          
          <Text className={`text-xs block mt-1 ${
            isDarkTheme ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Text>
        </div>

        {isUser && (
          <Avatar
            icon={<User size={16} />}
            className={`flex-shrink-0 ${
              isDarkTheme ? 'bg-gray-600' : 'bg-gray-400'
            }`}
          />
        )}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-black">
        <div className="text-center">
          <Text className="text-gray-500">
            开始对话吧...
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className={`flex gap-4 p-6 ${
            isDarkTheme ? 'bg-gray-800/30' : 'bg-gray-50'
          }`}>
            <Avatar
              icon={<Bot size={16} />}
              className={`flex-shrink-0 ${
                isDarkTheme ? 'bg-blue-600' : 'bg-blue-500'
              }`}
            />
            <div className="flex-1">
              <div className={`inline-block ${
                isDarkTheme ? 'bg-gray-800' : 'bg-white'
              } rounded-lg rounded-bl-sm p-4`}>
                <Space>
                  <Spin size="small" />
                  <Text className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
                    正在思考...
                  </Text>
                </Space>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatArea 