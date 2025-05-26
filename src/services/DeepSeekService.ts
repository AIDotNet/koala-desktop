import { AIRequestParams, AIRequestResponse } from '@/types/ai';
import { AIServiceBase } from './AIServiceBase';

/**
 * DeepSeek服务实现
 */
export class DeepSeekService extends AIServiceBase {
  constructor(apiKey: string = '', baseUrl: string = 'https://api.deepseek.com/v1') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 发送聊天完成请求
   * @param params 请求参数
   */
  async chatCompletion(params: AIRequestParams): Promise<AIRequestResponse> {
    try {
      const formattedMessages = this.formatMessages(params.messages);
      
      const requestBody = {
        model: params.model,
        messages: formattedMessages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens,
        top_p: params.top_p ?? 1.0,
        frequency_penalty: params.frequency_penalty ?? 0,
        presence_penalty: params.presence_penalty ?? 0,
        functions: params.functions,
        function_call: params.function_call,
        stream: false
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API错误: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DeepSeek请求失败:', error);
      throw error;
    }
  }

  /**
   * 流式聊天完成
   * @param params 请求参数
   * @param onMessage 消息回调
   * @param onError 错误回调
   * @param onComplete 完成回调
   */
  async streamChatCompletion(
    params: AIRequestParams,
    onMessage: (chunk: AIRequestResponse) => void,
    onError: (error: any) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const formattedMessages = this.formatMessages(params.messages);
      
      const requestBody = {
        model: params.model,
        messages: formattedMessages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens,
        top_p: params.top_p ?? 1.0,
        frequency_penalty: params.frequency_penalty ?? 0,
        presence_penalty: params.presence_penalty ?? 0,
        functions: params.functions,
        function_call: params.function_call,
        stream: true
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API错误: ${errorData.error?.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const processStreamData = async () => {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // 处理缓冲区中剩余的数据
            if (buffer.trim()) {
              const chunks = buffer.split('\n\n');
              for (const chunk of chunks) {
                if (chunk.trim()) {
                  const parsedChunk = this.parseStreamChunk(chunk);
                  if (parsedChunk) {
                    onMessage(parsedChunk);
                  }
                }
              }
            }
            
            onComplete();
            break;
          }

          // 将新数据添加到缓冲区并处理完整的消息
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          
          // 处理所有完整的块，保留最后一个可能不完整的块
          buffer = chunks.pop() || '';
          
          for (const chunk of chunks) {
            if (chunk.trim()) {
              const parsedChunk = this.parseStreamChunk(chunk);
              if (parsedChunk) {
                onMessage(parsedChunk);
              }
            }
          }
        }
      };

      await processStreamData();
    } catch (error) {
      console.error('DeepSeek流式请求失败:', error);
      onError(error);
    }
  }

  /**
   * 获取可用模型列表
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API错误: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      // 从响应中提取模型ID列表
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('获取DeepSeek模型列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取请求头，DeepSeek使用自定义请求头格式
   */
  protected override getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'DS-API-Key': this.apiKey
    };
  }
} 