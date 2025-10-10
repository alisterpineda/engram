import { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, Container, Loader, Center, Text, Table, Title, Button, Group, Avatar, Paper } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Contact } from '../types/contact';

const electronAPI = (window as any).electronAPI;
const CONTACTS_PER_PAGE = 20;

export function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load initial contacts
    loadContacts(0);
  }, []);

  const loadContacts = async (currentOffset: number) => {
    setIsLoading(true);

    try {
      const result = await electronAPI.contact.listAll(currentOffset, CONTACTS_PER_PAGE);

      if (result.success && result.data) {
        if (currentOffset === 0) {
          setContacts(result.data);
        } else {
          setContacts((prev) => [...prev, ...result.data]);
        }

        setHasMore(result.data.length === CONTACTS_PER_PAGE);
        setOffset(currentOffset + result.data.length);
      } else {
        console.error('Failed to load contacts:', result.error);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreContacts = useCallback(() => {
    if (!isLoading && hasMore) {
      loadContacts(offset);
    }
  }, [offset, isLoading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreContacts();
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
  }, [loadMoreContacts]);

  return (
    <Container size="sm" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Contacts</Title>
          <Button onClick={() => navigate('/contacts/new')}>
            Create Contact
          </Button>
        </Group>

        {contacts.length === 0 && !isLoading ? (
          <Center py="xl">
            <Text c="dimmed">No contacts yet. Click &apos;Create Contact&apos; to get started.</Text>
          </Center>
        ) : (
          <Paper withBorder radius="md" p="md">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={60}></Table.Th>
                  <Table.Th>Name</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {contacts.map((contact) => (
                  <Table.Tr
                    key={contact.id}
                    onClick={() => navigate(`/contact/${contact.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>
                      <Avatar color="blue" radius="xl" size="sm">
                        <IconUser size={18} />
                      </Avatar>
                    </Table.Td>
                    <Table.Td>{contact.title}</Table.Td>
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
