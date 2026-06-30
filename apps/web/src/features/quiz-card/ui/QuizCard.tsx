import { useState } from "react";
import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { QuizStatus } from "@quiz/shared";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { buildQuizEditPath, buildQuizResultsPath, buildRoomHostPath } from "@/app/routes";
import { QUIZ_STATUS_COLOR, QUIZ_STATUS_LABEL_KEY } from "@/features/quiz-card/model/quiz-status.ui";
import { errorStore } from "@/entities/error";
import { getApiErrorMessage, isCancelError, quizzesApi, roomsApi } from "@/shared/api";
import { showSuccessNotification } from "@/shared/lib";
import type { DashboardQuizDto } from "@/shared/services";

export interface QuizCardProps {
  quiz: DashboardQuizDto;
}

const EMPTY_VALUE = "—";

export const QuizCard = ({ quiz }: QuizCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const statusLabel = t(QUIZ_STATUS_LABEL_KEY[quiz.status]);
  const category = quiz.category?.trim() || EMPTY_VALUE;
  const description = quiz.description?.trim() || EMPTY_VALUE;
  const canEdit = !quiz.hasRooms && quiz.status !== QuizStatus.Archived;
  const showDuplicate = quiz.hasRooms;
  const showResults = quiz.status !== QuizStatus.Draft;

  const openRoom = async () => {
    setIsCreatingRoom(true);

    try {
      const room = await roomsApi.create({ quizId: quiz.id });
      navigate(buildRoomHostPath(room.id));
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.push(getApiErrorMessage(error, t(LANG_KEYS.pages.room.errors.startFailed)));
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const duplicateQuiz = async () => {
    setIsDuplicating(true);

    try {
      const copy = await quizzesApi.duplicate(quiz.id);
      showSuccessNotification(t(LANG_KEYS.quizzes.notifications.duplicated));
      navigate(buildQuizEditPath(copy.id));
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.push(getApiErrorMessage(error, t(LANG_KEYS.quizzes.notifications.duplicateFailed)));
    } finally {
      setIsDuplicating(false);
    }
  };

  const renderSecondaryActions = () => {
    if (quiz.status === QuizStatus.Draft) {
      if (canEdit) {
        return (
          <Button variant="default" onClick={() => navigate(buildQuizEditPath(quiz.id))}>
            {t(LANG_KEYS.quizzes.actions.continue)}
          </Button>
        );
      }

      if (showDuplicate) {
        return (
          <Button variant="default" loading={isDuplicating} onClick={() => void duplicateQuiz()}>
            {t(LANG_KEYS.quizzes.actions.duplicate)}
          </Button>
        );
      }

      return null;
    }

    return (
      <Group gap="xs">
        {canEdit ? (
          <Button variant="default" onClick={() => navigate(buildQuizEditPath(quiz.id))}>
            {t(
              quiz.status === QuizStatus.Published
                ? LANG_KEYS.quizzes.actions.edit
                : LANG_KEYS.quizzes.actions.continue,
            )}
          </Button>
        ) : null}
        {showDuplicate ? (
          <Button variant="default" loading={isDuplicating} onClick={() => void duplicateQuiz()}>
            {t(LANG_KEYS.quizzes.actions.duplicate)}
          </Button>
        ) : null}
        {!canEdit && !showDuplicate && quiz.status === QuizStatus.Archived ? (
          <Button variant="default" disabled>
            {t(LANG_KEYS.quizzes.actions.edit)}
          </Button>
        ) : null}
        {showResults ? (
          <Button variant="subtle" onClick={() => navigate(buildQuizResultsPath(quiz.id))}>
            {t(LANG_KEYS.quizzes.actions.results)}
          </Button>
        ) : null}
      </Group>
    );
  };

  const renderPrimaryAction = () => {
    if (quiz.status === QuizStatus.Draft) {
      return <Button disabled>{t(LANG_KEYS.quizzes.actions.start)}</Button>;
    }

    if (quiz.status === QuizStatus.Published) {
      return (
        <Button loading={isCreatingRoom} onClick={() => void openRoom()}>
          {t(LANG_KEYS.quizzes.actions.start)}
        </Button>
      );
    }

    return <Button disabled>{t(LANG_KEYS.quizzes.actions.start)}</Button>;
  };

  return (
    <Card radius="md" withBorder padding={0}>
      <Stack gap="md" p="lg" flex={1}>
        <Group justify="space-between" align="flex-start">
          <Badge color="indigo" variant="light">
            {category}
          </Badge>
          <Badge color={QUIZ_STATUS_COLOR[quiz.status]} variant="light">
            {statusLabel}
          </Badge>
        </Group>

        <Stack gap={6}>
          <Title order={4}>{quiz.title}</Title>
          <Text size="sm" c="dimmed" lineClamp={3}>
            {description}
          </Text>
        </Stack>

        <Group gap="lg" mt="auto">
          <Text size="sm">
            {t(LANG_KEYS.quizzes.meta.questions, { count: quiz.questionsCount })}
          </Text>
          <Text size="sm">
            {t(LANG_KEYS.quizzes.meta.minutes, { count: quiz.durationMinutes })}
          </Text>
        </Group>
      </Stack>

      <Group justify="space-between" p="md" bg="#fafbff" style={{ borderTop: "1px solid #edf0f7" }}>
        {renderSecondaryActions()}
        {renderPrimaryAction()}
      </Group>
    </Card>
  );
};
