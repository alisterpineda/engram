import { useState } from 'react';
import { Stack, Box, Button, Divider, Text } from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { CommentComposer } from './CommentComposer';
import { EditableComment } from './EditableComment';
import { Comment } from '../types/comment';

interface DayFilteredCommentsSectionProps {
  postId: number;
  day: string;
  comments: Comment[];
  onCommentCreated: () => void;
}

export function DayFilteredCommentsSection({
  postId,
  comments: initialComments,
  onCommentCreated,
}: DayFilteredCommentsSectionProps) {
  const [showCommentComposer, setShowCommentComposer] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const handleCommentCreated = (newComment: Comment) => {
    setComments([...comments, newComment]);
    setShowCommentComposer(false);
    onCommentCreated();
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(comments.map(c => c.id === updatedComment.id ? updatedComment : c));
  };

  const handleCommentDeleted = (commentId: number) => {
    setComments(comments.filter(c => c.id !== commentId));
    onCommentCreated(); // Refresh parent to update counts
  };

  if (comments.length === 0) {
    return null;
  }

  return (
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

      {showCommentComposer && (
        <Box mt="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-md)' }}>
          <CommentComposer
            parentId={postId}
            onSuccess={handleCommentCreated}
            onCancel={() => setShowCommentComposer(false)}
            autoFocus={true}
          />
        </Box>
      )}

      {!showCommentComposer && (
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
      )}
    </>
  );
}
