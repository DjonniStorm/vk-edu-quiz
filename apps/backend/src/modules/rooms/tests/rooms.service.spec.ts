import { afterAll, afterEach, describe, expect, it } from "vitest";

import { BadRequestError, ConflictError, NotFoundError } from "../../../core/errors";
import {
  deleteTestUsersByEmail,
  disconnectTestPrismaClient,
  getTestPrismaClient,
} from "../../../core/testing/test-db";
import { createTestUser } from "../../../core/testing/test-users";
import { AnswerMode, ParticipantStatus, RoomStatus, UserRole } from "../../../generated/prisma/enums";
import {
  RealtimeEventType,
  type RealtimeClient,
  type RealtimeConnection,
  type RealtimeEvent,
  type RealtimeGateway,
} from "../../realtime/realtime.interfaces";
import type { QuestionInput } from "../../quizzes/quizzes.interfaces";
import { QuizServiceImpl } from "../../quizzes/quizzes.service";
import { RoomServiceImpl } from "../rooms.service";

const createdEmails: string[] = [];

class CapturingRealtimeGateway implements RealtimeGateway {
  public readonly events: { target: "room" | "organizer" | "participant"; id: string; event: RealtimeEvent }[] = [];

  registerConnection(_connection: RealtimeConnection, _client: RealtimeClient): void {}

  unregisterConnection(_connectionId: string): void {}

  publishToRoom(roomId: string, event: RealtimeEvent): void {
    this.events.push({ target: "room", id: roomId, event });
  }

  publishToOrganizer(roomId: string, event: RealtimeEvent): void {
    this.events.push({ target: "organizer", id: roomId, event });
  }

  publishToParticipant(roomParticipantId: string, event: RealtimeEvent): void {
    this.events.push({ target: "participant", id: roomParticipantId, event });
  }
}

let realtimeGateway: CapturingRealtimeGateway;

const createRoomService = () => {
  realtimeGateway = new CapturingRealtimeGateway();

  return new RoomServiceImpl(getTestPrismaClient(), realtimeGateway);
};
const createQuizService = () => new QuizServiceImpl(getTestPrismaClient());

const createOrganizer = async (prefix: string) => {
  const user = await createTestUser(prefix, UserRole.ORGANIZER);

  createdEmails.push(user.email);

  return user;
};

const createParticipant = async (prefix: string) => {
  const user = await createTestUser(prefix, UserRole.PARTICIPANT);

  createdEmails.push(user.email);

  return user;
};

const createQuizForOwner = async (ownerId: string, allowLateJoin = true) =>
  createQuizService().createQuiz(ownerId, {
    title: "Квиз для комнаты",
    allowLateJoin,
  });

const createSingleQuestion = (orderIndex = 0): QuestionInput => ({
  text: "Сколько будет 2 + 2?",
  answerMode: AnswerMode.SINGLE,
  orderIndex,
  timeLimitSec: 30,
  points: 10,
  answerOptions: [
    { text: "4", isCorrect: true, orderIndex: 0 },
    { text: "5", isCorrect: false, orderIndex: 1 },
  ],
});

const createMultipleQuestion = (orderIndex = 0): QuestionInput => ({
  text: "Выбери чётные числа",
  answerMode: AnswerMode.MULTIPLE,
  orderIndex,
  timeLimitSec: 45,
  points: 20,
  answerOptions: [
    { text: "2", isCorrect: true, orderIndex: 0 },
    { text: "3", isCorrect: false, orderIndex: 1 },
    { text: "4", isCorrect: true, orderIndex: 2 },
  ],
});

const createLiveQuizForOwner = async (ownerId: string) =>
  createQuizService().createQuiz(ownerId, {
    title: "Live квиз",
    questions: [createSingleQuestion(1), createMultipleQuestion(0)],
  });

afterEach(async () => {
  await deleteTestUsersByEmail(createdEmails);
  createdEmails.length = 0;
});

afterAll(async () => {
  await disconnectTestPrismaClient();
});

