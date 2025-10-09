import { useState } from 'react';
import { Button, Stack, Group, TextInput } from '@mantine/core';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EntryEditor } from './EntryEditor';
import { Contact } from '../types/contact';

const electronAPI = (window as any).electronAPI;

interface ContactComposerProps {
  referenceIds?: number[];
  onSuccess?: (contact: Contact) => void;
}

export function ContactComposer({ referenceIds = [], onSuccess }: ContactComposerProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Notes about this contact...',
      }),
    ],
    content: '',
  });

  const handleSubmit = async () => {
    if (!editor || name.trim() === '') {
      return;
    }

    setIsSubmitting(true);
    try {
      const contentJson = editor.isEmpty ? JSON.stringify({ type: 'doc', content: [] }) : JSON.stringify(editor.getJSON());
      const result = await electronAPI.contact.create(contentJson, name, referenceIds);

      if (result.success && result.data) {
        // Clear form
        setName('');
        editor.commands.setContent('');

        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        console.error('Failed to create contact:', result.error);
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    setName('');
    if (editor) {
      editor.commands.setContent('');
    }
  };

  const isDisabled = name.trim() === '' || isSubmitting;

  return (
    <Stack gap="xs">
      <TextInput
        label="Name"
        placeholder="Contact name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={255}
      />
      <EntryEditor editor={editor} showToolbar={true} />
      <Group justify="flex-end">
        <Button variant="subtle" onClick={handleDiscard} disabled={isSubmitting}>
          Discard
        </Button>
        <Button onClick={handleSubmit} disabled={isDisabled} loading={isSubmitting}>
          Add Contact
        </Button>
      </Group>
    </Stack>
  );
}
