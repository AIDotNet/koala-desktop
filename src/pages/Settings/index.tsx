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
  CheckCircle
} from 'lucide-react'
import ProviderManager from '@/components/ProviderManager'
import { Provider, Model } from '@/types/model'
import { providerDB } from '@/utils/providerDB'
import { getIcon } from '@/utils/iconutils'
import { OpenAI } from '@lobehub/icons'
import { createStyles } from '@/theme'

const { Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography

interface SettingsProps {
  isDarkTheme: boolean
  onNavigate?: (url: string) => void
}

const Settings: React.FC<SettingsProps> = ({ isDarkTheme, onNavigate }) => {
  const [selectedKey, setSelectedKey] = useState<string>('models')
  const [providers, setProviders] = useState<Provider[]>([])

  const styles = createStyles(isDarkTheme);

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
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
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
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
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
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
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
              borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
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
      case 'appearance':
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
                <Palette style={{ marginRight: '12px' }} size={24} />
                外观设置
              </Title>
              <Text style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                自定义应用的外观和主题设置
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
                      <Palette style={{ marginRight: '8px' }} size={16} />
                      主题设置
                    </span>
                  }
                  style={{
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text style={{ 
                          color: isDarkTheme ? '#ffffff' : '#1f2937',
                          display: 'block'
                        }}>深色模式</Text>
                        <Text style={{ 
                          color: isDarkTheme ? '#9ca3af' : '#6b7280',
                          fontSize: '14px'
                        }}>使用深色主题界面</Text>
                      </div>
                      <Switch checked={isDarkTheme} />
                    </div>
                    
                    <Divider style={{ borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text style={{ 
                          color: isDarkTheme ? '#ffffff' : '#1f2937',
                          display: 'block'
                        }}>紧凑模式</Text>
                        <Text style={{ 
                          color: isDarkTheme ? '#9ca3af' : '#6b7280',
                          fontSize: '14px'
                        }}>减少界面元素间距</Text>
                      </div>
                      <Switch />
                    </div>
                    
                    <Divider style={{ borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text style={{ 
                          color: isDarkTheme ? '#ffffff' : '#1f2937',
                          display: 'block'
                        }}>动画效果</Text>
                        <Text style={{ 
                          color: isDarkTheme ? '#9ca3af' : '#6b7280',
                          fontSize: '14px'
                        }}>启用界面过渡动画</Text>
                      </div>
                      <Switch defaultChecked />
                    </div>
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
                      <Globe style={{ marginRight: '8px' }} size={16} />
                      语言设置
                    </span>
                  }
                  style={{
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <Text style={{ 
                        color: isDarkTheme ? '#ffffff' : '#1f2937',
                        display: 'block',
                        marginBottom: '8px'
                      }}>界面语言</Text>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '8px' 
                      }}>
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
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
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
                    
                    <Divider style={{ borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb' }} />
                    
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
                    
                    <Divider style={{ borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb' }} />
                    
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
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '32px' 
            }}>
              <Avatar 
                size={80} 
                style={{
                  background: '#3b82f6',
                  marginBottom: '16px'
                }}
                icon={<Bot size={40} />}
              />
              <Title 
                level={2} 
                style={{ 
                  color: isDarkTheme ? '#ffffff' : '#1f2937',
                  marginBottom: '8px'
                }}
              >Koala Desktop</Title>
              <Tag color="blue" style={{ marginBottom: '16px' }}>v1.0.0</Tag>
              <Paragraph style={{ 
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                maxWidth: '448px',
                margin: '0 auto'
              }}>
                基于 Electron + React + TypeScript 构建的现代化桌面AI助手应用
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card 
                  style={{
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
                    textAlign: 'center'
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <TrendingUp 
                    style={{ 
                      color: '#3b82f6',
                      margin: '0 auto 12px',
                      display: 'block'
                    }} 
                    size={32} 
                  />
                  <Statistic
                    title={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>支持的模型</span>}
                    value={stats.totalProviders}
                    suffix="个提供商"
                    valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                  />
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card 
                  style={{
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
                    textAlign: 'center'
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Zap 
                    style={{ 
                      color: '#10b981',
                      margin: '0 auto 12px',
                      display: 'block'
                    }} 
                    size={32} 
                  />
                  <Statistic
                    title={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>活跃模型</span>}
                    value={stats.enabledModels}
                    suffix="个"
                    valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                  />
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card 
                  style={{
                    background: isDarkTheme ? '#374151' : '#ffffff',
                    borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
                    textAlign: 'center'
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Heart 
                    style={{ 
                      color: '#ef4444',
                      margin: '0 auto 12px',
                      display: 'block'
                    }} 
                    size={32} 
                  />
                  <div style={{ 
                    color: '#ef4444',
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}>开源</div>
                  <Text style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>MIT 许可证</Text>
                </Card>
              </Col>
            </Row>

            <Divider style={{ 
              borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
              margin: '32px 0' 
            }} />

            <Descriptions 
              title={<span style={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}>技术信息</span>}
              bordered
              column={1}
              size="small"
              style={{
                background: isDarkTheme ? '#374151' : '#ffffff',
              }}
            >
              <Descriptions.Item 
                label={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>框架</span>}
                labelStyle={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                contentStyle={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}
              >
                Electron 28.0.0
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>前端</span>}
                labelStyle={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                contentStyle={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}
              >
                React 18 + TypeScript
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>UI库</span>}
                labelStyle={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                contentStyle={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}
              >
                Ant Design + CSS-in-JS
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>构建工具</span>}
                labelStyle={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                contentStyle={{ color: isDarkTheme ? '#ffffff' : '#1f2937' }}
              >
                Vite + Electron Builder
              </Descriptions.Item>
            </Descriptions>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
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
    <Layout style={{ 
      height: '100%', 
      background: isDarkTheme ? '#0a0a0f' : '#f5f5f5',
      overflow: 'hidden'
    }}>
      <Sider
        width={260}
        style={{
          background: isDarkTheme ? '#1a1a24' : '#ffffff',
          borderRight: `1px solid ${isDarkTheme ? '#3a3a4a' : '#e5e7eb'}`,
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
                background: '#6366f1',
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
              color: isDarkTheme ? '#808090' : '#6b7280',
              fontSize: '14px'
            }}>个性化您的体验</Text>
          </div>
          
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => setSelectedKey(key)}
            style={{
              background: 'transparent',
              border: 'none'
            }}
            items={menuItems}
            theme={isDarkTheme ? "dark" : "light"}
          />
        </div>
      </Sider>

      <Content style={{
        background: isDarkTheme ? '#0a0a0f' : '#f5f5f5',
      }}>
        {renderContent()}
      </Content>
    </Layout>
  )
}

export default Settings 