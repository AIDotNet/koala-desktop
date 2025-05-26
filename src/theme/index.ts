import { ThemeConfig, theme } from 'antd';

// 深色主题配色
export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    // 主色调
    colorPrimary: '#6366f1',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#06b6d4',
    
    // 背景色
    colorBgContainer: '#1e1e2e',
    colorBgElevated: '#2a2a3a',
    colorBgLayout: '#0a0a0f',
    colorBgBase: '#1a1a24',
    colorBgSpotlight: '#2d2d44',
    
    // 边框
    colorBorder: '#3a3a4a',
    colorBorderSecondary: '#4a4a5a',
    
    // 文字
    colorText: '#ffffff',
    colorTextSecondary: '#e0e0e8',
    colorTextTertiary: '#b0b0c0',
    colorTextQuaternary: '#808090',
    colorTextDisabled: '#606070',
    
    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    
    // 阴影
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    boxShadowSecondary: '0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
  },
  components: {
    Layout: {
      bodyBg: '#0a0a0f',
      siderBg: '#1a1a24',
      headerBg: '#1e1e2e',
      headerHeight: 64,
      headerPadding: '0 24px',
      triggerBg: '#2a2a3a',
      triggerColor: '#ffffff',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#6366f1',
      itemHoverBg: '#2d2d44',
      itemActiveBg: '#6366f1',
      itemColor: '#e0e0e8',
      itemSelectedColor: '#ffffff',
      itemHoverColor: '#ffffff',
      subMenuItemBg: 'transparent',
      groupTitleColor: '#b0b0c0',
    },
    Button: {
      primaryColor: '#ffffff',
      colorPrimaryHover: '#8b5cf6',
      colorPrimaryActive: '#5b21b6',
      defaultBg: '#2a2a3a',
      defaultBorderColor: '#3a3a4a',
      defaultColor: '#e0e0e8',
      ghostBg: 'transparent',
      linkHoverBg: 'transparent',
    },
         Input: {
       colorBgContainer: '#2a2a3a',
       colorBorder: '#3a3a4a',
       colorText: '#ffffff',
       colorTextPlaceholder: '#808090',
       colorBgContainerDisabled: '#1a1a24',
     },
    Card: {
      colorBgContainer: '#1e1e2e',
      colorBorderSecondary: '#3a3a4a',
      headerBg: '#2a2a3a',
      actionsBg: '#1a1a24',
    },
    Modal: {
      contentBg: '#1e1e2e',
      headerBg: '#2a2a3a',
      footerBg: '#1a1a24',
      titleColor: '#ffffff',
    },
    Drawer: {
      colorBgElevated: '#1e1e2e',
      colorBgMask: 'rgba(0, 0, 0, 0.6)',
    },
    Table: {
      colorBgContainer: '#1e1e2e',
      headerBg: '#2a2a3a',
      headerColor: '#ffffff',
      rowHoverBg: '#2d2d44',
      borderColor: '#3a3a4a',
    },
    Tabs: {
      cardBg: '#1e1e2e',
      itemColor: '#b0b0c0',
      itemSelectedColor: '#6366f1',
      itemHoverColor: '#ffffff',
      inkBarColor: '#6366f1',
      cardHeight: 40,
    },
    Select: {
      colorBgContainer: '#2a2a3a',
      colorBgElevated: '#1e1e2e',
      optionSelectedBg: '#6366f1',
      optionActiveBg: '#2d2d44',
    },
    Tooltip: {
      colorBgSpotlight: '#2a2a3a',
      colorTextLightSolid: '#ffffff',
    },
    Notification: {
      colorBgElevated: '#1e1e2e',
      colorText: '#ffffff',
      colorIcon: '#6366f1',
    },
    Message: {
      contentBg: '#1e1e2e',
      colorText: '#ffffff',
    },
  },
};

// 亮色主题配色
export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // 主色调
    colorPrimary: '#6366f1',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#06b6d4',
    
    // 背景色
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgBase: '#ffffff',
    colorBgSpotlight: '#f8f9fa',
    
    // 边框
    colorBorder: '#d1d5db',
    colorBorderSecondary: '#e5e7eb',
    
    // 文字
    colorText: '#1f2937',
    colorTextSecondary: '#6b7280',
    colorTextTertiary: '#9ca3af',
    colorTextQuaternary: '#d1d5db',
    colorTextDisabled: '#e5e7eb',
    
    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    
    // 阴影
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
  },
  components: {
    Layout: {
      bodyBg: '#f5f5f5',
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 24px',
      triggerBg: '#f8f9fa',
      triggerColor: '#1f2937',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#6366f1',
      itemHoverBg: '#f3f4f6',
      itemActiveBg: '#6366f1',
      itemColor: '#6b7280',
      itemSelectedColor: '#ffffff',
      itemHoverColor: '#1f2937',
      subMenuItemBg: 'transparent',
      groupTitleColor: '#9ca3af',
    },
    Button: {
      primaryColor: '#ffffff',
      colorPrimaryHover: '#8b5cf6',
      colorPrimaryActive: '#5b21b6',
      defaultBg: '#ffffff',
      defaultBorderColor: '#d1d5db',
      defaultColor: '#6b7280',
      ghostBg: 'transparent',
      linkHoverBg: 'transparent',
    },
         Input: {
       colorBgContainer: '#ffffff',
       colorBorder: '#d1d5db',
       colorText: '#1f2937',
       colorTextPlaceholder: '#9ca3af',
       colorBgContainerDisabled: '#f9fafb',
     },
    Card: {
      colorBgContainer: '#ffffff',
      colorBorderSecondary: '#e5e7eb',
      headerBg: '#f8f9fa',
      actionsBg: '#f9fafb',
    },
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#f8f9fa',
      footerBg: '#f9fafb',
      titleColor: '#1f2937',
    },
    Drawer: {
      colorBgElevated: '#ffffff',
      colorBgMask: 'rgba(0, 0, 0, 0.4)',
    },
    Table: {
      colorBgContainer: '#ffffff',
      headerBg: '#f8f9fa',
      headerColor: '#1f2937',
      rowHoverBg: '#f3f4f6',
      borderColor: '#e5e7eb',
    },
    Tabs: {
      cardBg: '#ffffff',
      itemColor: '#6b7280',
      itemSelectedColor: '#6366f1',
      itemHoverColor: '#1f2937',
      inkBarColor: '#6366f1',
      cardHeight: 40,
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      optionSelectedBg: '#6366f1',
      optionActiveBg: '#f3f4f6',
    },
    Tooltip: {
      colorBgSpotlight: '#1f2937',
      colorTextLightSolid: '#ffffff',
    },
    Notification: {
      colorBgElevated: '#ffffff',
      colorText: '#1f2937',
      colorIcon: '#6366f1',
    },
    Message: {
      contentBg: '#ffffff',
      colorText: '#1f2937',
    },
  },
};

