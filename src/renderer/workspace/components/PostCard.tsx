import { useState } from 'react';
import { Card, Text, Group, ActionIcon, Textarea, Stack, Box } from '@mantine/core';
import { IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { CommentSection } from './CommentSection';

interface Entry {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: number | null;
}

interface PostCardProps {
  post: Entry;
  onUpdate: (updatedPost: Entry) => void;
  onDelete: (id: number) => void;
}

const electronAPI = (window as any).electronAPI;

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}

export function PostCard({ post, onUpdate, onDelete }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleUpdate = async () => {
    if (!editBody.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await electronAPI.entry.update(
        post.id,
        editBody
      );

      if (result.success) {
        onUpdate(result.data);
        setIsEditing(false);
      } else {
        console.error('Failed to update post:', result.error);
      }
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? All comments will also be deleted.')) {
      return;
    }

    try {
      const result = await electronAPI.entry.delete(post.id);

      if (result.success) {
        onDelete(post.id);
      } else {
        console.error('Failed to delete post:', result.error);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditBody(post.body);
    setIsEditing(false);
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <Stack gap="xs">
          <Textarea
            placeholder="Post text"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            disabled={isSubmitting}
            minRows={3}
            autosize
          />
          <Group justify="flex-end" gap="xs">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              <IconX size={16} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              color="blue"
              onClick={handleUpdate}
              disabled={!editBody.trim() || isSubmitting}
              loading={isSubmitting}
            >
              <IconCheck size={16} />
            </ActionIcon>
          </Group>
        </Stack>
      ) : (
        <>
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed">
              {formatRelativeTime(post.createdAt)}
            </Text>
            <Group gap="xs" style={{ opacity: isHovered ? 1 : 0 }}>
              <ActionIcon
                variant="subtle"
                color="blue"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={handleDelete}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Group>

          <Text size="sm" mb="md" style={{ whiteSpace: 'pre-wrap' }}>
            {post.body}
          </Text>

          <Box
            onMouseEnter={() => setIsHovered(false)}
            onMouseLeave={() => setIsHovered(true)}
          >
            <CommentSection postId={post.id} previewMode={true} />
          </Box>
        </>
      )}
    </Card>
  );
}
