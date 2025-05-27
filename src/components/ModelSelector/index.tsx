import React, { useState } from 'react'
import { Select } from 'antd'
import { ChevronDown, Zap, Eye, Cpu, Sparkles, Brain } from 'lucide-react'
import { Model, Provider, ModelSelectorProps } from '@/types/model'
import { getIcon, IconName } from '@/utils/iconutils'
import './ModelSelector.css'
import { IconProvider, Tooltip } from '@lobehub/ui'
import { ProviderIcon } from '@lobehub/icons'

const { Option } = Select

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  providers,
  disabled = false,
  className = ''
}) => {
  const [open, setOpen] = useState(false)

  // 获取所有启用渠道下的启用模型
  const getEnabledModels = (): Model[] => {
    return providers
      .filter(provider => provider.enabled) // 只获取启用的渠道
      .flatMap(provider =>
        provider.models.filter(model => model.enabled) // 只获取启用的模型
      )
  }

  // 根据服务商分组模型（只包含启用的渠道和模型）
  const getGroupedModels = () => {
    const groups: { [key: string]: { models: Model[], provider: Provider } } = {}

    providers
      .filter(provider => provider.enabled) // 只处理启用的渠道
      .forEach(provider => {
        const enabledModels = provider.models.filter(model => model.enabled) // 只获取启用的模型

        if (enabledModels.length > 0) {
          groups[provider.displayName] = {
            models: enabledModels,
            provider: provider
          }
        }
      })

    return groups
  }

  const enabledModels = getEnabledModels()
  const groupedModels = getGroupedModels()

  // 渲染提供商图标
  const renderProviderIcon = (provider: Provider) => {
    if (!provider.icon) return null

    const IconComponent = getIcon(provider.icon as IconName)
    if (!IconComponent) return null

    return (
      <IconComponent
        size={18}
        style={{
          marginRight: '10px',
          flexShrink: 0,
          color: 'inherit',
          opacity: 0.9
        }}
      />
    )
  }

  // 渲染模型图标
  const renderModelIcon = (model: Model) => {
    return <ProviderIcon
      provider={model.provider}
      size={20}
      type={'color'}
    />
  }

  // 渲染模型能力图标
  const renderAbilities = (model: Model) => {
    const abilities = []

    if (model.abilities?.functionCall) {
      abilities.push(
        <Tooltip title={'支持函数调用'}>
          <span
            key="function"
            className="ability-icon"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              marginRight: '4px'
            }}
          >
            <Zap size={14} style={{ color: '#3b82f6' }} />
          </span>
        </Tooltip>
      )
    }

    if (model.abilities?.vision) {
      abilities.push(<Tooltip title='支持视觉识别'>
        <span
          key="vision"
          className="ability-icon"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginRight: '4px'
          }}
        >
          <Eye size={14} style={{ color: '#10b981' }} />
        </span>
      </Tooltip>
      )
    }


    if (model.abilities?.reasoning) {
      abilities.push(<Tooltip title='支持推理'>
        <span
          key="reasoning"
          className="ability-icon"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginRight: '4px'
          }}
        >
          <Brain size={14} style={{ color: '#10b981' }} />
        </span>
      </Tooltip>
      )
    }

    return abilities
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

  // 获取模型类型标签
  const getModelTypeLabel = (model: Model): string => {
    const name = model.displayName.toLowerCase()
    if (name.includes('gpt-4o') || name.includes('claude-3.5')) return '最新'
    if (name.includes('gpt-4') || name.includes('claude-3')) return '高级'
    if (name.includes('gpt-3.5') || name.includes('claude-instant')) return '快速'
    if (name.includes('gemini')) return '多模态'
    return ''
  }

  // 获取模型类型颜色
  const getModelTypeColor = (model: Model): string => {
    const name = model.displayName.toLowerCase()
    if (name.includes('gpt-4o') || name.includes('claude-3.5')) return '#8b5cf6'
    if (name.includes('gpt-4') || name.includes('claude-3')) return '#3b82f6'
    if (name.includes('gpt-3.5') || name.includes('claude-instant')) return '#10b981'
    if (name.includes('gemini')) return '#f59e0b'
    return '#6b7280'
  }

  // 处理下拉框打开状态变化
  const handleDropdownVisibleChange = (visible: boolean) => {
    setOpen(visible)
  }

  // 自定义过滤函数
  const filterOption = (input: string, option: any) => {
    const model = enabledModels.find(m => m.id === option.value)
    if (!model) return false

    const searchLower = input.toLowerCase()
    return model.displayName.toLowerCase().includes(searchLower) ||
      model.id.toLowerCase().includes(searchLower) ||
      (model.description || '').toLowerCase().includes(searchLower) ||
      model.provider.toLowerCase().includes(searchLower)
  }

  // 自定义下拉框无结果内容
  const renderNoResults = () => (
    <div className="no-results">
      <div className="no-results-icon">🔍</div>
      <div className="no-results-text">未找到匹配的模型</div>
      <div className="no-results-hint">尝试调整搜索关键词或检查模型是否已启用</div>
    </div>
  )

  return (
    <div className={`model-selector ${className}`}>
      <Select
        value={selectedModel}
        onChange={onModelChange}
        disabled={disabled}
        open={open}
        onDropdownVisibleChange={handleDropdownVisibleChange}
        style={{ width: '100%' }}
        placeholder="选择 AI 模型..."
        suffixIcon={<ChevronDown size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />}
        dropdownClassName="model-selector-dropdown"
        optionLabelProp="label"
        showSearch={true}
        filterOption={filterOption}
        virtual={true}
        listHeight={520}
        notFoundContent={renderNoResults()}
        dropdownMatchSelectWidth={false}
        getPopupContainer={(trigger) => trigger.parentNode}
      >
        {Object.entries(groupedModels).map(([providerName, { models, provider }]) => (
          <Select.OptGroup
            key={providerName}
            label={
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 0',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderProviderIcon(provider)}
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: '14px'
                    }}>{providerName}</span>
                </div>
                <span className="model-count">
                  {models.length}
                </span>
              </div>
            }
          >
            {models.map(model => (
              <Option
                key={model.id}
                value={model.id}
                label={model.displayName}
              >
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      minWidth: 0
                    }}>
                      {renderModelIcon(model)}
                      <span style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{model.displayName}</span>

                      {/* 模型类型标签 */}
                      {getModelTypeLabel(model) && (
                        <span style={{
                          background: getModelTypeColor(model),
                          color: 'white',
                          fontSize: '9px',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          flexShrink: 0
                        }}>
                          {getModelTypeLabel(model)}
                        </span>
                      )}
                    </div>

                    <span className="context-window-badge">
                      {formatContextWindow(model.contextWindowTokens)}
                    </span>
                  </div>

                  {/* 第二行：能力图标 */}
                  {renderAbilities(model).length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        marginRight: '2px',
                        fontWeight: 500
                      }}>
                        能力:
                      </span>
                      {renderAbilities(model)}
                    </div>
                  )}

                  {/* 第三行：模型描述（单行，省略号） */}
                  <div style={{
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                    flex: 1
                  }}>
                    {model.description || '暂无描述'}
                  </div>

                  {/* 第四行：价格信息（紧凑显示） */}
                  {model.pricing && (
                    <div style={{
                      fontSize: '11px',
                      marginTop: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>
                        输入: <strong style={{}}>
                          ${model.pricing.input}/1M
                        </strong>
                      </span>
                      <span>
                        输出: <strong style={{}}>
                          ${model.pricing.output}/1M
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </Option>
            ))}
          </Select.OptGroup>
        ))}
      </Select>
    </div>
  )
}

export default ModelSelector 