import {
  Accordion,
  Alert,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { LeaderboardList } from "@/pages/room/ui/components/LeaderboardList";
import { AppLayout } from "@/widgets/app-layout";

import { quizResultsStore } from "../model/quiz-results.store";

const formatSessionDate = (value: string | null) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
};

export const QuizResultsPage = observer(() => {
  const { t } = useTranslation();
  const { quizId } = useParams<{ quizId: string }>();
  const { sessions, isLoading, loadError, quizTitle } = quizResultsStore;

  useEffect(() => {
    if (!quizId) {
      return;
    }

    void quizResultsStore.load(quizId);

    return () => {
      quizResultsStore.reset();
    };
  }, [quizId]);

  const pageTitle = quizTitle
    ? t(LANG_KEYS.pages.quizResults.titleWithQuiz, { title: quizTitle })
    : t(LANG_KEYS.pages.quizResults.title);

  if (isLoading) {
    return (
      <AppLayout title={pageTitle}>
        <Center h={320}>
          <Loader />
        </Center>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout title={pageTitle}>
        <Alert color="red" title={loadError} />
      </AppLayout>
    );
  }

  return (
    <AppLayout title={pageTitle}>
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={2}>{pageTitle}</Title>
          <Text c="dimmed">{t(LANG_KEYS.pages.quizResults.subtitle)}</Text>
        </Stack>

        {sessions.length === 0 ? (
          <Text c="dimmed" ta="center">
            {t(LANG_KEYS.pages.quizResults.empty)}
          </Text>
        ) : (
          <Accordion variant="separated">
            {sessions.map((session) => {
              const results = quizResultsStore.getSessionResults(session.roomId);
              const isSessionLoading = quizResultsStore.isSessionLoading(session.roomId);

              return (
                <Accordion.Item key={session.roomId} value={session.roomId}>
                  <Accordion.Control
                    onClick={() => {
                      void quizResultsStore.loadSessionResults(session.roomId);
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap" pr="md">
                      <Stack gap={2}>
                        <Text fw={600}>{formatSessionDate(session.finishedAt)}</Text>
                        <Text size="sm" c="dimmed">
                          {t(LANG_KEYS.pages.quizResults.sessionMeta, {
                            count: session.participantsCount,
                          })}
                        </Text>
                      </Stack>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {isSessionLoading ? (
                      <Center py="md">
                        <Loader size="sm" />
                      </Center>
                    ) : results ? (
                      <LeaderboardList items={results.leaderboard} />
                    ) : null}
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}
      </Stack>
    </AppLayout>
  );
});
