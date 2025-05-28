import { app, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import axios from 'axios'
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from 'electron-updater'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater');

// GitHub 仓库信息
const GITHUB_REPO = 'AIDotNet/koala-desktop'
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`

export function update(win: Electron.BrowserWindow) {

  // When set to false, the update download will be triggered through the API
  autoUpdater.autoDownload = false
  autoUpdater.disableWebInstaller = false
  autoUpdater.allowDowngrade = false

  // start check
  autoUpdater.on('checking-for-update', function () { 
    console.log('正在检查更新...')
  })
  
  // update available
  autoUpdater.on('update-available', (arg: UpdateInfo) => {
    console.log('发现可用更新:', arg.version)
    win.webContents.send('update-can-available', { 
      update: true, 
      version: app.getVersion(), 
      newVersion: arg?.version 
    })
  })
  
  // update not available
  autoUpdater.on('update-not-available', (arg: UpdateInfo) => {
    console.log('没有可用更新')
    win.webContents.send('update-can-available', { 
      update: false, 
      version: app.getVersion(), 
      newVersion: arg?.version 
    })
  })

  // 检查GitHub Release更新
  ipcMain.handle('check-github-update', async () => {
    try {
      const response = await axios.get(`${GITHUB_API_URL}/releases/latest`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Koala-Desktop-App'
        }
      })

      const releaseInfo = response.data
      const latestVersion = releaseInfo.tag_name.replace(/^v/, '')
      const currentVersion = app.getVersion()

      const hasUpdate = compareVersions(latestVersion, currentVersion) > 0

      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseInfo: hasUpdate ? releaseInfo : undefined
      }
    } catch (error) {
      console.error('检查GitHub更新失败:', error)
      return {
        hasUpdate: false,
        currentVersion: app.getVersion(),
        error: error instanceof Error ? error.message : '检查更新失败'
      }
    }
  })

  // 获取所有GitHub Release
  ipcMain.handle('get-all-releases', async () => {
    try {
      const response = await axios.get(`${GITHUB_API_URL}/releases`, {
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
  })

  // 获取应用信息
  ipcMain.handle('get-app-info', () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      path: app.getAppPath(),
      isPackaged: app.isPackaged,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome
    }
  })

  // Checking for updates
  ipcMain.handle('check-update', async () => {
    if (!app.isPackaged) {
      const error = new Error('The update feature is only available after the package.')
      return { message: error.message, error }
    }

    try {
      return await autoUpdater.checkForUpdatesAndNotify()
    } catch (error) {
      return { message: 'Network error', error }
    }
  })

  // Start downloading and feedback on progress
  ipcMain.handle('start-download', (event: Electron.IpcMainInvokeEvent) => {
    startDownload(
      (error, progressInfo) => {
        if (error) {
          // feedback download error message
          event.sender.send('update-error', { message: error.message, error })
        } else {
          // feedback update progress message
          event.sender.send('download-progress', progressInfo)
        }
      },
      () => {
        // feedback update downloaded message
        event.sender.send('update-downloaded')
      }
    )
  })

  // Install now
  ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void,
) {
  autoUpdater.on('download-progress', (info: ProgressInfo) => callback(null, info))
  autoUpdater.on('error', (error: Error) => callback(error, null))
  autoUpdater.on('update-downloaded', complete)
  autoUpdater.downloadUpdate()
}

// 版本比较函数
function compareVersions(version1: string, version2: string): number {
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
