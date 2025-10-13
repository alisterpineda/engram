import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Stack, Card, Text, Loader, Center, Alert, Title, Button, Group, Box } from '@mantine/core';
import { IconAlertCircle, IconMessageReply, IconMessage } from '@tabler/icons-react';
import { ReadOnlyEditor } from '../components/ReadOnlyEditor';
import { ReferencesSection } from '../components/ReferencesSection';
import { CommentsSection } from '../components/CommentsSection';
import { EntryComposer } from '../components/EntryComposer';
import { CommentComposer } from '../components/CommentComposer';
import { Log } from '../types/log';
import { formatAbsoluteDateTime, formatDuration } from '../utils/date';

const electronAPI = (window as any).electronAPI;

export function PostDetailView() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Log | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showComment, setShowComment] = useState(false);

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

  const handleFollowUpCreated = (newPost: Log) => {
    setShowFollowUp(false);
    navigate(`/post/${newPost.id}`);
  };

  const handleCommentCreated = () => {
    setShowComment(false);
  };

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
      <Stack gap="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="xs" c="dimmed">
              {post.endedAt
                ? `${formatAbsoluteDateTime(post.startedAt)} (${formatDuration(post.startedAt, post.endedAt)})`
                : formatAbsoluteDateTime(post.startedAt)}
            </Text>

            {post.title && (
              <Title size="1.3125rem" fw={665} mb="sm">{post.title}</Title>
            )}

            <ReadOnlyEditor contentJson={post.contentJson} />

            {!showFollowUp && !showComment ? (
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    setShowComment(true);
                    setShowFollowUp(false);
                  }}
                  leftSection={<IconMessage size={16} />}
                >
                  Comment
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    setShowFollowUp(true);
                    setShowComment(false);
                  }}
                  leftSection={<IconMessageReply size={16} />}
                >
                  Follow Up
                </Button>
              </Group>
            ) : null}

            {showComment && (
              <Box mt="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-md)' }}>
                <CommentComposer
                  parentId={post.id}
                  onSuccess={handleCommentCreated}
                  onCancel={() => setShowComment(false)}
                  autoFocus={true}
                />
              </Box>
            )}

            {showFollowUp && (
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

            <CommentsSection parentId={post.id} parentType="log" />
          </Stack>
        </Card>

        <ReferencesSection noteId={post.id} />
      </Stack>
    </Container>
  );
}
