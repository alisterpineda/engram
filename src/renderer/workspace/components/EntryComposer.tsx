import { useEffect, useMemo } from 'react';
import { Button, Stack, Group, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import { EntryEditor } from './EntryEditor';
import { Log } from '../types/log';
import { useEntryEditor } from '../hooks/useEntryEditor';

interface EntryComposerProps {
  parentId?: number | null;
  onSuccess?: (entry: Log) => void;
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
    startedAt,
    endedAt,
    setStartedAt,
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
  const hasEndTimeError = endedAt && endedAt <= startedAt;

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
    { label: '15 min', value: dayjs(startedAt).add(15, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { label: '30 min', value: dayjs(startedAt).add(30, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { label: '1 hour', value: dayjs(startedAt).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { label: '1.5 hours', value: dayjs(startedAt).add(1.5, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  ], [startedAt]);

  return (
    <Stack gap="xs">
      {showDateFields && (
        <Group gap="xs" style={{ minHeight: '24px' }}>
          <DateTimePicker
            value={startedAt}
            onChange={(value) => {
              if (value) {
                const newStartedAt = typeof value === 'string' ? new Date(value) : value;
                setStartedAt(newStartedAt);
                // Preserve duration if endedAt exists
                if (endedAt) {
                  const duration = endedAt.getTime() - startedAt.getTime();
                  setEndedAt(new Date(newStartedAt.getTime() + duration));
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
                minDate={startedAt}
                presets={endTimePresets}
                error={hasEndTimeError ? 'End time must be after started time' : undefined}
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
