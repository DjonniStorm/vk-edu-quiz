import { Box, Center, Loader, Pagination, SimpleGrid, Stack, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { usePageHead } from "@/app/seo";
import { QuizCard } from "@/features/quiz-card";
import { AppLayout } from "@/widgets/app-layout";
import { scrollToSection, sectionAnchorStyle } from "@/widgets/app-layout/lib/scroll-to-section";
import { DashboardStats } from "@/widgets/dashboard-stats";
import { JoinRoomPanel } from "@/widgets/join-room";
import { organizerDashboardStore } from "../model/organizer-dashboard.store";
import { GroupHeader } from "./GroupHeader";
import { QuizzesToolbar } from "./QuizzesToolbar";

export const OrganizerDashboardPage = observer(() => {
  const { t } = useTranslation();
  const location = useLocation();

  usePageHead({
    title: t(LANG_KEYS.pages.organizerDashboard.title),
    description: t(LANG_KEYS.pages.organizerDashboard.metaDescription),
  });

  useEffect(() => {
    void organizerDashboardStore.loadDashboard();
  }, []);

  useEffect(() => {
    if (organizerDashboardStore.isLoading) {
      return;
    }

    const sectionId = location.hash.replace(/^#/, "");

    if (!sectionId) {
      return;
    }

    requestAnimationFrame(() => {
      scrollToSection(sectionId);
    });
  }, [location.hash, organizerDashboardStore.isLoading]);

  const emptyMessage = organizerDashboardStore.hasActiveFilters
    ? t(LANG_KEYS.quizzes.emptyFiltered)
    : t(LANG_KEYS.quizzes.empty);

  return (
    <AppLayout title={t(LANG_KEYS.pages.organizerDashboard.title)}>
      {organizerDashboardStore.isLoading ? (
        <Center h={320}>
          <Loader />
        </Center>
      ) : (
        <Stack gap="xl">
          <JoinRoomPanel />
          <Box id="dashboard" component="section" style={sectionAnchorStyle}>
            <DashboardStats stats={organizerDashboardStore.stats} />
          </Box>

          <Stack gap="md">
            <GroupHeader />
            <QuizzesToolbar />

            <Box pos="relative">
              {organizerDashboardStore.isQuizzesLoading ? (
                <Center pos="absolute" inset={0} style={{ zIndex: 1 }}>
                  <Loader />
                </Center>
              ) : null}

              <SimpleGrid
                cols={{ base: 1, md: 2, xl: 3 }}
                spacing="lg"
                style={{
                  opacity: organizerDashboardStore.isQuizzesLoading ? 0.45 : 1,
                  pointerEvents: organizerDashboardStore.isQuizzesLoading ? "none" : undefined,
                }}
              >
                {organizerDashboardStore.quizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onArchived={() => organizerDashboardStore.loadQuizzes()}
                  />
                ))}
              </SimpleGrid>
            </Box>

            {organizerDashboardStore.quizzes.length === 0 &&
            !organizerDashboardStore.isQuizzesLoading ? (
              <Text c="dimmed" ta="center">
                {emptyMessage}
              </Text>
            ) : null}

            {organizerDashboardStore.totalPages > 1 ? (
              <Center>
                <Pagination
                  total={organizerDashboardStore.totalPages}
                  value={organizerDashboardStore.page}
                  onChange={(page) => organizerDashboardStore.setPage(page)}
                />
              </Center>
            ) : null}
          </Stack>
        </Stack>
      )}
    </AppLayout>
  );
});
