import React, { useState, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from 'antd'

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

  return (
    <div className="flex items-center h-full bg-black/20 backdrop-blur-sm border-b border-white/10">
      {/* 标签页容器 */}
      <div className="flex items-center h-full overflow-hidden">
        {tabs.map((tab, index) => {
          const isHovered = hoveredTab === tab.id
          const tabWidth = calculateTabWidth(isHovered)
          
          return (
            <div
              key={tab.id}
              className={`
                relative flex items-center h-full cursor-pointer group
                transition-all duration-300 ease-out
                ${tab.isActive 
                  ? 'bg-white/10 backdrop-blur-md border-t-2 border-blue-400 shadow-lg' 
                  : 'bg-white/5 hover:bg-white/8 backdrop-blur-sm'
                }
                ${index > 0 ? 'border-l border-white/10' : ''}
              `}
              style={{ 
                width: `${tabWidth}px`,
                minWidth: `${minTabWidth}px`,
                maxWidth: `${maxTabWidth + 30}px`,
                borderRadius: tab.isActive ? '8px 8px 0 0' : '0'
              }}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => handleTabMouseEnter(tab.id)}
              onMouseLeave={handleTabMouseLeave}
              title={tab.title}
            >
              {/* 标签页内容 */}
              <div className="flex items-center justify-between w-full px-4 py-3 relative z-10">
                <div className="flex items-center flex-1 min-w-0 pr-2">
                  <span className={`
                    text-sm truncate flex-1 font-medium
                    transition-all duration-300 ease-out
                    ${tab.isActive 
                      ? 'text-white drop-shadow-sm' 
                      : 'text-gray-300 group-hover:text-white'
                    }
                  `}>
                    {tab.title}
                  </span>
                </div>

                {/* 关闭按钮 - 默认隐藏，悬停时显示 */}
                {(tab.canClose !== false) && (
                  <div className={`
                    flex-shrink-0 transition-all duration-300 ease-out
                    ${isHovered 
                      ? 'opacity-100 translate-x-0 scale-100' 
                      : 'opacity-0 translate-x-2 scale-75 pointer-events-none'
                    }
                  `}>
                    <Button
                      type='text'
                      size='small'
                      icon={<X size={14} />}
                      onClick={(e) => handleTabClose(e, tab.id)}
                      title="关闭标签页"
                      className={`
                        hover:bg-red-500/20 hover:text-red-400 
                        transition-all duration-200 ease-out
                        ${isHovered ? 'visible' : 'invisible'}
                      `}
                      style={{
                        minWidth: '24px',
                        height: '24px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* 活跃标签页底部指示器 */}
              {tab.isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 shadow-sm" />
              )}

              {/* 悬停效果光晕 */}
              <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-100 
                transition-all duration-300 ease-out
                bg-gradient-to-b from-white/5 to-transparent
                ${tab.isActive ? 'hidden' : ''}
                rounded-t-lg
              `} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TabBar 