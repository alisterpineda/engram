import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Stack, Card, Text, Loader, Center, Alert, Typography } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { CommentSection } from '../components/CommentSection';

interface Entry {
  id: number;
  contentJson: string;
  contentHtml: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: number | null;
}

const electronAPI = (window as any).electronAPI;

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}

export function PostDetailView() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setError('Invalid post ID');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await electronAPI.entry.getById(parseInt(postId, 10));

        if (result.success && result.data) {
          setPost(result.data);
        } else {
          setError(result.error || 'Post not found');
        }
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  if (isLoading) {
    return (
      <Container size="sm" px={0}>
        <Center p="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container size="sm" px={0}>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error || 'Post not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="sm" px={0}>
      <Stack gap="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="xs" c="dimmed">
              {formatRelativeTime(post.createdAt)}
            </Text>

            <Typography>
              <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            </Typography>
          </Stack>
        </Card>

        <CommentSection postId={post.id} previewMode={false} />
      </Stack>
    </Container>
  );
}
