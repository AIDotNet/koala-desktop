import React from 'react'
import { Avatar, Typography, Button, Popconfirm, Input } from 'antd'
import { User, Copy, Edit, Trash2 } from 'lucide-react'
import { UserMessage as UserMessageType } from '@/types/chat'
import '../styles.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

interface UserMessageProps {
  message: UserMessageType
  isDarkTheme: boolean
  isEditing: boolean
  editingContent: string
  onCopy: (content: string) => void
  onEditStart: (messageId: string, content: string) => void
  onEditCancel: () => void
  onEditSubmit: () => void
  onEditContentChange: (content: string) => void
  onDeleteMessage: (messageId: string) => void
}

const UserMessage: React.FC<UserMessageProps> = ({
  message,
  isDarkTheme,
  isEditing,
  editingContent,
  onCopy,
  onEditStart,
  onEditCancel,
  onEditSubmit,
  onEditContentChange,
  onDeleteMessage
}) => {
  // 处理用户消息内容
  let content = ''
  const userContent = message.content as any
  if (typeof userContent === 'object' && userContent.text) {
    content = userContent.text
  } else if (typeof userContent === 'string') {
    content = userContent
  }
  
  // 如果当前消息正在编辑中
  if (isEditing) {
    return (
      <div className="message-container user-message-container">
        <div className="message-content user-message-content" style={{ width: '100%' }}>
          <div className="edit-message-area">
            <TextArea 
              value={editingContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 6 }}
              style={{ 
                width: '100%',
                marginBottom: '10px',
                borderRadius: '8px',
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                color: isDarkTheme ? '#f0f0f8' : '#1f2937',
                border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button 
                size="small" 
                onClick={onEditCancel}
                style={{
                  backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6',
                  color: isDarkTheme ? '#f0f0f8' : '#374151',
                  border: 'none'
                }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                size="small" 
                onClick={onEditSubmit}
                style={{
                  backgroundColor: '#6366f1',
                  borderColor: '#6366f1'
                }}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
        
        <Avatar
          icon={<User size={16} />}
          className={`user-avatar ${isDarkTheme ? 'dark' : 'light'}`}
        />
      </div>
    )
  }

  return (
    <div className="message-container user-message-container">
      <div className="message-content user-message-content">
        <div className="message-bubble user-message-bubble">
          <Paragraph className="message-text">
            {content}
          </Paragraph>
        </div>
        
        <div className="message-actions">
          <Button
            type="text"
            size="small"
            icon={<Copy size={14} />}
            onClick={() => onCopy(content)}
            className={`action-button ${isDarkTheme ? 'dark' : 'light'}`}
            title="复制"
          />
          
          <Button
            type="text"
            size="small"
            icon={<Edit size={14} />}
            onClick={() => onEditStart(message.id, content)}
            className={`action-button ${isDarkTheme ? 'dark' : 'light'}`}
            title="编辑"
          />
          
          <Popconfirm
            title="确定要删除这条消息吗？"
            onConfirm={() => onDeleteMessage(message.id)}
            okText="是"
            cancelText="否"
            placement="left"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={14} />}
              className={`action-button ${isDarkTheme ? 'dark' : 'light'}`}
              title="删除"
            />
          </Popconfirm>
        </div>
        
        <Text className="message-time">
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </div>

      <Avatar
        icon={<User size={16} />}
        className={`user-avatar ${isDarkTheme ? 'dark' : 'light'}`}
      />
    </div>
  )
}

export default UserMessage 