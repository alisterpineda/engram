import { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, Container, Loader, Center, Box, Text, Card } from '@mantine/core';
import { EntryComposer } from '../components/EntryComposer';
import { PostCard } from '../components/PostCard';
import { Log } from '../types/log';

const electronAPI = (window as any).electronAPI;
const POSTS_PER_PAGE = 20;

export function FeedView() {
  const [posts, setPosts] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const handlePostCreated = (newPost: Log) => {
    setPosts((prev) => [newPost, ...prev]);
    setIsComposerExpanded(false);
  };

  const handlePostUpdated = (updatedPost: Log) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const handlePostDeleted = (id: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  };

  return (
    <Container size="sm" px={0}>
      <Stack gap="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          {!isComposerExpanded ? (
            <Box
              onClick={() => setIsComposerExpanded(true)}
              bg="var(--mantine-color-default-hover)"
              bd="1px solid var(--mantine-color-default-border)"
              style={{
                cursor: 'pointer',
                padding: 'var(--mantine-spacing-sm)',
                borderRadius: 'var(--mantine-radius-sm)',
              }}
            >
              <Text c="dimmed">What's on your mind?</Text>
            </Box>
          ) : (
            <EntryComposer
              onSuccess={handlePostCreated}
              onCancel={() => setIsComposerExpanded(false)}
              composerMode="minimal"
              autoFocus={true}
            />
          )}
        </Card>

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
  );
}
