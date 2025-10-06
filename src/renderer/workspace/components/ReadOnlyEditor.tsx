import { useEditor } from '@tiptap/react';
import { RichTextEditor } from '@mantine/tiptap';
import { getEditorExtensions } from '../config/editor';

interface ReadOnlyEditorProps {
  contentJson: string;
}

export function ReadOnlyEditor({ contentJson }: ReadOnlyEditorProps) {
  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: contentJson ? JSON.parse(contentJson) : '',
    editable: false,
  });

  return (
    <RichTextEditor
      editor={editor}
      styles={{
        root: {
          border: 'none',
        },
        content: {
          padding: 0,
          backgroundColor: 'transparent',
          '.ProseMirror': {
            padding: 0,
            outline: 'none',
            border: 'none',
          },
          '.ProseMirror:focus': {
            outline: 'none',
            border: 'none',
          },
        },
      }}
    >
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
