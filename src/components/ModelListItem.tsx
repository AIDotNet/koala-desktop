import React from 'react'
import { ProviderIcon } from '@lobehub/icons'
import {
  Card,
  Switch,
  Button,
  Typography,
  Space,
  Tooltip,
  Tag,
  Dropdown,
  message,
  Modal,
  theme
} from 'antd'
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  MoreHorizontal
} from 'lucide-react'
import { Model } from '@/types/model'
import { providerDB } from '@/utils/providerDB'

const { Text } = Typography

interface ModelListItemProps {
  model: Model
  index: number
  onEdit: (model: Model) => void
  onDelete: (modelId: string) => void
  onToggle: (providerId: string, modelId: string, enabled: boolean) => void
  onProviderUpdate: (provider: any) => void
  setSelectedProvider: (provider: any) => void
  setIsRefreshing: (refreshing: boolean) => void
}

// 格式化上下文窗口大小
const formatContextWindow = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`
  }
  return tokens.toString()
}

// 获取模型类型标签颜色
const getTypeTagColor = (type: string): string => {
  switch (type) {
    case 'chat': return 'blue'
    case 'image': return 'green'
    case 'embedding': return 'purple'
    case 'tts': return 'pink'
    case 'sst': return 'cyan'
    default: return 'default'
  }
}

// 获取模型类型显示名称
const getTypeDisplayName = (type: string): string => {
  switch (type) {
    case 'chat': return '对话'
    case 'image': return '图像'
    case 'embedding': return '嵌入'
    case 'tts': return '语音合成'
    case 'sst': return '语音识别'
    default: return type
  }
}

const ModelListItem: React.FC<ModelListItemProps> = ({
  model,
  index,
  onEdit,
  onDelete,
  onToggle,
  onProviderUpdate,
  setSelectedProvider,
  setIsRefreshing
}) => {
  // 获取主题token
  const { token } = theme.useToken()
  
  // 添加CSS动画样式
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  // 处理模型状态切换
  const handleToggle = async (checked: boolean) => {
    try {
      setIsRefreshing(true)
      
      onToggle(model.provider, model.id, checked)
      
      message.loading({
        content: '正在更新模型状态...',
        duration: 0.5,
        key: 'modelToggle'
      })

      setTimeout(async () => {
        try {
          const updatedProvider = await providerDB.getProvider(model.provider)
          if (updatedProvider) {
            onProviderUpdate(updatedProvider)
            setSelectedProvider(updatedProvider)
            message.success({
              content: `模型 "${model.displayName}" 已${checked ? '启用' : '禁用'}`,
              key: 'modelToggle'
            })
          }
        } catch (error) {
          console.error('刷新提供商数据失败:', error)
          message.error({
            content: '更新状态失败，请重试',
            key: 'modelToggle'
          })
        } finally {
          setIsRefreshing(false)
        }
      }, 100)
    } catch (error) {
      console.error('切换模型状态失败:', error)
      message.error('操作失败')
      setIsRefreshing(false)
    }
  }

  // 处理删除确认
  const handleDelete = () => {
    Modal.confirm({
      title: '删除模型',
      content: `确定要删除模型 "${model.displayName}" 吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => onDelete(model.id)
    })
  }

  // 右键菜单项
  const menuItems = [
    {
      key: 'edit',
      label: '编辑模型',
      icon: <Edit size={14} />,
      onClick: () => onEdit(model)
    },
    {
      key: 'toggle',
      label: model.enabled ? '禁用模型' : '启用模型',
      icon: model.enabled ? <EyeOff size={14} /> : <Eye size={14} />,
      onClick: () => handleToggle(!model.enabled)
    },
    {
      type: 'divider' as const
    },
    {
      key: 'delete',
      label: '删除模型',
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: handleDelete
    }
  ]

  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        transition: 'all 0.2s ease',
        animation: `fadeIn 0.3s ease-out forwards`,
        animationDelay: `${index * 0.03}s`,
        opacity: 0,
        boxShadow: token.boxShadowTertiary
      }}
      bodyStyle={{ padding: '16px' }}
      hoverable
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 左侧：图标和信息 */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: token.borderRadiusLG,
              backgroundColor: token.colorFillQuaternary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              flexShrink: 0,
              border: `1px solid ${token.colorBorderSecondary}`
            }}
          >
            <ProviderIcon
              provider={model.provider}
              size={24}
              type="color"
            />
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <Text
                strong
                style={{
                  fontSize: 15,
                  marginRight: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 250,
                  color: token.colorText
                }}
                title={model.displayName}
              >
                {model.displayName}
              </Text>
              
              {/* 能力图标 */}
              <Space size={6}>
                {model.abilities?.vision && (
                  <Tooltip title="支持视觉识别">
                    <div style={{
                      padding: '2px 6px',
                      backgroundColor: token.colorPrimaryBg,
                      borderRadius: token.borderRadiusSM,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Eye size={12} style={{ color: token.colorPrimary }} />
                    </div>
                  </Tooltip>
                )}
                {model.abilities?.functionCall && (
                  <Tooltip title="支持函数调用">
                    <div style={{
                      padding: '2px 6px',
                      backgroundColor: token.colorWarningBg,
                      borderRadius: token.borderRadiusSM,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Zap size={12} style={{ color: token.colorWarning }} />
                    </div>
                  </Tooltip>
                )}
              </Space>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontFamily: 'Monaco, Consolas, monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 180,
                  backgroundColor: token.colorFillTertiary,
                  padding: '2px 6px',
                  borderRadius: token.borderRadiusSM
                }}
                title={model.id}
              >
                {model.id}
              </Text>
              
              <Tag
                color={getTypeTagColor(model.type)}
                style={{ 
                  fontSize: 11, 
                  padding: '2px 8px', 
                  margin: 0,
                  borderRadius: token.borderRadiusLG,
                  fontWeight: 500
                }}
              >
                {getTypeDisplayName(model.type)}
              </Tag>
            </div>
          </div>
        </div>

        {/* 右侧：操作区域 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {/* 上下文窗口大小 */}
          <Tooltip title={`上下文窗口: ${model.contextWindowTokens.toLocaleString()} tokens`}>
            <div style={{
              padding: '4px 8px',
              backgroundColor: token.colorFillSecondary,
              borderRadius: token.borderRadius,
              fontSize: 12,
              fontWeight: 500,
              color: token.colorTextSecondary,
              minWidth: 'fit-content'
            }}>
              {formatContextWindow(model.contextWindowTokens)}
            </div>
          </Tooltip>

          {/* 启用状态开关 */}
          <Switch
            size="small"
            checked={model.enabled}
            onChange={handleToggle}
            style={{ flexShrink: 0 }}
          />

          {/* 更多操作菜单 */}
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<MoreHorizontal size={16} />}
              style={{
                color: token.colorTextTertiary,
                border: 'none',
                padding: '6px',
                height: 'auto',
                flexShrink: 0,
                borderRadius: token.borderRadius
              }}
            />
          </Dropdown>
        </div>
      </div>
    </Card>
  )
}

export default ModelListItem 