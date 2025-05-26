import { AIRequestParams, AIRequestResponse } from '@/types/ai';
import { AIServiceBase } from './AIServiceBase';

/**
 * Ollama服务实现，兼容OpenAI API格式
 */
export class OllamaService extends AIServiceBase {
  constructor(apiKey: string = '', baseUrl: string = 'http://localhost:11434/v1') {
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
        stream: false
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API错误: ${errorText || response.statusText}`);
      }

      const ollamaResponse = await response.json();
      
      // 将Ollama响应格式转换为统一的AIRequestResponse格式
      return ollamaResponse;
    } catch (error) {
      console.error('Ollama请求失败:', error);
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
        stream: true
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API错误: ${errorText || response.statusText}`);
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
      console.error('Ollama流式请求失败:', error);
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
        const errorText = await response.text();
        throw new Error(`Ollama API错误: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      // 从响应中提取模型名称列表
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('获取Ollama模型列表失败:', error);
      throw error;
    }
  }
} 