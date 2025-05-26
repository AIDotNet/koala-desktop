// Markdown 组件库类型定义

export interface MarkdownRendererProps {
  content: string
  isDarkTheme?: boolean
  enableCopy?: boolean
  enableZoom?: boolean
  enableDrag?: boolean
  enableFullscreen?: boolean
  className?: string
  style?: React.CSSProperties
}

export interface CodeBlockProps {
  children: string
  className?: string
  isDarkTheme?: boolean
  enableCopy?: boolean
}

export interface MermaidChartProps {
  code: string
  isDarkTheme?: boolean
}

export interface MarkdownLink {
  text: string
  url: string
}

export interface MarkdownImage {
  alt: string
  src: string
}

export interface MarkdownHeading {
  level: number
  text: string
  id: string
}

export interface CodeBlock {
  language: string
  code: string
}

export interface MermaidChart {
  type: string
  code: string
}

export interface ValidationError {
  line: number
  message: string
}

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: string
  height: string
}

export interface MarkdownStats {
  wordCount: number
  characterCount: number
  readingTime: number // 分钟
}

export interface ThemeConfig {
  isDarkTheme: boolean
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  borderColor?: string
}

export interface KeyboardShortcuts {
  [key: string]: () => void
}

export interface DownloadOptions {
  filename?: string
  format?: 'md' | 'html' | 'pdf'
}

export interface MarkdownPlugin {
  name: string
  enabled: boolean
  config?: Record<string, any>
}

export interface MarkdownConfig {
  theme: ThemeConfig
  plugins: MarkdownPlugin[]
  shortcuts: KeyboardShortcuts
  features: {
    enableCopy: boolean
    enableZoom: boolean
    enableDrag: boolean
    enableFullscreen: boolean
    enableMermaid: boolean
    enableMath: boolean
    enableSyntaxHighlight: boolean
  }
}

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isDarkTheme?: boolean
  className?: string
  style?: React.CSSProperties
}

export interface MarkdownPreviewProps extends MarkdownRendererProps {
  showToolbar?: boolean
  showLineNumbers?: boolean
}

export interface MarkdownSplitViewProps {
  content: string
  onContentChange: (content: string) => void
  isDarkTheme?: boolean
  previewProps?: Partial<MarkdownPreviewProps>
  editorProps?: Partial<MarkdownEditorProps>
}

export type MarkdownView = 'preview' | 'edit' | 'split'

export interface MarkdownToolbarProps {
  onFormatContent?: () => void
  onValidateContent?: () => void
  onGenerateTOC?: () => void
  onDownload?: (format: 'md' | 'html' | 'pdf') => void
  onToggleTheme?: () => void
  onToggleView?: (view: MarkdownView) => void
  currentView?: MarkdownView
  isDarkTheme?: boolean
}

export interface MarkdownHookResult<T> {
  value: T
  setValue: (value: T) => void
  reset: () => void
}

export interface CopyHookResult {
  copied: boolean
  copy: (text: string) => Promise<boolean>
}

export interface FullscreenHookResult {
  isFullscreen: boolean
  toggleFullscreen: () => void
  exitFullscreen: () => void
  enterFullscreen: () => void
}

export interface DragResizeHookResult {
  position: Position
  size: Size
  updatePosition: (position: Position) => void
  updateSize: (size: Size) => void
  reset: () => void
}

export interface ThemeHookResult {
  isDarkTheme: boolean
  toggleTheme: () => void
  setIsDarkTheme: (value: boolean) => void
}

export interface ContentHookResult {
  content: string
  wordCount: number
  readTime: number
  updateContent: (content: string) => void
  clearContent: () => void
}

export interface DownloadHookResult {
  downloadAsMarkdown: (content: string, filename?: string) => void
  downloadAsHTML: (htmlContent: string, filename?: string) => void
  downloadAsPDF: (content: string, filename?: string) => void
}

export interface LocalStorageHookResult<T> {
  0: T
  1: (value: T | ((val: T) => T)) => void
  2: () => void
}

export interface ScrollPositionHookResult {
  scrollPosition: number
  saveScrollPosition: () => void
  restoreScrollPosition: () => void
}

// Mermaid 相关类型
export type MermaidTheme = 'default' | 'dark' | 'forest' | 'neutral'

export interface MermaidConfig {
  startOnLoad: boolean
  theme: MermaidTheme
  themeVariables?: Record<string, string>
}

// 语法高亮相关类型
export type SyntaxHighlightTheme = 'light' | 'dark'
export type SyntaxHighlightLanguage = string

export interface SyntaxHighlightConfig {
  theme: SyntaxHighlightTheme
  showLineNumbers?: boolean
  wrapLongLines?: boolean
  customStyle?: React.CSSProperties
}

// 数学公式相关类型
export interface KaTeXConfig {
  displayMode?: boolean
  throwOnError?: boolean
  errorColor?: string
  macros?: Record<string, string>
}

// 插件系统类型
export interface MarkdownPluginAPI {
  addComponent: (name: string, component: React.ComponentType) => void
  addHook: (name: string, hook: (...args: any[]) => any) => void
  addUtility: (name: string, utility: (...args: any[]) => any) => void
}

export interface MarkdownPluginDefinition {
  name: string
  version: string
  description?: string
  author?: string
  install: (api: MarkdownPluginAPI) => void
  uninstall?: (api: MarkdownPluginAPI) => void
}

// 事件类型
export interface MarkdownEvent {
  type: string
  data?: any
  timestamp: number
}

export interface MarkdownEventListener {
  (event: MarkdownEvent): void
}

export interface MarkdownEventManager {
  on: (eventType: string, listener: MarkdownEventListener) => void
  off: (eventType: string, listener: MarkdownEventListener) => void
  emit: (eventType: string, data?: any) => void
}

// 导出所有接口
export * from './hooks'
export * from './utils' 