import { ReactNode, useState, useMemo } from 'react';
import { Text, Group, ActionIcon, Stack, Menu } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import { IconEdit, IconTrash, IconCheck, IconX, IconDots } from '@tabler/icons-react';
import { Editor } from '@tiptap/react';
import { EntryEditor } from './EntryEditor';
import { ReadOnlyEditor } from './ReadOnlyEditor';
import { formatRelativeTime } from '../utils/date';

interface EditableEntryProps {
  startedAt: Date;
  endedAt: Date | null;
  setStartedAt: (date: Date) => void;
  setEndedAt: (date: Date | null) => void;
  parentId: number | null;
  contentJson: string;
  editor: Editor | null;
  isEditing: boolean;
  isSubmitting: boolean;
  isEmpty: boolean;
  onStartEdit: (content: string) => void;
  onCancelEdit: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  children?: ReactNode;
  editIconSize?: number;
  deleteIconSize?: number;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  contentMarginBottom?: string;
  hideTimestampInEditMode?: boolean;
}

export function EditableEntry({
  startedAt,
  endedAt,
  setStartedAt,
  setEndedAt,
  parentId,
  contentJson,
  editor,
  isEditing,
  isSubmitting,
  isEmpty,
  onStartEdit,
  onCancelEdit,
  onSubmit,
  onDelete,
  children,
  editIconSize = 16,
  deleteIconSize = 16,
  isHovered: externalIsHovered,
  onMouseEnter,
  onMouseLeave,
  contentMarginBottom,
  hideTimestampInEditMode = false,
}: EditableEntryProps) {
  const [internalIsHovered, setInternalIsHovered] = useState(false);
  const isHovered = externalIsHovered !== undefined ? externalIsHovered : internalIsHovered;
  const isPost = parentId === null;
  const hasEndTimeError = endedAt && endedAt <= startedAt;

  const handleMouseEnter = () => {
    if (onMouseEnter) {
      onMouseEnter();
    } else {
      setInternalIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (onMouseLeave) {
      onMouseLeave();
    } else {
      setInternalIsHovered(false);
    }
  };

  // End time presets for common meeting durations
  const endTimePresets = useMemo(() => [
    { label: '15 min', value: dayjs(startedAt).add(15, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { label: '30 min', value: dayjs(startedAt).add(30, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { label: '1 hour', value: dayjs(startedAt).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { label: '1.5 hours', value: dayjs(startedAt).add(1.5, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  ], [startedAt]);

  return (
    <Stack
      gap="xs"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isEditing ? (
        <>
          {!hideTimestampInEditMode && (
            <Group gap="xs" mb="xs" style={{ minHeight: '24px' }}>
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
                        minHeight: 'auto',
                      }
                    }}
                  />
                </>
              )}
            </Group>
          )}
          <EntryEditor editor={editor} />
          <Group justify="flex-end" gap="xs">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              <IconX size={16} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              color="blue"
              onClick={onSubmit}
              disabled={!editor || isEmpty || isSubmitting || hasEndTimeError}
              loading={isSubmitting}
            >
              <IconCheck size={16} />
            </ActionIcon>
          </Group>
        </>
      ) : (
        <>
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              {endedAt
                ? `${formatRelativeTime(startedAt)} - ${formatRelativeTime(endedAt)}`
                : formatRelativeTime(startedAt)}
            </Text>
            <Menu shadow="sm" width={150}>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  style={{ opacity: isHovered ? 1 : 0 }}
                >
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconEdit size={editIconSize} />}
                  color="blue"
                  onClick={() => onStartEdit(contentJson)}
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash size={deleteIconSize} />}
                  color="red"
                  onClick={onDelete}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
          <div style={{ marginBottom: contentMarginBottom ? `var(--mantine-spacing-${contentMarginBottom})` : undefined }}>
            <ReadOnlyEditor contentJson={contentJson} />
          </div>
          {children}
        </>
      )}
    </Stack>
  );
}
