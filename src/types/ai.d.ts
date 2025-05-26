// AI消息类型
export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

// AI请求参数
export interface AIRequestParams {
  messages: AIMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  functions?: any[];
  function_call?: 'auto' | 'none' | { name: string };
  stream?: boolean;
}

// AI请求响应
export interface AIRequestResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message?: AIMessage;
    delta?: Partial<AIMessage>;
    finish_reason: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// AI服务抽象接口
export interface AIService {
  // 发送聊天完成请求
  chatCompletion(params: AIRequestParams): Promise<AIRequestResponse>;
  
  // 流式聊天完成
  streamChatCompletion(
    params: AIRequestParams,
    onMessage: (chunk: AIRequestResponse) => void,
    onError: (error: any) => void,
    onComplete: () => void
  ): Promise<void>;
  
  // 获取可用模型列表
  listModels(): Promise<string[]>;
  
  // 设置API密钥
  setApiKey(apiKey: string): void;
  
  // 设置API基础URL
  setBaseUrl(baseUrl: string): void;
  
  // 设置其他参数
  setOptions(options: Record<string, any>): void;
}

// AI服务工厂接口
export interface AIServiceFactory {
  createService(type: string, options?: Record<string, any>): AIService;
} 