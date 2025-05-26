import { AIRequestParams, AIRequestResponse } from '@/types/ai';
import { AIServiceBase } from './AIServiceBase';

/**
 * Ollama服务SDK实现，使用OpenAI SDK兼容Ollama
 * 注意：需要安装OpenAI SDK，命令：npm install openai
 */
export class OllamaSDKService extends AIServiceBase {
  private client: any; // 后续安装SDK后更新为 OpenAI 类型

  constructor(apiKey: string = '', baseUrl: string = 'http://localhost:11434/v1') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    
    // 初始化客户端
    // 在安装OpenAI SDK后取消下方注释，并移除临时实现
    // this.client = new OpenAI({
    //   apiKey: this.apiKey || 'ollama', // Ollama不需要真正的API密钥，但SDK需要一个值
    //   baseURL: this.baseUrl
    // });
  }

  /**
   * 发送聊天完成请求
   * @param params 请求参数
   */
  async chatCompletion(params: AIRequestParams): Promise<AIRequestResponse> {
    try {
      const formattedMessages = this.formatMessages(params.messages);
      
      // SDK实现（安装SDK后取消注释）
      // const response = await this.client.chat.completions.create({
      //   model: params.model,
      //   messages: formattedMessages,
      //   temperature: params.temperature ?? 0.7,
      //   max_tokens: params.max_tokens,
      //   top_p: params.top_p ?? 1.0,
      //   frequency_penalty: params.frequency_penalty ?? 0,
      //   presence_penalty: params.presence_penalty ?? 0
      // });
      // return response;
      
      // 临时实现，使用fetch替代
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

      return await response.json();
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
      
      // SDK实现（安装SDK后取消注释）
      // const stream = await this.client.chat.completions.create({
      //   model: params.model,
      //   messages: formattedMessages,
      //   temperature: params.temperature ?? 0.7,
      //   max_tokens: params.max_tokens,
      //   top_p: params.top_p ?? 1.0,
      //   frequency_penalty: params.frequency_penalty ?? 0,
      //   presence_penalty: params.presence_penalty ?? 0,
      //   stream: true
      // });
      
      // for await (const chunk of stream) {
      //   onMessage(chunk as unknown as AIRequestResponse);
      // }
      // onComplete();
      
      // 临时实现，使用fetch替代
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
      // SDK实现（安装SDK后取消注释）
      // const response = await this.client.models.list();
      // return response.data.map((model: any) => model.id);
      
      // 临时实现，使用fetch替代
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API错误: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('获取Ollama模型列表失败:', error);
      throw error;
    }
  }
} 