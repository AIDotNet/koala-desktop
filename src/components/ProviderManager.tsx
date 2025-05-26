import React, { useState, useEffect } from 'react'
import { ProviderIcon } from '@lobehub/icons'
import axios from 'axios'
import {
  Card,
  Switch,
  Button,
  Input,
  Modal,
  Form,
  Typography,
  Space,
  Tooltip,
  Badge,
  Table,
  Tag,
  Popconfirm,
  message,
  List,
  Select,
  InputNumber,
  Checkbox,
  Row,
  Col,
  Statistic,
  Divider,
  Alert,
  Dropdown,
  Radio,
  theme
} from 'antd'
import {
  Plus,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  ExternalLink,
  Key,
  Globe,
  Bot,
  Edit,
  Activity,
  CheckCircle,
  AlertTriangle,
  Download,
  Square,
  Search,
  Filter,
  Cpu
} from 'lucide-react'
import { Provider, Model, ProviderManagerProps } from '@/types/model'
import { providerDB } from '@/utils/providerDB'
import { getIcon, IconName } from '@/utils/iconutils'
import { OpenAI } from '@lobehub/icons'
import ModelListItem from './ModelListItem'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

// 用于渲染提供商图标的函数
const renderProviderIcon = (iconName?: string) => {
  if (!iconName) return null;

  try {
    const IconComponent = getIcon(iconName as IconName);
    if (!IconComponent) return null;
    // 使用 React.createElement 而不是 JSX
    return React.createElement(IconComponent);
  } catch (error) {
    console.error("无法渲染图标:", error);
    return null;
  }
};

