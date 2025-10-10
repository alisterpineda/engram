import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Stack, Card, Loader, Center, Alert, Title, Button, Group, TextInput, ActionIcon, Avatar } from '@mantine/core';
import { IconAlertCircle, IconEdit, IconTrash, IconUser } from '@tabler/icons-react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { ReadOnlyEditor } from '../components/ReadOnlyEditor';
import { EntryEditor } from '../components/EntryEditor';
import { ReferencesSection } from '../components/ReferencesSection';
import { CommentsSection } from '../components/CommentsSection';
import { Contact } from '../types/contact';

const electronAPI = (window as any).electronAPI;

export function ContactDetailView() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editName, setEditName] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    editable: isEditing,
  });

  useEffect(() => {
    const loadContact = async () => {
      if (!contactId) {
        setError('Invalid contact ID');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await electronAPI.contact.getById(parseInt(contactId, 10));

        if (result.success && result.data) {
          setContact(result.data);
          setEditName(result.data.title);
          if (editor) {
            editor.commands.setContent(result.data.contentJson ? JSON.parse(result.data.contentJson) : '');
          }
        } else {
          setError(result.error || 'Contact not found');
        }
      } catch (err) {
        console.error('Error loading contact:', err);
        setError('Failed to load contact');
      } finally {
        setIsLoading(false);
      }
    };

    loadContact();
  }, [contactId]);

  const handleStartEdit = () => {
    if (contact) {
      setIsEditing(true);
      setEditName(contact.title);
      if (editor) {
        editor.setEditable(true);
        editor.commands.setContent(contact.contentJson ? JSON.parse(contact.contentJson) : '');
      }
    }
  };

  const handleCancelEdit = () => {
    if (contact) {
      setIsEditing(false);
      setEditName(contact.title);
      if (editor) {
        editor.setEditable(false);
        editor.commands.setContent(contact.contentJson ? JSON.parse(contact.contentJson) : '');
      }
    }
  };

  const handleSubmit = async () => {
    if (!editor || !contact || editName.trim() === '') {
      return;
    }

    setIsSubmitting(true);
    try {
      const contentJson = editor.isEmpty ? JSON.stringify({ type: 'doc', content: [] }) : JSON.stringify(editor.getJSON());
      const result = await electronAPI.contact.update(contact.id, contentJson, editName);

      if (result.success && result.data) {
        setContact(result.data);
        setIsEditing(false);
        if (editor) {
          editor.setEditable(false);
        }
      } else {
        console.error('Failed to update contact:', result.error);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!contact || !confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const result = await electronAPI.contact.delete(contact.id);

      if (result.success) {
        navigate('/contacts');
      } else {
        console.error('Failed to delete contact:', result.error);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
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

  if (error || !contact) {
    return (
      <Container size="sm" px={0}>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error || 'Contact not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="sm" px={0}>
      <Stack gap="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="md">
              <Avatar color="blue" radius="xl" size="lg">
                <IconUser size={32} />
              </Avatar>

              <Stack gap={0} style={{ flex: 1 }}>
                {isEditing ? (
                  <TextInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Contact name"
                    required
                    maxLength={255}
                  />
                ) : (
                  <Group justify="space-between" align="center">
                    <Title size="1.5rem" fw={700}>{contact.title}</Title>
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
              </Stack>
            </Group>

            {isEditing ? (
              <EntryEditor editor={editor} showToolbar={true} />
            ) : (
              <ReadOnlyEditor contentJson={contact.contentJson} />
            )}

            {isEditing && (
              <Group justify="flex-end">
                <Button variant="subtle" onClick={handleCancelEdit} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={editName.trim() === '' || isSubmitting}
                  loading={isSubmitting}
                >
                  Save
                </Button>
              </Group>
            )}

            {!isEditing && <CommentsSection parentId={contact.id} parentType="contact" />}
          </Stack>
        </Card>

        <ReferencesSection noteId={contact.id} />
      </Stack>
    </Container>
  );
}
