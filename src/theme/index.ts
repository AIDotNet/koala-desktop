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

// 定义通用颜色变量供组件使用
export const colors = {
  dark: {
    // 主要色调
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    
    // 背景
    bg: {
      base: '#0a0a0f',
      container: '#1e1e2e',
      elevated: '#2a2a3a',
      spotlight: '#2d2d44',
    },
    
    // 文本
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e8',
      tertiary: '#b0b0c0',
      quaternary: '#808090',
      disabled: '#606070',
    },
    
    // 边框
    border: {
      base: '#3a3a4a',
      light: '#4a4a5a',
    },
  },
  light: {
    // 主要色调
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    
    // 背景
    bg: {
      base: '#f5f5f5',
      container: '#ffffff',
      elevated: '#ffffff',
      spotlight: '#f8f9fa',
    },
    
    // 文本
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      quaternary: '#d1d5db',
      disabled: '#e5e7eb',
    },
    
    // 边框
    border: {
      base: '#d1d5db',
      light: '#e5e7eb',
    },
  },
};

// 获取当前主题下的颜色值
export const getThemeColors = (isDark: boolean) => {
  return isDark ? colors.dark : colors.light;
};

// CSS-in-JS 样式工具函数
export const createStyles = (isDark: boolean) => {
  const theme = getThemeColors(isDark);
  
  return {
    // 应用容器样式
    appContainer: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: isDark ? theme.bg.base : theme.bg.base,
      color: theme.text.primary,
      transition: 'all 0.3s ease',
    },
    
    // 标题栏样式
    titleBar: {
      height: '32px',
      borderBottom: `1px solid ${theme.border.base}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      WebkitAppRegion: 'drag',
      userSelect: 'none',
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
      background: theme.bg.container,
      borderRight: `1px solid ${theme.border.base}`,
      display: 'flex',
      flexDirection: 'column',
    },
    
    // 聊天区域样式
    chatArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: theme.bg.base,
    },
    
    // 消息容器样式
    messageContainer: {
      flex: 1,
      padding: '24px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    
    // 用户消息样式
    userMessage: {
      alignSelf: 'flex-end',
      maxWidth: '70%',
      background: theme.primary,
      color: '#ffffff',
      padding: '12px 16px',
      borderRadius: '18px 18px 4px 18px',
      wordBreak: 'break-word',
      boxShadow: isDark 
        ? '0 2px 8px rgba(99, 102, 241, 0.3)' 
        : '0 2px 8px rgba(99, 102, 241, 0.2)',
    },
    
    // AI消息样式
    aiMessage: {
      alignSelf: 'flex-start',
      maxWidth: '70%',
      background: theme.bg.elevated,
      color: theme.text.primary,
      padding: '12px 16px',
      borderRadius: '18px 18px 18px 4px',
      wordBreak: 'break-word',
      border: `1px solid ${theme.border.base}`,
      boxShadow: isDark 
        ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
        : '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    
    // 输入区域样式
    inputArea: {
      padding: '16px 24px',
      background: theme.bg.container,
      borderTop: `1px solid ${theme.border.base}`,
    },
    
    // 滚动条样式
    scrollbar: {
      '&::-webkit-scrollbar': {
        width: '6px',
        height: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderRadius: '3px',
        '&:hover': {
          background: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        },
      },
    },
    
    // 输入框获取焦点时的边框样式
    focusedInputContainer: {
      background: isDark ? 'rgba(30, 30, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: `1px solid ${theme.primary}`,
      padding: '16px',
      boxShadow: `0 0 0 2px ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
      transition: 'all 0.3s ease',
    },
  };
}; 