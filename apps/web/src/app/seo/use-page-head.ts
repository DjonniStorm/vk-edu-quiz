import { useHead } from "@unhead/react";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

import { getSocialImageMeta } from "./og-image";

interface PageHeadOptions {
  title: string;
  description?: string;
}

export const usePageHead = ({ title, description }: PageHeadOptions) => {
  const { t, i18n } = useTranslation();
  const appName = t(LANG_KEYS.app.name);
  const documentTitle = title ? `${title} | ${appName}` : appName;
  const metaDescription = description ?? documentTitle;

  useHead({
    title: documentTitle,
    htmlAttrs: { lang: i18n.language },
    meta: [
      { name: "description", content: metaDescription },
      { property: "og:title", content: documentTitle },
      { property: "og:description", content: metaDescription },
      ...getSocialImageMeta(),
    ],
  });
};
