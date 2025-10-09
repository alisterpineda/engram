import { Container, Title, Stack, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { ContactComposer } from '../components/ContactComposer';
import { Contact } from '../types/contact';

export function ContactCreateView() {
  const navigate = useNavigate();

  const handleSuccess = (newContact: Contact) => {
    navigate(`/contact/${newContact.id}`);
  };

  const handleCancel = () => {
    navigate('/contacts');
  };

  return (
    <Container size="sm" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Create Contact</Title>
          <Button variant="subtle" onClick={handleCancel}>
            Cancel
          </Button>
        </Group>
        <ContactComposer onSuccess={handleSuccess} />
      </Stack>
    </Container>
  );
}
