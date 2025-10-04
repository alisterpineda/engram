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
import { MantineProvider, createTheme, AppShell, Burger, Group, Text, Button, Stack, ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconSun, IconMoon, IconSunMoon } from '@tabler/icons-react';
import { FeedView } from './views/FeedView';
import { PostDetailView } from './views/PostDetailView';

const theme = createTheme({
  /** Put your mantine theme override here */
});

interface Entry {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: number | null;
}

interface WorkspaceElectronAPI {
  getWorkspaceInfo: () => Promise<{ success: boolean; data?: { name: string; path: string }; error?: string }>;
  openLauncher: () => Promise<{ success: boolean }>;
  getSetting: (key: string) => Promise<{ success: boolean; value: string | null }>;
  setSetting: (key: string, value: string) => Promise<{ success: boolean }>;
  theme: {
    getAppTheme: () => Promise<{ success: boolean; theme: 'light' | 'dark' | 'auto' }>;
    setAppTheme: (theme: 'light' | 'dark' | 'auto') => Promise<{ success: boolean }>;
    getSystemTheme: () => Promise<{ success: boolean; theme: 'light' | 'dark' }>;
    onThemeChange: (callback: (theme: 'light' | 'dark' | 'auto') => void) => () => void;
    onSystemThemeChange: (callback: (theme: 'light' | 'dark') => void) => () => void;
  };
  entry: {
    create: (body: string, parentId?: number | null) => Promise<{ success: boolean; data?: Entry; error?: string }>;
    getById: (id: number) => Promise<{ success: boolean; data?: Entry; error?: string }>;
    listPosts: (offset?: number, limit?: number) => Promise<{ success: boolean; data?: Entry[]; error?: string }>;
    listComments: (parentId: number, offset?: number, limit?: number) => Promise<{ success: boolean; data?: Entry[]; error?: string }>;
    update: (id: number, body: string) => Promise<{ success: boolean; data?: Entry; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
}

const electronAPI = (window as any).electronAPI as WorkspaceElectronAPI;

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

function AppContent() {
  const [opened, { toggle }] = useDisclosure();
  const [workspaceName, setWorkspaceName] = useState('Workspace');
  const location = useLocation();
  const navigate = useNavigate();

  const isPostDetailView = location.pathname.startsWith('/post/');

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

  const handleBackToFeed = () => {
    navigate('/');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} size="sm" />
            <Text size="lg" fw={700}>{workspaceName}</Text>
            {isPostDetailView && (
              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconArrowLeft size={16} />}
                onClick={handleBackToFeed}
              >
                Back
              </Button>
            )}
          </Group>
          <ThemeToggle />
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
        <Routes>
          <Route path="/" element={<FeedView />} />
          <Route path="/post/:postId" element={<PostDetailView />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

function App() {
  return (
    <MantineProvider theme={theme}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </MantineProvider>
  );
}

const root = createRoot(document.body);
root.render(<App />);
