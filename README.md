# Koala Desktop

一款基于 Electron + React + TypeScript 构建的现代化桌面AI助手应用。

## ✨ 特性

- 🤖 **多模型支持** - 支持 OpenAI、Ollama、DeepSeek、GitHub Models 等多种AI模型
- 🎨 **现代化界面** - 基于 Ant Design 和 LobeUI 的精美界面设计
- 🌙 **深色主题** - 支持深色/浅色主题切换
- 💬 **智能对话** - 流式对话体验，支持 Markdown 渲染
- 📁 **会话管理** - 本地会话存储，支持会话导入导出
- 🔄 **自动更新** - 集成 GitHub Releases 的自动更新系统
- 🌐 **多语言支持** - 支持中文和英文界面
- 📊 **数据管理** - 完整的数据管理和配置系统

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
# 构建所有平台
npm run build

# 构建特定平台
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## 📦 版本管理

项目集成了完整的版本管理系统：

### 查看版本信息

```bash
npm run version:current  # 查看当前版本
npm run version:info     # 查看版本详情
```

### 更新版本

```bash
npm run version:bump         # 补丁版本 (2.2.0 -> 2.2.1)
npm run version:bump:minor   # 次要版本 (2.2.0 -> 2.3.0)
npm run version:bump:major   # 主要版本 (2.2.0 -> 3.0.0)
npm run version:set 2.3.0    # 设置指定版本
```

### 发布版本

```bash
npm run release 2.3.0        # 本地发布
npm run release:push 2.3.0   # 发布并推送到GitHub
```

## 🔄 自动更新系统

应用内置了完整的自动更新系统：

- **GitHub Releases 集成** - 自动检查最新版本
- **用户界面** - 在关于页面显示更新状态
- **手动检查** - 支持用户手动检查更新
- **下载安装** - 一键下载和安装新版本

## 🏗️ 技术架构

### 前端技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite + Electron Builder
- **UI 库**: Ant Design + LobeUI
- **图标**: Lucide React
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router

### 后端技术栈

- **运行时**: Electron 36
- **数据存储**: IndexedDB
- **网络请求**: Axios
- **更新系统**: electron-updater

### 开发工具

- **代码检查**: ESLint + TypeScript
- **测试框架**: Vitest + Playwright
- **版本管理**: 自定义版本管理脚本
- **CI/CD**: GitHub Actions

## 📁 项目结构

```
koala-desktop/
├── electron/                 # Electron 主进程代码
│   ├── main/                 # 主进程
│   └── preload/              # 预加载脚本
├── src/                      # 渲染进程代码
│   ├── components/           # React 组件
│   ├── pages/               # 页面组件
│   ├── services/            # 服务层
│   ├── utils/               # 工具函数
│   └── types/               # 类型定义
├── scripts/                 # 构建和版本管理脚本
├── docs/                    # 项目文档
├── .github/                 # GitHub Actions 配置
└── release/                 # 构建产物
```

## 🔧 配置说明

### 应用配置

应用配置存储在 `localStorage` 中，包括：

- 版本信息
- 主题设置
- 语言偏好
- 窗口设置
- 更新配置

### 模型配置

支持的AI模型提供商：

- **OpenAI** - GPT-4o, GPT-4o-mini 等
- **Ollama** - 本地部署的开源模型
- **DeepSeek** - DeepSeek V3, DeepSeek R1
- **GitHub Models** - GitHub 提供的模型服务

## 🚀 发布流程

### 自动发布

1. 推送标签触发自动构建：
   ```bash
   git tag v2.3.0
   git push origin v2.3.0
   ```

2. GitHub Actions 自动构建多平台安装包

3. 自动创建 GitHub Release

### 手动发布

1. 在 GitHub Actions 页面手动触发 Release 工作流
2. 输入版本号和发布选项
3. 等待构建完成

## 📖 文档

- [发布流程文档](docs/RELEASE.md) - 详细的发布流程说明
- [API 文档](docs/API.md) - 接口文档（开发中）
- [贡献指南](docs/CONTRIBUTING.md) - 贡献代码指南（开发中）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 📞 联系方式

- 邮箱：239573049@qq.com
- GitHub：https://github.com/AIDotNet/koala-desktop
- Issues：https://github.com/AIDotNet/koala-desktop/issues

---

**Koala Desktop** - 让AI助手触手可及 🐨