import { useState } from 'react';
import { Textarea, Button, Stack, Group } from '@mantine/core';

interface Entry {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: number | null;
}

interface EntryComposerProps {
  parentId?: number | null;
  onSuccess?: (entry: Entry) => void;
  buttonText?: string;
  onCancel?: () => void;
}

const electronAPI = (window as any).electronAPI;

export function EntryComposer({ parentId = null, onSuccess, buttonText = 'Post', onCancel }: EntryComposerProps) {
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!body.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await electronAPI.entry.create(
        body,
        parentId
      );

      if (result.success) {
        // Clear form
        setBody('');

        // Notify parent component
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        console.error('Failed to create entry:', result.error);
      }
    } catch (error) {
      console.error('Error creating entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setBody('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Stack gap="xs">
      <Textarea
        placeholder={parentId === null ? "What's on your mind?" : "Write a comment..."}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={isSubmitting}
        minRows={3}
        autosize
      />
      <Group justify="flex-end">
        {onCancel && (
          <Button
            variant="subtle"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!body.trim() || isSubmitting}
          loading={isSubmitting}
        >
          {buttonText}
        </Button>
      </Group>
    </Stack>
  );
}
