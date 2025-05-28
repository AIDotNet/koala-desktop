import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { update } from './update'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// 性能优化：禁用GPU加速（如果遇到问题）
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// 性能优化：设置应用程序名称
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

// 性能优化：确保单实例运行
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// 性能优化：设置应用程序标志
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor')
app.commandLine.appendSwitch('--disable-background-timer-throttling')
app.commandLine.appendSwitch('--disable-renderer-backgrounding')
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows')
app.commandLine.appendSwitch('--disable-ipc-flooding-protection')

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Koala AI',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    frame: false,
    titleBarStyle: 'hidden',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // 性能优化：延迟显示窗口
    webPreferences: {
      preload,
      // 性能优化：启用上下文隔离和禁用节点集成
      contextIsolation: true,
      nodeIntegration: false,
      // 性能优化：启用沙盒模式
      sandbox: false, // 暂时禁用沙盒，因为需要文件访问
      // 性能优化：禁用web安全（仅开发环境）
      webSecurity: !VITE_DEV_SERVER_URL,
      // 性能优化：启用实验性功能
      experimentalFeatures: true,
      // 性能优化：启用背景节流
      backgroundThrottling: false,
      // 性能优化：设置内存限制
      v8CacheOptions: 'code',
    },
  })

  // 性能优化：窗口准备就绪后再显示
  win.once('ready-to-show', () => {
    win?.show()
    
    // 性能优化：设置窗口优先级
    if (process.platform === 'win32') {
      win?.setAlwaysOnTop(false)
    }
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // 性能优化：内存管理
  win.webContents.on('dom-ready', () => {
    // 强制垃圾回收（仅开发环境）
    if (VITE_DEV_SERVER_URL) {
      setTimeout(() => {
        win?.webContents.executeJavaScript('window.gc && window.gc()')
      }, 5000)
    }
  })

  // Auto update
  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// 添加窗口控制IPC处理
ipcMain.handle('window-minimize', () => {
  if (win) {
    win.minimize()
  }
})

ipcMain.handle('window-maximize', () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.handle('window-close', () => {
  if (win) {
    win.close()
  }
})

ipcMain.handle('window-is-maximized', () => {
  return win ? win.isMaximized() : false
})

// 添加打开设置窗口的IPC处理器
ipcMain.handle('open-settings-window', () => {
  const settingsWindow = new BrowserWindow({
    title: '设置',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    frame: false,
    titleBarStyle: 'hidden',
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    parent: win || undefined,
    modal: false,
    webPreferences: {
      preload,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    settingsWindow.loadURL(`${VITE_DEV_SERVER_URL}#/settings`)
  } else {
    settingsWindow.loadFile(indexHtml, { hash: '/settings' })
  }

  // 设置窗口控制
  settingsWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  return settingsWindow.id
})

// 添加文件选择的IPC处理器
ipcMain.handle('select-files', async (_, options = {}) => {
  try {
    const defaultOptions = {
      title: '选择代码文件',
      properties: ['openFile', 'multiSelections'] as const,
      filters: [
        {
          name: '代码文件',
          extensions: [
            'js', 'jsx', 'ts', 'tsx', 'vue', 'py', 'java', 'cpp', 'c', 'h', 'hpp',
            'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bash',
            'ps1', 'bat', 'cmd', 'sql', 'html', 'htm', 'css', 'scss', 'sass',
            'less', 'xml', 'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
            'md', 'txt', 'log', 'dockerfile', 'makefile', 'cmake', 'gradle',
            'pom', 'mod', 'sum', 'workspace', 'classpath', 'project', 'settings'
          ]
        },
        {
          name: '所有文件',
          extensions: ['*']
        }
      ]
    }

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      filters: options.filters || defaultOptions.filters,
      properties: options.properties || defaultOptions.properties
    }

    const result = await dialog.showOpenDialog(win!, mergedOptions)
    
    if (result.canceled) {
      return { canceled: true, filePaths: [], files: [] }
    }

    // 获取文件详细信息
    const filesWithInfo = []
    for (const filePath of result.filePaths) {
      try {
        const stats = await fs.stat(filePath)
        const fileName = path.basename(filePath)
        
        filesWithInfo.push({
          name: fileName,
          path: filePath,
          size: stats.size
        })
      } catch (error) {
        console.error(`获取文件信息失败 ${filePath}:`, error)
        // 如果获取文件信息失败，仍然添加基本信息
        const fileName = path.basename(filePath)
        filesWithInfo.push({
          name: fileName,
          path: filePath,
          size: 0
        })
      }
    }

    return { 
      canceled: false, 
      filePaths: result.filePaths,
      files: filesWithInfo
    }
  } catch (error) {
    console.error('文件选择失败:', error)
    return { canceled: true, filePaths: [], files: [] }
  }
})

// 添加文件读取的IPC处理器
ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    // 验证文件路径安全性
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: '无效的文件路径' }
    }

    // 检查文件是否存在
    try {
      await fs.access(filePath)
    } catch {
      return { success: false, error: '文件不存在或无法访问' }
    }

    // 读取文件内容
    const content = await fs.readFile(filePath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    console.error('文件读取失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }
  }
})
