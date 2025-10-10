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
  note: {
    getReferences: (id: number) =>
      ipcRenderer.invoke('note:get-references', id),
  },
  entry: {
    create: (contentJson: string, referenceIds?: number[], startedAt?: Date, endedAt?: Date | null, title?: string | null) =>
      ipcRenderer.invoke('entry:create', contentJson, referenceIds, startedAt?.toISOString(), endedAt?.toISOString(), title),
    getById: (id: number) =>
      ipcRenderer.invoke('entry:get-by-id', id),
    listAll: (offset?: number, limit?: number) =>
      ipcRenderer.invoke('entry:list-all', offset, limit),
    getReferencedNotes: (id: number) =>
      ipcRenderer.invoke('entry:get-referenced-notes', id),
    addReference: (sourceId: number, targetId: number) =>
      ipcRenderer.invoke('entry:add-reference', sourceId, targetId),
    removeReference: (sourceId: number, targetId: number) =>
      ipcRenderer.invoke('entry:remove-reference', sourceId, targetId),
    update: (id: number, contentJson: string, startedAt?: Date, endedAt?: Date | null, title?: string | null) =>
      ipcRenderer.invoke('entry:update', id, contentJson, startedAt?.toISOString(), endedAt?.toISOString(), title),
    delete: (id: number) =>
      ipcRenderer.invoke('entry:delete', id),
  },
  page: {
    create: (contentJson: string, title: string, referenceIds?: number[]) =>
      ipcRenderer.invoke('page:create', contentJson, title, referenceIds),
    listAll: (offset?: number, limit?: number) =>
      ipcRenderer.invoke('page:list-all', offset, limit),
    getById: (id: number) =>
      ipcRenderer.invoke('page:get-by-id', id),
    update: (id: number, contentJson: string, title: string) =>
      ipcRenderer.invoke('page:update', id, contentJson, title),
    delete: (id: number) =>
      ipcRenderer.invoke('page:delete', id),
  },
  contact: {
    create: (contentJson: string, title: string, referenceIds?: number[]) =>
      ipcRenderer.invoke('contact:create', contentJson, title, referenceIds),
    listAll: (offset?: number, limit?: number) =>
      ipcRenderer.invoke('contact:list-all', offset, limit),
    getById: (id: number) =>
      ipcRenderer.invoke('contact:get-by-id', id),
    update: (id: number, contentJson: string, title: string) =>
      ipcRenderer.invoke('contact:update', id, contentJson, title),
    delete: (id: number) =>
      ipcRenderer.invoke('contact:delete', id),
  },
  comment: {
    create: (parentId: number, contentJson: string, commentedAt?: Date, title?: string | null) =>
      ipcRenderer.invoke('comment:create', parentId, contentJson, commentedAt?.toISOString(), title),
    listByParent: (parentId: number) =>
      ipcRenderer.invoke('comment:list-by-parent', parentId),
    getById: (id: number) =>
      ipcRenderer.invoke('comment:get-by-id', id),
    update: (id: number, contentJson: string, commentedAt?: Date, title?: string | null) =>
      ipcRenderer.invoke('comment:update', id, contentJson, commentedAt?.toISOString(), title),
    delete: (id: number) =>
      ipcRenderer.invoke('comment:delete', id),
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
