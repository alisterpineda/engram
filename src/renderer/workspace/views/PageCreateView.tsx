import { Container, Title, Stack, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { PageComposer } from '../components/PageComposer';
import { Page } from '../types/page';

export function PageCreateView() {
  const navigate = useNavigate();

  const handleSuccess = (newPage: Page) => {
    navigate(`/page/${newPage.id}`);
  };

  const handleCancel = () => {
    navigate('/pages');
  };

  return (
    <Container size="sm" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Create Page</Title>
          <Button variant="subtle" onClick={handleCancel}>
            Cancel
          </Button>
        </Group>
        <PageComposer onSuccess={handleSuccess} />
      </Stack>
    </Container>
  );
}
