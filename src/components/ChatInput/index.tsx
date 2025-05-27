import React, { useState, useRef } from 'react'
import { Button, Input, message } from 'antd'
import { Send, Paperclip, X } from 'lucide-react'
import ModelSelector from '@/components/ModelSelector'
import { Provider } from '@/types/model'

const { TextArea } = Input

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  selectedModel: string
  onModelChange: (modelId: string) => void
  providers: Provider[]
  isLoading?: boolean
  isDarkTheme?: boolean
  placeholder?: string
  disabled?: boolean
  onFileUpload?: (files: { name: string; path: string; size: number }[]) => void
  onSendWithFiles?: (message: string, files: { name: string; path: string; size: number }[]) => void
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  selectedModel,
  onModelChange,
  providers,
  isLoading = false,
  isDarkTheme = false,
  placeholder,
  disabled = false,
  onFileUpload,
  onSendWithFiles
}) => {
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; path: string; size: number }[]>([])

  // 主题配置
  const theme = {
    colors: {
      bg: {
        primary: isDarkTheme ? '#0f0f0f' : '#f9fafb',
        secondary: isDarkTheme ? '#1a1a1a' : '#ffffff',
        tertiary: isDarkTheme ? '#2a2a2a' : '#f3f4f6',
        accent: isDarkTheme ? '#333333' : '#e5e7eb',
      },
      text: {
        primary: isDarkTheme ? '#ffffff' : '#1f2937',
        secondary: isDarkTheme ? '#b3b3b3' : '#6b7280',
        tertiary: isDarkTheme ? '#808080' : '#9ca3af',
        accent: isDarkTheme ? '#1890ff' : '#3b82f6',
      },
      border: {
        light: isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : '#e5e7eb',
        medium: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#d1d5db',
      },
      button: {
        primary: '#1890ff',
        primaryHover: '#40a9ff',
      }
    },
    shadow: {
      card: isDarkTheme ? '0 2px 8px rgba(0, 0, 0, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    glass: {
      background: isDarkTheme ? 'rgba(26, 26, 26, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
    }
  }

  const defaultPlaceholder = placeholder || '问点什么？可以通过@来引用工具、文件、资源...'

  // 处理文件选择 - 使用 Electron API
  const handleFileSelect = async () => {
    if (disabled) return

    try {
      // 检查是否在 Electron 环境中
      if (!window.electronAPI || !window.electronAPI.selectFiles) {
        message.warning('文件选择功能仅在桌面应用中可用')
        return
      }

      const result = await window.electronAPI.selectFiles({
        title: '选择代码文件',
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: '代码文件',
            extensions: [
              'js', 'jsx', 'ts', 'tsx', 'vue', 'py', 'java', 'cpp', 'c', 'h', 'hpp',
              'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bash',
              'ps1', 'bat', 'cmd', 'sql', 'html', 'htm', 'css', 'scss', 'sass',
              'less', 'xml', 'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
              'md', 'txt', 'log', 'dockerfile', 'makefile', 'cmake', 'gradle'
            ]
          },
          {
            name: '所有文件',
            extensions: ['*']
          }
        ]
      })

      if (result.canceled || result.filePaths.length === 0) {
        return
      }

      // 使用返回的文件信息
      const newFiles = result.files || []

      if (newFiles.length > 0) {
        const allFiles = [...uploadedFiles, ...newFiles]
        setUploadedFiles(allFiles)
        onFileUpload?.(allFiles)
        message.success(`成功添加 ${newFiles.length} 个代码文件`)
      }
    } catch (error) {
      console.error('文件选择失败:', error)
      message.error('文件选择失败')
    }
  }

  // 移除文件
  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onFileUpload?.(newFiles)
  }

  // 获取文件大小显示
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '未知大小'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (onSendWithFiles && value.trim()) {
        onSendWithFiles(value, uploadedFiles)
      } else if (onKeyPress) {
        onKeyPress(e)
      }
    } else if (onKeyPress) {
      onKeyPress(e)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        background: theme.colors.bg.secondary,
        backdropFilter: theme.glass.backdropFilter,
        borderRadius: '16px',
        border: `1px solid ${isInputFocused ? theme.colors.button.primary : theme.colors.border.medium}`,
        padding: '16px',
        boxShadow: isInputFocused ?
          `0 0 0 2px ${isDarkTheme ? 'rgba(24, 144, 255, 0.3)' : 'rgba(24, 144, 255, 0.2)'}` :
          theme.shadow.card,
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.6 : 1,
      }}>
        {/* 已上传文件列表 */}
        {uploadedFiles.length > 0 && (
          <div style={{
            marginBottom: '12px',
            padding: '8px',
            background: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border.light}`,
          }}>
            <div style={{
              fontSize: '12px',
              color: theme.colors.text.tertiary,
              marginBottom: '6px'
            }}>
              已添加的代码文件 ({uploadedFiles.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    background: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: theme.colors.text.secondary,
                  }}
                >
                  <span>{file.name}</span>
                  <span style={{ color: theme.colors.text.tertiary }}>
                    ({formatFileSize(file.size)})
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<X size={12} />}
                    onClick={() => removeFile(index)}
                    style={{
                      padding: '0',
                      width: '16px',
                      height: '16px',
                      minWidth: '16px',
                      color: theme.colors.text.tertiary,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={defaultPlaceholder}
          autoSize={{ minRows: 1, maxRows: 6 }}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          disabled={disabled}
          style={{
            background: 'transparent',
            border: 'none',
            resize: 'none',
            color: theme.colors.text.primary,
            padding: 0,
            boxShadow: 'none',
          }}
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: `1px solid ${theme.colors.border.light}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              type="text"
              size="small"
              icon={<Paperclip size={16} style={{ color: theme.colors.text.tertiary }} />}
              disabled={disabled}
              onClick={handleFileSelect}
              title="上传代码文件"
              style={{
                color: theme.colors.text.tertiary,
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '128px' }}>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                providers={providers}
                disabled={disabled || providers.length === 0 || providers.every(p => p.models.length === 0)}
              />
            </div>
            <Button
              type="primary"
              icon={<Send size={18} />}
              onClick={() => onSendWithFiles?.(value, uploadedFiles)}
              disabled={disabled || !value.trim() || isLoading}
              loading={isLoading}
              style={{
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput 