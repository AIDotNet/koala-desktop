import {
  Adobe,
  AdobeFirefly,
  Ai21,
  Ai360,
  AiHubMix,
  AiMass,
  AionLabs,
  AiStudio,
  AlephAlpha,
  Alibaba,
  AlibabaCloud,
  AntGroup,
  Anthropic,
  Anyscale,
  AssemblyAI,
  Automatic,
  Aws,
  Aya,
  Azure,
  AzureAI,
  BAAI,
  Baichuan,
  Baidu,
  BaiduCloud,
  Bedrock,
  Bing,
  ByteDance,
  CentML,
  Cerebras,
  ChatGLM,
  Civitai,
  Claude,
  Cline,
  Clipdrop,
  Cloudflare,
  CodeGeeX,
  CogVideo,
  CogView,
  Cohere,
  Colab,
  ComfyUI,
  CommandA,
  Copilot,
  Coqui,
  Coze,
  CrewAI,
  Crusoe,
  Cursor,
  Dalle,
  Dbrx,
  DeepAI,
  DeepInfra,
  DeepMind,
  DeepSeek,
  Dify,
  Doc2X,
  DocSearch,
  Doubao,
  DreamMachine,
  Exa,
  Fal,
  FastGPT,
  Featherless,
  Fireworks,
  FishAudio,
  Flora,
  Flowith,
  Flux,
  Friendli,
  Gemini,
  Gemma,
  GiteeAI,
  Github,
  GithubCopilot,
  Glif,
  Google,
  Goose,
  Gradio,
  Greptile,
  Grok,
  Groq,
  Hailuo,
  Haiper,
  Hedra,
  Higress,
  HuggingFace,
  Hunyuan,
  Hyperbolic,
  Ideogram,
  IFlyTekCloud,
  Inference,
  Infermatic,
  Infinigence,
  Inflection,
  InternLM,
  Jimeng,
  Jina,
  Kera,
  Kimi,
  Kling,
  Kluster,
  Lambda,
  LangChain,
  Langfuse,
  LangGraph,
  LangSmith,
  LeptonAI,
  Lightricks,
  Liquid,
  LiveKit,
  LlamaIndex,
  LLaVA,
  LmStudio,
  LobeHub,
  Luma,
  Magic,
  Make,
  Manus,
  MCP,
  Meta,
  MetaAI,
  MetaGPT,
  Microsoft,
  Midjourney,
  Minimax,
  Mistral,
  ModelScope,
  Monica,
  Moonshot,
  MyShell,
  N8n,
  Nebius,
  NotebookLM,
  Notion,
  Nova,
  Novita,
  NPLCloud,
  Nvidia,
  Ollama,
  OpenAI,
  OpenChat,
  OpenRouter,
  OpenWebUI,
  PaLM,
  Parasail,
  Perplexity,
  Phidata,
  Pika,
  PixVerse,
  Poe,
  Pollinations,
  PPIO,
  PydanticAI,
  Qingyan,
  Qiniu,
  Qwen,
  Railway,
  Recraft,
  Replicate,
  Replit,
  RSSHub,
  Runway,
  Rwkv,
  SambaNova,
  Search1API,
  SearchApi,
  SenseNova,
  SiliconCloud,
  Snowflake,
  Spark,
  Stability,
  StateCloud,
  Stepfun,
  Suno,
  Sync,
  Targon,
  Tencent,
  TencentCloud,
  Tiangong,
  TII,
  Together,
  TopazLabs,
  Tripo,
  Udio,
  Unstructured,
  Upstage,
  V0,
  VectorizerAI,
  Vercel,
  VertexAI,
  Vidu,
  Viggle,
  Vllm,
  Volcengine,
  Voyage,
  Wenxin,
  WorkersAI,
  XAI,
  Xinference,
  Xuanyuan,
  Yandex,
  Yi,
  Yuanbao,
  Zapier,
  Zeabur,
  ZeroOne,
  Zhipu,
}from '@lobehub/icons'

// 创建图标映射对象，便于动态使用
export const iconMap = {
  Adobe,
  AdobeFirefly,
  Ai21,
  Ai360,
  AiHubMix,
  AiMass,
  AionLabs,
  AiStudio,
  AlephAlpha,
  Alibaba,
  AlibabaCloud,
  AntGroup,
  Anthropic,
  Anyscale,
  AssemblyAI,
  Automatic,
  Aws,
  Aya,
  Azure,
  AzureAI,
  BAAI,
  Baichuan,
  Baidu,
  BaiduCloud,
  Bedrock,
  Bing,
  ByteDance,
  CentML,
  Cerebras,
  ChatGLM,
  Civitai,
  Claude,
  Cline,
  Clipdrop,
  Cloudflare,
  CodeGeeX,
  CogVideo,
  CogView,
  Cohere,
  Colab,
  ComfyUI,
  CommandA,
  Copilot,
  Coqui,
  Coze,
  CrewAI,
  Crusoe,
  Cursor,
  Dalle,
  Dbrx,
  DeepAI,
  DeepInfra,
  DeepMind,
  DeepSeek,
  Dify,
  Doc2X,
  DocSearch,
  Doubao,
  DreamMachine,
  Exa,
  Fal,
  FastGPT,
  Featherless,
  Fireworks,
  FishAudio,
  Flora,
  Flowith,
  Flux,
  Friendli,
  Gemini,
  Gemma,
  GiteeAI,
  Github,
  GithubCopilot,
  Glif,
  Google,
  Goose,
  Gradio,
  Greptile,
  Grok,
  Groq,
  Hailuo,
  Haiper,
  Hedra,
  Higress,
  HuggingFace,
  Hunyuan,
  Hyperbolic,
  Ideogram,
  IFlyTekCloud,
  Inference,
  Infermatic,
  Infinigence,
  Inflection,
  InternLM,
  Jimeng,
  Jina,
  Kera,
  Kimi,
  Kling,
  Kluster,
  Lambda,
  LangChain,
  Langfuse,
  LangGraph,
  LangSmith,
  LeptonAI,
  Lightricks,
  Liquid,
  LiveKit,
  LlamaIndex,
  LLaVA,
  LmStudio,
  LobeHub,
  Luma,
  Magic,
  Make,
  Manus,
  MCP,
  Meta,
  MetaAI,
  MetaGPT,
  Microsoft,
  Midjourney,
  Minimax,
  Mistral,
  ModelScope,
  Monica,
  Moonshot,
  MyShell,
  N8n,
  Nebius,
  NotebookLM,
  Notion,
  Nova,
  Novita,
  NPLCloud,
  Nvidia,
  Ollama,
  OpenAI,
  OpenChat,
  OpenRouter,
  OpenWebUI,
  PaLM,
  Parasail,
  Perplexity,
  Phidata,
  Pika,
  PixVerse,
  Poe,
  Pollinations,
  PPIO,
  PydanticAI,
  Qingyan,
  Qiniu,
  Qwen,
  Railway,
  Recraft,
  Replicate,
  Replit,
  RSSHub,
  Runway,
  Rwkv,
  SambaNova,
  Search1API,
  SearchApi,
  SenseNova,
  SiliconCloud,
  Snowflake,
  Spark,
  Stability,
  StateCloud,
  Stepfun,
  Suno,
  Sync,
  Targon,
  Tencent,
  TencentCloud,
  Tiangong,
  TII,
  Together,
  TopazLabs,
  Tripo,
  Udio,
  Unstructured,
  Upstage,
  V0,
  VectorizerAI,
  Vercel,
  VertexAI,
  Vidu,
  Viggle,
  Vllm,
  Volcengine,
  Voyage,
  Wenxin,
  WorkersAI,
  XAI,
  Xinference,
  Xuanyuan,
  Yandex,
  Yi,
  Yuanbao,
  Zapier,
  Zeabur,
  ZeroOne,
  Zhipu,
} as const 

// 图标名称类型
export type IconName = keyof typeof iconMap

// 获取图标组件的辅助函数
export const getIcon = (name: IconName) => {
  switch (name) {
    case 'Adobe': return Adobe;
    case 'AdobeFirefly': return AdobeFirefly;
    case 'Ai21': return Ai21;
    case 'Ai360': return Ai360;
    case 'AiHubMix': return AiHubMix;
    case 'AiMass': return AiMass;
    case 'AionLabs': return AionLabs;
    case 'AiStudio': return AiStudio;
    case 'AlephAlpha': return AlephAlpha;
    case 'Alibaba': return Alibaba;
    case 'AlibabaCloud': return AlibabaCloud;
    case 'AntGroup': return AntGroup;
    case 'Anthropic': return Anthropic;
    case 'Anyscale': return Anyscale;
    case 'AssemblyAI': return AssemblyAI;
    case 'Automatic': return Automatic;
    case 'Aws': return Aws;
    case 'Aya': return Aya;
    case 'Azure': return Azure;
    case 'AzureAI': return AzureAI;
    case 'BAAI': return BAAI;
    case 'Baichuan': return Baichuan;
    case 'Baidu': return Baidu;
    case 'BaiduCloud': return BaiduCloud;
    case 'Bedrock': return Bedrock;
    case 'Bing': return Bing;
    case 'ByteDance': return ByteDance;
    case 'CentML': return CentML;
    case 'Cerebras': return Cerebras;
    case 'ChatGLM': return ChatGLM;
    case 'Civitai': return Civitai;
    case 'Claude': return Claude;
    case 'Cline': return Cline;
    case 'Clipdrop': return Clipdrop;
    case 'Cloudflare': return Cloudflare;
    case 'CodeGeeX': return CodeGeeX;
    case 'CogVideo': return CogVideo;
    case 'CogView': return CogView;
    case 'Cohere': return Cohere;
    case 'Colab': return Colab;
    case 'ComfyUI': return ComfyUI;
    case 'CommandA': return CommandA;
    case 'Copilot': return Copilot;
    case 'Coqui': return Coqui;
    case 'Coze': return Coze;
    case 'CrewAI': return CrewAI;
    case 'Crusoe': return Crusoe;
    case 'Cursor': return Cursor;
    case 'Dalle': return Dalle;
    case 'Dbrx': return Dbrx;
    case 'DeepAI': return DeepAI;
    case 'DeepInfra': return DeepInfra;
    case 'DeepMind': return DeepMind;
    case 'DeepSeek': return DeepSeek;
    case 'Dify': return Dify;
    case 'Doc2X': return Doc2X;
    case 'DocSearch': return DocSearch;
    case 'Doubao': return Doubao;
    case 'DreamMachine': return DreamMachine;
    case 'Exa': return Exa;
    case 'Fal': return Fal;
    case 'FastGPT': return FastGPT;
    case 'Featherless': return Featherless;
    case 'Fireworks': return Fireworks;
    case 'FishAudio': return FishAudio;
    case 'Flora': return Flora;
    case 'Flowith': return Flowith;
    case 'Flux': return Flux;
    case 'Friendli': return Friendli;
    case 'Gemini': return Gemini;
    case 'Gemma': return Gemma;
    case 'GiteeAI': return GiteeAI;
    case 'Github': return Github;
    case 'GithubCopilot': return GithubCopilot;
    case 'Glif': return Glif;
    case 'Google': return Google;
    case 'Goose': return Goose;
    case 'Gradio': return Gradio;
    case 'Greptile': return Greptile;
    case 'Grok': return Grok;
    case 'Groq': return Groq;
    case 'Hailuo': return Hailuo;
    case 'Haiper': return Haiper;
    case 'Hedra': return Hedra;
    case 'Higress': return Higress;
    case 'HuggingFace': return HuggingFace;
    case 'Hunyuan': return Hunyuan;
    case 'Hyperbolic': return Hyperbolic;
    case 'Ideogram': return Ideogram;
    case 'IFlyTekCloud': return IFlyTekCloud;
    case 'Inference': return Inference;
    case 'Infermatic': return Infermatic;
    case 'Infinigence': return Infinigence;
    case 'Inflection': return Inflection;
    case 'InternLM': return InternLM;
    case 'Jimeng': return Jimeng;
    case 'Jina': return Jina;
    case 'Kera': return Kera;
    case 'Kimi': return Kimi;
    case 'Kling': return Kling;
    case 'Kluster': return Kluster;
    case 'Lambda': return Lambda;
    case 'LangChain': return LangChain;
    case 'Langfuse': return Langfuse;
    case 'LangGraph': return LangGraph;
    case 'LangSmith': return LangSmith;
    case 'LeptonAI': return LeptonAI;
    case 'Lightricks': return Lightricks;
    case 'Liquid': return Liquid;
    case 'LiveKit': return LiveKit;
    case 'LlamaIndex': return LlamaIndex;
    case 'LLaVA': return LLaVA;
    case 'LmStudio': return LmStudio;
    case 'LobeHub': return LobeHub;
    case 'Luma': return Luma;
    case 'Magic': return Magic;
    case 'Make': return Make;
    case 'Manus': return Manus;
    case 'MCP': return MCP;
    case 'Meta': return Meta;
    case 'MetaAI': return MetaAI;
    case 'MetaGPT': return MetaGPT;
    case 'Microsoft': return Microsoft;
    case 'Midjourney': return Midjourney;
    case 'Minimax': return Minimax;
    case 'Mistral': return Mistral;
    case 'ModelScope': return ModelScope;
    case 'Monica': return Monica;
    case 'Moonshot': return Moonshot;
    case 'MyShell': return MyShell;
    case 'N8n': return N8n;
    case 'Nebius': return Nebius;
    case 'NotebookLM': return NotebookLM;
    case 'Notion': return Notion;
    case 'Nova': return Nova;
    case 'Novita': return Novita;
    case 'NPLCloud': return NPLCloud;
    case 'Nvidia': return Nvidia;
    case 'Ollama': return Ollama;
    case 'OpenAI': return OpenAI;
    case 'OpenChat': return OpenChat;
    case 'OpenRouter': return OpenRouter;
    case 'OpenWebUI': return OpenWebUI;
    case 'PaLM': return PaLM;
    case 'Parasail': return Parasail;
    case 'Perplexity': return Perplexity;
    case 'Phidata': return Phidata;
    case 'Pika': return Pika;
    case 'PixVerse': return PixVerse;
    case 'Poe': return Poe;
    case 'Pollinations': return Pollinations;
    case 'PPIO': return PPIO;
    case 'PydanticAI': return PydanticAI;
    case 'Qingyan': return Qingyan;
    case 'Qiniu': return Qiniu;
    case 'Qwen': return Qwen;
    case 'Railway': return Railway;
    case 'Recraft': return Recraft;
    case 'Replicate': return Replicate;
    case 'Replit': return Replit;
    case 'RSSHub': return RSSHub;
    case 'Runway': return Runway;
    case 'Rwkv': return Rwkv;
    case 'SambaNova': return SambaNova;
    case 'Search1API': return Search1API;
    case 'SearchApi': return SearchApi;
    case 'SenseNova': return SenseNova;
    case 'SiliconCloud': return SiliconCloud;
    case 'Snowflake': return Snowflake;
    case 'Spark': return Spark;
    case 'Stability': return Stability;
    case 'StateCloud': return StateCloud;
    case 'Stepfun': return Stepfun;
    case 'Suno': return Suno;
    case 'Sync': return Sync;
    case 'Targon': return Targon;
    case 'Tencent': return Tencent;
    case 'TencentCloud': return TencentCloud;
    case 'Tiangong': return Tiangong;
    case 'TII': return TII;
    case 'Together': return Together;
    case 'TopazLabs': return TopazLabs;
    case 'Tripo': return Tripo;
    case 'Udio': return Udio;
    case 'Unstructured': return Unstructured;
    case 'Upstage': return Upstage;
    case 'V0': return V0;
    case 'VectorizerAI': return VectorizerAI;
    case 'Vercel': return Vercel;
    case 'VertexAI': return VertexAI;
    case 'Vidu': return Vidu;
    case 'Viggle': return Viggle;
    case 'Vllm': return Vllm;
    case 'Volcengine': return Volcengine;
    case 'Voyage': return Voyage;
    case 'Wenxin': return Wenxin;
    case 'WorkersAI': return WorkersAI;
    case 'XAI': return XAI;
    case 'Xinference': return Xinference;
    case 'Xuanyuan': return Xuanyuan;
    case 'Yandex': return Yandex;
    case 'Yi': return Yi;
    case 'Yuanbao': return Yuanbao;
    case 'Zapier': return Zapier;
    case 'Zeabur': return Zeabur;
    case 'ZeroOne': return ZeroOne;
    case 'Zhipu': return Zhipu;
    default: return null;
  }
}

// 获取所有图标名称的辅助函数
export const getAllIconNames = (): IconName[] => Object.keys(iconMap) as IconName[]