describe("RoomServiceImpl", () => {
  it("создаёт комнату для своего квиза", async () => {
    const organizer = await createOrganizer("room-owner");
    const quiz = await createQuizForOwner(organizer.id);
    const roomService = createRoomService();

    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });

    expect(room).toMatchObject({
      quizId: quiz.id,
      organizerId: organizer.id,
      status: RoomStatus.WAITING,
      currentQuestionId: null,
      inviteUrl: `/rooms/${room.id}`,
    });
  });

  it("не создаёт комнату для чужого квиза", async () => {
    const organizer = await createOrganizer("room-owner-private");
    const anotherOrganizer = await createOrganizer("room-owner-stranger");
    const quiz = await createQuizForOwner(organizer.id);
    const roomService = createRoomService();

    await expect(
      roomService.createRoom(anotherOrganizer.id, { quizId: quiz.id }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("подключает гостя и авторизованного участника", async () => {
    const organizer = await createOrganizer("room-join-owner");
    const participant = await createParticipant("room-join-participant");
    const quiz = await createQuizForOwner(organizer.id);
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });

    const guest = await roomService.joinRoom(room.id, {
      displayName: "Гость",
    });
    const authorizedParticipant = await roomService.joinRoom(room.id, {
      userId: participant.id,
      displayName: "Участник",
    });

    expect(guest).toMatchObject({
      userId: null,
      displayName: "Гость",
      status: ParticipantStatus.CONNECTED,
    });
    expect(authorizedParticipant).toMatchObject({
      userId: participant.id,
      displayName: "Участник",
      status: ParticipantStatus.CONNECTED,
    });
    expect(
      realtimeGateway.events.filter(
        ({ event }) => event.type === RealtimeEventType.ParticipantJoined,
      ),
    ).toHaveLength(2);
  });

  it("отключает участника от комнаты", async () => {
    const organizer = await createOrganizer("room-leave-owner");
    const quiz = await createQuizForOwner(organizer.id);
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });
    const participant = await roomService.joinRoom(room.id, { displayName: "Участник" });

    await roomService.leaveRoom(participant.id);

    const dbParticipant = await getTestPrismaClient().roomParticipant.findUnique({
      where: { id: participant.id },
    });

    expect(dbParticipant?.status).toBe(ParticipantStatus.DISCONNECTED);
    expect(dbParticipant?.leftAt).toBeInstanceOf(Date);
  });

  it("сортирует лидерборд по баллам и времени ответа", async () => {
    const organizer = await createOrganizer("room-leaderboard-owner");
    const quiz = await createQuizForOwner(organizer.id);
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });
    const slowWinner = await roomService.joinRoom(room.id, { displayName: "Медленный победитель" });
    const fastWinner = await roomService.joinRoom(room.id, { displayName: "Быстрый победитель" });
    const loser = await roomService.joinRoom(room.id, { displayName: "Проигравший" });

    await getTestPrismaClient().roomParticipant.update({
      where: { id: slowWinner.id },
      data: { score: 100, totalAnswerTimeMs: 5000 },
    });
    await getTestPrismaClient().roomParticipant.update({
      where: { id: fastWinner.id },
      data: { score: 100, totalAnswerTimeMs: 2000 },
    });
    await getTestPrismaClient().roomParticipant.update({
      where: { id: loser.id },
      data: { score: 50, totalAnswerTimeMs: 1000 },
    });

    const leaderboard = await roomService.getLeaderboard(room.id);

    expect(leaderboard.map((item) => item.displayName)).toEqual([
      "Быстрый победитель",
      "Медленный победитель",
      "Проигравший",
    ]);
  });

  it("не пускает в активную комнату, если позднее подключение запрещено", async () => {
    const organizer = await createOrganizer("room-late-owner");
    const quiz = await createQuizForOwner(organizer.id, false);
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });

    await getTestPrismaClient().room.update({
      where: { id: room.id },
      data: { status: RoomStatus.ACTIVE },
    });

    await expect(
      roomService.joinRoom(room.id, { displayName: "Поздний участник" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("стартует комнату и выбирает первый вопрос по orderIndex", async () => {
    const organizer = await createOrganizer("room-start-owner");
    const quiz = await createLiveQuizForOwner(organizer.id);
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });

    const liveQuestion = await roomService.startRoom(organizer.id, room.id);

    expect(liveQuestion).toMatchObject({
      id: quiz.questions[0]?.id,
      orderIndex: 0,
      answerMode: AnswerMode.MULTIPLE,
    });
    expect(liveQuestion?.answerOptions[0]).not.toHaveProperty("isCorrect");
    expect(realtimeGateway.events).toContainEqual({
      target: "room",
      id: room.id,
      event: {
        type: RealtimeEventType.RoomStarted,
        roomId: room.id,
        question: liveQuestion,
      },
    });

    const dbRoom = await getTestPrismaClient().room.findUnique({ where: { id: room.id } });

    expect(dbRoom?.status).toBe(RoomStatus.ACTIVE);
    expect(dbRoom?.currentQuestionId).toBe(quiz.questions[0]?.id);
    expect(dbRoom?.startedAt).toBeInstanceOf(Date);
  });

  it("не стартует чужую комнату", async () => {
    const organizer = await createOrganizer("room-start-private-owner");
    const anotherOrganizer = await createOrganizer("room-start-private-stranger");
    const quiz = await createLiveQuizForOwner(organizer.id);
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });

    await expect(roomService.startRoom(anotherOrganizer.id, room.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("не принимает ответ до старта комнаты", async () => {
    const organizer = await createOrganizer("room-answer-before-start");
    const quiz = await createLiveQuizForOwner(organizer.id);
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });
    const participant = await roomService.joinRoom(room.id, { displayName: "Участник" });

    await expect(
      roomService.submitAnswer(room.id, {
        roomParticipantId: participant.id,
        questionId: quiz.questions[0]!.id,
        answerOptionIds: [quiz.questions[0]!.answerOptions[0]!.id],
        answerTimeMs: 1000,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("не принимает ответ на не текущий вопрос", async () => {
    const organizer = await createOrganizer("room-answer-wrong-question");
    const quiz = await createLiveQuizForOwner(organizer.id);
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });
    const participant = await roomService.joinRoom(room.id, { displayName: "Участник" });

    await roomService.startRoom(organizer.id, room.id);

    await expect(
      roomService.submitAnswer(room.id, {
        roomParticipantId: participant.id,
        questionId: quiz.questions[1]!.id,
        answerOptionIds: [quiz.questions[1]!.answerOptions[0]!.id],
        answerTimeMs: 1000,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("начисляет баллы за правильный single choice ответ и запрещает повторный ответ", async () => {
    const organizer = await createOrganizer("room-single-answer");
    const quiz = await createQuizService().createQuiz(organizer.id, {
      title: "Single quiz",
      questions: [createSingleQuestion()],
    });
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });
    const participant = await roomService.joinRoom(room.id, { displayName: "Участник" });

    await roomService.startRoom(organizer.id, room.id);

    const answer = await roomService.submitAnswer(room.id, {
      roomParticipantId: participant.id,
      questionId: quiz.questions[0]!.id,
      answerOptionIds: [quiz.questions[0]!.answerOptions[0]!.id],
      answerTimeMs: 1500,
    });

    expect(answer).toMatchObject({
      isCorrect: true,
      points: 10,
    });
    expect(realtimeGateway.events).toEqual(
      expect.arrayContaining([
        {
          target: "organizer",
          id: room.id,
          event: {
            type: RealtimeEventType.AnswerSubmitted,
            roomId: room.id,
            answeredCount: 1,
          },
        },
        {
          target: "organizer",
          id: room.id,
          event: {
            type: RealtimeEventType.LeaderboardUpdated,
            roomId: room.id,
            leaderboard: [
              expect.objectContaining({
                roomParticipantId: participant.id,
                score: 10,
              }),
            ],
          },
        },
      ]),
    );

    const dbParticipant = await getTestPrismaClient().roomParticipant.findUnique({
      where: { id: participant.id },
    });

    expect(dbParticipant).toMatchObject({
      score: 10,
      correctAnswersCount: 1,
      totalAnswerTimeMs: 1500,
    });

    await expect(
      roomService.submitAnswer(room.id, {
        roomParticipantId: participant.id,
        questionId: quiz.questions[0]!.id,
        answerOptionIds: [quiz.questions[0]!.answerOptions[0]!.id],
        answerTimeMs: 1200,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("не начисляет баллы за частичный multiple choice ответ", async () => {
    const organizer = await createOrganizer("room-multiple-partial");
    const quiz = await createQuizService().createQuiz(organizer.id, {
      title: "Multiple quiz",
      questions: [createMultipleQuestion()],
    });
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });
    const participant = await roomService.joinRoom(room.id, { displayName: "Участник" });

    await roomService.startRoom(organizer.id, room.id);

    const answer = await roomService.submitAnswer(room.id, {
      roomParticipantId: participant.id,
      questionId: quiz.questions[0]!.id,
      answerOptionIds: [quiz.questions[0]!.answerOptions[0]!.id],
      answerTimeMs: 2000,
    });

    expect(answer).toMatchObject({
      isCorrect: false,
      points: 0,
    });

    const dbParticipant = await getTestPrismaClient().roomParticipant.findUnique({
      where: { id: participant.id },
    });

    expect(dbParticipant).toMatchObject({
      score: 0,
      correctAnswersCount: 0,
      totalAnswerTimeMs: 2000,
    });
  });

  it("завершает комнату и возвращает итоговый лидерборд", async () => {
    const organizer = await createOrganizer("room-finish-owner");
    const quiz = await createLiveQuizForOwner(organizer.id);
    const roomService = createRoomService();
    const room = await roomService.createRoom(organizer.id, { quizId: quiz.id });
    const participant = await roomService.joinRoom(room.id, { displayName: "Участник" });

    await roomService.startRoom(organizer.id, room.id);
    await getTestPrismaClient().roomParticipant.update({
      where: { id: participant.id },
      data: { score: 15, totalAnswerTimeMs: 1000 },
    });

    const leaderboard = await roomService.finishRoom(organizer.id, room.id);

    expect(leaderboard).toEqual([
      expect.objectContaining({
        roomParticipantId: participant.id,
        score: 15,
      }),
    ]);
    expect(realtimeGateway.events).toEqual(
      expect.arrayContaining([
        {
          target: "room",
          id: room.id,
          event: {
            type: RealtimeEventType.RoomFinished,
            roomId: room.id,
            leaderboard,
          },
        },
      ]),
    );

    const dbRoom = await getTestPrismaClient().room.findUnique({ where: { id: room.id } });
    const dbParticipant = await getTestPrismaClient().roomParticipant.findUnique({
      where: { id: participant.id },
    });

    expect(dbRoom?.status).toBe(RoomStatus.FINISHED);
    expect(dbRoom?.currentQuestionId).toBeNull();
    expect(dbRoom?.finishedAt).toBeInstanceOf(Date);
    expect(dbParticipant?.status).toBe(ParticipantStatus.FINISHED);
  });
});
