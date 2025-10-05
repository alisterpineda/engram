import { useState } from 'react';
import { Card, Text, Group, ActionIcon, Stack, Box, Typography } from '@mantine/core';
import { IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import { CommentSection } from './CommentSection';

interface Entry {
  id: number;
  contentJson: string;
  contentHtml: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TiptapLink.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    editable: true,
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
    },
  });

  const handleUpdate = async () => {
    if (!editor || editor.isEmpty) {
      return;
    }

    setIsSubmitting(true);

    try {
      const contentJson = JSON.stringify(editor.getJSON());
      const contentHtml = editor.getHTML();

      const result = await electronAPI.entry.update(
        post.id,
        contentJson,
        contentHtml
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

  const handleStartEdit = () => {
    setIsEditing(true);
    editor?.commands.setContent(JSON.parse(post.contentJson));
    setIsEmpty(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    editor?.commands.clearContent();
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
          <RichTextEditor editor={editor}>
            <RichTextEditor.Toolbar>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Bold />
                <RichTextEditor.Italic />
                <RichTextEditor.Underline />
                <RichTextEditor.Strikethrough />
                <RichTextEditor.ClearFormatting />
                <RichTextEditor.Code />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.H1 />
                <RichTextEditor.H2 />
                <RichTextEditor.H3 />
                <RichTextEditor.H4 />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Blockquote />
                <RichTextEditor.Hr />
                <RichTextEditor.BulletList />
                <RichTextEditor.OrderedList />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Link />
                <RichTextEditor.Unlink />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.CodeBlock />
              </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>

            <RichTextEditor.Content />
          </RichTextEditor>
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
              disabled={!editor || isEmpty || isSubmitting}
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
                onClick={handleStartEdit}
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

          <Typography mb="md">
            <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
          </Typography>

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
