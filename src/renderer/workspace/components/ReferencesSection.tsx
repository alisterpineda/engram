import { useEffect, useState } from 'react';
import { Card, Stack, Text, Box, Loader, ActionIcon, Group } from '@mantine/core';
import { IconUnlink } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { ReferencesData, NoteReference, NoteReferenceType } from '../types/reference';
import { extractMentionIds } from '../utils/mentions';

const electronAPI = (window as any).electronAPI;

interface ReferencesSectionProps {
  noteId: number;
  contentJson: string | null;
}

export function ReferencesSection({ noteId, contentJson }: ReferencesSectionProps) {
  const [references, setReferences] = useState<ReferencesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredReferenceId, setHoveredReferenceId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Extract mentioned IDs from content to determine which references are deletable
  const mentionedIds = contentJson ? extractMentionIds(contentJson) : [];

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

  const handleDeleteReference = async (targetId: number) => {
    if (!confirm('Are you sure you want to remove this reference?')) {
      return;
    }

    try {
      const result = await electronAPI.entry.removeReference(noteId, targetId);
      if (result.success) {
        // Reload references to reflect the deletion
        const referencesResult = await electronAPI.note.getReferences(noteId);
        if (referencesResult.success && referencesResult.data) {
          setReferences(referencesResult.data);
        }
      } else {
        console.error('Failed to remove reference:', result.error);
      }
    } catch (error) {
      console.error('Error removing reference:', error);
    }
  };

  const renderReferenceList = (notes: NoteReference[], emptyMessage: string, isDeletable = false) => {
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
      comment: [],
    };

    filteredNotes.forEach((note) => {
      grouped[note.type].push(note);
    });

    const typeLabels: Record<NoteReferenceType, string> = {
      log: 'Posts',
      page: 'Pages',
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
                {typeNotes.map((note) => {
                  const isReferenceDeletable = isDeletable && !mentionedIds.includes(note.id);
                  const isHovered = hoveredReferenceId === note.id;

                  return (
                    <Box
                      key={note.id}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        transition: 'background-color 0.1s',
                        backgroundColor: isHovered ? 'var(--mantine-color-gray-1)' : 'transparent',
                      }}
                      onMouseEnter={() => setHoveredReferenceId(note.id)}
                      onMouseLeave={() => setHoveredReferenceId(null)}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Text
                          size="sm"
                          style={{ cursor: 'pointer', flex: 1 }}
                          onClick={() => handleNoteClick(note)}
                        >
                          {getNoteLabel(note)}
                        </Text>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteReference(note.id);
                          }}
                          style={{
                            opacity: isReferenceDeletable && isHovered ? 1 : 0,
                            pointerEvents: isReferenceDeletable && isHovered ? 'auto' : 'none',
                          }}
                        >
                          <IconUnlink size={16} />
                        </ActionIcon>
                      </Group>
                    </Box>
                  );
                })}
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
          {renderReferenceList(references.incoming, 'No incoming references', false)}
        </Box>

        {/* Outgoing References */}
        <Box>
          <Text size="sm" fw={600} mb="xs">
            Outgoing References
          </Text>
          {renderReferenceList(references.outgoing, 'No outgoing references', true)}
        </Box>
      </Stack>
    </Card>
  );
}
