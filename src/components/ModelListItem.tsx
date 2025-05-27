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
  return tokens?.toString()
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

// 自定义样式钩子
const useModelItemStyles = (token: any, enabled: boolean) => {
  return {
    card: {
      marginBottom: token.marginXS,
      border: `1px solid ${token.colorBorder}`,
      borderRadius: token.borderRadius,
      transition: 'all 0.2s ease',
      opacity: enabled ? 1 : 0.7,
      boxShadow: token.boxShadowTertiary,
      background: token.colorBgContainer
    },
    iconContainer: {
      width: '32px',
      height: '32px',
      borderRadius: token.borderRadiusSM,
      background: enabled ? `${token.colorPrimary}15` : token.colorFillQuaternary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: token.marginSM,
      transition: 'all 0.3s ease'
    },
    modelInfo: {
      flex: 1,
      minWidth: 0
    },
    modelName: {
      color: token.colorText,
      fontWeight: 500,
      fontSize: token.fontSize,
      marginBottom: '2px',
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS
    },
    modelMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS,
      flexWrap: 'wrap' as const,
      marginBottom: '4px'
    },
    contextInfo: {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    abilities: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px'
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS
    }
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
  const styles = useModelItemStyles(token, model.enabled || false)

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

  // 渲染模型能力图标
  const renderAbilities = () => {
    const abilities = [];

    if (model.abilities?.functionCall) {
      abilities.push(
        <Tooltip key="function" title="支持函数调用">
          <Zap size={12} style={{ color: token.colorInfo }} />
        </Tooltip>
      )
    }

    if (model.abilities?.vision) {
      abilities.push(
        <Tooltip key="vision" title="支持视觉识别">
          <Eye size={12} style={{ color: token.colorSuccess }} />
        </Tooltip>
      )
    }

    return abilities
  }

  return (
    <Card
      size="small"
      style={{
        ...styles.card,
        animation: `fadeIn 0.3s ease-out forwards`,
        animationDelay: `${index * 0.03}s`,
        opacity: 0
      }}
      bodyStyle={{ padding: token.paddingLG }}
      hoverable
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 左侧：图标和信息 */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <div style={styles.iconContainer}>
            <ProviderIcon
              provider={model.provider}
              size={18}
              type={'color'}
            />
          </div>

          <div style={styles.modelInfo}>
            <div style={styles.modelName}>
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '200px'
              }}>
                {model.displayName}
              </span>
              <Tag
                color={getTypeTagColor(model.type)}
                style={{
                  fontSize: token.fontSizeSM,
                  lineHeight: '16px',
                  margin: 0
                }}
              >
                {getTypeDisplayName(model.type)}
              </Tag>
            </div>

            <div style={styles.modelMeta}>
              <Text style={{
                color: token.colorTextQuaternary,
                fontSize: token.fontSizeSM
              }}>
                ID: {model.id}
              </Text>
            </div>

            <div style={styles.contextInfo}>
              <span>上下文: {formatContextWindow(model.contextWindowTokens || 0)}</span>
              <span style={{ color: token.colorTextQuaternary }}>•</span>
              <span>输出: {formatContextWindow(model.maxOutput || 0)}</span>
              {model.pricing && (
                <>
                  <span style={{ color: token.colorTextQuaternary }}>•</span>
                  <span style={{ color: token.colorWarning }}>
                    ${model.pricing.input || 0}/${model.pricing.output || 0}
                  </span>
                </>
              )}
            </div>

            {(model.abilities?.functionCall || model.abilities?.vision) && (
              <div style={styles.abilities}>
                {renderAbilities()}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：控制按钮 */}
        <div style={styles.controls}>
          <Switch
            checked={model.enabled}
            onChange={handleToggle}
            size="small"
          />

          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreHorizontal size={16} />}
              size="small"
              style={{
                color: token.colorTextTertiary,
                border: 'none',
                background: 'transparent'
              }}
            />
          </Dropdown>
        </div>
      </div>
    </Card>
  )
}

export default ModelListItem 