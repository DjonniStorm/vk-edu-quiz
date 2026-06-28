import { afterAll, afterEach, describe, expect, it } from "vitest";

import { ConflictError, UnauthorizedError } from "../../../core/errors";
import {
  deleteTestUsersByEmail,
  disconnectTestPrismaClient,
  getTestPrismaClient,
} from "../../../core/testing/test-db";
import { createTestEmail } from "../../../core/testing/test-ids";
import { UserRole } from "../../../generated/prisma/enums";
import { JwtAuthTokenService } from "../../../plugins/auth-token.service";
import { AuthServiceImpl } from "../auth.service";
import { BcryptPasswordHasher } from "../password-hasher";

const createdEmails: string[] = [];

const createAuthService = () =>
  new AuthServiceImpl(
    getTestPrismaClient(),
    new BcryptPasswordHasher(4),
    new JwtAuthTokenService("test-secret-change-me", 60),
  );

afterEach(async () => {
  await deleteTestUsersByEmail(createdEmails);
  createdEmails.length = 0;
});

afterAll(async () => {
  await disconnectTestPrismaClient();
});

describe("AuthServiceImpl", () => {
  it("регистрирует пользователя, хеширует пароль и возвращает access token", async () => {
    const authService = createAuthService();
    const email = createTestEmail("register");
    const password = "password-123";

    createdEmails.push(email);

    const result = await authService.register({
      email: `  ${email.toUpperCase()}  `,
      password,
      name: "  Test User  ",
      role: UserRole.ORGANIZER,
    });

    expect(result.user).toMatchObject({
      email,
      name: "Test User",
      role: UserRole.ORGANIZER,
    });
    expect(result.tokens.accessToken).toEqual(expect.any(String));

    const dbUser = await getTestPrismaClient().user.findUnique({
      where: { email },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser?.passwordHash).not.toBe(password);
    expect(await new BcryptPasswordHasher(4).verify(password, dbUser!.passwordHash)).toBe(true);
  });

  it("отклоняет повторную регистрацию с тем же email", async () => {
    const authService = createAuthService();
    const email = createTestEmail("duplicate");

    createdEmails.push(email);

    await authService.register({
      email,
      password: "password-123",
      name: "Test User",
      role: UserRole.PARTICIPANT,
    });

    await expect(
      authService.register({
        email: email.toUpperCase(),
        password: "password-456",
        name: "Another User",
        role: UserRole.PARTICIPANT,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("логинит с верными данными и отклоняет неверный пароль", async () => {
    const authService = createAuthService();
    const email = createTestEmail("login");
    const password = "password-123";

    createdEmails.push(email);

    const registered = await authService.register({
      email,
      password,
      name: "Login User",
      role: UserRole.PARTICIPANT,
    });

    const loginResult = await authService.login({
      email: email.toUpperCase(),
      password,
    });

    expect(loginResult.user.id).toBe(registered.user.id);
    expect(loginResult.tokens.accessToken).toEqual(expect.any(String));

    await expect(
      authService.login({
        email,
        password: "wrong-password",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
