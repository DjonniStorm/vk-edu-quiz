import { Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { LiveQuestionDto } from "@quiz/shared";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { QuizImage } from "@/shared/ui/QuizImage";

import { AnswerOptionsGrid } from "./AnswerOptionsGrid";
import { RoomTimer } from "./RoomTimer";

export interface QuestionViewProps {
  question: LiveQuestionDto;
  current: number;
  total: number;
  selectedOptionIds: string[];
  readonly?: boolean;
  respondentsByOption?: Map<string, string[]>;
  correctOptionIds?: string[] | null;
  showSubmit?: boolean;
  isSubmitting?: boolean;
  submitted?: boolean;
  resultText?: string;
  onToggle?: (optionId: string) => void;
  onSubmit?: () => void;
}

export const QuestionView = ({
  question,
  current,
  total,
  selectedOptionIds,
  readonly = false,
  respondentsByOption,
  correctOptionIds = null,
  showSubmit = false,
  isSubmitting = false,
  submitted = false,
  resultText,
  onToggle,
  onSubmit,
}: QuestionViewProps) => {
  const { t } = useTranslation();

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Badge variant="light">
          {total > 0
            ? t(LANG_KEYS.pages.room.play.questionProgress, { current, total })
            : t(LANG_KEYS.pages.room.play.questionNumber, { current })}
        </Badge>
        <RoomTimer endsAt={question.endsAt} />
      </Group>

      <Paper withBorder radius="md" p="xl">
        <Stack gap="lg">
          <QuizImage imageUrl={question.imageUrl} alt={question.text} />
          <Title order={3}>{question.text}</Title>
          <AnswerOptionsGrid
            question={question}
            selectedOptionIds={selectedOptionIds}
            readonly={readonly || submitted}
            respondentsByOption={respondentsByOption}
            correctOptionIds={correctOptionIds}
            onToggle={onToggle}
          />
        </Stack>
      </Paper>

      {submitted && resultText ? (
        <Paper withBorder radius="md" p="md" bg="#f8fafc">
          <Stack gap={4}>
            <Text fw={600}>{t(LANG_KEYS.pages.room.play.submittedTitle)}</Text>
            <Text size="sm">{resultText}</Text>
          </Stack>
        </Paper>
      ) : null}

      {showSubmit && !submitted ? (
        <Button
          loading={isSubmitting}
          disabled={selectedOptionIds.length === 0}
          onClick={onSubmit}
        >
          {t(LANG_KEYS.pages.room.play.submit)}
        </Button>
      ) : null}
    </Stack>
  );
};
