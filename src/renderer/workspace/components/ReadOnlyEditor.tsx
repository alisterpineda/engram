import { useEditor } from '@tiptap/react';
import { RichTextEditor } from '@mantine/tiptap';
import { getEditorExtensions } from '../config/editor';
import classes from './ReadOnlyEditor.module.css';

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
      classNames={{
        root: classes.root,
        content: classes.content,
      }}
    >
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
