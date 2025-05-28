import React, { useState, useEffect } from 'react'
import {
  Layout,
  Menu,
  Typography,
  Button,
  Space,
  Card,
  Avatar,
  Badge,
  Divider,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Alert,
  Descriptions,
  Switch,
  Tooltip,
  Empty,
  Result,
  message
} from 'antd'
import {
  Settings as SettingsIcon,
  Bot,
  Database,
  Palette,
  Shield,
  Info,
  Globe,
  Zap,
  Heart,
  Star,
  TrendingUp,
  Activity,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import ProviderManager from '@/components/ProviderManager'
import { Provider, Model } from '@/types/model'
import { providerDB } from '@/utils/providerDB'
import { dataManager, type AppConfig, type ReleaseInfo } from '@/services/dataManager'

const { Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography

interface SettingsProps {
  isDarkTheme: boolean
  onNavigate?: (url: string) => void
}

interface UpdateStatus {
  checking: boolean
  hasUpdate: boolean
  currentVersion: string
  latestVersion?: string
  releaseInfo?: ReleaseInfo
  error?: string
}

const Settings: React.FC<SettingsProps> = ({ isDarkTheme, onNavigate }) => {
  const [selectedKey, setSelectedKey] = useState<string>('models')
  const [providers, setProviders] = useState<Provider[]>([])
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    checking: false,
    hasUpdate: false,
    currentVersion: '2.2.0'
  })

  // 从IndexedDB加载提供商数据
  useEffect(() => {
    const loadProviders = async () => {
      try {
        // 首先尝试从数据库加载提供商
        let dbProviders = await providerDB.getAllProviders();

        // 如果数据库为空，初始化默认提供商
        if (dbProviders.length === 0) {
          dbProviders = await providerDB.initializeDefaultProviders();
        }
        setProviders(dbProviders);
      } catch (error) {
        console.error('加载提供商数据失败:', error);
        setProviders([]);
      }
    };

    loadProviders();
  }, []);

  // 初始化更新状态
  useEffect(() => {
    const initUpdateStatus = async () => {
      try {
        const config = await dataManager.initConfig()
        setUpdateStatus(prev => ({ ...prev, currentVersion: config.version }))
      } catch (error) {
        console.error('初始化更新状态失败:', error)
      }
    }
    initUpdateStatus()
  }, [])

  // 检查更新
  const checkForUpdates = async () => {
    setUpdateStatus(prev => ({ ...prev, checking: true, error: undefined }))
    
    try {
      const result = await dataManager.checkForUpdates()
      setUpdateStatus(prev => ({
        ...prev,
        checking: false,
        hasUpdate: result.hasUpdate,
        latestVersion: result.latestVersion,
        releaseInfo: result.releaseInfo,
        error: result.error
      }))

      if (result.hasUpdate) {
        message.success(`发现新版本 v${result.latestVersion}`)
      } else if (!result.error) {
        message.info('当前已是最新版本')
      } else {
        message.error(result.error)
      }
    } catch (error) {
      setUpdateStatus(prev => ({ 
        ...prev, 
        checking: false, 
        error: error instanceof Error ? error.message : '检查更新失败' 
      }))
      message.error('检查更新失败')
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 导航函数
  const handleNavigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url)
    } else {
      // 如果没有提供onNavigate，尝试使用window.history
      window.history.pushState({}, '', url)
    }
  }

  const menuItems = [
    {
      key: 'models',
      icon: <Bot size={16} />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>模型管理</span>
          <Badge
            count={providers.reduce((sum, p) => sum + p.models.filter(m => m.enabled).length, 0)}
            size="small"
            style={{ backgroundColor: '#52c41a' }}
          />
        </div>
      ),
    },
    {
      key: 'data',
      icon: <Database size={16} />,
      label: '数据管理',
    },
    {
      key: 'about',
      icon: <Info size={16} />,
      label: '关于',
    },
  ]

  // 更新提供商
  const handleProviderUpdate = async (updatedProvider: Provider) => {
    try {
      // 保存到数据库
      await providerDB.saveProvider(updatedProvider);

      // 更新状态
      setProviders(prev =>
        prev.map(p => p.id === updatedProvider.id ? updatedProvider : p)
      );
    } catch (error) {
      console.error('更新提供商失败:', error);
      message.error('更新提供商失败');
    }
  }

  // 添加提供商
  const handleProviderAdd = async (newProvider: Provider) => {
    try {
      // 保存到数据库
      await providerDB.saveProvider(newProvider);

      // 更新状态
      setProviders(prev => [...prev, newProvider]);
    } catch (error) {
      console.error('添加提供商失败:', error);
      message.error('添加提供商失败');
    }
  }

  // 删除提供商
  const handleProviderDelete = async (providerId: string) => {
    try {
      // 从数据库删除
      await providerDB.deleteProvider(providerId);

      // 更新状态
      setProviders(prev => prev.filter(p => p.id !== providerId));
    } catch (error) {
      console.error('删除提供商失败:', error);
      message.error('删除提供商失败');
    }
  }

  // 切换模型启用状态
  const handleModelToggle = async (providerId: string, modelId: string, enabled: boolean) => {
    try {
      // 更新数据库
      await providerDB.toggleModelEnabled(providerId, modelId, enabled);

      // 更新状态
      setProviders(prev =>
        prev.map(provider => {
          if (provider.id === providerId) {
            return {
              ...provider,
              models: provider.models.map(model =>
                model.id === modelId ? { ...model, enabled } : model
              )
            };
          }
          return provider;
        })
      );

      // 添加成功消息提示
      const targetModel = providers
        .find(p => p.id === providerId)?.models
        .find(m => m.id === modelId);

      if (targetModel) {
        message.success(`模型 "${targetModel.displayName}" 已${enabled ? '启用' : '禁用'}`);
      }
    } catch (error) {
      console.error('切换模型状态失败:', error);
      message.error('操作失败');
    }
  }

  // 计算统计数据
  const getStatistics = () => {
    const enabledProviders = providers.filter(p => p.enabled).length
    const totalModels = providers.reduce((sum, p) => sum + p.models.length, 0)
    const enabledModels = providers.reduce((sum, p) =>
      sum + p.models.filter(m => m.enabled).length, 0
    )

    return {
      enabledProviders,
      totalProviders: providers.length,
      totalModels,
      enabledModels
    }
  }

  const renderContent = () => {
    const stats = getStatistics()

    switch (selectedKey) {
      case 'models':
        return (
          <ProviderManager
            providers={providers}
            onProviderUpdate={handleProviderUpdate}
            onProviderAdd={handleProviderAdd}
            onProviderDelete={handleProviderDelete}
            onModelToggle={handleModelToggle}
          />
        )
      case 'data':
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <Title
                level={3}
                style={{
                  color: isDarkTheme ? '#ffffff' : '#1f2937',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Database style={{ marginRight: '12px' }} size={24} />
                数据管理
              </Title>
              <Text style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                管理您的聊天记录、导入导出数据和清理缓存
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={8}>
                <Card
                  style={{
                    background: isDarkTheme ? '#2a2a2a' : '#ffffff',
                    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>聊天记录</span>}
                    value={1234}
                    suffix="条"
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<Activity size={16} />}
                  />
                  <div style={{ marginTop: '16px' }}>
                    <Button type="primary" size="small" ghost>
                      导出记录
                    </Button>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card
                  style={{
                    background: isDarkTheme ? '#2a2a2a' : '#ffffff',
                    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>缓存大小</span>}
                    value={256}
                    suffix="MB"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<Database size={16} />}
                  />
                  <div style={{ marginTop: '16px' }}>
                    <Button type="primary" size="small" danger ghost>
                      清理缓存
                    </Button>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card
                  style={{
                    background: isDarkTheme ? '#2a2a2a' : '#ffffff',
                    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>备份文件</span>}
                    value={5}
                    suffix="个"
                    valueStyle={{ color: '#faad14' }}
                    prefix={<Shield size={16} />}
                  />
                  <div style={{ marginTop: '16px' }}>
                    <Button type="primary" size="small" ghost>
                      创建备份
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider style={{
              borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
              margin: '32px 0'
            }} />

            <Alert
              message="数据安全提醒"
              description="建议定期备份您的聊天记录和设置，以防数据丢失。所有数据均存储在本地，不会上传到云端。"
              type="info"
              showIcon
              icon={<Info size={16} />}
              style={{
                background: isDarkTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                borderColor: isDarkTheme ? '#3b82f6' : '#93c5fd',
              }}
            />
          </div>
        )
      case 'privacy':
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <Title
                level={3}
                style={{
                  color: isDarkTheme ? '#ffffff' : '#1f2937',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Shield style={{ marginRight: '12px' }} size={24} />
                隐私安全
              </Title>
              <Text style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                保护您的隐私和数据安全
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <Card
                  title={
                    <span style={{
                      color: isDarkTheme ? '#ffffff' : '#1f2937',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Shield style={{ marginRight: '8px' }} size={16} />
                      隐私保护
                    </span>
                  }
                  style={{
                    background: isDarkTheme ? '#2a2a2a' : '#ffffff',
                    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text style={{
                          color: isDarkTheme ? '#ffffff' : '#1f2937',
                          display: 'block'
                        }}>本地存储</Text>
                        <Text style={{
                          color: isDarkTheme ? '#9ca3af' : '#6b7280',
                          fontSize: '14px'
                        }}>所有数据仅存储在本地设备</Text>
                      </div>
                      <CheckCircle style={{ color: '#10b981' }} size={20} />
                    </div>

                    <Divider style={{ borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text style={{
                          color: isDarkTheme ? '#ffffff' : '#1f2937',
                          display: 'block'
                        }}>数据加密</Text>
                        <Text style={{
                          color: isDarkTheme ? '#9ca3af' : '#6b7280',
                          fontSize: '14px'
                        }}>敏感数据使用AES加密存储</Text>
                      </div>
                      <CheckCircle style={{ color: '#10b981' }} size={20} />
                    </div>

                    <Divider style={{ borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text style={{
                          color: isDarkTheme ? '#ffffff' : '#1f2937',
                          display: 'block'
                        }}>匿名使用统计</Text>
                        <Text style={{
                          color: isDarkTheme ? '#9ca3af' : '#6b7280',
                          fontSize: '14px'
                        }}>帮助改进产品体验</Text>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: '24px' }}>
              <Alert
                message="隐私承诺"
                description="我们承诺不会收集、存储或传输您的任何个人数据。所有AI对话和设置信息都安全地存储在您的本地设备上。"
                type="success"
                showIcon
                icon={<CheckCircle size={16} />}
                style={{
                  background: isDarkTheme ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                  borderColor: isDarkTheme ? '#10b981' : '#6ee7b7',
                }}
              />
            </div>
          </div>
        )
      case 'about':
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <Title
                level={3}
                style={{
                  color: isDarkTheme ? '#ffffff' : '#1f2937',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Info style={{ marginRight: '12px' }} size={24} />
                关于 Koala Desktop
              </Title>
              <Text style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                应用信息和版本详情
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span style={{
                      color: isDarkTheme ? '#ffffff' : '#1f2937',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Info style={{ marginRight: '8px' }} size={16} />
                      应用信息
                    </span>
                  }
                  style={{
                    background: isDarkTheme ? '#2a2a2a' : '#ffffff',
                    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  }}
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item 
                      label={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>应用名称</span>}
                      labelStyle={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                      contentStyle={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}
                    >
                      Koala Desktop
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>当前版本</span>}
                      labelStyle={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                      contentStyle={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}
                    >
                      <Tag color="blue">v{updateStatus.currentVersion}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>作者</span>}
                      labelStyle={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                      contentStyle={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}
                    >
                      TokenAI
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>许可证</span>}
                      labelStyle={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                      contentStyle={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}
                    >
                      MIT
                    </Descriptions.Item>
                  </Descriptions>
                  
                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <Space>
                      <Button 
                        icon={<Globe size={16} />}
                        onClick={() => window.open('https://github.com/AIDotNet/koala-desktop', '_blank')}
                      >
                        GitHub
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span style={{
                      color: isDarkTheme ? '#ffffff' : '#1f2937',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <TrendingUp style={{ marginRight: '8px' }} size={16} />
                      统计信息
                    </span>
                  }
                  style={{
                    background: isDarkTheme ? '#2a2a2a' : '#ffffff',
                    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>支持的提供商</span>}
                        value={stats.totalProviders}
                        valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                        prefix={<Bot size={14} />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>活跃模型</span>}
                        value={stats.enabledModels}
                        valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                        prefix={<Zap size={14} />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>总模型数</span>}
                        value={stats.totalModels}
                        valueStyle={{ color: '#faad14', fontSize: '18px' }}
                        prefix={<Activity size={14} />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>启用提供商</span>}
                        value={stats.enabledProviders}
                        valueStyle={{ color: '#f5222d', fontSize: '18px' }}
                        prefix={<CheckCircle size={14} />}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* 版本更新卡片 */}
              <Col xs={24}>
                <Card
                  title={
                    <span style={{
                      color: isDarkTheme ? '#ffffff' : '#1f2937',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <RefreshCw style={{ marginRight: '8px' }} size={16} />
                      版本更新
                    </span>
                  }
                  extra={
                    <Button 
                      type="primary" 
                      icon={<RefreshCw size={16} />}
                      loading={updateStatus.checking}
                      onClick={checkForUpdates}
                      ghost
                    >
                      检查更新
                    </Button>
                  }
                  style={{
                    background: isDarkTheme ? '#2a2a2a' : '#ffffff',
                    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  }}
                >
                  <Space direction="vertical" className="w-full" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}>当前版本:</Text>
                      <Tag color="blue">v{updateStatus.currentVersion}</Tag>
                    </div>
                    
                    {updateStatus.latestVersion && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}>最新版本:</Text>
                        <Tag color={updateStatus.hasUpdate ? "green" : "blue"}>
                          v{updateStatus.latestVersion}
                        </Tag>
                      </div>
                    )}

                    {updateStatus.hasUpdate && updateStatus.releaseInfo && (
                      <>
                        <Divider style={{ borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb' }} />
                        <div>
                          <Typography.Title level={5} style={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}>
                            更新内容:
                          </Typography.Title>
                          <Typography.Paragraph style={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}>
                            <Text strong>{updateStatus.releaseInfo.name}</Text>
                          </Typography.Paragraph>
                          <Typography.Paragraph 
                            style={{ 
                              color: isDarkTheme ? '#9ca3af' : '#6b7280',
                              whiteSpace: 'pre-wrap',
                              fontSize: '14px'
                            }}
                          >
                            {updateStatus.releaseInfo.body}
                          </Typography.Paragraph>
                          <Text type="secondary">
                            发布时间: {formatDate(updateStatus.releaseInfo.published_at)}
                          </Text>
                        </div>
                        
                        {updateStatus.releaseInfo.assets.length > 0 && (
                          <div>
                            <Typography.Title level={5} style={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}>
                              下载文件:
                            </Typography.Title>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              {updateStatus.releaseInfo.assets.map((asset, index) => (
                                <div 
                                  key={index} 
                                  style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '8px', 
                                    background: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5', 
                                    borderRadius: '4px' 
                                  }}
                                >
                                  <div>
                                    <Text strong style={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}>
                                      {asset.name}
                                    </Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      {formatFileSize(asset.size)}
                                    </Text>
                                  </div>
                                  <Button 
                                    type="primary" 
                                    size="small"
                                    onClick={() => window.open(asset.download_url, '_blank')}
                                  >
                                    下载
                                  </Button>
                                </div>
                              ))}
                            </Space>
                          </div>
                        )}
                      </>
                    )}

                    {updateStatus.error && (
                      <div style={{ 
                        padding: '12px', 
                        background: isDarkTheme ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', 
                        border: `1px solid ${isDarkTheme ? '#dc2626' : '#fecaca'}`, 
                        borderRadius: '4px' 
                      }}>
                        <Text type="danger">{updateStatus.error}</Text>
                      </div>
                    )}

                    {!updateStatus.hasUpdate && !updateStatus.error && updateStatus.latestVersion && (
                      <div style={{ 
                        padding: '12px', 
                        background: isDarkTheme ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4', 
                        border: `1px solid ${isDarkTheme ? '#10b981' : '#bbf7d0'}`, 
                        borderRadius: '4px' 
                      }}>
                        <Text style={{ color: '#10b981' }}>当前已是最新版本</Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: '24px' }}>
              <Alert
                message="技术信息"
                description={
                  <div>
                    <Text style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                      基于 Electron + React + TypeScript 构建的现代化桌面AI助手应用
                    </Text>
                    <br />
                    <Text style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>
                      框架: Electron 36 | 前端: React 18 + TypeScript | UI: Ant Design + LobeUI
                    </Text>
                  </div>
                }
                type="info"
                showIcon
                icon={<Info size={16} />}
                style={{
                  background: isDarkTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                  borderColor: isDarkTheme ? '#3b82f6' : '#93c5fd',
                }}
              />
            </div>
          </div>
        )
      default:
        return (
          <div className="p-6">
            <Title level={3}>欢迎使用 Koala Desktop</Title>
            <Paragraph>
              请从左侧菜单选择要配置的选项。
            </Paragraph>
          </div>
        )
    }
  }

  return (
    <Layout style={{
      height: '100%',
      background: isDarkTheme ? '#0f0f0f' : '#f5f5f5',
      overflow: 'hidden'
    }}>
      <Sider
        width={260}
        style={{
          background: isDarkTheme ? '#1a1a1a' : '#ffffff',
          borderRight: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : '#e5e7eb'}`,
        }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <Avatar
              size={48}
              style={{
                background: '#1890ff',
                marginBottom: '12px'
              }}
              icon={<SettingsIcon size={24} />}
            />
            <Title
              level={4}
              style={{
                color: isDarkTheme ? '#ffffff' : '#1f2937',
                marginBottom: '4px'
              }}
            >设置中心</Title>
            <Text style={{
              color: isDarkTheme ? '#b3b3b3' : '#6b7280',
              fontSize: '14px'
            }}>个性化您的体验</Text>
          </div>

          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => setSelectedKey(key)}
            style={{
              background: 'transparent !important',
              color: isDarkTheme ? '#000000 !important' : '#ffffff !important',
              border: 'none'
            }}
            items={menuItems}
            theme={isDarkTheme ? "dark" : "light"}
          />
        </div>
      </Sider>

      <Content style={{
        background: isDarkTheme ? '#0f0f0f' : '#f5f5f5',
      }}>
        {renderContent()}
      </Content>
    </Layout>
  )
}

export default Settings 