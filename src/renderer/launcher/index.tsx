import '@mantine/core/styles.css';
import '../assets/index.css';

import { createRoot } from 'react-dom/client';
import {
  MantineProvider,
  createTheme,
  Container,
  Stack,
  Title,
  Text,
  Button,
  TextInput,
  Card,
  Group,
  Divider,
  ScrollArea,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import { IconSun, IconMoon, IconSunMoon } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

const theme = createTheme({
  /** Put your mantine theme override here */
});

interface WorkspaceInfo {
  name: string;
  path: string;
  lastOpened: number;
}

interface LauncherElectronAPI {
  createWorkspace: (name: string, path: string) => Promise<{ success: boolean; error?: string }>;
  openWorkspace: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
  getRecentWorkspaces: () => Promise<WorkspaceInfo[]>;
  selectWorkspacePath: (name: string) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
  openWorkspaceByPath: (path: string) => Promise<{ success: boolean; error?: string }>;
  theme: {
    getAppTheme: () => Promise<{ success: boolean; theme: 'light' | 'dark' | 'auto' }>;
    setAppTheme: (theme: 'light' | 'dark' | 'auto') => Promise<{ success: boolean }>;
    getSystemTheme: () => Promise<{ success: boolean; theme: 'light' | 'dark' }>;
    onThemeChange: (callback: (theme: 'light' | 'dark' | 'auto') => void) => () => void;
    onSystemThemeChange: (callback: (theme: 'light' | 'dark') => void) => () => void;
  };
}

const electronAPI = (window as any).electronAPI as LauncherElectronAPI;

function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const [appTheme, setAppTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    // Load initial theme
    electronAPI.theme.getAppTheme().then((result) => {
      if (result.success) {
        setAppTheme(result.theme);
        setColorScheme(result.theme);
      }
    });

    // Listen for theme changes from other windows
    const unsubscribe = electronAPI.theme.onThemeChange((theme) => {
      setAppTheme(theme);
      setColorScheme(theme);
    });

    // Listen for system theme changes
    const unsubscribeSystem = electronAPI.theme.onSystemThemeChange((systemTheme) => {
      if (appTheme === 'auto') {
        setColorScheme(systemTheme);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeSystem();
    };
  }, [setColorScheme, appTheme]);

  const toggleTheme = () => {
    const nextTheme = appTheme === 'light' ? 'dark' : appTheme === 'dark' ? 'auto' : 'light';
    setAppTheme(nextTheme);
    setColorScheme(nextTheme);
    electronAPI.theme.setAppTheme(nextTheme);
  };

  const getIcon = () => {
    if (appTheme === 'auto') {
      return <IconSunMoon size={20} />;
    }
    return computedColorScheme === 'dark' ? <IconMoon size={20} /> : <IconSun size={20} />;
  };

  return (
    <ActionIcon
      onClick={toggleTheme}
      variant="default"
      size="lg"
      aria-label="Toggle theme"
      title={`Current: ${appTheme === 'auto' ? 'Auto (System)' : appTheme}`}
    >
      {getIcon()}
    </ActionIcon>
  );
}

function LauncherApp() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [recentWorkspaces, setRecentWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentWorkspaces();
  }, []);

  const loadRecentWorkspaces = async () => {
    const workspaces = await electronAPI.getRecentWorkspaces();
    setRecentWorkspaces(workspaces);
  };

  const handleSelectPath = async () => {
    if (!workspaceName.trim()) {
      alert('Please enter a workspace name');
      return;
    }

    const result = await electronAPI.selectWorkspacePath(workspaceName);
    if (result.success && result.path) {
      setSelectedPath(result.path);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      alert('Please enter a workspace name');
      return;
    }

    setLoading(true);
    try {
      let path = selectedPath;

      // If no path selected, let the IPC handler use default
      if (!path) {
        const pathResult = await electronAPI.selectWorkspacePath(workspaceName);
        if (!pathResult.success || pathResult.canceled || !pathResult.path) {
          setLoading(false);
          return;
        }
        path = pathResult.path;
      }

      const result = await electronAPI.createWorkspace(workspaceName, path);
      if (!result.success) {
        alert(`Failed to create workspace: ${result.error}`);
      }
      // Window will close automatically on success
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWorkspace = async () => {
    setLoading(true);
    try {
      const result = await electronAPI.openWorkspace();
      if (!result.success && !result.canceled) {
        alert(`Failed to open workspace: ${result.error}`);
      }
      // Window will close automatically on success
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecent = async (workspace: WorkspaceInfo) => {
    setLoading(true);
    try {
      const result = await electronAPI.openWorkspaceByPath(workspace.path);
      if (!result.success) {
        alert(`Failed to open workspace: ${result.error}`);
      }
      // Window will close automatically on success
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MantineProvider theme={theme}>
      <Container size="sm" py="xl">
        <Stack gap="xl">
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1 }}>
              <Title order={1} ta="center" mb="xs">Engram</Title>
              <Text ta="center" c="dimmed" size="sm">
                Choose a workspace to get started
              </Text>
            </div>
            <ThemeToggle />
          </Group>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <div>
                <Text fw={600} size="lg" mb="sm">Create New Workspace</Text>
                <Text size="sm" c="dimmed" mb="md">
                  Start fresh with a new workspace
                </Text>
              </div>

              <TextInput
                label="Workspace Name"
                placeholder="My Workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              />

              {selectedPath && (
                <Text size="xs" c="dimmed">
                  Location: {selectedPath}
                </Text>
              )}

              <Group justify="space-between">
                <Button variant="light" onClick={handleSelectPath} disabled={loading}>
                  Choose Location
                </Button>
                <Button onClick={handleCreateWorkspace} disabled={loading || !workspaceName.trim()}>
                  Create Workspace
                </Button>
              </Group>
            </Stack>
          </Card>

          <Divider label="OR" labelPosition="center" />

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <div>
                <Text fw={600} size="lg" mb="sm">Open Existing Workspace</Text>
                <Text size="sm" c="dimmed" mb="md">
                  Browse for a workspace file
                </Text>
              </div>

              <Button variant="default" onClick={handleOpenWorkspace} disabled={loading}>
                Browse Files...
              </Button>
            </Stack>
          </Card>

          {recentWorkspaces.length > 0 && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Text fw={600} size="lg">Recent Workspaces</Text>

                <ScrollArea h={200}>
                  <Stack gap="xs">
                    {recentWorkspaces.map((workspace, index) => (
                      <Card
                        key={index}
                        padding="sm"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenRecent(workspace)}
                      >
                        <Group justify="space-between">
                          <div>
                            <Text fw={500}>{workspace.name}</Text>
                            <Text size="xs" c="dimmed" truncate style={{ maxWidth: '300px' }}>
                              {workspace.path}
                            </Text>
                          </div>
                          <Text size="xs" c="dimmed">
                            {formatDate(workspace.lastOpened)}
                          </Text>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
    </MantineProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<LauncherApp />);
