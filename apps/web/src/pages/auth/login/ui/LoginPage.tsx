import { ROUTES } from "@/app/routes";
import { AuthLayout } from "@/widgets/auth-layout";

import { LoginForm } from "./LoginForm";

export const LoginPage = () => {
  return (
    <AuthLayout
      title="Log in"
      subtitle="Use your account to open the organizer dashboard."
      footerText="No account yet?"
      footerLinkText="Create one"
      footerLinkTo={ROUTES.register}
    >
      <LoginForm />
    </AuthLayout>
  );
};