// 在文件顶部添加自定义动画关键帧，在scrollbarStyles之后
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0.6; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.95); }
    to { transform: scale(1); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-10px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;

const ProviderManager: React.FC<ProviderManagerProps> = ({
  providers,
  onProviderUpdate,
  onProviderAdd,
  onProviderDelete,
  onModelToggle
}) => {
  // 获取主题token
  const { token } = theme.useToken()
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

  // 添加自定义滚动条样式
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #1a202c;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #4a5568;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #718096;
    }
  `;

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

  // 计算统计数据
  const getStatistics = () => {
    const enabledProviders = providers.filter(p => p.enabled).length
    const totalModels = providers.reduce((sum, p) => sum + p.models.length, 0)
    const enabledModels = providers.reduce((sum, p) =>
      sum + p.models.filter(m => m.enabled).length, 0
    )
    const configuredProviders = providers.filter(p => p.apiKey && p.apiKey.trim() !== '').length

    return {
      enabledProviders,
      totalProviders: providers.length,
      totalModels,
      enabledModels,
      configuredProviders
    }
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

  // 渲染模型能力图标
  const renderAbilities = (model: Model): React.ReactNode[] => {
    const abilities = [];

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

      let updatedModels: Model[]
      if (editingModel) {
        // 更新现有模型
        updatedModels = selectedProvider.models.map(m =>
          m.id === editingModel.id ? modelData : m
        )
        // 更新数据库中的模型
        await providerDB.updateModel(selectedProvider.id, modelData.id, modelData);
        message.success('模型已更新')
      } else {
        // 添加新模型
        updatedModels = [...selectedProvider.models, modelData]
        // 添加模型到数据库
        await providerDB.addModel(selectedProvider.id, modelData);
        message.success('模型已添加')
      }

      const updatedProvider = {
        ...selectedProvider,
        models: updatedModels
      }

      // 更新数据库中的提供商
      await providerDB.saveProvider(updatedProvider);
      // 更新上层组件状态
      onProviderUpdate(updatedProvider)

      setSelectedProvider(updatedProvider)
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

      // 从数据库删除模型
      await providerDB.deleteModel(selectedProvider.id, modelId);

      const updatedModels = selectedProvider.models.filter(m => m.id !== modelId)
      const updatedProvider = {
        ...selectedProvider,
        models: updatedModels
      }

      // 更新上层组件状态
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
        ? `${selectedProvider.apiUrl}/models`
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

      // 更新当前提供商的模型列表
      const existingModelIds = selectedProvider.models.map(m => m.id);
      const newModels = apiModels.filter((m: Model) => !existingModelIds.includes(m.id));

      if (newModels.length === 0) {
        message.info('没有发现新的模型');
      } else {
        const updatedProvider = {
          ...selectedProvider,
          models: [...selectedProvider.models, ...newModels]
        };

        // 保存到数据库
        await providerDB.saveProvider(updatedProvider);
        // 更新上层组件状态
        onProviderUpdate(updatedProvider);
        setSelectedProvider(updatedProvider);
        message.success(`成功添加 ${newModels.length} 个模型`);
      }
    } catch (error: any) {
      console.error('获取模型列表错误:', error);
      message.error(`获取模型列表失败: ${error.response?.data?.error?.message || error.message}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // 过滤模型列表
  const getFilteredModels = () => {
    if (!selectedProvider) return [];

    return selectedProvider.models.filter(model => {
      // 按名称和ID搜索
      const matchesSearch = searchText === '' ||
        model.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
        model.id.toLowerCase().includes(searchText.toLowerCase());

      // 按类型筛选
      const matchesType = !filterType || model.type === filterType;

      return matchesSearch && matchesType;
    });
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0f'
    }}>
      <style>{scrollbarStyles}</style>
      <style>{animationStyles}</style>
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{
          width: '256px',
          borderRight: '1px solid #4b5563',
          background: '#374151',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #4b5563'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Title
                level={5}
                style={{
                  color: '#ffffff',
                  marginBottom: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Globe style={{ marginRight: '8px' }} size={16} />
                提供商
              </Title>
              <Button
                type="primary"
                size="small"
                icon={<Plus size={14} />}
                onClick={handleAddProvider}
                style={{
                  background: '#3b82f6',
                  borderColor: '#3b82f6',
                }}
              >
                添加
              </Button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{
              height: 'calc(100vh - 120px)',
              overflowY: 'auto',
              overflowX: "hidden",
            }} className="custom-scrollbar">
              <List
                dataSource={providers.sort((a, b) => (a.enabled === b.enabled) ? 0 : a.enabled ? -1 : 1)}
                renderItem={(provider) => (
                  <List.Item
                    key={provider.id}
                    style={{
                      borderRadius: '10px',
                      margin:5,
                      backgroundColor: selectedProvider?.id === provider.id
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      padding: '10px',
                      marginBottom: '10px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: selectedProvider?.id === provider.id
                        ? '0 4px 6px rgba(0, 0, 0, 0.2)'
                        : 'none',
                    }}
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <div
                      style={{
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                      }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          fontSize: '24px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: selectedProvider?.id === provider.id ? 'rgba(59, 130, 246, 0.3)' : '#4b5563',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          boxShadow: selectedProvider?.id === provider.id ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
                        }}>
                          <ProviderIcon
                            provider={provider.id}
                            size={38}
                            type={'color'}
                          />
                        </div>
                        <div>
                          <div style={{
                            color: '#ffffff',
                            fontWeight: 500,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            {provider.displayName}
                            {provider.enabled && (
                              <div style={{
                                width: selectedProvider?.id === provider.id ? '8px' : '6px',
                                height: selectedProvider?.id === provider.id ? '8px' : '6px',
                                borderRadius: '50%',
                                background: '#10b981',
                                marginLeft: '8px',
                                transition: 'all 0.3s ease'
                              }}></div>
                            )}
                          </div>
                          <div style={{
                            color: '#9ca3af',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{provider.models.length} 个模型</span>
                            {provider.models.length > 0 && (
                              <span style={{ color: '#6b7280' }}>•</span>
                            )}
                            {provider.models.filter(m => m.enabled).length > 0 && (
                              <span style={{
                                color: '#10b981',
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
                          background: provider.apiKey ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.3)',
                          color: provider.apiKey ? '#10b981' : '#6b7280',
                          fontSize: '12px',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.3s ease',
                          ...(selectedProvider?.id === provider.id && provider.apiKey && {
                            background: 'rgba(16, 185, 129, 0.3)'
                          }),
                          ...(selectedProvider?.id === provider.id && !provider.apiKey && {
                            background: 'rgba(107, 114, 128, 0.5)'
                          })
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
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: 1,
          transform: 'translateY(0)'
        }}>
          {selectedProvider ? (
            <>
              <div
                style={{
                  padding: '24px',
                  borderBottom: '1px solid #374151',
                  background: 'linear-gradient(to right, #1f2937, rgba(31, 41, 55, 0.9))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.3s ease',
                        animation: 'scaleIn 0.3s ease-out'
                      }}
                    >
                      <div style={{ fontSize: '20px' }}>
                        <ProviderIcon
                          provider={selectedProvider.id}
                          size={24}
                          type={'color'}
                        />
                      </div>
                    </div>
                    <div>
                      <Title
                        level={4}
                        style={{
                          color: '#ffffff',
                          marginBottom: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {selectedProvider.displayName}
                        <Badge
                          status={selectedProvider.enabled ? "success" : "default"}
                          style={{ marginLeft: '8px' }}
                        />
                      </Title>
                      <Text style={{ color: '#9ca3af', fontSize: '14px' }}>
                        {selectedProvider.description || "AI模型提供商"}
                      </Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      icon={<Settings size={16} />}
                      onClick={() => handleEditProvider(selectedProvider)}
                      style={{
                        background: '#374151',
                        borderColor: '#4b5563',
                        color: '#d1d5db',
                        borderRadius: '8px'
                      }}
                    >
                      编辑配置
                    </Button>
                    <Tooltip title={selectedProvider.enabled ? "禁用提供商" : "启用提供商"}>
                      <Switch
                        checked={selectedProvider.enabled}
                        onChange={(checked) => handleProviderToggle(selectedProvider, checked)}
                        style={{ marginLeft: '8px' }}
                      />
                    </Tooltip>
                  </div>
                </div>
                <div style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {selectedProvider.website && (
                    <Button
                      type="link"
                      icon={<ExternalLink size={14} />}
                      style={{
                        padding: 0,
                        height: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#60a5fa'
                      }}
                      onClick={() => window.open(selectedProvider.website, '_blank')}
                    >
                      访问官方网站
                    </Button>
                  )}

                  {selectedProvider.apiKey && selectedProvider.apiUrl && (
                    <Button
                      type="primary"
                      icon={<Download size={14} />}
                      loading={isLoadingModels}
                      onClick={fetchModelsFromOpenAI}
                      style={{
                        background: '#2563eb',
                        borderColor: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {isLoadingModels ? '加载中...' : '加载模型列表'}
                    </Button>
                  )}
                </div>
              </div>

              {/* 模型列表区域 */}
              <div
                style={{
                  flex: 1,
                  padding: '24px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: 'fadeIn 0.4s ease-out',
                  position: 'relative'
                }}
              >
                {/* 刷新覆盖层 */}
                {isRefreshing && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(2px)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'fadeIn 0.2s ease-out'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '2px solid transparent',
                        borderTop: '2px solid #3b82f6',
                        borderBottom: '2px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '8px'
                      }}></div>
                      <Text style={{ color: '#ffffff' }}>更新中...</Text>
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px'
                }}>
                  <div>
                    <Text style={{ color: '#9ca3af' }}>
                      管理 {selectedProvider.displayName} 的模型配置，共 {selectedProvider.models.length} 个模型
                      {selectedProvider.models.filter(m => m.enabled).length > 0 && (
                        <span style={{ color: '#10b981', marginLeft: '8px' }}>
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
                      background: '#2563eb',
                      borderColor: '#2563eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    添加模型
                  </Button>
                </div>

                {/* 搜索和筛选区域 */}
                <div style={{
                  marginBottom: 24,
                  padding: '16px 20px',
                  backgroundColor: token.colorFillAlter,
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${token.colorBorder}`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 12
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
                    fontSize: 12,
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '48px 0',
                      background: 'rgba(31, 41, 55, 0.4)',
                      borderRadius: '8px',
                      marginBottom: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(4px)',
                      animation: 'scaleIn 0.3s ease-out'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        border: '2px solid transparent',
                        borderTop: '2px solid #3b82f6',
                        borderBottom: '2px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '16px'
                      }}></div>
                      <Text style={{ color: '#d1d5db' }}>正在从API获取模型列表，请稍候...</Text>
                    </div>
                  </div>
                )}

                {/* 模型列表 */}
                {getFilteredModels().length > 0 ? (
                  <div
                    className="custom-scrollbar"
                    style={{
                      maxHeight: "calc(100vh - 420px)",
                      overflowY: "auto",
                      padding: '0 4px'
                    }}
                  >
                    {getFilteredModels().map((model, index) => (
                      <ModelListItem
                        key={model.id}
                        model={model}
                        index={index}
                        onEdit={handleEditModel}
                        onDelete={handleDeleteModel}
                        onToggle={onModelToggle}
                        onProviderUpdate={onProviderUpdate}
                        setSelectedProvider={setSelectedProvider}
                        setIsRefreshing={setIsRefreshing}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px 20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: token.colorFillQuaternary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 24,
                      border: `1px solid ${token.colorBorderSecondary}`
                    }}>
                      <Bot size={40} style={{ color: token.colorTextQuaternary }} />
                    </div>
                    <Title level={3} style={{ 
                      color: token.colorTextSecondary, 
                      marginBottom: 12,
                      fontWeight: 500
                    }}>
                      {selectedProvider.models.length > 0 ? '没有匹配的模型' : '暂无模型'}
                    </Title>
                    <Text style={{ 
                      color: token.colorTextTertiary, 
                      marginBottom: 32, 
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
                          fontSize: 14,
                          fontWeight: 500,
                          boxShadow: token.boxShadowSecondary
                        }}
                      >
                        添加第一个模型
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bot size={64} className="text-gray-600 mx-auto mb-4" />
                <Title level={3} className="!text-gray-400 !mb-2">选择一个提供商</Title>
                <Text className="text-gray-500">
                  从左侧列表中选择一个模型提供商来管理其配置和模型
                </Text>
              </div>
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
      >
        <Form
          form={providerForm}
          layout="vertical"
          onFinish={handleProviderFormSubmit}
          className="mt-4"
        >
          <Form.Item
            name="displayName"
            label="提供商名称"
            rules={[{ required: true, message: '请输入提供商名称' }]}
          >
            <Input placeholder="例如：OpenAI" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea
              placeholder="提供商描述信息"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="apiUrl"
            label="API URL"
            rules={[{ required: true, message: '请输入API URL' }]}
          >
            <Input placeholder="https://api.example.com/v1" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
          >
            <Input.Password placeholder="输入API密钥" />
          </Form.Item>

          <Form.Item
            name="website"
            label="官方网站"
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <div className="flex justify-end space-x-2 mt-6">
            <Button onClick={() => setIsProviderModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
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
        width={700}
      >
        <Form
          form={modelForm}
          layout="vertical"
          onFinish={handleModelFormSubmit}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="id"
              label="模型ID"
              rules={[{ required: true, message: '请输入模型ID' }]}
            >
              <Input placeholder="例如：gpt-4" />
            </Form.Item>

            <Form.Item
              name="displayName"
              label="显示名称"
              rules={[{ required: true, message: '请输入显示名称' }]}
            >
              <Input placeholder="例如：GPT-4" />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea
              placeholder="模型描述信息"
              rows={2}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label="模型类型"
              rules={[{ required: true, message: '请选择模型类型' }]}
            >
              <Select placeholder="选择模型类型">
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
            >
              <Checkbox>启用模型</Checkbox>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="contextWindowTokens"
              label="上下文窗口 (tokens)"
              rules={[{ required: true, message: '请输入上下文窗口大小' }]}
            >
              <InputNumber
                placeholder="4096"
                min={1}
                max={10000000}
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="maxOutput"
              label="最大输出 (tokens)"
              rules={[{ required: true, message: '请输入最大输出大小' }]}
            >
              <InputNumber
                placeholder="4096"
                min={1}
                max={100000}
                className="w-full"
              />
            </Form.Item>
          </div>

          <div className="mb-4">
            <Text className="text-gray-400 mb-2 block">模型能力</Text>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="functionCall"
                valuePropName="checked"
              >
                <Checkbox>支持函数调用</Checkbox>
              </Form.Item>

              <Form.Item
                name="vision"
                valuePropName="checked"
              >
                <Checkbox>支持视觉识别</Checkbox>
              </Form.Item>
            </div>
          </div>

          <div className="mb-4">
            <Text className="text-gray-400 mb-2 block">定价信息 ($/1M tokens)</Text>
            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                name="inputPrice"
                label="输入价格"
              >
                <InputNumber
                  placeholder="0.5"
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                name="outputPrice"
                label="输出价格"
              >
                <InputNumber
                  placeholder="1.5"
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                name="cachedInputPrice"
                label="缓存输入价格"
              >
                <InputNumber
                  placeholder="0.1"
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button onClick={() => setIsModelModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingModel ? '更新' : '添加'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default ProviderManager 