import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import type { DashboardQuizDto, DashboardQuizStatus } from "@/shared/services";

export interface QuizCardProps {
  quiz: DashboardQuizDto;
}

const statusColor: Record<DashboardQuizStatus, string> = {
  active: "blue",
  draft: "yellow",
  published: "green",
};

export const QuizCard = ({ quiz }: QuizCardProps) => {
  const { t } = useTranslation();
  const statusLabel = t(LANG_KEYS.quizzes.status[quiz.status]);

  return (
    <Card radius="md" withBorder padding={0}>
      <Stack gap="md" p="lg" flex={1}>
        <Group justify="space-between" align="flex-start">
          <Badge color="indigo" variant="light">
            {quiz.category}
          </Badge>
          <Badge color={statusColor[quiz.status]} variant="light">
            {statusLabel}
          </Badge>
        </Group>

        <Stack gap={6}>
          <Title order={4}>{quiz.title}</Title>
          <Text size="sm" c="dimmed" lineClamp={3}>
            {quiz.description}
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
        {quiz.status === "active" ? (
          <>
            <Button color="red" variant="subtle">
              {t(LANG_KEYS.quizzes.actions.finish)}
            </Button>
            <Button>{t(LANG_KEYS.quizzes.actions.room)}</Button>
          </>
        ) : quiz.status === "draft" ? (
          <>
            <Button variant="default">{t(LANG_KEYS.quizzes.actions.continue)}</Button>
            <Button disabled>{t(LANG_KEYS.quizzes.actions.start)}</Button>
          </>
        ) : (
          <>
            <Group gap="xs">
              <Button variant="default">{t(LANG_KEYS.quizzes.actions.edit)}</Button>
              <Button variant="subtle">{t(LANG_KEYS.quizzes.actions.results)}</Button>
            </Group>
            <Button>{t(LANG_KEYS.quizzes.actions.start)}</Button>
          </>
        )}
      </Group>
    </Card>
  );
};
