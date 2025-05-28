import { Message } from '@/types/chat'

export interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  createdAt: number
  updatedAt: number
  selectedModel?: string
}

class ChatSessionDB {
  private dbName = 'ChatSessionDB'
  private version = 3
  private sessionStoreName = 'sessions'
  private messageStoreName = 'messages'
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    // 性能优化：避免重复初始化
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
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
        const oldVersion = event.oldVersion
        
        // 创建会话存储
        if (!db.objectStoreNames.contains(this.sessionStoreName)) {
          const sessionStore = db.createObjectStore(this.sessionStoreName, { keyPath: 'id' })
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false })
          sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
        
        // 创建消息存储
        if (!db.objectStoreNames.contains(this.messageStoreName)) {
          const messageStore = db.createObjectStore(this.messageStoreName, { keyPath: 'id' })
          messageStore.createIndex('conversationId', 'conversationId', { unique: false })
          messageStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        // 性能优化：异步执行数据迁移
        if (oldVersion === 1) {
          // 延迟执行迁移，避免阻塞初始化
          setTimeout(() => this.migrateDataFromV1ToV2(db), 0);
        }
        
        // 从版本2升级到版本3，添加selectedModel字段支持
        if (oldVersion === 2) {
          setTimeout(() => this.migrateDataFromV2ToV3(db), 0);
        }
        
        // 从版本1直接升级到版本3
        if (oldVersion === 1) {
          // 先执行v1到v2的迁移，然后执行v2到v3的迁移
          setTimeout(() => {
            this.migrateDataFromV2ToV3(db);
          }, 100);
        }
      }
    })

    return this.initPromise
  }
  
  // 性能优化：批量数据迁移 - 从v1到v2
  private async migrateDataFromV1ToV2(db: IDBDatabase): Promise<void> {
    try {
      console.log('开始数据迁移: 从v1到v2 (异步执行)')
      
      // 获取所有会话
      const transaction = db.transaction(this.sessionStoreName, 'readonly');
      const sessionStore = transaction.objectStore(this.sessionStoreName);
      const sessions = await new Promise<any[]>((resolve, reject) => {
        const request = sessionStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      // 性能优化：批量处理消息
      const batchSize = 50; // 每批处理50条消息
      
      for (const session of sessions) {
        const messages = session.messages || [];
        
        // 分批处理消息
        for (let i = 0; i < messages.length; i += batchSize) {
          const batch = messages.slice(i, i + batchSize);
          
          const messageTransaction = db.transaction(this.messageStoreName, 'readwrite');
          const messageStore = messageTransaction.objectStore(this.messageStoreName);
          
          // 批量添加消息
          const promises = batch.map((message: Message) => 
            new Promise<void>((resolve, reject) => {
              const request = messageStore.add(message);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            })
          );
          
          await Promise.all(promises);
          
          // 性能优化：让出主线程
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // 更新会话对象，移除messages数组
        delete session.messages;
        const updateRequest = db.transaction(this.sessionStoreName, 'readwrite')
          .objectStore(this.sessionStoreName)
          .put(session);
          
        await new Promise<void>((resolve, reject) => {
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        });
      }
      
      console.log('数据迁移完成: 从v1到v2');
    } catch (error) {
      console.error('数据迁移失败:', error);
    }
  }

  // 性能优化：批量数据迁移 - 从v2到v3
  private async migrateDataFromV2ToV3(db: IDBDatabase): Promise<void> {
    try {
      console.log('开始数据迁移: 从v2到v3，添加selectedModel字段支持 (异步执行)');
      
      const transaction = db.transaction(this.sessionStoreName, 'readwrite');
      const sessionStore = transaction.objectStore(this.sessionStoreName);
      
      // 获取所有会话
      const sessions = await new Promise<ChatSession[]>((resolve, reject) => {
        const request = sessionStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      // 性能优化：批量更新会话
      const batchSize = 20;
      for (let i = 0; i < sessions.length; i += batchSize) {
        const batch = sessions.slice(i, i + batchSize);
        
        const promises = batch.map(session => {
          if (!session.selectedModel) {
            const updatedSession: ChatSession = {
              ...session,
              selectedModel: undefined
            };
            
            return new Promise<void>((resolve, reject) => {
              const updateRequest = sessionStore.put(updatedSession);
              updateRequest.onsuccess = () => resolve();
              updateRequest.onerror = () => reject(updateRequest.error);
            });
          }
          return Promise.resolve();
        });
        
        await Promise.all(promises);
        
        // 让出主线程
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      console.log('数据迁移完成: 从v2到v3');
    } catch (error) {
      console.error('数据迁移失败 (v2到v3):', error);
    }
  }

  // 性能优化：添加缓存机制
  private sessionCache: ChatSession[] | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 30000 // 30秒缓存

  async getAllSessions(): Promise<ChatSession[]> {
    if (!this.db) await this.init()
    
    // 性能优化：使用缓存
    const now = Date.now()
    if (this.sessionCache && now < this.cacheExpiry) {
      return this.sessionCache
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.sessionStoreName], 'readonly')
      const store = transaction.objectStore(this.sessionStoreName)
      const request = store.getAll()

      request.onsuccess = () => {
        const sessions = request.result as ChatSession[]
        // 按更新时间倒序排列
        sessions.sort((a, b) => b.updatedAt - a.updatedAt)
        
        // 更新缓存
        this.sessionCache = sessions
        this.cacheExpiry = now + this.CACHE_DURATION
        
        resolve(sessions)
      }

      request.onerror = () => {
        reject(new Error('Failed to get sessions'))
      }
    })
  }

  // 性能优化：清除缓存的方法
  public clearCache(): void {
    this.sessionCache = null
    this.cacheExpiry = 0
  }

  async getSession(id: string): Promise<ChatSession | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.sessionStoreName], 'readonly')
      const store = transaction.objectStore(this.sessionStoreName)
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
      const transaction = this.db!.transaction([this.sessionStoreName], 'readwrite')
      const store = transaction.objectStore(this.sessionStoreName)
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
    
    try {
      // 先删除该会话的所有消息
      await this.deleteMessagesForSession(id)
      
      // 然后删除会话本身
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.sessionStoreName], 'readwrite')
        const store = transaction.objectStore(this.sessionStoreName)
        const request = store.delete(id)

        request.onsuccess = () => {
          resolve()
        }

        request.onerror = () => {
          reject(new Error('Failed to delete session'))
        }
      })
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
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

  // 新增方法：更新会话的选择模型
  async updateSessionModel(sessionId: string, selectedModel: string): Promise<void> {
    if (!this.db) await this.init()
    
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const updatedSession: ChatSession = {
      ...session,
      selectedModel,
      updatedAt: Date.now()
    }

    await this.saveSession(updatedSession)
  }

  // 新增方法：保存消息
  async saveMessage(message: Message): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.messageStoreName], 'readwrite')
      const store = transaction.objectStore(this.messageStoreName)
      const request = store.put(message)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to save message'))
      }
    })
  }
  
  // 新增方法：获取会话的所有消息
  async getMessagesForSession(sessionId: string): Promise<Message[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.messageStoreName], 'readonly')
      const store = transaction.objectStore(this.messageStoreName)
      const index = store.index('conversationId')
      const request = index.getAll(sessionId)

      request.onsuccess = () => {
        const messages = request.result as Message[]
        // 按时间戳排序消息
        messages.sort((a, b) => a.timestamp - b.timestamp)
        resolve(messages)
      }

      request.onerror = () => {
        reject(new Error('Failed to get messages for session'))
      }
    })
  }
  
  // 新增方法：删除会话的所有消息
  async deleteMessagesForSession(sessionId: string): Promise<void> {
    if (!this.db) await this.init()
    
    // 首先获取所有要删除的消息的ID
    const messages = await this.getMessagesForSession(sessionId)
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.messageStoreName], 'readwrite')
      const store = transaction.objectStore(this.messageStoreName)
      
      let completedOperations = 0
      let errorOccurred = false
      
      // 如果没有消息需要删除，直接完成
      if (messages.length === 0) {
        resolve()
        return
      }
      
      // 删除每条消息
      messages.forEach(message => {
        const request = store.delete(message.id)
        
        request.onsuccess = () => {
          completedOperations++
          if (completedOperations === messages.length && !errorOccurred) {
            resolve()
          }
        }
        
        request.onerror = () => {
          if (!errorOccurred) {
            errorOccurred = true
            reject(new Error('Failed to delete messages for session'))
          }
        }
      })
    })
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    // 保存消息到消息存储
    await this.saveMessage(message)
    
    // 更新会话的最后一条消息和更新时间
    const lastMessageText = message.role === 'user' 
      ? (typeof message.content === 'object' && 'text' in message.content ? message.content.text : '')
      : (Array.isArray(message.content) 
        ? message.content.find(block => block.type === 'content')?.content || ''
        : '')
        
    await this.updateSession(sessionId, { 
      lastMessage: lastMessageText,
      updatedAt: Date.now()
    })
  }

  async createDefaultSession(selectedModel?: string): Promise<ChatSession> {
    const now = Date.now()
    const session: ChatSession = {
      id: now.toString(),
      title: '新会话',
      lastMessage: '',
      timestamp: new Date().toLocaleDateString(),
      createdAt: now,
      updatedAt: now,
      selectedModel // 保存选择的模型
    }

    await this.saveSession(session)
    return session
  }

  // 更新指定会话的消息
  async updateMessage(sessionId: string, messageId: string, updatedMessage: Message): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.messageStoreName], 'readwrite')
      const store = transaction.objectStore(this.messageStoreName)
      const request = store.put(updatedMessage)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to update message'))
      }
    })
  }

  // 新增方法：删除单条消息
  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.messageStoreName], 'readwrite')
      const store = transaction.objectStore(this.messageStoreName)
      const request = store.delete(messageId)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to delete message'))
      }
    })
  }
}

export const chatSessionDB = new ChatSessionDB() 