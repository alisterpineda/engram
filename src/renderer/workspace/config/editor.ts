import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { MarkdownPaste } from '../extensions/MarkdownPaste';
import { PageMention } from '../extensions/PageMention';

export function getEditorExtensions(placeholderText?: string) {
  const extensions: any[] = [
    StarterKit,
    TiptapLink.configure({
      openOnClick: false,
    }),
    MarkdownPaste,
    PageMention,
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
