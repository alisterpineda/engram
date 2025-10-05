import { ReactNode, useState } from 'react';
import { Text, Group, ActionIcon, Stack, Typography, Menu } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
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

  return (
    <Stack
      gap="xs"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isEditing ? (
        <>
          {!hideTimestampInEditMode && (
            <Group gap="sm" mb="xs">
              <DateTimePicker
                label="Occurred at"
                value={occurredAt}
                onChange={(value) => {
                  if (value) {
                    setOccurredAt(typeof value === 'string' ? new Date(value) : value);
                  }
                }}
                size="xs"
                style={{ flex: 1 }}
              />
              {isPost && (
                <DateTimePicker
                  label="Ended at"
                  value={endedAt}
                  onChange={(value) => {
                    if (value === null) {
                      setEndedAt(null);
                    } else if (value) {
                      setEndedAt(typeof value === 'string' ? new Date(value) : value);
                    }
                  }}
                  size="xs"
                  style={{ flex: 1 }}
                  clearable
                  error={hasEndTimeError ? 'End time must be after occurred time' : undefined}
                />
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
