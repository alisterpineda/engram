import { UnstyledButton, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Page } from '../types/page';

interface PageCardProps {
  page: Page;
  onDelete: (id: number) => void;
}

export function PageCard({ page }: PageCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/page/${page.id}`);
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
      <Text size="md" fw={500}>
        {page.title}
      </Text>
    </UnstyledButton>
  );
}
