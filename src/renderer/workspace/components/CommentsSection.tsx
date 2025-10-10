import { useEffect, useState } from 'react';
import { Stack, Text, Box, Button, Group, Divider } from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { CommentComposer } from './CommentComposer';
import { EditableComment } from './EditableComment';
import { Comment } from '../types/comment';

const electronAPI = (window as any).electronAPI;

interface CommentsSectionProps {
  parentId: number;
  parentType: string;
}

export function CommentsSection({ parentId, parentType }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCommentComposer, setShowCommentComposer] = useState(false);

  // Disable commenting on comments
  const canComment = parentType !== 'comment';

  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true);
      try {
        const result = await electronAPI.comment.listByParent(parentId);

        if (result.success && result.data) {
          setComments(result.data);
        } else {
          console.error('Failed to load comments:', result.error);
          setComments([]);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [parentId]);

  const handleCommentCreated = (newComment: Comment) => {
    setComments([...comments, newComment]);
    setShowCommentComposer(false);
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(comments.map(c => c.id === updatedComment.id ? updatedComment : c));
  };

  const handleCommentDeleted = (commentId: number) => {
    setComments(comments.filter(c => c.id !== commentId));
  };

  if (!canComment && comments.length === 0) {
    return null;
  }

  return (
    <>
      {comments.length > 0 && (
        <>
          <Divider mt="md" mb="md" />
          <Stack gap="md">
            <Text size="sm" fw={600}>
              Comments ({comments.length})
            </Text>
            {comments.map((comment) => (
              <EditableComment
                key={comment.id}
                comment={comment}
                onUpdate={handleCommentUpdated}
                onDelete={handleCommentDeleted}
              />
            ))}
          </Stack>
        </>
      )}

      {canComment && showCommentComposer && (
        <Box mt="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-md)' }}>
          <CommentComposer
            parentId={parentId}
            onSuccess={handleCommentCreated}
            onCancel={() => setShowCommentComposer(false)}
            autoFocus={true}
          />
        </Box>
      )}

      {canComment && !showCommentComposer && (
        <>
          {comments.length > 0 ? (
            <Box mt="sm">
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setShowCommentComposer(true)}
                leftSection={<IconMessage size={14} />}
              >
                Add comment
              </Button>
            </Box>
          ) : (
            <>
              <Divider mt="md" mb="md" />
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setShowCommentComposer(true)}
                leftSection={<IconMessage size={16} />}
              >
                Comment
              </Button>
            </>
          )}
        </>
      )}
    </>
  );
}
