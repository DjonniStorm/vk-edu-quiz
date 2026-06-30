import { Alert, Button, Center, Code, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { ROUTES } from "@/app/routes";

import { ErrorIllustration } from "./ErrorIllustration";

export interface ErrorPageProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorPage = ({ message, onRetry }: ErrorPageProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Center mih="100vh" bg="#f6f8fc" p="md">
      <Paper withBorder radius="md" p="xl" maw={520} w="100%">
        <Stack gap="lg" align="center">
          <ErrorIllustration />

          <Stack gap="xs" align="center" ta="center">
            <Title order={2}>{t(LANG_KEYS.pages.error.title)}</Title>
            <Text c="dimmed" size="sm" maw={360}>
              {t(LANG_KEYS.pages.error.subtitle)}
            </Text>
          </Stack>

          {message ? (
            <Alert color="red" variant="light" w="100%" title={t(LANG_KEYS.common.error)}>
              <Code block fz="xs">
                {message}
              </Code>
            </Alert>
          ) : null}

          <Group justify="center" gap="sm">
            {onRetry ? (
              <Button variant="light" onClick={onRetry}>
                {t(LANG_KEYS.common.retry)}
              </Button>
            ) : null}
            <Button onClick={() => navigate(ROUTES.main, { replace: true })}>
              {t(LANG_KEYS.pages.error.backToMain)}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Center>
  );
};
