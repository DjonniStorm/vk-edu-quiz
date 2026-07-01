import { Button, ScrollArea, Stack, Text, Title } from "@mantine/core";
import type { LeaderboardItemDto } from "@quiz/shared";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { ROUTES } from "@/app/routes";

import { LeaderboardList } from "./LeaderboardList";

export interface FinishedScreenProps {
  titleKey: "play" | "host";
  leaderboard: LeaderboardItemDto[];
  highlightParticipantId?: string | null;
}

export const FinishedScreen = ({ titleKey, leaderboard, highlightParticipantId }: FinishedScreenProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isParticipant = titleKey === "play";
  const title =
    titleKey === "host"
      ? t(LANG_KEYS.pages.room.host.finishedTitle)
      : t(LANG_KEYS.pages.room.play.finishedTitle);

  return (
    <Stack gap="lg" maw={640} mx="auto">
      <Title order={3}>{title}</Title>
      <Text size="sm" c="dimmed">
        {t(LANG_KEYS.rooms.leaderboard)}
      </Text>
      <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
        <LeaderboardList items={leaderboard} highlightParticipantId={highlightParticipantId} />
      </ScrollArea.Autosize>
      {isParticipant ? (
        <Button variant="light" onClick={() => navigate(ROUTES.main, { replace: true })}>
          {t(LANG_KEYS.pages.room.play.backToMain)}
        </Button>
      ) : null}
    </Stack>
  );
};
