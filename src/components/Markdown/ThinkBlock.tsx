import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'

interface ThinkBlockProps {
  content: string
  isDarkTheme?: boolean
}

const ThinkBlock: React.FC<ThinkBlockProps> = ({ content, isDarkTheme = false }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // 测量内容高度
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight
      setContentHeight(height)
    }
  }, [content, isExpanded])

  if (!content || content.trim() === '') {
    return null
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={`think-block ${isDarkTheme ? 'dark' : 'light'}`}>
      <button
        className="think-toggle-button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <Brain size={16} className="think-icon" />
        <span className="think-label">推理内容</span>
        <span className="think-chevron">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      
      <div 
        className={`think-content ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{
          maxHeight: isExpanded ? `${contentHeight + 32}px` : '0px'
        }}
      >
        <div ref={contentRef} className="think-content-inner">
          <ReactMarkdown
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
                  <div className="code-block-container">
                    <div className="code-block-header">
                      <span className="language-label">{match[1] || 'text'}</span>
                    </div>
                    <SyntaxHighlighter
                      language={match[1] || 'text'}
                      style={isDarkTheme ? oneDark : oneLight}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: '13px',
                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
                        padding: '12px 16px',
                      }}
                      wrapLongLines={true}
                      showLineNumbers={false}
                    >
                      {value}
                    </SyntaxHighlighter>
                  </div>
                )
              },
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
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export default ThinkBlock 