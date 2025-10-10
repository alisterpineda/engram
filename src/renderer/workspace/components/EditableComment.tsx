import { useState } from 'react';
import { Text, Group, ActionIcon, Stack, Menu, Spoiler } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconEdit, IconTrash, IconCheck, IconX, IconDots } from '@tabler/icons-react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { EntryEditor } from './EntryEditor';
import { ReadOnlyEditor } from './ReadOnlyEditor';
import { formatAbsoluteDateTime } from '../utils/date';
import { Comment } from '../types/comment';

const electronAPI = (window as any).electronAPI;

interface EditableCommentProps {
  comment: Comment;
  onUpdate: (updatedComment: Comment) => void;
  onDelete: (commentId: number) => void;
}

export function EditableComment({ comment, onUpdate, onDelete }: EditableCommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [commentedAt, setCommentedAt] = useState<Date>(new Date(comment.commentedAt));
  const [isEmpty, setIsEmpty] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
    ],
    content: '',
    editable: isEditing,
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
    },
  });

  const handleStartEdit = () => {
    setIsEditing(true);
    setCommentedAt(new Date(comment.commentedAt));
    if (editor) {
      editor.setEditable(true);
      editor.commands.setContent(comment.contentJson ? JSON.parse(comment.contentJson) : '');
      setIsEmpty(editor.isEmpty);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (editor) {
      editor.setEditable(false);
      editor.commands.setContent(comment.contentJson ? JSON.parse(comment.contentJson) : '');
      setIsEmpty(editor.isEmpty);
    }
  };

  const handleSubmit = async () => {
    if (!editor || isEmpty) return;

    setIsSubmitting(true);
    try {
      const contentJson = JSON.stringify(editor.getJSON());
      const result = await electronAPI.comment.update(
        comment.id,
        contentJson,
        commentedAt,
        null
      );

      if (result.success && result.data) {
        onUpdate(result.data);
        setIsEditing(false);
        if (editor) {
          editor.setEditable(false);
        }
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
      const result = await electronAPI.comment.delete(comment.id);

      if (result.success) {
        onDelete(comment.id);
      } else {
        console.error('Failed to delete comment:', result.error);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <Stack
      gap="xs"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      p="sm"
      style={{ borderLeft: '2px solid var(--mantine-color-gray-3)' }}
    >
      {isEditing ? (
        <>
          <Group gap="xs" style={{ minHeight: '24px' }}>
            <DateTimePicker
              value={commentedAt}
              onChange={(value) => {
                if (value) {
                  setCommentedAt(typeof value === 'string' ? new Date(value) : value);
                }
              }}
              size="xs"
              variant="unstyled"
              valueFormat="LLL"
              styles={{
                input: {
                  fontSize: 'var(--mantine-font-size-xs)',
                  color: 'var(--mantine-color-dimmed)',
                  cursor: 'pointer',
                  padding: 0,
                  minHeight: 'auto',
                }
              }}
            />
          </Group>
          <EntryEditor editor={editor} showToolbar={true} />
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
              onClick={handleSubmit}
              disabled={!editor || isEmpty || isSubmitting}
              loading={isSubmitting}
            >
              <IconCheck size={16} />
            </ActionIcon>
          </Group>
        </>
      ) : (
        <>
          <Stack gap="0">
            <Group justify="space-between" align="center">
              <Text size="xs" c="dimmed">
                {formatAbsoluteDateTime(new Date(comment.commentedAt))}
              </Text>
              <Group gap="xs">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  style={{ opacity: isHovered ? 1 : 0 }}
                  onClick={handleStartEdit}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <Menu shadow="sm" width={150}>
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      style={{ opacity: isHovered ? 1 : 0 }}
                    >
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconTrash size={16} />}
                      color="red"
                      onClick={handleDelete}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Stack>
          <Spoiler maxHeight={100} showLabel="Show more" hideLabel="Show less">
            <ReadOnlyEditor contentJson={comment.contentJson} />
          </Spoiler>
        </>
      )}
    </Stack>
  );
}
