import React, { useState, useMemo } from 'react'
import { Select, Input } from 'antd'
import { ChevronDown, Zap, Eye, Search } from 'lucide-react'
import { Model, Provider, ModelSelectorProps } from '@/types/model'
import { getIcon, IconName } from '@/utils/iconutils'
import './ModelSelector.css'

const { Option } = Select

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  providers,
  disabled = false,
  className = ''
}) => {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  // 获取所有启用渠道下的启用模型
  const getEnabledModels = (): Model[] => {
    return providers
      .filter(provider => provider.enabled) // 只获取启用的渠道
      .flatMap(provider => 
        provider.models.filter(model => model.enabled) // 只获取启用的模型
      )
  }

  // 根据搜索文本过滤模型
  const getFilteredModels = (models: Model[]): Model[] => {
    if (!searchText.trim()) return models
    
    const searchLower = searchText.toLowerCase()
    return models.filter(model => 
      model.displayName.toLowerCase().includes(searchLower) ||
      model.id.toLowerCase().includes(searchLower) ||
      model.description?.toLowerCase().includes(searchLower) ||
      model.provider.toLowerCase().includes(searchLower)
    )
  }

  // 根据服务商分组模型（只包含启用的渠道和模型）
  const getGroupedModels = () => {
    const groups: { [key: string]: { models: Model[], provider: Provider } } = {}
    
    providers
      .filter(provider => provider.enabled) // 只处理启用的渠道
      .forEach(provider => {
        const enabledModels = provider.models.filter(model => model.enabled) // 只获取启用的模型
        const filteredModels = getFilteredModels(enabledModels) // 应用搜索过滤
        
        if (filteredModels.length > 0) {
          groups[provider.displayName] = {
            models: filteredModels,
            provider: provider
          }
        }
      })
    
    return groups
  }

  const enabledModels = getEnabledModels()
  const groupedModels = getGroupedModels()
  const currentModel = enabledModels.find(model => model.id === selectedModel)

  // 计算搜索结果统计
  const searchStats = useMemo(() => {
    const allEnabledModels = getEnabledModels()
    const filteredModels = getFilteredModels(allEnabledModels)
    return {
      total: allEnabledModels.length,
      filtered: filteredModels.length,
      hasSearch: searchText.trim().length > 0
    }
  }, [searchText, providers])

  // 渲染提供商图标
  const renderProviderIcon = (provider: Provider) => {
    if (!provider.icon) return null
    
    const IconComponent = getIcon(provider.icon as IconName)
    if (!IconComponent) return null
    
    return (
      <IconComponent 
        size={16} 
        style={{ 
          marginRight: '8px',
          flexShrink: 0,
          color: 'inherit' 
        }}
      />
    )
  }

  // 渲染模型能力图标
  const renderAbilities = (model: Model) => {
    const abilities = []
    
    if (model.abilities?.functionCall) {
      abilities.push(
        <span 
          key="function" 
          title="支持函数调用" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginRight: '4px'
          }}
        >
          <Zap size={12} style={{ color: '#3b82f6' }} />
        </span>
      )
    }
    
    if (model.abilities?.vision) {
      abilities.push(
        <span 
          key="vision" 
          title="支持视觉识别" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginRight: '4px'
          }}
        >
          <Eye size={12} style={{ color: '#10b981' }} />
        </span>
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

  // 自定义下拉框渲染
  const dropdownRender = (menu: React.ReactElement) => (
    <div className="model-selector-dropdown-content">
      {/* 搜索框 */}
      <div className="model-selector-search">
        <Input
          placeholder="搜索模型..."
          prefix={<Search size={14} style={{ color: '#9ca3af' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
          allowClear
        />
        {searchStats.hasSearch && (
          <div className="search-stats">
            找到 {searchStats.filtered} 个模型（共 {searchStats.total} 个）
          </div>
        )}
      </div>
      
      {/* 模型列表 */}
      <div className="model-selector-menu">
        {Object.keys(groupedModels).length > 0 ? (
          menu
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <div className="no-results-text">
              {searchStats.hasSearch ? '未找到匹配的模型' : '暂无可用模型'}
            </div>
            <div className="no-results-hint">
              {searchStats.hasSearch ? '尝试调整搜索关键词' : '请在设置中启用模型渠道'}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`model-selector ${className}`}>
      <Select
        value={selectedModel}
        onChange={onModelChange}
        disabled={disabled}
        open={open}
        onDropdownVisibleChange={setOpen}
        style={{ width: '100%' }}
        placeholder="选择模型"
        suffixIcon={<ChevronDown size={14} style={{ color: '#9ca3af' }} />}
        dropdownClassName="model-selector-dropdown"
        optionLabelProp="label"
        showSearch={false}
        virtual={true}
        listHeight={350}
        dropdownRender={dropdownRender}
        notFoundContent={null}
      >
        {Object.entries(groupedModels).map(([providerName, { models, provider }]) => (
          <Select.OptGroup 
            key={providerName} 
            label={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '4px 0' 
              }}>
                {renderProviderIcon(provider)}
                <span style={{ fontWeight: 500 }}>{providerName}</span>
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
                <div style={{ padding: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: '8px' 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px' 
                    }}>
                      <span style={{ 
                        fontWeight: 500, 
                        fontSize: '14px', 
                        color: '#ffffff' 
                      }}>{model.displayName}</span>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px' 
                      }}>
                        {renderAbilities(model)}
                      </div>
                    </div>
                    <span className="context-window-badge">
                      {formatContextWindow(model.contextWindowTokens)}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#d1d5db', 
                    marginBottom: '4px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {model.description}
                  </div>
                  {model.pricing && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#9ca3af', 
                      marginTop: '4px' 
                    }}>
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