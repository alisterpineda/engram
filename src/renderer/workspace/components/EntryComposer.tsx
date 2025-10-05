import { useEffect } from 'react';
import { Button, Stack, Group, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { EntryEditor } from './EntryEditor';
import { Entry } from '../types/entry';
import { useEntryEditor } from '../hooks/useEntryEditor';

interface EntryComposerProps {
  parentId?: number | null;
  onSuccess?: (entry: Entry) => void;
  buttonText?: string;
  onCancel?: () => void;
  initialContent?: string;
  composerMode?: 'minimal' | 'full';
  autoFocus?: boolean;
}

export function EntryComposer({ parentId = null, onSuccess, buttonText = 'Post', onCancel, initialContent, composerMode = 'full', autoFocus = false }: EntryComposerProps) {
  const {
    editor,
    isSubmitting,
    isEmpty,
    isFocused,
    hasFocusedOnce,
    occurredAt,
    endedAt,
    setOccurredAt,
    setEndedAt,
    handleSubmit,
    handleCancelEdit
  } = useEntryEditor({
    mode: 'create',
    placeholderText: parentId === null ? "What's on your mind?" : "Write a comment...",
    parentId,
    initialContent,
    onSuccess,
    onCancel,
    composerMode,
  });

  const isPost = parentId === null;
  const hasEndTimeError = endedAt && endedAt <= occurredAt;

  // Visibility logic based on composer mode
  const showDateFields = composerMode === 'minimal' ? hasFocusedOnce : true;
  const showToolbar = composerMode === 'minimal' ? hasFocusedOnce : true;
  const showDiscard = composerMode === 'minimal' ? hasFocusedOnce : true;

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && editor) {
      editor.commands.focus();
    }
  }, [autoFocus, editor]);

  return (
    <Stack gap="xs">
      {showDateFields && (
        <Group gap="xs" style={{ minHeight: '24px' }}>
          <DateTimePicker
            value={occurredAt}
            onChange={(value) => {
              if (value) {
                setOccurredAt(typeof value === 'string' ? new Date(value) : value);
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
          {isPost && (
            <>
              <Text size="xs" c="dimmed">-</Text>
              <DateTimePicker
                value={endedAt}
                onChange={(value) => {
                  if (value === null) {
                    setEndedAt(null);
                  } else if (value) {
                    setEndedAt(typeof value === 'string' ? new Date(value) : value);
                  }
                }}
                size="xs"
                variant="unstyled"
                valueFormat="LLL"
                placeholder="Add end time"
                clearable
                error={hasEndTimeError ? 'End time must be after occurred time' : undefined}
                styles={{
                  input: {
                    fontSize: 'var(--mantine-font-size-xs)',
                    color: hasEndTimeError ? 'var(--mantine-color-red-filled)' : 'var(--mantine-color-dimmed)',
                    cursor: 'pointer',
                    padding: 0,
                    minHeight: 'auto',
                  }
                }}
              />
            </>
          )}
        </Group>
      )}
      <EntryEditor editor={editor} showToolbar={showToolbar} />
      <Group justify="flex-end">
        {showDiscard && (
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
          disabled={!editor || isEmpty || isSubmitting || hasEndTimeError}
          loading={isSubmitting}
        >
          {buttonText}
        </Button>
      </Group>
    </Stack>
  );
}
