import { afterAll, afterEach, describe, expect, it } from "vitest";

import { createApp } from "../../../app";
import { getEnv } from "../../../config/env";
import {
  deleteTestUsersByEmail,
  disconnectTestPrismaClient,
} from "../../../core/testing/test-db";
import { createTestEmail } from "../../../core/testing/test-ids";
import { UserRole } from "../../../generated/prisma/enums";

const createdEmails: string[] = [];
const app = createApp(getEnv());

const jsonRequest = (path: string, body?: unknown, token?: string) =>
  new Request(`http://localhost${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

afterEach(async () => {
  await deleteTestUsersByEmail(createdEmails);
  createdEmails.length = 0;
});

afterAll(async () => {
  await disconnectTestPrismaClient();
});

describe("auth routes", () => {
  it("регистрирует пользователя через HTTP", async () => {
    const email = createTestEmail("route-register");
    createdEmails.push(email);

    const response = await app.handle(
      jsonRequest("/auth/register", {
        email,
        password: "password-123",
        name: "Route User",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({
      email,
      name: "Route User",
      role: UserRole.User,
    });
    expect(body.tokens.accessToken).toEqual(expect.any(String));
  });

  it("возвращает 409 при повторной регистрации email", async () => {
    const email = createTestEmail("route-duplicate");
    createdEmails.push(email);

    await app.handle(
      jsonRequest("/auth/register", {
        email,
        password: "password-123",
        name: "Route User",
      }),
    );

    const response = await app.handle(
      jsonRequest("/auth/register", {
        email,
        password: "password-456",
        name: "Another User",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("CONFLICT");
  });

  it("логинит пользователя и возвращает access token", async () => {
    const email = createTestEmail("route-login");
    createdEmails.push(email);

    await app.handle(
      jsonRequest("/auth/register", {
        email,
        password: "password-123",
        name: "Route User",
      }),
    );

    const response = await app.handle(
      jsonRequest("/auth/login", {
        email: email.toUpperCase(),
        password: "password-123",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.email).toBe(email);
    expect(body.tokens.accessToken).toEqual(expect.any(String));
  });

  it("возвращает текущего пользователя по access token", async () => {
    const email = createTestEmail("route-me");
    createdEmails.push(email);

    const registerResponse = await app.handle(
      jsonRequest("/auth/register", {
        email,
        password: "password-123",
        name: "Route User",
      }),
    );
    const registerBody = await registerResponse.json();

    const response = await app.handle(jsonRequest("/auth/me", undefined, registerBody.tokens.accessToken));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({
      email,
      role: UserRole.User,
    });
  });

  it("возвращает 401 для /auth/me без token", async () => {
    const response = await app.handle(jsonRequest("/auth/me"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
