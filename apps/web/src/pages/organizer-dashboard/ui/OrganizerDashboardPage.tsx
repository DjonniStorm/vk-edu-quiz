import { Center, Loader, SimpleGrid, Stack } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { QuizCard } from "@/features/quiz-card";
import { AppLayout } from "@/widgets/app-layout";
import { DashboardStats } from "@/widgets/dashboard-stats";
import { organizerDashboardStore } from "../model/organizer-dashboard.store";
import { GroupHeader } from "./GroupHeader";

export const OrganizerDashboardPage = observer(() => {
  const { t } = useTranslation();

  useEffect(() => {
    void organizerDashboardStore.loadDashboard();
  }, []);

  return (
    <AppLayout title={t(LANG_KEYS.pages.organizerDashboard.title)}>
      {organizerDashboardStore.isLoading ? (
        <Center h={320}>
          <Loader />
        </Center>
      ) : (
        <Stack gap="xl">
          <DashboardStats stats={organizerDashboardStore.stats} />

          <Stack gap="md">
            <GroupHeader />
            <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg">
              {organizerDashboardStore.quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </SimpleGrid>
          </Stack>
        </Stack>
      )}
    </AppLayout>
  );
});
