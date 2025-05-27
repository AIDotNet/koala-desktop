import React from 'react'
import { Avatar, Typography, Button, Popconfirm, Input } from 'antd'
import { Bot, Copy, ThumbsUp, ThumbsDown, RotateCcw, Trash2, Edit } from 'lucide-react'
import { ModelIcon, ProviderIcon } from '@lobehub/icons'
import { AssistantMessage as AssistantMessageType } from '@/types/chat'
import '../styles.css'
import MarkdownRenderer from '@/components/Markdown'


const { Text, Paragraph } = Typography
const { TextArea } = Input

interface AssistantMessageProps {
    message: AssistantMessageType
    isDarkTheme: boolean
    isLoading: boolean
    isEditing: boolean
    editingContent: string
    onCopy: (content: string) => void
    onEditStart: (messageId: string, content: string) => void
    onEditCancel: () => void
    onEditSubmit: () => void
    onEditContentChange: (content: string) => void
    onDeleteMessage: (messageId: string) => void
    onRegenerate: (messageId: string) => void
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
    message,
    isDarkTheme,
    isLoading,
    isEditing,
    editingContent,
    onCopy,
    onEditStart,
    onEditCancel,
    onEditSubmit,
    onEditContentChange,
    onDeleteMessage,
    onRegenerate
}) => {
    // 处理助手消息内容
    let content = ''
    const assistantContent = message.content
    if (Array.isArray(assistantContent)) {
        content = assistantContent
            .filter(block => block.type === 'content' && block.content)
            .map(block => block.content)
            .join('\n')
    } else if (typeof assistantContent === 'string') {
        content = assistantContent
    }

    // 根据模型提供商渲染图标
    const renderModelIcon = () => {
        // 如果有模型提供商信息，使用 ProviderIcon
        if (message.model_provider) {
            return (
                <ModelIcon
                    model={message.model_id}
                    key={message.model_provider}
                    size={32}
                />
            )
        }
        // 回退到默认的 Bot 图标
        return <Bot size={32} />
    }

    // 如果当前消息正在编辑中
    if (isEditing) {
        return (
            <div className="message-container assistant-message-container">
                {renderModelIcon()}
                <div className="message-content" style={{ width: 'auto' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px' }}>
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
            </div>
        )
    }
    return (
        <div className="message-container assistant-message-container">
            {renderModelIcon()}
            <div className="message-content">
                <div className="message-bubble assistant-message-bubble">
                    <MarkdownRenderer
                        content={content}
                        isDarkTheme={isDarkTheme}
                        isLoading={isLoading}
                        enableCopy={true}
                        enableZoom={false}
                        enableDrag={false}
                        enableFullscreen={false}
                    />
                </div>

                <div className="message-actions">
                    <Button
                        type="text"
                        size="small"
                        icon={<RotateCcw size={14} />}
                        onClick={() => onRegenerate(message.id)}
                        className={`action-button ${isDarkTheme ? 'dark' : 'light'}`}
                        title="重新生成"
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<ThumbsUp size={14} />}
                        className={`action-button ${isDarkTheme ? 'dark' : 'light'}`}
                        title="赞同"
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<ThumbsDown size={14} />}
                        className={`action-button ${isDarkTheme ? 'dark' : 'light'}`}
                        title="不赞同"
                    />
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
                        placement="right"
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
        </div>
    )
}

export default AssistantMessage 