// Preload script for launcher window
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  createWorkspace: (name: string, path: string) => ipcRenderer.invoke('create-workspace', name, path),
  openWorkspace: () => ipcRenderer.invoke('open-workspace'),
  getRecentWorkspaces: () => ipcRenderer.invoke('get-recent-workspaces'),
  selectWorkspacePath: (name: string) => ipcRenderer.invoke('select-workspace-path', name),
  openWorkspaceByPath: (path: string) => ipcRenderer.invoke('open-workspace-by-path', path),
});
