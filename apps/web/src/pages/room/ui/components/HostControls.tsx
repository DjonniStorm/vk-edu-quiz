import { Button, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import type { HostParticipantDto } from "@quiz/shared";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { notify } from "@/shared/lib";

export interface HostControlsProps {
  isWaiting: boolean;
  isLive: boolean;
  isFinished: boolean;
  hasQuestion: boolean;
  answeredCount: number;
  activeParticipantCount: number;
  hostParticipants: HostParticipantDto[];
  inviteUrl: string;
  roomCode: string;
  isActionPending: boolean;
  isQuestionClosing: boolean;
  onStart: () => void;
  onNext: () => void;
  onFinish: () => void;
  onCopyLink: () => Promise<void>;
  onCopyRoomCode: () => Promise<void>;
}

export const HostControls = ({
  isWaiting,
  isLive,
  isFinished,
  hasQuestion,
  answeredCount,
  activeParticipantCount,
  hostParticipants,
  inviteUrl,
  roomCode,
  isActionPending,
  isQuestionClosing,
  onStart,
  onNext,
  onFinish,
  onCopyLink,
  onCopyRoomCode,
}: HostControlsProps) => {
  const { t } = useTranslation();

  const handleCopyLink = async () => {
    await onCopyLink();
    notify.success(t(LANG_KEYS.pages.room.host.linkCopied));
  };

  const handleCopyRoomCode = async () => {
    await onCopyRoomCode();
    notify.success(t(LANG_KEYS.pages.room.host.codeCopied));
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
            {hostParticipants.length > 0 ? (
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  {t(LANG_KEYS.pages.room.host.participantsTitle, {
                    count: hostParticipants.length,
                  })}
                </Text>
                {hostParticipants.map((participant) => (
                  <Stack key={participant.id} gap={0}>
                    <Text size="sm" fw={600}>
                      {participant.displayName}
                    </Text>
                    {participant.email ? (
                      <Text size="xs" c="dimmed">
                        {participant.email}
                      </Text>
                    ) : null}
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                {t(LANG_KEYS.pages.room.host.participantsEmpty)}
              </Text>
            )}
            <TextInput label={t(LANG_KEYS.pages.room.host.roomCode)} value={roomCode} readOnly />
            <Button variant="default" onClick={() => void handleCopyRoomCode()}>
              {t(LANG_KEYS.pages.room.host.copyRoomCode)}
            </Button>
            <TextInput label={t(LANG_KEYS.pages.room.host.inviteLink)} value={inviteUrl} readOnly />
            <Button variant="default" onClick={() => void handleCopyLink()}>
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
