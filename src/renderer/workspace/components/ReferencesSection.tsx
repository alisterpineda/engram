import { useEffect, useState } from 'react';
import { Card, Stack, Text, Box, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { ReferencesData, NoteReference } from '../types/reference';
import { getTextPreview } from '../utils/content';

const electronAPI = (window as any).electronAPI;

interface ReferencesSectionProps {
  noteId: number;
}

export function ReferencesSection({ noteId }: ReferencesSectionProps) {
  const [references, setReferences] = useState<ReferencesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadReferences = async () => {
      setIsLoading(true);
      try {
        const result = await electronAPI.note.getReferences(noteId);

        if (result.success && result.data) {
          setReferences(result.data);
        } else {
          console.error('Failed to load references:', result.error);
          setReferences({ incoming: [], outgoing: [] });
        }
      } catch (error) {
        console.error('Error loading references:', error);
        setReferences({ incoming: [], outgoing: [] });
      } finally {
        setIsLoading(false);
      }
    };

    loadReferences();
  }, [noteId]);

  const getNoteType = (note: NoteReference): 'log' | 'page' | 'contact' => {
    // TypeORM STI uses 'type' field to discriminate
    const anyNote = note as any;
    if (anyNote.type) {
      return anyNote.type;
    }
    // Fallback: check for specific fields
    if ('startedAt' in note) return 'log';
    // Both page and contact have title required, so we'll default to page
    // This shouldn't happen in practice since TypeORM includes the type field
    return 'page';
  };

  const getNotePath = (note: NoteReference): string => {
    const type = getNoteType(note);
    switch (type) {
      case 'log':
        return `/post/${note.id}`;
      case 'page':
        return `/page/${note.id}`;
      case 'contact':
        return `/contact/${note.id}`;
      default:
        return `/post/${note.id}`;
    }
  };

  const getNoteLabel = (note: NoteReference): string => {
    if (note.title) {
      return note.title;
    }
    return getTextPreview(note.contentJson, 50);
  };

  const handleNoteClick = (note: NoteReference) => {
    navigate(getNotePath(note));
  };

  const renderReferenceList = (notes: NoteReference[], emptyMessage: string) => {
    if (notes.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      );
    }

    // Group by type
    const grouped = notes.reduce((acc, note) => {
      const type = getNoteType(note);
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(note);
      return acc;
    }, {} as Record<string, NoteReference[]>);

    const typeLabels: Record<string, string> = {
      log: 'Posts',
      page: 'Pages',
      contact: 'Contacts',
    };

    return (
      <Stack gap="xs">
        {Object.entries(grouped).map(([type, typeNotes]) => (
          <Box key={type}>
            <Text size="xs" c="dimmed" mb="xs">
              {typeLabels[type] || type}
            </Text>
            <Stack gap="xs">
              {typeNotes.map((note) => (
                <Box
                  key={note.id}
                  onClick={() => handleNoteClick(note)}
                  style={{
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Text size="sm">{getNoteLabel(note)}</Text>
                </Box>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    );
  };

  if (isLoading) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Loader size="sm" />
      </Card>
    );
  }

  if (!references) {
    return null;
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Incoming References */}
        <Box>
          <Text size="sm" fw={600} mb="xs">
            Incoming References
          </Text>
          {renderReferenceList(references.incoming, 'No incoming references')}
        </Box>

        {/* Outgoing References */}
        <Box>
          <Text size="sm" fw={600} mb="xs">
            Outgoing References
          </Text>
          {renderReferenceList(references.outgoing, 'No outgoing references')}
        </Box>
      </Stack>
    </Card>
  );
}
