import { Stack, Text, Title } from "@mantine/core";
import type { LeaderboardItemDto } from "@quiz/shared";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

import { LeaderboardList } from "./LeaderboardList";

export interface FinishedScreenProps {
  titleKey: "play" | "host";
  leaderboard: LeaderboardItemDto[];
}

export const FinishedScreen = ({ titleKey, leaderboard }: FinishedScreenProps) => {
  const { t } = useTranslation();
  const title =
    titleKey === "host"
      ? t(LANG_KEYS.pages.room.host.finishedTitle)
      : t(LANG_KEYS.pages.room.play.finishedTitle);

  return (
    <Stack gap="lg" maw={640} mx="auto">
      <Title order={3}>{title}</Title>
      <Text size="sm" c="dimmed">
        {t(LANG_KEYS.pages.room.host.topLeaderboard)}
      </Text>
      <LeaderboardList items={leaderboard} />
    </Stack>
  );
};
