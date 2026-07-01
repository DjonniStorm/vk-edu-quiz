import { Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { loginUserSchema } from "@quiz/shared";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import type { z } from "zod";

import { LANG_KEYS } from "@/app/i18n";
import { resolveReturnUrl } from "@/app/routes";
import { userStore } from "@/entities/user";
import { AUTH_SCOPE, loaderStore } from "@/shared/api";
import { localizedZodResolver } from "@/shared/lib";

type LoginFormValues = z.infer<typeof loginUserSchema>;

export const LoginForm = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: localizedZodResolver(loginUserSchema),
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setApiError(null);

    const result = await userStore.login(values);

    if (result.success) {
      navigate(resolveReturnUrl(searchParams), { replace: true });
      return;
    }

    if (result.message) {
      setApiError(result.message);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label={t(LANG_KEYS.auth.fields.email)}
          placeholder={t(LANG_KEYS.auth.placeholders.email)}
          {...form.getInputProps("email")}
          onChange={(event) => {
            setApiError(null);
            form.getInputProps("email").onChange(event);
          }}
        />
        <PasswordInput
          label={t(LANG_KEYS.auth.fields.password)}
          placeholder={t(LANG_KEYS.auth.placeholders.password)}
          {...form.getInputProps("password")}
          onChange={(event) => {
            setApiError(null);
            form.getInputProps("password").onChange(event);
          }}
        />

        {apiError ? (
          <Text c="red" size="sm">
            {apiError}
          </Text>
        ) : null}

        <Button type="submit" loading={loaderStore.isScopeActive(AUTH_SCOPE)} fullWidth>
          {t(LANG_KEYS.pages.login.submit)}
        </Button>
      </Stack>
    </form>
  );
});
