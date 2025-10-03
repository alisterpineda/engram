import { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, Divider, Text, Loader, Center, Anchor, Box } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { EntryComposer } from './EntryComposer';
import { CommentItem } from './CommentItem';

interface Entry {
  id: number;
  title: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: number | null;
}

interface CommentSectionProps {
  postId: number;
  previewMode?: boolean;
}

const electronAPI = (window as any).electronAPI;
const COMMENTS_PER_PAGE = 20;

export function CommentSection({ postId, previewMode = false }: CommentSectionProps) {
  const [comments, setComments] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadComments = async (currentOffset = 0) => {
    setIsLoading(true);

    try {
      if (previewMode) {
        // Preview mode: fetch all comments to determine count
        const result = await electronAPI.entry.listComments(postId);
        if (result.success) {
          setComments(result.data);
        } else {
          console.error('Failed to load comments:', result.error);
        }
      } else {
        // Full mode: paginated fetch for infinite scroll
        const result = await electronAPI.entry.listComments(postId, currentOffset, COMMENTS_PER_PAGE);
        if (result.success && result.data) {
          if (currentOffset === 0) {
            setComments(result.data);
          } else {
            setComments((prev) => [...prev, ...result.data]);
          }
          setHasMore(result.data.length === COMMENTS_PER_PAGE);
          setOffset(currentOffset + result.data.length);
        } else {
          console.error('Failed to load comments:', result.error);
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreComments = useCallback(() => {
    if (!isLoading && hasMore && !previewMode) {
      loadComments(offset);
    }
  }, [offset, isLoading, hasMore, previewMode]);

  useEffect(() => {
    loadComments();
  }, [postId]);

  useEffect(() => {
    if (previewMode) return; // No infinite scroll in preview mode

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreComments();
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
  }, [loadMoreComments, previewMode]);

  const handleCommentCreated = (newComment: Entry) => {
    setComments((prev) => [...prev, newComment]);
  };

  const handleCommentUpdated = (updatedComment: Entry) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleCommentDeleted = (id: number) => {
    setComments((prev) => prev.filter((comment) => comment.id !== id));
  };

  const handleViewAllComments = () => {
    navigate(`/post/${postId}`);
  };

  // In preview mode, show only last 3 comments
  const displayedComments = previewMode && comments.length > 3
    ? comments.slice(-3)
    : comments;

  const totalComments = comments.length;
  const showViewAllButton = previewMode && totalComments > 3;

  return (
    <Stack gap="md" mt="md">
      <Divider />

      {isLoading ? (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      ) : totalComments === 0 ? (
        <Text size="sm" c="dimmed" ta="center" p="md">
          No comments yet
        </Text>
      ) : (
        <Stack gap="sm">
          {showViewAllButton && (
            <Anchor
              size="sm"
              onClick={handleViewAllComments}
              style={{ cursor: 'pointer' }}
            >
              View all {totalComments} comments
            </Anchor>
          )}

          {displayedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onUpdate={handleCommentUpdated}
              onDelete={handleCommentDeleted}
            />
          ))}

          {!previewMode && hasMore && (
            <Box ref={observerTarget}>
              <Center p="md">
                <Loader size="sm" />
              </Center>
            </Box>
          )}
        </Stack>
      )}

      {!isComposerVisible && (
        <Anchor
          size="sm"
          onClick={() => setIsComposerVisible(true)}
          style={{ cursor: 'pointer' }}
        >
          Add Comment
        </Anchor>
      )}

      {isComposerVisible && (
        <EntryComposer
          parentId={postId}
          onSuccess={handleCommentCreated}
          buttonText="Comment"
          onCancel={() => setIsComposerVisible(false)}
        />
      )}
    </Stack>
  );
}
