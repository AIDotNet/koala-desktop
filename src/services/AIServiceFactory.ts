import { AIService, AIServiceFactory as IAIServiceFactory } from '@/types/ai';
import { OpenAIService } from './OpenAIService';
import { OllamaService } from './OllamaService';
import { OllamaSDKService } from './OllamaSDKService';
import { DeepSeekService } from './DeepSeekService';

/**
 * AI服务工厂实现
 */
export class AIServiceFactory implements IAIServiceFactory {
  private static instance: AIServiceFactory;
  private serviceCache: Map<string, AIService> = new Map();

  /**
   * 获取工厂单例
   */
  public static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  /**
   * 创建指定类型的AI服务
   * @param type 服务类型
   * @param options 服务选项
   */
  public createService(type: string, options: Record<string, any> = {}): AIService {
    // 生成缓存键
    const cacheKey = this.generateCacheKey(type, options);
    
    // 检查缓存中是否已有此服务实例
    if (this.serviceCache.has(cacheKey)) {
      return this.serviceCache.get(cacheKey)!;
    }
    
    // 创建新的服务实例
    let service: AIService;
    
    switch (type.toLowerCase()) {
      case 'openai':
        service = new OpenAIService(options.apiKey, options.baseUrl);
        break;
      case 'ollama':
        service = new OllamaService(options.apiKey, options.baseUrl);
        break;
      case 'ollama-sdk':
        service = new OllamaSDKService(options.apiKey, options.baseUrl);
        break;
      case 'deepseek':
        service = new DeepSeekService(options.apiKey, options.baseUrl);
        break;
      default:
        throw new Error(`不支持的AI服务类型: ${type}`);
    }
    
    // 设置其他选项
    if (options.extra) {
      service.setOptions(options.extra);
    }
    
    // 缓存服务实例
    this.serviceCache.set(cacheKey, service);
    
    return service;
  }

  /**
   * 清除缓存的服务实例
   * @param type 服务类型，不指定则清除所有
   */
  public clearCache(type?: string): void {
    if (type) {
      // 清除指定类型的服务缓存
      const keysToRemove = Array.from(this.serviceCache.keys())
        .filter(key => key.startsWith(`${type.toLowerCase()}:`));
      
      keysToRemove.forEach(key => {
        this.serviceCache.delete(key);
      });
    } else {
      // 清除所有缓存
      this.serviceCache.clear();
    }
  }

  /**
   * 生成缓存键
   * @param type 服务类型
   * @param options 服务选项
   */
  private generateCacheKey(type: string, options: Record<string, any>): string {
    const { apiKey = '', baseUrl = '' } = options;
    return `${type.toLowerCase()}:${baseUrl}:${apiKey}`;
  }
} 