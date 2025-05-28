import React, { useEffect } from 'react'
import { Spin, Result } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { getThemeColors } from '@/theme'

interface LoginCallbackProps {
  isDarkTheme: boolean
}

const LoginCallback: React.FC<LoginCallbackProps> = ({ isDarkTheme }) => {
  const themeColors = getThemeColors(isDarkTheme)
  let isLogin = false;
  useEffect(() => {
    // 从 URL 参数中获取 token
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    if (token && isLogin === false) {
      setTimeout(() => {
        window.parent.postMessage({
          type: 'CLOSE_LOGIN_TAB'
        }, window.location.origin)
      }, 2000);
      isLogin = true;
    } else {
      console.error('登录回调中未找到 token')
    }
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkTheme ? 'rgb(10, 10, 15)' : 'rgb(245, 245, 245)',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          background: isDarkTheme ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${themeColors.border.base}`,
          borderRadius: '12px',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <Result
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="登录成功"
          subTitle="正在处理登录信息，请稍候..."
          extra={<Spin size="large" />}
        />
      </div>
    </div>
  )
}

export default LoginCallback 