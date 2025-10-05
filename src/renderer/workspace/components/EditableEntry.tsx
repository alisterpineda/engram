import { ReactNode, useState } from 'react';
import { Text, Group, ActionIcon, Stack, Typography } from '@mantine/core';
import { IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { Editor } from '@tiptap/react';
import { EntryEditor } from './EntryEditor';
import { formatRelativeTime } from '../utils/date';

interface EditableEntryProps {
  createdAt: Date;
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
  createdAt,
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
            <Group justify="space-between" align="center">
              <Text size="xs" c="dimmed">
                {formatRelativeTime(createdAt)}
              </Text>
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
              disabled={!editor || isEmpty || isSubmitting}
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
              {formatRelativeTime(createdAt)}
            </Text>
            <Group gap="xs" style={{ opacity: isHovered ? 1 : 0 }}>
              <ActionIcon
                variant="subtle"
                color="blue"
                size="sm"
                onClick={() => onStartEdit(contentJson)}
              >
                <IconEdit size={editIconSize} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={onDelete}
              >
                <IconTrash size={deleteIconSize} />
              </ActionIcon>
            </Group>
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
