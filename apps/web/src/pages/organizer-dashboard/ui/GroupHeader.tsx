import { Anchor, Center, Stack, Text, Title } from "@mantine/core";

export const GroupHeader = () => {
  return (
    <Center component="section" style={{ justifyContent: "space-between" }}>
      <Stack gap={0}>
        <Title order={3}>My quizzes</Title>
        <Text c="dimmed" size="sm">
          Recent quizzes and live rooms
        </Text>
      </Stack>
      <Anchor size="sm" fw={600}>
        View all
      </Anchor>
    </Center>
  );
};
