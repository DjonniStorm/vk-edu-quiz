import { ActionIcon, Box, Group, Paper, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { AnswerMode } from "@quiz/shared";

import { quizCreateStore } from "../../model/quiz-create.store";
import type { DraftQuestion } from "../../model/quiz-create.types";

interface QuestionListItemProps {
  question: DraftQuestion;
  index: number;
  isActive: boolean;
}

export const QuestionListItem = observer(({ question, index, isActive }: QuestionListItemProps) => {
  const { t } = useTranslation();

  const modeLabel =
    question.answerMode === AnswerMode.Single
      ? t(LANG_KEYS.pages.quizCreate.questions.answerModeLabels.single)
      : t(LANG_KEYS.pages.quizCreate.questions.answerModeLabels.multiple);

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      onClick={() => quizCreateStore.selectQuestion(question.clientId)}
      style={{
        cursor: "pointer",
        borderLeft: isActive ? "3px solid #1c4ed8" : "3px solid transparent",
        background: isActive ? "#f8faff" : "white",
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Q{index + 1} • {modeLabel}
          </Text>
          <Text size="sm" lineClamp={2} mt={4}>
            {question.text || t(LANG_KEYS.pages.quizCreate.questions.emptyPreview)}
          </Text>
        </Box>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={(event) => {
            event.stopPropagation();
            quizCreateStore.removeQuestion(question.clientId);
          }}
          disabled={quizCreateStore.draft.questions.length <= 1}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Paper>
  );
});

interface QuestionListPanelProps {
  onAddQuestion: () => void;
}

export const QuestionListPanel = observer(({ onAddQuestion }: QuestionListPanelProps) => {
  const { t } = useTranslation();
  const { draft, selectedQuestionClientId } = quizCreateStore;

  return (
    <Stack gap="sm" h="100%">
      <Group justify="space-between">
        <Text fw={700}>
          {t(LANG_KEYS.pages.quizCreate.questions.listTitle, { count: draft.questions.length })}
        </Text>
        <ActionIcon variant="light" onClick={onAddQuestion}>
          <IconPlus size={16} />
        </ActionIcon>
      </Group>

      <Stack gap="xs" style={{ flex: 1, overflowY: "auto" }}>
        {draft.questions.map((question, index) => (
          <QuestionListItem
            key={question.clientId}
            question={question}
            index={index}
            isActive={question.clientId === selectedQuestionClientId}
          />
        ))}
      </Stack>

      <UnstyledButton
        onClick={onAddQuestion}
        style={{
          border: "1px dashed #cbd5e1",
          borderRadius: 8,
          padding: "12px",
          textAlign: "center",
        }}
      >
        <Group justify="center" gap="xs">
          <IconPlus size={16} />
          <Text size="sm" fw={600}>
            {t(LANG_KEYS.pages.quizCreate.questions.addQuestion)}
          </Text>
        </Group>
      </UnstyledButton>
    </Stack>
  );
});
