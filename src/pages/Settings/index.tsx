import React, { useState, useEffect } from 'react'
import './index.css'
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
  CheckCircle
} from 'lucide-react'
import ProviderManager from '@/components/ProviderManager'
import { Provider, Model } from '@/types/model'
import { providerDB } from '@/utils/providerDB'
import { getIcon } from '@/utils/iconutils'
import { OpenAI } from '@lobehub/icons'

const { Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography

interface SettingsProps {
  isDarkTheme: boolean
  onNavigate?: (url: string) => void
}

const Settings: React.FC<SettingsProps> = ({ isDarkTheme, onNavigate }) => {
  const [selectedKey, setSelectedKey] = useState<string>('models')
  const [providers, setProviders] = useState<Provider[]>([])

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
        <div className="flex items-center justify-between">
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
      key: 'appearance',
      icon: <Palette size={16} />,
      label: '外观设置',
    },
    {
      key: 'privacy',
      icon: <Shield size={16} />,
      label: '隐私安全',
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
          <div className="p-6">
            <div className="mb-6">
              <Title level={3} className="!text-white !mb-2 flex items-center">
                <Database className="mr-3" size={24} />
                数据管理
              </Title>
              <Text className="text-gray-400">
                管理您的聊天记录、导入导出数据和清理缓存
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={8}>
                <Card 
                  className="bg-gray-900 border-gray-700"
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span className="text-gray-400">聊天记录</span>}
                    value={1234}
                    suffix="条"
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<Activity size={16} />}
                  />
                  <div className="mt-4">
                    <Button type="primary" size="small" ghost>
                      导出记录
                    </Button>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card 
                  className="bg-gray-900 border-gray-700"
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span className="text-gray-400">缓存大小</span>}
                    value={256}
                    suffix="MB"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<Database size={16} />}
                  />
                  <div className="mt-4">
                    <Button type="primary" size="small" danger ghost>
                      清理缓存
                    </Button>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card 
                  className="bg-gray-900 border-gray-700"
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span className="text-gray-400">备份文件</span>}
                    value={5}
                    suffix="个"
                    valueStyle={{ color: '#faad14' }}
                    prefix={<Shield size={16} />}
                  />
                  <div className="mt-4">
                    <Button type="primary" size="small" ghost>
                      创建备份
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider className="border-gray-700 my-8" />

            <Alert
              message="数据安全提醒"
              description="建议定期备份您的聊天记录和设置，以防数据丢失。所有数据均存储在本地，不会上传到云端。"
              type="info"
              showIcon
              icon={<Info size={16} />}
              className="bg-blue-900/20 border-blue-700"
            />
          </div>
        )
      case 'appearance':
        return (
          <div className="p-6">
            <div className="mb-6">
              <Title level={3} className="!text-white !mb-2 flex items-center">
                <Palette className="mr-3" size={24} />
                外观设置
              </Title>
              <Text className="text-gray-400">
                自定义应用的外观和主题设置
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <span className="text-white flex items-center">
                      <Palette className="mr-2" size={16} />
                      主题设置
                    </span>
                  }
                  className="bg-gray-900 border-gray-700"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="text-white block">深色模式</Text>
                        <Text className="text-gray-400 text-sm">使用深色主题界面</Text>
                      </div>
                      <Switch checked={isDarkTheme} />
                    </div>
                    
                    <Divider className="border-gray-700" />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="text-white block">紧凑模式</Text>
                        <Text className="text-gray-400 text-sm">减少界面元素间距</Text>
                      </div>
                      <Switch />
                    </div>
                    
                    <Divider className="border-gray-700" />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="text-white block">动画效果</Text>
                        <Text className="text-gray-400 text-sm">启用界面过渡动画</Text>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <span className="text-white flex items-center">
                      <Globe className="mr-2" size={16} />
                      语言设置
                    </span>
                  }
                  className="bg-gray-900 border-gray-700"
                >
                  <div className="space-y-4">
                    <div>
                      <Text className="text-white block mb-2">界面语言</Text>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="primary" size="small">简体中文</Button>
                        <Button size="small" ghost>English</Button>
                        <Button size="small" ghost>日本語</Button>
                        <Button size="small" ghost>한국어</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )
      case 'privacy':
        return (
          <div className="p-6">
            <div className="mb-6">
              <Title level={3} className="!text-white !mb-2 flex items-center">
                <Shield className="mr-3" size={24} />
                隐私安全
              </Title>
              <Text className="text-gray-400">
                保护您的隐私和数据安全
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <Card 
                  title={
                    <span className="text-white flex items-center">
                      <Shield className="mr-2" size={16} />
                      隐私保护
                    </span>
                  }
                  className="bg-gray-900 border-gray-700"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="text-white block">本地存储</Text>
                        <Text className="text-gray-400 text-sm">所有数据仅存储在本地设备</Text>
                      </div>
                      <CheckCircle className="text-green-400" size={20} />
                    </div>
                    
                    <Divider className="border-gray-700" />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="text-white block">数据加密</Text>
                        <Text className="text-gray-400 text-sm">敏感数据使用AES加密存储</Text>
                      </div>
                      <CheckCircle className="text-green-400" size={20} />
                    </div>
                    
                    <Divider className="border-gray-700" />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="text-white block">匿名使用统计</Text>
                        <Text className="text-gray-400 text-sm">帮助改进产品体验</Text>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <div className="mt-6">
              <Alert
                message="隐私承诺"
                description="我们承诺不会收集、存储或传输您的任何个人数据。所有AI对话和设置信息都安全地存储在您的本地设备上。"
                type="success"
                showIcon
                icon={<CheckCircle size={16} />}
                className="bg-green-900/20 border-green-700"
              />
            </div>
          </div>
        )
      case 'about':
        return (
          <div className="p-6">
            <div className="text-center mb-8">
              <Avatar 
                size={80} 
                className="bg-blue-600 mb-4"
                icon={<Bot size={40} />}
              />
              <Title level={2} className="!text-white !mb-2">Koala Desktop</Title>
              <Tag color="blue" className="mb-4">v1.0.0</Tag>
              <Paragraph className="text-gray-400 max-w-md mx-auto">
                基于 Electron + React + TypeScript 构建的现代化桌面AI助手应用
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card 
                  className="bg-gray-900 border-gray-700 text-center"
                  bodyStyle={{ padding: '24px' }}
                >
                  <TrendingUp className="text-blue-400 mx-auto mb-3" size={32} />
                  <Statistic
                    title={<span className="text-gray-400">支持的模型</span>}
                    value={stats.totalProviders}
                    suffix="个提供商"
                    valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                  />
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card 
                  className="bg-gray-900 border-gray-700 text-center"
                  bodyStyle={{ padding: '24px' }}
                >
                  <Zap className="text-green-400 mx-auto mb-3" size={32} />
                  <Statistic
                    title={<span className="text-gray-400">活跃模型</span>}
                    value={stats.enabledModels}
                    suffix="个"
                    valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                  />
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card 
                  className="bg-gray-900 border-gray-700 text-center"
                  bodyStyle={{ padding: '24px' }}
                >
                  <Heart className="text-red-400 mx-auto mb-3" size={32} />
                  <div className="text-red-400 text-xl font-semibold mb-1">开源</div>
                  <Text className="text-gray-400">MIT 许可证</Text>
                </Card>
              </Col>
            </Row>

            <Divider className="border-gray-700 my-8" />

            <Descriptions 
              title={<span className="text-white">技术信息</span>}
              bordered
              column={1}
              size="small"
              className="bg-gray-900"
            >
              <Descriptions.Item 
                label={<span className="text-gray-400">框架</span>}
                labelStyle={{ color: '#9ca3af' }}
                contentStyle={{ color: '#ffffff' }}
              >
                Electron 28.0.0
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="text-gray-400">前端</span>}
                labelStyle={{ color: '#9ca3af' }}
                contentStyle={{ color: '#ffffff' }}
              >
                React 18 + TypeScript
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="text-gray-400">UI库</span>}
                labelStyle={{ color: '#9ca3af' }}
                contentStyle={{ color: '#ffffff' }}
              >
                Ant Design + Tailwind CSS
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="text-gray-400">构建工具</span>}
                labelStyle={{ color: '#9ca3af' }}
                contentStyle={{ color: '#ffffff' }}
              >
                Vite + Electron Builder
              </Descriptions.Item>
            </Descriptions>

            <div className="text-center mt-8">
              <Space size="large">
                <Button type="primary" icon={<Star size={16} />} ghost>
                  GitHub 仓库
                </Button>
                <Button icon={<Globe size={16} />} ghost>
                  官方网站
                </Button>
                <Button icon={<Info size={16} />} ghost>
                  使用文档
                </Button>
              </Space>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Layout className="h-full bg-black setting-layout">
      <Sider
        width={260}
        className="bg-gray-900 border-r border-gray-800"
      >
        <div className="p-4">
          <div className="mb-6 text-center">
            <Avatar 
              size={48} 
              className="bg-blue-600 mb-3"
              icon={<SettingsIcon size={24} />}
            />
            <Title level={4} className="!text-white !mb-1">设置中心</Title>
            <Text className="text-gray-400 text-sm">个性化您的体验</Text>
          </div>
          
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => setSelectedKey(key)}
            className="bg-transparent border-none"
            items={menuItems}
            theme="dark"
          />
        </div>
      </Sider>

      <Content style={{
        overflow: 'hidden'
      }} className="bg-black overflow-auto">
        {renderContent()}
      </Content>
    </Layout>
  )
}

export default Settings 