import { afterAll, afterEach, describe, expect, it } from "vitest";

import {
  deleteTestUsersByEmail,
  disconnectTestPrismaClient,
  getTestPrismaClient,
} from "../../../core/testing/test-db";
import { createTestUser } from "../../../core/testing/test-users";
import { AnswerMode, QuizStatus } from "../../../generated/prisma/enums";
import { QuizServiceImpl } from "../../quizzes/quizzes.service";
import { InMemoryRealtimeGateway } from "../../realtime/realtime.gateway";
import { RoomServiceImpl } from "../../rooms/rooms.service";
import { HistoryServiceImpl } from "../history.service";

const createdEmails: string[] = [];
const createdRoomServices: RoomServiceImpl[] = [];

const createHistoryService = () => new HistoryServiceImpl(getTestPrismaClient());
const createQuizService = () => new QuizServiceImpl(getTestPrismaClient());
const createRoomService = () => {
  const service = new RoomServiceImpl(getTestPrismaClient(), new InMemoryRealtimeGateway());

  createdRoomServices.push(service);

  return service;
};

const createOrganizer = async (prefix: string) => {
  const user = await createTestUser(prefix);

  createdEmails.push(user.email);

  return user;
};

const createParticipant = async (prefix: string) => {
  const user = await createTestUser(prefix);

  createdEmails.push(user.email);

  return user;
};

const createQuiz = async (ownerId: string, title = "Исторический квиз") => {
  const quiz = await createQuizService().createQuiz(ownerId, {
    title,
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
  });

  return createQuizService().updateQuiz(ownerId, quiz.id, { status: QuizStatus.PUBLISHED });
};

const createFinishedRoom = async () => {
  const organizer = await createOrganizer("history-owner");
  const participant = await createParticipant("history-participant");
  const quiz = await createQuiz(organizer.id);
  const roomService = createRoomService();
  const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });
  const roomParticipant = await roomService.joinRoom(room.id, {
    userId: participant.id,
    displayName: "Участник",
  });

  await roomService.startRoom(organizer.id, room.id);
  await roomService.submitAnswer(room.id, {
    roomParticipantId: roomParticipant.id,
    questionId: quiz.questions[0]!.id,
    answerOptionIds: [quiz.questions[0]!.answerOptions[0]!.id],
    answerTimeMs: 1500,
  });
  await roomService.finishRoom(organizer.id, room.id);

  return {
    organizer,
    participant,
    quiz,
    room,
    roomParticipant,
  };
};

afterEach(async () => {
  for (const service of createdRoomServices) {
    service.dispose();
  }

  createdRoomServices.length = 0;
  await deleteTestUsersByEmail(createdEmails);
  createdEmails.length = 0;
});

afterAll(async () => {
  await disconnectTestPrismaClient();
});

describe("HistoryServiceImpl", () => {
  it("возвращает историю завершенных квизов участника", async () => {
    const { participant, quiz, room, roomParticipant } = await createFinishedRoom();
    const historyService = createHistoryService();

    const history = await historyService.listParticipantHistory(participant.id);

    expect(history).toMatchObject({
      total: 1,
      limit: 20,
      offset: 0,
    });
    expect(history.items).toEqual([
      {
        roomId: room.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: 10,
        correctAnswersCount: 1,
        finishedAt: expect.any(String),
      },
    ]);
    expect(history.items[0]!.roomId).not.toBe(roomParticipant.id);
  });

  it("не добавляет незавершенные комнаты в историю", async () => {
    const organizer = await createOrganizer("history-active-owner");
    const participant = await createParticipant("history-active-participant");
    const quiz = await createQuiz(organizer.id, "Активный квиз");
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });

    await roomService.joinRoom(room.id, {
      userId: participant.id,
      displayName: "Участник",
    });

    const history = await createHistoryService().listParticipantHistory(participant.id);

    expect(history.total).toBe(0);
    expect(history.items).toEqual([]);
  });

  it("возвращает историю проведенных комнат организатора", async () => {
    const { organizer, quiz, room } = await createFinishedRoom();

    const history = await createHistoryService().listOrganizerHistory(organizer.id, {
      limit: 5,
      offset: 0,
    });

    expect(history).toMatchObject({
      total: 1,
      limit: 5,
      offset: 0,
    });
    expect(history.items).toEqual([
      expect.objectContaining({
        roomId: room.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        participantsCount: 1,
        startedAt: expect.any(String),
        finishedAt: expect.any(String),
      }),
    ]);
  });

  it("возвращает агрегированную статистику организатора", async () => {
    const { organizer } = await createFinishedRoom();

    const summary = await createHistoryService().getOrganizerSummary(organizer.id);

    expect(summary).toEqual({
      completedSessions: 1,
      totalParticipants: 1,
      averageScore: 10,
    });
  });

  it("возвращает нулевую статистику для организатора без завершенных комнат", async () => {
    const organizer = await createOrganizer("history-summary-empty");

    const summary = await createHistoryService().getOrganizerSummary(organizer.id);

    expect(summary).toEqual({
      completedSessions: 0,
      totalParticipants: 0,
      averageScore: 0,
    });
  });

  it("возвращает результаты комнаты только ее организатору", async () => {
    const { organizer, quiz, room, roomParticipant } = await createFinishedRoom();
    const stranger = await createOrganizer("history-stranger");
    const historyService = createHistoryService();

    const results = await historyService.getRoomResults(organizer.id, room.id);
    const strangerResults = await historyService.getRoomResults(stranger.id, room.id);

    expect(results).toEqual({
      roomId: room.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      leaderboard: [
        {
          roomParticipantId: roomParticipant.id,
          displayName: "history-participant user",
          score: 10,
          correctAnswersCount: 1,
          totalAnswerTimeMs: 1500,
        },
      ],
    });
    expect(strangerResults).toBeNull();
  });
});
