import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Tab } from '@/components/TabBar'

// 标签页状态接口
export interface TabState {
  // 标签页列表
  tabs: Tab[]
  
  // 当前活跃标签页
  activeTabId: string | null
  
  // 标签页计数器（用于生成唯一ID）
  tabCounter: number
}

// 标签页操作接口
export interface TabActions {
  // 标签页基本操作
  addTab: (tab: Omit<Tab, 'id' | 'isActive'>) => string
  removeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTab: (tabId: string, updates: Partial<Tab>) => void
  
  // 批量操作
  removeTabs: (tabIds: string[]) => void
  removeTabsByUrl: (urlPattern: string | RegExp) => void
  
  // 会话相关操作
  removeSessionTabs: (sessionId: string) => void
  updateSessionTabTitle: (sessionId: string, title: string) => void
  
  // 查询操作
  getTab: (tabId: string) => Tab | undefined
  getTabByUrl: (url: string) => Tab | undefined
  getActiveTab: () => Tab | undefined
  
  // 导航操作
  navigateToTab: (tabId: string, onNavigate?: (url: string) => void) => void
  
  // 重置状态
  reset: () => void
}

// 初始状态
const initialState: TabState = {
  tabs: [],
  activeTabId: null,
  tabCounter: 0,
}

// 创建标签页状态管理
export const useTabStore = create<TabState & TabActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // 标签页基本操作
        addTab: (tabData: Omit<Tab, 'id' | 'isActive'>) => {
          const { tabs, tabCounter } = get()
          const newTabId = `tab-${tabCounter + 1}`
          
          // 创建新标签页
          const newTab: Tab = {
            ...tabData,
            id: newTabId,
            isActive: false,
          }
          
          // 将所有现有标签页设为非活跃
          const updatedTabs = tabs.map((tab: Tab) => ({ ...tab, isActive: false }))
          
          // 添加新标签页并设为活跃
          newTab.isActive = true
          
          set({
            tabs: [...updatedTabs, newTab],
            activeTabId: newTabId,
            tabCounter: tabCounter + 1,
          })
          
          return newTabId
        },
        
        removeTab: (tabId: string) => {
          const { tabs, activeTabId } = get()
          const filteredTabs = tabs.filter((tab: Tab) => tab.id !== tabId)
          
          let newActiveTabId = activeTabId
          
          // 如果删除的是当前活跃标签页，需要选择新的活跃标签页
          if (activeTabId === tabId) {
            if (filteredTabs.length > 0) {
              // 选择第一个可用的标签页
              newActiveTabId = filteredTabs[0].id
              filteredTabs[0].isActive = true
            } else {
              newActiveTabId = null
            }
          }
          
          set({
            tabs: filteredTabs,
            activeTabId: newActiveTabId,
          })
        },
        
        setActiveTab: (tabId: string) => {
          const { tabs } = get()
          const updatedTabs = tabs.map((tab: Tab) => ({
            ...tab,
            isActive: tab.id === tabId,
          }))
          
          set({
            tabs: updatedTabs,
            activeTabId: tabId,
          })
        },
        
        updateTab: (tabId: string, updates: Partial<Tab>) => {
          const { tabs } = get()
          const updatedTabs = tabs.map((tab: Tab) =>
            tab.id === tabId ? { ...tab, ...updates } : tab
          )
          
          set({ tabs: updatedTabs })
        },
        
        // 批量操作
        removeTabs: (tabIds: string[]) => {
          const { tabs, activeTabId } = get()
          const filteredTabs = tabs.filter((tab: Tab) => !tabIds.includes(tab.id))
          
          let newActiveTabId = activeTabId
          
          // 如果当前活跃标签页被删除，选择新的活跃标签页
          if (activeTabId && tabIds.includes(activeTabId)) {
            if (filteredTabs.length > 0) {
              newActiveTabId = filteredTabs[0].id
              filteredTabs[0].isActive = true
            } else {
              newActiveTabId = null
            }
          }
          
          set({
            tabs: filteredTabs,
            activeTabId: newActiveTabId,
          })
        },
        
        removeTabsByUrl: (urlPattern: string | RegExp) => {
          const { tabs } = get()
          const pattern = typeof urlPattern === 'string' 
            ? new RegExp(urlPattern) 
            : urlPattern
          
          const tabsToRemove = tabs
            .filter((tab: Tab) => tab.url && pattern.test(tab.url))
            .map((tab: Tab) => tab.id)
          
          if (tabsToRemove.length > 0) {
            const { removeTabs } = get()
            removeTabs(tabsToRemove)
          }
        },
        
        // 会话相关操作
        removeSessionTabs: (sessionId: string) => {
          const { removeTabsByUrl } = get()
          // 删除所有与该会话相关的标签页
          removeTabsByUrl(`/chat/${sessionId}`)
        },
        
        updateSessionTabTitle: (sessionId: string, title: string) => {
          const { tabs, updateTab } = get()
          
          // 查找与该会话相关的标签页
          const sessionTab = tabs.find((tab: Tab) => 
            tab.url && tab.url.includes(`/chat/${sessionId}`)
          )
          
          if (sessionTab) {
            updateTab(sessionTab.id, { title })
          }
        },
        
        // 查询操作
        getTab: (tabId: string) => {
          const { tabs } = get()
          return tabs.find((tab: Tab) => tab.id === tabId)
        },
        
        getTabByUrl: (url: string) => {
          const { tabs } = get()
          return tabs.find((tab: Tab) => tab.url === url)
        },
        
        getActiveTab: () => {
          const { tabs, activeTabId } = get()
          return tabs.find((tab: Tab) => tab.id === activeTabId)
        },
        
        // 导航操作
        navigateToTab: (tabId: string, onNavigate?: (url: string) => void) => {
          const { getTab, setActiveTab } = get()
          const tab = getTab(tabId)
          
          if (tab) {
            setActiveTab(tabId)
            if (tab.url && onNavigate) {
              onNavigate(tab.url)
            }
          }
        },
        
        // 重置状态
        reset: () => {
          set(initialState)
        },
      }),
      {
        name: 'koala-tab-store',
        partialize: (state) => ({
          tabs: state.tabs,
          activeTabId: state.activeTabId,
          tabCounter: state.tabCounter,
        }),
      }
    ),
    {
      name: 'TabStore',
    }
  )
) 