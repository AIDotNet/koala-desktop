# Koala Desktop 发布流程文档

## 概述

本文档描述了 Koala Desktop 的完整发布流程，包括版本管理、自动构建和发布到 GitHub Releases。

## 发布系统架构

### 1. 版本管理
- **版本管理脚本**: `scripts/version-manager.js`
- **配置文件同步**: 自动更新 `package.json` 和 `src/services/dataManager.ts`
- **Git 标签管理**: 自动创建和推送版本标签

### 2. 自动构建
- **GitHub Actions**: `.github/workflows/release.yml`
- **多平台支持**: Windows、macOS、Linux
- **自动发布**: 构建完成后自动创建 GitHub Release

### 3. 更新检查
- **GitHub API 集成**: 自动检查最新版本
- **用户界面**: 关于页面显示更新状态
- **Electron 更新器**: 支持自动下载和安装

## 发布流程

### 方式一：手动发布（推荐）

1. **检查当前版本**
   ```bash
   npm run version:current
   ```

2. **查看版本信息**
   ```bash
   npm run version:info
   ```

3. **更新版本号**
   ```bash
   # 补丁版本 (2.2.0 -> 2.2.1)
   npm run version:bump
   
   # 次要版本 (2.2.0 -> 2.3.0)
   npm run version:bump:minor
   
   # 主要版本 (2.2.0 -> 3.0.0)
   npm run version:bump:major
   
   # 指定版本
   npm run version:set 2.3.0
   ```

4. **发布版本**
   ```bash
   # 本地发布（不推送到远程）
   npm run release 2.3.0
   
   # 发布并推送到远程（触发自动构建）
   npm run release:push 2.3.0
   
   # 预发布版本
   npm run release:prerelease 2.3.0-beta.1
   ```

### 方式二：GitHub Actions 手动触发

1. 访问 [GitHub Actions](https://github.com/AIDotNet/koala-desktop/actions)
2. 选择 "Release" 工作流
3. 点击 "Run workflow"
4. 输入版本号（如 `2.3.0`）
5. 选择是否为预发布版本
6. 点击 "Run workflow"

### 方式三：Git 标签触发

```bash
# 创建并推送标签
git tag v2.3.0
git push origin v2.3.0
```

## 版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 示例
- `2.2.0` -> `2.2.1`：修复 bug
- `2.2.0` -> `2.3.0`：新增功能
- `2.2.0` -> `3.0.0`：重大更新

## 发布检查清单

### 发布前检查
- [ ] 代码已合并到 `main` 分支
- [ ] 所有测试通过
- [ ] 更新日志已准备
- [ ] 版本号符合语义化版本规范
- [ ] 构建配置正确

### 发布后验证
- [ ] GitHub Release 创建成功
- [ ] 所有平台的安装包已生成
- [ ] 下载链接可用
- [ ] 应用内更新检查正常
- [ ] 版本号显示正确

## 构建产物

每次发布会生成以下文件：

### Windows
- `Koala Desktop_${version}.exe` - NSIS 安装程序

### macOS
- `Koala Desktop_${version}.dmg` - DMG 安装包
- `Koala Desktop_${version}.zip` - ZIP 压缩包

### Linux
- `Koala Desktop_${version}.AppImage` - AppImage 可执行文件

## 自动更新配置

### Electron Builder 配置
```json
{
  "publish": {
    "provider": "github",
    "owner": "AIDotNet",
    "repo": "koala-desktop",
    "releaseType": "release"
  }
}
```

### 更新检查逻辑
- 应用启动时检查更新
- 用户手动检查更新
- 定期后台检查（可配置间隔）

## 故障排除

### 常见问题

1. **构建失败**
   - 检查依赖是否正确安装
   - 验证 Node.js 版本兼容性
   - 查看 GitHub Actions 日志

2. **版本号不一致**
   - 运行 `npm run version:current` 检查
   - 手动同步 `package.json` 和 `dataManager.ts`

3. **更新检查失败**
   - 检查网络连接
   - 验证 GitHub API 访问
   - 查看控制台错误信息

4. **发布权限问题**
   - 确保有仓库写入权限
   - 检查 `GITHUB_TOKEN` 配置

### 调试命令

```bash
# 检查版本管理器
node scripts/version-manager.js info

# 本地构建测试
npm run build:dir

# 查看构建日志
npm run build 2>&1 | tee build.log
```

## 最佳实践

### 1. 版本发布节奏
- **补丁版本**：每周或按需发布
- **次要版本**：每月发布
- **主要版本**：每季度或半年发布

### 2. 预发布版本
- 重大功能先发布 beta 版本
- 收集用户反馈后发布正式版本
- 使用 `-beta.1`、`-rc.1` 等后缀

### 3. 发布说明
- 详细描述新功能和修复
- 包含破坏性变更说明
- 提供升级指南

### 4. 回滚策略
- 保留历史版本的安装包
- 准备快速回滚方案
- 监控发布后的问题反馈

## 相关文件

- `package.json` - 项目配置和版本号
- `electron-builder.json` - 构建配置
- `scripts/version-manager.js` - 版本管理脚本
- `.github/workflows/release.yml` - 发布流水线
- `src/services/dataManager.ts` - 数据管理和更新检查
- `src/pages/About/index.tsx` - 关于页面和更新界面

## 联系方式

如有问题，请联系：
- 邮箱：239573049@qq.com
- GitHub Issues：https://github.com/AIDotNet/koala-desktop/issues 