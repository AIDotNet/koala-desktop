import React, { useState, useEffect, useRef } from 'react'
import { ProviderIcon } from '@lobehub/icons'
import axios from 'axios'
import {
  Switch,
  Button,
  Input,
  Modal,
  Form,
  Typography,
  Tooltip,
  Badge,
  message,
  List,
  Select,
  InputNumber,
  Checkbox,
  Radio,
  theme
} from 'antd'
import VirtualList from 'rc-virtual-list'
import {
  Plus,
  Settings,
  Globe,
  Bot,
  CheckCircle,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { Provider, Model, ProviderManagerProps as BaseProviderManagerProps } from '@/types/model'
import { providerDB } from '@/utils/providerDB'
import ModelListItem from './ModelListItem'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

// 扩展 ProviderManagerProps 接口以支持主题
interface ProviderManagerProps extends BaseProviderManagerProps {
  isDarkTheme?: boolean
}

// 自定义样式钩子
const useProviderManagerStyles = (token: any) => {
  return {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      background: token.colorBgLayout
    },
    sidebar: {
      width: '280px',
      borderRight: `1px solid ${token.colorBorder}`,
      display: 'flex',
      flexDirection: 'column' as const
    },
    sidebarHeader: {
      padding: token.paddingLG,
      borderBottom: `1px solid ${token.colorBorder}`,
    },
    sidebarContent: {
      flex: 1,
      overflow: 'hidden'
    },
    scrollContainer: {
      height: 'calc(100vh - 120px)',
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      padding: token.paddingSM
    },
    providerItem: {
      borderRadius: token.borderRadius,
      margin: token.marginXS,
      padding: token.paddingSM,
      marginBottom: token.marginSM,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: 'none'
    },
    providerItemSelected: {
      backgroundColor: `${token.colorPrimary}20`,
      boxShadow: token.boxShadowSecondary
    },
    providerItemDefault: {
      backgroundColor: token.colorFillQuaternary
    },
    contentArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    contentHeader: {
      padding: token.paddingLG,
      borderBottom: `1px solid ${token.colorBorder}`,
    },
    contentBody: {
      flex: 1,
      padding: token.paddingLG,
      position: 'relative' as const
    },
    searchSection: {
      marginBottom: token.marginLG,
      padding: token.paddingLG,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorBorder}`
    },
    loadingOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backdropFilter: 'blur(2px)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      textAlign: 'center' as const
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: token.marginLG
    }
  }
}

// 动画样式生成函数
const getAnimationStyles = (token: any) => `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  }
`;

const ProviderManager: React.FC<ProviderManagerProps> = ({
  providers,
  onProviderUpdate,
  onProviderAdd,
  onProviderDelete,
  onModelToggle,
  isDarkTheme = false
}) => {
  // 获取主题token
  const { token } = theme.useToken()
  const styles = useProviderManagerStyles(token)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    providers.length > 0 ? providers.find(p => p.enabled) || providers[0] : null
  )
  const [isProviderModalVisible, setIsProviderModalVisible] = useState(false)
  const [isModelModalVisible, setIsModelModalVisible] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [providerForm] = Form.useForm()
  const [modelForm] = Form.useForm()
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)
  const virtualListRef = useRef<HTMLDivElement>(null)

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 初始化加载数据
  useEffect(() => {
    const loadProvidersFromDB = async () => {
      try {
        // 从数据库加载提供商数据
        const dbProviders = await providerDB.getAllProviders();

        // 如果数据库中没有数据，初始化默认提供商
        if (dbProviders.length === 0 && providers.length > 0) {
          // 保存当前内存中的提供商到数据库
          for (const provider of providers) {
            await providerDB.saveProvider(provider);
          }
        } else if (dbProviders.length > 0) {
          // 如果数据库中有数据，更新到上层组件
          dbProviders.forEach((provider: Provider) => {
            onProviderUpdate(provider);
          });
        }
      } catch (error) {
        console.error('加载提供商数据失败:', error);
        message.error('加载提供商数据失败');
      }
    };

    loadProvidersFromDB();
  }, []);

  // 监听 providers 变化，更新选中的提供商
  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      setSelectedProvider(providers[0])
    }
  }, [providers, selectedProvider])

  // 处理提供商选择
  const handleProviderSelect = (provider: Provider) => {
    try {
      // 首先隐藏当前内容
      const contentElement = document.querySelector('.provider-content') as HTMLDivElement;
      if (contentElement) {
        contentElement.style.opacity = '0';
        contentElement.style.transform = 'translateY(10px)';
      }

      // 设置一个短暂延迟后更新状态，实现平滑过渡
      setTimeout(() => {
        setSelectedProvider(provider);
        // 重新显示内容
        if (contentElement) {
          setTimeout(() => {
            try {
              contentElement.style.opacity = '1';
              contentElement.style.transform = 'translateY(0)';
            } catch (error) {
              console.error('DOM操作失败:', error);
            }
          }, 50);
        }
      }, 150);
    } catch (error) {
      console.error('切换提供商失败:', error);
      // 如果动画失败，仍然要确保提供商被选中
      setSelectedProvider(provider);
    }
  }

  // 渲染模型列表
  const renderModelList = () => {
    if (!selectedProvider) return null;
    if (models.length > 0) {
      // 计算容器高度 - 考虑窗口高度和固定头部区域
      const listHeight = windowHeight - 420
      const itemHeight = 90 // 每个列表项的高度

      return (
        <div
          ref={virtualListRef}
          className="virtual-list-container"
          style={{
            height: `${listHeight}px`,
            padding: '0 4px',
            overflow: 'hidden'
          }}
        >
          <List>
            <VirtualList
              data={models}
              height={listHeight}
              itemHeight={itemHeight}
              itemKey="id"
              onScroll={() => {}}
            >
              {(model, index) => (
                <List.Item key={model.id}
                style={{ padding: '4px 0', width: '100%' }}>
                  <ModelListItem
                    model={model}
                    index={index}
                    onEdit={handleEditModel}
                    onDelete={handleDeleteModel}
                    onToggle={onModelToggle}
                    onProviderUpdate={onProviderUpdate}
                    setSelectedProvider={setSelectedProvider}
                    setIsRefreshing={setIsRefreshing}
                  />
                </List.Item>
              )}
            </VirtualList>
          </List>
        </div>
      )
    } else {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Bot size={40} style={{ color: token.colorTextQuaternary }} />
          </div>
          <Title level={3} style={{
            color: token.colorTextSecondary,
            marginBottom: token.marginSM,
            fontWeight: 500
          }}>
            {selectedProvider.models.length > 0 ? '没有匹配的模型' : '暂无模型'}
          </Title>
          <Text style={{
            color: token.colorTextTertiary,
            marginBottom: token.marginXL,
            maxWidth: 400,
            lineHeight: 1.6
          }}>
            {selectedProvider.models.length > 0
              ? '尝试调整搜索条件或清除筛选器以查看更多模型。'
              : '还没有配置任何模型。添加您的第一个模型来开始使用 AI 功能。'}
          </Text>
          {selectedProvider.models.length === 0 && (
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              onClick={handleAddModel}
              style={{
                borderRadius: token.borderRadiusLG,
                padding: '8px 24px',
                height: 'auto',
                fontSize: token.fontSize,
                fontWeight: 500,
                boxShadow: token.boxShadowSecondary
              }}
            >
              添加第一个模型
            </Button>
          )}
        </div>)
    }
  }

  // 处理添加提供商
  const handleAddProvider = () => {
    setEditingProvider(null)
    providerForm.resetFields()
    setIsProviderModalVisible(true)
  }

  // 处理编辑提供商
  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider)
    providerForm.setFieldsValue({
      displayName: provider.displayName,
      description: provider.description,
      apiUrl: provider.apiUrl,
      apiKey: provider.apiKey,
      website: provider.website
    })
    setIsProviderModalVisible(true)
  }

  // 处理提供商表单提交
  const handleProviderFormSubmit = async (values: any) => {
    try {
      if (editingProvider) {
        // 更新现有提供商
        const updatedProvider: Provider = {
          ...editingProvider,
          displayName: values.displayName,
          description: values.description,
          apiUrl: values.apiUrl,
          apiKey: values.apiKey,
          website: values.website
        }
        // 保存到数据库
        await providerDB.saveProvider(updatedProvider);
        // 更新上层组件状态
        onProviderUpdate(updatedProvider)

        if (selectedProvider?.id === editingProvider.id) {
          setSelectedProvider(updatedProvider)
        }
        message.success('提供商信息已更新')
      } else {
        // 添加新提供商
        const newProvider: Provider = {
          id: `provider_${Date.now()}`,
          name: values.displayName.toLowerCase().replace(/\s+/g, '_'),
          displayName: values.displayName,
          description: values.description,
          apiUrl: values.apiUrl,
          apiKey: values.apiKey,
          website: values.website,
          enabled: true,
          models: [],
          icon: '🤖'
        }
        // 保存到数据库
        await providerDB.saveProvider(newProvider);
        // 更新上层组件状态
        onProviderAdd(newProvider)

        setSelectedProvider(newProvider)
        message.success('新提供商已添加')
      }
      setIsProviderModalVisible(false)
      providerForm.resetFields()
    } catch (error) {
      console.error('保存提供商失败:', error);
      message.error('操作失败')
    }
  }

  // 处理删除提供商
  const handleDeleteProvider = async (providerId: string) => {
    try {
      // 从数据库删除
      await providerDB.deleteProvider(providerId);
      // 更新上层组件状态
      onProviderDelete(providerId)

      if (selectedProvider?.id === providerId) {
        const remainingProviders = providers.filter(p => p.id !== providerId)
        setSelectedProvider(remainingProviders.length > 0 ? remainingProviders[0] : null)
      }
      message.success('提供商已删除')
    } catch (error) {
      console.error('删除提供商失败:', error);
      message.error('删除提供商失败')
    }
  }

  // 处理提供商启用/禁用
  const handleProviderToggle = async (provider: Provider, enabled: boolean) => {
    try {
      const updatedProvider = { ...provider, enabled }
      // 保存到数据库
      await providerDB.saveProvider(updatedProvider);
      // 更新上层组件状态
      onProviderUpdate(updatedProvider)

      if (selectedProvider?.id === provider.id) {
        setSelectedProvider(updatedProvider)
      }
    } catch (error) {
      console.error('切换提供商状态失败:', error);
      message.error('操作失败')
    }
  }

  // 处理添加模型
  const handleAddModel = () => {
    if (!selectedProvider) return
    setEditingModel(null)
    modelForm.resetFields()
    modelForm.setFieldsValue({
      provider: selectedProvider.id,
      type: 'chat',
      enabled: true,
      contextWindowTokens: 4096,
      maxOutput: 4096
    })
    setIsModelModalVisible(true)
  }

  // 处理编辑模型
  const handleEditModel = (model: Model) => {
    setEditingModel(model)
    modelForm.setFieldsValue({
      id: model.id,
      displayName: model.displayName,
      description: model.description,
      provider: model.provider,
      type: model.type,
      enabled: model.enabled,
      contextWindowTokens: model.contextWindowTokens,
      maxOutput: model.maxOutput,
      functionCall: model.abilities?.functionCall || false,
      vision: model.abilities?.vision || false,
      inputPrice: model.pricing?.input,
      outputPrice: model.pricing?.output,
      cachedInputPrice: model.pricing?.cachedInput
    })
    setIsModelModalVisible(true)
  }

  // 处理模型表单提交
  const handleModelFormSubmit = async (values: any) => {
    try {
      if (!selectedProvider) return

      const abilities: any = {}
      if (values.functionCall) abilities.functionCall = true
      if (values.vision) abilities.vision = true

      const pricing: any = {}
      if (values.inputPrice) pricing.input = values.inputPrice
      if (values.outputPrice) pricing.output = values.outputPrice
      if (values.cachedInputPrice) pricing.cachedInput = values.cachedInputPrice

      const modelData: Model = {
        id: values.id,
        displayName: values.displayName,
        description: values.description,
        provider: selectedProvider.id,
        type: values.type,
        enabled: values.enabled,
        contextWindowTokens: values.contextWindowTokens,
        maxOutput: values.maxOutput,
        abilities: Object.keys(abilities).length > 0 ? abilities : undefined,
        pricing: Object.keys(pricing).length > 0 ? pricing : undefined
      }

      if (editingModel) {
        // 更新现有模型
        const updatedModels = selectedProvider.models.map(m =>
          m.id === editingModel.id ? modelData : m
        )
        const updatedProvider = { ...selectedProvider, models: updatedModels }

        await providerDB.saveProvider(updatedProvider);
        onProviderUpdate(updatedProvider)
        setSelectedProvider(updatedProvider)
        message.success('模型已更新')
      } else {
        // 添加新模型
        const updatedProvider = {
          ...selectedProvider,
          models: [...selectedProvider.models, modelData]
        }

        await providerDB.saveProvider(updatedProvider);
        onProviderUpdate(updatedProvider)
        setSelectedProvider(updatedProvider)
        message.success('新模型已添加')
      }

      setIsModelModalVisible(false)
      modelForm.resetFields()
    } catch (error) {
      console.error('保存模型失败:', error);
      message.error('操作失败')
    }
  }

  // 处理删除模型
  const handleDeleteModel = async (modelId: string) => {
    try {
      if (!selectedProvider) return

      const updatedModels = selectedProvider.models.filter(m => m.id !== modelId)
      const updatedProvider = { ...selectedProvider, models: updatedModels }

      await providerDB.saveProvider(updatedProvider);
      onProviderUpdate(updatedProvider)
      setSelectedProvider(updatedProvider)
      message.success('模型已删除')
    } catch (error) {
      console.error('删除模型失败:', error);
      message.error('删除模型失败')
    }
  }

  // 从OpenAI API获取模型列表
  const fetchModelsFromOpenAI = async () => {
    if (!selectedProvider || !selectedProvider.apiKey || !selectedProvider.apiUrl) {
      message.error('请先配置API密钥和API URL');
      return;
    }

    setIsLoadingModels(true);
    try {
      const apiUrl = selectedProvider.apiUrl.endsWith('/')
        ? `${selectedProvider.apiUrl}models`
        : `${selectedProvider.apiUrl}/models`;

      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${selectedProvider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('API返回格式不正确');
      }

      // 处理获取到的模型列表
      const apiModels = response.data.data.map((model: any) => {
        // 基于模型ID推断类型
        let type = 'chat';
        if (model.id.includes('embedding')) type = 'embedding';
        else if (model.id.includes('dall-e') || model.id.includes('image')) type = 'image';
        else if (model.id.includes('tts')) type = 'tts';
        else if (model.id.includes('whisper')) type = 'sst';

        // 推断模型能力
        const abilities: any = {};
        if (model.id.includes('vision') || model.id.includes('vision-preview')) {
          abilities.vision = true;
        }
        if (!model.id.includes('embedding') && !model.id.includes('dall-e') &&
          !model.id.includes('tts') && !model.id.includes('whisper')) {
          abilities.functionCall = true;
        }

        // 预设上下文窗口大小
        let contextWindowTokens = 4096;
        if (model.id.includes('32k')) contextWindowTokens = 32768;
        else if (model.id.includes('128k')) contextWindowTokens = 128000;
        else if (model.id.includes('16k')) contextWindowTokens = 16384;
        else if (model.id.includes('gpt-4')) contextWindowTokens = 8192;
        else if (model.id.includes('gpt-4o')) contextWindowTokens = 128000;

        return {
          id: model.id,
          displayName: model.id,
          description: `由 ${model.owned_by || 'Unknown'} 提供的${type}模型`,
          provider: selectedProvider.id,
          type,
          enabled: false,
          contextWindowTokens,
          maxOutput: Math.min(4096, contextWindowTokens),
          abilities: Object.keys(abilities).length > 0 ? abilities : undefined
        };
      });

      // 合并现有模型和新获取的模型
      const existingModelIds = selectedProvider.models.map(m => m.id);
      const newModels = apiModels.filter((model: Model) => !existingModelIds.includes(model.id));

      if (newModels.length > 0) {
        const updatedProvider = {
          ...selectedProvider,
          models: [...selectedProvider.models, ...newModels]
        };

        await providerDB.saveProvider(updatedProvider);
        onProviderUpdate(updatedProvider);
        setSelectedProvider(updatedProvider);
        message.success(`成功获取 ${newModels.length} 个新模型`);
      } else {
        message.info('没有发现新模型');
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      message.error('获取模型列表失败，请检查API配置');
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (selectedProvider) {
      const models = selectedProvider.models.filter(model => {
        // 按搜索文本筛选
        const matchesSearch = !searchText ||
          model.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
          model.id.toLowerCase().includes(searchText.toLowerCase()) ||
          (model.description || '').toLowerCase().includes(searchText.toLowerCase());

        // 按类型筛选
        const matchesType = !filterType || model.type === filterType;

        return matchesSearch && matchesType;
      }).sort((a, b) => {
        // 启用的模型排在最顶部
        if (a.enabled === b.enabled) {
          return 0;
        }
        return a.enabled ? -1 : 1;
      });
      setModels(models);
    }
  }, [searchText, filterType,selectedProvider]);

  return (
    <div style={styles.container}>
      <style>{getAnimationStyles(token)}</style>
      <div style={{ flex: 1, display: 'flex' }}>
        {/* 左侧提供商列表 */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Title
                level={5}
                style={{
                  color: token.colorText,
                  marginBottom: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Globe style={{ marginRight: token.marginXS }} size={16} />
                提供商
              </Title>
              <Button
                type="primary"
                size="small"
                icon={<Plus size={14} />}
                onClick={handleAddProvider}
                style={{
                  borderRadius: token.borderRadius
                }}
              >
                添加
              </Button>
            </div>
          </div>

          <div style={styles.sidebarContent}>
            <div style={styles.scrollContainer} className="custom-scrollbar">
              <List
                dataSource={providers.sort((a, b) => (a.enabled === b.enabled) ? 0 : a.enabled ? -1 : 1)}
                renderItem={(provider) => (
                  <List.Item
                    key={provider.id}
                    style={{
                      ...styles.providerItem,
                      ...(selectedProvider?.id === provider.id
                        ? styles.providerItemSelected
                        : styles.providerItemDefault),
                      animation: 'fadeIn 0.3s ease-out'
                    }}
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: token.marginSM
                      }}>
                        <div style={{
                          fontSize: '24px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: selectedProvider?.id === provider.id
                            ? `${token.colorPrimary}30`
                            : token.colorFillSecondary,
                          borderRadius: token.borderRadius,
                          transition: 'all 0.3s ease'
                        }}>
                          <ProviderIcon
                            provider={provider.id}
                            size={20}
                            type={'color'}
                          />
                        </div>
                        <div>
                          <div style={{
                            color: token.colorText,
                            fontWeight: 500,
                            fontSize: token.fontSize,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            {provider.displayName}
                            {provider.enabled && (
                              <div style={{
                                width: selectedProvider?.id === provider.id ? '8px' : '6px',
                                height: selectedProvider?.id === provider.id ? '8px' : '6px',
                                borderRadius: '50%',
                                background: token.colorSuccess,
                                marginLeft: token.marginXS,
                                transition: 'all 0.3s ease'
                              }}></div>
                            )}
                          </div>
                          <div style={{
                            color: token.colorTextTertiary,
                            fontSize: token.fontSizeSM,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{provider.models.length} 个模型</span>
                            {provider.models.length > 0 && (
                              <span style={{ color: token.colorTextQuaternary }}>•</span>
                            )}
                            {provider.models.filter(m => m.enabled).length > 0 && (
                              <span style={{
                                color: token.colorSuccess,
                                transition: 'all 0.3s ease',
                                fontWeight: selectedProvider?.id === provider.id ? 500 : 'normal'
                              }}>
                                {provider.models.filter(m => m.enabled).length} 个活跃
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '4px'
                      }}>
                        <div style={{
                          background: provider.apiKey
                            ? `${token.colorSuccess}20`
                            : `${token.colorTextQuaternary}30`,
                          color: provider.apiKey ? token.colorSuccess : token.colorTextQuaternary,
                          fontSize: token.fontSizeSM,
                          padding: '2px 6px',
                          borderRadius: token.borderRadiusSM,
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.3s ease'
                        }}>
                          {provider.apiKey ? (
                            <>
                              <CheckCircle size={10} style={{ marginRight: '4px' }} />
                              已配置
                            </>
                          ) : '未配置'}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div style={styles.contentArea}>
          {selectedProvider ? (
            <>
              <div style={{
                ...styles.contentHeader,
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: token.marginLG
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: `${token.colorPrimary}20`,
                      borderRadius: token.borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: token.marginSM,
                      border: `1px solid ${token.colorPrimary}30`,
                      transition: 'all 0.3s ease',
                      animation: 'scaleIn 0.3s ease-out'
                    }}>
                      <ProviderIcon
                        provider={selectedProvider.id}
                        size={24}
                        type={'color'}
                      />
                    </div>
                    <div>
                      <Title
                        level={4}
                        style={{
                          color: token.colorText,
                          marginBottom: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {selectedProvider.displayName}
                        <Badge
                          status={selectedProvider.enabled ? "success" : "default"}
                          style={{ marginLeft: token.marginXS }}
                        />
                      </Title>
                      <Text style={{ color: token.colorTextSecondary, fontSize: token.fontSize }}>
                        {selectedProvider.description || "AI模型提供商"}
                      </Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: token.marginXS }}>
                    <Button
                      icon={<Settings size={16} />}
                      onClick={() => handleEditProvider(selectedProvider)}
                      style={{
                        background: token.colorFillSecondary,
                        borderColor: token.colorBorder,
                        color: token.colorText,
                        borderRadius: token.borderRadius
                      }}
                    >
                      编辑配置
                    </Button>
                    <Tooltip title={selectedProvider.enabled ? "禁用提供商" : "启用提供商"}>
                      <Switch
                        checked={selectedProvider.enabled}
                        onChange={(checked) => handleProviderToggle(selectedProvider, checked)}
                        size="default"
                      />
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div style={styles.contentBody} className="provider-content">
                {/* 刷新状态覆盖层 */}
                {isRefreshing && (
                  <div style={styles.loadingOverlay}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        border: '2px solid transparent',
                        borderTop: `2px solid ${token.colorPrimary}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: token.marginXS
                      }}></div>
                      <Text style={{ color: token.colorText }}>更新中...</Text>
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: token.marginLG
                }}>
                  <div>
                    <Text style={{ color: token.colorTextSecondary }}>
                      管理 {selectedProvider.displayName} 的模型配置，共 {selectedProvider.models.length} 个模型
                      {selectedProvider.models.filter(m => m.enabled).length > 0 && (
                        <span style={{ color: token.colorSuccess, marginLeft: token.marginXS }}>
                          ({selectedProvider.models.filter(m => m.enabled).length} 个活跃)
                        </span>
                      )}
                    </Text>
                  </div>
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={handleAddModel}
                    style={{
                      borderRadius: token.borderRadius,
                      boxShadow: token.boxShadowSecondary
                    }}
                  >
                    添加模型
                  </Button>
                </div>

                {/* 搜索和筛选区域 */}
                <div style={styles.searchSection}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: token.marginLG,
                    marginBottom: token.marginSM
                  }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Input
                        placeholder="搜索模型名称或ID..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        prefix={<Search size={16} style={{ color: token.colorTextQuaternary }} />}
                        style={{
                          borderRadius: token.borderRadius,
                          border: `1px solid ${token.colorBorder}`
                        }}
                        size="middle"
                      />
                    </div>
                    <div>
                      <Radio.Group
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        buttonStyle="solid"
                        size="middle"
                        style={{ flexShrink: 0 }}
                      >
                        <Radio.Button value={null}>全部</Radio.Button>
                        <Radio.Button value="chat">对话</Radio.Button>
                        <Radio.Button value="image">图像</Radio.Button>
                        <Radio.Button value="embedding">嵌入</Radio.Button>
                      </Radio.Group>
                    </div>
                  </div>

                  <div style={{
                    fontSize: token.fontSizeSM,
                    color: token.colorTextSecondary,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <AlertTriangle size={12} style={{ marginRight: 6, color: token.colorWarning }} />
                    点击右侧菜单按钮可以进行编辑、删除等更多操作
                  </div>
                </div>

                {/* 加载状态 */}
                {isLoadingModels && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 0',
                    background: token.colorFillQuaternary,
                    borderRadius: token.borderRadius,
                    marginBottom: token.marginLG,
                    border: `1px solid ${token.colorBorder}`,
                    animation: 'scaleIn 0.3s ease-out'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        border: '2px solid transparent',
                        borderTop: `2px solid ${token.colorPrimary}`,
                        borderBottom: `2px solid ${token.colorPrimary}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: token.marginLG
                      }}></div>
                      <Text style={{ color: token.colorText }}>正在从API获取模型列表，请稍候...</Text>
                    </div>
                  </div>
                )}

                {/* 模型列表 */}
                {renderModelList()}
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <Bot size={64} style={{ color: token.colorTextQuaternary }} />
              </div>
              <Title level={3} style={{ color: token.colorTextSecondary, marginBottom: token.marginXS }}>
                选择一个提供商
              </Title>
              <Text style={{ color: token.colorTextTertiary }}>
                从左侧列表中选择一个模型提供商来管理其配置和模型
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑提供商模态框 */}
      <Modal
        title={editingProvider ? '编辑提供商' : '添加提供商'}
        open={isProviderModalVisible}
        onCancel={() => setIsProviderModalVisible(false)}
        footer={null}
        width={600}
        styles={{
          content: {
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG
          },
          header: {
            background: token.colorBgElevated,
            borderBottom: `1px solid ${token.colorBorder}`
          }
        }}
      >
        <Form
          form={providerForm}
          layout="vertical"
          onFinish={handleProviderFormSubmit}
          style={{ marginTop: token.marginLG }}
        >
          <Form.Item
            name="displayName"
            label={<span style={{ color: token.colorText }}>提供商名称</span>}
            rules={[{ required: true, message: '请输入提供商名称' }]}
          >
            <Input
              placeholder="例如：OpenAI"
              style={{ borderRadius: token.borderRadius }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ color: token.colorText }}>描述</span>}
          >
            <TextArea
              placeholder="提供商描述信息"
              rows={3}
              style={{ borderRadius: token.borderRadius }}
            />
          </Form.Item>

          <Form.Item
            name="apiUrl"
            label={<span style={{ color: token.colorText }}>API URL</span>}
            rules={[{ required: true, message: '请输入API URL' }]}
          >
            <Input
              placeholder="https://api.openai.com/v1"
              style={{ borderRadius: token.borderRadius }}
            />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={<span style={{ color: token.colorText }}>API Key</span>}
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.Password
              placeholder="sk-..."
              style={{ borderRadius: token.borderRadius }}
            />
          </Form.Item>

          <Form.Item
            name="website"
            label={<span style={{ color: token.colorText }}>官网</span>}
          >
            <Input
              placeholder="https://openai.com"
              style={{ borderRadius: token.borderRadius }}
            />
          </Form.Item>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: token.marginXS,
            marginTop: token.marginLG
          }}>
            <Button
              onClick={() => setIsProviderModalVisible(false)}
              style={{ borderRadius: token.borderRadius }}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ borderRadius: token.borderRadius }}
            >
              {editingProvider ? '更新' : '添加'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 添加/编辑模型模态框 */}
      <Modal
        title={editingModel ? '编辑模型' : '添加模型'}
        open={isModelModalVisible}
        onCancel={() => setIsModelModalVisible(false)}
        footer={null}
        width={800}
        styles={{
          content: {
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG
          },
          header: {
            background: token.colorBgElevated,
            borderBottom: `1px solid ${token.colorBorder}`
          }
        }}
      >
        <Form
          form={modelForm}
          layout="vertical"
          onFinish={handleModelFormSubmit}
          style={{ marginTop: token.marginLG }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.marginLG }}>
            <Form.Item
              name="id"
              label={<span style={{ color: token.colorText }}>模型ID</span>}
              rules={[{ required: true, message: '请输入模型ID' }]}
            >
              <Input
                placeholder="例如：gpt-4"
                style={{ borderRadius: token.borderRadius }}
              />
            </Form.Item>

            <Form.Item
              name="displayName"
              label={<span style={{ color: token.colorText }}>显示名称</span>}
              rules={[{ required: true, message: '请输入显示名称' }]}
            >
              <Input
                placeholder="例如：GPT-4"
                style={{ borderRadius: token.borderRadius }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={<span style={{ color: token.colorText }}>描述</span>}
          >
            <TextArea
              placeholder="模型描述信息"
              rows={2}
              style={{ borderRadius: token.borderRadius }}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.marginLG }}>
            <Form.Item
              name="type"
              label={<span style={{ color: token.colorText }}>模型类型</span>}
              rules={[{ required: true, message: '请选择模型类型' }]}
            >
              <Select
                placeholder="选择模型类型"
                style={{ borderRadius: token.borderRadius }}
              >
                <Option value="chat">对话模型</Option>
                <Option value="completion">补全模型</Option>
                <Option value="embedding">嵌入模型</Option>
                <Option value="image">图像模型</Option>
                <Option value="tts">语音合成</Option>
                <Option value="sst">语音识别</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="enabled"
              valuePropName="checked"
              style={{ display: 'flex', alignItems: 'center', marginTop: '30px' }}
            >
              <Checkbox style={{ color: token.colorText }}>启用模型</Checkbox>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.marginLG }}>
            <Form.Item
              name="contextWindowTokens"
              label={<span style={{ color: token.colorText }}>上下文窗口 (tokens)</span>}
              rules={[{ required: true, message: '请输入上下文窗口大小' }]}
            >
              <InputNumber
                placeholder="4096"
                min={1}
                max={10000000}
                style={{ width: '100%', borderRadius: token.borderRadius }}
              />
            </Form.Item>

            <Form.Item
              name="maxOutput"
              label={<span style={{ color: token.colorText }}>最大输出 (tokens)</span>}
              rules={[{ required: true, message: '请输入最大输出大小' }]}
            >
              <InputNumber
                placeholder="4096"
                min={1}
                max={100000}
                style={{ width: '100%', borderRadius: token.borderRadius }}
              />
            </Form.Item>
          </div>

          <div style={{ marginBottom: token.marginLG }}>
            <Text style={{ color: token.colorTextSecondary, marginBottom: token.marginXS, display: 'block' }}>
              模型能力
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.marginLG }}>
              <Form.Item
                name="functionCall"
                valuePropName="checked"
              >
                <Checkbox style={{ color: token.colorText }}>支持函数调用</Checkbox>
              </Form.Item>

              <Form.Item
                name="vision"
                valuePropName="checked"
              >
                <Checkbox style={{ color: token.colorText }}>支持视觉识别</Checkbox>
              </Form.Item>
            </div>
          </div>

          <div style={{ marginBottom: token.marginLG }}>
            <Text style={{ color: token.colorTextSecondary, marginBottom: token.marginXS, display: 'block' }}>
              定价信息 ($/1M tokens)
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: token.marginLG }}>
              <Form.Item
                name="inputPrice"
                label={<span style={{ color: token.colorText, fontSize: token.fontSizeSM }}>输入价格</span>}
              >
                <InputNumber
                  placeholder="0.5"
                  min={0}
                  step={0.1}
                  style={{ width: '100%', borderRadius: token.borderRadius }}
                />
              </Form.Item>

              <Form.Item
                name="outputPrice"
                label={<span style={{ color: token.colorText, fontSize: token.fontSizeSM }}>输出价格</span>}
              >
                <InputNumber
                  placeholder="1.5"
                  min={0}
                  step={0.1}
                  style={{ width: '100%', borderRadius: token.borderRadius }}
                />
              </Form.Item>

              <Form.Item
                name="cachedInputPrice"
                label={<span style={{ color: token.colorText, fontSize: token.fontSizeSM }}>缓存输入价格</span>}
              >
                <InputNumber
                  placeholder="0.1"
                  min={0}
                  step={0.1}
                  style={{ width: '100%', borderRadius: token.borderRadius }}
                />
              </Form.Item>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: token.marginXS,
            marginTop: token.marginLG
          }}>
            <Button
              onClick={() => setIsModelModalVisible(false)}
              style={{ borderRadius: token.borderRadius }}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ borderRadius: token.borderRadius }}
            >
              {editingModel ? '更新' : '添加'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default ProviderManager 