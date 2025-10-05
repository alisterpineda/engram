import { Button, Stack, Group } from '@mantine/core';
import { EntryEditor } from './EntryEditor';
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
  const { editor, isSubmitting, isEmpty, isFocused, handleSubmit, handleCancelEdit } = useEntryEditor({
    mode: 'create',
    placeholderText: parentId === null ? "What's on your mind?" : "Write a comment...",
    parentId,
    initialContent,
    onSuccess,
    onCancel,
  });

  const showToolbar = isFocused || !isEmpty;

  return (
    <Stack gap="xs">
      <EntryEditor editor={editor} showToolbar={showToolbar} />
      <Group justify="flex-end">
        {!isEmpty && (
          <Button
            variant="subtle"
            color="gray"
            onClick={handleCancelEdit}
            disabled={isSubmitting}
          >
            Discard
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
