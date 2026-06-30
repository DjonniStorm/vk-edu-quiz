import { Paper, Stack, Text } from "@mantine/core";
import type { LeaderboardItemDto } from "@quiz/shared";

export interface LeaderboardListProps {
  items: LeaderboardItemDto[];
}

export const LeaderboardList = ({ items }: LeaderboardListProps) => {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {items.map((item, index) => (
        <Paper key={item.roomParticipantId} withBorder radius="md" p="md">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={700}>
              #{index + 1}
            </Text>
            <Text fw={600}>{item.displayName}</Text>
            <Text size="sm" c="dimmed">
              {item.score} pts · {item.correctAnswersCount} correct
            </Text>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
};
