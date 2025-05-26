import React, { useState, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from 'antd'
import { createStyles } from '@/theme'

export interface Tab {
  id: string
  title: string
  url?: string
  isActive: boolean
  canClose?: boolean
}

interface TabBarProps {
  tabs: Tab[]
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onNewTab: () => void
  isDarkTheme: boolean
  maxTabWidth?: number
  minTabWidth?: number
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  onTabClick,
  onTabClose,
  onNewTab,
  isDarkTheme,
  maxTabWidth = 180,
  minTabWidth = 100
}) => {
  const [draggedTab, setDraggedTab] = useState<string | null>(null)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  const styles = createStyles(isDarkTheme);

  // 计算标签页宽度
  const calculateTabWidth = useCallback((isHovered: boolean = false) => {
    const availableWidth = window.innerWidth - 400 // 预留空间给窗口控制按钮和其他元素
    const tabCount = tabs.length
    if (tabCount === 0) return maxTabWidth
    
    const baseWidth = Math.max(minTabWidth, Math.min(maxTabWidth, availableWidth / tabCount))
    // 悬停时增加30px宽度
    return isHovered ? Math.min(maxTabWidth + 30, baseWidth + 30) : baseWidth
  }, [tabs.length, maxTabWidth, minTabWidth])

  const handleTabClick = (tabId: string) => {
    onTabClick(tabId)
  }

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    onTabClose(tabId)
  }

  const handleNewTab = () => {
    onNewTab()
  }

  const handleTabMouseEnter = (tabId: string) => {
    setHoveredTab(tabId)
  }

  const handleTabMouseLeave = () => {
    setHoveredTab(null)
  }

  const tabBarContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    background: isDarkTheme 
      ? 'rgba(255, 255, 255, 0.03)' 
      : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)'}`,
  };

  const tabsContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    overflow: 'hidden',
  };

  const getTabStyle = (tab: Tab, isHovered: boolean, index: number) => {
    const tabWidth = calculateTabWidth(isHovered);
    
    return {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      cursor: 'pointer',
      transition: 'all 0.3s ease-out',
      width: `${tabWidth}px`,
      minWidth: `${minTabWidth}px`,
      maxWidth: `${maxTabWidth + 30}px`,
      background: tab.isActive 
        ? (isDarkTheme ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.9)')
        : (isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)'),
      backdropFilter: 'blur(10px)',
      borderLeft: index > 0 ? `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)'}` : 'none',
      borderRadius: tab.isActive ? '8px 8px 0 0' : '0',
      boxShadow: tab.isActive ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
    };
  };

  const tabContentStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 16px',
    position: 'relative' as const,
    zIndex: 10,
  };

  const tabTextContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    paddingRight: '8px',
  };

  const getTabTextStyle = (tab: Tab) => ({
    fontSize: '14px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
    transition: 'all 0.3s ease-out',
    color: tab.isActive 
      ? (isDarkTheme ? '#ffffff' : '#1f2937')
      : (isDarkTheme ? '#b0b0c0' : '#6b7280'),
    textShadow: tab.isActive ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
  });

  const getCloseButtonContainerStyle = (isHovered: boolean) => ({
    flexShrink: 0,
    transition: 'all 0.3s ease-out',
    opacity: isHovered ? 1 : 0,
    transform: isHovered ? 'translateX(0) scale(1)' : 'translateX(8px) scale(0.75)',
    pointerEvents: isHovered ? 'auto' as const : 'none' as const,
  });

  const closeButtonStyle = {
    minWidth: '24px',
    height: '24px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '4px',
    transition: 'all 0.2s ease-out',
  };

  const activeIndicatorStyle = {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'rgb(76, 76, 82)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  };

  const hoverEffectStyle = {
    position: 'absolute' as const,
    inset: 0,
    opacity: 0,
    transition: 'all 0.3s ease-out',
    borderRadius: '8px 8px 0 0',
  };

  return (
    <div style={tabBarContainerStyle}>
      {/* 标签页容器 */}
      <div style={tabsContainerStyle}>
        {tabs.map((tab, index) => {
          const isHovered = hoveredTab === tab.id;
          
          return (
            <div
              key={tab.id}
              style={getTabStyle(tab, isHovered, index)}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() =>{
                if(tab.canClose){
                  handleTabMouseEnter(tab.id)
                }
              }}
              onMouseLeave={(e)=>{
                if(tab.canClose){
                  handleTabMouseLeave();
                }
              }}
              title={tab.title}
            >
              {/* 标签页内容 */}
              <div style={tabContentStyle}>
                <div style={tabTextContainerStyle}>
                  <span style={getTabTextStyle(tab)}>
                    {tab.title}
                  </span>
                </div>

                {/* 关闭按钮 - 默认隐藏，悬停时显示 */}
                {(tab.canClose !== false) && (
                  <div style={getCloseButtonContainerStyle(isHovered)}>
                    <Button
                      type='text'
                      size='small'
                      icon={<X size={14} />}
                      onClick={(e) => handleTabClose(e, tab.id)}
                      title="关闭标签页"
                      style={closeButtonStyle}
                    />
                  </div>
                )}
              </div>
              
              {/* 活跃标签页底部指示器 */}
              {tab.isActive && (
                <div style={activeIndicatorStyle} />
              )}

              {/* 悬停效果光晕 */}
              {!tab.isActive && (
                <div 
                  style={{
                    ...hoverEffectStyle,
                    opacity: isHovered ? 1 : 0,
                  }} 
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TabBar 