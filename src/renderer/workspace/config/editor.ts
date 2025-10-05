import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

export function getEditorExtensions(placeholderText?: string) {
  const extensions = [
    StarterKit,
    Underline,
    TiptapLink.configure({
      openOnClick: false,
    }),
  ];

  if (placeholderText) {
    extensions.push(
      Placeholder.configure({
        placeholder: placeholderText,
      })
    );
  }

  return extensions;
}
