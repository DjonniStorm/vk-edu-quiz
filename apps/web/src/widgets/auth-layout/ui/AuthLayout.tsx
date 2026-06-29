import { Anchor, Box, Center, Paper, Stack, Text, Title } from "@mantine/core";
import type { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router";

export interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export const AuthLayout = ({
  children,
  footerLinkText,
  footerLinkTo,
  footerText,
  subtitle,
  title,
}: AuthLayoutProps) => {
  const location = useLocation();
  const footerLinkHref = location.search ? `${footerLinkTo}${location.search}` : footerLinkTo;

  return (
    <Center mih="100vh" bg="#f6f8fc" p="md">
      <Box w="100%" maw={420}>
        <Paper withBorder radius="md" p="xl">
          <Stack gap="lg">
            <Stack gap={4}>
              <Title order={2}>{title}</Title>
              <Text c="dimmed" size="sm">
                {subtitle}
              </Text>
            </Stack>

            {children}

            <Text ta="center" size="sm" c="dimmed">
              {footerText}{" "}
              <Anchor component={Link} to={footerLinkHref} fw={600}>
                {footerLinkText}
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Box>
    </Center>
  );
};
