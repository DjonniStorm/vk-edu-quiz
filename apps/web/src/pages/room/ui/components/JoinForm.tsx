import { Button, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { userStore } from "@/entities/user";

export interface JoinFormProps {
  isLoading: boolean;
  onJoin: (displayName: string) => Promise<boolean>;
}

export const JoinForm = observer(({ isLoading, onJoin }: JoinFormProps) => {
  const { t } = useTranslation();
  const currentUser = userStore.currentUser;
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.name);
    }
  }, [currentUser]);

  const handleSubmit = async () => {
    const name = (currentUser?.name ?? displayName).trim();

    if (!name) {
      return;
    }

    await onJoin(name);
  };

  return (
    <Paper withBorder radius="md" p="xl" maw={420} mx="auto">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={3}>{t(LANG_KEYS.pages.room.play.joinTitle)}</Title>
          <Text size="sm" c="dimmed">
            {currentUser
              ? t(LANG_KEYS.pages.room.play.joinAsAccount, {
                  name: currentUser.name,
                  email: currentUser.email,
                })
              : t(LANG_KEYS.pages.room.play.joinSubtitle)}
          </Text>
        </Stack>

        <TextInput
          label={t(LANG_KEYS.pages.room.play.displayName)}
          placeholder={t(LANG_KEYS.pages.room.play.displayNamePlaceholder)}
          value={displayName}
          readOnly={Boolean(currentUser)}
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
});
