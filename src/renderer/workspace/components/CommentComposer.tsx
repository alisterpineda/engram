import { useState } from 'react';
import { Button, Stack, Group } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useEditor } from '@tiptap/react';
import { getEditorExtensions } from '../config/editor';
import { EntryEditor } from './EntryEditor';
import { Comment } from '../types/comment';
import { extractMentionIds } from '../utils/mentions';

const electronAPI = (window as any).electronAPI;

interface CommentComposerProps {
  parentId: number;
  onSuccess?: (comment: Comment) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentComposer({ parentId, onSuccess, onCancel, autoFocus = false }: CommentComposerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentedAt, setCommentedAt] = useState<Date>(new Date());
  const [isEmpty, setIsEmpty] = useState(true);

  const editor = useEditor({
    extensions: getEditorExtensions('Add a comment...'),
    content: '',
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  const handleSubmit = async () => {
    if (!editor || isEmpty) return;

    setIsSubmitting(true);

    try {
      const contentJson = JSON.stringify(editor.getJSON());
      const result = await electronAPI.comment.create(
        parentId,
        contentJson,
        commentedAt,
        null
      );

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

        editor.commands.clearContent();
        setIsEmpty(true);
        setCommentedAt(new Date());

        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        console.error('Failed to create comment:', result.error);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    editor?.commands.clearContent();
    setIsEmpty(true);
    setCommentedAt(new Date());
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Stack gap="xs">
      <Group gap="xs" style={{ minHeight: '24px' }}>
        <DateTimePicker
          value={commentedAt}
          onChange={(value) => {
            if (value) {
              setCommentedAt(typeof value === 'string' ? new Date(value) : value);
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
      </Group>
      <EntryEditor editor={editor} showToolbar={true} />
      <Group justify="flex-end">
        {onCancel && (
          <Button
            variant="subtle"
            color="gray"
            onClick={handleCancel}
            disabled={isSubmitting}
            size="sm"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!editor || isEmpty || isSubmitting}
          loading={isSubmitting}
          size="sm"
        >
          Add Comment
        </Button>
      </Group>
    </Stack>
  );
}
