import { Anchor, Box, Button, Container, Group, Image, List, Stack, Text, Title } from "@mantine/core";
import { IconBrandGithub, IconBrandTelegram } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { ROUTES } from "@/app/routes";
import { OG_IMAGE_PATH } from "@/app/seo/og-image";
import { usePageHead } from "@/app/seo";

import { LANDING_CONTACTS } from "../model/contacts";

export const LandingPage = () => {
  const { t } = useTranslation();

  usePageHead({
    title: t(LANG_KEYS.pages.landing.title),
    description: t(LANG_KEYS.pages.landing.metaDescription),
  });

  return (
    <Box mih="100vh" bg="#f8f9fc">
      <Container size="sm" py={80}>
        <Stack gap="xl" align="center" ta="center">
          <Image src={OG_IMAGE_PATH} alt={t(LANG_KEYS.app.name)} radius="md" maw={640} />

          <Stack gap="sm" maw={640}>
            <Title order={1}>{t(LANG_KEYS.pages.landing.title)}</Title>
            <Text c="dimmed" size="lg">
              {t(LANG_KEYS.pages.landing.subtitle)}
            </Text>
          </Stack>

          <List spacing="xs" size="sm" ta="left">
            <List.Item>{t(LANG_KEYS.pages.landing.features.scoring)}</List.Item>
            <List.Item>{t(LANG_KEYS.pages.landing.features.leaderboard)}</List.Item>
            <List.Item>{t(LANG_KEYS.pages.landing.features.history)}</List.Item>
          </List>

          <Group>
            <Button component={Link} to={ROUTES.login} size="md">
              {t(LANG_KEYS.pages.landing.login)}
            </Button>
            <Button component={Link} to={ROUTES.register} size="md" variant="default">
              {t(LANG_KEYS.pages.landing.register)}
            </Button>
          </Group>
        </Stack>
      </Container>

      <Box component="footer" py="lg" style={{ borderTop: "1px solid #e5e7ef" }}>
        <Container size="sm">
          <Group justify="center" gap="lg">
            <Text size="sm" c="dimmed">
              {t(LANG_KEYS.pages.landing.contacts.title)}:
            </Text>
            <Anchor href={LANDING_CONTACTS.githubUrl} target="_blank" rel="noreferrer" size="sm" c="dimmed">
              <Group gap={4} wrap="nowrap">
                <IconBrandGithub size={16} />
                {t(LANG_KEYS.pages.landing.contacts.github)}
              </Group>
            </Anchor>
            <Anchor href={LANDING_CONTACTS.telegramUrl} target="_blank" rel="noreferrer" size="sm" c="dimmed">
              <Group gap={4} wrap="nowrap">
                <IconBrandTelegram size={16} />
                {t(LANG_KEYS.pages.landing.contacts.telegram)}
              </Group>
            </Anchor>
          </Group>
        </Container>
      </Box>
    </Box>
  );
};
