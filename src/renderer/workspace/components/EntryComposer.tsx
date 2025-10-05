import { useState } from 'react';
import { Button, Stack, Group } from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface Entry {
  id: number;
  contentJson: string;
  contentHtml: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: number | null;
}

interface EntryComposerProps {
  parentId?: number | null;
  onSuccess?: (entry: Entry) => void;
  buttonText?: string;
  onCancel?: () => void;
  initialContent?: string;
}

const electronAPI = (window as any).electronAPI;

export function EntryComposer({ parentId = null, onSuccess, buttonText = 'Post', onCancel, initialContent }: EntryComposerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TiptapLink.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: parentId === null ? "What's on your mind?" : "Write a comment...",
      }),
    ],
    content: initialContent ? JSON.parse(initialContent) : '',
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
    },
  });

  const handleSubmit = async () => {
    if (!editor || editor.isEmpty) {
      return;
    }

    setIsSubmitting(true);

    try {
      const contentJson = JSON.stringify(editor.getJSON());
      const contentHtml = editor.getHTML();

      const result = await electronAPI.entry.create(
        contentJson,
        contentHtml,
        parentId
      );

      if (result.success) {
        // Clear form
        editor.commands.clearContent();

        // Notify parent component
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        console.error('Failed to create entry:', result.error);
      }
    } catch (error) {
      console.error('Error creating entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    editor?.commands.clearContent();
    setIsEmpty(true);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Stack gap="xs">
      <RichTextEditor editor={editor}>
        <RichTextEditor.Toolbar>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Code />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.CodeBlock />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content />
      </RichTextEditor>
      <Group justify="flex-end">
        {onCancel && (
          <Button
            variant="subtle"
            onClick={handleCancel}
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
