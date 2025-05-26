import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import mermaid from 'mermaid'
import { Copy, Download, Maximize2, Minimize2, Check } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Rnd } from 'react-rnd'
import ThinkBlock from './ThinkBlock'
import './styles.css'
import 'katex/dist/katex.min.css'

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

// Mermaid 图表组件
const MermaidChart: React.FC<{ code: string; isDarkTheme?: boolean }> = ({ 
  code, 
  isDarkTheme = false 
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const renderChart = async () => {
      try {
        // 配置 mermaid 主题
        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkTheme ? 'dark' : 'default',
          themeVariables: {
            primaryColor: '#6366f1',
            primaryTextColor: isDarkTheme ? '#ffffff' : '#1f2937',
            primaryBorderColor: isDarkTheme ? '#6b7280' : '#d1d5db',
            lineColor: isDarkTheme ? '#6b7280' : '#9ca3af',
            secondaryColor: isDarkTheme ? '#374151' : '#f9fafb',
            tertiaryColor: isDarkTheme ? '#4b5563' : '#f3f4f6',
          },
        })

        const { svg: generatedSvg } = await mermaid.render(
          `mermaid-${Date.now()}`,
          code
        )
        setSvg(generatedSvg)
        setError(null)
      } catch (err) {
        console.error('Mermaid 渲染错误:', err)
        setError(`图表渲染失败: ${err instanceof Error ? err.message : '未知错误'}`)
      }
    }

    if (code.trim()) {
      renderChart()
    }
  }, [code, isDarkTheme])

  if (error) {
    return (
      <div className="mermaid-error">
        <span>⚠️ {error}</span>
        <pre>{code}</pre>
      </div>
    )
  }

  return (
    <div 
      ref={elementRef}
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

// 代码块组件
const CodeBlock: React.FC<{
  children: string
  className?: string
  isDarkTheme?: boolean
  enableCopy?: boolean
}> = ({ children, className = '', isDarkTheme = false, enableCopy = true }) => {
  const [copied, setCopied] = useState(false)
  const language = className.replace('language-', '') || 'text'

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
      // 降级处理：创建临时文本域进行复制
      const textArea = document.createElement('textarea')
      textArea.value = children
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('降级复制也失败:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }, [children])

  // 检查是否是 mermaid 图表
  if (language === 'mermaid') {
    return <MermaidChart code={children} isDarkTheme={isDarkTheme} />
  }

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="language-label">{language}</span>
        {enableCopy && (
          <button
            onClick={handleCopy}
            className={`copy-button ${copied ? 'copied' : ''}`}
            title={copied ? '已复制!' : '复制代码'}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? '已复制' : '复制'}</span>
            {copied && <div className="copy-feedback">已复制!</div>}
          </button>
        )}
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDarkTheme ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '14px',
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
          padding: '16px',
        }}
        wrapLongLines={true}
        showLineNumbers={false}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

// 解析思考内容的工具函数
const parseThinkContent = (content: string): { cleanContent: string; thinkBlocks: Array<{ content: string; index: number }> } => {
  const thinkBlocks: Array<{ content: string; index: number }> = []
  let cleanContent = content
  let index = 0

  // 首先处理完整的 <think>...</think> 标签对
  const completeThinkRegex = /<think>([\s\S]*?)<\/think>/gi
  let match

  // 收集所有完整的 think 块
  while ((match = completeThinkRegex.exec(content)) !== null) {
    const thinkContent = match[1].trim()
    if (thinkContent) {
      thinkBlocks.push({
        content: thinkContent,
        index: index++
      })
    }
  }

  // 重置正则表达式的 lastIndex
  completeThinkRegex.lastIndex = 0

  // 替换完整的 think 标签对为占位符
  let placeholderIndex = 0
  cleanContent = content.replace(completeThinkRegex, (match, thinkContent) => {
    const trimmedContent = thinkContent.trim()
    if (trimmedContent) {
      return `__THINK_PLACEHOLDER_${placeholderIndex++}__`
    }
    return ''
  })

  // 检查是否还有未闭合的 <think> 标签（流式输出中的情况）
  const incompleteThinkRegex = /<think>(?![\s\S]*<\/think>)([\s\S]*)$/i
  const incompleteMatch = incompleteThinkRegex.exec(cleanContent)
  
  if (incompleteMatch) {
    // 找到了未闭合的 <think> 标签
    const incompleteThinkContent = incompleteMatch[1].trim()
    
    if (incompleteThinkContent) {
      // 如果有内容，添加到 think 块中
      thinkBlocks.push({
        content: incompleteThinkContent,
        index: index++
      })
      
      // 替换未闭合的 <think> 及其后续内容为占位符
      cleanContent = cleanContent.replace(incompleteThinkRegex, `__THINK_PLACEHOLDER_${placeholderIndex}__`)
    } else {
      // 如果没有内容，只是移除 <think> 标签
      cleanContent = cleanContent.replace(/<think>$/, '')
    }
  }

  return { cleanContent, thinkBlocks }
}

