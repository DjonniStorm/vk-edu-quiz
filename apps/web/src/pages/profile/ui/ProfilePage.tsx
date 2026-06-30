import {
  Alert,
  Avatar,
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { UserRole } from "@quiz/shared";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { PROFILE_HISTORY_SECTION_ID } from "@/app/routes";
import { usePageHead } from "@/app/seo";
import { userStore } from "@/entities/user";
import { LanguageSwitcher } from "@/features/language-switcher";
import { AppLayout } from "@/widgets/app-layout";
import { scrollToSection, sectionAnchorStyle } from "@/widgets/app-layout/lib/scroll-to-section";

import { profileStore } from "../model/profile.store";
import { EmptyHistoryIllustration } from "./EmptyHistoryIllustration";
import { ParticipationHistoryTable } from "./ParticipationHistoryTable";

export const ProfilePage = observer(() => {
  const { t } = useTranslation();
  const location = useLocation();
  const currentUser = userStore.currentUser;
  const { historyItems, isLoading, loadError, page, totalPages } = profileStore;

  usePageHead({
    title: t(LANG_KEYS.pages.profile.title),
    description: t(LANG_KEYS.pages.profile.metaDescription),
  });

  useEffect(() => {
    void profileStore.load();

    return () => {
      profileStore.reset();
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const sectionId = location.hash.replace(/^#/, "");

    if (sectionId !== PROFILE_HISTORY_SECTION_ID) {
      return;
    }

    requestAnimationFrame(() => {
      scrollToSection(sectionId);
    });
  }, [isLoading, location.hash]);

  const pageTitle = t(LANG_KEYS.pages.profile.title);
  const roleLabel =
    currentUser?.role === UserRole.Admin ? t(LANG_KEYS.roles.admin) : t(LANG_KEYS.roles.user);
  const userInitials = currentUser?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (isLoading && historyItems.length === 0) {
    return (
      <AppLayout title={pageTitle}>
        <Center h={320}>
          <Loader />
        </Center>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={pageTitle}>
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={2}>{pageTitle}</Title>
          <Text c="dimmed">{t(LANG_KEYS.pages.profile.metaDescription)}</Text>
        </Stack>

        <Paper withBorder radius="md" p="lg">
          <Stack gap="md">
            <Text fw={600}>{t(LANG_KEYS.pages.profile.sections.profile)}</Text>
            <Group gap="md" wrap="nowrap">
              <Avatar radius="xl" color="blue" size="lg">
                {userInitials || "U"}
              </Avatar>
              <Stack gap={2}>
                <Text fw={600}>{currentUser?.name ?? t(LANG_KEYS.layout.app.fallbackUser)}</Text>
                <Text size="sm" c="dimmed">
                  {currentUser?.email}
                </Text>
                <Text size="sm" c="dimmed">
                  {roleLabel}
                </Text>
              </Stack>
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="lg">
          <Stack gap="md">
            <Text fw={600}>{t(LANG_KEYS.pages.profile.sections.settings)}</Text>
            <LanguageSwitcher />
          </Stack>
        </Paper>

        <Paper
          id={PROFILE_HISTORY_SECTION_ID}
          withBorder
          radius="md"
          p="lg"
          style={sectionAnchorStyle}
        >
          <Stack gap="md">
            <Text fw={600}>{t(LANG_KEYS.pages.profile.sections.history)}</Text>

            {loadError ? <Alert color="red" title={loadError} /> : null}

            {isLoading ? (
              <Center py="md">
                <Loader size="sm" />
              </Center>
            ) : historyItems.length === 0 ? (
              <Stack gap="sm" align="center" py="md">
                <EmptyHistoryIllustration />
                <Text c="dimmed" ta="center">
                  {t(LANG_KEYS.pages.profile.history.empty)}
                </Text>
              </Stack>
            ) : (
              <>
                <ParticipationHistoryTable items={historyItems} />
                {totalPages > 1 ? (
                  <Center>
                    <Pagination
                      total={totalPages}
                      value={page}
                      onChange={(nextPage) => {
                        void profileStore.setPage(nextPage);
                      }}
                    />
                  </Center>
                ) : null}
              </>
            )}
          </Stack>
        </Paper>
      </Stack>
    </AppLayout>
  );
});
