import { BadRequestError, ConflictError, NotFoundError } from "../../core/errors";
import type { EntityId } from "../../core/types";
import type { PrismaClient } from "../../generated/prisma/client";
import { AnswerMode, ParticipantStatus, RoomStatus } from "../../generated/prisma/enums";
import { RealtimeEventType, type RealtimeGateway } from "../realtime/realtime.interfaces";
import type {
  AnswerResult,
  CreateRoomInput,
  JoinRoomInput,
  LeaderboardItem,
  LiveQuestion,
  RoomParticipantDetails,
  RoomService,
  RoomSummary,
  SubmitAnswerInput,
} from "./rooms.interfaces";
import { RoomMapper } from "./rooms.mapper";

export class RoomServiceImpl implements RoomService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createRoom(organizerId: EntityId, input: CreateRoomInput): Promise<RoomSummary> {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: input.quizId,
        ownerId: organizerId,
      },
      select: { id: true },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    const room = await this.prisma.room.create({
      data: {
        quizId: input.quizId,
        organizerId,
      },
    });

    return RoomMapper.toRoomSummary(room);
  }

  async getRoom(roomId: EntityId): Promise<RoomSummary | null> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    return room ? RoomMapper.toRoomSummary(room) : null;
  }

  async joinRoom(roomId: EntityId, input: JoinRoomInput): Promise<RoomParticipantDetails> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        quiz: {
          select: { allowLateJoin: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    if (room.status === RoomStatus.FINISHED || room.status === RoomStatus.CANCELLED) {
      throw new BadRequestError("Room is closed for joining");
    }

    if (room.status === RoomStatus.ACTIVE && !room.quiz.allowLateJoin) {
      throw new BadRequestError("Late join is not allowed");
    }

    const participant = await this.prisma.roomParticipant.create({
      data: {
        roomId,
        userId: input.userId ?? null,
        displayName: input.displayName.trim(),
      },
    });

    const mappedParticipant = RoomMapper.toRoomParticipantDetails(participant);

    this.realtimeGateway.publishToRoom(roomId, {
      type: RealtimeEventType.ParticipantJoined,
      roomId,
      participant: mappedParticipant,
    });

    return mappedParticipant;
  }

  async leaveRoom(roomParticipantId: EntityId): Promise<void> {
    const result = await this.prisma.roomParticipant.updateMany({
      where: { id: roomParticipantId },
      data: {
        status: ParticipantStatus.DISCONNECTED,
        leftAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundError("Room participant not found");
    }
  }

  async startRoom(organizerId: EntityId, roomId: EntityId): Promise<LiveQuestion | null> {
    const room = await this.findOrganizerRoom(organizerId, roomId);

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestError("Only waiting room can be started");
    }

    const firstQuestion = await this.prisma.question.findFirst({
      where: { quizId: room.quizId },
      orderBy: { orderIndex: "asc" },
      include: this.liveQuestionInclude(),
    });
    const startedAt = new Date();

    await this.prisma.room.update({
      where: { id: roomId },
      data: {
        status: RoomStatus.ACTIVE,
        startedAt,
        currentQuestionId: firstQuestion?.id ?? null,
      },
    });

    const liveQuestion = firstQuestion ? RoomMapper.toLiveQuestion(firstQuestion, startedAt) : null;

    this.realtimeGateway.publishToRoom(roomId, {
      type: RealtimeEventType.RoomStarted,
      roomId,
      question: liveQuestion,
    });

    return liveQuestion;
  }

  async showQuestion(
    organizerId: EntityId,
    roomId: EntityId,
    questionId: EntityId,
  ): Promise<LiveQuestion> {
    const room = await this.findOrganizerRoom(organizerId, roomId);

    if (room.status !== RoomStatus.ACTIVE) {
      throw new BadRequestError("Room is not active");
    }

    const question = await this.prisma.question.findFirst({
      where: {
        id: questionId,
        quizId: room.quizId,
      },
      include: this.liveQuestionInclude(),
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const startedAt = new Date();

    await this.prisma.room.update({
      where: { id: roomId },
      data: { currentQuestionId: question.id },
    });

    const liveQuestion = RoomMapper.toLiveQuestion(question, startedAt);

    this.realtimeGateway.publishToRoom(roomId, {
      type: RealtimeEventType.QuestionShown,
      roomId,
      question: liveQuestion,
    });

    return liveQuestion;
  }

  async submitAnswer(roomId: EntityId, input: SubmitAnswerInput): Promise<AnswerResult> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        quizId: true,
        status: true,
        currentQuestionId: true,
      },
    });

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    if (room.status !== RoomStatus.ACTIVE || !room.currentQuestionId) {
      throw new BadRequestError("Room is not accepting answers");
    }

    if (room.currentQuestionId !== input.questionId) {
      throw new BadRequestError("Question is not current");
    }

    const participant = await this.prisma.roomParticipant.findFirst({
      where: {
        id: input.roomParticipantId,
        roomId,
      },
      select: { id: true, status: true },
    });

    if (!participant) {
      throw new NotFoundError("Room participant not found");
    }

    if (participant.status !== ParticipantStatus.CONNECTED) {
      throw new BadRequestError("Room participant is not connected");
    }

    const question = await this.prisma.question.findFirst({
      where: {
        id: input.questionId,
        quizId: room.quizId,
      },
      include: {
        answerOptions: true,
      },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    this.validateAnswerInput(input, question);

    const existingAnswer = await this.prisma.participantAnswer.findFirst({
      where: {
        roomParticipantId: input.roomParticipantId,
        questionId: input.questionId,
      },
      select: { id: true },
    });

    if (existingAnswer) {
      throw new ConflictError("Question already answered by this participant");
    }

    const correctOptionIds = question.answerOptions
      .filter((option) => option.isCorrect)
      .map((option) => option.id);
    const isCorrect = this.areSameSets(input.answerOptionIds, correctOptionIds);
    const points = isCorrect ? question.points : 0;
    const answer = await this.prisma.$transaction(async (tx) => {
      const createdAnswer = await tx.participantAnswer.create({
        data: {
          roomId,
          roomParticipantId: input.roomParticipantId,
          questionId: input.questionId,
          answerTimeMs: input.answerTimeMs,
          isCorrect,
          points,
          participantAnswerOptions: {
            create: input.answerOptionIds.map((answerOptionId) => ({
              answerOptionId,
            })),
          },
        },
        select: {
          id: true,
          isCorrect: true,
          points: true,
        },
      });

      await tx.roomParticipant.update({
        where: { id: input.roomParticipantId },
        data: {
          score: { increment: points },
          correctAnswersCount: { increment: isCorrect ? 1 : 0 },
          totalAnswerTimeMs: { increment: input.answerTimeMs },
        },
      });

      return createdAnswer;
    });

    const answeredCount = await this.prisma.participantAnswer.count({
      where: {
        roomId,
        questionId: input.questionId,
      },
    });
    const leaderboard = await this.getLeaderboard(roomId);

    this.realtimeGateway.publishToOrganizer(roomId, {
      type: RealtimeEventType.AnswerSubmitted,
      roomId,
      answeredCount,
    });
    this.realtimeGateway.publishToOrganizer(roomId, {
      type: RealtimeEventType.LeaderboardUpdated,
      roomId,
      leaderboard,
    });

    return answer;
  }

  async getLeaderboard(roomId: EntityId): Promise<LeaderboardItem[]> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true },
    });

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    const participants = await this.prisma.roomParticipant.findMany({
      where: { roomId },
      orderBy: [
        { score: "desc" },
        { totalAnswerTimeMs: "asc" },
        { joinedAt: "asc" },
      ],
    });

    return participants.map((participant) => RoomMapper.toLeaderboardItem(participant));
  }

  async finishRoom(organizerId: EntityId, roomId: EntityId): Promise<LeaderboardItem[]> {
    const room = await this.findOrganizerRoom(organizerId, roomId);

    if (room.status === RoomStatus.CANCELLED) {
      throw new BadRequestError("Cancelled room cannot be finished");
    }

    if (room.status !== RoomStatus.FINISHED) {
      await this.prisma.$transaction([
        this.prisma.room.update({
          where: { id: roomId },
          data: {
            status: RoomStatus.FINISHED,
            currentQuestionId: null,
            finishedAt: new Date(),
          },
        }),
        this.prisma.roomParticipant.updateMany({
          where: {
            roomId,
            status: ParticipantStatus.CONNECTED,
          },
          data: {
            status: ParticipantStatus.FINISHED,
          },
        }),
      ]);
    }

    const leaderboard = await this.getLeaderboard(roomId);

    this.realtimeGateway.publishToRoom(roomId, {
      type: RealtimeEventType.RoomFinished,
      roomId,
      leaderboard,
    });

    return leaderboard;
  }

  private async findOrganizerRoom(organizerId: EntityId, roomId: EntityId) {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        organizerId,
      },
      select: {
        id: true,
        quizId: true,
        status: true,
      },
    });

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    return room;
  }

  private validateAnswerInput(
    input: SubmitAnswerInput,
    question: {
      answerMode: AnswerMode;
      timeLimitSec: number;
      answerOptions: { id: string }[];
    },
  ): void {
    const uniqueAnswerOptionIds = new Set(input.answerOptionIds);

    if (uniqueAnswerOptionIds.size !== input.answerOptionIds.length) {
      throw new BadRequestError("Answer option ids must be unique");
    }

    if (input.answerTimeMs < 0) {
      throw new BadRequestError("Answer time must be positive");
    }

    if (input.answerTimeMs > question.timeLimitSec * 1000) {
      throw new BadRequestError("Answer time limit exceeded");
    }

    if (question.answerMode === AnswerMode.SINGLE && input.answerOptionIds.length !== 1) {
      throw new BadRequestError("Single choice question requires exactly one answer option");
    }

    if (question.answerMode === AnswerMode.MULTIPLE && input.answerOptionIds.length < 1) {
      throw new BadRequestError("Multiple choice question requires at least one answer option");
    }

    const questionAnswerOptionIds = new Set(question.answerOptions.map((option) => option.id));

    for (const answerOptionId of input.answerOptionIds) {
      if (!questionAnswerOptionIds.has(answerOptionId)) {
        throw new BadRequestError("Answer option does not belong to question");
      }
    }
  }

  private areSameSets(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    const rightSet = new Set(right);

    return left.every((item) => rightSet.has(item));
  }

  private liveQuestionInclude() {
    return {
      answerOptions: {
        orderBy: { orderIndex: "asc" as const },
        select: {
          id: true,
          text: true,
          orderIndex: true,
        },
      },
    };
  }
}
