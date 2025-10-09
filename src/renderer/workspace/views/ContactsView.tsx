import { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, Container, Loader, Center, Divider, Text } from '@mantine/core';
import { ContactComposer } from '../components/ContactComposer';
import { ContactCard } from '../components/ContactCard';
import { Contact } from '../types/contact';

const electronAPI = (window as any).electronAPI;
const CONTACTS_PER_PAGE = 20;

export function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  const handleContactCreated = (newContact: Contact) => {
    setContacts((prev) => [newContact, ...prev]);
  };

  const handleContactUpdated = (updatedContact: Contact) => {
    setContacts((prev) =>
      prev.map((contact) => (contact.id === updatedContact.id ? updatedContact : contact))
    );
  };

  const handleContactDeleted = (id: number) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== id));
  };

  return (
    <Container size="sm" px={0}>
      <Stack gap="lg">
        <ContactComposer onSuccess={handleContactCreated} />
        <Divider />

        {contacts.length === 0 && !isLoading ? (
          <Center py="xl">
            <Text c="dimmed">No contacts yet. Add your first contact above.</Text>
          </Center>
        ) : (
          <>
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onUpdate={handleContactUpdated}
                onDelete={handleContactDeleted}
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
