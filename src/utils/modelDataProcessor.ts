import { Provider, Model } from '@/types/model'
import { iconMap, IconName } from './iconutils'
import modelData from '@/components/ModelSelector/model.json'

// 数据修正映射 - 修正 model.json 中的错误数据
const dataCorrections: Record<string, { owned_by?: string; type?: string }> = {
  'stable-diffusion-3-5-large': { owned_by: 'stability', type: 'image' },
  'sora-image': { type: 'image' },
  'gpt-image-1': { type: 'image' },
  'dall-e-2': { type: 'image' },
  'dall-e-3': { type: 'image' },
  'seedream-3.0': { owned_by: 'seedream' },
  'chat-seedream-3.0': { owned_by: 'seedream' }
}

// 修正模型数据
function correctModelData(models: any[]): any[] {
  return models.map(model => {
    const correction = dataCorrections[model.id]
    if (correction) {
      return {
        ...model,
        ...correction
      }
    }
    return model
  })
}

// 提供商到图标的映射
const providerIconMap: Record<string, IconName> = {
  'openai': 'OpenAI',
  'google': 'Google',
  'claude': 'Claude',
  'anthropic': 'Anthropic',
  'moonshot': 'Moonshot',
  'chatglm': 'ChatGLM',
  'qwen': 'Qwen',
  'deepseek': 'DeepSeek',
  'grok': 'Grok',
  'doubao': 'Doubao',
  'microsoft': 'Microsoft',
  'meta': 'Meta',
  'cohere': 'Cohere',
  'mistral': 'Mistral',
  'huggingface': 'HuggingFace',
  'nvidia': 'Nvidia',
  'aws': 'Aws',
  'azure': 'Azure',
  'bedrock': 'Bedrock',
  'gemini': 'Gemini',
  'palm': 'PaLM',
  'bard': 'Google',
  'bing': 'Bing',
  'baidu': 'Baidu',
  'alibaba': 'Alibaba',
  'tencent': 'Tencent',
  'bytedance': 'ByteDance',
  'iflytek': 'IFlyTekCloud',
  'volcengine': 'Volcengine',
  'zhipu': 'Zhipu',
  'minimax': 'Minimax',
  'sensetime': 'SenseNova',
  'yi': 'Yi',
  'baichuan': 'Baichuan',
  'spark': 'Spark',
  'wenxin': 'Wenxin',
  'hunyuan': 'Hunyuan',
  'tiangong': 'Tiangong',
  'xuanyuan': 'Xuanyuan',
  'yuanbao': 'Yuanbao',
  'stability': 'Stability',
  'seedream': 'OpenAI' // 暂时使用 OpenAI 图标，因为没有专门的 Seedream 图标
}

// 提供商显示名称映射
const providerDisplayNameMap: Record<string, string> = {
  'openai': 'OpenAI',
  'google': 'Google',
  'claude': 'Anthropic Claude',
  'anthropic': 'Anthropic',
  'moonshot': 'Moonshot AI',
  'chatglm': 'ChatGLM',
  'qwen': 'Qwen (通义千问)',
  'deepseek': 'DeepSeek',
  'grok': 'Grok (xAI)',
  'doubao': '豆包 (Doubao)',
  'microsoft': 'Microsoft',
  'meta': 'Meta',
  'cohere': 'Cohere',
  'mistral': 'Mistral AI',
  'huggingface': 'Hugging Face',
  'nvidia': 'NVIDIA',
  'aws': 'Amazon Web Services',
  'azure': 'Microsoft Azure',
  'bedrock': 'Amazon Bedrock',
  'gemini': 'Google Gemini',
  'palm': 'Google PaLM',
  'bard': 'Google Bard',
  'bing': 'Microsoft Bing',
  'baidu': '百度',
  'alibaba': '阿里巴巴',
  'tencent': '腾讯',
  'bytedance': '字节跳动',
  'iflytek': '科大讯飞',
  'volcengine': '火山引擎',
  'zhipu': '智谱AI',
  'minimax': 'MiniMax',
  'sensetime': '商汤科技',
  'yi': '零一万物',
  'baichuan': '百川智能',
  'spark': '讯飞星火',
  'wenxin': '文心一言',
  'hunyuan': '腾讯混元',
  'tiangong': '天工AI',
  'xuanyuan': '轩辕',
  'yuanbao': '元宝',
  'stability': 'Stability AI',
  'seedream': 'Seedream AI'
}

