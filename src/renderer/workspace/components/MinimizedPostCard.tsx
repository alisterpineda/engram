import { Box, Text, Card, Group } from '@mantine/core';
import { IconQuote } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Log } from '../types/log';
import { Comment } from '../types/comment';
import { DayFilteredCommentsSection } from './DayFilteredCommentsSection';
import { MouseEvent } from 'react';

interface MinimizedPostCardProps {
  post: Log;
  day: string;
  comments: Comment[];
  onCommentCreated: () => void;
}

export function MinimizedPostCard({ post, day, comments, onCommentCreated }: MinimizedPostCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/post/${post.id}`);
  };

  // Use title if available, otherwise use first 50 chars of contentText, or "[Untitled]"
  const displayTitle = post.title ||
    (post.contentText && post.contentText.length > 0
      ? post.contentText.substring(0, 50) + (post.contentText.length > 50 ? '...' : '')
      : '[Untitled]');

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Box
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          padding: 'var(--mantine-spacing-sm)',
          borderRadius: 'var(--mantine-radius-sm)',
          backgroundColor: 'var(--mantine-color-gray-0)',
          marginBottom: 'var(--mantine-spacing-xs)',
        }}
        onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
        }}
        onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
        }}
      >
        <Group gap="xs" wrap="nowrap">
          <IconQuote size={16} style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }} />
          <Text size="sm" c="dimmed" fw={500}>
            {displayTitle}
          </Text>
        </Group>
      </Box>

      <DayFilteredCommentsSection
        postId={post.id}
        day={day}
        comments={comments}
        onCommentCreated={onCommentCreated}
      />
    </Card>
  );
}
