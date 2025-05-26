import { AIService, AIRequestParams, AIRequestResponse } from '@/types/ai';

/**
 * AI服务基类，实现通用的功能和属性
 */
export abstract class AIServiceBase implements AIService {
  protected apiKey: string = '';
  protected baseUrl: string = '';
  protected options: Record<string, any> = {};

  /**
   * 设置API密钥
   * @param apiKey API密钥
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * 设置API基础URL
   * @param baseUrl API基础URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * 设置其他选项参数
   * @param options 选项参数
   */
  setOptions(options: Record<string, any>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 发送聊天完成请求
   * @param params 请求参数
   */
  abstract chatCompletion(params: AIRequestParams): Promise<AIRequestResponse>;

  /**
   * 流式聊天完成
   * @param params 请求参数
   * @param onMessage 消息回调
   * @param onError 错误回调
   * @param onComplete 完成回调
   */
  abstract streamChatCompletion(
    params: AIRequestParams,
    onMessage: (chunk: AIRequestResponse) => void,
    onError: (error: any) => void,
    onComplete: () => void
  ): Promise<void>;

  /**
   * 获取可用模型列表
   */
  abstract listModels(): Promise<string[]>;

  /**
   * 将应用内部消息格式转换为AI服务消息格式
   * @param messages 应用内部消息
   */
  protected formatMessages(messages: any[]): AIRequestParams['messages'] {
    return messages.map(msg => {
      // 根据不同类型的消息进行格式转换
      const role = msg.role || 'user';
      
      let content = '';
      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        // 处理可能的多模态内容数组
        content = msg.content
          .filter((block: any) => block.type === 'text' || block.type === 'content')
          .map((block: any) => block.content || '')
          .join('\n');
      } else if (typeof msg.content === 'object' && msg.content?.text) {
        content = msg.content.text;
      }

      return {
        role: role as 'system' | 'user' | 'assistant' | 'function',
        content: content
      };
    });
  }

  /**
   * 生成请求头
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  /**
   * 解析流式响应数据
   * @param chunk 数据块
   */
  protected parseStreamChunk(chunk: string): AIRequestResponse | null {
    if (!chunk.trim()) return null;
    
    // 移除"data: "前缀，并处理可能的多行数据
    const lines = chunk
      .split('\n')
      .filter(line => line.trim() !== '' && line.startsWith('data: '))
      .map(line => line.replace(/^data: /, ''));
    
    if (lines.length === 0) return null;
    
    try {
      for (const line of lines) {
        if (line === '[DONE]') return null;
        
        const parsedData = JSON.parse(line);
        return parsedData;
      }
    } catch (e) {
      console.error('解析流式响应失败:', e);
    }
    
    return null;
  }
} 