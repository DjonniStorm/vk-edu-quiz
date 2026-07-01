import { Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { registerUserSchema } from "@quiz/shared";
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

type RegisterFormValues = z.infer<typeof registerUserSchema>;

export const RegisterForm = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    initialValues: {
      email: "",
      password: "",
      name: "",
    },
    validate: localizedZodResolver(registerUserSchema),
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    setApiError(null);

    const result = await userStore.register(values);

    if (result.success) {
      navigate(resolveReturnUrl(searchParams), { replace: true });
      return;
    }

    if (result.message) {
      setApiError(result.message);
    }
  };

  const clearApiErrorOnChange = (fieldName: keyof RegisterFormValues) => {
    const inputProps = form.getInputProps(fieldName);

    return {
      ...inputProps,
      onChange: (event: unknown) => {
        setApiError(null);
        inputProps.onChange(event);
      },
    };
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label={t(LANG_KEYS.auth.fields.name)}
          placeholder={t(LANG_KEYS.auth.placeholders.name)}
          {...clearApiErrorOnChange("name")}
        />
        <TextInput
          label={t(LANG_KEYS.auth.fields.email)}
          placeholder={t(LANG_KEYS.auth.placeholders.email)}
          {...clearApiErrorOnChange("email")}
        />
        <PasswordInput
          label={t(LANG_KEYS.auth.fields.password)}
          placeholder={t(LANG_KEYS.auth.placeholders.password)}
          {...clearApiErrorOnChange("password")}
        />

        {apiError ? (
          <Text c="red" size="sm">
            {apiError}
          </Text>
        ) : null}

        <Button type="submit" loading={loaderStore.isScopeActive(AUTH_SCOPE)} fullWidth>
          {t(LANG_KEYS.pages.register.submit)}
        </Button>
      </Stack>
    </form>
  );
});
