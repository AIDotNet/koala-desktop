# Zustand 状态管理系统

## 概述

本项目采用 Zustand 作为状态管理库，实现了模块化、类型安全的状态管理架构。系统包含四个主要的状态模块：应用状态、会话状态、标签页状态和模型状态。

## 架构设计

### 状态模块划分

```
src/stores/
├── index.ts          # 状态管理入口文件
├── appStore.ts       # 应用全局状态
├── sessionStore.ts   # 会话管理状态
├── tabStore.ts       # 标签页管理状态
├── modelStore.ts     # 模型管理状态
└── hooks.ts          # 组合 Hooks 和选择器
```

### 核心功能

1. **会话切换时同步获取当前会话的模型**
2. **删除会话时清除相关标签页**
3. **状态持久化和恢复**
4. **优化的重渲染控制**

## 使用指南

### 1. 基础使用

```tsx
import { useSessionManager, useModelInfo } from '@/stores/hooks'

const MyComponent = () => {
  const { currentSession, switchToSession } = useSessionManager()
  const { selectedModel, providers } = useModelInfo()
  
  // 使用状态和操作...
}
```

### 2. 会话管理

#### 切换会话并同步模型

```tsx
import { useSessionManager } from '@/stores/hooks'

const SessionList = () => {
  const { sessions, switchToSession, selectedModel } = useSessionManager()
  
  const handleSessionClick = async (sessionId: string) => {
    // 自动同步该会话的模型选择
    await switchToSession(sessionId)
  }
  
  return (
    <div>
      {sessions.map(session => (
        <div key={session.id} onClick={() => handleSessionClick(session.id)}>
          {session.title}
          {session.selectedModel && (
            <span>模型: {session.selectedModel}</span>
          )}
        </div>
      ))}
    </div>
  )
}
```

#### 删除会话并清理标签页

```tsx
import { useSessionManager } from '@/stores/hooks'

const SessionActions = () => {
  const { deleteSessionWithCleanup } = useSessionManager()
  
  const handleDeleteSession = async (sessionId: string) => {
    try {
      // 自动删除会话和相关标签页
      await deleteSessionWithCleanup(sessionId)
      console.log('会话和标签页已删除')
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
  
  return (
    <button onClick={() => handleDeleteSession('session-id')}>
      删除会话
    </button>
  )
}
```

### 3. 模型管理

#### 处理模型变更

```tsx
import { useSessionManager } from '@/stores/hooks'

const ModelSelector = () => {
  const { handleModelChange, selectedModel, getSelectedModelData } = useSessionManager()
  
  const onModelChange = async (modelId: string) => {
    // 自动保存到当前会话
    await handleModelChange(modelId)
  }
  
  return (
    <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)}>
      {/* 模型选项 */}
    </select>
  )
}
```

### 4. 标签页管理

#### 创建会话标签页

```tsx
import { useTabManager } from '@/stores/hooks'

const TabManager = () => {
  const { navigateToSession, removeSessionTabs } = useTabManager()
  
  const openSessionInTab = (sessionId: string, title: string) => {
    navigateToSession(sessionId, title, (url) => {
      // 导航到指定 URL
      window.location.href = url
    })
  }
  
  return (
    <button onClick={() => openSessionInTab('session-1', '会话标题')}>
      在标签页中打开
    </button>
  )
}
```

### 5. 应用初始化

```tsx
import { useAppInitializer } from '@/stores/hooks'

const App = () => {
  const { isInitialized, initializeApp } = useAppInitializer()
  
  useEffect(() => {
    if (!isInitialized) {
      initializeApp()
    }
  }, [isInitialized, initializeApp])
  
  if (!isInitialized) {
    return <div>加载中...</div>
  }
  
  return <MainApp />
}
```

## 状态选择器

为了优化性能，使用选择器 Hooks 来订阅特定的状态片段：

