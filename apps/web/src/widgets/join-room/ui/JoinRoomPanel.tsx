import { Button, Group, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { RoomStatus } from "@quiz/shared";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { buildRoomPlayPath } from "@/app/routes";
import { userStore } from "@/entities/user";
import { errorStore } from "@/entities/error";
import { getApiErrorMessage, isCancelError, roomsApi } from "@/shared/api";
import { notify, parseRoomIdFromInviteInput } from "@/shared/lib";
import { sectionAnchorStyle } from "@/widgets/app-layout/lib/scroll-to-section";

import { roomSessionStorage } from "@/pages/room/model/room-session";

export const JoinRoomPanel = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [inviteInput, setInviteInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const currentUser = userStore.currentUser;

  const handleJoin = async () => {
    const roomId = parseRoomIdFromInviteInput(inviteInput);

    if (!roomId) {
      notify.warning(t(LANG_KEYS.pages.organizerDashboard.joinRoom.invalidInput));
      return;
    }

    if (!currentUser) {
      return;
    }

    if (roomSessionStorage.get(roomId)) {
      navigate(buildRoomPlayPath(roomId));
      return;
    }

    setIsJoining(true);

    try {
      const room = await roomsApi.getRoom(roomId);

      if (!room) {
        notify.warning(t(LANG_KEYS.pages.organizerDashboard.joinRoom.notFound));
        return;
      }

      if (room.status === RoomStatus.Finished || room.status === RoomStatus.Cancelled) {
        notify.warning(t(LANG_KEYS.pages.organizerDashboard.joinRoom.closed));
        return;
      }

      const participant = await roomsApi.join(roomId, {
        displayName: currentUser.name,
      });

      roomSessionStorage.set(roomId, {
        roomParticipantId: participant.id,
        displayName: participant.displayName,
      });

      navigate(buildRoomPlayPath(roomId));
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.push(
        getApiErrorMessage(error, t(LANG_KEYS.pages.organizerDashboard.joinRoom.failed)),
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Paper id="join-room" withBorder radius="md" p="lg" style={sectionAnchorStyle}>
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={4}>{t(LANG_KEYS.pages.organizerDashboard.joinRoom.title)}</Title>
          <Text size="sm" c="dimmed">
            {t(LANG_KEYS.pages.organizerDashboard.joinRoom.subtitle)}
          </Text>
        </Stack>

        {currentUser ? (
          <Text size="sm">
            {t(LANG_KEYS.pages.organizerDashboard.joinRoom.identity, {
              name: currentUser.name,
              email: currentUser.email,
            })}
          </Text>
        ) : null}

        <Group align="flex-end" wrap="nowrap">
          <TextInput
            style={{ flex: 1 }}
            label={t(LANG_KEYS.pages.organizerDashboard.joinRoom.inputLabel)}
            placeholder={t(LANG_KEYS.pages.organizerDashboard.joinRoom.inputPlaceholder)}
            value={inviteInput}
            onChange={(event) => setInviteInput(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleJoin();
              }
            }}
          />
          <Button loading={isJoining} onClick={() => void handleJoin()}>
            {t(LANG_KEYS.pages.organizerDashboard.joinRoom.join)}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
});
