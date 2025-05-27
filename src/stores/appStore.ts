import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// 应用状态接口
export interface AppState {
  // 主题相关
  isDarkTheme: boolean
  
  // 应用初始化状态
  isInitialized: boolean
  
  // 侧边栏状态
  sidebarCollapsed: boolean
  
  // 加载状态
  isLoading: boolean
  
  // 错误状态
  error: string | null
}

// 应用操作接口
export interface AppActions {
  // 主题操作
  setIsDarkTheme: (isDark: boolean) => void
  toggleTheme: () => void
  
  // 初始化操作
  setIsInitialized: (initialized: boolean) => void
  
  // 侧边栏操作
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  
  // 加载状态操作
  setIsLoading: (loading: boolean) => void
  
  // 错误处理
  setError: (error: string | null) => void
  clearError: () => void
  
  // 重置状态
  reset: () => void
}

// 初始状态
const initialState: AppState = {
  isDarkTheme: false,
  isInitialized: false,
  sidebarCollapsed: false,
  isLoading: false,
  error: null,
}

// 创建应用状态管理
export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // 主题操作
        setIsDarkTheme: (isDark: boolean) => {
          set({ isDarkTheme: isDark }, false, 'setIsDarkTheme')
          
          // 同步到 localStorage 和 body 类名
          localStorage.setItem('theme', isDark ? 'dark' : 'light')
          if (isDark) {
            document.body.classList.add('dark')
          } else {
            document.body.classList.remove('dark')
          }
        },
        
        toggleTheme: () => {
          const { isDarkTheme, setIsDarkTheme } = get()
          setIsDarkTheme(!isDarkTheme)
        },
        
        // 初始化操作
        setIsInitialized: (initialized: boolean) => {
          set({ isInitialized: initialized }, false, 'setIsInitialized')
        },
        
        // 侧边栏操作
        setSidebarCollapsed: (collapsed: boolean) => {
          set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed')
        },
        
        toggleSidebar: () => {
          const { sidebarCollapsed } = get()
          set({ sidebarCollapsed: !sidebarCollapsed }, false, 'toggleSidebar')
        },
        
        // 加载状态操作
        setIsLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'setIsLoading')
        },
        
        // 错误处理
        setError: (error: string | null) => {
          set({ error }, false, 'setError')
        },
        
        clearError: () => {
          set({ error: null }, false, 'clearError')
        },
        
        // 重置状态
        reset: () => {
          set(initialState, false, 'reset')
        },
      }),
      {
        name: 'koala-app-store',
        partialize: (state) => ({
          isDarkTheme: state.isDarkTheme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    {
      name: 'AppStore',
    }
  )
) 