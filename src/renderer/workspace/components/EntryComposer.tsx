import { useEffect, useMemo } from 'react';
import { Button, Stack, Group, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
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

  // End time presets for common meeting durations
  const endTimePresets = useMemo(() => [
    { label: '15 min', value: dayjs(occurredAt).add(15, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { label: '30 min', value: dayjs(occurredAt).add(30, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { label: '1 hour', value: dayjs(occurredAt).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { label: '1.5 hours', value: dayjs(occurredAt).add(1.5, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  ], [occurredAt]);

  return (
    <Stack gap="xs">
      {showDateFields && (
        <Group gap="xs" style={{ minHeight: '24px' }}>
          <DateTimePicker
            value={occurredAt}
            onChange={(value) => {
              if (value) {
                const newOccurredAt = typeof value === 'string' ? new Date(value) : value;
                setOccurredAt(newOccurredAt);
                // Preserve duration if endedAt exists
                if (endedAt) {
                  const duration = endedAt.getTime() - occurredAt.getTime();
                  setEndedAt(new Date(newOccurredAt.getTime() + duration));
                }
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
                minDate={occurredAt}
                presets={endTimePresets}
                error={hasEndTimeError ? 'End time must be after occurred time' : undefined}
                styles={{
                  input: {
                    fontSize: 'var(--mantine-font-size-xs)',
                    color: hasEndTimeError ? 'var(--mantine-color-red-filled)' : 'var(--mantine-color-dimmed)',
                    cursor: 'pointer',
                    padding: 0,
                    paddingRight: '20px',
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
