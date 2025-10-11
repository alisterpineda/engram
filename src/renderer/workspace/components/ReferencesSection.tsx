import { useEffect, useState } from 'react';
import { Card, Stack, Text, Box, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { ReferencesData, NoteReference, NoteReferenceType } from '../types/reference';

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

  const getNotePath = (note: NoteReference): string => {
    if (note.type === 'contact') {
      return `/contact/${note.id}`;
    }

    if (note.type === 'page') {
      return `/page/${note.id}`;
    }

    if (note.type === 'comment') {
      // Navigate to the parent note instead (comments don't have their own detail view)
      return `/post/${note.parentId}`;
    }

    return `/post/${note.id}`;
  };

  const getNoteLabel = (note: NoteReference): string => {
    if (note.title) {
      return note.title;
    }
    // Use contentText (full plain text) and truncate to 50 chars
    return note.contentText?.substring(0, 50).trim() || '';
  };

  const handleNoteClick = (note: NoteReference) => {
    navigate(getNotePath(note));
  };

  const renderReferenceList = (notes: NoteReference[], emptyMessage: string) => {
    // Filter out comments - they have their own section
    const filteredNotes = notes.filter((note) => note.type !== 'comment');

    if (filteredNotes.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      );
    }

    // Group by type
    const grouped: Record<NoteReferenceType, NoteReference[]> = {
      log: [],
      page: [],
      contact: [],
      comment: [],
    };

    filteredNotes.forEach((note) => {
      grouped[note.type].push(note);
    });

    const typeLabels: Record<NoteReferenceType, string> = {
      log: 'Posts',
      page: 'Pages',
      contact: 'Contacts',
      comment: 'Comments',
    };

    return (
      <Stack gap="xs">
        {Object.entries(grouped)
          .filter(([, typeNotes]) => typeNotes.length > 0)
          .map(([type, typeNotes]) => (
            <Box key={type}>
              <Text size="xs" c="dimmed" mb="xs">
                {typeLabels[type as NoteReferenceType] || type}
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