// 提供商描述映射
const providerDescriptionMap: Record<string, string> = {
  'openai': 'OpenAI 官方 API 服务，提供 GPT 系列模型',
  'google': 'Google 官方 AI 服务，提供 Gemini 系列模型',
  'claude': 'Anthropic Claude 系列模型，专注于安全和有用的AI助手',
  'anthropic': 'Anthropic 官方 API 服务',
  'moonshot': 'Moonshot AI 提供的大语言模型服务',
  'chatglm': '智谱AI ChatGLM 系列模型',
  'qwen': '阿里云通义千问系列模型',
  'deepseek': 'DeepSeek 深度求索系列模型',
  'grok': 'xAI Grok 系列模型',
  'doubao': '字节跳动豆包系列模型',
  'microsoft': 'Microsoft 官方 AI 服务',
  'meta': 'Meta 官方 AI 模型服务',
  'cohere': 'Cohere 官方 API 服务',
  'mistral': 'Mistral AI 官方模型服务',
  'huggingface': 'Hugging Face 模型托管服务',
  'nvidia': 'NVIDIA 官方 AI 服务',
  'aws': 'Amazon Web Services AI 服务',
  'azure': 'Microsoft Azure AI 服务',
  'bedrock': 'Amazon Bedrock 托管服务',
  'gemini': 'Google Gemini 系列模型',
  'palm': 'Google PaLM 系列模型',
  'bard': 'Google Bard AI 助手',
  'bing': 'Microsoft Bing AI 搜索',
  'baidu': '百度AI开放平台',
  'alibaba': '阿里巴巴AI服务',
  'tencent': '腾讯AI开放平台',
  'bytedance': '字节跳动AI服务',
  'iflytek': '科大讯飞AI开放平台',
  'volcengine': '火山引擎AI服务',
  'zhipu': '智谱AI开放平台',
  'minimax': 'MiniMax AI服务',
  'sensetime': '商汤科技AI服务',
  'yi': '零一万物AI服务',
  'baichuan': '百川智能AI服务',
  'spark': '讯飞星火认知大模型',
  'wenxin': '百度文心一言',
  'hunyuan': '腾讯混元大模型',
  'tiangong': '昆仑万维天工AI',
  'xuanyuan': '轩辕AI服务',
  'yuanbao': '字节跳动元宝AI',
  'stability': 'Stability AI 图像生成模型服务',
  'seedream': 'Seedream AI 多模态模型服务'
}

// 提供商官网映射
const providerWebsiteMap: Record<string, string> = {
  'openai': 'https://openai.com',
  'google': 'https://ai.google.dev',
  'claude': 'https://www.anthropic.com',
  'anthropic': 'https://www.anthropic.com',
  'moonshot': 'https://www.moonshot.cn',
  'chatglm': 'https://www.zhipuai.cn',
  'qwen': 'https://tongyi.aliyun.com',
  'deepseek': 'https://www.deepseek.com',
  'grok': 'https://x.ai',
  'doubao': 'https://www.volcengine.com/product/doubao',
  'microsoft': 'https://azure.microsoft.com/en-us/products/ai-services',
  'meta': 'https://ai.meta.com',
  'cohere': 'https://cohere.com',
  'mistral': 'https://mistral.ai',
  'huggingface': 'https://huggingface.co',
  'nvidia': 'https://www.nvidia.com/en-us/ai',
  'aws': 'https://aws.amazon.com/ai',
  'azure': 'https://azure.microsoft.com/en-us/products/ai-services',
  'bedrock': 'https://aws.amazon.com/bedrock',
  'gemini': 'https://gemini.google.com',
  'palm': 'https://ai.google.dev',
  'bard': 'https://bard.google.com',
  'bing': 'https://www.bing.com',
  'baidu': 'https://ai.baidu.com',
  'alibaba': 'https://www.aliyun.com/product/ai',
  'tencent': 'https://ai.qq.com',
  'bytedance': 'https://www.volcengine.com',
  'iflytek': 'https://www.xfyun.cn',
  'volcengine': 'https://www.volcengine.com',
  'zhipu': 'https://www.zhipuai.cn',
  'minimax': 'https://www.minimax.chat',
  'sensetime': 'https://www.sensetime.com',
  'yi': 'https://www.01.ai',
  'baichuan': 'https://www.baichuan-ai.com',
  'spark': 'https://xinghuo.xfyun.cn',
  'wenxin': 'https://yiyan.baidu.com',
  'hunyuan': 'https://hunyuan.tencent.com',
  'tiangong': 'https://tiangong.kunlun.com',
  'xuanyuan': 'https://xuanyuan.ai',
  'yuanbao': 'https://www.doubao.com'
}

