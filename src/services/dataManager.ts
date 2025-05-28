import axios from 'axios'

export interface AppConfig {
  version: string
  appName: string
  description: string
  author: string
  repository: string
  homepage: string
  updateUrl: string
  autoUpdate: boolean
  checkUpdateInterval: number // 分钟
  language: string
  theme: 'light' | 'dark' | 'auto'
  windowSettings: {
    width: number
    height: number
    minWidth: number
    minHeight: number
    resizable: boolean
    maximizable: boolean
  }
}

export interface ReleaseInfo {
  tag_name: string
  name: string
  body: string
  published_at: string
  assets: Array<{
    name: string
    download_url: string
    size: number
  }>
  prerelease: boolean
  draft: boolean
}

class DataManager {
  private config: AppConfig | null = null
  private readonly configKey = 'app-config'
  private readonly githubRepo = 'AIDotNet/koala-desktop'
  private readonly githubApiUrl = `https://api.github.com/repos/${this.githubRepo}`

  // 获取默认配置
  private getDefaultConfig(): AppConfig {
    return {
      version: '2.2.0',
      appName: 'Koala Desktop',
      description: 'TokenAI 的一款AI客户端产品KoalaAI，用于提供AI对话能力。',
      author: 'TokenAI',
      repository: `https://github.com/${this.githubRepo}`,
      homepage: `https://github.com/${this.githubRepo}`,
      updateUrl: `${this.githubApiUrl}/releases/latest`,
      autoUpdate: true,
      checkUpdateInterval: 60, // 60分钟检查一次
      language: 'zh-CN',
      theme: 'dark',
      windowSettings: {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        resizable: true,
        maximizable: true
      }
    }
  }

  // 初始化配置
  async initConfig(): Promise<AppConfig> {
    try {
      const stored = localStorage.getItem(this.configKey)
      if (stored) {
        this.config = { ...this.getDefaultConfig(), ...JSON.parse(stored) }
      } else {
        this.config = this.getDefaultConfig()
        await this.saveConfig()
      }
      return this.config
    } catch (error) {
      console.error('初始化配置失败:', error)
      this.config = this.getDefaultConfig()
      return this.config
    }
  }

  // 获取配置
  getConfig(): AppConfig {
    return this.config || this.getDefaultConfig()
  }

  // 更新配置
  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    if (!this.config) {
      this.config = await this.initConfig()
    }
    this.config = { ...this.config!, ...updates }
    await this.saveConfig()
  }

  // 保存配置
  private async saveConfig(): Promise<void> {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(this.config))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  // 获取当前版本
  getCurrentVersion(): string {
    return this.getConfig().version
  }

  // 检查更新
  async checkForUpdates(): Promise<{
    hasUpdate: boolean
    currentVersion: string
    latestVersion?: string
    releaseInfo?: ReleaseInfo
    error?: string
  }> {
    try {
      const response = await axios.get(`${this.githubApiUrl}/releases/latest`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Koala-Desktop-App'
        }
      })

      const releaseInfo: ReleaseInfo = response.data
      const latestVersion = releaseInfo.tag_name.replace(/^v/, '')
      const currentVersion = this.getCurrentVersion()

      const hasUpdate = this.compareVersions(latestVersion, currentVersion) > 0

      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseInfo: hasUpdate ? releaseInfo : undefined
      }
    } catch (error) {
      console.error('检查更新失败:', error)
      return {
        hasUpdate: false,
        currentVersion: this.getCurrentVersion(),
        error: error instanceof Error ? error.message : '检查更新失败'
      }
    }
  }

  // 获取所有发布版本
  async getAllReleases(): Promise<ReleaseInfo[]> {
    try {
      const response = await axios.get(`${this.githubApiUrl}/releases`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Koala-Desktop-App'
        }
      })
      return response.data
    } catch (error) {
      console.error('获取发布版本失败:', error)
      return []
    }
  }

  // 版本比较函数
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length)
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }
    
    return 0
  }

  // 获取应用信息
  getAppInfo() {
    const config = this.getConfig()
    return {
      name: config.appName,
      version: config.version,
      description: config.description,
      author: config.author,
      repository: config.repository,
      homepage: config.homepage
    }
  }

  // 获取系统信息
  getSystemInfo() {
    // 在渲染进程中，我们需要通过IPC获取系统信息
    // 或者使用可用的Web API
    const userAgent = navigator.userAgent
    let platform = 'unknown'
    let arch = 'unknown'
    
    if (userAgent.includes('Windows')) {
      platform = 'win32'
    } else if (userAgent.includes('Mac')) {
      platform = 'darwin'
    } else if (userAgent.includes('Linux')) {
      platform = 'linux'
    }
    
    if (userAgent.includes('x64') || userAgent.includes('x86_64')) {
      arch = 'x64'
    } else if (userAgent.includes('arm64') || userAgent.includes('aarch64')) {
      arch = 'arm64'
    }

    return {
      platform,
      arch,
      nodeVersion: process.versions?.node || 'unknown',
      electronVersion: process.versions?.electron || 'unknown',
      chromeVersion: process.versions?.chrome || 'unknown'
    }
  }

  // 重置配置
  async resetConfig(): Promise<void> {
    this.config = this.getDefaultConfig()
    await this.saveConfig()
  }
}

export const dataManager = new DataManager() 