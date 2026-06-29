import { ROUTES } from "@/app/routes";
import { AuthLayout } from "@/widgets/auth-layout";

import { RegisterForm } from "./RegisterForm";

export const RegisterPage = () => {
  return (
    <AuthLayout
      title="Create account"
      subtitle="Sign up to create quizzes and run live sessions."
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo={ROUTES.login}
    >
      <RegisterForm />
    </AuthLayout>
  );
};
