import { Group, Paper, SimpleGrid, Text, UnstyledButton } from "@mantine/core";
import type { LiveQuestionDto } from "@quiz/shared";

export interface AnswerOptionsGridProps {
  question: LiveQuestionDto;
  selectedOptionIds: string[];
  readonly?: boolean;
  respondentsByOption?: Map<string, string[]>;
  correctOptionIds?: string[] | null;
  onToggle?: (optionId: string) => void;
}

const optionLabels = ["A", "B", "C", "D", "E", "F"];

export const AnswerOptionsGrid = ({
  question,
  selectedOptionIds,
  readonly = false,
  respondentsByOption,
  correctOptionIds = null,
  onToggle,
}: AnswerOptionsGridProps) => {
  const sortedOptions = [...question.answerOptions].sort(
    (left, right) => left.orderIndex - right.orderIndex,
  );
  const showReveal = correctOptionIds !== null && correctOptionIds.length > 0;

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {sortedOptions.map((option, index) => {
        const isSelected = selectedOptionIds.includes(option.id);
        const isCorrect = showReveal && correctOptionIds.includes(option.id);
        const respondents = respondentsByOption?.get(option.id) ?? [];
        const label = optionLabels[index] ?? String(index + 1);

        let borderColor: string | undefined;
        let background = "#fff";

        if (isCorrect) {
          borderColor = "#16a34a";
          background = "#f0fdf4";
        } else if (showReveal) {
          borderColor = "#e5e7eb";
          background = "#f9fafb";
        } else if (isSelected) {
          borderColor = "#3b82f6";
          background = "#eff6ff";
        }

        const content = (
          <Paper
            withBorder
            radius="md"
            p="lg"
            style={{
              borderColor,
              background,
              cursor: readonly ? "default" : "pointer",
              minHeight: 96,
            }}
          >
            <Text size="xs" c="dimmed" fw={700} mb={6}>
              {label}
            </Text>
            <Text size="sm">{option.text}</Text>
            {respondents.length > 0 ? (
              <Group gap={6} mt="sm">
                {respondents.map((name) => (
                  <Text key={name} size="xs" c="dimmed">
                    {name}
                  </Text>
                ))}
              </Group>
            ) : null}
          </Paper>
        );

        if (readonly) {
          return <div key={option.id}>{content}</div>;
        }

        return (
          <UnstyledButton
            key={option.id}
            onClick={() => onToggle?.(option.id)}
            aria-pressed={isSelected}
            aria-label={`${label}. ${option.text}`}
          >
            {content}
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );
};
