import { Paper, Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

import { quizCreateStore } from "../../model/quiz-create.store";

export const ReviewStep = observer(() => {
  const { t } = useTranslation();
  const { draft } = quizCreateStore;

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
          {draft.category ? <Text size="sm">{draft.category}</Text> : null}
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
            <Text key={question.clientId} size="sm" c="dimmed">
              Q{index + 1}: {question.text || t(LANG_KEYS.pages.quizCreate.questions.emptyPreview)}
            </Text>
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
