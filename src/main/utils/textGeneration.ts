import { generateText } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';

/**
 * Generates plain text from Tiptap JSON content
 * @param contentJson - Tiptap JSON content as a string
 * @returns Plain text representation of the content
 */
export function generateTextFromContentJson(contentJson: string): string {
  try {
    // Parse the JSON content
    const content = JSON.parse(contentJson);

    // Generate text using Tiptap's generateText utility
    // We use the same extensions as in the renderer to ensure consistent schema
    const text = generateText(content, [StarterKit, TiptapLink], {
      blockSeparator: '\n\n', // Use double newlines for readability
    });

    return text;
  } catch (error) {
    // Return empty string for invalid/empty JSON
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error generating text from contentJson:', error);
    }
    return '';
  }
}
