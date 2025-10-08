import '@mantine/core/styles.css';
import '../assets/index.css';

import { createRoot } from 'react-dom/client';
import {
  MantineProvider,
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
import { compactTheme } from '../theme';

interface SpaceInfo {
  name: string;
  path: string;
  lastOpened: number;
}

interface LauncherElectronAPI {
  createSpace: (name: string, path: string) => Promise<{ success: boolean; error?: string }>;
  openSpace: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
  getRecentSpaces: () => Promise<SpaceInfo[]>;
  selectSpacePath: (name: string) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
  openSpaceByPath: (path: string) => Promise<{ success: boolean; error?: string }>;
  theme: {
    getAppTheme: () => Promise<{ success: boolean; theme: 'light' | 'dark' | 'auto' }>;
    setAppTheme: (theme: 'light' | 'dark' | 'auto') => Promise<{ success: boolean }>;
    getSystemTheme: () => Promise<{ success: boolean; theme: 'light' | 'dark' }>;
    onThemeChange: (callback: (theme: 'light' | 'dark' | 'auto') => void) => () => void;
    onSystemThemeChange: (callback: (theme: 'light' | 'dark') => void) => () => void;
  };
}

const electronAPI = (window as any).electronAPI as LauncherElectronAPI;

function RecentSpacesSidebar({
  spaces,
  onOpenSpace,
  loading
}: {
  spaces: SpaceInfo[];
  onOpenSpace: (space: SpaceInfo) => void;
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
          {spaces.map((space, index) => (
            <Box
              key={index}
              p="sm"
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                opacity: loading ? 0.5 : 1,
              }}
              onClick={() => !loading && onOpenSpace(space)}
              className="space-item"
            >
              <Text fw={500} size="sm">{space.name}</Text>
              <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                {space.path}
              </Text>
            </Box>
          ))}
        </Stack>
      </ScrollArea>
    </Box>
  );
}

function MainView({
  recentSpaces,
  onOpenSpace,
  loading,
  setLoading
}: {
  recentSpaces: SpaceInfo[];
  onOpenSpace: (space: SpaceInfo) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) {
  const navigate = useNavigate();

  const handleOpenSpace = async () => {
    setLoading(true);
    try {
      const result = await electronAPI.openSpace();
      if (!result.success && !result.canceled) {
        alert(`Failed to open space: ${result.error}`);
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
                <Text fw={600} size="lg">Create new space</Text>
                <Text size="sm" c="dimmed">
                  Start fresh with a new space
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
                <Text fw={600} size="lg">Open folder as space</Text>
                <Text size="sm" c="dimmed">
                  Browse for a space folder
                </Text>
              </Box>
              <Button
                onClick={handleOpenSpace}
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

function CreateSpaceView({
  loading,
  setLoading
}: {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) {
  const navigate = useNavigate();
  const [spaceName, setSpaceName] = useState('');
  const [selectedPath, setSelectedPath] = useState('');

  const handleSelectPath = async () => {
    if (!spaceName.trim()) {
      alert('Please enter a space name');
      return;
    }

    const result = await electronAPI.selectSpacePath(spaceName);
    if (result.success && result.path) {
      setSelectedPath(result.path);
    }
  };

  const handleCreateSpace = async () => {
    if (!spaceName.trim()) {
      alert('Please enter a space name');
      return;
    }

    setLoading(true);
    try {
      let path = selectedPath;

      // If no path selected, let the IPC handler use default
      if (!path) {
        const pathResult = await electronAPI.selectSpacePath(spaceName);
        if (!pathResult.success || pathResult.canceled || !pathResult.path) {
          setLoading(false);
          return;
        }
        path = pathResult.path;
      }

      const result = await electronAPI.createSpace(spaceName, path);
      if (!result.success) {
        alert(`Failed to create space: ${result.error}`);
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

        <Title order={2}>Create new space</Title>

        <Divider />

        <Stack gap="lg">
          <Box>
            <Text fw={600} mb="xs">Space name</Text>
            <Text size="sm" c="dimmed" mb="sm">
              Pick a name for your space
            </Text>
            <TextInput
              placeholder="Space name"
              value={spaceName}
              onChange={(e) => setSpaceName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSpace()}
            />
          </Box>

          <Divider />

          <Box>
            <Text fw={600} mb="xs">Location</Text>
            <Text size="sm" c="dimmed" mb="sm">
              Pick a place to put your new space
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
            onClick={handleCreateSpace}
            disabled={loading || !spaceName.trim()}
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
  const [recentSpaces, setRecentSpaces] = useState<SpaceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentSpaces();
  }, []);

  const loadRecentSpaces = async () => {
    const spaces = await electronAPI.getRecentSpaces();
    setRecentSpaces(spaces);
  };

  const handleOpenRecent = async (space: SpaceInfo) => {
    setLoading(true);
    try {
      const result = await electronAPI.openSpaceByPath(space.path);
      if (!result.success) {
        alert(`Failed to open space: ${result.error}`);
      }
      // Window will close automatically on success
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const showSidebar = recentSpaces.length > 0;

  return (
    <MantineProvider theme={compactTheme}>
      <MemoryRouter>
        <Box style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          {showSidebar && (
            <RecentSpacesSidebar
              spaces={recentSpaces}
              onOpenSpace={handleOpenRecent}
              loading={loading}
            />
          )}
          <Routes>
            <Route
              path="/"
              element={
                <MainView
                  recentSpaces={recentSpaces}
                  onOpenSpace={handleOpenRecent}
                  loading={loading}
                  setLoading={setLoading}
                />
              }
            />
            <Route
              path="/create"
              element={
                <CreateSpaceView
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
