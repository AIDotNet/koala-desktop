import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ChatSession, chatSessionDB } from '@/utils/indexedDB'
import { Message } from '@/types/chat'

// 会话状态接口
export interface SessionState {
  // 会话列表
  sessions: ChatSession[]
  
  // 当前会话
  currentSessionId: string | null
  currentSession: ChatSession | null
  
  // 当前会话的消息
  sessionMessages: Message[]
  
  // 流式消息
  streamingMessages: { [key: string]: Message }
  
  // 加载状态
  isLoadingSessions: boolean
  isLoadingMessages: boolean
  
  // 错误状态
  error: string | null
}

// 会话操作接口
export interface SessionActions {
  // 会话列表操作
  loadSessions: () => Promise<void>
  setSessions: (sessions: ChatSession[]) => void
  
  // 当前会话操作
  setCurrentSession: (sessionId: string | null) => Promise<void>
  getCurrentSession: () => ChatSession | null
  
  // 会话 CRUD 操作
  createSession: (selectedModel?: string) => Promise<ChatSession>
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  
  // 消息操作
  loadSessionMessages: (sessionId: string) => Promise<void>
  addMessage: (sessionId: string, message: Message) => Promise<void>
  updateMessage: (sessionId: string, messageId: string, message: Message) => Promise<void>
  deleteMessage: (sessionId: string, messageId: string) => Promise<void>
  
  // 流式消息操作
  setStreamingMessage: (messageId: string, message: Message) => void
  removeStreamingMessage: (messageId: string) => void
  clearStreamingMessages: () => void
  
  // 会话模型操作
  updateSessionModel: (sessionId: string, modelId: string) => Promise<void>
  
  // 错误处理
  setError: (error: string | null) => void
  clearError: () => void
  
  // 重置状态
  reset: () => void
}

// 初始状态
const initialState: SessionState = {
  sessions: [],
  currentSessionId: null,
  currentSession: null,
  sessionMessages: [],
  streamingMessages: {},
  isLoadingSessions: false,
  isLoadingMessages: false,
  error: null,
}

