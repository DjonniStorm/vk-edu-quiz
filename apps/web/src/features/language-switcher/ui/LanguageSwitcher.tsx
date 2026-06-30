import { SegmentedControl, Stack, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import {
  changeLanguage,
  LANG_KEYS,
  supportedLanguages,
  type SupportedLanguage,
} from "@/app/i18n";

const isSupportedLanguage = (language: string): language is SupportedLanguage =>
  supportedLanguages.includes(language as SupportedLanguage);

export const LanguageSwitcher = observer(() => {
  const { t, i18n } = useTranslation();
  const currentLanguage = isSupportedLanguage(i18n.language) ? i18n.language : supportedLanguages[0];

  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>
        {t(LANG_KEYS.layout.language.label)}
      </Text>
      <SegmentedControl
        value={currentLanguage}
        onChange={(value) => {
          if (isSupportedLanguage(value)) {
            void changeLanguage(value);
          }
        }}
        data={supportedLanguages.map((language) => ({
          value: language,
          label: t(LANG_KEYS.layout.language[language]),
        }))}
      />
    </Stack>
  );
});