// 根据模型ID推断模型类型
function inferModelType(modelId: string): 'chat' | 'completion' | 'embedding' | 'image' | 'tts' | 'sst' {
  const id = modelId.toLowerCase()
  
  if (id.includes('embedding') || id.includes('embed')) {
    return 'embedding'
  }
  if (id.includes('dall-e') || id.includes('image') || id.includes('vision') || id.includes('sora')) {
    return 'image'
  }
  if (id.includes('tts') || id.includes('speech')) {
    return 'tts'
  }
  if (id.includes('whisper') || id.includes('sst')) {
    return 'sst'
  }
  
  return 'chat'
}

// 根据模型ID推断能力
function inferModelAbilities(modelId: string) {
  const id = modelId.toLowerCase()
  const abilities: any = {}
  
  if (id.includes('vision') || id.includes('4o') || id.includes('4.1') || id.includes('gemini') || id.includes('claude-3')) {
    abilities.vision = true
  }
  
  if (id.includes('gpt-4') || id.includes('gpt-3.5') || id.includes('gemini') || id.includes('claude')) {
    abilities.functionCall = true
  }
  
  return Object.keys(abilities).length > 0 ? abilities : undefined
}

// 根据模型ID推断上下文窗口大小
function inferContextWindow(modelId: string): number {
  const id = modelId.toLowerCase()
  
  if (id.includes('32k')) return 32768
  if (id.includes('128k')) return 131072
  if (id.includes('256k')) return 262144
  if (id.includes('16k')) return 16384
  if (id.includes('8k')) return 8192
  if (id.includes('4k')) return 4096
  
  // 根据模型系列推断
  if (id.includes('gpt-4o') || id.includes('gpt-4.1')) return 128000
  if (id.includes('gpt-4')) return 8192
  if (id.includes('gpt-3.5')) return 4096
  if (id.includes('gemini-1.5')) return 1000000
  if (id.includes('gemini-2')) return 1000000
  if (id.includes('gemini')) return 32768
  if (id.includes('claude-3')) return 200000
  if (id.includes('claude')) return 100000
  if (id.includes('moonshot')) {
    if (id.includes('128k')) return 131072
    if (id.includes('32k')) return 32768
    if (id.includes('8k')) return 8192
    return 32768
  }
  
  return 4096 // 默认值
}

// 生成模型显示名称
function generateModelDisplayName(modelId: string): string {
  // 特殊映射
  const specialNames: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet (Legacy)',
    'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-pro': 'Gemini Pro',
    'moonshot-v1-32k': 'Moonshot v1 32K',
    'moonshot-v1-128k': 'Moonshot v1 128K',
    'moonshot-v1-8k': 'Moonshot v1 8K',
    'o1-preview': 'o1-preview',
    'o1-mini': 'o1-mini',
    'o1': 'o1',
    'o1-pro': 'o1-pro',
    'o3-mini': 'o3-mini',
    'o3': 'o3',
    'o4-mini': 'o4-mini',
    'glm-4': 'GLM-4',
    'glm-3-turbo': 'GLM-3 Turbo',
    'glm-4-flash': 'GLM-4 Flash'
  }
  
  if (specialNames[modelId]) {
    return specialNames[modelId]
  }
  
  // 通用处理
  return modelId
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

