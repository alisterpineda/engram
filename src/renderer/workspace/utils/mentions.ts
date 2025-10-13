/**
 * Recursively traverses a Tiptap node tree to find mention nodes
 */
function traverseNode(node: any, mentionIds: number[]): void {
  if (!node) return;

  // Check if this node is a mention
  if (node.type === 'mention' && node.attrs?.id) {
    const id = typeof node.attrs.id === 'string' ? parseInt(node.attrs.id, 10) : node.attrs.id;
    if (!isNaN(id) && !mentionIds.includes(id)) {
      mentionIds.push(id);
    }
  }

  // Recursively traverse content array
  if (Array.isArray(node.content)) {
    node.content.forEach((child: any) => traverseNode(child, mentionIds));
  }
}

/**
 * Extracts all mention IDs from Tiptap content JSON
 * Recursively searches through the content tree for mention nodes
 */
export function extractMentionIds(contentJson: string): number[] {
  try {
    const content = JSON.parse(contentJson);
    const mentionIds: number[] = [];

    traverseNode(content, mentionIds);

    return mentionIds;
  } catch (error) {
    console.error('Error extracting mention IDs from content:', error);
    return [];
  }
}
