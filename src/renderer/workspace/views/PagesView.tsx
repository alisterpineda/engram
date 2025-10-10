import { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, Container, Loader, Center, Text, Table, Title, Button, Group, Paper } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Page } from '../types/page';

const electronAPI = (window as any).electronAPI;
const PAGES_PER_PAGE = 20;

export function PagesView() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load initial pages
    loadPages(0);
  }, []);

  const loadPages = async (currentOffset: number) => {
    setIsLoading(true);

    try {
      const result = await electronAPI.page.listAll(currentOffset, PAGES_PER_PAGE);

      if (result.success && result.data) {
        if (currentOffset === 0) {
          setPages(result.data);
        } else {
          setPages((prev) => [...prev, ...result.data]);
        }

        setHasMore(result.data.length === PAGES_PER_PAGE);
        setOffset(currentOffset + result.data.length);
      } else {
        console.error('Failed to load pages:', result.error);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePages = useCallback(() => {
    if (!isLoading && hasMore) {
      loadPages(offset);
    }
  }, [offset, isLoading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePages();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMorePages]);

  return (
    <Container size="sm" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Pages</Title>
          <Button onClick={() => navigate('/pages/new')}>
            Create Page
          </Button>
        </Group>

        {pages.length === 0 && !isLoading ? (
          <Center py="xl">
            <Text c="dimmed">No pages yet. Click &apos;Create Page&apos; to get started.</Text>
          </Center>
        ) : (
          <Paper withBorder radius="md" p="md">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pages.map((page) => (
                  <Table.Tr
                    key={page.id}
                    onClick={() => navigate(`/page/${page.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>{page.title}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}

        {isLoading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        <div ref={observerTarget} style={{ height: 1 }} />
      </Stack>
    </Container>
  );
}
