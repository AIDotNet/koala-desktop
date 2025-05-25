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
            abilities: {
              reasoning: true,
            },
            contextWindowTokens: 65_536,
            description:
              'DeepSeek-R1 是一款强化学习（RL）驱动的推理模型，解决了模型中的重复性和可读性问题。在 RL 之前，DeepSeek-R1 引入了冷启动数据，进一步优化了推理性能。它在数学、代码和推理任务中与 OpenAI-o1 表现相当，并且通过精心设计的训练方法，提升了整体效果。',
            displayName: 'DeepSeek R1',
            enabled: true,
            id: 'deepseek-r1',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 65_536,
            description:
              'DeepSeek-V3 是一个强大的专家混合（MoE）语言模型，总参数量为 671B，每个 Token 激活 37B 参数。该模型采用多头潜在注意力（MLA）和 DeepSeekMoE 架构，实现了高效推理和经济训练，并在前代 DeepSeek-V3 的基础上显著提升了性能。',
            displayName: 'DeepSeek V3 671B',
            id: 'deepseek-v3',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 128_000,
            description:
              'Llama 3.1 是 Meta 推出的领先模型，支持高达 405B 参数，可应用于复杂对话、多语言翻译和数据分析领域。',
            displayName: 'Llama 3.1 8B',
            id: 'llama3.1',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 128_000,
            description:
              'Llama 3.1 是 Meta 推出的领先模型，支持高达 405B 参数，可应用于复杂对话、多语言翻译和数据分析领域。',
            displayName: 'Llama 3.1 70B',
            id: 'llama3.1:70b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 128_000,
            description:
              'Llama 3.1 是 Meta 推出的领先模型，支持高达 405B 参数，可应用于复杂对话、多语言翻译和数据分析领域。',
            displayName: 'Llama 3.1 405B',
            id: 'llama3.1:405b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 16_384,
            description:
              'Code Llama 是一款专注于代码生成和讨论的 LLM，结合广泛的编程语言支持，适用于开发者环境。',
            displayName: 'Code Llama 7B',
            id: 'codellama',
            provider:'ollama',
            type: 'chat',
          },
          {
            contextWindowTokens: 16_384,
            description:
              'Code Llama 是一款专注于代码生成和讨论的 LLM，结合广泛的编程语言支持，适用于开发者环境。',
            displayName: 'Code Llama 13B',
            id: 'codellama:13b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 16_384,
            description:
              'Code Llama 是一款专注于代码生成和讨论的 LLM，结合广泛的编程语言支持，适用于开发者环境。',
            displayName: 'Code Llama 34B',
            id: 'codellama:34b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 16_384,
            description:
              'Code Llama 是一款专注于代码生成和讨论的 LLM，结合广泛的编程语言支持，适用于开发者环境。',
            displayName: 'Code Llama 70B',
            id: 'codellama:70b',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
              reasoning: true,
            },
            contextWindowTokens: 128_000,
            description:
              'QwQ 是 Qwen 系列的推理模型。与传统的指令调优模型相比，QwQ 具备思考和推理的能力，能够在下游任务中，尤其是困难问题上，显著提升性能。QwQ-32B 是中型推理模型，能够在与最先进的推理模型（如 DeepSeek-R1、o1-mini）竞争时取得可观的表现。',
            displayName: 'QwQ 32B',
            id: 'qwq',
            releasedAt: '2024-11-28',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 65_536,
            description: 'Qwen3 是阿里巴巴的新一代大规模语言模型，以优异的性能支持多元化的应用需求。',
            displayName: 'Qwen3 7B',
            enabled: true,
            id: 'qwen3',
            type: 'chat',
            provider:'ollama',
          },
        
          {
            contextWindowTokens: 128_000,
            description: 'Qwen2.5 是阿里巴巴的新一代大规模语言模型，以优异的性能支持多元化的应用需求。',
            displayName: 'Qwen2.5 0.5B',
            id: 'qwen2.5:0.5b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 128_000,
            description: 'Qwen2.5 是阿里巴巴的新一代大规模语言模型，以优异的性能支持多元化的应用需求。',
            displayName: 'Qwen2.5 1.5B',
            id: 'qwen2.5:1.5b',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 128_000,
            description: 'Qwen2.5 是阿里巴巴的新一代大规模语言模型，以优异的性能支持多元化的应用需求。',
            displayName: 'Qwen2.5 7B',
            id: 'qwen2.5',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 128_000,
            description: 'Qwen2.5 是阿里巴巴的新一代大规模语言模型，以优异的性能支持多元化的应用需求。',
            displayName: 'Qwen2.5 72B',
            id: 'qwen2.5:72b',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 65_536,
            description: 'CodeQwen1.5 是基于大量代码数据训练的大型语言模型，专为解决复杂编程任务。',
            displayName: 'CodeQwen1.5 7B',
            id: 'codeqwen',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 128_000,
            description: 'Qwen2 是阿里巴巴的新一代大规模语言模型，以优异的性能支持多元化的应用需求。',
            displayName: 'Qwen2 0.5B',
            id: 'qwen2:0.5b',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 128_000,
            description: 'Qwen2 是阿里巴巴的新一代大规模语言模型，以优异的性能支持多元化的应用需求。',
            displayName: 'Qwen2 1.5B',
            id: 'qwen2:1.5b',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 128_000,
            description: 'Qwen2 是阿里巴巴的新一代大规模语言模型，以优异的性能支持多元化的应用需求。',
            displayName: 'Qwen2 7B',
            id: 'qwen2',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 128_000,
            description: 'Qwen2 是阿里巴巴的新一代大规模语言模型，以优异的性能支持多元化的应用需求。',
            displayName: 'Qwen2 72B',
            id: 'qwen2:72b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 8192,
            description: 'Gemma 2 是 Google 推出的高效模型，涵盖从小型应用到复杂数据处理的多种应用场景。',
            displayName: 'Gemma 2 2B',
            id: 'gemma2:2b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 8192,
            description: 'Gemma 2 是 Google 推出的高效模型，涵盖从小型应用到复杂数据处理的多种应用场景。',
            displayName: 'Gemma 2 9B',
            id: 'gemma2',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 8192,
            description: 'Gemma 2 是 Google 推出的高效模型，涵盖从小型应用到复杂数据处理的多种应用场景。',
            displayName: 'Gemma 2 27B',
            id: 'gemma2:27b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 8192,
            description: 'CodeGemma 专用于不同编程任务的轻量级语言模型，支持快速迭代和集成。',
            displayName: 'CodeGemma 2B',
            id: 'codegemma:2b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 8192,
            description: 'CodeGemma 专用于不同编程任务的轻量级语言模型，支持快速迭代和集成。',
            displayName: 'CodeGemma 7B',
            id: 'codegemma',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 128_000,
            description: 'Phi-3 是微软推出的轻量级开放模型，适用于高效集成和大规模知识推理。',
            displayName: 'Phi-3 3.8B',
            id: 'phi3',
            provider:'ollama',
            type: 'chat',
          },
          {
            contextWindowTokens: 128_000,
            description: 'Phi-3 是微软推出的轻量级开放模型，适用于高效集成和大规模知识推理。',
            displayName: 'Phi-3 14B',
            id: 'phi3:14b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 32_768,
            description:
              'WizardLM 2 是微软AI提供的语言模型，在复杂对话、多语言、推理和智能助手领域表现尤为出色。',
            displayName: 'WizardLM 2 7B',
            id: 'wizardlm2',
            provider:'ollama',
            type: 'chat',
          },
          {
            contextWindowTokens: 65_536,
            description:
              'WizardLM 2 是微软AI提供的语言模型，在复杂对话、多语言、推理和智能助手领域表现尤为出色。',
            displayName: 'WizardLM 2 8x22B',
            id: 'wizardlm2:8x22b',
            provider:'ollama',
            type: 'chat',
          },
          {
            contextWindowTokens: 32_768,
            description: 'MathΣtral 专为科学研究和数学推理设计，提供有效的计算能力和结果解释。',
            displayName: 'MathΣtral 7B',
            id: 'mathstral',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 32_768,
            description: 'Mistral 是 Mistral AI 发布的 7B 模型，适合多变的语言处理需求。',
            displayName: 'Mistral 7B',
            id: 'mistral',
            provider:'ollama',
            type: 'chat',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 32_768,
            description:
              'Mixtral 是 Mistral AI 的专家模型，具有开源权重，并在代码生成和语言理解方面提供支持。',
            displayName: 'Mixtral 8x7B',
            id: 'mixtral',
            type: 'chat', 
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 65_536,
            description:
              'Mixtral 是 Mistral AI 的专家模型，具有开源权重，并在代码生成和语言理解方面提供支持。',
            displayName: 'Mixtral 8x22B',
            id: 'mixtral:8x22b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 128_000,
            description:
              'Mixtral Large 是 Mistral 的旗舰模型，结合代码生成、数学和推理的能力，支持 128k 上下文窗口。',
            displayName: 'Mixtral Large 123B',
            id: 'mistral-large',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 128_000,
            description: 'Mistral Nemo 由 Mistral AI 和 NVIDIA 合作推出，是高效性能的 12B 模型。',
            displayName: 'Mixtral Nemo 12B',
            id: 'mistral-nemo',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 32_768,
            description: 'Codestral 是 Mistral AI 的首款代码模型，为代码生成任务提供优异支持。',
            displayName: 'Codestral 22B',
            id: 'codestral',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 8192,
            description: 'Aya 23 是 Cohere 推出的多语言模型，支持 23 种语言，为多元化语言应用提供便利。',
            displayName: 'Aya 23 8B',
            id: 'aya',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 8192,
            description: 'Aya 23 是 Cohere 推出的多语言模型，支持 23 种语言，为多元化语言应用提供便利。',
            displayName: 'Aya 23 35B',
            id: 'aya:35b',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 131_072,
            description: 'Command R 是优化用于对话和长上下文任务的LLM，特别适合动态交互与知识管理。',
            displayName: 'Command R 35B',
            id: 'command-r',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 131_072,
            description: 'Command R+ 是一款高性能的大型语言模型，专为真实企业场景和复杂应用而设计。',
            displayName: 'Command R+ 104B',
            id: 'command-r-plus',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 32_768,
            description: 'DeepSeek V2 是高效的 Mixture-of-Experts 语言模型，适用于经济高效的处理需求。',
            displayName: 'DeepSeek V2 16B',
            id: 'deepseek-v2',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 128_000,
            description: 'DeepSeek V2 236B 是 DeepSeek 的设计代码模型，提供强大的代码生成能力。',
            displayName: 'DeepSeek V2 236B',
            id: 'deepseek-v2:236b',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 128_000,
            description:
              'DeepSeek Coder V2 是开源的混合专家代码模型，在代码任务方面表现优异，与 GPT4-Turbo 相媲美。',
            displayName: 'DeepSeek Coder V2 16B',
            id: 'deepseek-coder-v2',
            type: 'chat',
            provider:'ollama',
          },
          {
            contextWindowTokens: 128_000,
            description:
              'DeepSeek Coder V2 是开源的混合专家代码模型，在代码任务方面表现优异，与 GPT4-Turbo 相媲美。',
            displayName: 'DeepSeek Coder V2 236B',
            id: 'deepseek-coder-v2:236b',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              vision: true,
            },
            contextWindowTokens: 4096,
            description: 'LLaVA 是结合视觉编码器和 Vicuna 的多模态模型，用于强大的视觉和语言理解。',
            displayName: 'LLaVA 7B',
            id: 'llava',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              vision: true,
            },
            contextWindowTokens: 4096,
            description: 'LLaVA 是结合视觉编码器和 Vicuna 的多模态模型，用于强大的视觉和语言理解。',
            displayName: 'LLaVA 13B',
            id: 'llava:13b',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              vision: true,
            },
            contextWindowTokens: 4096,
            description: 'LLaVA 是结合视觉编码器和 Vicuna 的多模态模型，用于强大的视觉和语言理解。',
            displayName: 'LLaVA 34B',
            id: 'llava:34b',
            type: 'chat',
            provider:'ollama',
          },
          {
            abilities: {
              vision: true,
            },
            contextWindowTokens: 128_000,
            description:
              'MiniCPM-V 是 OpenBMB 推出的新一代多模态大模型，具备卓越的 OCR 识别和多模态理解能力，支持广泛的应用场景。',
            displayName: 'MiniCPM-V 8B',
            id: 'minicpm-v',
            type: 'chat',
            provider:'ollama',
          },
        ],
        icon: 'Ollama',
        website:'https://ollama.com'
      },
      {
        id:'deepseek',
        name:'deepseek',
        displayName:'DeepSeek',
        description:'DeepSeek API 提供商',
        apiUrl:'https://api.deepseek.com/v1',
        apiKey:'',
        enabled:true,
        models:[
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 65_536,
            description:
              '最新模型 DeepSeek-V3 多项评测成绩超越 Qwen2.5-72B 和 Llama-3.1-405B 等开源模型，性能对齐领军闭源模型 GPT-4o 与 Claude-3.5-Sonnet。',
            displayName: 'DeepSeek V3',
            enabled: true,
            id: 'deepseek-chat',
            provider:'deepseek',
            pricing: {
              cachedInput: 0.5,
              input: 2,
              output: 8,
            },
            releasedAt: '2024-12-26',
            type: 'chat',
          },
          {
            abilities: {
              reasoning: true,
            },
            contextWindowTokens: 65_536,
            description:
              'DeepSeek 推出的推理模型。在输出最终回答之前，模型会先输出一段思维链内容，以提升最终答案的准确性。',
            displayName: 'DeepSeek R1',
            enabled: true,
            id: 'deepseek-reasoner',
            provider:'deepseek',
            pricing: {
              cachedInput: 1,
              input: 4,
              output: 16,
            },
            releasedAt: '2025-01-20',
            type: 'chat',
          },
        ],
        icon: 'DeepSeek',
        website:'https://deepseek.com'
      },
      {
        id:'github',
        name:'github',
        displayName:'GitHub',
        description:'GitHub API 提供商',
        apiUrl:'https://models.github.ai/orgs',
        apiKey:'',
        enabled:true,
        models:[
          {
            abilities: {
              functionCall: true,
              reasoning: true,
              vision: true,
            },
            contextWindowTokens: 200_000,
            description:
              'o3 是一款全能强大的模型，在多个领域表现出色。它为数学、科学、编程和视觉推理任务树立了新标杆。它也擅长技术写作和指令遵循。用户可利用它分析文本、代码和图像，解决多步骤的复杂问题。',
            displayName: 'o3',
            id: 'o3',
            maxOutput: 100_000,
            pricing: {
              cachedInput: 2.5,
              input: 10,
              output: 40,
            },
            releasedAt: '2025-04-17',
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              reasoning: true,
              vision: true,
            },
            contextWindowTokens: 200_000,
            description:
              'o4-mini 是我们最新的小型 o 系列模型。 它专为快速有效的推理而优化，在编码和视觉任务中表现出极高的效率和性能。',
            displayName: 'o4-mini',
            enabled: true,
            id: 'o4-mini',
            maxOutput: 100_000,
            pricing: {
              cachedInput: 0.275,
              input: 1.1,
              output: 4.4,
            },
            releasedAt: '2025-04-17',
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              vision: true,
            },
            contextWindowTokens: 1_047_576,
            description: 'GPT-4.1 是我们用于复杂任务的旗舰模型。它非常适合跨领域解决问题。',
            displayName: 'GPT-4.1',
            enabled: true,
            id: 'gpt-4.1',
            maxOutput: 32_768,
            pricing: {
              cachedInput: 0.5,
              input: 2,
              output: 8,
            },
            releasedAt: '2025-04-14',
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              vision: true,
            },
            contextWindowTokens: 1_047_576,
            description:
              'GPT-4.1 mini 提供了智能、速度和成本之间的平衡，使其成为许多用例中有吸引力的模型。',
            displayName: 'GPT-4.1 mini',
            enabled: true,
            id: 'gpt-4.1-mini',
            maxOutput: 32_768,
            pricing: {
              cachedInput: 0.1,
              input: 0.4,
              output: 1.6,
            },
            releasedAt: '2025-04-14',
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              vision: true,
            },
            contextWindowTokens: 1_047_576,
            description: 'GPT-4.1 nano 是最快，最具成本效益的GPT-4.1模型。',
            displayName: 'GPT-4.1 nano',
            id: 'gpt-4.1-nano',
            maxOutput: 32_768,
            pricing: {
              cachedInput: 0.025,
              input: 0.1,
              output: 0.4,
            },
            releasedAt: '2025-04-14',
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              reasoning: true,
            },
            contextWindowTokens: 200_000,
            displayName: 'OpenAI o4-mini',
            id: 'o4-mini',
            maxOutput: 100_000,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              reasoning: true,
            },
            contextWindowTokens: 200_000,
            displayName: 'OpenAI o3',
            enabled: true,
            id: 'o3',
            maxOutput: 100_000,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              reasoning: true,
            },
            contextWindowTokens: 200_000,
            description:
              'o3-mini 是我们最新的小型推理模型，在与 o1-mini 相同的成本和延迟目标下提供高智能。',
            displayName: 'o3-mini',
            id: 'o3-mini',
            maxOutput: 100_000,
            pricing: {
              cachedInput: 0.55,
              input: 1.1,
              output: 4.4,
            },
            releasedAt: '2025-01-31',
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              reasoning: true,
            },
            contextWindowTokens: 128_000,
            description:
              'o1-mini是一款针对编程、数学和科学应用场景而设计的快速、经济高效的推理模型。该模型具有128K上下文和2023年10月的知识截止日期。',
            displayName: 'o1-mini',
            id: 'o1-mini',
            maxOutput: 65_536,
            pricing: {
              cachedInput: 0.55,
              input: 1.1,
              output: 4.4,
            },
            releasedAt: '2024-09-12',
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              reasoning: true,
              vision: true,
            },
            contextWindowTokens: 200_000,
            description:
              'o1是OpenAI新的推理模型，支持图文输入并输出文本，适用于需要广泛通用知识的复杂任务。该模型具有200K上下文和2023年10月的知识截止日期。',
            displayName: 'o1',
            id: 'o1',
            maxOutput: 100_000,
            pricing: {
              cachedInput: 7.5,
              input: 15,
              output: 60,
            },
            releasedAt: '2024-12-17',
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              reasoning: true,
            },
            contextWindowTokens: 128_000,
            description:
              'o1是OpenAI新的推理模型，适用于需要广泛通用知识的复杂任务。该模型具有128K上下文和2023年10月的知识截止日期。',
            displayName: 'o1-preview',
            id: 'o1-preview',
            maxOutput: 32_768,
            pricing: {
              input: 15,
              output: 60,
            },
            releasedAt: '2024-09-12',
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              vision: true,
            },
            contextWindowTokens: 1_074_176,
            displayName: 'OpenAI GPT-4.1',
            id: 'gpt-4.1',
            maxOutput: 33_792,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              vision: true,
            },
            contextWindowTokens: 1_074_176,
            displayName: 'OpenAI GPT-4.1 mini',
            id: 'gpt-4.1-mini',
            maxOutput: 33_792,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              vision: true,
            },
            contextWindowTokens: 1_074_176,
            displayName: 'OpenAI GPT-4.1 nano',
            id: 'gpt-4.1-nano',
            maxOutput: 33_792,
            provider:'github',
            type: 'chat',
          },
          {
            abilities: {
              functionCall: true,
              vision: true,
            },
            contextWindowTokens: 134_144,
            description: '一种经济高效的AI解决方案，适用于多种文本和图像任务。',
            displayName: 'GPT-4o mini',
            id: 'gpt-4o-mini',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
              vision: true,
            },
            contextWindowTokens: 134_144,
            description: 'OpenAI GPT-4系列中最先进的多模态模型，可以处理文本和图像输入。',
            displayName: 'GPT-4o',
            id: 'gpt-4o',
            maxOutput: 16_384,
            provider:'github',
            type: 'chat',
          },
          {
            abilities: {
              reasoning: true,
            },
            contextWindowTokens: 128_000,
            displayName: 'MAI DS R1',
            id: 'MAI-DS-R1',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              reasoning: true,
            },
            contextWindowTokens: 128_000,
            displayName: 'DeepSeek R1',
            id: 'DeepSeek-R1',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 128_000,
            displayName: 'DeepSeek V3',
            id: 'DeepSeek-V3-0324',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 262_144,
            description:
              '一个52B参数（12B活跃）的多语言模型，提供256K长上下文窗口、函数调用、结构化输出和基于事实的生成。',
            displayName: 'AI21 Jamba 1.5 Mini',
            id: 'ai21-jamba-1.5-mini',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 262_144,
            description:
              '一个398B参数（94B活跃）的多语言模型，提供256K长上下文窗口、函数调用、结构化输出和基于事实的生成。',
            displayName: 'AI21 Jamba 1.5 Large',
            id: 'ai21-jamba-1.5-large',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description: 'Command R是一个可扩展的生成模型，旨在针对RAG和工具使用，使企业能够实现生产级AI。',
            displayName: 'Cohere Command R',
            id: 'cohere-command-r',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description: 'Command R+是一个最先进的RAG优化模型，旨在应对企业级工作负载。',
            displayName: 'Cohere Command R+',
            id: 'cohere-command-r-plus',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description:
              'Mistral Nemo是一种尖端的语言模型（LLM），在其尺寸类别中拥有最先进的推理、世界知识和编码能力。',
            displayName: 'Mistral Nemo',
            id: 'mistral-nemo',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description: 'Mistral Small可用于任何需要高效率和低延迟的基于语言的任务。',
            displayName: 'Mistral Small',
            id: 'mistral-small',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description:
              'Mistral的旗舰模型，适合需要大规模推理能力或高度专业化的复杂任务（合成文本生成、代码生成、RAG或代理）。',
            displayName: 'Mistral Large',
            id: 'mistral-large',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 262_144,
            displayName: 'Codestral',
            id: 'Codestral-2501',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              vision: true,
            },
            contextWindowTokens: 131_072,
            description: '在高分辨率图像上表现出色的图像推理能力，适用于视觉理解应用。',
            displayName: 'Llama 3.2 11B Vision',
            id: 'llama-3.2-11b-vision-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              vision: true,
            },
            contextWindowTokens: 131_072,
            description: '适用于视觉理解代理应用的高级图像推理能力。',
            displayName: 'Llama 3.2 90B Vision',
            id: 'llama-3.2-90b-vision-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              functionCall: true,
            },
            contextWindowTokens: 32_768,
            description:
              'Llama 3.3 是 Llama 系列最先进的多语言开源大型语言模型，以极低成本体验媲美 405B 模型的性能。基于 Transformer 结构，并通过监督微调（SFT）和人类反馈强化学习（RLHF）提升有用性和安全性。其指令调优版本专为多语言对话优化，在多项行业基准上表现优于众多开源和封闭聊天模型。知识截止日期为 2023 年 12 月',
            displayName: 'Llama 3.3 70B Instruct',
            enabled: true,
            id: 'llama-3.3-70b-instruct',
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 10_240_000,
            displayName: 'Meta Llama 4 Scout 17B',
            id: 'llama-4-Scout-17B-16E-Instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 10_240_000,
            displayName: 'Meta Llama 4 Maverick 17B',
            id: 'llama-4-Maverick-17B-128E-Instruct-FP8',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description:
              'Llama 3.1指令调优的文本模型，针对多语言对话用例进行了优化，在许多可用的开源和封闭聊天模型中，在常见行业基准上表现优异。',
            displayName: 'Meta Llama 3.1 8B',
            id: 'meta-llama-3.1-8b-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description:
              'Llama 3.1指令调优的文本模型，针对多语言对话用例进行了优化，在许多可用的开源和封闭聊天模型中，在常见行业基准上表现优异。',
            displayName: 'Meta Llama 3.1 70B',
            id: 'meta-llama-3.1-70b-instruct',
            maxOutput: 4096,
            provider:'github',
            type: 'chat',
          },
          {
            contextWindowTokens: 131_072,
            description:
              'Llama 3.1指令调优的文本模型，针对多语言对话用例进行了优化，在许多可用的开源和封闭聊天模型中，在常见行业基准上表现优异。',
            displayName: 'Meta Llama 3.1 405B',
            id: 'meta-llama-3.1-405b-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 8192,
            description: '一个多功能的80亿参数模型，针对对话和文本生成任务进行了优化。',
            displayName: 'Meta Llama 3 8B',
            id: 'meta-llama-3-8b-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 8192,
            description: '一个强大的700亿参数模型，在推理、编码和广泛的语言应用方面表现出色。',
            displayName: 'Meta Llama 3 70B',
            id: 'meta-llama-3-70b-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 16_384,
            displayName: 'Phi 4',
            id: 'Phi-4',
            maxOutput: 16_384,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            displayName: 'Phi 3.5 MoE',
            id: 'Phi-3.5-MoE-instruct',
            maxOutput: 4096,
            type: 'chat',
            description:'Phi-3.5 MoE模型的更新版。',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description: 'Phi-3-mini模型的更新版。',
            displayName: 'Phi-3.5-mini 128K',
            id: 'Phi-3.5-mini-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            abilities: {
              vision: true,
            },
            contextWindowTokens: 131_072,
            description: 'Phi-3-vision模型的更新版。',
            displayName: 'Phi-3.5-vision 128K',
            id: 'Phi-3.5-vision-instrust',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 4096,
            description: 'Phi-3家族中最小的成员，针对质量和低延迟进行了优化。',
            displayName: 'Phi-3-mini 4K',
            id: 'Phi-3-mini-4k-instruct',
            maxOutput: 4096,
            provider:'github',
            type: 'chat',
          },
          {
            contextWindowTokens: 131_072,
            description: '相同的Phi-3-mini模型，但具有更大的上下文大小，适用于RAG或少量提示。',
            displayName: 'Phi-3-mini 128K',
            id: 'Phi-3-mini-128k-instruct',
            maxOutput: 4096,
            provider:'github',
            type: 'chat',
          },
          {
            contextWindowTokens: 8192,
            description: '一个70亿参数模型，质量优于Phi-3-mini，重点关注高质量、推理密集型数据。',
            displayName: 'Phi-3-small 8K',
            id: 'Phi-3-small-8k-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description: '相同的Phi-3-small模型，但具有更大的上下文大小，适用于RAG或少量提示。',
            displayName: 'Phi-3-small 128K',
            id: 'Phi-3-small-128k-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 4096,
            description: '一个140亿参数模型，质量优于Phi-3-mini，重点关注高质量、推理密集型数据。',
            displayName: 'Phi-3-medium 4K',
            id: 'Phi-3-medium-4k-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
          {
            contextWindowTokens: 131_072,
            description: '相同的Phi-3-medium模型，但具有更大的上下文大小，适用于RAG或少量提示。',
            displayName: 'Phi-3-medium 128K',
            id: 'Phi-3-medium-128k-instruct',
            maxOutput: 4096,
            type: 'chat',
            provider:'github',
          },
        ]
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