import { useState } from 'react';
import { Card, Box } from '@mantine/core';
import { CommentSection } from './CommentSection';
import { EditableEntry } from './EditableEntry';
import { Entry } from '../types/entry';
import { useEntryEditor } from '../hooks/useEntryEditor';

interface PostCardProps {
  post: Entry;
  onUpdate: (updatedPost: Entry) => void;
  onDelete: (id: number) => void;
}

const electronAPI = (window as any).electronAPI;

export function PostCard({ post, onUpdate, onDelete }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    editor,
    isSubmitting,
    isEmpty,
    isEditing,
    handleSubmit,
    handleStartEdit,
    handleCancelEdit
  } = useEntryEditor({
    mode: 'update',
    entryId: post.id,
    onSuccess: onUpdate,
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? All comments will also be deleted.')) {
      return;
    }

    try {
      const result = await electronAPI.entry.delete(post.id);

      if (result.success) {
        onDelete(post.id);
      } else {
        console.error('Failed to delete post:', result.error);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <EditableEntry
        createdAt={post.createdAt}
        contentHtml={post.contentHtml}
        contentJson={post.contentJson}
        editor={editor}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        isEmpty={isEmpty}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        isHovered={isHovered}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        contentMarginBottom="md"
        hideTimestampInEditMode={true}
      >
        <Box
          onMouseEnter={() => setIsHovered(false)}
          onMouseLeave={() => setIsHovered(true)}
        >
          <CommentSection postId={post.id} previewMode={true} />
        </Box>
      </EditableEntry>
    </Card>
  );
}
