#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class VersionManager {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..')
    this.packageJsonPath = path.join(this.rootDir, 'package.json')
    this.electronBuilderPath = path.join(this.rootDir, 'electron-builder.json')
    this.dataManagerPath = path.join(this.rootDir, 'src/services/dataManager.ts')
  }

  // 读取当前版本
  getCurrentVersion() {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'))
    return packageJson.version
  }

  // 更新版本号
  updateVersion(newVersion, updateType = 'patch') {
    console.log(`🔄 正在更新版本号到 ${newVersion}...`)

    // 1. 更新 package.json
    this.updatePackageJson(newVersion)

    // 2. 更新 dataManager.ts 中的默认版本
    this.updateDataManager(newVersion)

    // 3. 提交更改
    this.commitChanges(newVersion)

    console.log(`✅ 版本号已更新到 ${newVersion}`)
    return newVersion
  }

  // 更新 package.json
  updatePackageJson(version) {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'))
    packageJson.version = version
    fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    console.log(`📦 已更新 package.json 版本到 ${version}`)
  }

  // 更新 dataManager.ts 中的默认版本
  updateDataManager(version) {
    let content = fs.readFileSync(this.dataManagerPath, 'utf8')
    
    // 替换默认配置中的版本号
    content = content.replace(
      /version: '[^']*'/,
      `version: '${version}'`
    )
    
    fs.writeFileSync(this.dataManagerPath, content)
    console.log(`🔧 已更新 dataManager.ts 版本到 ${version}`)
  }

  // 提交更改
  commitChanges(version) {
    try {
      execSync('git add package.json src/services/dataManager.ts', { stdio: 'inherit' })
      execSync(`git commit -m "chore: bump version to ${version}"`, { stdio: 'inherit' })
      console.log(`📝 已提交版本更新到 Git`)
    } catch (error) {
      console.log(`⚠️  Git 提交失败，可能没有更改或 Git 未配置`)
    }
  }

  // 创建标签
  createTag(version) {
    try {
      const tag = `v${version}`
      execSync(`git tag ${tag}`, { stdio: 'inherit' })
      console.log(`🏷️  已创建标签 ${tag}`)
      return tag
    } catch (error) {
      console.error(`❌ 创建标签失败:`, error.message)
      return null
    }
  }

  // 推送到远程仓库
  pushToRemote(version) {
    try {
      execSync('git push origin main', { stdio: 'inherit' })
      execSync(`git push origin v${version}`, { stdio: 'inherit' })
      console.log(`🚀 已推送到远程仓库`)
    } catch (error) {
      console.error(`❌ 推送失败:`, error.message)
    }
  }

  // 自动递增版本号
  bumpVersion(type = 'patch') {
    const currentVersion = this.getCurrentVersion()
    const versionParts = currentVersion.split('.').map(Number)
    
    switch (type) {
      case 'major':
        versionParts[0]++
        versionParts[1] = 0
        versionParts[2] = 0
        break
      case 'minor':
        versionParts[1]++
        versionParts[2] = 0
        break
      case 'patch':
      default:
        versionParts[2]++
        break
    }
    
    return versionParts.join('.')
  }

  // 验证版本号格式
  validateVersion(version) {
    const versionRegex = /^\d+\.\d+\.\d+$/
    return versionRegex.test(version)
  }

  // 比较版本号
  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1
      if (v1Parts[i] < v2Parts[i]) return -1
    }
    
    return 0
  }

  // 获取版本信息
  getVersionInfo() {
    const currentVersion = this.getCurrentVersion()
    const nextPatch = this.bumpVersion('patch')
    const nextMinor = this.bumpVersion('minor')
    const nextMajor = this.bumpVersion('major')

    return {
      current: currentVersion,
      nextPatch,
      nextMinor,
      nextMajor
    }
  }

  // 发布流程
  async release(version, options = {}) {
    const { 
      createTag = true, 
      pushToRemote = false, 
      prerelease = false 
    } = options

    console.log(`🚀 开始发布流程...`)
    console.log(`📋 发布版本: ${version}`)
    console.log(`📋 预发布: ${prerelease ? '是' : '否'}`)

    // 验证版本号
    if (!this.validateVersion(version)) {
      throw new Error(`❌ 无效的版本号格式: ${version}`)
    }

    // 检查版本号是否比当前版本新
    const currentVersion = this.getCurrentVersion()
    if (this.compareVersions(version, currentVersion) <= 0) {
      throw new Error(`❌ 新版本号 ${version} 必须大于当前版本 ${currentVersion}`)
    }

    // 更新版本号
    this.updateVersion(version)

    // 创建标签
    if (createTag) {
      this.createTag(version)
    }

    // 推送到远程仓库
    if (pushToRemote) {
      this.pushToRemote(version)
    }

    console.log(`🎉 发布流程完成!`)
    console.log(`📦 版本: ${version}`)
    console.log(`🏷️  标签: v${version}`)
    
    if (pushToRemote) {
      console.log(`🌐 GitHub Actions 将自动构建和发布`)
      console.log(`🔗 查看发布状态: https://github.com/AIDotNet/koala-desktop/actions`)
    }

    return version
  }
}

// 命令行接口
function main() {
  const versionManager = new VersionManager()
  const args = process.argv.slice(2)
  const command = args[0]

  try {
    switch (command) {
      case 'current':
        console.log(`当前版本: ${versionManager.getCurrentVersion()}`)
        break

      case 'info':
        const info = versionManager.getVersionInfo()
        console.log('版本信息:')
        console.log(`  当前版本: ${info.current}`)
        console.log(`  下个补丁版本: ${info.nextPatch}`)
        console.log(`  下个次要版本: ${info.nextMinor}`)
        console.log(`  下个主要版本: ${info.nextMajor}`)
        break

      case 'bump':
        const type = args[1] || 'patch'
        const newVersion = versionManager.bumpVersion(type)
        versionManager.updateVersion(newVersion)
        break

      case 'set':
        const version = args[1]
        if (!version) {
          throw new Error('请提供版本号')
        }
        versionManager.updateVersion(version)
        break

      case 'release':
        const releaseVersion = args[1]
        const prerelease = args.includes('--prerelease')
        const push = args.includes('--push')
        
        if (!releaseVersion) {
          throw new Error('请提供发布版本号')
        }
        
        versionManager.release(releaseVersion, {
          createTag: true,
          pushToRemote: push,
          prerelease
        })
        break

      case 'tag':
        const tagVersion = args[1] || versionManager.getCurrentVersion()
        versionManager.createTag(tagVersion)
        break

      default:
        console.log(`
Koala Desktop 版本管理工具

用法:
  node scripts/version-manager.js <command> [options]

命令:
  current                    显示当前版本
  info                       显示版本信息
  bump [patch|minor|major]   递增版本号 (默认: patch)
  set <version>              设置指定版本号
  release <version> [--prerelease] [--push]  发布版本
  tag [version]              创建版本标签

示例:
  node scripts/version-manager.js current
  node scripts/version-manager.js bump minor
  node scripts/version-manager.js set 2.3.0
  node scripts/version-manager.js release 2.3.0 --push
  node scripts/version-manager.js release 2.3.0-beta.1 --prerelease --push
        `)
        break
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = VersionManager 