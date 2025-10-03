import { useEffect, useState } from 'react';
import { Stack, Divider, Text, Loader, Center } from '@mantine/core';
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
}

const electronAPI = (window as any).electronAPI;

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadComments = async () => {
    setIsLoading(true);

    try {
      const result = await electronAPI.entry.listComments(postId);

      if (result.success) {
        setComments(result.data);
      } else {
        console.error('Failed to load comments:', result.error);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

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

  return (
    <Stack gap="md" mt="md">
      <Divider />

      <EntryComposer
        parentId={postId}
        onSuccess={handleCommentCreated}
        buttonText="Comment"
      />

      {isLoading ? (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      ) : comments.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" p="md">
          No comments yet
        </Text>
      ) : (
        <Stack gap="sm">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onUpdate={handleCommentUpdated}
              onDelete={handleCommentDeleted}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