// 创建会话状态管理
export const useSessionStore = create<SessionState & SessionActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // 会话列表操作
      loadSessions: async () => {
        set({ isLoadingSessions: true, error: null }, false, 'loadSessions:start')
        
        try {
          await chatSessionDB.init()
          const sessions = await chatSessionDB.getAllSessions()
          set({ 
            sessions, 
            isLoadingSessions: false 
          }, false, 'loadSessions:success')
        } catch (error) {
          console.error('Failed to load sessions:', error)
          set({ 
            error: '加载会话列表失败', 
            isLoadingSessions: false 
          }, false, 'loadSessions:error')
        }
      },
      
      setSessions: (sessions: ChatSession[]) => {
        set({ sessions }, false, 'setSessions')
      },
      
      // 当前会话操作
      setCurrentSession: async (sessionId: string | null) => {
        const { sessions, loadSessionMessages } = get()
        
        // 清空当前消息和流式消息
        set({ 
          currentSessionId: sessionId,
          currentSession: null,
          sessionMessages: [],
          streamingMessages: {},
          error: null
        }, false, 'setCurrentSession:start')
        
        if (!sessionId) {
          return
        }
        
        // 查找会话
        const session = sessions.find(s => s.id === sessionId)
        if (!session) {
          set({ 
            error: '会话不存在',
            currentSessionId: null 
          }, false, 'setCurrentSession:notFound')
          return
        }
        
        set({ currentSession: session }, false, 'setCurrentSession:found')
        
        // 加载会话消息
        await loadSessionMessages(sessionId)
      },
      
      getCurrentSession: () => {
        return get().currentSession
      },
      
      // 会话 CRUD 操作
      createSession: async (selectedModel?: string) => {
        set({ error: null }, false, 'createSession:start')
        
        try {
          const newSession = await chatSessionDB.createDefaultSession(selectedModel)
          const { loadSessions } = get()
          await loadSessions()
          
          return newSession
        } catch (error) {
          console.error('Failed to create session:', error)
          set({ error: '创建会话失败' }, false, 'createSession:error')
          throw error
        }
      },
      
      updateSession: async (sessionId: string, updates: Partial<ChatSession>) => {
        set({ error: null }, false, 'updateSession:start')
        
        try {
          await chatSessionDB.updateSession(sessionId, updates)
          const { loadSessions, currentSessionId } = get()
          await loadSessions()
          
          // 如果更新的是当前会话，更新当前会话信息
          if (currentSessionId === sessionId) {
            const { sessions } = get()
            const updatedSession = sessions.find(s => s.id === sessionId)
            if (updatedSession) {
              set({ currentSession: updatedSession }, false, 'updateSession:updateCurrent')
            }
          }
        } catch (error) {
          console.error('Failed to update session:', error)
          set({ error: '更新会话失败' }, false, 'updateSession:error')
          throw error
        }
      },
      
      deleteSession: async (sessionId: string) => {
        set({ error: null }, false, 'deleteSession:start')
        
        try {
          await chatSessionDB.deleteSession(sessionId)
          const { loadSessions, currentSessionId } = get()
          
          // 如果删除的是当前会话，清空当前会话
          if (currentSessionId === sessionId) {
            set({ 
              currentSessionId: null,
              currentSession: null,
              sessionMessages: [],
              streamingMessages: {}
            }, false, 'deleteSession:clearCurrent')
          }
          
          await loadSessions()
        } catch (error) {
          console.error('Failed to delete session:', error)
          set({ error: '删除会话失败' }, false, 'deleteSession:error')
          throw error
        }
      },
      
      // 消息操作
      loadSessionMessages: async (sessionId: string) => {
        set({ 
          isLoadingMessages: true, 
          error: null,
          sessionMessages: [],
          streamingMessages: {}
        }, false, 'loadSessionMessages:start')
        
        try {
          const messages = await chatSessionDB.getMessagesForSession(sessionId)
          set({ 
            sessionMessages: messages, 
            isLoadingMessages: false 
          }, false, 'loadSessionMessages:success')
        } catch (error) {
          console.error('Failed to load session messages:', error)
          set({ 
            error: '加载消息失败', 
            isLoadingMessages: false 
          }, false, 'loadSessionMessages:error')
        }
      },
      
      addMessage: async (sessionId: string, message: Message) => {
        set({ error: null }, false, 'addMessage:start')
        
        try {
          await chatSessionDB.addMessage(sessionId, message)
          
          // 更新本地消息列表
          const { sessionMessages } = get()
          set({ 
            sessionMessages: [...sessionMessages, message] 
          }, false, 'addMessage:updateLocal')
          
          // 重新加载会话列表以更新最后消息
          const { loadSessions } = get()
          await loadSessions()
        } catch (error) {
          console.error('Failed to add message:', error)
          set({ error: '发送消息失败' }, false, 'addMessage:error')
          throw error
        }
      },
      
      updateMessage: async (sessionId: string, messageId: string, message: Message) => {
        set({ error: null }, false, 'updateMessage:start')
        
        try {
          await chatSessionDB.updateMessage(sessionId, messageId, message)
          
          // 更新本地消息列表
          const { sessionMessages } = get()
          const updatedMessages = sessionMessages.map(msg => 
            msg.id === messageId ? message : msg
          )
          set({ 
            sessionMessages: updatedMessages 
          }, false, 'updateMessage:updateLocal')
        } catch (error) {
          console.error('Failed to update message:', error)
          set({ error: '更新消息失败' }, false, 'updateMessage:error')
          throw error
        }
      },
      
      deleteMessage: async (sessionId: string, messageId: string) => {
        set({ error: null }, false, 'deleteMessage:start')
        
        try {
          await chatSessionDB.deleteMessage(sessionId, messageId)
          
          // 更新本地消息列表
          const { sessionMessages } = get()
          const filteredMessages = sessionMessages.filter(msg => msg.id !== messageId)
          set({ 
            sessionMessages: filteredMessages 
          }, false, 'deleteMessage:updateLocal')
        } catch (error) {
          console.error('Failed to delete message:', error)
          set({ error: '删除消息失败' }, false, 'deleteMessage:error')
          throw error
        }
      },
      
      // 流式消息操作
      setStreamingMessage: (messageId: string, message: Message) => {
        const { streamingMessages } = get()
        set({ 
          streamingMessages: { 
            ...streamingMessages, 
            [messageId]: message 
          } 
        }, false, 'setStreamingMessage')
      },
      
      removeStreamingMessage: (messageId: string) => {
        const { streamingMessages } = get()
        const newStreamingMessages = { ...streamingMessages }
        delete newStreamingMessages[messageId]
        set({ 
          streamingMessages: newStreamingMessages 
        }, false, 'removeStreamingMessage')
      },
      
      clearStreamingMessages: () => {
        set({ streamingMessages: {} }, false, 'clearStreamingMessages')
      },
      
      // 会话模型操作
      updateSessionModel: async (sessionId: string, modelId: string) => {
        set({ error: null }, false, 'updateSessionModel:start')
        
        try {
          await chatSessionDB.updateSessionModel(sessionId, modelId)
          
          // 更新当前会话信息
          const { currentSession, loadSessions } = get()
          if (currentSession && currentSession.id === sessionId) {
            set({ 
              currentSession: { 
                ...currentSession, 
                selectedModel: modelId 
              } 
            }, false, 'updateSessionModel:updateCurrent')
          }
          
          // 重新加载会话列表
          await loadSessions()
        } catch (error) {
          console.error('Failed to update session model:', error)
          set({ error: '保存模型选择失败' }, false, 'updateSessionModel:error')
          // 不抛出错误，因为这不应该阻塞用户操作
        }
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
      name: 'SessionStore',
    }
  )
) 