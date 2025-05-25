export interface ElectronAPI {
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isMaximized: () => Promise<boolean>
  openSettingsWindow: () => Promise<number>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
} 