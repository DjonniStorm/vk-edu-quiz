import { Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { loginUserSchema } from "@quiz/shared";
import { observer } from "mobx-react-lite";
import { useNavigate, useSearchParams } from "react-router";
import type { z } from "zod";

import { resolveReturnUrl } from "@/app/routes";
import { userStore } from "@/entities/user";
import { AUTH_SCOPE, loaderStore } from "@/shared/api";

type LoginFormValues = z.infer<typeof loginUserSchema>;

export const LoginForm = observer(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: zodResolver(loginUserSchema),
  });

  const handleSubmit = async (values: LoginFormValues) => {
    const isSuccess = await userStore.login(values);

    if (isSuccess) {
      navigate(resolveReturnUrl(searchParams), { replace: true });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput label="Email" placeholder="user@example.com" {...form.getInputProps("email")} />
        <PasswordInput label="Password" placeholder="Password" {...form.getInputProps("password")} />

        <Button type="submit" loading={loaderStore.isScopeActive(AUTH_SCOPE)} fullWidth>
          Log in
        </Button>
      </Stack>
    </form>
  );
});