```tsx
import { 
  useCurrentSession, 
  useSessionList, 
  useModelInfo, 
  useTabInfo, 
  useAppInfo 
} from '@/stores/hooks'

const OptimizedComponent = () => {
  // 只订阅需要的状态
  const { currentSession, sessionMessages } = useCurrentSession()
  const { sessions } = useSessionList()
  const { selectedModel, providers } = useModelInfo()
  
  // 组件只在相关状态变化时重渲染
}
```

## 状态持久化

### 自动持久化的状态

- **应用状态**: 主题设置、侧边栏状态
- **标签页状态**: 标签页列表、活跃标签页
- **模型状态**: 选择的模型、提供商版本

### 不持久化的状态

- **会话状态**: 从数据库动态加载
- **消息状态**: 从数据库动态加载
- **加载状态**: 运行时状态

## 最佳实践

### 1. 状态更新

```tsx
// ✅ 推荐：使用组合 Hooks
const { handleModelChange } = useSessionManager()
await handleModelChange('new-model-id')

// ❌ 不推荐：直接调用 store 方法
useModelStore.getState().setSelectedModel('new-model-id')
```

### 2. 错误处理

```tsx
const { deleteSessionWithCleanup } = useSessionManager()

try {
  await deleteSessionWithCleanup(sessionId)
  // 成功处理
} catch (error) {
  // 错误处理
  console.error('操作失败:', error)
}
```

### 3. 性能优化

```tsx
// ✅ 使用选择器避免不必要的重渲染
const { selectedModel } = useModelInfo()

// ❌ 订阅整个 store
const store = useModelStore()
```

### 4. 副作用处理

```tsx
// ✅ 在组合 Hook 中处理副作用
const { switchToSession } = useSessionManager() // 自动同步模型

// ❌ 手动处理多个状态更新
const setCurrentSession = useSessionStore(state => state.setCurrentSession)
const syncSessionModel = useModelStore(state => state.syncSessionModel)
```

## 调试

### 开发工具

Zustand DevTools 已启用，可以在浏览器开发者工具中查看状态变化：

1. 打开浏览器开发者工具
2. 查找 Redux DevTools 扩展
3. 选择对应的 store（AppStore、SessionStore 等）

### 日志记录

所有状态操作都有详细的 action 名称，便于调试：

```
AppStore: setIsDarkTheme
SessionStore: setCurrentSession:start
SessionStore: setCurrentSession:found
ModelStore: syncSessionModel
```

## 迁移指南

### 从现有状态管理迁移

1. **替换 useState**：
   ```tsx
   // 旧代码
   const [selectedModel, setSelectedModel] = useState('')
   
   // 新代码
   const { selectedModel, handleModelChange } = useSessionManager()
   ```

2. **替换 useEffect**：
   ```tsx
   // 旧代码
   useEffect(() => {
     if (sessionId) {
       loadSession(sessionId)
       syncModel(sessionId)
     }
   }, [sessionId])
   
   // 新代码
   const { switchToSession } = useSessionManager()
   useEffect(() => {
     if (sessionId) {
       switchToSession(sessionId) // 自动处理加载和同步
     }
   }, [sessionId])
   ```

3. **替换手动状态同步**：
   ```tsx
   // 旧代码
   const handleModelChange = (modelId) => {
     setSelectedModel(modelId)
     if (currentSession) {
       updateSessionModel(currentSession.id, modelId)
     }
   }
   
   // 新代码
   const { handleModelChange } = useSessionManager() // 自动处理同步
   ```

## 类型安全

所有状态和操作都有完整的 TypeScript 类型定义：

```tsx
interface SessionState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  // ...
}

interface SessionActions {
  setCurrentSession: (sessionId: string | null) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  // ...
}
```

## 总结

新的 Zustand 状态管理系统提供了：

- ✅ **自动化的状态同步**：会话切换时自动同步模型
- ✅ **智能的资源清理**：删除会话时自动清理标签页
- ✅ **优化的性能**：选择器模式减少重渲染
- ✅ **类型安全**：完整的 TypeScript 支持
- ✅ **易于使用**：组合 Hooks 简化复杂操作
- ✅ **可调试性**：DevTools 支持和详细日志

通过使用这个状态管理系统，可以显著简化组件逻辑，提高代码的可维护性和用户体验。 