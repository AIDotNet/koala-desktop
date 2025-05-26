import React, { useState } from 'react'
import MarkdownRenderer from './index'
import { useThemeDetection, useMarkdownContent, useKeyboardShortcuts } from './hooks'
import { generateTOC, validateMarkdown, formatMarkdown } from './utils'
import { Settings, Eye, Code, FileText } from 'lucide-react'

const sampleMarkdown = `# Koala Desktop Markdown 渲染器演示

这是一个功能完整的 Markdown 渲染器，支持多种高级功能。

## 基本语法

### 文本格式

**粗体文本** 和 *斜体文本* 以及 ~~删除线文本~~

### 代码

内联代码：\`console.log('Hello World')\`

代码块：

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`欢迎使用 Koala Desktop!\`;
}

// 调用函数
greet('开发者');
\`\`\`

\`\`\`python
import math

def calculate_fibonacci(n):
    """计算斐波那契数列"""
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

# 计算前10个斐波那契数
for i in range(10):
    print(f"F({i}) = {calculate_fibonacci(i)}")
\`\`\`

## 数学公式

内联数学：$E = mc^2$

块级数学公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\begin{aligned}
\\nabla \\times \\vec{F} &= \\left( \\frac{\\partial F_z}{\\partial y} - \\frac{\\partial F_y}{\\partial z} \\right) \\hat{i} \\\\
&\\quad + \\left( \\frac{\\partial F_x}{\\partial z} - \\frac{\\partial F_z}{\\partial x} \\right) \\hat{j} \\\\
&\\quad + \\left( \\frac{\\partial F_y}{\\partial x} - \\frac{\\partial F_x}{\\partial y} \\right) \\hat{k}
\\end{aligned}
$$

## 表格

| 功能 | 支持状态 | 说明 |
|------|---------|------|
| 语法高亮 | ✅ | 支持多种编程语言 |
| 数学公式 | ✅ | 基于 KaTeX |
| Mermaid 图表 | ✅ | 支持多种图表类型 |
| 拖拽缩放 | ✅ | 可选功能 |
| 全屏预览 | ✅ | 沉浸式体验 |

## 引用

> 这是一个引用块。
> 
> 你可以在引用中使用 **Markdown** 语法。
> 
> - 列表项目 1
> - 列表项目 2

## 列表

### 无序列表

- 主要功能
  - Markdown 渲染
  - 代码高亮
  - 数学公式
- 交互功能
  - 复制代码
  - 全屏预览
  - 拖拽移动

### 有序列表

1. 安装依赖
2. 配置组件
3. 使用组件
4. 自定义样式

## Mermaid 图表

### 流程图

\`\`\`mermaid
graph TD
    A[开始] --> B{是否为深色主题?}
    B -->|是| C[应用深色样式]
    B -->|否| D[应用浅色样式]
    C --> E[渲染 Markdown]
    D --> E
    E --> F[显示结果]
    F --> G[结束]
\`\`\`

### 序列图

\`\`\`mermaid
sequenceDiagram
    participant U as 用户
    participant C as 组件
    participant M as Mermaid
    participant S as 语法高亮
    
    U->>C: 传入 Markdown 内容
    C->>M: 解析 mermaid 代码块
    M-->>C: 返回 SVG 图表
    C->>S: 处理代码块
    S-->>C: 返回高亮代码
    C-->>U: 渲染完整内容
\`\`\`

### 饼图

\`\`\`mermaid
pie title 技术栈占比
    "React" : 30
    "TypeScript" : 25
    "CSS" : 20
    "Mermaid" : 15
    "其他" : 10
\`\`\`

## 链接和图片

这是一个 [外部链接](https://github.com) 的示例。

![示例图片](https://via.placeholder.com/400x200/6366f1/ffffff?text=Koala+Desktop)

## 分割线

---

## 其他功能

- [x] 支持 GFM (GitHub Flavored Markdown)
- [x] 自动生成目录
- [x] 语法验证
- [ ] PDF 导出
- [ ] 实时协作编辑

## 键盘快捷键

- \`Ctrl + C\`: 复制内容
- \`F11\`: 全屏切换
- \`Ctrl + D\`: 下载文档
- \`Ctrl + T\`: 切换主题

感谢使用 Koala Desktop Markdown 渲染器！
`

