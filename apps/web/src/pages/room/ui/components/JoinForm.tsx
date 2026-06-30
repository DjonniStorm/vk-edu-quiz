import { Button, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

export interface JoinFormProps {
  isLoading: boolean;
  onJoin: (displayName: string) => Promise<boolean>;
}

export const JoinForm = ({ isLoading, onJoin }: JoinFormProps) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      return;
    }

    await onJoin(displayName);
  };

  return (
    <Paper withBorder radius="md" p="xl" maw={420} mx="auto">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={3}>{t(LANG_KEYS.pages.room.play.joinTitle)}</Title>
          <Text size="sm" c="dimmed">
            {t(LANG_KEYS.pages.room.play.joinSubtitle)}
          </Text>
        </Stack>

        <TextInput
          label={t(LANG_KEYS.pages.room.play.displayName)}
          placeholder={t(LANG_KEYS.pages.room.play.displayNamePlaceholder)}
          value={displayName}
          onChange={(event) => setDisplayName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleSubmit();
            }
          }}
        />

        <Button loading={isLoading} onClick={() => void handleSubmit()}>
          {t(LANG_KEYS.pages.room.play.join)}
        </Button>
      </Stack>
    </Paper>
  );
};
