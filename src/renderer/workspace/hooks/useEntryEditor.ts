import { useState } from 'react';
import { useEditor, Editor } from '@tiptap/react';
import { getEditorExtensions } from '../config/editor';
import { Entry } from '../types/entry';

const electronAPI = (window as any).electronAPI;

interface UseEntryEditorOptions {
  mode: 'create' | 'update';
  placeholderText?: string;
  parentId?: number | null;
  entryId?: number;
  initialContent?: string;
  onSuccess?: (entry: Entry) => void;
  onCancel?: () => void;
}

interface UseEntryEditorReturn {
  editor: Editor | null;
  isSubmitting: boolean;
  isEmpty: boolean;
  isEditing: boolean;
  isFocused: boolean;
  setIsEditing: (value: boolean) => void;
  handleSubmit: () => Promise<void>;
  handleStartEdit: (content: string) => void;
  handleCancelEdit: () => void;
}

export function useEntryEditor(options: UseEntryEditorOptions): UseEntryEditorReturn {
  const {
    mode,
    placeholderText,
    parentId = null,
    entryId,
    initialContent,
    onSuccess,
    onCancel,
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmpty, setIsEmpty] = useState(mode === 'create' ? true : false);
  const [isEditing, setIsEditing] = useState(mode === 'create' ? true : false);
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: getEditorExtensions(placeholderText),
    content: initialContent ? JSON.parse(initialContent) : '',
    editable: true,
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
    },
    onFocus: () => {
      setIsFocused(true);
    },
    onBlur: () => {
      setIsFocused(false);
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

      if (mode === 'create') {
        const result = await electronAPI.entry.create(
          contentJson,
          contentHtml,
          parentId
        );

        if (result.success) {
          editor.commands.clearContent();
          if (onSuccess) {
            onSuccess(result.data);
          }
        } else {
          console.error('Failed to create entry:', result.error);
        }
      } else if (mode === 'update' && entryId !== undefined) {
        const result = await electronAPI.entry.update(
          entryId,
          contentJson,
          contentHtml
        );

        if (result.success) {
          if (onSuccess) {
            onSuccess(result.data);
          }
          setIsEditing(false);
        } else {
          console.error('Failed to update entry:', result.error);
        }
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} entry:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (content: string) => {
    setIsEditing(true);
    editor?.commands.setContent(JSON.parse(content));
    setIsEmpty(false);
  };

  const handleCancelEdit = () => {
    editor?.commands.clearContent();
    setIsEmpty(true);
    if (mode === 'update') {
      setIsEditing(false);
    }
    if (onCancel) {
      onCancel();
    }
  };

  return {
    editor,
    isSubmitting,
    isEmpty,
    isEditing,
    isFocused,
    setIsEditing,
    handleSubmit,
    handleStartEdit,
    handleCancelEdit,
  };
}
