import { Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { registerUserSchema } from "@quiz/shared";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import type { z } from "zod";

import { LANG_KEYS } from "@/app/i18n";
import { resolveReturnUrl } from "@/app/routes";
import { userStore } from "@/entities/user";
import { AUTH_SCOPE, loaderStore } from "@/shared/api";

type RegisterFormValues = z.infer<typeof registerUserSchema>;

export const RegisterForm = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const form = useForm<RegisterFormValues>({
    initialValues: {
      email: "",
      password: "",
      name: "",
    },
    validate: zodResolver(registerUserSchema),
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    const isSuccess = await userStore.register(values);

    if (isSuccess) {
      navigate(resolveReturnUrl(searchParams), { replace: true });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label={t(LANG_KEYS.auth.fields.name)}
          placeholder={t(LANG_KEYS.auth.placeholders.name)}
          {...form.getInputProps("name")}
        />
        <TextInput
          label={t(LANG_KEYS.auth.fields.email)}
          placeholder={t(LANG_KEYS.auth.placeholders.email)}
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label={t(LANG_KEYS.auth.fields.password)}
          placeholder={t(LANG_KEYS.auth.placeholders.password)}
          {...form.getInputProps("password")}
        />

        <Button type="submit" loading={loaderStore.isScopeActive(AUTH_SCOPE)} fullWidth>
          {t(LANG_KEYS.pages.register.submit)}
        </Button>
      </Stack>
    </form>
  );
});