// 主 Markdown 组件
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isDarkTheme = false,
  enableCopy = true,
  enableZoom = false,
  enableDrag = false,
  enableFullscreen = false,
  className = '',
  style = {},
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: '100%', height: 'auto' })

  // 解析 think 内容
  const { cleanContent, thinkBlocks } = parseThinkContent(content)

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'document.md'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [content])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // 渲染 markdown 内容的函数
  const renderMarkdownContent = (markdownText: string) => {
    // 分割内容，处理 think 占位符
    const parts = markdownText.split(/(__THINK_PLACEHOLDER_\d+__)/g)
    
    return parts.map((part, index) => {
      const thinkMatch = part.match(/^__THINK_PLACEHOLDER_(\d+)__$/)
      
      if (thinkMatch) {
        const thinkIndex = parseInt(thinkMatch[1])
        const thinkBlock = thinkBlocks[thinkIndex]
        
        if (thinkBlock) {
          return (
            <ThinkBlock
              key={`think-${index}`}
              content={thinkBlock.content}
              isDarkTheme={isDarkTheme}
            />
          )
        }
        return null
      }
      
      // 渲染普通 markdown 内容
      if (part.trim()) {
        return (
          <ReactMarkdown
            key={`content-${index}`}
            remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={{
              code: ({ node, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '')
                const value = String(children).replace(/\n$/, '')
                
                if (!match) {
                  return (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  )
                }

                return (
                  <CodeBlock
                    className={className}
                    isDarkTheme={isDarkTheme}
                    enableCopy={enableCopy}
                  >
                    {value}
                  </CodeBlock>
                )
              },
              // 自定义其他组件样式
              h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
              h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
              h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
              h4: ({ children }) => <h4 className="markdown-h4">{children}</h4>,
              h5: ({ children }) => <h5 className="markdown-h5">{children}</h5>,
              h6: ({ children }) => <h6 className="markdown-h6">{children}</h6>,
              p: ({ children }) => <p className="markdown-p">{children}</p>,
              a: ({ children, href }) => (
                <a className="markdown-link" href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="markdown-blockquote">{children}</blockquote>
              ),
              ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
              ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
              li: ({ children }) => <li className="markdown-li">{children}</li>,
              table: ({ children }) => (
                <div className="table-container">
                  <table className="markdown-table">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="markdown-thead">{children}</thead>,
              tbody: ({ children }) => <tbody className="markdown-tbody">{children}</tbody>,
              tr: ({ children }) => <tr className="markdown-tr">{children}</tr>,
              th: ({ children }) => <th className="markdown-th">{children}</th>,
              td: ({ children }) => <td className="markdown-td">{children}</td>,
              hr: () => <hr className="markdown-hr" />,
              img: ({ src, alt }) => (
                <div className="image-container">
                  <img className="markdown-img" src={src} alt={alt} />
                </div>
              ),
            }}
          >
            {part}
          </ReactMarkdown>
        )
      }
      
      return null
    })
  }

  const markdownContent = (
    <div className={`markdown-renderer ${isDarkTheme ? 'dark' : 'light'} ${className}`} style={style}>
      <div className="markdown-content">
        {renderMarkdownContent(cleanContent)}
      </div>
    </div>
  )

  if (isFullscreen) {
    return (
      <div className="markdown-fullscreen-overlay">
        <div className="markdown-fullscreen-content">
          {markdownContent}
        </div>
      </div>
    )
  }

  if (enableZoom && !enableDrag) {
    return (
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: false }}
      >
        <TransformComponent>
          {markdownContent}
        </TransformComponent>
      </TransformWrapper>
    )
  }

  if (enableDrag) {
    return (
      <Rnd
        position={position}
        size={size}
        onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
        onResizeStop={(e, direction, ref, delta, position) => {
          setSize({
            width: ref.style.width,
            height: ref.style.height,
          })
          setPosition(position)
        }}
        className="markdown-draggable"
        enableResizing={true}
        bounds="parent"
      >
        {enableZoom ? (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={3}
            wheel={{ step: 0.1 }}
          >
            <TransformComponent>
              {markdownContent}
            </TransformComponent>
          </TransformWrapper>
        ) : (
          markdownContent
        )}
      </Rnd>
    )
  }

  return markdownContent
}

export default MarkdownRenderer 