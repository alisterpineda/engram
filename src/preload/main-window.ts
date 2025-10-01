// Preload script for workspace window
import { contextBridge, ipcRenderer } from 'electron';

// Get workspace path from command line arguments
const workspacePath = process.argv.find((arg) => arg.startsWith('--workspace-path='))?.split('=')[1] || '';

contextBridge.exposeInMainWorld('electronAPI', {
  getWorkspaceInfo: () => ipcRenderer.invoke('get-workspace-info'),
  renameWorkspace: (newName: string) => ipcRenderer.invoke('rename-workspace', newName),
  openLauncher: () => ipcRenderer.invoke('open-launcher'),
  getSetting: (key: string) => ipcRenderer.invoke('get-workspace-setting', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('set-workspace-setting', key, value),
});

contextBridge.exposeInMainWorld('workspacePath', workspacePath);