const MarkdownExample: React.FC = () => {
  const { isDarkTheme, toggleTheme } = useThemeDetection()
  const { content, updateContent } = useMarkdownContent(sampleMarkdown)
  const [activeTab, setActiveTab] = useState<'preview' | 'edit' | 'split'>('preview')
  const [enableZoom, setEnableZoom] = useState(false)
  const [enableDrag, setEnableDrag] = useState(false)
  const [enableFullscreen, setEnableFullscreen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // 键盘快捷键
  useKeyboardShortcuts({
    'ctrl+t': toggleTheme,
    'f11': () => setEnableFullscreen(!enableFullscreen),
    'ctrl+1': () => setActiveTab('preview'),
    'ctrl+2': () => setActiveTab('edit'),
    'ctrl+3': () => setActiveTab('split'),
  })

  const handleFormatContent = () => {
    const formatted = formatMarkdown(content)
    updateContent(formatted)
  }

  const handleValidateContent = () => {
    const errors = validateMarkdown(content)
    if (errors.length === 0) {
      alert('Markdown 语法验证通过！')
    } else {
      const errorMessage = errors
        .map(error => `第 ${error.line} 行: ${error.message}`)
        .join('\n')
      alert(`发现以下语法错误:\n\n${errorMessage}`)
    }
  }

  const handleGenerateTOC = () => {
    const toc = generateTOC(content)
    if (toc) {
      updateContent(toc + content)
    }
  }

  return (
    <div className="markdown-example-container" style={{
      minHeight: '100vh',
      background: isDarkTheme 
        ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      <div className="example-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '16px',
        background: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
        borderRadius: '12px',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <h1 style={{
          margin: 0,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Markdown 渲染器演示
        </h1>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'preview' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'preview' ? 'white' : 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <Eye size={16} />
              预览
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'edit' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'edit' ? 'white' : 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <Code size={16} />
              编辑
            </button>
            <button
              onClick={() => setActiveTab('split')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'split' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'split' ? 'white' : 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <FileText size={16} />
              分屏
            </button>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
          borderRadius: '12px',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>设置选项</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={enableZoom}
                onChange={(e) => setEnableZoom(e.target.checked)}
              />
              启用缩放功能
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={enableDrag}
                onChange={(e) => setEnableDrag(e.target.checked)}
              />
              启用拖拽功能
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={enableFullscreen}
                onChange={(e) => setEnableFullscreen(e.target.checked)}
              />
              启用全屏功能
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={isDarkTheme}
                onChange={toggleTheme}
              />
              深色主题
            </label>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleFormatContent}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                background: '#22c55e',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              格式化内容
            </button>
            <button
              onClick={handleValidateContent}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                background: '#f59e0b',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              验证语法
            </button>
            <button
              onClick={handleGenerateTOC}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              生成目录
            </button>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: activeTab === 'split' ? '1fr 1fr' : '1fr',
        gap: '20px',
        minHeight: '600px'
      }}>
        {(activeTab === 'edit' || activeTab === 'split') && (
          <div style={{
            background: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}>
            <div style={{
              padding: '12px 16px',
              background: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
              borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Markdown 编辑器</h3>
            </div>
            <textarea
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              style={{
                width: '100%',
                height: 'calc(100% - 60px)',
                border: 'none',
                outline: 'none',
                padding: '16px',
                fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                background: 'transparent',
                color: 'inherit',
                resize: 'none'
              }}
              placeholder="在此输入 Markdown 内容..."
            />
          </div>
        )}

        {(activeTab === 'preview' || activeTab === 'split') && (
          <div style={{
            background: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}>
            <div style={{
              padding: '12px 16px',
              background: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
              borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>预览效果</h3>
            </div>
            <div style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
              <MarkdownRenderer
                content={content}
                isDarkTheme={isDarkTheme}
                enableCopy={true}
                enableZoom={enableZoom}
                enableDrag={enableDrag}
                enableFullscreen={enableFullscreen}
                style={{
                  height: '100%',
                  border: 'none',
                  borderRadius: 0
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkdownExample 