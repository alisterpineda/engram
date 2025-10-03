import { useState } from 'react';
import { Text, Group, ActionIcon, Textarea, Stack } from '@mantine/core';
import { IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';

interface Entry {
  id: number;
  title: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: number | null;
}

interface CommentItemProps {
  comment: Entry;
  onUpdate: (updatedComment: Entry) => void;
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

export function CommentItem({ comment, onUpdate, onDelete }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!editBody.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await electronAPI.entry.update(
        comment.id,
        editBody,
        null
      );

      if (result.success) {
        onUpdate(result.data);
        setIsEditing(false);
      } else {
        console.error('Failed to update comment:', result.error);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const result = await electronAPI.entry.delete(comment.id);

      if (result.success) {
        onDelete(comment.id);
      } else {
        console.error('Failed to delete comment:', result.error);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditBody(comment.body);
    setIsEditing(false);
  };

  return (
    <Stack gap="xs">
      {isEditing ? (
        <>
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              {formatRelativeTime(comment.createdAt)}
            </Text>
          </Group>
          <Textarea
            placeholder="Comment text"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            disabled={isSubmitting}
            minRows={2}
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
        </>
      ) : (
        <>
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              {formatRelativeTime(comment.createdAt)}
            </Text>
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                color="blue"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <IconEdit size={14} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={handleDelete}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Group>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {comment.body}
          </Text>
        </>
      )}
    </Stack>
  );
}