// CSS-in-JS 样式工具函数
export const createStyles = (isDark: boolean) => ({
  // 应用容器样式
  appContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: isDark 
      ? 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%)' 
      : 'linear-gradient(135deg, #f0f2f5 0%, #ffffff 100%)',
    color: isDark ? '#ffffff' : '#1f2937',
    transition: 'all 0.3s ease',
  },
  
  // 标题栏样式
  titleBar: {
    height: '32px',
    background: isDark ? '#1e1e2e' : '#ffffff',
    borderBottom: `1px solid ${isDark ? '#3a3a4a' : '#e5e7eb'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    WebkitAppRegion: 'drag' as any,
    userSelect: 'none' as const,
  },
  
  // 主内容区域样式
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  
  // 侧边栏样式
  sidebar: {
    width: '280px',
    background: isDark ? '#1a1a24' : '#ffffff',
    borderRight: `1px solid ${isDark ? '#3a3a4a' : '#e5e7eb'}`,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  
  // 聊天区域样式
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    background: isDark ? '#0a0a0f' : '#f9fafb',
  },
  
  // 消息容器样式
  messageContainer: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  
  // 用户消息样式
  userMessage: {
    alignSelf: 'flex-end',
    maxWidth: '70%',
    background: '#6366f1',
    color: '#ffffff',
    padding: '12px 16px',
    borderRadius: '18px 18px 4px 18px',
    wordBreak: 'break-word' as const,
    boxShadow: isDark 
      ? '0 2px 8px rgba(99, 102, 241, 0.3)' 
      : '0 2px 8px rgba(99, 102, 241, 0.2)',
  },
  
  // AI消息样式
  aiMessage: {
    alignSelf: 'flex-start',
    maxWidth: '70%',
    background: isDark ? '#2a2a3a' : '#ffffff',
    color: isDark ? '#ffffff' : '#1f2937',
    padding: '12px 16px',
    borderRadius: '18px 18px 18px 4px',
    wordBreak: 'break-word' as const,
    border: `1px solid ${isDark ? '#3a3a4a' : '#e5e7eb'}`,
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  
  // 输入区域样式
  inputArea: {
    padding: '16px 24px',
    background: isDark ? '#1e1e2e' : '#ffffff',
    borderTop: `1px solid ${isDark ? '#3a3a4a' : '#e5e7eb'}`,
  },
  
  // 按钮样式
  primaryButton: {
    background: '#6366f1',
    borderColor: '#6366f1',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#8b5cf6',
      borderColor: '#8b5cf6',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  
  // 次要按钮样式
  secondaryButton: {
    background: isDark ? '#2a2a3a' : '#ffffff',
    borderColor: isDark ? '#3a3a4a' : '#d1d5db',
    color: isDark ? '#e0e0e8' : '#6b7280',
    borderRadius: '8px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    '&:hover': {
      background: isDark ? '#2d2d44' : '#f3f4f6',
      borderColor: isDark ? '#4a4a5a' : '#9ca3af',
      color: isDark ? '#ffffff' : '#1f2937',
    },
  },
  
  // 卡片样式
  card: {
    background: isDark ? '#1e1e2e' : '#ffffff',
    border: `1px solid ${isDark ? '#3a3a4a' : '#e5e7eb'}`,
    borderRadius: '12px',
    padding: '20px',
    boxShadow: isDark 
      ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
      : '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: isDark 
        ? '0 8px 25px rgba(0, 0, 0, 0.4)' 
        : '0 8px 25px rgba(0, 0, 0, 0.15)',
    },
  },
  
  // 玻璃态效果样式
  glassEffect: {
    background: isDark 
      ? 'rgba(255, 255, 255, 0.03)' 
      : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)'}`,
    borderRadius: '12px',
  },
  
  // 滚动条样式
  scrollbar: {
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
    },
  },
}); 