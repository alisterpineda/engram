import { useState } from 'react';
import { useEditor, Editor } from '@tiptap/react';
import { getEditorExtensions } from '../config/editor';
import { Log } from '../types/log';

const electronAPI = (window as any).electronAPI;

interface UseEntryEditorOptions {
  mode: 'create' | 'update';
  placeholderText?: string;
  parentId?: number | null;
  entryId?: number;
  initialContent?: string;
  initialStartedAt?: Date;
  initialEndedAt?: Date | null;
  onSuccess?: (entry: Log) => void;
  onCancel?: () => void;
  composerMode?: 'minimal' | 'full';
}

interface UseEntryEditorReturn {
  editor: Editor | null;
  isSubmitting: boolean;
  isEmpty: boolean;
  isEditing: boolean;
  isFocused: boolean;
  hasFocusedOnce: boolean;
  startedAt: Date;
  endedAt: Date | null;
  setStartedAt: (date: Date) => void;
  setEndedAt: (date: Date | null) => void;
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
    initialStartedAt,
    initialEndedAt,
    onSuccess,
    onCancel,
    composerMode = 'full',
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmpty, setIsEmpty] = useState(mode === 'create' ? true : false);
  const [isEditing, setIsEditing] = useState(mode === 'create' ? true : false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasFocusedOnce, setHasFocusedOnce] = useState(false);
  const [startedAt, setStartedAt] = useState<Date>(initialStartedAt || new Date());
  const [endedAt, setEndedAt] = useState<Date | null>(initialEndedAt || null);

  const editor = useEditor({
    extensions: getEditorExtensions(placeholderText),
    content: initialContent ? JSON.parse(initialContent) : '',
    editable: true,
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
    },
    onFocus: () => {
      setIsFocused(true);
      setHasFocusedOnce(true);
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

      if (mode === 'create') {
        const result = await electronAPI.entry.create(
          contentJson,
          parentId,
          startedAt,
          endedAt
        );

        if (result.success) {
          editor.commands.clearContent();
          setStartedAt(new Date());
          setEndedAt(null);
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
          startedAt,
          endedAt
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
    if (mode === 'create') {
      setStartedAt(new Date());
      setEndedAt(null);
      setHasFocusedOnce(false);
    }
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
    hasFocusedOnce,
    startedAt,
    endedAt,
    setStartedAt,
    setEndedAt,
    setIsEditing,
    handleSubmit,
    handleStartEdit,
    handleCancelEdit,
  };
}
