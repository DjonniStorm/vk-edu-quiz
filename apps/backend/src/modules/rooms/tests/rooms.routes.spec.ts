import { afterAll, afterEach, describe, expect, it } from "vitest";

import { createApp } from "../../../app";
import { getEnv } from "../../../config/env";
import {
  deleteTestUsersByEmail,
  disconnectTestPrismaClient,
} from "../../../core/testing/test-db";
import { createTestEmail } from "../../../core/testing/test-ids";
import { AnswerMode, RoomStatus, UserRole } from "../../../generated/prisma/enums";

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

const registerOrganizer = async () => {
  const email = createTestEmail("room-routes");
  createdEmails.push(email);

  const response = await app.handle(
    jsonRequest("POST", "/auth/register", {
      email,
      password: "password-123",
      name: "Room Owner",
      role: UserRole.ORGANIZER,
    }),
  );
  const body = await response.json();

  return body.tokens.accessToken as string;
};

const registerParticipant = async () => {
  const email = createTestEmail("room-routes-participant");
  createdEmails.push(email);

  const response = await app.handle(
    jsonRequest("POST", "/auth/register", {
      email,
      password: "password-123",
      name: "Room Participant",
      role: UserRole.PARTICIPANT,
    }),
  );
  const body = await response.json();

  return body.tokens.accessToken as string;
};

afterEach(async () => {
  await deleteTestUsersByEmail(createdEmails);
  createdEmails.length = 0;
});

afterAll(async () => {
  await disconnectTestPrismaClient();
});

describe("room routes", () => {
  it("требует авторизацию для создания комнаты", async () => {
    const response = await app.handle(
      jsonRequest("POST", "/rooms", {
        quizId: "00000000-0000-0000-0000-000000000000",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("запрещает участнику создавать комнату", async () => {
    const token = await registerParticipant();

    const response = await app.handle(
      jsonRequest(
        "POST",
        "/rooms",
        { quizId: "00000000-0000-0000-0000-000000000000" },
        token,
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("создает комнату и проводит live-сценарий через HTTP", async () => {
    const token = await registerOrganizer();
    const createQuizResponse = await app.handle(
      jsonRequest(
        "POST",
        "/quizzes",
        {
          title: "HTTP live quiz",
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
            {
              text: "Выбери четные числа",
              answerMode: AnswerMode.MULTIPLE,
              orderIndex: 1,
              timeLimitSec: 45,
              points: 20,
              answerOptions: [
                { text: "2", isCorrect: true, orderIndex: 0 },
                { text: "3", isCorrect: false, orderIndex: 1 },
                { text: "4", isCorrect: true, orderIndex: 2 },
              ],
            },
          ],
        },
        token,
      ),
    );
    const quiz = await createQuizResponse.json();

    const createRoomResponse = await app.handle(
      jsonRequest("POST", "/rooms", { quizId: quiz.id }, token),
    );
    const room = await createRoomResponse.json();

    expect(createRoomResponse.status).toBe(200);
    expect(room).toMatchObject({
      quizId: quiz.id,
      status: RoomStatus.WAITING,
      inviteUrl: `/rooms/${room.id}`,
    });

    const joinResponse = await app.handle(
      jsonRequest("POST", `/rooms/${room.id}/join`, { displayName: "Гость" }),
    );
    const participant = await joinResponse.json();

    expect(joinResponse.status).toBe(200);
    expect(participant.displayName).toBe("Гость");

    const startResponse = await app.handle(
      jsonRequest("POST", `/rooms/${room.id}/start`, undefined, token),
    );
    const firstQuestion = await startResponse.json();

    expect(startResponse.status).toBe(200);
    expect(firstQuestion.id).toBe(quiz.questions[0].id);

    const showResponse = await app.handle(
      jsonRequest(
        "POST",
        `/rooms/${room.id}/questions/show`,
        { questionId: quiz.questions[1].id },
        token,
      ),
    );
    const secondQuestion = await showResponse.json();

    expect(showResponse.status).toBe(200);
    expect(secondQuestion.id).toBe(quiz.questions[1].id);
    expect(secondQuestion.answerOptions[0]).not.toHaveProperty("isCorrect");

    const correctOptionIds = quiz.questions[1].answerOptions
      .filter((option: { isCorrect: boolean }) => option.isCorrect)
      .map((option: { id: string }) => option.id);
    const answerResponse = await app.handle(
      jsonRequest("POST", `/rooms/${room.id}/answers`, {
        roomParticipantId: participant.id,
        questionId: secondQuestion.id,
        answerOptionIds: correctOptionIds,
        answerTimeMs: 1200,
      }),
    );
    const answer = await answerResponse.json();

    expect(answerResponse.status).toBe(200);
    expect(answer).toMatchObject({
      isCorrect: true,
      points: 20,
    });

    const leaderboardResponse = await app.handle(
      jsonRequest("GET", `/rooms/${room.id}/leaderboard`),
    );
    const leaderboard = await leaderboardResponse.json();

    expect(leaderboardResponse.status).toBe(200);
    expect(leaderboard).toEqual([
      expect.objectContaining({
        roomParticipantId: participant.id,
        score: 20,
      }),
    ]);

    const finishResponse = await app.handle(
      jsonRequest("POST", `/rooms/${room.id}/finish`, undefined, token),
    );
    const finalLeaderboard = await finishResponse.json();

    expect(finishResponse.status).toBe(200);
    expect(finalLeaderboard[0]).toMatchObject({
      roomParticipantId: participant.id,
      score: 20,
    });
  });
});
