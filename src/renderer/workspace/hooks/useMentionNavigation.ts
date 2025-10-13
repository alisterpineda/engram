import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tiptap/react';

/**
 * Hook to handle click navigation for mentions in Tiptap editors
 * Listens for clicks on mention elements and navigates to the page detail view
 */
export function useMentionNavigation(editor: Editor | null, enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!editor || !enabled) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the click was on a mention element or inside one
      const mentionElement = target.closest('.mention-page') as HTMLElement;

      if (mentionElement) {
        const pageId = mentionElement.getAttribute('data-mention-id');

        if (pageId) {
          // Prevent default link behavior
          event.preventDefault();

          // Navigate to the page
          try {
            navigate(`/page/${pageId}`);
          } catch (error) {
            console.error(`Failed to navigate to page ${pageId}:`, error);
          }
        }
      }
    };

    // Get the editor's DOM element
    const editorElement = editor.view.dom;

    // Add click listener
    editorElement.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor, enabled, navigate]);
}
