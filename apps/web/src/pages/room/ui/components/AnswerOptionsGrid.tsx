import { Paper, SimpleGrid, Text, UnstyledButton } from "@mantine/core";
import type { LiveQuestionDto } from "@quiz/shared";

export interface AnswerOptionsGridProps {
  question: LiveQuestionDto;
  selectedOptionIds: string[];
  readonly?: boolean;
  onToggle?: (optionId: string) => void;
}

const optionLabels = ["A", "B", "C", "D", "E", "F"];

export const AnswerOptionsGrid = ({
  question,
  selectedOptionIds,
  readonly = false,
  onToggle,
}: AnswerOptionsGridProps) => {
  const sortedOptions = [...question.answerOptions].sort(
    (left, right) => left.orderIndex - right.orderIndex,
  );

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {sortedOptions.map((option, index) => {
        const isSelected = selectedOptionIds.includes(option.id);
        const label = optionLabels[index] ?? String(index + 1);

        const content = (
          <Paper
            withBorder
            radius="md"
            p="lg"
            style={{
              borderColor: isSelected ? "#3b82f6" : undefined,
              background: isSelected ? "#eff6ff" : "#fff",
              cursor: readonly ? "default" : "pointer",
              minHeight: 96,
            }}
          >
            <Text size="xs" c="dimmed" fw={700} mb={6}>
              {label}
            </Text>
            <Text size="sm">{option.text}</Text>
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
