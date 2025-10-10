/**
 * Extracts plain text from Tiptap JSON content
 * @param contentJson - Tiptap JSON content as a string
 * @param maxLength - Maximum length of the preview (default: 100)
 * @returns Plain text preview
 */
export function getTextPreview(contentJson: string, maxLength = 100): string {
  try {
    const content = JSON.parse(contentJson);
    const text = extractText(content);

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength) + '...';
  } catch (error) {
    return '';
  }
}

/**
 * Recursively extracts text from Tiptap JSON structure
 */
function extractText(node: any): string {
  if (!node) {
    return '';
  }

  // If it's a text node, return the text
  if (node.type === 'text' && node.text) {
    return node.text;
  }

  // If it has content array, recursively extract text from children
  if (Array.isArray(node.content)) {
    return node.content.map(extractText).join(' ').replace(/\s+/g, ' ').trim();
  }

  return '';
}
