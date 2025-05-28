import React, { useState, useEffect, useCallback, useRef } from 'react'
import { User, LogOut, Edit, Settings } from 'lucide-react'
import { Button, Dropdown, Modal, Input, message, Avatar, Card } from 'antd'
import { Tooltip } from '@lobehub/ui'
import { getThemeColors } from '@/theme'
import { providerDB } from '@/utils/providerDB'
import { Provider, Model } from '@/types/model'
import { useModelStore } from '@/stores/modelStore'

interface UserInfo {
  username: string
  avatar: string
  email?: string
}

interface UserAvatarProps {
  isDarkTheme: boolean
  onAddLoginTab?: () => void
}

const UserAvatar: React.FC<UserAvatarProps> = ({ isDarkTheme, onAddLoginTab }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    username: 'KoalaAI',
    avatar: '🐨'
  })
  const [token, setToken] = useState<string | null>(null)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isUserPanelVisible, setIsUserPanelVisible] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', avatar: '' })
  const [isLoading, setIsLoading] = useState(false)

  // 用于防止重复处理同一个 token
  const processedTokenRef = useRef<string | null>(null)

  const themeColors = getThemeColors(isDarkTheme)
  const { refreshProviders } = useModelStore()

  // 登录处理函数 - 使用 useCallback 来稳定引用
  const handleLogin = useCallback(async (loginToken: string) => {
    // 防止重复处理同一个 token
    if (processedTokenRef.current === loginToken) {
      console.log('Token 已处理过，跳过重复处理')
      return
    }

    // 防止在已登录状态下重复处理
    if (isLoggedIn) {
      console.log('用户已登录，跳过重复处理')
      return
    }

    processedTokenRef.current = loginToken
    setIsLoading(true)

    try {
      // 添加 TokenAI 提供商
      await addTokenAIProvider(loginToken)

      // 设置用户信息
      const defaultUserInfo: UserInfo = {
        username: '用户',
        avatar: '😄'
      }

      setToken(loginToken)
      setUserInfo(defaultUserInfo)
      setIsLoggedIn(true)

      // 保存到本地存储
      localStorage.setItem('user-token', loginToken)
      localStorage.setItem('user-info', JSON.stringify(defaultUserInfo))

      // 刷新模型列表
      refreshProviders()

      message.success('登录成功！TokenAI 提供商已添加')
    } catch (error) {
      console.error('Login failed:', error)
      message.error('登录失败，请重试')
      // 重置处理状态，允许重试
      processedTokenRef.current = null
    } finally {
      setIsLoading(false)
    }
  }, [isLoggedIn, refreshProviders])

  // 退出登录
  const handleLogout = useCallback(async () => {
    setIsLoading(true)
    try {
      // 移除 TokenAI 提供商
      await removeTokenAIProvider()

      // 清除状态
      setIsLoggedIn(false)
      setUserInfo({
        username: 'KoalaAI',
        avatar: '🐨'
      })
      setToken(null)

      // 重置处理状态
      processedTokenRef.current = null

      // 清除本地存储
      localStorage.removeItem('user-token')
      localStorage.removeItem('user-info')

      // 刷新模型列表
      refreshProviders()

      message.success('已退出登录，TokenAI 提供商已移除')
      setIsUserPanelVisible(false)
    } catch (error) {
      console.error('Logout failed:', error)
      message.error('退出登录失败')
    } finally {
      setIsLoading(false)
    }
  }, [refreshProviders])

  // 打开登录标签页
  const handleLoginRedirect = () => {
    try {
      if (onAddLoginTab) {
        onAddLoginTab()
        setIsUserPanelVisible(false)
        message.info('已打开登录标签页')
      } else {
        message.error('无法打开登录标签页')
      }
    } catch (error) {
      console.error('Failed to open login tab:', error)
      message.error('无法打开登录标签页')
    }
  }

  // 更新用户信息
  const handleUpdateUserInfo = () => {
    const updatedUserInfo = { ...userInfo, ...editForm }
    setUserInfo(updatedUserInfo)
    localStorage.setItem('user-info', JSON.stringify(updatedUserInfo))
    setIsEditModalVisible(false)
    message.success('用户信息已更新')
  }

  // 添加 TokenAI 提供商
  const addTokenAIProvider = useCallback(async (authToken: string) => {
    try {
      // 获取模型列表
      const response = await fetch('https://api.token-ai.cn/v1/models', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }

      const modelsData = await response.json()
      const models: Model[] = modelsData.data.map((model: any) => ({
        id: model.id,
        displayName: model.id,
        description: `${model.owned_by} ${model.type} 模型`,
        enabled: true,
        provider: 'openai',
        type: model.type,
        contextWindowTokens: 100000,
        maxOutput: 4096,
        abilities: {
          functionCall: model.type === 'chat',
          vision: model.id.includes('vision') || model.id.includes('gpt-4')
        }
      }))

      // 创建 TokenAI 提供商
      const tokenAIProvider: Provider = {
        id: 'openai',
        name: 'TokenAI',
        displayName: 'TokenAI',
        description: 'TokenAI API 提供商',
        apiUrl: 'https://api.token-ai.cn/v1',
        apiKey: authToken,
        enabled: true,
        models: models,
        icon: 'OpenAI',
        website: 'https://api.token-ai.cn'
      }

      // 保存到数据库
      await providerDB.saveProvider(tokenAIProvider)

    } catch (error) {
      console.error('Failed to add TokenAI provider:', error)
      throw error
    }
  }, [])

  // 移除 TokenAI 提供商
  const removeTokenAIProvider = useCallback(async () => {
    try {
      await providerDB.deleteProviderByName('TokenAI')
    } catch (error) {
      console.error('Failed to remove TokenAI provider:', error)
      // 不抛出错误，因为提供商可能不存在
    }
  }, [])

  // 用户信息面板内容
  const userPanelContent = (
    <Card
      style={{
        width: 280,
        background: isDarkTheme ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${themeColors.border.base}`,
        borderRadius: '12px',
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '48px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            margin: '0 auto',
          }}
        >
          {userInfo.avatar}
        </div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: themeColors.text.primary,
            marginBottom: '4px',
          }}
        >
          {userInfo.username}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: themeColors.text.tertiary,
          }}
        >
          {isLoggedIn ? 'TokenAI 用户' : '未登录用户'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isLoggedIn ? (
          <>
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => {
                setEditForm({ username: userInfo.username, avatar: userInfo.avatar })
                setIsEditModalVisible(true)
                setIsUserPanelVisible(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                color: themeColors.text.secondary,
              }}
            >
              编辑个人信息
            </Button>
            <Button
              type="text"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
              loading={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                color: themeColors.text.secondary,
              }}
            >
              退出登录
            </Button>
          </>
        ) : (
          <Button
            type="primary"
            icon={<User size={16} />}
            onClick={handleLoginRedirect}
            loading={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            登录 TokenAI
          </Button>
        )}
      </div>
    </Card>
  )

  // 初始化时检查登录状态
  useEffect(() => {
    const savedToken = localStorage.getItem('user-token')
    const savedUserInfo = localStorage.getItem('user-info')

    if (savedToken && savedUserInfo) {
      setToken(savedToken)
      setUserInfo(JSON.parse(savedUserInfo))
      setIsLoggedIn(true)
      processedTokenRef.current = savedToken // 标记已处理的 token
    }

    // 监听来自登录页面的消息
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'LOGIN_SUCCESS' && event.data.token) {
        console.log('UserAvatar 收到登录成功消息:', event.data.token)
        handleLogin(event.data.token)
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [handleLogin]) // 现在 handleLogin 是稳定的引用

  return (
    <>
      <div className="user-avatar-container">
        <Tooltip title={isLoggedIn ? '用户信息' : '点击查看用户信息'}>
          <Dropdown
            dropdownRender={() => userPanelContent}
            placement="bottomRight"
            trigger={['click']}
            open={isUserPanelVisible}
            onOpenChange={setIsUserPanelVisible}
          >
            <Button
              type="text"
              loading={isLoading}
              className="user-avatar-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                padding: 0,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '16px' }}>{userInfo.avatar}</span>
            </Button>
          </Dropdown>
        </Tooltip>
      </div>

      {/* 编辑用户信息弹窗 */}
      <Modal
        title="编辑用户信息"
        open={isEditModalVisible}
        onOk={handleUpdateUserInfo}
        onCancel={() => setIsEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: themeColors.text.primary }}>
            用户名
          </label>
          <Input
            value={editForm.username}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            placeholder="请输入用户名"
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: themeColors.text.primary }}>
            头像 (Emoji)
          </label>
          <Input
            value={editForm.avatar}
            onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
            placeholder="请输入头像 Emoji，如：😄"
            maxLength={2}
          />
        </div>
      </Modal>
    </>
  )
}

export default UserAvatar 