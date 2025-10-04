import '@mantine/core/styles.css';
import '../assets/index.css';

import { createRoot } from 'react-dom/client';
import {
  MantineProvider,
  createTheme,
  Stack,
  Title,
  Text,
  Button,
  TextInput,
  Group,
  Divider,
  ScrollArea,
  Box,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

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

function RecentWorkspacesSidebar({
  workspaces,
  onOpenWorkspace,
  loading
}: {
  workspaces: WorkspaceInfo[];
  onOpenWorkspace: (workspace: WorkspaceInfo) => void;
  loading: boolean;
}) {
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
    <Box
      style={{
        width: '300px',
        height: '100vh',
        borderRight: '1px solid var(--mantine-color-default-border)',
        padding: '1rem',
        overflowY: 'auto'
      }}
    >
      <ScrollArea h="100%">
        <Stack gap="xs">
          {workspaces.map((workspace, index) => (
            <Box
              key={index}
              p="sm"
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                opacity: loading ? 0.5 : 1,
              }}
              onClick={() => !loading && onOpenWorkspace(workspace)}
              className="workspace-item"
            >
              <Text fw={500} size="sm">{workspace.name}</Text>
              <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                {workspace.path}
              </Text>
            </Box>
          ))}
        </Stack>
      </ScrollArea>
    </Box>
  );
}

function MainView({
  recentWorkspaces,
  onOpenWorkspace,
  loading,
  setLoading
}: {
  recentWorkspaces: WorkspaceInfo[];
  onOpenWorkspace: (workspace: WorkspaceInfo) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) {
  const navigate = useNavigate();

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

  return (
    <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack gap="xl" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
        <Stack gap="xs" align="center">
          {/* Logo placeholder */}
          <Box
            style={{
              width: '100px',
              height: '100px',
              backgroundColor: 'var(--mantine-color-blue-6)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}
          />
          <Stack gap={0} align="center">
            <Title order={1}>Engram</Title>
            <Text c="dimmed" size="sm">Version 1.0.0</Text>
          </Stack>
        </Stack>

        <Divider />

        <Stack gap="md">
          <Box>
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="lg">Create new workspace</Text>
                <Text size="sm" c="dimmed">
                  Start fresh with a new workspace
                </Text>
              </Box>
              <Button
                onClick={() => navigate('/create')}
                disabled={loading}
                variant="filled"
              >
                Create
              </Button>
            </Group>
          </Box>

          <Divider />

          <Box>
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="lg">Open folder as workspace</Text>
                <Text size="sm" c="dimmed">
                  Browse for a workspace file
                </Text>
              </Box>
              <Button
                onClick={handleOpenWorkspace}
                disabled={loading}
                variant="default"
              >
                Open
              </Button>
            </Group>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}

function CreateWorkspaceView({
  loading,
  setLoading
}: {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) {
  const navigate = useNavigate();
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedPath, setSelectedPath] = useState('');

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

  return (
    <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack gap="xl" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
        <Stack gap="xs" align="center">
          {/* Logo placeholder */}
          <Box
            style={{
              width: '100px',
              height: '100px',
              backgroundColor: 'var(--mantine-color-blue-6)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}
          />
          <Stack gap={0} align="center">
            <Title order={1}>Engram</Title>
            <Text c="dimmed" size="sm">Version 1.0.0</Text>
          </Stack>
        </Stack>

        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/')}
          style={{ alignSelf: 'flex-start' }}
        >
          Back
        </Button>

        <Title order={2}>Create new workspace</Title>

        <Divider />

        <Stack gap="lg">
          <Box>
            <Text fw={600} mb="xs">Workspace name</Text>
            <Text size="sm" c="dimmed" mb="sm">
              Pick a name for your workspace
            </Text>
            <TextInput
              placeholder="Workspace name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
            />
          </Box>

          <Divider />

          <Box>
            <Text fw={600} mb="xs">Location</Text>
            <Text size="sm" c="dimmed" mb="sm">
              Pick a place to put your new workspace
            </Text>
            {selectedPath && (
              <Text size="xs" c="dimmed" mb="sm">
                {selectedPath}
              </Text>
            )}
            <Button variant="default" onClick={handleSelectPath} disabled={loading}>
              Browse
            </Button>
          </Box>
        </Stack>

        <Group justify="flex-end">
          <Button
            onClick={handleCreateWorkspace}
            disabled={loading || !workspaceName.trim()}
            variant="filled"
          >
            Create
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}

function LauncherApp() {
  const [recentWorkspaces, setRecentWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentWorkspaces();
  }, []);

  const loadRecentWorkspaces = async () => {
    const workspaces = await electronAPI.getRecentWorkspaces();
    setRecentWorkspaces(workspaces);
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

  const showSidebar = recentWorkspaces.length > 0;

  return (
    <MantineProvider theme={theme}>
      <MemoryRouter>
        <Box style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          {showSidebar && (
            <RecentWorkspacesSidebar
              workspaces={recentWorkspaces}
              onOpenWorkspace={handleOpenRecent}
              loading={loading}
            />
          )}
          <Routes>
            <Route
              path="/"
              element={
                <MainView
                  recentWorkspaces={recentWorkspaces}
                  onOpenWorkspace={handleOpenRecent}
                  loading={loading}
                  setLoading={setLoading}
                />
              }
            />
            <Route
              path="/create"
              element={
                <CreateWorkspaceView
                  loading={loading}
                  setLoading={setLoading}
                />
              }
            />
          </Routes>
        </Box>
      </MemoryRouter>
    </MantineProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<LauncherApp />);
