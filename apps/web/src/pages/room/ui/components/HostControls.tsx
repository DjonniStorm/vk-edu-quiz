import { Button, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { showSuccessNotification } from "@/shared/lib";

export interface HostControlsProps {
  isWaiting: boolean;
  isLive: boolean;
  isFinished: boolean;
  hasQuestion: boolean;
  answeredCount: number;
  activeParticipantCount: number;
  inviteUrl: string;
  isActionPending: boolean;
  isQuestionClosing: boolean;
  onStart: () => void;
  onNext: () => void;
  onFinish: () => void;
  onCopyLink: () => Promise<void>;
}

export const HostControls = ({
  isWaiting,
  isLive,
  isFinished,
  hasQuestion,
  answeredCount,
  activeParticipantCount,
  inviteUrl,
  isActionPending,
  isQuestionClosing,
  onStart,
  onNext,
  onFinish,
  onCopyLink,
}: HostControlsProps) => {
  const { t } = useTranslation();

  const handleCopy = async () => {
    await onCopyLink();
    showSuccessNotification(t(LANG_KEYS.pages.room.host.linkCopied));
  };

  if (isFinished) {
    return null;
  }

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        {isWaiting ? (
          <>
            <Text size="sm" c="dimmed">
              {t(LANG_KEYS.pages.room.host.waitingSubtitle)}
            </Text>
            <TextInput label={t(LANG_KEYS.pages.room.host.inviteLink)} value={inviteUrl} readOnly />
            <Button variant="default" onClick={() => void handleCopy()}>
              {t(LANG_KEYS.pages.room.host.copyLink)}
            </Button>
            <Button loading={isActionPending} onClick={onStart}>
              {t(LANG_KEYS.pages.room.host.start)}
            </Button>
          </>
        ) : null}

        {isLive ? (
          <>
            <Text fw={600}>
              {t(LANG_KEYS.pages.room.host.answered, {
                answered: answeredCount,
                active: activeParticipantCount,
              })}
            </Text>
            {isQuestionClosing ? (
              <Text size="sm" c="dimmed">
                {t(LANG_KEYS.pages.room.host.closingQuestion)}
              </Text>
            ) : null}
            <Group grow>
              <Button
                loading={isActionPending}
                disabled={!hasQuestion || isQuestionClosing}
                onClick={onNext}
              >
                {t(LANG_KEYS.pages.room.host.next)}
              </Button>
            </Group>
            <Button
              variant="subtle"
              color="red"
              loading={isActionPending}
              disabled={isQuestionClosing}
              onClick={onFinish}
            >
              {t(LANG_KEYS.pages.room.host.finish)}
            </Button>
          </>
        ) : null}
      </Stack>
    </Paper>
  );
};
