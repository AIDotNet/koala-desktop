import React, { useState } from 'react'
import { Button, Input } from 'antd'
import { Send, Paperclip } from 'lucide-react'
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
  disabled = false
}) => {
  const [isInputFocused, setIsInputFocused] = useState(false)

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
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
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

        {/* 底部操作栏 */}
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
              onClick={onSend}
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