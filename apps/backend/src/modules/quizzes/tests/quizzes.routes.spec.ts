import { afterAll, afterEach, describe, expect, it } from "vitest";

import { createApp } from "../../../app";
import { getEnv } from "../../../config/env";
import {
  deleteTestUsersByEmail,
  disconnectTestPrismaClient,
} from "../../../core/testing/test-db";
import { createTestEmail } from "../../../core/testing/test-ids";

const app = createApp(getEnv());
const createdEmails: string[] = [];

const jsonRequest = (
  method: string,
  path: string,
  body?: unknown,
  token?: string,
) =>
  new Request(`http://localhost${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const registerUser = async (prefix: string) => {
  const email = createTestEmail(prefix);
  createdEmails.push(email);

  const response = await app.handle(
    jsonRequest("POST", "/auth/register", {
      email,
      password: "password-123",
      name: "Quiz User",
    }),
  );
  const body = await response.json();

  return {
    email,
    token: body.tokens.accessToken as string,
  };
};

afterEach(async () => {
  await deleteTestUsersByEmail(createdEmails);
  createdEmails.length = 0;
});

afterAll(async () => {
  await disconnectTestPrismaClient();
});

describe("quiz routes", () => {
  it("требует авторизацию для списка квизов", async () => {
    const response = await app.handle(jsonRequest("GET", "/quizzes"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("позволяет любому User управлять своими квизами", async () => {
    const { token } = await registerUser("quiz-routes-user");

    const response = await app.handle(jsonRequest("GET", "/quizzes", undefined, token));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("создаёт, получает, обновляет и удаляет квиз через HTTP", async () => {
    const { token } = await registerUser("quiz-routes-owner");

    const createResponse = await app.handle(
      jsonRequest(
        "POST",
        "/quizzes",
        {
          title: "HTTP квиз",
          description: "Описание",
          questions: [
            {
              text: "Сколько будет 2 + 2?",
              answerMode: "SINGLE",
              orderIndex: 0,
              timeLimitSec: 30,
              points: 10,
              answerOptions: [
                { text: "4", isCorrect: true, orderIndex: 0 },
                { text: "5", isCorrect: false, orderIndex: 1 },
              ],
            },
          ],
        },
        token,
      ),
    );
    const createdQuiz = await createResponse.json();

    expect(createResponse.status).toBe(200);
    expect(createdQuiz.title).toBe("HTTP квиз");
    expect(createdQuiz.questionsCount).toBe(1);

    const listResponse = await app.handle(jsonRequest("GET", "/quizzes", undefined, token));
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.items.map((quiz: { id: string }) => quiz.id)).toEqual([createdQuiz.id]);

    const getResponse = await app.handle(
      jsonRequest("GET", `/quizzes/${createdQuiz.id}`, undefined, token),
    );
    const getBody = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(getBody.id).toBe(createdQuiz.id);

    const updateResponse = await app.handle(
      jsonRequest(
        "PATCH",
        `/quizzes/${createdQuiz.id}`,
        { title: "Обновлённый HTTP квиз" },
        token,
      ),
    );
    const updatedQuiz = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updatedQuiz.title).toBe("Обновлённый HTTP квиз");

    const deleteResponse = await app.handle(
      jsonRequest("DELETE", `/quizzes/${createdQuiz.id}`, undefined, token),
    );
    const deleteBody = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(deleteBody).toEqual({ ok: true });
  });

  it("возвращает ошибку валидации для некорректного payload", async () => {
    const { token } = await registerUser("quiz-routes-validation");

    const response = await app.handle(
      jsonRequest("POST", "/quizzes", { title: "" }, token),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
