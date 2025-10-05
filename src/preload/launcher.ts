// Preload script for launcher window
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  createSpace: (name: string, path: string) => ipcRenderer.invoke('create-space', name, path),
  openSpace: () => ipcRenderer.invoke('open-space'),
  getRecentSpaces: () => ipcRenderer.invoke('get-recent-spaces'),
  selectSpacePath: (name: string) => ipcRenderer.invoke('select-space-path', name),
  openSpaceByPath: (path: string) => ipcRenderer.invoke('open-space-by-path', path),
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
});
