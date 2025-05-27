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

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    frame: false,
    titleBarStyle: 'hidden',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
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
    return result
  } catch (error) {
    console.error('文件选择失败:', error)
    return { canceled: true, filePaths: [] }
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
