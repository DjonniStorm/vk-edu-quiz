import { afterAll, afterEach, describe, expect, it } from "vitest";

import { createApp } from "../../../app";
import { getEnv } from "../../../config/env";
import {
  deleteTestUsersByEmail,
  disconnectTestPrismaClient,
} from "../../../core/testing/test-db";
import { createTestEmail } from "../../../core/testing/test-ids";
import { AnswerMode } from "../../../generated/prisma/enums";

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
      name: `${prefix} user`,
    }),
  );
  const body = await response.json();

  return body.tokens.accessToken as string;
};

const createFinishedRoomByHttp = async () => {
  const organizerToken = await registerUser("history-route-owner");
  const participantToken = await registerUser("history-route-participant");

  const createQuizResponse = await app.handle(
    jsonRequest(
      "POST",
      "/quizzes",
      {
        title: "HTTP history quiz",
        questions: [
          {
            text: "Сколько будет 2 + 2?",
            answerMode: AnswerMode.SINGLE,
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
      organizerToken,
    ),
  );
  const quiz = await createQuizResponse.json();

  const createRoomResponse = await app.handle(
    jsonRequest("POST", "/rooms", { quizId: quiz.id }, organizerToken),
  );
  const room = await createRoomResponse.json();

  const joinResponse = await app.handle(
    jsonRequest(
      "POST",
      `/rooms/${room.id}/join`,
      { displayName: "HTTP участник" },
      participantToken,
    ),
  );
  const roomParticipant = await joinResponse.json();

  await app.handle(jsonRequest("POST", `/rooms/${room.id}/start`, undefined, organizerToken));

  await app.handle(
    jsonRequest("POST", `/rooms/${room.id}/answers`, {
      roomParticipantId: roomParticipant.id,
      questionId: quiz.questions[0].id,
      answerOptionIds: [quiz.questions[0].answerOptions[0].id],
      answerTimeMs: 900,
    }),
  );

  await app.handle(jsonRequest("POST", `/rooms/${room.id}/finish`, undefined, organizerToken));

  return {
    organizerToken,
    participantToken,
    quiz,
    room,
    roomParticipant,
  };
};

afterEach(async () => {
  await deleteTestUsersByEmail(createdEmails);
  createdEmails.length = 0;
});

afterAll(async () => {
  await disconnectTestPrismaClient();
});

describe("history routes", () => {
  it("требует авторизацию для истории участника", async () => {
    const response = await app.handle(jsonRequest("GET", "/history/participant"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("возвращает только свои данные для каждого эндпоинта истории", async () => {
    const organizerToken = await registerUser("history-route-organizer-only");
    const participantToken = await registerUser("history-route-participant-only");

    const organizerParticipantHistoryResponse = await app.handle(
      jsonRequest("GET", "/history/participant", undefined, organizerToken),
    );
    const participantOrganizerHistoryResponse = await app.handle(
      jsonRequest("GET", "/history/organizer", undefined, participantToken),
    );
    const organizerParticipantHistory = await organizerParticipantHistoryResponse.json();
    const participantOrganizerHistory = await participantOrganizerHistoryResponse.json();

    expect(organizerParticipantHistoryResponse.status).toBe(200);
    expect(organizerParticipantHistory.items).toEqual([]);
    expect(participantOrganizerHistoryResponse.status).toBe(200);
    expect(participantOrganizerHistory.items).toEqual([]);
  });

  it("возвращает историю участника, историю организатора и результаты комнаты", async () => {
    const { organizerToken, participantToken, quiz, room, roomParticipant } =
      await createFinishedRoomByHttp();

    const participantHistoryResponse = await app.handle(
      jsonRequest("GET", "/history/participant", undefined, participantToken),
    );
    const participantHistory = await participantHistoryResponse.json();

    expect(participantHistoryResponse.status).toBe(200);
    expect(participantHistory.items).toEqual([
      expect.objectContaining({
        roomId: room.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: 10,
        correctAnswersCount: 1,
      }),
    ]);

    const organizerHistoryResponse = await app.handle(
      jsonRequest("GET", "/history/organizer?limit=10&offset=0", undefined, organizerToken),
    );
    const organizerHistory = await organizerHistoryResponse.json();

    expect(organizerHistoryResponse.status).toBe(200);
    expect(organizerHistory.items).toEqual([
      expect.objectContaining({
        roomId: room.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        participantsCount: 1,
      }),
    ]);

    const resultsResponse = await app.handle(
      jsonRequest("GET", `/history/rooms/${room.id}/results`, undefined, organizerToken),
    );
    const results = await resultsResponse.json();

    expect(resultsResponse.status).toBe(200);
    expect(results).toEqual({
      roomId: room.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      leaderboard: [
        {
          roomParticipantId: roomParticipant.id,
          displayName: "history-route-participant user",
          score: 10,
          correctAnswersCount: 1,
          totalAnswerTimeMs: 900,
        },
      ],
    });
  });
});
