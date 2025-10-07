// Preload script for space window
import { contextBridge, ipcRenderer } from 'electron';

// Get space path from command line arguments
const spacePath = process.argv.find((arg) => arg.startsWith('--space-path='))?.split('=')[1] || '';

contextBridge.exposeInMainWorld('electronAPI', {
  getSpaceInfo: () => ipcRenderer.invoke('get-space-info'),
  openLauncher: () => ipcRenderer.invoke('open-launcher'),
  getSetting: (key: string) => ipcRenderer.invoke('get-space-setting', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('set-space-setting', key, value),
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
    create: (contentJson: string, parentId?: number | null, startedAt?: Date, endedAt?: Date | null, title?: string | null) =>
      ipcRenderer.invoke('entry:create', contentJson, parentId, startedAt?.toISOString(), endedAt?.toISOString(), title),
    getById: (id: number) =>
      ipcRenderer.invoke('entry:get-by-id', id),
    listPosts: (offset?: number, limit?: number) =>
      ipcRenderer.invoke('entry:list-posts', offset, limit),
    listComments: (parentId: number, offset?: number, limit?: number) =>
      ipcRenderer.invoke('entry:list-comments', parentId, offset, limit),
    update: (id: number, contentJson: string, startedAt?: Date, endedAt?: Date | null, title?: string | null) =>
      ipcRenderer.invoke('entry:update', id, contentJson, startedAt?.toISOString(), endedAt?.toISOString(), title),
    delete: (id: number) =>
      ipcRenderer.invoke('entry:delete', id),
  },
  migration: {
    onStart: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('migration:start', listener);
      return () => ipcRenderer.removeListener('migration:start', listener);
    },
    onProgress: (callback: (data: { current: number; total: number }) => void) => {
      const listener = (_event: any, data: { current: number; total: number }) => callback(data);
      ipcRenderer.on('migration:progress', listener);
      return () => ipcRenderer.removeListener('migration:progress', listener);
    },
    onComplete: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('migration:complete', listener);
      return () => ipcRenderer.removeListener('migration:complete', listener);
    },
    onError: (callback: (data: { message: string }) => void) => {
      const listener = (_event: any, data: { message: string }) => callback(data);
      ipcRenderer.on('migration:error', listener);
      return () => ipcRenderer.removeListener('migration:error', listener);
    },
  },
});

contextBridge.exposeInMainWorld('spacePath', spacePath);
