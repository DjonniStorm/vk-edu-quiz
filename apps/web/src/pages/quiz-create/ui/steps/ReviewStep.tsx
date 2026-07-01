import { Group, Paper, Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { getQuizCategoryLabel } from "@/features/quiz-card/model/quiz-category.ui";
import { QuizImage } from "@/shared/ui/QuizImage";

import { quizCreateStore } from "../../model/quiz-create.store";

export const ReviewStep = observer(() => {
  const { t } = useTranslation();
  const { draft } = quizCreateStore;
  const categoryLabel = getQuizCategoryLabel(draft.category);

  const boolLabel = (value: boolean) =>
    value ? t(LANG_KEYS.pages.quizCreate.review.enabled) : t(LANG_KEYS.pages.quizCreate.review.disabled);

  return (
    <Stack gap="md">
      <Title order={4}>{t(LANG_KEYS.pages.quizCreate.review.title)}</Title>

      <Paper withBorder p="md" radius="md">
        <Stack gap="xs">
          <Text fw={700}>{t(LANG_KEYS.pages.quizCreate.review.basicInfo)}</Text>
          <Text>{draft.title || "—"}</Text>
          {draft.description ? <Text c="dimmed">{draft.description}</Text> : null}
          {categoryLabel ? <Text size="sm">{categoryLabel}</Text> : null}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Stack gap="xs">
          <Text fw={700}>{t(LANG_KEYS.pages.quizCreate.review.questions)}</Text>
          <Text>
            {t(LANG_KEYS.pages.quizCreate.review.questionsCount, {
              count: draft.questions.length,
            })}
          </Text>
          {draft.questions.map((question, index) => (
            <Group key={question.clientId} align="flex-start" gap="sm" wrap="nowrap">
              {question.imageUrl.trim() ? (
                <QuizImage
                  imageUrl={question.imageUrl}
                  alt={question.text || question.clientId}
                  maxHeight={64}
                />
              ) : null}
              <Text size="sm" c="dimmed">
                Q{index + 1}: {question.text || t(LANG_KEYS.pages.quizCreate.questions.emptyPreview)}
              </Text>
            </Group>
          ))}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Stack gap="xs">
          <Text fw={700}>{t(LANG_KEYS.pages.quizCreate.review.rules)}</Text>
          <Text size="sm">
            {t(LANG_KEYS.pages.quizCreate.rules.showLeaderboard)}:{" "}
            {boolLabel(draft.showLeaderboardAfterQuestion)}
          </Text>
          <Text size="sm">
            {t(LANG_KEYS.pages.quizCreate.rules.allowLateJoin)}: {boolLabel(draft.allowLateJoin)}
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
});
