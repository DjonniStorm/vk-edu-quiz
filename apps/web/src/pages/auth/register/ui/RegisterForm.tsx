import { Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { registerUserSchema } from "@quiz/shared";
import { observer } from "mobx-react-lite";
import { useNavigate, useSearchParams } from "react-router";
import type { z } from "zod";

import { resolveReturnUrl } from "@/app/routes";
import { userStore } from "@/entities/user";
import { AUTH_SCOPE, loaderStore } from "@/shared/api";

type RegisterFormValues = z.infer<typeof registerUserSchema>;

export const RegisterForm = observer(() => {
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
        <TextInput label="Name" placeholder="Alex O." {...form.getInputProps("name")} />
        <TextInput label="Email" placeholder="user@example.com" {...form.getInputProps("email")} />
        <PasswordInput label="Password" placeholder="Password" {...form.getInputProps("password")} />

        <Button type="submit" loading={loaderStore.isScopeActive(AUTH_SCOPE)} fullWidth>
          Create account
        </Button>
      </Stack>
    </form>
  );
});
