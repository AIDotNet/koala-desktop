import React, { useState } from 'react'
import { Select, Button, Tooltip, Badge } from 'antd'
import { ChevronDown, Zap, Eye, Settings } from 'lucide-react'
import { Model, Provider, ModelSelectorProps } from '@/types/model'
import { getIcon, IconName } from '@/utils/iconutils'

const { Option } = Select

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  providers,
  disabled = false,
  className = ''
}) => {
  const [open, setOpen] = useState(false)

  // 获取所有启用的模型
  const getEnabledModels = (): Model[] => {
    return providers
      .filter(provider => provider.enabled)
      .flatMap(provider => 
        provider.models.filter(model => model.enabled)
      )
  }

  // 根据服务商分组模型
  const getGroupedModels = () => {
    const groups: { [key: string]: { models: Model[], provider: Provider } } = {}
    
    providers
      .filter(provider => provider.enabled)
      .forEach(provider => {
        const enabledModels = provider.models.filter(model => model.enabled)
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
  const currentModel = enabledModels.find(model => model.id === selectedModel)

  // 渲染提供商图标
  const renderProviderIcon = (provider: Provider) => {
    if (!provider.icon) return null
    
    const IconComponent = getIcon(provider.icon as IconName)
    if (!IconComponent) return null
    
    return (
      <IconComponent 
        size={16} 
        className="mr-2 flex-shrink-0" 
        style={{ color: 'inherit' }}
      />
    )
  }

  // 渲染模型能力图标
  const renderAbilities = (model: Model) => {
    const abilities = []
    
    if (model.abilities?.functionCall) {
      abilities.push(
        <Tooltip key="function" title="支持函数调用">
          <Zap size={12} className="text-blue-400" />
        </Tooltip>
      )
    }
    
    if (model.abilities?.vision) {
      abilities.push(
        <Tooltip key="vision" title="支持视觉识别">
          <Eye size={12} className="text-green-400" />
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

  return (
    <div className={`model-selector ${className}`}>
      <Select
        value={selectedModel}
        onChange={onModelChange}
        disabled={disabled}
        open={open}
        onDropdownVisibleChange={setOpen}
        className="w-full"
        placeholder="选择模型"
        suffixIcon={<ChevronDown size={14} className="text-gray-400" />}
        dropdownClassName="model-selector-dropdown"
        optionLabelProp="label"
      >
        {Object.entries(groupedModels).map(([providerName, { models, provider }]) => (
          <Select.OptGroup 
            key={providerName} 
            label={
              <div className="flex items-center py-1">
                {renderProviderIcon(provider)}
                <span className="font-medium">{providerName}</span>
                <Badge 
                  count={models.length} 
                  style={{ 
                    backgroundColor: '#52c41a', 
                    fontSize: '10px',
                    marginLeft: '8px'
                  }} 
                />
              </div>
            }
          >
            {models.map(model => (
              <Option 
                key={model.id} 
                value={model.id}
                label={model.displayName}
              >
                <div className="py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{model.displayName}</span>
                      <div className="flex items-center space-x-1">
                        {renderAbilities(model)}
                      </div>
                    </div>
                    <Badge 
                      count={formatContextWindow(model.contextWindowTokens)} 
                      style={{ 
                        backgroundColor: '#1890ff', 
                        fontSize: '10px',
                        height: '16px',
                        lineHeight: '16px',
                        minWidth: '16px'
                      }} 
                    />
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {model.description}
                  </div>
                  {model.pricing && (
                    <div className="text-xs text-gray-400 mt-1">
                      输入: ${model.pricing.input}/1M • 输出: ${model.pricing.output}/1M
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