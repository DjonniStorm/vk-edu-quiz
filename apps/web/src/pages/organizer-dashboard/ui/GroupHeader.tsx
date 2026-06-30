import { Anchor, Center, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { sectionAnchorStyle } from "@/widgets/app-layout/lib/scroll-to-section";

export const GroupHeader = () => {
  const { t } = useTranslation();

  return (
    <Center
      id="my-quizzes"
      component="section"
      style={{ justifyContent: "space-between", ...sectionAnchorStyle }}
    >
      <Stack gap={0}>
        <Title order={3}>{t(LANG_KEYS.pages.organizerDashboard.groupTitle)}</Title>
        <Text c="dimmed" size="sm">
          {t(LANG_KEYS.pages.organizerDashboard.groupSubtitle)}
        </Text>
      </Stack>
      <Anchor size="sm" fw={600}>
        {t(LANG_KEYS.pages.organizerDashboard.viewAll)}
      </Anchor>
    </Center>
  );
};
