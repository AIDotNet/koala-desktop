export interface ElectronAPI {
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isMaximized: () => Promise<boolean>
  openSettingsWindow: () => Promise<number>
  selectFiles: (options?: {
    title?: string
    filters?: Array<{ name: string; extensions: string[] }>
    properties?: Array<'openFile' | 'multiSelections'>
  }) => Promise<{ 
    canceled: boolean; 
    filePaths: string[];
    files: Array<{ name: string; path: string; size: number }>
  }>
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
} 