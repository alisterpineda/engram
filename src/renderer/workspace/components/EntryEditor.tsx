import { RichTextEditor } from '@mantine/tiptap';
import { Editor } from '@tiptap/react';
import { EditorToolbar } from './EditorToolbar';

interface EntryEditorProps {
  editor: Editor | null;
  variant?: 'default' | 'subtle';
  showToolbar?: boolean;
}

export function EntryEditor({ editor, variant = 'subtle', showToolbar = true }: EntryEditorProps) {
  return (
    <RichTextEditor editor={editor} variant={variant}>
      {showToolbar && <EditorToolbar />}
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
