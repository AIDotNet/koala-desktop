import React, { useState } from 'react'
import { Message, UserMessage as UserMessageType, AssistantMessage as AssistantMessageType } from '@/types/chat'
import UserMessage from './UserMessage'
import AssistantMessage from './AssistantMessage'
import './styles.css'

interface ChatMessageProps {
  message: Message
  isDarkTheme: boolean
  onCopy: (content: string) => void
  onDeleteMessage: (messageId: string) => void
  onEditMessage: (messageId: string, newContent: string) => void
  onRegenerateMessage?: (messageId: string) => void
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isDarkTheme,
  onCopy,
  onDeleteMessage,
  onEditMessage,
  onRegenerateMessage
}) => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  
  const handleEditStart = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }
  
  const handleEditCancel = () => {
    setEditingMessageId(null)
    setEditingContent('')
  }
  
  const handleEditSubmit = () => {
    if (editingMessageId && onEditMessage && editingContent.trim()) {
      onEditMessage(editingMessageId, editingContent)
      setEditingMessageId(null)
      setEditingContent('')
    }
  }
  
  const handleEditContentChange = (content: string) => {
    setEditingContent(content)
  }

  const isEditing = message.id === editingMessageId

  // 根据消息类型渲染对应组件
  if (message.role === 'user') {
    return (
      <UserMessage
        message={message as UserMessageType}
        isDarkTheme={isDarkTheme}
        isEditing={isEditing}
        editingContent={editingContent}
        onCopy={onCopy}
        onEditStart={handleEditStart}
        onEditCancel={handleEditCancel}
        onEditSubmit={handleEditSubmit}
        onEditContentChange={handleEditContentChange}
        onDeleteMessage={onDeleteMessage}
      />
    )
  } else if (message.role === 'assistant') {
    return (
      <AssistantMessage
        message={message as AssistantMessageType}
        isDarkTheme={isDarkTheme}
        isEditing={isEditing}
        editingContent={editingContent}
        onCopy={onCopy}
        onEditStart={handleEditStart}
        onEditCancel={handleEditCancel}
        onEditSubmit={handleEditSubmit}
        onEditContentChange={handleEditContentChange}
        onDeleteMessage={onDeleteMessage}
        onRegenerate={onRegenerateMessage || (() => {})}
      />
    )
  }
  
  // 默认返回空，如果有其他类型消息可以在这里处理
  return null
}

export default ChatMessage 