// 生成模型描述
function generateModelDescription(modelId: string, provider: string): string {
  const id = modelId.toLowerCase()
  
  // 根据模型特征生成描述
  if (id.includes('o1') || id.includes('o3') || id.includes('o4')) {
    return '具备推理能力的高级AI模型，适合复杂问题解决和深度思考任务'
  }
  if (id.includes('gpt-4o')) {
    return '多模态AI模型，支持文本、图像和语音处理，具备强大的理解和生成能力'
  }
  if (id.includes('gpt-4')) {
    return '强大的大语言模型，适合复杂的对话、创作和分析任务'
  }
  if (id.includes('gpt-3.5')) {
    return '快速高效的语言模型，适合日常对话和文本处理任务'
  }
  if (id.includes('claude')) {
    return '注重安全性和有用性的AI助手，擅长长文本理解和分析'
  }
  if (id.includes('gemini')) {
    return 'Google开发的多模态AI模型，支持文本、图像和代码理解'
  }
  if (id.includes('moonshot')) {
    return 'Moonshot AI开发的长上下文语言模型'
  }
  if (id.includes('glm')) {
    return '智谱AI开发的对话语言模型，支持中英文对话'
  }
  if (id.includes('qwen') || id.includes('Qwen')) {
    return '阿里云通义千问系列模型，支持多语言对话和推理'
  }
  if (id.includes('deepseek')) {
    return 'DeepSeek开发的高性能语言模型'
  }
  if (id.includes('grok')) {
    return 'xAI开发的AI模型，具备实时信息获取能力'
  }
  if (id.includes('doubao')) {
    return '字节跳动豆包系列AI模型'
  }
  if (id.includes('stable-diffusion') || id.includes('stability')) {
    return 'Stability AI开发的高质量图像生成模型'
  }
  if (id.includes('seedream')) {
    return 'Seedream AI开发的多模态生成模型'
  }
  if (id.includes('sora')) {
    return 'OpenAI开发的视频生成模型'
  }
  if (id.includes('dall-e') || id.includes('gpt-image')) {
    return 'OpenAI开发的图像生成模型'
  }
  
  return `${providerDisplayNameMap[provider] || provider} 提供的AI模型`
}

// 处理模型数据，按提供商分组
export function processModelData(): Provider[] {
  // 首先修正数据
  const correctedModelData = correctModelData(modelData)
  
  // 按 owned_by 分组模型
  const modelsByProvider: Record<string, any[]> = {}
  
  correctedModelData.forEach(model => {
    const provider = model.owned_by
    if (!modelsByProvider[provider]) {
      modelsByProvider[provider] = []
    }
    modelsByProvider[provider].push(model)
  })
  
  // 转换为 Provider 格式
  const providers: Provider[] = Object.entries(modelsByProvider).map(([providerId, models]) => {
    const iconName = providerIconMap[providerId] as IconName
    
    const processedModels: Model[] = models.map(model => ({
      id: model.id,
      displayName: generateModelDisplayName(model.id),
      description: generateModelDescription(model.id, providerId),
      provider: providerId,
      type: model.type || inferModelType(model.id),
      enabled: true,
      contextWindowTokens: inferContextWindow(model.id),
      maxOutput: 4096, // 默认值，可根据具体模型调整
      abilities: inferModelAbilities(model.id),
      releasedAt: new Date(model.created * 1000).toISOString().split('T')[0]
    }))
    
    return {
      id: providerId,
      name: providerId,
      displayName: providerDisplayNameMap[providerId] || providerId,
      description: providerDescriptionMap[providerId] || `${providerId} AI服务提供商`,
      apiUrl: `https://api.${providerId}.com/v1`, // 默认API地址
      apiKey: '',
      enabled: true,
      icon: iconName ? iconName : undefined,
      website: providerWebsiteMap[providerId] || `https://${providerId}.com`,
      models: processedModels
    }
  })
  
  // 按模型数量排序，模型多的排在前面
  return providers.sort((a, b) => b.models.length - a.models.length)
}

// 获取特定提供商的图标组件
export function getProviderIcon(providerId: string) {
  const iconName = providerIconMap[providerId]
  return iconName ? iconMap[iconName] : null
}

// 获取所有支持的提供商列表
export function getSupportedProviders(): string[] {
  return Object.keys(providerIconMap)
} 