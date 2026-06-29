import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./en";
import { ru } from "./ru";

export const defaultLanguage = "ru";

export const supportedLanguages = ["ru", "en"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const languageStorageKey = "vk-edu-quiz-language";
const resources = {
  ru: { translation: ru },
  en: { translation: en },
} as const;

const isSupportedLanguage = (language: string): language is SupportedLanguage =>
  supportedLanguages.includes(language as SupportedLanguage);

const normalizeLanguage = (language: string | null | undefined): SupportedLanguage | null => {
  if (!language) {
    return null;
  }

  const normalizedLanguage = language.split("-")[0]?.toLowerCase();

  return normalizedLanguage && isSupportedLanguage(normalizedLanguage)
    ? normalizedLanguage
    : null;
};

export const getInitialLanguage = (): SupportedLanguage => {
  const storedLanguage = normalizeLanguage(localStorage.getItem(languageStorageKey));

  if (storedLanguage) {
    return storedLanguage;
  }

  return normalizeLanguage(navigator.language) ?? defaultLanguage;
};

export const changeLanguage = async (language: SupportedLanguage) => {
  localStorage.setItem(languageStorageKey, language);

  await i18n.changeLanguage(language);
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    returnNull: false,
    interpolation: {
      escapeValue: false,
    },
  });

export { LANG_KEYS, DASHBOARD_STAT_KEYS } from "./keys";
export default i18n;
