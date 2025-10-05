import { RichTextEditor } from '@mantine/tiptap';
import { Editor } from '@tiptap/react';
import { EditorToolbar } from './EditorToolbar';

interface EntryEditorProps {
  editor: Editor | null;
  variant?: 'default' | 'subtle';
}

export function EntryEditor({ editor, variant = 'subtle' }: EntryEditorProps) {
  return (
    <RichTextEditor editor={editor} variant={variant}>
      <EditorToolbar />
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
