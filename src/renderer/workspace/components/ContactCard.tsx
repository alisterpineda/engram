import { useState } from 'react';
import { Card, Text, Group, ActionIcon, Stack, Button, TextInput, Avatar } from '@mantine/core';
import { IconEdit, IconTrash, IconUser } from '@tabler/icons-react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useNavigate } from 'react-router-dom';
import { Contact } from '../types/contact';
import { ReadOnlyEditor } from './ReadOnlyEditor';
import { EntryEditor } from './EntryEditor';

const electronAPI = (window as any).electronAPI;

interface ContactCardProps {
  contact: Contact;
  onUpdate: (updatedContact: Contact) => void;
  onDelete: (id: number) => void;
}

export function ContactCard({ contact, onUpdate, onDelete }: ContactCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editName, setEditName] = useState(contact.title);
  const navigate = useNavigate();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: contact.contentJson ? JSON.parse(contact.contentJson) : '',
    editable: isEditing,
  });

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditName(contact.title);
    if (editor) {
      editor.setEditable(true);
      editor.commands.setContent(contact.contentJson ? JSON.parse(contact.contentJson) : '');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(contact.title);
    if (editor) {
      editor.setEditable(false);
      editor.commands.setContent(contact.contentJson ? JSON.parse(contact.contentJson) : '');
    }
  };

  const handleSubmit = async () => {
    if (!editor || editName.trim() === '') {
      return;
    }

    setIsSubmitting(true);
    try {
      const contentJson = editor.isEmpty ? JSON.stringify({ type: 'doc', content: [] }) : JSON.stringify(editor.getJSON());
      const result = await electronAPI.contact.update(contact.id, contentJson, editName);

      if (result.success && result.data) {
        onUpdate(result.data);
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
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const result = await electronAPI.contact.delete(contact.id);

      if (result.success) {
        onDelete(contact.id);
      } else {
        console.error('Failed to delete contact:', result.error);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
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
    navigate(`/contact/${contact.id}`);
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
        <Group gap="md">
          <Avatar color="blue" radius="xl">
            <IconUser size={24} />
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
                <Text size="lg" fw={600}>
                  {contact.title}
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
      </Stack>
    </Card>
  );
}
