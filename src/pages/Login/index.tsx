import React, { useEffect, useRef } from 'react'
import { Spin, message } from 'antd'
import { getThemeColors } from '@/theme'

interface LoginPageProps {
  isDarkTheme: boolean
}

const LoginPage: React.FC<LoginPageProps> = ({ isDarkTheme }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // 检查URL参数中是否有登录信息
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const loginSuccess = urlParams.get('login_success')
      const token = urlParams.get('token')
      
      if (loginSuccess === 'true' && token) {
        console.log('从URL参数中检测到登录成功')
        
        // 处理登录成功
        setTimeout(() => {
          window.parent.postMessage({
            type: 'CLOSE_LOGIN_TAB'
          }, window.location.origin)
        }, 1500)
        
        // 清除URL参数
        window.history.replaceState({}, document.title, window.location.pathname)
        return true
      }
      return false
    }
    
    // 先检查URL参数
    const hasLoginInfo = checkUrlParams()
    if (hasLoginInfo) return
    
    // 监听来自 iframe 的消息
    const handleMessage = (event: MessageEvent) => {
      // 放宽对消息来源的检查，允许任何来源
      // if (event.origin !== 'https://api.token-ai.cn' && event.origin !== window.location.origin) return
      
      console.log('收到消息:', event.origin, event.data)
      
      if (event.data.type === 'LOGIN_SUCCESS' && event.data.token) {
        console.log('收到登录成功消息:', event.data.token)
        
        setTimeout(() => {
          window.parent.postMessage({
            type: 'CLOSE_LOGIN_TAB'
          }, window.location.origin)
        }, 1500)
      }
      
      // 处理登录错误消息
      if (event.data.type === 'LOGIN_ERROR') {
        console.error('登录错误:', event.data.error)
        message.error(`登录失败: ${event.data.error}`)
      }
    }

    window.addEventListener('message', handleMessage)

    // 定期检查URL参数，以防重定向后参数变化
    const urlCheckInterval = setInterval(checkUrlParams, 1000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(urlCheckInterval)
    }
  }, [])

  // 构建登录 URL - 使用一个简单的成功页面作为回调
  const successPageUrl = `${window.location.origin}/login-success.html`
  const currentUrl = encodeURIComponent(successPageUrl)
  const loginUrl = `https://api.token-ai.cn/login?redirect_uri=${currentUrl}`

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: isDarkTheme ? 'rgb(10, 10, 15)' : 'rgb(245, 245, 245)',
        overflow: 'hidden',
      }}
    >
      <iframe
        ref={iframeRef}
        src={loginUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="TokenAI 登录"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
      />
      
      {/* 加载指示器 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDarkTheme ? 'rgba(30, 30, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
        className="loading-overlay"
      >
        <Spin size="large" />
      </div>
    </div>
  )
}

export default LoginPage 