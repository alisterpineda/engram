// Preload script for workspace window
import { contextBridge, ipcRenderer } from 'electron';

// Get workspace path from command line arguments
const workspacePath = process.argv.find((arg) => arg.startsWith('--workspace-path='))?.split('=')[1] || '';

contextBridge.exposeInMainWorld('electronAPI', {
  getWorkspaceInfo: () => ipcRenderer.invoke('get-workspace-info'),
  openLauncher: () => ipcRenderer.invoke('open-launcher'),
  getSetting: (key: string) => ipcRenderer.invoke('get-workspace-setting', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('set-workspace-setting', key, value),
  entry: {
    create: (body: string, parentId?: number | null) =>
      ipcRenderer.invoke('entry:create', body, parentId),
    getById: (id: number) =>
      ipcRenderer.invoke('entry:get-by-id', id),
    listPosts: (offset?: number, limit?: number) =>
      ipcRenderer.invoke('entry:list-posts', offset, limit),
    listComments: (parentId: number, offset?: number, limit?: number) =>
      ipcRenderer.invoke('entry:list-comments', parentId, offset, limit),
    update: (id: number, body: string) =>
      ipcRenderer.invoke('entry:update', id, body),
    delete: (id: number) =>
      ipcRenderer.invoke('entry:delete', id),
  },
});

contextBridge.exposeInMainWorld('workspacePath', workspacePath);
