import { Button, Stack, Group } from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { EditorToolbar } from './EditorToolbar';
import { Entry } from '../types/entry';
import { useEntryEditor } from '../hooks/useEntryEditor';

interface EntryComposerProps {
  parentId?: number | null;
  onSuccess?: (entry: Entry) => void;
  buttonText?: string;
  onCancel?: () => void;
  initialContent?: string;
}

export function EntryComposer({ parentId = null, onSuccess, buttonText = 'Post', onCancel, initialContent }: EntryComposerProps) {
  const { editor, isSubmitting, isEmpty, handleSubmit, handleCancelEdit } = useEntryEditor({
    mode: 'create',
    placeholderText: parentId === null ? "What's on your mind?" : "Write a comment...",
    parentId,
    initialContent,
    onSuccess,
    onCancel,
  });

  return (
    <Stack gap="xs">
      <RichTextEditor editor={editor}>
        <EditorToolbar />
        <RichTextEditor.Content />
      </RichTextEditor>
      <Group justify="flex-end">
        {onCancel && (
          <Button
            variant="subtle"
            onClick={handleCancelEdit}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!editor || isEmpty || isSubmitting}
          loading={isSubmitting}
        >
          {buttonText}
        </Button>
      </Group>
    </Stack>
  );
}
