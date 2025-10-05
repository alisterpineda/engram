// Preload script for workspace window
import { contextBridge, ipcRenderer } from 'electron';

// Get workspace path from command line arguments
const workspacePath = process.argv.find((arg) => arg.startsWith('--workspace-path='))?.split('=')[1] || '';

contextBridge.exposeInMainWorld('electronAPI', {
  getWorkspaceInfo: () => ipcRenderer.invoke('get-workspace-info'),
  openLauncher: () => ipcRenderer.invoke('open-launcher'),
  getSetting: (key: string) => ipcRenderer.invoke('get-workspace-setting', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('set-workspace-setting', key, value),
  theme: {
    getAppTheme: () => ipcRenderer.invoke('get-app-theme'),
    setAppTheme: (theme: 'light' | 'dark' | 'auto') => ipcRenderer.invoke('set-app-theme', theme),
    getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
    onThemeChange: (callback: (theme: 'light' | 'dark' | 'auto') => void) => {
      const listener = (_event: any, theme: 'light' | 'dark' | 'auto') => callback(theme);
      ipcRenderer.on('theme-changed', listener);
      return () => ipcRenderer.removeListener('theme-changed', listener);
    },
    onSystemThemeChange: (callback: (theme: 'light' | 'dark') => void) => {
      const listener = (_event: any, theme: 'light' | 'dark') => callback(theme);
      ipcRenderer.on('system-theme-changed', listener);
      return () => ipcRenderer.removeListener('system-theme-changed', listener);
    },
  },
  entry: {
    create: (contentJson: string, contentHtml: string, parentId?: number | null, occurredAt?: Date, endedAt?: Date | null) =>
      ipcRenderer.invoke('entry:create', contentJson, contentHtml, parentId, occurredAt?.toISOString(), endedAt?.toISOString()),
    getById: (id: number) =>
      ipcRenderer.invoke('entry:get-by-id', id),
    listPosts: (offset?: number, limit?: number) =>
      ipcRenderer.invoke('entry:list-posts', offset, limit),
    listComments: (parentId: number, offset?: number, limit?: number) =>
      ipcRenderer.invoke('entry:list-comments', parentId, offset, limit),
    update: (id: number, contentJson: string, contentHtml: string, occurredAt?: Date, endedAt?: Date | null) =>
      ipcRenderer.invoke('entry:update', id, contentJson, contentHtml, occurredAt?.toISOString(), endedAt?.toISOString()),
    delete: (id: number) =>
      ipcRenderer.invoke('entry:delete', id),
  },
});

contextBridge.exposeInMainWorld('workspacePath', workspacePath);
