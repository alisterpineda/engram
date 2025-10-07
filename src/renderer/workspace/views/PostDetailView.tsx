import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Stack, Card, Text, Loader, Center, Alert, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { CommentSection } from '../components/CommentSection';
import { ReadOnlyEditor } from '../components/ReadOnlyEditor';
import { Log } from '../types/log';
import { formatRelativeTime } from '../utils/date';

const electronAPI = (window as any).electronAPI;

export function PostDetailView() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Log | null>(null);
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

            {post.title && (
              <Title order={1} mb="sm">{post.title}</Title>
            )}

            <ReadOnlyEditor contentJson={post.contentJson} />
          </Stack>
        </Card>

        <CommentSection postId={post.id} previewMode={false} />
      </Stack>
    </Container>
  );
}
