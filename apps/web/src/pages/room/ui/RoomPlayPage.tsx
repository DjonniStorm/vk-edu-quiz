import { Alert, Badge, Container, Stack } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { usePageHead } from "@/app/seo";
import { buildRoomPlayPath, ROUTES } from "@/app/routes";

import { roomStore } from "../model/room.store";
import { FinishedScreen } from "./components/FinishedScreen";
import { JoinForm } from "./components/JoinForm";
import { QuestionView } from "./components/QuestionView";
import { WaitingScreen } from "./components/WaitingScreen";

export const RoomPlayPage = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let cancelled = false;

    (async () => {
      const isSuccess = await roomStore.initPlay(roomId);
      if (cancelled) return;

      if (!isSuccess && roomStore.loadError) {
        navigate(ROUTES.main, { replace: true });
        return;
      }

      if (isSuccess && roomStore.roomId && roomStore.roomId !== roomId) {
        navigate(buildRoomPlayPath(roomStore.roomId), { replace: true });
      }
    })();

    return () => {
      cancelled = true;
      roomStore.dispose();
    };
  }, [navigate, roomId]);

  const {
    phase,
    currentQuestion,
    totalQuestions,
    selectedOptionIds,
    lastAnswerResult,
    isActionPending,
    loadError,
    wsConnected,
    wsEverConnected,
    displayName,
    quizTitle,
    room,
    roomParticipantId,
    leaderboard,
  } = roomStore;

  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (phase !== "finished") {
      confettiFiredRef.current = false;
      return;
    }

    if (confettiFiredRef.current || !roomParticipantId) {
      return;
    }

    const isTopThree = leaderboard
      .slice(0, 3)
      .some((item) => item.roomParticipantId === roomParticipantId);

    if (!isTopThree) {
      return;
    }

    confettiFiredRef.current = true;

    void import("canvas-confetti").then(({ default: confetti }) => {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    });
  }, [phase, roomParticipantId, leaderboard]);

  const pageTitle = quizTitle
    ? t(LANG_KEYS.pages.room.play.titleWithQuiz, { title: quizTitle })
    : t(LANG_KEYS.pages.room.play.metaTitle);

  usePageHead({
    title: pageTitle,
    description: t(LANG_KEYS.pages.room.play.joinSubtitle),
  });

  const resultText = lastAnswerResult
    ? lastAnswerResult.isCorrect
      ? `${t(LANG_KEYS.pages.room.play.correct)} ${t(LANG_KEYS.pages.room.play.points, {
          count: lastAnswerResult.points,
        })}`
      : t(LANG_KEYS.pages.room.play.incorrect)
    : undefined;

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {loadError ? <Alert color="red">{loadError}</Alert> : null}

        {!wsConnected && wsEverConnected && phase !== "join" && !loadError ? (
          <Badge color="yellow" variant="light">
            {t(LANG_KEYS.pages.room.reconnecting)}
          </Badge>
        ) : null}

        {phase === "join" && roomId ? (
          <JoinForm isLoading={isActionPending} onJoin={(name) => roomStore.join(name)} />
        ) : null}

        {phase === "waiting" && room?.code ? <WaitingScreen roomCode={room.code} /> : null}

        {(phase === "answering" || phase === "submitted") && currentQuestion ? (
          <QuestionView
            question={currentQuestion}
            current={currentQuestion.orderIndex + 1}
            total={totalQuestions}
            selectedOptionIds={selectedOptionIds}
            showSubmit={phase === "answering"}
            isSubmitting={isActionPending}
            submitted={phase === "submitted"}
            resultText={resultText}
            onToggle={(optionId) => roomStore.toggleOption(optionId, currentQuestion.answerMode)}
            onSubmit={() => void roomStore.submitAnswer()}
          />
        ) : null}

        {phase === "submitted" && !currentQuestion && displayName && room?.code ? (
          <WaitingScreen roomCode={room.code} />
        ) : null}

        {phase === "finished" ? (
          <FinishedScreen
            titleKey="play"
            leaderboard={roomStore.leaderboard}
            highlightParticipantId={roomParticipantId}
          />
        ) : null}
      </Stack>
    </Container>
  );
});
