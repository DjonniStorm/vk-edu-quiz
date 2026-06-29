import {
  AppShell,
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { observer } from "mobx-react-lite";
import { UserRole } from "@quiz/shared";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { userStore } from "@/entities/user";

export interface AppLayoutProps extends PropsWithChildren {
  title: string;
}

export const AppLayout = observer(({ title, children }: AppLayoutProps) => {
  const { t } = useTranslation();
  const currentUser = userStore.currentUser;
  const roleLabel =
    currentUser?.role === UserRole.Admin ? t(LANG_KEYS.roles.admin) : t(LANG_KEYS.roles.user);
  const navItems = [
    { label: t(LANG_KEYS.layout.app.nav.dashboard), marker: "01" },
    { label: t(LANG_KEYS.layout.app.nav.myQuizzes), marker: "02" },
    { label: t(LANG_KEYS.layout.app.nav.createQuiz), marker: "03" },
    { label: t(LANG_KEYS.layout.app.nav.activeRooms), marker: "04" },
    { label: t(LANG_KEYS.layout.app.nav.results), marker: "05" },
  ];
  const userInitials = currentUser?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: "sm" }}
      padding="xl"
      styles={{
        main: { background: "#f8f9fc" },
        header: { borderBottom: "1px solid #e5e7ef" },
        navbar: { borderRight: "1px solid #e5e7ef" },
      }}
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="xl">
          <Title order={4}>{title}</Title>
          <Group gap="md">
            <Button variant="subtle" color="gray" px="xs">
              {t(LANG_KEYS.layout.app.bell)}
            </Button>
            <Button>{t(LANG_KEYS.layout.app.createQuiz)}</Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <Stack h="100%" gap={0}>
          <Group px="lg" h={64} gap="sm">
            <Box
              bg="blue.6"
              c="white"
              fw={700}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                display: "grid",
                placeItems: "center",
              }}
            >
              Q
            </Box>
            <Text fw={700}>{t(LANG_KEYS.layout.app.brand)}</Text>
          </Group>

          <Stack gap={4} px="sm" py="lg">
            {navItems.map((item, index) => (
              <UnstyledButton
                key={item.marker}
                px="md"
                py="sm"
                style={{
                  borderRadius: 6,
                  background: index === 0 ? "#e9efff" : "transparent",
                  color: index === 0 ? "#1c4ed8" : "#1f2937",
                }}
              >
                <Group gap="sm">
                  <Text size="xs" fw={700}>
                    {item.marker}
                  </Text>
                  <Text size="sm" fw={index === 0 ? 700 : 500}>
                    {item.label}
                  </Text>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>

          <Box mt="auto">
            <Divider />
            <Group p="lg" justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <Avatar radius="xl" color="gray">
                  {userInitials || "U"}
                </Avatar>
                <Box>
                  <Text size="sm" fw={700} lineClamp={1}>
                    {currentUser?.name ?? t(LANG_KEYS.layout.app.fallbackUser)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {roleLabel}
                  </Text>
                </Box>
              </Group>
              <Button variant="subtle" color="gray" px="xs">
                {t(LANG_KEYS.layout.app.exit)}
              </Button>
            </Group>
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
});
