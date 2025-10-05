import { ReactNode, useState, useMemo } from 'react';
import { Text, Group, ActionIcon, Stack, Typography, Menu } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import { IconEdit, IconTrash, IconCheck, IconX, IconDots } from '@tabler/icons-react';
import { Editor } from '@tiptap/react';
import { EntryEditor } from './EntryEditor';
import { formatRelativeTime } from '../utils/date';

interface EditableEntryProps {
  occurredAt: Date;
  endedAt: Date | null;
  setOccurredAt: (date: Date) => void;
  setEndedAt: (date: Date | null) => void;
  parentId: number | null;
  contentHtml: string;
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
  occurredAt,
  endedAt,
  setOccurredAt,
  setEndedAt,
  parentId,
  contentHtml,
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
  const hasEndTimeError = endedAt && endedAt <= occurredAt;

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
    { label: '15 min', value: dayjs(occurredAt).add(15, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { label: '30 min', value: dayjs(occurredAt).add(30, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { label: '1 hour', value: dayjs(occurredAt).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { label: '1.5 hours', value: dayjs(occurredAt).add(1.5, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  ], [occurredAt]);

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
                ? `${formatRelativeTime(occurredAt)} - ${formatRelativeTime(endedAt)}`
                : formatRelativeTime(occurredAt)}
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
          <Typography mb={contentMarginBottom}>
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </Typography>
          {children}
        </>
      )}
    </Stack>
  );
}
