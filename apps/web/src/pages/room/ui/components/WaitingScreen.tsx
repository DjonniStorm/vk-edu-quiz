import { Paper, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

export interface WaitingScreenProps {
  roomId: string;
}

export const WaitingScreen = ({ roomId }: WaitingScreenProps) => {
  const { t } = useTranslation();

  return (
    <Paper withBorder radius="md" p="xl" maw={520} mx="auto">
      <Stack gap="sm" align="center">
        <Title order={3}>{t(LANG_KEYS.pages.room.play.waitingTitle)}</Title>
        <Text size="sm" c="dimmed" ta="center">
          {t(LANG_KEYS.pages.room.play.waitingSubtitle)}
        </Text>
        <Text size="sm" c="dimmed">
          {t(LANG_KEYS.pages.room.play.roomCode)}: {roomId}
        </Text>
      </Stack>
    </Paper>
  );
};
