import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Stack, Card, Loader, Center, Alert, Title, Button, Group, TextInput, ActionIcon } from '@mantine/core';
import { IconAlertCircle, IconEdit, IconTrash } from '@tabler/icons-react';
import { useEditor } from '@tiptap/react';
import { getEditorExtensions } from '../config/editor';
import { extractMentionIds } from '../utils/mentions';
import { ReadOnlyEditor } from '../components/ReadOnlyEditor';
import { EntryEditor } from '../components/EntryEditor';
import { ReferencesSection } from '../components/ReferencesSection';
import { CommentsSection } from '../components/CommentsSection';
import { Page } from '../types/page';

const electronAPI = (window as any).electronAPI;

export function PageDetailView() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: '',
    editable: isEditing,
  });

  useEffect(() => {
    const loadPage = async () => {
      if (!pageId) {
        setError('Invalid page ID');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await electronAPI.page.getById(parseInt(pageId, 10));

        if (result.success && result.data) {
          setPage(result.data);
          setEditTitle(result.data.title);
          if (editor) {
            editor.commands.setContent(result.data.contentJson ? JSON.parse(result.data.contentJson) : '');
          }
        } else {
          setError(result.error || 'Page not found');
        }
      } catch (err) {
        console.error('Error loading page:', err);
        setError('Failed to load page');
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [pageId]);

  const handleStartEdit = () => {
    if (page) {
      setIsEditing(true);
      setEditTitle(page.title);
      if (editor) {
        editor.setEditable(true);
        editor.commands.setContent(page.contentJson ? JSON.parse(page.contentJson) : '');
      }
    }
  };

  const handleCancelEdit = () => {
    if (page) {
      setIsEditing(false);
      setEditTitle(page.title);
      if (editor) {
        editor.setEditable(false);
        editor.commands.setContent(page.contentJson ? JSON.parse(page.contentJson) : '');
      }
    }
  };

  const handleSubmit = async () => {
    if (!editor || !page || editTitle.trim() === '' || editor.isEmpty) {
      return;
    }

    setIsSubmitting(true);
    try {
      const contentJson = JSON.stringify(editor.getJSON());
      const result = await electronAPI.page.update(page.id, contentJson, editTitle);

      if (result.success && result.data) {
        // Extract mentions and create references
        const mentionIds = extractMentionIds(contentJson);
        for (const mentionedPageId of mentionIds) {
          try {
            await electronAPI.entry.addReferenceIfNotExists(page.id, mentionedPageId);
          } catch (error) {
            console.error(`Failed to create reference to page ${mentionedPageId}:`, error);
          }
        }

        setPage(result.data);
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
    if (!page || !confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      const result = await electronAPI.page.delete(page.id);

      if (result.success) {
        navigate('/pages');
      } else {
        console.error('Failed to delete page:', result.error);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  if (isLoading) {
    return (
      <Container size="sm" px={0}>
        <Center p="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error || !page) {
    return (
      <Container size="sm" px={0}>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error || 'Page not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="sm" px={0}>
      <Stack gap="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
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
                <Title size="1.5rem" fw={700}>{page.title}</Title>
                <Group gap="xs">
                  <ActionIcon variant="subtle" onClick={handleStartEdit}>
                    <IconEdit size={18} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={handleDelete}>
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
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

            {!isEditing && <CommentsSection parentId={page.id} parentType="page" />}
          </Stack>
        </Card>

        <ReferencesSection noteId={page.id} contentJson={page.contentJson} />
      </Stack>
    </Container>
  );
}
