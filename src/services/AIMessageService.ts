import { v4 as uuidv4 } from 'uuid';
import { AIServiceFactory } from './AIServiceFactory';
import { AIService, AIRequestParams, AIMessage, AIRequestResponse } from '@/types/ai';
import { Message, AssistantMessageBlock } from '@/types/chat';
import { Provider, Model } from '@/types/model';

/**
 * AI消息处理服务
 */
export class AIMessageService {
  private static instance: AIMessageService;
  private serviceFactory: AIServiceFactory;

  constructor() {
    this.serviceFactory = AIServiceFactory.getInstance();
  }

  /**
   * 获取服务单例
   */
  public static getInstance(): AIMessageService {
    if (!AIMessageService.instance) {
      AIMessageService.instance = new AIMessageService();
    }
    return AIMessageService.instance;
  }

  /**
   * 发送消息到AI服务并获取回复
   * @param messages 会话消息历史
   * @param model 使用的模型
   * @param provider 服务提供商
   * @param options 请求选项
   * @param onStreamMessage 流式消息回调
   */
  public async sendMessage(
    messages: Message[],
    model: Model,
    provider: Provider,
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      systemPrompt?: string;
      stream?: boolean;
    } = {},
    onStreamMessage?: (message: Message) => void
  ): Promise<Message> {
    try {
      // 创建AI服务
      const aiService = this.createAIService(provider);

      // 格式化消息
      const formattedMessages = this.formatMessagesForRequest(messages, options.systemPrompt);

      // 构建请求参数
      const params: AIRequestParams = {
        messages: formattedMessages,
        model: model.id,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stream: options.stream && !!onStreamMessage
      };

      // 准备助手消息对象
      const assistantMessage = this.createAssistantMessage(
        model.id,
        model.provider,
        model.displayName
      );
      
      // 判断是否为流式请求
      if (params.stream && onStreamMessage) {
        // 流式处理
        let fullContent = '';
        let isFirstChunk = true;
        let tokens = 0;
        const startTime = Date.now();
        
        await aiService.streamChatCompletion(
          params,
          (chunk) => {
            const choice = chunk.choices[0];
            if (!choice.delta?.content && !choice.message?.content) return;
            
            const content = choice.delta?.content || choice.message?.content || '';
            fullContent += content;
            tokens += this.estimateTokenCount(content);
            
            // 更新消息内容
            const updatedMessage: Message = {
              ...assistantMessage,
              content: [
                {
                  type: 'content',
                  content: fullContent,
                  status: 'success',
                  timestamp: Date.now()
                } as AssistantMessageBlock
              ],
              usage: {
                ...assistantMessage.usage,
                output_tokens: tokens,
                total_tokens: assistantMessage.usage.input_tokens + tokens,
                generation_time: Date.now() - startTime,
                first_token_time: isFirstChunk ? Date.now() - startTime : assistantMessage.usage.first_token_time
              }
            };
            
            // 回调更新后的消息
            onStreamMessage(updatedMessage);
            
            if (isFirstChunk) {
              isFirstChunk = false;
            }
          },
          (error) => {
            console.error('流式请求出错:', error);
            const errorMessage: Message = {
              ...assistantMessage,
              content: [
                {
                  type: 'error',
                  content: `请求失败: ${error.message || '未知错误'}`,
                  status: 'error',
                  timestamp: Date.now()
                } as AssistantMessageBlock
              ],
              status: 'error',
              error: error.message || '未知错误'
            };
            onStreamMessage(errorMessage);
          },
          () => {
            const finalMessage: Message = {
              ...assistantMessage,
              content: [
                {
                  type: 'content',
                  content: fullContent,
                  status: 'success',
                  timestamp: Date.now()
                } as AssistantMessageBlock
              ],
              usage: {
                ...assistantMessage.usage,
                output_tokens: tokens,
                total_tokens: assistantMessage.usage.input_tokens + tokens,
                generation_time: Date.now() - startTime
              },
              status: 'sent'
            };
            onStreamMessage(finalMessage);
          }
        );
        
        // 返回最终的完整消息
        return {
          ...assistantMessage,
          content: [
            {
              type: 'content',
              content: fullContent,
              status: 'success',
              timestamp: Date.now()
            } as AssistantMessageBlock
          ],
          usage: {
            ...assistantMessage.usage,
            output_tokens: tokens,
            total_tokens: assistantMessage.usage.input_tokens + tokens,
            generation_time: Date.now() - startTime
          },
          status: 'sent'
        };
      } else {
        // 非流式请求
        const startTime = Date.now();
        const response = await aiService.chatCompletion(params);
        const endTime = Date.now();
        
        // 提取响应内容
        const choice = response.choices[0];
        if (!choice || !choice.message) {
          throw new Error('AI返回的响应格式错误');
        }
        
        const content = choice.message.content || '';
        
        // 构建完整的助手消息
        return {
          ...assistantMessage,
          content: [
            {
              type: 'content',
              content,
              status: 'success',
              timestamp: Date.now()
            } as AssistantMessageBlock
          ],
          usage: {
            ...assistantMessage.usage,
            input_tokens: response.usage?.prompt_tokens || 0,
            output_tokens: response.usage?.completion_tokens || 0,
            total_tokens: response.usage?.total_tokens || 0,
            generation_time: endTime - startTime
          },
          status: 'sent'
        };
      }
    } catch (error: any) {
      console.error('AI消息请求失败:', error);
      
      // 返回错误消息
      return this.createErrorMessage(
        error.message || '未知错误',
        model.id,
        model.provider,
        model.displayName
      );
    }
  }

  /**
   * 发送消息到AI服务并获取流式回复的异步迭代器
   * @param messages 会话消息历史
   * @param model 使用的模型
   * @param provider 服务提供商
   * @param options 请求选项
   * @returns 返回异步迭代器，可用于遍历流式消息
   */
  public streamMessageAsync(
    messages: Message[],
    model: Model,
    provider: Provider,
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      systemPrompt?: string;
    } = {}
  ): AsyncGenerator<Message> {
    // 使用箭头函数保留this上下文
    const run = (async function*(this: AIMessageService): AsyncGenerator<Message> {
      try {
        // 创建AI服务
        const aiService = this.createAIService(provider);

        // 格式化消息
        const formattedMessages = this.formatMessagesForRequest(messages, options.systemPrompt);

        // 构建请求参数
        const params: AIRequestParams = {
          messages: formattedMessages,
          model: model.id,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          top_p: options.topP,
          frequency_penalty: options.frequencyPenalty,
          presence_penalty: options.presencePenalty,
          stream: true
        };

        // 准备助手消息对象
        const assistantMessage = this.createAssistantMessage(
          model.id,
          model.provider,
          model.displayName
        );
        
        // 创建一个消息队列和控制变量
        const messageQueue: Message[] = [];
        let isComplete = false;
        let error: Error | null = null;
        let fullContent = '';
        let isFirstChunk = true;
        let tokens = 0;
        const startTime = Date.now();
        
        // 发出初始消息
        yield {
          ...assistantMessage,
          content: [
            {
              type: 'content',
              content: '',
              status: 'loading',
              timestamp: Date.now()
            } as AssistantMessageBlock
          ],
          status: 'pending'
        };
        
        // 启动流式请求
        try {
          // 使用 Promise 包装流式请求处理
          const streamComplete = new Promise<void>((resolve, reject) => {
            aiService.streamChatCompletion(
              params,
              (chunk: AIRequestResponse) => {
                const choice = chunk.choices[0];
                if (!choice.delta?.content && !choice.message?.content) return;
                
                const content = choice.delta?.content || choice.message?.content || '';
                fullContent += content;
                tokens += this.estimateTokenCount(content);
                
                // 更新消息内容
                const updatedMessage: Message = {
                  ...assistantMessage,
                  content: [
                    {
                      type: 'content',
                      content: fullContent,
                      status: 'success',
                      timestamp: Date.now()
                    } as AssistantMessageBlock
                  ],
                  usage: {
                    ...assistantMessage.usage,
                    output_tokens: tokens,
                    total_tokens: assistantMessage.usage.input_tokens + tokens,
                    generation_time: Date.now() - startTime,
                    first_token_time: isFirstChunk ? Date.now() - startTime : assistantMessage.usage.first_token_time
                  }
                };
                
                // 将更新的消息添加到队列
                messageQueue.push(updatedMessage);
                
                if (isFirstChunk) {
                  isFirstChunk = false;
                }
              },
              (err: Error) => {
                console.error('流式请求出错:', err);
                // 设置错误状态
                error = err;
                
                const errorMessage: Message = {
                  ...assistantMessage,
                  content: [
                    {
                      type: 'error',
                      content: `请求失败: ${err.message || '未知错误'}`,
                      status: 'error',
                      timestamp: Date.now()
                    } as AssistantMessageBlock
                  ],
                  status: 'error',
                  error: err.message || '未知错误'
                };
                
                // 将错误消息添加到队列
                messageQueue.push(errorMessage);
                
                // 标记流程完成
                isComplete = true;
                resolve();
              },
              () => {
                // 请求完成，添加最终消息
                const finalMessage: Message = {
                  ...assistantMessage,
                  content: [
                    {
                      type: 'content',
                      content: fullContent,
                      status: 'success',
                      timestamp: Date.now()
                    } as AssistantMessageBlock
                  ],
                  usage: {
                    ...assistantMessage.usage,
                    output_tokens: tokens,
                    total_tokens: assistantMessage.usage.input_tokens + tokens,
                    generation_time: Date.now() - startTime
                  },
                  status: 'sent'
                };
                
                // 将最终消息添加到队列
                messageQueue.push(finalMessage);
                
                // 标记流程完成
                isComplete = true;
                resolve();
              }
            ).catch(err => {
              error = err instanceof Error ? err : new Error(String(err));
              isComplete = true;
              reject(error);
            });
          });
          
          // 在流式请求处理的同时，持续从队列中产出消息
          while (!isComplete || messageQueue.length > 0) {
            if (messageQueue.length > 0) {
              // 有新消息，发出
              yield messageQueue.shift()!;
            } else if (error) {
              // 出现错误，抛出
              throw error;
            } else {
              // 等待一小段时间再检查
              await new Promise<void>(resolve => setTimeout(resolve, 10));
            }
          }
          
          // 等待流式请求完成
          await streamComplete;
          
          // 返回最终消息
          return {
            ...assistantMessage,
            content: [
              {
                type: 'content',
                content: fullContent,
                status: 'success',
                timestamp: Date.now()
              } as AssistantMessageBlock
            ],
            usage: {
              ...assistantMessage.usage,
              output_tokens: tokens,
              total_tokens: assistantMessage.usage.input_tokens + tokens,
              generation_time: Date.now() - startTime
            },
            status: 'sent' as const
          };
        } catch (err: unknown) {
          // 请求出错，设置错误状态
          console.error('流式请求处理失败:', err);
          const errorMsg = err instanceof Error ? err.message : String(err);
          
          yield this.createErrorMessage(
            errorMsg,
            model.id,
            model.provider,
            model.displayName
          );
          
          throw err;
        }
      } catch (error: unknown) {
        console.error('AI消息请求失败:', error);
        
        // 创建错误消息
        const errorMessage = this.createErrorMessage(
          error instanceof Error ? error.message : '未知错误',
          model.id,
          model.provider,
          model.displayName
        );
        
        yield errorMessage;
        throw error;
      }
    }).bind(this)();
    
    return run;
  }

  /**
   * 创建AI服务实例
   * @param provider 服务提供商
   */
  private createAIService(provider: Provider): AIService {
    return this.serviceFactory.createService(provider.name, {
      apiKey: provider.apiKey,
      baseUrl: provider.apiUrl
    });
  }

  /**
   * 格式化消息以供请求使用
   * @param messages 消息历史
   * @param systemPrompt 系统提示词
   */
  private formatMessagesForRequest(messages: Message[], systemPrompt?: string): AIMessage[] {
    const formattedMessages: AIMessage[] = [];
    
    // 添加系统提示词
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // 添加历史消息
    for (const message of messages) {
      let content = '';
      
      if (typeof message.content === 'string') {
        content = message.content;
      } else if (Array.isArray(message.content)) {
        // 处理助手消息内容块
        content = message.content
          .filter(block => block.type === 'content' && block.content)
          .map(block => block.content)
          .join('\n');
      } else if (typeof message.content === 'object' && message.content?.text) {
        // 处理用户消息
        content = message.content.text;
      }
      
      formattedMessages.push({
        role: message.role as 'system' | 'user' | 'assistant' | 'function',
        content: content
      });
    }
    
    return formattedMessages;
  }

  /**
   * 创建助手消息对象
   * @param modelId 模型ID
   * @param provider 提供商
   * @param modelName 模型名称
   */
  private createAssistantMessage(
    modelId: string,
    provider: string,
    modelName: string
  ): Message {
    const timestamp = Date.now();
    return {
      id: uuidv4(),
      role: 'assistant',
      content: [] as AssistantMessageBlock[],
      timestamp,
      avatar: '',
      name: 'AI助手',
      model_name: modelName,
      model_id: modelId,
      model_provider: provider,
      status: 'pending',
      error: '',
      usage: {
        tokens_per_second: 0,
        total_tokens: 0,
        generation_time: 0,
        first_token_time: 0,
        reasoning_start_time: 0,
        reasoning_end_time: 0,
        input_tokens: 0,
        output_tokens: 0
      },
      conversationId: '',
      is_variant: 0
    };
  }

  /**
   * 创建错误消息对象
   * @param errorMessage 错误信息
   * @param modelId 模型ID
   * @param provider 提供商
   * @param modelName 模型名称
   */
  private createErrorMessage(
    errorMessage: string,
    modelId: string,
    provider: string,
    modelName: string
  ): Message {
    const assistantMessage = this.createAssistantMessage(modelId, provider, modelName);
    return {
      ...assistantMessage,
      content: [
        {
          type: 'error',
          content: `请求失败: ${errorMessage}`,
          status: 'error',
          timestamp: Date.now()
        } as AssistantMessageBlock
      ],
      status: 'error',
      error: errorMessage
    };
  }

  /**
   * 估算文本中的token数量
   * 这是一个简单估算，不是精确计算
   * @param text 文本内容
   */
  private estimateTokenCount(text: string): number {
    if (!text) return 0;
    // 中文字符约为1.5个token
    // 英文单词约为0.75个token
    // 简单估算：将字符数除以4
    return Math.ceil(text.length / 4);
  }
} 