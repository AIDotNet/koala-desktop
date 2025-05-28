import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Provider, Model } from '@/types/model'
import { providerDB } from '@/utils/providerDB'

// 模型状态接口
export interface ModelState {
  // 提供商列表
  providers: Provider[]
  
  // 当前选择的模型
  selectedModel: string
  
  // 提供商版本（用于强制重新加载）
  providersVersion: number
  
  // 加载状态
  isLoadingProviders: boolean
  
  // 错误状态
  error: string | null
}

// 模型操作接口
export interface ModelActions {
  // 提供商操作
  loadProviders: () => Promise<void>
  setProviders: (providers: Provider[]) => void
  refreshProviders: () => void
  
  // 模型选择操作
  setSelectedModel: (modelId: string) => void
  getSelectedModelData: () => Model | null
  getSelectedProvider: () => Provider | null
  
  // 获取可用模型
  getEnabledModels: () => Model[]
  getEnabledProviders: () => Provider[]
  
  // 模型验证
  isModelAvailable: (modelId: string) => boolean
  
  // 会话模型同步
  syncSessionModel: (sessionModel?: string) => void
  
  // 错误处理
  setError: (error: string | null) => void
  clearError: () => void
  
  // 重置状态
  reset: () => void
}

// 初始状态
const initialState: ModelState = {
  providers: [],
  selectedModel: '',
  providersVersion: 0,
  isLoadingProviders: false,
  error: null,
}

// 创建模型状态管理
export const useModelStore = create<ModelState & ModelActions>(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // 提供商操作
        loadProviders: async () => {
          set({ isLoadingProviders: true, error: null })
          
          try {
            // 首先尝试从数据库加载用户配置的提供商
            let dbProviders = await providerDB.getAllProviders()

            // 如果数据库为空，初始化默认提供商
            if (dbProviders.length === 0) {
              dbProviders = await providerDB.initializeDefaultProviders()
            }

            // 只保留启用的提供商，并且只保留启用的模型
            const enabledProviders = dbProviders
              .filter(provider => provider.enabled)
              .map(provider => ({
                ...provider,
                models: provider.models.filter(model => model.enabled)
              }))
              .filter(provider => provider.models.length > 0) // 只保留有启用模型的提供商

            set({ 
              providers: enabledProviders, 
              isLoadingProviders: false 
            })

            // 如果当前没有选中模型，或者选中的模型不在启用列表中，自动选择第一个可用模型
            const { selectedModel } = get()
            const allEnabledModels = enabledProviders.flatMap(p => p.models)
            
            if (!selectedModel || !allEnabledModels.find(m => m.id === selectedModel)) {
              if (allEnabledModels.length > 0) {
                set({ selectedModel: allEnabledModels[0].id })
              }
            }

          } catch (error) {
            console.error('Failed to load provider data:', error)
            set({ 
              error: '加载提供商数据失败', 
              isLoadingProviders: false 
            })

            // 如果加载失败，使用默认的 OpenAI 提供商作为回退
            const fallbackProviders: Provider[] = [
              {
                id: 'openai',
                name: 'openai',
                displayName: 'OpenAI',
                description: 'OpenAI 官方 API 服务',
                apiUrl: 'https://api.openai.com/v1',
                apiKey: '',
                enabled: true,
                icon: 'OpenAI',
                website: 'https://openai.com',
                models: [
                  {
                    id: 'gpt-4-turbo',
                    displayName: 'GPT-4 Turbo',
                    description: '最新的 GPT-4 Turbo 模型具备视觉功能',
                    provider: 'openai',
                    type: 'chat',
                    enabled: true,
                    contextWindowTokens: 128000,
                    maxOutput: 4096,
                    abilities: {
                      functionCall: true,
                      vision: true
                    }
                  }
                ]
              }
            ]
            set({ providers: fallbackProviders })
          }
        },
        
        setProviders: (providers: Provider[]) => {
          set({ providers })
        },
        
        refreshProviders: () => {
          const { providersVersion, loadProviders } = get()
          set({ providersVersion: providersVersion + 1 })
          // 延迟一点时间再重新加载，确保设置页面的数据已经保存
          setTimeout(() => {
            loadProviders()
          }, 100)
        },
        
        // 模型选择操作
        setSelectedModel: (modelId: string) => {
          set({ selectedModel: modelId })
        },
        
        getSelectedModelData: () => {
          const { providers, selectedModel } = get()
          const allModels = providers.flatMap(p => p.models)
          return allModels.find(m => m.id === selectedModel) || null
        },
        
        getSelectedProvider: () => {
          const { providers, getSelectedModelData } = get()
          const selectedModelData = getSelectedModelData()
          if (!selectedModelData) return null
          
          return providers.find(p => p.id === selectedModelData.provider) || null
        },
        
        // 获取可用模型
        getEnabledModels: () => {
          const { providers } = get()
          return providers
            .filter(provider => provider.enabled)
            .flatMap(provider => 
              provider.models.filter(model => model.enabled)
            )
        },
        
        getEnabledProviders: () => {
          const { providers } = get()
          return providers
            .filter(provider => provider.enabled)
            .filter(provider => provider.models.some(model => model.enabled))
        },
        
        // 模型验证
        isModelAvailable: (modelId: string) => {
          const { getEnabledModels } = get()
          const enabledModels = getEnabledModels()
          return enabledModels.some(model => model.id === modelId)
        },
        
        // 会话模型同步
        syncSessionModel: (sessionModel?: string) => {
          if (!sessionModel) return
          
          const { isModelAvailable, setSelectedModel, selectedModel } = get()
          
          // 如果会话模型与当前选择的模型不同，且会话模型仍然可用，则切换到会话模型
          if (sessionModel !== selectedModel && isModelAvailable(sessionModel)) {
            setSelectedModel(sessionModel)
          }
        },
        
        // 错误处理
        setError: (error: string | null) => {
          set({ error })
        },
        
        clearError: () => {
          set({ error: null })
        },
        
        // 重置状态
        reset: () => {
          set(initialState)
        },
      }),
      {
        name: 'koala-model-store',
        partialize: (state) => ({
          selectedModel: state.selectedModel,
          providersVersion: state.providersVersion,
        }),
      }
    ),
    {
      name: 'ModelStore',
    }
  )
) 