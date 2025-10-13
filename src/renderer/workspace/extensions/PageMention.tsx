import { ReactRenderer } from '@tiptap/react';
import Mention from '@tiptap/extension-mention';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { MentionSuggestion, MentionSuggestionHandle } from '../components/MentionSuggestion';

const electronAPI = (window as any).electronAPI;

let debounceTimer: NodeJS.Timeout | null = null;

export const PageMention = Mention.configure({
  HTMLAttributes: {
    class: 'mention-page',
  },
  suggestion: {
    char: '@',
    items: async ({ query }: { query: string }): Promise<Array<{ id: number; label: string }>> => {
      // Debounce the search
      return new Promise((resolve) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(async () => {
          try {
            const result = await electronAPI.page.searchByTitle(query);
            if (result.success && result.data) {
              // Transform pages to have 'label' instead of 'title'
              const items = result.data.map((page: { id: number; title: string }) => ({
                id: page.id,
                label: page.title,
              }));
              resolve(items);
            } else {
              resolve([]);
            }
          } catch (error) {
            console.error('Error searching pages:', error);
            resolve([]);
          }
        }, 150);
      });
    },
    render: () => {
      let component: ReactRenderer<MentionSuggestionHandle> | null = null;
      let popup: TippyInstance[] | null = null;

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(MentionSuggestion, {
            props: {
              ...props,
              loading: false,
            },
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
            maxWidth: 400,
            theme: 'mention',
          });
        },

        onUpdate(props: any) {
          component?.updateProps({
            ...props,
            loading: false,
          });

          if (!props.clientRect) {
            return;
          }

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect,
          });
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide();
            return true;
          }

          return component?.ref?.onKeyDown(props.event) || false;
        },

        onExit() {
          popup?.[0]?.destroy();
          component?.destroy();
        },
      };
    },
  },
  renderHTML({ options, node }) {
    return [
      'span',
      {
        ...options.HTMLAttributes,
        'data-mention-id': node.attrs.id,
        'data-mention-label': node.attrs.label,
      },
      `@${node.attrs.label}`,
    ];
  },
});
