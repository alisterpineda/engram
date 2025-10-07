import { useState } from 'react';
import { Card, Box } from '@mantine/core';
import { CommentSection } from './CommentSection';
import { EditableEntry } from './EditableEntry';
import { Log } from '../types/log';
import { useEntryEditor } from '../hooks/useEntryEditor';

interface PostCardProps {
  post: Log;
  onUpdate: (updatedPost: Log) => void;
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
    startedAt,
    endedAt,
    title,
    setStartedAt,
    setEndedAt,
    setTitle,
    handleSubmit,
    handleStartEdit,
    handleCancelEdit
  } = useEntryEditor({
    mode: 'update',
    entryId: post.id,
    initialStartedAt: new Date(post.startedAt),
    initialEndedAt: post.endedAt ? new Date(post.endedAt) : null,
    initialTitle: post.title,
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
        startedAt={startedAt}
        endedAt={endedAt}
        setStartedAt={setStartedAt}
        setEndedAt={setEndedAt}
        parentId={post.parentId}
        title={title}
        setTitle={setTitle}
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
        hideTimestampInEditMode={false}
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
