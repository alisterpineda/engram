import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Stack, Container, Loader, Center, Box, Text, Card, Title } from '@mantine/core';
import { EntryComposer } from '../components/EntryComposer';
import { PostCard } from '../components/PostCard';
import { MinimizedPostCard } from '../components/MinimizedPostCard';
import { Log } from '../types/log';
import { Comment } from '../types/comment';
import { groupFeedItemsByDay } from '../utils/date';

const electronAPI = (window as any).electronAPI;
const POSTS_PER_PAGE = 20;

export function FeedView() {
  const [posts, setPosts] = useState<Log[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
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
      const result = await electronAPI.entry.listAll(currentOffset, POSTS_PER_PAGE);

      if (result.success && result.data) {
        const newPosts = result.data;
        const allPosts = currentOffset === 0 ? newPosts : [...posts, ...newPosts];

        // Load comments for the new posts
        if (newPosts.length > 0) {
          const postIds = newPosts.map((p: Log) => p.id);
          const commentsResult = await electronAPI.comment.listForPosts(postIds);

          if (commentsResult.success && commentsResult.data) {
            const newComments = commentsResult.data;
            const allComments = currentOffset === 0 ? newComments : [...comments, ...newComments];
            setComments(allComments);
          }
        } else if (currentOffset === 0) {
          setComments([]);
        }

        setPosts(allPosts);
        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setOffset(currentOffset + newPosts.length);
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

  const handleCommentsRefresh = () => {
    // Reload all comments for current posts
    const postIds = posts.map(p => p.id);
    if (postIds.length > 0) {
      electronAPI.comment.listForPosts(postIds).then((result: any) => {
        if (result.success && result.data) {
          setComments(result.data);
        }
      });
    }
  };

  const groupedFeedItems = useMemo(() => {
    // Sort posts by latest activity (most recent comment or post date)
    const sortedPosts = [...posts].sort((a, b) => {
      // Find latest comment for each post
      const aComments = comments.filter(c => c.parentId === a.id);
      const bComments = comments.filter(c => c.parentId === b.id);

      // Get latest timestamp for post a (post date or latest comment)
      const aLatest = aComments.length > 0
        ? Math.max(
            new Date(a.startedAt).getTime(),
            ...aComments.map(c => new Date(c.commentedAt).getTime())
          )
        : new Date(a.startedAt).getTime();

      // Get latest timestamp for post b (post date or latest comment)
      const bLatest = bComments.length > 0
        ? Math.max(
            new Date(b.startedAt).getTime(),
            ...bComments.map(c => new Date(c.commentedAt).getTime())
          )
        : new Date(b.startedAt).getTime();

      // Sort by latest activity descending
      return bLatest - aLatest;
    });

    return groupFeedItemsByDay(sortedPosts, comments);
  }, [posts, comments]);

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
            {groupedFeedItems.map((group) => (
              <Box key={group.day}>
                <Title order={3} mb="md" mt="md">
                  {group.day}
                </Title>
                <Stack gap="lg">
                  {group.items.map((item) => {
                    if (item.type === 'full-post') {
                      return (
                        <PostCard
                          key={`full-${item.post.id}`}
                          post={item.post}
                          onUpdate={handlePostUpdated}
                          onDelete={handlePostDeleted}
                          onFollowUpCreated={handlePostCreated}
                          commentsForDay={item.commentsForDay}
                          onCommentsRefresh={handleCommentsRefresh}
                        />
                      );
                    } else {
                      return (
                        <MinimizedPostCard
                          key={`minimized-${item.post.id}-${group.day}`}
                          post={item.post}
                          day={group.day}
                          comments={item.commentsForDay}
                          onCommentCreated={handleCommentsRefresh}
                        />
                      );
                    }
                  })}
                </Stack>
              </Box>
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
