import { Alert, Badge, Container, Grid, Group, Progress, Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { buildRoomHostPath, ROUTES } from "@/app/routes";
import { usePageHead } from "@/app/seo";
import { AppLayout } from "@/widgets/app-layout";

import { roomStore } from "../model/room.store";
import { FinishedScreen } from "./components/FinishedScreen";
import { HostControls } from "./components/HostControls";
import { LeaderboardList } from "./components/LeaderboardList";
import { QuestionView } from "./components/QuestionView";
import { RoomTimer } from "./components/RoomTimer";

export const RoomHostPage = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  useEffect(() => {
    if (!roomId) {
      return;
    }

    void roomStore.initHost(roomId).then((isSuccess) => {
      if (!isSuccess && roomStore.loadError) {
        navigate(ROUTES.main, { replace: true });
        return;
      }

      if (isSuccess && roomStore.roomId && roomStore.roomId !== roomId) {
        navigate(buildRoomHostPath(roomStore.roomId), { replace: true });
      }
    });

    return () => {
      roomStore.dispose();
    };
  }, [navigate, roomId]);

  const {
    quizTitle,
    currentQuestion,
    currentQuestionNumber,
    totalQuestions,
    topLeaderboard,
    answeredCount,
    activeParticipantCount,
    optionRespondents,
    revealedCorrectOptionIds,
    isQuestionClosing,
    inviteUrl,
    room,
    isActionPending,
    isWaiting,
    isLive,
    isFinished,
    loadError,
    wsConnected,
    hostParticipants,
  } = roomStore;

  const pageTitle = quizTitle
    ? t(LANG_KEYS.pages.room.host.titleWithQuiz, { title: quizTitle })
    : t(LANG_KEYS.pages.room.host.metaTitle);

  usePageHead({
    title: pageTitle,
    description: t(LANG_KEYS.pages.room.host.waitingSubtitle),
  });

  const progressValue =
    totalQuestions > 0 ? (currentQuestionNumber / totalQuestions) * 100 : 0;

  return (
    <AppLayout title={quizTitle || t(LANG_KEYS.pages.room.host.metaTitle)}>
      <Container size="xl">
        <Stack gap="lg">
          {loadError ? <Alert color="red">{loadError}</Alert> : null}

          {!wsConnected && !loadError ? (
            <Badge color="yellow" variant="light">
              {t(LANG_KEYS.pages.room.reconnecting)}
            </Badge>
          ) : null}

          {isFinished ? (
            <FinishedScreen titleKey="host" leaderboard={roomStore.leaderboard} />
          ) : (
            <>
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    {isLive ? (
                      <Badge color="red" variant="filled">
                        {t(LANG_KEYS.pages.room.host.live)}
                      </Badge>
                    ) : null}
                    {isWaiting ? (
                      <Title order={3}>{t(LANG_KEYS.pages.room.host.waitingTitle)}</Title>
                    ) : (
                      <Text size="sm" c="dimmed">
                        {t(LANG_KEYS.pages.room.host.questionProgress, {
                          current: currentQuestionNumber,
                          total: totalQuestions,
                        })}
                      </Text>
                    )}
                    {quizTitle ? <Title order={2}>{quizTitle}</Title> : null}
                  </Stack>
                  {currentQuestion ? <RoomTimer endsAt={currentQuestion.endsAt} /> : null}
                </Group>

                {totalQuestions > 0 ? <Progress value={progressValue} radius="xl" /> : null}
              </Stack>

              <Grid gap="lg">
                <Grid.Col span={{ base: 12, md: 8 }}>
                  {currentQuestion ? (
                    <QuestionView
                      question={currentQuestion}
                      current={currentQuestionNumber}
                      total={totalQuestions}
                      selectedOptionIds={[]}
                      readonly
                      respondentsByOption={optionRespondents}
                      correctOptionIds={revealedCorrectOptionIds}
                    />
                  ) : (
                    <Text size="sm" c="dimmed">
                      {t(LANG_KEYS.pages.room.host.waitingSubtitle)}
                    </Text>
                  )}
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Stack gap="md">
                    <HostControls
                      isWaiting={isWaiting}
                      isLive={isLive}
                      isFinished={isFinished}
                      hasQuestion={Boolean(currentQuestion)}
                      answeredCount={answeredCount}
                      activeParticipantCount={activeParticipantCount}
                      hostParticipants={hostParticipants}
                      inviteUrl={inviteUrl}
                      roomCode={room?.code ?? ""}
                      isActionPending={isActionPending}
                      isQuestionClosing={isQuestionClosing}
                      onStart={() => void roomStore.start()}
                      onNext={() => void roomStore.nextQuestion()}
                      onFinish={() => void roomStore.finish()}
                      onCopyLink={() => roomStore.copyInviteLink()}
                      onCopyRoomCode={() => roomStore.copyRoomCode()}
                    />

                    <Stack gap="xs">
                      <Text fw={600}>{t(LANG_KEYS.pages.room.host.topLeaderboard)}</Text>
                      <LeaderboardList items={topLeaderboard} />
                    </Stack>
                  </Stack>
                </Grid.Col>
              </Grid>
            </>
          )}
        </Stack>
      </Container>
    </AppLayout>
  );
});
