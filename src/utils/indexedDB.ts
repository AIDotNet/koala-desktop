import { Message } from '@/types/chat'

export interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

class ChatSessionDB {
  private dbName = 'ChatSessionDB'
  private version = 1
  private storeName = 'sessions'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error('Failed to open database'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建会话存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
      }
    })
  }

  async getAllSessions(): Promise<ChatSession[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const sessions = request.result as ChatSession[]
        // 按更新时间倒序排列
        sessions.sort((a, b) => b.updatedAt - a.updatedAt)
        resolve(sessions)
      }

      request.onerror = () => {
        reject(new Error('Failed to get sessions'))
      }
    })
  }

  async getSession(id: string): Promise<ChatSession | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        reject(new Error('Failed to get session'))
      }
    })
  }

  async saveSession(session: ChatSession): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(session)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to save session'))
      }
    })
  }

  async deleteSession(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to delete session'))
      }
    })
  }

  async updateSession(id: string, updates: Partial<ChatSession>): Promise<void> {
    if (!this.db) await this.init()
    
    const session = await this.getSession(id)
    if (!session) {
      throw new Error('Session not found')
    }

    const updatedSession: ChatSession = {
      ...session,
      ...updates,
      updatedAt: Date.now()
    }

    await this.saveSession(updatedSession)
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const updatedSession: ChatSession = {
      ...session,
      messages: [...session.messages, message],
      lastMessage: message.role === 'user' 
        ? (typeof message.content === 'object' && 'text' in message.content ? message.content.text : '')
        : (Array.isArray(message.content) 
          ? message.content.find(block => block.type === 'content')?.content || ''
          : ''),
      updatedAt: Date.now()
    }

    await this.saveSession(updatedSession)
  }

  async createDefaultSession(): Promise<ChatSession> {
    const now = Date.now()
    const session: ChatSession = {
      id: now.toString(),
      title: '新会话',
      lastMessage: '',
      timestamp: new Date().toLocaleDateString(),
      createdAt: now,
      updatedAt: now,
      messages: []
    }

    await this.saveSession(session)
    return session
  }
}

export const chatSessionDB = new ChatSessionDB() 