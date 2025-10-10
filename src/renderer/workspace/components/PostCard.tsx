import { useState } from 'react';
import { Card, Button, Group, Box } from '@mantine/core';
import { IconMessageReply } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { EditableLog } from './EditableLog';
import { EntryComposer } from './EntryComposer';
import { Log } from '../types/log';
import { useEntryEditor } from '../hooks/useEntryEditor';

interface PostCardProps {
  post: Log;
  onUpdate: (updatedPost: Log) => void;
  onDelete: (id: number) => void;
  onFollowUpCreated?: (newPost: Log) => void;
}

const electronAPI = (window as any).electronAPI;

export function PostCard({ post, onUpdate, onDelete, onFollowUpCreated }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const navigate = useNavigate();

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
    if (!confirm('Are you sure you want to delete this post?')) {
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

  const handleViewDetails = () => {
    navigate(`/post/${post.id}`);
  };

  const handleFollowUpCreated = (newPost: Log) => {
    setShowFollowUp(false);
    if (onFollowUpCreated) {
      onFollowUpCreated(newPost);
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
      <EditableLog
        startedAt={startedAt}
        endedAt={endedAt}
        setStartedAt={setStartedAt}
        setEndedAt={setEndedAt}
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
        onViewDetails={handleViewDetails}
      >
        {!isEditing && (
          <Box>
            {!showFollowUp ? (
              <Group justify="flex-end">
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setShowFollowUp(true)}
                  leftSection={<IconMessageReply size={16} />}
                >
                  Follow Up
                </Button>
              </Group>
            ) : (
              <Box mt="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-md)' }}>
                <EntryComposer
                  referenceIds={[post.id]}
                  onSuccess={handleFollowUpCreated}
                  onCancel={() => setShowFollowUp(false)}
                  buttonText="Create Follow Up"
                  composerMode="minimal"
                  autoFocus={true}
                />
              </Box>
            )}
          </Box>
        )}
      </EditableLog>
    </Card>
  );
}
