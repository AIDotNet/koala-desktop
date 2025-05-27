import React, {  useRef, useEffect } from 'react'
import { message as antdMessage } from 'antd'
import { Message } from '@/types/chat'
import ChatMessage from '../ChatMessage'
import './index.css'

interface ChatAreaProps {
  isDarkTheme: boolean
  messages: Message[]
  isLoading?: boolean
  onNewChat?: () => void
  onSendMessage?: (content: string) => void
  onDeleteMessage?: (messageId: string) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onRegenerateMessage?: (messageId: string) => void
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  isDarkTheme, 
  messages, 
  isLoading = false,
  onNewChat,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onRegenerateMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 检查是否存在欢迎页面保存的初始消息
  useEffect(() => {
    if (messages.length === 0 && onSendMessage) {
      const initialMessage = localStorage.getItem('initialMessage')
      if (initialMessage) {
        // 发送初始消息
        onSendMessage(initialMessage)
        // 发送后清除存储的消息
        localStorage.removeItem('initialMessage')
      }
    }
  }, [messages.length, onSendMessage])

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    antdMessage.success('已复制到剪贴板')
  }

  return (
    <div className="chat-area">
      <div className="chat-content">
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isDarkTheme={isDarkTheme}
            onCopy={handleCopy}
            isLoading={isLoading}
            onDeleteMessage={onDeleteMessage || (() => {})}
            onEditMessage={onEditMessage || (() => {})}
            onRegenerateMessage={onRegenerateMessage}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatArea