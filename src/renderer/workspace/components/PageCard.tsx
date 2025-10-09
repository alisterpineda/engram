import { useState } from 'react';
import { Card, Text, Group, ActionIcon, Stack, Button, TextInput } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useNavigate } from 'react-router-dom';
import { Page } from '../types/page';
import { ReadOnlyEditor } from './ReadOnlyEditor';
import { EntryEditor } from './EntryEditor';

const electronAPI = (window as any).electronAPI;

interface PageCardProps {
  page: Page;
  onUpdate: (updatedPage: Page) => void;
  onDelete: (id: number) => void;
}

export function PageCard({ page, onUpdate, onDelete }: PageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);
  const navigate = useNavigate();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: page.contentJson ? JSON.parse(page.contentJson) : '',
    editable: isEditing,
  });

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditTitle(page.title);
    if (editor) {
      editor.setEditable(true);
      editor.commands.setContent(page.contentJson ? JSON.parse(page.contentJson) : '');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(page.title);
    if (editor) {
      editor.setEditable(false);
      editor.commands.setContent(page.contentJson ? JSON.parse(page.contentJson) : '');
    }
  };

  const handleSubmit = async () => {
    if (!editor || editTitle.trim() === '' || editor.isEmpty) {
      return;
    }

    setIsSubmitting(true);
    try {
      const contentJson = JSON.stringify(editor.getJSON());
      const result = await electronAPI.page.update(page.id, contentJson, editTitle);

      if (result.success && result.data) {
        onUpdate(result.data);
        setIsEditing(false);
        if (editor) {
          editor.setEditable(false);
        }
      } else {
        console.error('Failed to update page:', result.error);
      }
    } catch (error) {
      console.error('Error updating page:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      const result = await electronAPI.page.delete(page.id);

      if (result.success) {
        onDelete(page.id);
      } else {
        console.error('Failed to delete page:', result.error);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on edit/delete buttons or if editing
    if (
      isEditing ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('.ProseMirror')
    ) {
      return;
    }
    navigate(`/page/${page.id}`);
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{ cursor: isEditing ? 'default' : 'pointer' }}
    >
      <Stack gap="sm">
        {isEditing ? (
          <TextInput
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Page title"
            required
            maxLength={255}
          />
        ) : (
          <Group justify="space-between" align="center">
            <Text size="lg" fw={600}>
              {page.title}
            </Text>
            {isHovered && !isEditing && (
              <Group gap="xs">
                <ActionIcon variant="subtle" onClick={handleStartEdit}>
                  <IconEdit size={18} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="red" onClick={handleDelete}>
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            )}
          </Group>
        )}

        {isEditing ? (
          <EntryEditor editor={editor} showToolbar={true} />
        ) : (
          <ReadOnlyEditor contentJson={page.contentJson} />
        )}

        {isEditing && (
          <Group justify="flex-end">
            <Button variant="subtle" onClick={handleCancelEdit} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={editTitle.trim() === '' || !editor || editor.isEmpty || isSubmitting}
              loading={isSubmitting}
            >
              Save
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
