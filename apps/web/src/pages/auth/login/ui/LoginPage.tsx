import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { usePageHead } from "@/app/seo";
import { ROUTES } from "@/app/routes";
import { AuthLayout } from "@/widgets/auth-layout";

import { LoginForm } from "./LoginForm";

export const LoginPage = () => {
  const { t } = useTranslation();

  usePageHead({
    title: t(LANG_KEYS.pages.login.title),
    description: t(LANG_KEYS.pages.login.subtitle),
  });

  return (
    <AuthLayout
      title={t(LANG_KEYS.pages.login.title)}
      subtitle={t(LANG_KEYS.pages.login.subtitle)}
      footerText={t(LANG_KEYS.pages.login.footerText)}
      footerLinkText={t(LANG_KEYS.pages.login.footerLinkText)}
      footerLinkTo={ROUTES.register}
    >
      <LoginForm />
    </AuthLayout>
  );
};
