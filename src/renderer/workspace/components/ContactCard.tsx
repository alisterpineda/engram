import { UnstyledButton, Text, Group, Avatar } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Contact } from '../types/contact';

interface ContactCardProps {
  contact: Contact;
  onDelete: (id: number) => void;
}

export function ContactCard({ contact }: ContactCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/contact/${contact.id}`);
  };

  return (
    <UnstyledButton
      onClick={handleClick}
      style={(theme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.md,
        borderBottom: `1px solid ${theme.colors.gray[3]}`,
        transition: 'background-color 0.1s ease',
        '&:hover': {
          backgroundColor: theme.colors.gray[0],
        },
        '&:last-child': {
          borderBottom: 'none',
        },
      })}
    >
      <Group gap="md">
        <Avatar color="blue" radius="xl">
          <IconUser size={24} />
        </Avatar>
        <Text size="md" fw={500}>
          {contact.title}
        </Text>
      </Group>
    </UnstyledButton>
  );
}
