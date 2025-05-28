import React, { useState, useEffect } from 'react'
import { Card, Button, Descriptions, Tag, Space, Typography, Divider, message, Spin } from 'antd'
import { 
  InfoCircleOutlined, 
  DesktopOutlined, 
  CloudDownloadOutlined,
  GithubOutlined,
  HomeOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { dataManager, type AppConfig, type ReleaseInfo } from '@/services/dataManager'

const { Title, Text, Paragraph } = Typography

interface UpdateStatus {
  checking: boolean
  hasUpdate: boolean
  currentVersion: string
  latestVersion?: string
  releaseInfo?: ReleaseInfo
  error?: string
}

const About: React.FC = () => {
  const [appInfo, setAppInfo] = useState<ReturnType<typeof dataManager.getAppInfo>>()
  const [systemInfo, setSystemInfo] = useState<ReturnType<typeof dataManager.getSystemInfo>>()
  const [config, setConfig] = useState<AppConfig>()
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    checking: false,
    hasUpdate: false,
    currentVersion: '2.2.0'
  })

  // 加载应用信息
  const loadAppInfo = async () => {
    try {
      const appData = dataManager.getAppInfo()
      const sysData = dataManager.getSystemInfo()
      const configData = await dataManager.initConfig()
      
      setAppInfo(appData)
      setSystemInfo(sysData)
      setConfig(configData)
      setUpdateStatus(prev => ({ ...prev, currentVersion: configData.version }))
    } catch (error) {
      console.error('加载应用信息失败:', error)
      message.error('加载应用信息失败')
    }
  }

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

  // 打开链接
  const openLink = (url: string) => {
    window.open(url, '_blank')
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

  useEffect(() => {
    loadAppInfo()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <Title level={2} className="mb-2">
          <InfoCircleOutlined className="mr-2" />
          关于 {appInfo?.name}
        </Title>
        <Text type="secondary">{appInfo?.description}</Text>
      </div>

      {/* 应用信息 */}
      <Card 
        title={
          <Space>
            <HomeOutlined />
            应用信息
          </Space>
        }
        className="shadow-sm"
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="应用名称">{appInfo?.name}</Descriptions.Item>
          <Descriptions.Item label="当前版本">
            <Tag color="blue">v{appInfo?.version}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="作者">{appInfo?.author}</Descriptions.Item>
          <Descriptions.Item label="许可证">MIT</Descriptions.Item>
          <Descriptions.Item label="仓库地址" span={2}>
            <Button 
              type="link" 
              icon={<GithubOutlined />}
              onClick={() => appInfo?.repository && openLink(appInfo.repository)}
              className="p-0"
            >
              {appInfo?.repository}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="主页" span={2}>
            <Button 
              type="link" 
              onClick={() => appInfo?.homepage && openLink(appInfo.homepage)}
              className="p-0"
            >
              {appInfo?.homepage}
            </Button>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 系统信息 */}
      <Card 
        title={
          <Space>
            <DesktopOutlined />
            系统信息
          </Space>
        }
        className="shadow-sm"
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="操作系统">{systemInfo?.platform}</Descriptions.Item>
          <Descriptions.Item label="架构">{systemInfo?.arch}</Descriptions.Item>
          <Descriptions.Item label="Node.js 版本">{systemInfo?.nodeVersion}</Descriptions.Item>
          <Descriptions.Item label="Electron 版本">{systemInfo?.electronVersion}</Descriptions.Item>
          <Descriptions.Item label="Chrome 版本" span={2}>{systemInfo?.chromeVersion}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 版本更新 */}
      <Card 
        title={
          <Space>
            <CloudDownloadOutlined />
            版本更新
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            loading={updateStatus.checking}
            onClick={checkForUpdates}
          >
            检查更新
          </Button>
        }
        className="shadow-sm"
      >
        <Space direction="vertical" className="w-full">
          <div className="flex justify-between items-center">
            <Text>当前版本:</Text>
            <Tag color="blue">v{updateStatus.currentVersion}</Tag>
          </div>
          
          {updateStatus.latestVersion && (
            <div className="flex justify-between items-center">
              <Text>最新版本:</Text>
              <Tag color={updateStatus.hasUpdate ? "green" : "blue"}>
                v{updateStatus.latestVersion}
              </Tag>
            </div>
          )}

          {updateStatus.hasUpdate && updateStatus.releaseInfo && (
            <>
              <Divider />
              <div>
                <Title level={5}>更新内容:</Title>
                <Paragraph>
                  <Text strong>{updateStatus.releaseInfo.name}</Text>
                </Paragraph>
                <Paragraph className="whitespace-pre-wrap text-sm">
                  {updateStatus.releaseInfo.body}
                </Paragraph>
                <Text type="secondary">
                  发布时间: {formatDate(updateStatus.releaseInfo.published_at)}
                </Text>
              </div>
              
              {updateStatus.releaseInfo.assets.length > 0 && (
                <div>
                  <Title level={5}>下载文件:</Title>
                  <Space direction="vertical" className="w-full">
                    {updateStatus.releaseInfo.assets.map((asset, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <Text strong>{asset.name}</Text>
                          <br />
                          <Text type="secondary" className="text-xs">
                            {formatFileSize(asset.size)}
                          </Text>
                        </div>
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => openLink(asset.download_url)}
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
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <Text type="danger">{updateStatus.error}</Text>
            </div>
          )}

          {!updateStatus.hasUpdate && !updateStatus.error && updateStatus.latestVersion && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <Text type="success">当前已是最新版本</Text>
            </div>
          )}
        </Space>
      </Card>

      {/* 配置信息 */}
      {config && (
        <Card 
          title="应用配置"
          className="shadow-sm"
        >
          <Descriptions column={2} bordered>
            <Descriptions.Item label="自动更新">
              <Tag color={config.autoUpdate ? "green" : "red"}>
                {config.autoUpdate ? "已启用" : "已禁用"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="检查间隔">{config.checkUpdateInterval} 分钟</Descriptions.Item>
            <Descriptions.Item label="语言">{config.language}</Descriptions.Item>
            <Descriptions.Item label="主题">{config.theme}</Descriptions.Item>
            <Descriptions.Item label="窗口大小">
              {config.windowSettings.width} × {config.windowSettings.height}
            </Descriptions.Item>
            <Descriptions.Item label="可调整大小">
              <Tag color={config.windowSettings.resizable ? "green" : "red"}>
                {config.windowSettings.resizable ? "是" : "否"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  )
}

export default About 