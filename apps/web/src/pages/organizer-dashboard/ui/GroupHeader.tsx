import { Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { sectionAnchorStyle } from "@/widgets/app-layout/lib/scroll-to-section";

export const GroupHeader = () => {
  const { t } = useTranslation();

  return (
    <Stack
      id="my-quizzes"
      component="section"
      gap={0}
      style={sectionAnchorStyle}
    >
      <Title order={3}>{t(LANG_KEYS.pages.organizerDashboard.groupTitle)}</Title>
      <Text c="dimmed" size="sm">
        {t(LANG_KEYS.pages.organizerDashboard.groupSubtitle)}
      </Text>
    </Stack>
  );
};
