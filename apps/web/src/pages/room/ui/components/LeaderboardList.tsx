import { Badge, Group, Paper, Stack, Text } from "@mantine/core";
import type { LeaderboardItemDto } from "@quiz/shared";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

export interface LeaderboardListProps {
  items: LeaderboardItemDto[];
  highlightParticipantId?: string | null;
}

export const LeaderboardList = ({ items, highlightParticipantId }: LeaderboardListProps) => {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {items.map((item, index) => {
        const isOwn = Boolean(highlightParticipantId) && item.roomParticipantId === highlightParticipantId;

        return (
          <Paper
            key={item.roomParticipantId}
            withBorder
            radius="md"
            p="md"
            style={
              isOwn
                ? {
                    borderColor: "#1c4ed8",
                    borderWidth: 2,
                    background: "#f0f5ff",
                  }
                : undefined
            }
          >
            <Stack gap={4}>
              <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed" fw={700}>
                  #{index + 1}
                </Text>
                {isOwn ? (
                  <Badge size="xs" color="indigo" variant="filled">
                    {t(LANG_KEYS.rooms.you)}
                  </Badge>
                ) : null}
              </Group>
              <Text fw={600}>{item.displayName}</Text>
              <Text size="sm" c="dimmed">
                {item.score} pts · {item.correctAnswersCount} correct
              </Text>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};
