import { useState } from 'react';
import { Button, Stack, Group, TextInput } from '@mantine/core';
import { useEditor } from '@tiptap/react';
import { getEditorExtensions } from '../config/editor';
import { EntryEditor } from './EntryEditor';
import { Page } from '../types/page';
import { extractMentionIds } from '../utils/mentions';

const electronAPI = (window as any).electronAPI;

interface PageComposerProps {
  referenceIds?: number[];
  onSuccess?: (page: Page) => void;
}

export function PageComposer({ referenceIds = [], onSuccess }: PageComposerProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: getEditorExtensions('Write your page content...'),
    content: '',
  });

  const handleSubmit = async () => {
    if (!editor || title.trim() === '' || editor.isEmpty) {
      return;
    }

    setIsSubmitting(true);
    try {
      const contentJson = JSON.stringify(editor.getJSON());
      const result = await electronAPI.page.create(contentJson, title, referenceIds);

      if (result.success && result.data) {
        // Extract mentions and create references
        const mentionIds = extractMentionIds(contentJson);
        for (const mentionedPageId of mentionIds) {
          try {
            await electronAPI.entry.addReferenceIfNotExists(result.data.id, mentionedPageId);
          } catch (error) {
            console.error(`Failed to create reference to page ${mentionedPageId}:`, error);
          }
        }

        // Clear form
        setTitle('');
        editor.commands.setContent('');

        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        console.error('Failed to create page:', result.error);
      }
    } catch (error) {
      console.error('Error creating page:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    setTitle('');
    if (editor) {
      editor.commands.setContent('');
    }
  };

  const isEmpty = !editor || editor.isEmpty;
  const isDisabled = title.trim() === '' || isEmpty || isSubmitting;

  return (
    <Stack gap="xs">
      <TextInput
        placeholder="Page title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={255}
      />
      <EntryEditor editor={editor} showToolbar={true} />
      <Group justify="flex-end">
        <Button variant="subtle" onClick={handleDiscard} disabled={isSubmitting}>
          Discard
        </Button>
        <Button onClick={handleSubmit} disabled={isDisabled} loading={isSubmitting}>
          Create Page
        </Button>
      </Group>
    </Stack>
  );
}
