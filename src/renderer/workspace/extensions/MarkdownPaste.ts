import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { marked } from 'marked';

// Configure marked for GFM support
marked.setOptions({
  gfm: true,
  breaks: true,
});

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste: (view, event) => {
            try {
              const clipboardText = event.clipboardData?.getData('text/plain');

              if (clipboardText) {
                const html = marked(clipboardText);
                this.editor.commands.insertContent(html);

                return true;
              }

              return false;
            } catch (error) {
              // Fall back to default paste behavior on error
              console.error('Error parsing markdown:', error);
              return false;
            }
          },
        },
      }),
    ];
  },
});
