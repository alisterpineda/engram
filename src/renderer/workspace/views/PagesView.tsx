import { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, Container, Loader, Center, Divider, Text } from '@mantine/core';
import { PageComposer } from '../components/PageComposer';
import { PageCard } from '../components/PageCard';
import { Page } from '../types/page';

const electronAPI = (window as any).electronAPI;
const PAGES_PER_PAGE = 20;

export function PagesView() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  const handlePageCreated = (newPage: Page) => {
    setPages((prev) => [newPage, ...prev]);
  };

  const handlePageUpdated = (updatedPage: Page) => {
    setPages((prev) =>
      prev.map((page) => (page.id === updatedPage.id ? updatedPage : page))
    );
  };

  const handlePageDeleted = (id: number) => {
    setPages((prev) => prev.filter((page) => page.id !== id));
  };

  return (
    <Container size="sm" px={0}>
      <Stack gap="lg">
        <PageComposer onSuccess={handlePageCreated} />
        <Divider />

        {pages.length === 0 && !isLoading ? (
          <Center py="xl">
            <Text c="dimmed">No pages yet. Create your first page above.</Text>
          </Center>
        ) : (
          <>
            {pages.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                onUpdate={handlePageUpdated}
                onDelete={handlePageDeleted}
              />
            ))}
          </>
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
