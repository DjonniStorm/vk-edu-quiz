import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

import { ErrorPage } from "./ErrorPage";

export const NotFoundPage = () => {
  const { t } = useTranslation();

  return <ErrorPage message={t(LANG_KEYS.pages.error.notFound)} />;
};
