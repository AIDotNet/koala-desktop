import React, { useState, useEffect } from 'react'
import MarkdownRenderer from './index'

const streamingContent = `# 流式输出测试

这是正常的内容。

<think>
这是第一个完整的推理块。

我需要分析这个问题：
1. 理解需求
2. 制定方案
3. 实现功能
</think>

这里是一些普通内容，然后开始流式输出...

<think>
这是第二个推理过程，正在流式输出中...

现在我需要考虑以下几点：
- 如何处理不完整的标签
- 如何确保用户体验流畅
- 如何避免解析错误

让我写一些代码来解决这个问题：

\`\`\`javascript
function handleStreaming(content) {
    // 检查是否有未完成的标签
    const openTags = content.match(/<think>/g) || [];
    const closeTags = content.match(/<\/think>/g) || [];
    
    if (openTags.length > closeTags.length) {
        // 处理未完成的情况
        return processIncomplete(content);
    }
    
    return processComplete(content);
}
\`\`\`

这个方案应该可以很好地处理流式输出的情况。
</think>

## 总结

通过以上的分析和实现，我们成功解决了流式输出中think标签处理的问题。`

const StreamingTest: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [currentContent, setCurrentContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  // 模拟流式输出
  const startStreaming = () => {
    setIsStreaming(true)
    setCurrentContent('')
    
    const chars = streamingContent.split('')
    let index = 0
    
    const streamInterval = setInterval(() => {
      if (index >= chars.length) {
        clearInterval(streamInterval)
        setIsStreaming(false)
        return
      }
      
      // 每次添加1-3个字符来模拟真实的流式输出
      const step = Math.min(Math.floor(Math.random() * 3) + 1, chars.length - index)
      const nextChars = chars.slice(index, index + step).join('')
      
      setCurrentContent(prev => prev + nextChars)
      index += step
    }, 50) // 每50ms更新一次
  }

  const resetStream = () => {
    setCurrentContent(streamingContent)
    setIsStreaming(false)
  }

  return (
    <div style={{
      padding: '20px',
      background: isDarkTheme ? '#121218' : '#f9fafb',
      color: isDarkTheme ? '#ffffff' : '#1f2937',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={() => setIsDarkTheme(!isDarkTheme)}
          style={{
            padding: '8px 16px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          切换主题 ({isDarkTheme ? '深色' : '浅色'})
        </button>
        
        <button
          onClick={startStreaming}
          disabled={isStreaming}
          style={{
            padding: '8px 16px',
            background: isStreaming ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isStreaming ? 'not-allowed' : 'pointer'
          }}
        >
          {isStreaming ? '流式输出中...' : '开始流式输出'}
        </button>
        
        <button
          onClick={resetStream}
          style={{
            padding: '8px 16px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          显示完整内容
        </button>
        
        <span style={{ fontSize: '14px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
          当前字符数: {currentContent.length} / {streamingContent.length}
        </span>
      </div>
      
      <div style={{
        background: isDarkTheme ? 'rgba(34, 34, 51, 0.9)' : 'white',
        borderRadius: '12px',
        padding: '8px',
        boxShadow: isDarkTheme 
          ? '0 2px 8px rgba(0, 0, 0, 0.15)' 
          : '0 2px 6px rgba(0, 0, 0, 0.08)',
        minHeight: '400px'
      }}>
        <MarkdownRenderer
          content={currentContent}
          isDarkTheme={isDarkTheme}
          enableCopy={true}
          enableZoom={false}
          enableDrag={false}
          enableFullscreen={false}
        />
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: isDarkTheme ? 'rgba(34, 34, 51, 0.5)' : 'rgba(243, 244, 246, 0.8)',
        borderRadius: '8px',
        border: `1px solid ${isDarkTheme ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'}`
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>测试说明</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
          <li>点击"开始流式输出"观察think标签在流式过程中的处理</li>
          <li>注意未完成的think标签不会显示为推理块</li>
          <li>只有完整的think标签对才会被解析为可展开的推理内容</li>
          <li>流式过程中不会出现解析错误或显示异常</li>
        </ul>
      </div>
    </div>
  )
}

export default StreamingTest 