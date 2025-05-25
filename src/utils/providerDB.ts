import { Provider, Model } from '@/types/model'
import { getIcon } from './iconutils'

class ProviderDB {
  private dbName = 'ProviderDB'
  private version = 1
  private storeName = 'providers'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error('无法打开提供商数据库'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建提供商存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('name', 'name', { unique: true })
          store.createIndex('enabled', 'enabled', { unique: false })
        }
      }
    })
  }

  async getAllProviders(): Promise<Provider[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result as Provider[])
      }

      request.onerror = () => {
        reject(new Error('获取提供商列表失败'))
      }
    })
  }

  async getProvider(id: string): Promise<Provider | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        reject(new Error('获取提供商失败'))
      }
    })
  }

  async saveProvider(provider: Provider): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(provider)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('保存提供商失败'))
      }
    })
  }

  async deleteProvider(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('删除提供商失败'))
      }
    })
  }

  async updateProvider(id: string, updates: Partial<Provider>): Promise<void> {
    if (!this.db) await this.init()
    
    const provider = await this.getProvider(id)
    if (!provider) {
      throw new Error('提供商不存在')
    }

    const updatedProvider: Provider = {
      ...provider,
      ...updates
    }

    await this.saveProvider(updatedProvider)
  }

  async addModel(providerId: string, model: Model): Promise<void> {
    const provider = await this.getProvider(providerId)
    if (!provider) {
      throw new Error('提供商不存在')
    }

    const existingModel = provider.models.find(m => m.id === model.id)
    if (existingModel) {
      throw new Error('模型ID已存在')
    }

    const updatedProvider: Provider = {
      ...provider,
      models: [...provider.models, model]
    }

    await this.saveProvider(updatedProvider)
  }

  async updateModel(providerId: string, modelId: string, updates: Partial<Model>): Promise<void> {
    const provider = await this.getProvider(providerId)
    if (!provider) {
      throw new Error('提供商不存在')
    }

    const modelIndex = provider.models.findIndex(m => m.id === modelId)
    if (modelIndex === -1) {
      throw new Error('模型不存在')
    }

    const updatedModels = [...provider.models]
    updatedModels[modelIndex] = {
      ...updatedModels[modelIndex],
      ...updates
    }

    const updatedProvider: Provider = {
      ...provider,
      models: updatedModels
    }

    await this.saveProvider(updatedProvider)
  }

  async deleteModel(providerId: string, modelId: string): Promise<void> {
    const provider = await this.getProvider(providerId)
    if (!provider) {
      throw new Error('提供商不存在')
    }

    const updatedProvider: Provider = {
      ...provider,
      models: provider.models.filter(m => m.id !== modelId)
    }

    await this.saveProvider(updatedProvider)
  }

  async toggleModelEnabled(providerId: string, modelId: string, enabled: boolean): Promise<void> {
    await this.updateModel(providerId, modelId, { enabled })
  }

  // 初始化默认提供商，如果数据库为空
  async initializeDefaultProviders(): Promise<Provider[]> {
    const providers = await this.getAllProviders()
    if (providers.length > 0) {
      return providers
    }

    // 默认提供商列表
    const defaultProviders: Provider[] = [
      {
        id: 'openai',
        name: 'openai',
        displayName: 'OpenAI',
        description: 'OpenAI API 提供商',
        apiUrl: 'https://api.openai.com/v1',
        apiKey: '',
        enabled: true,
        models: [
          {
            id: 'gpt-4o',
            displayName: 'GPT-4o',
            description: 'GPT-4o 模型',
            enabled: true,
            provider: 'openai',
            type: 'chat',
            contextWindowTokens: 100000,
            maxOutput: 1000,
            abilities: {
              functionCall: true,
              vision: true
            },
            pricing: {
              cachedInput: 0,
              input: 0,
              output: 0
            },
            releasedAt: '2023-03-15'
          },
          {
            id: 'gpt-4o-mini',
            displayName: 'GPT-4o-mini',
            description: 'GPT-4o-mini 模型',
            enabled: true,
            provider: 'openai',
            type: 'chat',
            contextWindowTokens: 100000,
            maxOutput: 1000,
            abilities: {
              functionCall: true,
              vision: true
            },
            pricing: {
              cachedInput: 0,
              input: 0,
              output: 0
            },
            releasedAt: '2023-03-15'
          },
          {
            id: 'gpt-4.1',
            displayName: 'GPT-4.1',
            description: 'GPT-4.1 模型',
            enabled: true,
            provider: 'openai',
            type: 'chat',
            contextWindowTokens: 100000,
            maxOutput: 1000,
            abilities: {
              functionCall: true,
              vision: true
            },
            pricing: {
              cachedInput: 0,
              input: 0,
              output: 0
            },
            releasedAt: '2023-03-15'
          }

        ],
        icon: 'OpenAI',
        website: 'https://openai.com'
      },
      {
        id:'ollama',
        name:'ollama',
        displayName:'Ollama',
        description:'Ollama API 提供商',
        apiUrl:'http://localhost:11434/v1',
        apiKey:'',
        enabled:true,
        models:[
          {
            id:'llama3.1',
            displayName:'Llama3.1',
            description:'Llama3.1 模型',
            enabled:true,
            provider:'ollama',
            type:'chat',
            contextWindowTokens:100000,
            maxOutput:1000,
            abilities:{
              functionCall:true,
              vision:true
            },
            pricing: {
              cachedInput: 0,
              input: 0,
              output: 0
            },
            releasedAt: '2023-03-15'
          },
          {
            id:'qwen2.5',
            displayName:'Qwen2.5',
            description:'Qwen2.5 模型',
            enabled:true,
            provider:'ollama',
            type:'chat',
            contextWindowTokens:32768,
            maxOutput:2048,
            abilities:{
              functionCall:true,
              vision:true
            },
            pricing:{
              cachedInput:0,
              input:0,
              output:0
            },
            releasedAt:'2023-03-15'
          },
          {
            id:'qwen2.5-coder',
            displayName:'Qwen2.5-Coder',
            description:'Qwen2.5-Coder 模型',
            enabled:true,
            provider:'ollama',
            type:'chat',
            contextWindowTokens:32768,
            maxOutput:2048,
            abilities:{
              functionCall:true,
              vision:true
            },
            pricing:{
              cachedInput:0,
              input:0,
              output:0
            },
            releasedAt:'2023-03-15'
          }
        ],
        icon: 'Ollama',
        website:'https://ollama.com'
      }
    ]

    // 保存默认提供商
    for (const provider of defaultProviders) {
      await this.saveProvider(provider)
    }

    return defaultProviders
  }
}

export const providerDB = new ProviderDB() 