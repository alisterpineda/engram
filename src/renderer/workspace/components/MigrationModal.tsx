import { Modal, Stack, Text, Loader, Button } from '@mantine/core';

interface MigrationModalProps {
  opened: boolean;
  current: number;
  total: number;
  error: string | null;
  onClose: () => void;
}

export function MigrationModal({ opened, current, total, error, onClose }: MigrationModalProps) {
  if (error) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title="Migration Failed"
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        centered
      >
        <Stack gap="md">
          <Text c="red">{error}</Text>
          <Button onClick={onClose} color="red">
            Close
          </Button>
        </Stack>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      title="Loading space..."
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
    >
      <Stack gap="md" align="center">
        <Loader size="lg" />
        {total > 0 && (
          <Text size="sm" c="dimmed">
            Running migration {current} of {total}...
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
