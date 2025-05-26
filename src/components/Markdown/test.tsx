import React, { useState } from 'react'
import MarkdownRenderer from './index'

const testMarkdown = `# 测试标题

这是一段普通文本，包含 **粗体** 和 *斜体* 格式。

<think>
这是一个推理过程的示例。我需要仔细分析这个问题：

1. 首先，我需要理解用户的需求
2. 然后，我需要制定一个解决方案
3. 最后，我需要实现这个方案

让我想想具体的实现步骤：

\`\`\`javascript
function thinkingProcess(problem) {
    // 分析问题
    const analysis = analyzeProblem(problem);
    
    // 制定方案
    const solution = createSolution(analysis);
    
    // 执行方案
    return executeSolution(solution);
}
\`\`\`

这个思考过程应该是合理的。
</think>

## 代码示例

内联代码：\`console.log('Hello')\`

<think>
用户想要看到代码示例，我应该提供一些有用的例子。让我考虑几种不同的编程语言：

- JavaScript: 现代前端开发的核心
- Python: 数据科学和后端开发的热门选择
- 其他语言也很有用

我会提供这些示例。
</think>

代码块：

\`\`\`javascript
function hello(name) {
    console.log(\`Hello, \${name}!\`);
    return \`欢迎使用 Koala Desktop!\`;
}

hello('开发者');
\`\`\`

\`\`\`python
def greet(name):
    print(f"Hello, {name}!")
    return f"欢迎使用 Koala Desktop!"

greet("开发者")
\`\`\`

## 数学公式

<think>
数学公式对于技术文档很重要。我应该展示一些经典的数学公式，比如爱因斯坦的质能方程和一些积分例子。
</think>

内联数学：$E = mc^2$

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## 表格

| 功能 | 状态 | 说明 |
|------|------|------|
| 语法高亮 | ✅ | 支持 |
| 数学公式 | ✅ | KaTeX |
| 复制功能 | ✅ | 完整 |
| Think支持 | ✅ | 新功能 |

<think>
表格很好地总结了当前的功能状态。用户可以清楚地看到哪些功能已经实现，哪些还在开发中。
</think>

## 列表

- 第一项
- 第二项
  - 子项 1
  - 子项 2

1. 有序列表项 1
2. 有序列表项 2

## 引用

> 这是一个引用块
> 可以包含多行文本

<think>
引用块在技术文档中经常用来强调重要信息或引用其他来源的内容。这是一个很有用的markdown功能。
</think>

## 分割线

---

## 链接

[GitHub](https://github.com)

<think>
这个测试文档很全面，涵盖了markdown的主要功能，同时也测试了新的think功能。用户应该能够看到think块的展开和收缩效果。
</think>
`

const MarkdownTest: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  return (
    <div style={{
      padding: '20px',
      background: isDarkTheme ? '#121218' : '#f9fafb',
      color: isDarkTheme ? '#ffffff' : '#1f2937',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setIsDarkTheme(!isDarkTheme)}
          style={{
            padding: '8px 16px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '12px'
          }}
        >
          切换主题 ({isDarkTheme ? '深色' : '浅色'})
        </button>
        <span style={{ fontSize: '14px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
          测试Think功能：点击"推理内容"按钮查看展开/收缩效果
        </span>
      </div>
      
      <div style={{
        background: isDarkTheme ? 'rgba(34, 34, 51, 0.9)' : 'white',
        borderRadius: '12px',
        padding: '8px',
        boxShadow: isDarkTheme 
          ? '0 2px 8px rgba(0, 0, 0, 0.15)' 
          : '0 2px 6px rgba(0, 0, 0, 0.08)'
      }}>
        <MarkdownRenderer
          content={testMarkdown}
          isDarkTheme={isDarkTheme}
          enableCopy={true}
          enableZoom={false}
          enableDrag={false}
          enableFullscreen={false}
        />
      </div>
    </div>
  )
}

export default MarkdownTest 