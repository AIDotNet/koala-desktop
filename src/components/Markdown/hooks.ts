import { useState, useCallback, useEffect } from 'react'

// 复制功能 Hook
export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch (err) {
      console.error('复制失败:', err)
      return false
    }
  }, [])

  return { copied, copy }
}

// 全屏功能 Hook
export const useFullscreen = (initialState = false) => {
  const [isFullscreen, setIsFullscreen] = useState(initialState)

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false)
  }, [])

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true)
  }, [])

  return {
    isFullscreen,
    toggleFullscreen,
    exitFullscreen,
    enterFullscreen
  }
}

// 拖拽和缩放功能 Hook
export const useDragAndResize = (initialPosition = { x: 0, y: 0 }, initialSize = { width: '100%', height: 'auto' }) => {
  const [position, setPosition] = useState(initialPosition)
  const [size, setSize] = useState(initialSize)

  const updatePosition = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition)
  }, [])

  const updateSize = useCallback((newSize: { width: string; height: string }) => {
    setSize(newSize)
  }, [])

  const reset = useCallback(() => {
    setPosition(initialPosition)
    setSize(initialSize)
  }, [initialPosition, initialSize])

  return {
    position,
    size,
    updatePosition,
    updateSize,
    reset
  }
}

// 主题检测 Hook
export const useThemeDetection = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkTheme(e.matches)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDarkTheme(prev => !prev)
  }, [])

  return {
    isDarkTheme,
    toggleTheme,
    setIsDarkTheme
  }
}

// Markdown 内容处理 Hook
export const useMarkdownContent = (initialContent = '') => {
  const [content, setContent] = useState(initialContent)
  const [wordCount, setWordCount] = useState(0)
  const [readTime, setReadTime] = useState(0) // 阅读时间（分钟）

  useEffect(() => {
    // 计算字数和阅读时间
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    const count = words.length
    setWordCount(count)
    
    // 假设每分钟阅读200个字
    const time = Math.ceil(count / 200)
    setReadTime(time)
  }, [content])

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  const clearContent = useCallback(() => {
    setContent('')
  }, [])

  return {
    content,
    wordCount,
    readTime,
    updateContent,
    clearContent
  }
}

// 下载功能 Hook
export const useDownload = () => {
  const downloadAsMarkdown = useCallback((content: string, filename = 'document.md') => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const downloadAsHTML = useCallback((htmlContent: string, filename = 'document.html') => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const downloadAsPDF = useCallback((content: string, filename = 'document.pdf') => {
    // 这里可以集成 PDF 生成库，如 jsPDF
    console.log('PDF 下载功能需要集成 PDF 生成库')
  }, [])

  return {
    downloadAsMarkdown,
    downloadAsHTML,
    downloadAsPDF
  }
}

// 键盘快捷键 Hook
export const useKeyboardShortcuts = (handlers: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, shiftKey, altKey, key } = event
      
      // 生成快捷键字符串
      const modifiers = []
      if (ctrlKey || metaKey) modifiers.push('ctrl')
      if (shiftKey) modifiers.push('shift')
      if (altKey) modifiers.push('alt')
      
      const shortcut = [...modifiers, key.toLowerCase()].join('+')
      
      if (handlers[shortcut]) {
        event.preventDefault()
        handlers[shortcut]()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}

// 本地存储 Hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`获取本地存储失败 (${key}):`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`设置本地存储失败 (${key}):`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`删除本地存储失败 (${key}):`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

// 滚动位置记忆 Hook
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0)

  const saveScrollPosition = useCallback(() => {
    setScrollPosition(window.pageYOffset)
  }, [])

  const restoreScrollPosition = useCallback(() => {
    window.scrollTo(0, scrollPosition)
  }, [scrollPosition])

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.pageYOffset)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return {
    scrollPosition,
    saveScrollPosition,
    restoreScrollPosition
  }
} 