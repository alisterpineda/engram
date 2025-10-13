import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Box, Text, Loader, Stack, useMantineColorScheme } from '@mantine/core';

export interface MentionItem {
  id: number;
  label: string;
}

export interface MentionSuggestionProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
  loading?: boolean;
}

export interface MentionSuggestionHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const MentionSuggestion = forwardRef<MentionSuggestionHandle, MentionSuggestionProps>(
  ({ items, command, loading }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }

        return false;
      },
    }));

    if (loading) {
      return (
        <Box p="sm" style={{ textAlign: 'center' }}>
          <Loader size="sm" />
        </Box>
      );
    }

    if (items.length === 0) {
      return (
        <Box p="sm">
          <Text size="sm" c="dimmed">
            No pages found
          </Text>
        </Box>
      );
    }

    const getBackgroundColor = (index: number) => {
      if (index === selectedIndex) {
        return isDark ? 'var(--mantine-color-blue-9)' : 'var(--mantine-color-blue-0)';
      }
      return 'transparent';
    };

    const getTextColor = (index: number) => {
      if (index === selectedIndex) {
        return isDark ? 'blue.3' : 'blue.7';
      }
      return isDark ? 'gray.3' : 'dark.9';
    };

    return (
      <Stack gap={0}>
        {items.map((item, index) => (
          <Box
            key={item.id}
            p="xs"
            style={{
              cursor: 'pointer',
              backgroundColor: getBackgroundColor(index),
              borderRadius: '4px',
              transition: 'background-color 0.1s ease',
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => selectItem(index)}
          >
            <Text size="sm" c={getTextColor(index)}>
              {item.label}
            </Text>
          </Box>
        ))}
      </Stack>
    );
  }
);

MentionSuggestion.displayName = 'MentionSuggestion';
