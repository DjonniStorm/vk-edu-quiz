import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { observer } from "mobx-react-lite";
import { UserRole } from "@quiz/shared";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { PROFILE_HISTORY_SECTION_ID, ROUTES } from "@/app/routes";
import { userStore } from "@/entities/user";

import { navigateToPageSection, navigateToSection } from "../lib/scroll-to-section";

export type AppNavKey = "dashboard" | "myQuizzes" | "joinRoom" | "createQuiz" | "history";

type NavItem =
  | { key: AppNavKey; label: string; kind: "section"; sectionId: string }
  | { key: AppNavKey; label: string; kind: "route"; to: string }
  | {
      key: AppNavKey;
      label: string;
      kind: "pageSection";
      route: string;
      sectionId: string;
    };

export interface AppLayoutProps extends PropsWithChildren {
  title: string;
  activeNav?: AppNavKey;
}

const resolveActiveNav = (
  pathname: string,
  hash: string,
  activeNav: AppNavKey,
): AppNavKey | null => {
  if (pathname === ROUTES.main) {
    if (hash === "#my-quizzes") {
      return "myQuizzes";
    }

    if (hash === "#join-room") {
      return "joinRoom";
    }

    return "dashboard";
  }

  if (pathname === ROUTES.profile) {
    if (hash === `#${PROFILE_HISTORY_SECTION_ID}`) {
      return "history";
    }

    return null;
  }

  return activeNav;
};

export const AppLayout = observer(({ title, children, activeNav = "dashboard" }: AppLayoutProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpened, { toggle: toggleMobileNav, close: closeMobileNav }] = useDisclosure();
  const currentUser = userStore.currentUser;
  const roleLabel =
    currentUser?.role === UserRole.Admin ? t(LANG_KEYS.roles.admin) : t(LANG_KEYS.roles.user);
  const navItems: NavItem[] = [
    {
      key: "dashboard",
      label: t(LANG_KEYS.layout.app.nav.dashboard),
      kind: "section",
      sectionId: "dashboard",
    },
    {
      key: "myQuizzes",
      label: t(LANG_KEYS.layout.app.nav.myQuizzes),
      kind: "section",
      sectionId: "my-quizzes",
    },
    {
      key: "joinRoom",
      label: t(LANG_KEYS.layout.app.nav.joinRoom),
      kind: "section",
      sectionId: "join-room",
    },
    {
      key: "createQuiz",
      label: t(LANG_KEYS.layout.app.nav.createQuiz),
      kind: "route",
      to: ROUTES.quizCreate,
    },
    {
      key: "history",
      label: t(LANG_KEYS.layout.app.nav.history),
      kind: "pageSection",
      route: ROUTES.profile,
      sectionId: PROFILE_HISTORY_SECTION_ID,
    },
  ];
  const currentActiveNav = useMemo(
    () => resolveActiveNav(location.pathname, location.hash, activeNav),
    [location.pathname, location.hash, activeNav],
  );
  const userInitials = currentUser?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSectionClick = (sectionId: string) => {
    navigateToSection(navigate, location.pathname, sectionId);
    closeMobileNav();
  };

  const handlePageSectionClick = (route: string, sectionId: string) => {
    navigateToPageSection(navigate, location.pathname, route, sectionId);
    closeMobileNav();
  };

  const handleLogout = () => {
    userStore.logout();
    navigate(ROUTES.login);
  };

  const navButtonStyle = (isActive: boolean) => ({
    borderRadius: 6,
    background: isActive ? "#e9efff" : "transparent",
    color: isActive ? "#1c4ed8" : "#1f2937",
    textDecoration: "none",
  });

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 272,
        breakpoint: "sm",
        collapsed: { mobile: !mobileNavOpened },
      }}
      padding="xl"
      styles={{
        main: { background: "#f8f9fc" },
        header: { borderBottom: "1px solid #e5e7ef" },
        navbar: { borderRight: "1px solid #e5e7ef" },
      }}
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="xl">
          <Group gap="sm">
            <Burger
              opened={mobileNavOpened}
              onClick={toggleMobileNav}
              hiddenFrom="sm"
              size="sm"
              aria-label={t(LANG_KEYS.layout.app.brand)}
            />
            <Title order={4}>{title}</Title>
          </Group>
          <Group gap="md">
            <Button component={Link} to={ROUTES.quizCreate}>
              {t(LANG_KEYS.layout.app.createQuiz)}
            </Button>
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
            {navItems.map((item) => {
              const isActive = currentActiveNav !== null && item.key === currentActiveNav;

              if (item.kind === "route") {
                return (
                  <UnstyledButton
                    key={item.key}
                    component={Link}
                    to={item.to}
                    px="md"
                    py="sm"
                    style={navButtonStyle(isActive)}
                    onClick={closeMobileNav}
                  >
                    <Text size="sm" fw={isActive ? 700 : 500}>
                      {item.label}
                    </Text>
                  </UnstyledButton>
                );
              }

              if (item.kind === "pageSection") {
                return (
                  <UnstyledButton
                    key={item.key}
                    px="md"
                    py="sm"
                    style={navButtonStyle(isActive)}
                    onClick={() => handlePageSectionClick(item.route, item.sectionId)}
                  >
                    <Text size="sm" fw={isActive ? 700 : 500}>
                      {item.label}
                    </Text>
                  </UnstyledButton>
                );
              }

              return (
                <UnstyledButton
                  key={item.key}
                  px="md"
                  py="sm"
                  style={navButtonStyle(isActive)}
                  onClick={() => handleSectionClick(item.sectionId)}
                >
                  <Text size="sm" fw={isActive ? 700 : 500}>
                    {item.label}
                  </Text>
                </UnstyledButton>
              );
            })}
          </Stack>

          <Box mt="auto">
            <Divider />
            <Stack gap="sm" p="lg">
              <UnstyledButton
                component={Link}
                to={ROUTES.profile}
                onClick={closeMobileNav}
                style={{
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Avatar radius="xl" color="gray">
                    {userInitials || "U"}
                  </Avatar>
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={700} lineClamp={1}>
                      {currentUser?.name ?? t(LANG_KEYS.layout.app.fallbackUser)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {roleLabel}
                    </Text>
                  </Box>
                </Group>
              </UnstyledButton>
              <Button variant="light" color="gray" fullWidth onClick={handleLogout}>
                {t(LANG_KEYS.layout.app.exit)}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
});
