// 模型能力接口
export interface ModelAbilities {
  functionCall?: boolean
  vision?: boolean
  reasoning?: boolean
}

// 模型定价接口
export interface ModelPricing {
  cachedInput?: number
  input: number
  output: number
}

// 模型接口
export interface Model {
  id: string
  displayName: string
  description?: string
  provider: string
  type: 'chat' | 'completion' | 'embedding' | 'image' | 'tts' | 'sst'
  enabled?: boolean
  contextWindowTokens: number
  maxOutput?: number
  abilities?: ModelAbilities
  pricing?: ModelPricing
  releasedAt?: string
  icon?: any
}

// 服务商接口
export interface Provider {
  id: string
  name: string
  displayName: string
  description?: string
  apiUrl?: string
  apiKey?: string
  enabled: boolean
  models: Model[]
  icon?: string
  website?: string
}

// 模型配置接口
export interface ModelConfig {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  systemPrompt?: string
}

// 模型选择器组件属性
export interface ModelSelectorProps {
  selectedModel?: string
  onModelChange: (modelId: string) => void
  providers: Provider[]
  disabled?: boolean
  className?: string
}

// 服务商管理组件属性
export interface ProviderManagerProps {
  providers: Provider[]
  onProviderUpdate: (provider: Provider) => void
  onProviderAdd: (provider: Provider) => void
  onProviderDelete: (providerId: string) => void
  onModelToggle: (providerId: string, modelId: string, enabled: boolean) => void
} 