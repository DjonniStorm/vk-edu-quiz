import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";

import type { DashboardQuizDto, DashboardQuizStatus } from "@/shared/services";

export interface QuizCardProps {
  quiz: DashboardQuizDto;
}

const statusLabel: Record<DashboardQuizStatus, string> = {
  active: "Active",
  draft: "Draft",
  published: "Ready",
};

const statusColor: Record<DashboardQuizStatus, string> = {
  active: "blue",
  draft: "yellow",
  published: "green",
};

export const QuizCard = ({ quiz }: QuizCardProps) => {
  return (
    <Card radius="md" withBorder padding={0}>
      <Stack gap="md" p="lg" flex={1}>
        <Group justify="space-between" align="flex-start">
          <Badge color="indigo" variant="light">
            {quiz.category}
          </Badge>
          <Badge color={statusColor[quiz.status]} variant="light">
            {statusLabel[quiz.status]}
          </Badge>
        </Group>

        <Stack gap={6}>
          <Title order={4}>{quiz.title}</Title>
          <Text size="sm" c="dimmed" lineClamp={3}>
            {quiz.description}
          </Text>
        </Stack>

        <Group gap="lg" mt="auto">
          <Text size="sm">{quiz.questionsCount} questions</Text>
          <Text size="sm">{quiz.durationMinutes} min</Text>
        </Group>
      </Stack>

      <Group justify="space-between" p="md" bg="#fafbff" style={{ borderTop: "1px solid #edf0f7" }}>
        {quiz.status === "active" ? (
          <>
            <Button color="red" variant="subtle">
              Finish
            </Button>
            <Button>Room</Button>
          </>
        ) : quiz.status === "draft" ? (
          <>
            <Button variant="default">Continue</Button>
            <Button disabled>Start</Button>
          </>
        ) : (
          <>
            <Group gap="xs">
              <Button variant="default">Edit</Button>
              <Button variant="subtle">Results</Button>
            </Group>
            <Button>Start</Button>
          </>
        )}
      </Group>
    </Card>
  );
};
