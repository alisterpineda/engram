/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import '@mantine/core/styles.css';
import '../assets/index.css';

import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme, AppShell, Burger, Group, Text, Button, Stack, ActionIcon, TextInput, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';

const theme = createTheme({
  /** Put your mantine theme override here */
});

interface WorkspaceElectronAPI {
  getWorkspaceInfo: () => Promise<{ success: boolean; data?: { name: string; path: string }; error?: string }>;
  renameWorkspace: (newName: string) => Promise<{ success: boolean; error?: string }>;
  openLauncher: () => Promise<{ success: boolean }>;
  getSetting: (key: string) => Promise<{ success: boolean; value: string | null }>;
  setSetting: (key: string, value: string) => Promise<{ success: boolean }>;
}

const electronAPI = (window as any).electronAPI as WorkspaceElectronAPI;

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [workspaceName, setWorkspaceName] = useState('Workspace');
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    // Load workspace info on mount
    electronAPI.getWorkspaceInfo().then((result) => {
      if (result.success && result.data) {
        setWorkspaceName(result.data.name);
      }
    });
  }, []);

  const handleOpenLauncher = () => {
    electronAPI.openLauncher();
  };

  const handleRenameClick = () => {
    setNewName(workspaceName);
    openRename();
  };

  const handleRenameSubmit = async () => {
    if (newName.trim()) {
      const result = await electronAPI.renameWorkspace(newName.trim());
      if (result.success) {
        setWorkspaceName(newName.trim());
        closeRename();
      } else {
        alert(`Failed to rename workspace: ${result.error}`);
      }
    }
  };

  return (
    <MantineProvider theme={theme}>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Text size="lg" fw={700}>{workspaceName}</Text>
              <ActionIcon variant="subtle" size="sm" onClick={handleRenameClick}>
                <Text size="xs">✏️</Text>
              </ActionIcon>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Stack justify="space-between" h="100%">
            <div>
              <Text size="sm" fw={500} mb="md">Navigation</Text>
            </div>
            <Button variant="light" onClick={handleOpenLauncher}>
              Open Launcher
            </Button>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <Text size="xl" fw={700} mb="md">Welcome to {workspaceName}</Text>
          <Text mb="md">Your workspace is ready!</Text>
        </AppShell.Main>
      </AppShell>

      <Modal opened={renameOpened} onClose={closeRename} title="Rename Workspace">
        <Stack>
          <TextInput
            label="Workspace Name"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeRename}>Cancel</Button>
            <Button onClick={handleRenameSubmit}>Rename</Button>
          </Group>
        </Stack>
      </Modal>
    </MantineProvider>
  );
}

const root = createRoot(document.body);
root.render(<App />);
