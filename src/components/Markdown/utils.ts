// Markdown 内容处理工具函数

/**
 * 提取 Markdown 中的代码块
 */
export const extractCodeBlocks = (content: string): Array<{ language: string; code: string }> => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: Array<{ language: string; code: string }> = []
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    })
  }

  return blocks
}

/**
 * 提取 Markdown 中的链接
 */
export const extractLinks = (content: string): Array<{ text: string; url: string }> => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const links: Array<{ text: string; url: string }> = []
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2]
    })
  }

  return links
}

/**
 * 提取 Markdown 中的图片
 */
export const extractImages = (content: string): Array<{ alt: string; src: string }> => {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const images: Array<{ alt: string; src: string }> = []
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    images.push({
      alt: match[1],
      src: match[2]
    })
  }

  return images
}

/**
 * 提取 Markdown 中的标题
 */
export const extractHeadings = (content: string): Array<{ level: number; text: string; id: string }> => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: Array<{ level: number; text: string; id: string }> = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    
    headings.push({
      level,
      text,
      id
    })
  }

  return headings
}

/**
 * 生成目录 (TOC)
 */
export const generateTOC = (content: string): string => {
  const headings = extractHeadings(content)
  if (headings.length === 0) return ''

  let toc = '## 目录\n\n'
  
  headings.forEach(heading => {
    const indent = '  '.repeat(heading.level - 1)
    toc += `${indent}- [${heading.text}](#${heading.id})\n`
  })

  return toc + '\n'
}

/**
 * 为标题添加锚点链接
 */
export const addHeadingAnchors = (content: string): string => {
  return content.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    return `${hashes} ${text} {#${id}}`
  })
}

/**
 * 清理 Markdown 内容（移除所有标记，只保留纯文本）
 */
export const stripMarkdown = (content: string): string => {
  return content
    // 移除代码块
    .replace(/```[\s\S]*?```/g, '')
    // 移除内联代码
    .replace(/`[^`]+`/g, '')
    // 移除图片
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // 移除链接
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 移除粗体和斜体
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // 移除标题标记
    .replace(/^#{1,6}\s+/gm, '')
    // 移除引用标记
    .replace(/^>\s*/gm, '')
    // 移除列表标记
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // 移除分割线
    .replace(/^[-*_]{3,}$/gm, '')
    // 清理多余的空行
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 计算阅读时间（分钟）
 */
export const calculateReadingTime = (content: string, wordsPerMinute = 200): number => {
  const plainText = stripMarkdown(content)
  const words = plainText.split(/\s+/).filter(word => word.length > 0)
  return Math.ceil(words.length / wordsPerMinute)
}

/**
 * 统计字数
 */
export const countWords = (content: string): number => {
  const plainText = stripMarkdown(content)
  return plainText.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * 统计字符数
 */
export const countCharacters = (content: string, includeSpaces = true): number => {
  const plainText = stripMarkdown(content)
  return includeSpaces ? plainText.length : plainText.replace(/\s/g, '').length
}

/**
 * 验证 Markdown 语法
 */
export const validateMarkdown = (content: string): Array<{ line: number; message: string }> => {
  const errors: Array<{ line: number; message: string }> = []
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    const lineNumber = index + 1

    // 检查未闭合的代码块
    if (line.startsWith('```') && !line.includes('```', 3)) {
      const nextCodeBlock = lines.slice(index + 1).findIndex(l => l.trim() === '```')
      if (nextCodeBlock === -1) {
        errors.push({
          line: lineNumber,
          message: '代码块未正确闭合'
        })
      }
    }

    // 检查链接格式
    const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g
    let linkMatch
    while ((linkMatch = linkRegex.exec(line)) !== null) {
      if (!linkMatch[2] || linkMatch[2].trim() === '') {
        errors.push({
          line: lineNumber,
          message: '链接 URL 为空'
        })
      }
    }

    // 检查图片格式
    const imageRegex = /!\[([^\]]*)\]\(([^)]*)\)/g
    let imageMatch
    while ((imageMatch = imageRegex.exec(line)) !== null) {
      if (!imageMatch[2] || imageMatch[2].trim() === '') {
        errors.push({
          line: lineNumber,
          message: '图片 URL 为空'
        })
      }
    }
  })

  return errors
}

/**
 * 格式化 Markdown 内容
 */
export const formatMarkdown = (content: string): string => {
  return content
    // 标准化标题格式
    .replace(/^(#{1,6})([^#\s])/gm, '$1 $2')
    // 标准化列表格式
    .replace(/^(\s*)([*+-])\s+/gm, '$1$2 ')
    .replace(/^(\s*)(\d+\.)\s+/gm, '$1$2 ')
    // 确保代码块前后有空行
    .replace(/(.)\n```/g, '$1\n\n```')
    .replace(/```\n(.)/g, '```\n\n$1')
    // 确保标题前后有空行
    .replace(/(.)\n(#{1,6}\s)/g, '$1\n\n$2')
    .replace(/(#{1,6}\s.*)\n(.)/g, '$1\n\n$2')
    // 清理多余的空行
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 检测 Mermaid 图表
 */
export const detectMermaidCharts = (content: string): Array<{ type: string; code: string }> => {
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  const charts: Array<{ type: string; code: string }> = []
  let match

  while ((match = mermaidRegex.exec(content)) !== null) {
    const code = match[1].trim()
    // 尝试检测图表类型
    const firstLine = code.split('\n')[0].trim()
    let type = 'unknown'
    
    if (firstLine.includes('graph') || firstLine.includes('flowchart')) {
      type = 'flowchart'
    } else if (firstLine.includes('sequenceDiagram')) {
      type = 'sequence'
    } else if (firstLine.includes('classDiagram')) {
      type = 'class'
    } else if (firstLine.includes('gitgraph')) {
      type = 'git'
    } else if (firstLine.includes('pie')) {
      type = 'pie'
    } else if (firstLine.includes('gantt')) {
      type = 'gantt'
    }

    charts.push({ type, code })
  }

  return charts
}

/**
 * 转义 HTML 字符
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 反转义 HTML 字符
 */
export const unescapeHtml = (html: string): string => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

/**
 * 生成唯一 ID
 */
export const generateId = (prefix = 'markdown'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 深拷贝对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (typeof obj === 'object') {
    const cloned = {} as T
    Object.keys(obj).forEach(key => {
      ;(cloned as any)[key] = deepClone((obj as any)[key])
    })
    return cloned
  }
  return obj
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
} 