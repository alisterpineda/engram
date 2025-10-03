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
import { MantineProvider, createTheme, AppShell, Burger, Group, Text, Button, Stack, Container, Loader, Center, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState, useRef, useCallback } from 'react';
import { EntryComposer } from './components/EntryComposer';
import { PostCard } from './components/PostCard';

const theme = createTheme({
  /** Put your mantine theme override here */
});

interface Entry {
  id: number;
  title: string | null;
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
  entry: {
    create: (body: string, title?: string | null, parentId?: number | null) => Promise<{ success: boolean; data?: Entry; error?: string }>;
    listPosts: (offset?: number, limit?: number) => Promise<{ success: boolean; data?: Entry[]; error?: string }>;
    listComments: (parentId: number) => Promise<{ success: boolean; data?: Entry[]; error?: string }>;
    update: (id: number, body: string, title?: string | null) => Promise<{ success: boolean; data?: Entry; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
}

const electronAPI = (window as any).electronAPI as WorkspaceElectronAPI;

const POSTS_PER_PAGE = 20;

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [workspaceName, setWorkspaceName] = useState('Workspace');
  const [posts, setPosts] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load workspace info on mount
    electronAPI.getWorkspaceInfo().then((result) => {
      if (result.success && result.data) {
        setWorkspaceName(result.data.name);
      }
    });

    // Load initial posts
    loadPosts(0);
  }, []);

  const loadPosts = async (currentOffset: number) => {
    setIsLoading(true);

    try {
      const result = await electronAPI.entry.listPosts(currentOffset, POSTS_PER_PAGE);

      if (result.success && result.data) {
        if (currentOffset === 0) {
          setPosts(result.data);
        } else {
          setPosts((prev) => [...prev, ...result.data]);
        }

        setHasMore(result.data.length === POSTS_PER_PAGE);
        setOffset(currentOffset + result.data.length);
      } else {
        console.error('Failed to load posts:', result.error);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = useCallback(() => {
    if (!isLoading && hasMore) {
      loadPosts(offset);
    }
  }, [offset, isLoading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMorePosts]);

  const handleOpenLauncher = () => {
    electronAPI.openLauncher();
  };

  const handlePostCreated = (newPost: Entry) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost: Entry) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const handlePostDeleted = (id: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  };

  return (
    <MantineProvider theme={theme}>
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
          <Container size="md" px={0}>
            <Stack gap="lg">
              <EntryComposer onSuccess={handlePostCreated} />

              {posts.length === 0 && !isLoading ? (
                <Center p="xl">
                  <Text size="sm" c="dimmed">
                    No posts yet. Create your first post above!
                  </Text>
                </Center>
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onUpdate={handlePostUpdated}
                      onDelete={handlePostDeleted}
                    />
                  ))}

                  {hasMore && (
                    <Box ref={observerTarget}>
                      <Center p="md">
                        <Loader size="sm" />
                      </Center>
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </Container>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

const root = createRoot(document.body);
root.render(<App />);
