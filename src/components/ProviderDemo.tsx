import React, { useState, useMemo } from 'react'
import { Card, Badge, Tooltip, Select, Input, Space, Typography } from 'antd'
import { Search, Filter } from 'lucide-react'
import { processModelData, getProviderIcon } from '@/utils/modelDataProcessor'
import { getIcon, IconName } from '@/utils/iconutils'

const { Option } = Select
const { Title, Text } = Typography

const ProviderDemo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'models' | 'type'>('models')
  
  const providers = processModelData()

  // 过滤和排序逻辑
  const filteredAndSortedProviders = useMemo(() => {
    let filtered = providers.filter(provider => {
      const matchesSearch = provider.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (provider.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      if (typeFilter === 'all') return matchesSearch
      
      const hasType = provider.models.some(model => model.type === typeFilter)
      return matchesSearch && hasType
    })

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName)
        case 'models':
          return b.models.length - a.models.length
        case 'type':
          const aTypes = new Set(a.models.map(m => m.type)).size
          const bTypes = new Set(b.models.map(m => m.type)).size
          return bTypes - aTypes
        default:
          return 0
      }
    })

    return filtered
  }, [providers, searchTerm, typeFilter, sortBy])

  // 统计信息
  const stats = useMemo(() => {
    const totalProviders = providers.length
    const totalModels = providers.reduce((sum, p) => sum + p.models.length, 0)
    const providersWithIcons = providers.filter(p => p.icon).length
    const modelsByType = providers.reduce((acc, p) => {
      p.models.forEach(m => {
        acc[m.type] = (acc[m.type] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    return {
      totalProviders,
      totalModels,
      providersWithIcons,
      modelsByType
    }
  }, [providers])

  const renderProviderIcon = (iconName?: string) => {
    if (!iconName) return <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">无</div>
    
    const IconComponent = getIcon(iconName as IconName)
    if (!IconComponent) return <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">?</div>
    
    return (
      <div className="w-8 h-8 flex items-center justify-center">
        <IconComponent size={24} />
      </div>
    )
  }

  const getTypeColor = (type: string) => {
    const colors = {
      chat: '#52c41a',
      image: '#1890ff',
      embedding: '#722ed1',
      tts: '#fa8c16',
      sst: '#eb2f96',
      completion: '#13c2c2'
    }
    return colors[type as keyof typeof colors] || '#666'
  }

  const getTypeName = (type: string) => {
    const names = {
      chat: '对话',
      image: '图像',
      embedding: '嵌入',
      tts: '语音合成',
      sst: '语音识别',
      completion: '文本补全'
    }
    return names[type as keyof typeof names] || type
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Title level={2} className="mb-6">AI 提供商总览</Title>
        
        {/* 搜索和过滤控件 */}
        <Card className="mb-6">
          <Space size="large" wrap>
            <Input
              placeholder="搜索提供商..."
              prefix={<Search size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 250 }}
            />
            
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 150 }}
              placeholder="模型类型"
            >
              <Option value="all">所有类型</Option>
              {Object.keys(stats.modelsByType).map(type => (
                <Option key={type} value={type}>
                  {getTypeName(type)} ({stats.modelsByType[type]})
                </Option>
              ))}
            </Select>
            
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 150 }}
              placeholder="排序方式"
            >
              <Option value="models">按模型数量</Option>
              <Option value="name">按名称</Option>
              <Option value="type">按类型数量</Option>
            </Select>
          </Space>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalProviders}</div>
              <div className="text-sm text-gray-600">提供商总数</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalModels}</div>
              <div className="text-sm text-gray-600">模型总数</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.providersWithIcons}</div>
              <div className="text-sm text-gray-600">有图标的提供商</div>
            </div>
          </Card>
          {Object.entries(stats.modelsByType).slice(0, 3).map(([type, count]) => (
            <Card key={type} size="small">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: getTypeColor(type) }}>
                  {count}
                </div>
                <div className="text-sm text-gray-600">{getTypeName(type)}模型</div>
              </div>
            </Card>
          ))}
        </div>

        {/* 提供商卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedProviders.map(provider => {
            const modelTypes = [...new Set(provider.models.map(m => m.type))]
            
            return (
              <Card 
                key={provider.id}
                className="hover:shadow-lg transition-shadow duration-300"
                size="small"
              >
                <div className="flex items-start space-x-3">
                  {renderProviderIcon(provider.icon)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{provider.displayName}</h3>
                      <Badge 
                        count={provider.models.length} 
                        style={{ backgroundColor: '#52c41a' }}
                      />
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {provider.description}
                    </p>
                    
                    {/* 模型类型标签 */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {modelTypes.map(type => (
                        <Badge 
                          key={type}
                          count={getTypeName(type)} 
                          style={{ 
                            backgroundColor: getTypeColor(type), 
                            fontSize: '10px'
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* 热门模型 */}
                    <div className="flex flex-wrap gap-1">
                      {provider.models.slice(0, 3).map(model => (
                        <Tooltip key={model.id} title={model.description}>
                          <Badge 
                            count={model.displayName} 
                            style={{ 
                              backgroundColor: '#1890ff', 
                              fontSize: '10px',
                              maxWidth: '80px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          />
                        </Tooltip>
                      ))}
                      {provider.models.length > 3 && (
                        <Badge 
                          count={`+${provider.models.length - 3}`} 
                          style={{ backgroundColor: '#faad14', fontSize: '10px' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        
        {filteredAndSortedProviders.length === 0 && (
          <Card className="text-center py-8">
            <Text type="secondary">没有找到匹配的提供商</Text>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ProviderDemo 