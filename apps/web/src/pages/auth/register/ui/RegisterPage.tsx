import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { usePageHead } from "@/app/seo";
import { ROUTES } from "@/app/routes";
import { AuthLayout } from "@/widgets/auth-layout";

import { RegisterForm } from "./RegisterForm";

export const RegisterPage = () => {
  const { t } = useTranslation();

  usePageHead({
    title: t(LANG_KEYS.pages.register.title),
    description: t(LANG_KEYS.pages.register.subtitle),
  });

  return (
    <AuthLayout
      title={t(LANG_KEYS.pages.register.title)}
      subtitle={t(LANG_KEYS.pages.register.subtitle)}
      footerText={t(LANG_KEYS.pages.register.footerText)}
      footerLinkText={t(LANG_KEYS.pages.register.footerLinkText)}
      footerLinkTo={ROUTES.login}
    >
      <RegisterForm />
    </AuthLayout>
  );
};
