import { BadRequestError, ConflictError, NotFoundError } from "../../core/errors";
import type { EntityId } from "../../core/types";
import type { PrismaClient } from "../../generated/prisma/client";
import { AnswerMode, ParticipantStatus, RoomStatus } from "../../generated/prisma/enums";
import { RealtimeEventType, type RealtimeGateway } from "../realtime/realtime.interfaces";
import type {
  AnswerResult,
  AnswerSubmission,
  CreateRoomInput,
  CurrentQuestionState,
  HostParticipant,
  HostQuestionState,
  JoinRoomInput,
  LeaderboardItem,
  LiveQuestion,
  RoomParticipantDetails,
  RoomService,
  RoomSummary,
  SubmitAnswerInput,
} from "./rooms.interfaces";
import { RoomMapper } from "./rooms.mapper";

const QUESTION_REVEAL_DELAY_MS = 2000;

type AdvanceReason = "all_answered" | "timer" | "manual";

interface RoomServiceOptions {
  questionRevealDelayMs?: number;
}

interface ClosingState {
  questionId: EntityId;
  reason: AdvanceReason;
}

interface HostRevealSnapshot {
  questionId: EntityId;
  correctOptionIds: EntityId[];
  revealingStartedAt: number;
}

interface QuestionTimerState {
  questionId: EntityId;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface RevealTimerState {
  questionId: EntityId;
  timeoutId: ReturnType<typeof setTimeout>;
}

export class RoomServiceImpl implements RoomService {
  private readonly questionTimers = new Map<EntityId, QuestionTimerState>();
  private readonly revealTimers = new Map<EntityId, RevealTimerState>();
  private readonly closingState = new Map<EntityId, ClosingState>();
  private readonly hostSnapshots = new Map<EntityId, HostRevealSnapshot>();
  private readonly inFlightTimerWork = new Set<Promise<void>>();
  private readonly questionRevealDelayMs: number;
  private disposed = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly realtimeGateway: RealtimeGateway,
    options?: RoomServiceOptions,
  ) {
    this.questionRevealDelayMs = options?.questionRevealDelayMs ?? QUESTION_REVEAL_DELAY_MS;
  }

  dispose(): void {
    this.disposed = true;

    for (const roomId of [...this.questionTimers.keys()]) {
      this.clearQuestionTimer(roomId);
    }

    for (const roomId of [...this.revealTimers.keys()]) {
      this.clearRevealTimer(roomId);
    }

    this.closingState.clear();
    this.hostSnapshots.clear();
    this.inFlightTimerWork.clear();
  }

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

  async getCurrentQuestion(
    roomId: EntityId,
    roomParticipantId?: EntityId,
  ): Promise<CurrentQuestionState> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        status: true,
        currentQuestionId: true,
        currentQuestionStartedAt: true,
      },
    });

    if (
      !room ||
      room.status !== RoomStatus.ACTIVE ||
      !room.currentQuestionId ||
      !room.currentQuestionStartedAt
    ) {
      return {
        question: null,
        answeredCount: 0,
        participantHasAnswered: false,
      };
    }

    const question = await this.prisma.question.findFirst({
      where: { id: room.currentQuestionId },
      include: this.liveQuestionInclude(),
    });

    if (!question) {
      return {
        question: null,
        answeredCount: 0,
        participantHasAnswered: false,
      };
    }

    const answeredCount = await this.prisma.participantAnswer.count({
      where: {
        roomId,
        questionId: room.currentQuestionId,
      },
    });

    let participantHasAnswered = false;

    if (roomParticipantId) {
      const existingAnswer = await this.prisma.participantAnswer.findFirst({
        where: {
          roomParticipantId,
          questionId: room.currentQuestionId,
        },
        select: { id: true },
      });

      participantHasAnswered = !!existingAnswer;
    }

    return {
      question: RoomMapper.toLiveQuestion(question, room.currentQuestionStartedAt),
      answeredCount,
      participantHasAnswered,
    };
  }

  async getHostState(organizerId: EntityId, roomId: EntityId): Promise<HostQuestionState> {
    await this.findOrganizerRoom(organizerId, roomId);

    return this.buildHostState(roomId);
  }

  async getHostParticipants(organizerId: EntityId, roomId: EntityId): Promise<HostParticipant[]> {
    await this.findOrganizerRoom(organizerId, roomId);

    const participants = await this.prisma.roomParticipant.findMany({
      where: { roomId },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        displayName: true,
        status: true,
        user: {
          select: { email: true },
        },
      },
    });

    return participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      email: participant.user?.email ?? null,
      status: participant.status,
    }));
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

    let displayName = input.displayName.trim();

    if (input.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { name: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      displayName = user.name;
    }

    const participant = await this.prisma.roomParticipant.create({
      data: {
        roomId,
        userId: input.userId ?? null,
        displayName,
      },
    });

    const mappedParticipant = RoomMapper.toRoomParticipantDetails(participant);

    this.realtimeGateway.publishToRoom(roomId, {
      type: RealtimeEventType.ParticipantJoined,
      roomId,
      participant: mappedParticipant,
    });

    const currentQuestionState = await this.getCurrentQuestion(roomId, participant.id);

    if (currentQuestionState.question) {
      this.realtimeGateway.publishToParticipant(participant.id, {
        type: RealtimeEventType.QuestionShown,
        roomId,
        question: currentQuestionState.question,
      });
    }

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
        currentQuestionStartedAt: firstQuestion ? startedAt : null,
      },
    });

    const liveQuestion = firstQuestion ? RoomMapper.toLiveQuestion(firstQuestion, startedAt) : null;

    this.realtimeGateway.publishToRoom(roomId, {
      type: RealtimeEventType.RoomStarted,
      roomId,
      question: liveQuestion,
    });

    if (liveQuestion) {
      this.scheduleQuestionTimer(roomId, liveQuestion.id, liveQuestion.endsAt);
    }

    return liveQuestion;
  }

  async showQuestion(
    organizerId: EntityId,
    roomId: EntityId,
    questionId: EntityId,
  ): Promise<LiveQuestion> {
    if (this.isQuestionClosing(roomId)) {
      throw new ConflictError("Question is closing");
    }

    const room = await this.findOrganizerRoom(organizerId, roomId);

    if (room.status !== RoomStatus.ACTIVE) {
      throw new BadRequestError("Room is not active");
    }

    return this.showQuestionInternal(organizerId, roomId, room.quizId, questionId);
  }

  async advanceQuestion(organizerId: EntityId, roomId: EntityId): Promise<{ ok: true }> {
    await this.findOrganizerRoom(organizerId, roomId);

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        status: true,
        currentQuestionId: true,
      },
    });

    if (room?.status === RoomStatus.ACTIVE && room.currentQuestionId) {
      await this.closeQuestionAndAdvance(roomId, "manual", room.currentQuestionId);
    }

    return { ok: true };
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

    if (this.isQuestionClosing(roomId)) {
      throw new BadRequestError("Question is closing");
    }

    if (room.currentQuestionId !== input.questionId) {
      throw new BadRequestError("Question is not current");
    }

    const participant = await this.prisma.roomParticipant.findFirst({
      where: {
        id: input.roomParticipantId,
        roomId,
      },
      select: {
        id: true,
        status: true,
        displayName: true,
        user: {
          select: { email: true },
        },
      },
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
    const activeParticipantCount = this.realtimeGateway.getActiveParticipantIds(roomId).length;

    this.realtimeGateway.publishToOrganizer(roomId, {
      type: RealtimeEventType.AnswerSubmitted,
      roomId,
      answeredCount,
      activeParticipantCount,
      submission: {
        roomParticipantId: input.roomParticipantId,
        displayName: participant.displayName,
        email: participant.user?.email ?? null,
        answerOptionIds: input.answerOptionIds,
      },
    });
    this.realtimeGateway.publishToOrganizer(roomId, {
      type: RealtimeEventType.LeaderboardUpdated,
      roomId,
      leaderboard,
    });

    if (await this.hasAllActiveParticipantsAnswered(roomId, input.questionId)) {
      await this.closeQuestionAndAdvance(roomId, "all_answered", input.questionId);
    }

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
    await this.findOrganizerRoom(organizerId, roomId);

    return this.finishRoomInternal(roomId);
  }

  private async buildHostState(roomId: EntityId): Promise<HostQuestionState> {
    const currentQuestionState = await this.getCurrentQuestion(roomId);
    const questionId = currentQuestionState.question?.id ?? null;
    const submissions =
      questionId === null ? [] : await this.loadSubmissionsFromDb(roomId, questionId);
    const closing = this.closingState.get(roomId);
    const phase =
      questionId !== null && closing?.questionId === questionId ? "revealing" : "live";

    let correctOptionIds: EntityId[] | undefined;

    if (phase === "revealing" && questionId !== null) {
      correctOptionIds =
        this.hostSnapshots.get(roomId)?.correctOptionIds ??
        (await this.loadCorrectOptionIds(questionId));
    }

    return {
      question: currentQuestionState.question,
      answeredCount: currentQuestionState.answeredCount,
      activeParticipantCount: this.realtimeGateway.getActiveParticipantIds(roomId).length,
      submissions,
      phase,
      correctOptionIds,
    };
  }

  private async closeQuestionAndAdvance(
    roomId: EntityId,
    reason: AdvanceReason,
    knownQuestionId?: EntityId,
  ): Promise<void> {
    if (this.disposed) {
      return;
    }

    if (knownQuestionId !== undefined) {
      if (this.closingState.get(roomId)?.questionId === knownQuestionId) {
        return;
      }

      this.closingState.set(roomId, { questionId: knownQuestionId, reason });
      this.clearQuestionTimer(roomId);
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        organizerId: true,
        quizId: true,
        status: true,
        currentQuestionId: true,
      },
    });

    if (!room || room.status !== RoomStatus.ACTIVE || !room.currentQuestionId) {
      if (knownQuestionId !== undefined) {
        this.clearClosingState(roomId);
      }

      return;
    }

    if (this.disposed) {
      this.clearClosingState(roomId);
      return;
    }

    const questionId = room.currentQuestionId;

    if (knownQuestionId !== undefined && knownQuestionId !== questionId) {
      this.clearClosingState(roomId);
      return;
    }

    if (knownQuestionId === undefined) {
      if (this.closingState.get(roomId)?.questionId === questionId) {
        return;
      }

      this.closingState.set(roomId, { questionId, reason });
      this.clearQuestionTimer(roomId);
    }

    const correctOptionIds = await this.loadCorrectOptionIds(questionId);

    this.hostSnapshots.set(roomId, {
      questionId,
      correctOptionIds,
      revealingStartedAt: Date.now(),
    });

    this.realtimeGateway.publishToOrganizer(roomId, {
      type: RealtimeEventType.QuestionRevealed,
      roomId,
      questionId,
      correctOptionIds,
    });

    this.clearRevealTimer(roomId);

    const timeoutId = setTimeout(() => {
      this.revealTimers.delete(roomId);
      this.trackTimerWork(
        this.completeQuestionAdvance(roomId, room.organizerId, room.quizId, questionId),
      );
    }, this.questionRevealDelayMs);

    this.revealTimers.set(roomId, { questionId, timeoutId });
  }

  private async completeQuestionAdvance(
    roomId: EntityId,
    organizerId: EntityId,
    quizId: EntityId,
    questionId: EntityId,
  ): Promise<void> {
    if (this.disposed) {
      return;
    }

    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          status: true,
          currentQuestionId: true,
        },
      });

      if (
        this.disposed ||
        !room ||
        room.status !== RoomStatus.ACTIVE ||
        room.currentQuestionId !== questionId ||
        this.closingState.get(roomId)?.questionId !== questionId
      ) {
        return;
      }

      const currentQuestion = await this.prisma.question.findUnique({
        where: { id: questionId },
        select: { orderIndex: true },
      });

      if (this.disposed || !currentQuestion) {
        return;
      }

      const nextQuestion = await this.prisma.question.findFirst({
        where: {
          quizId,
          orderIndex: { gt: currentQuestion.orderIndex },
        },
        orderBy: { orderIndex: "asc" },
        select: { id: true },
      });

      if (this.disposed) {
        return;
      }

      if (nextQuestion) {
        await this.showQuestionInternal(organizerId, roomId, quizId, nextQuestion.id);
      } else {
        await this.finishRoomInternal(roomId);
      }
    } finally {
      if (!this.disposed) {
        this.clearClosingState(roomId);
      }
    }
  }

  private async showQuestionInternal(
    organizerId: EntityId,
    roomId: EntityId,
    quizId: EntityId,
    questionId: EntityId,
  ): Promise<LiveQuestion> {
    if (this.disposed) {
      throw new BadRequestError("Room service is disposed");
    }

    const question = await this.prisma.question.findFirst({
      where: {
        id: questionId,
        quizId,
      },
      include: this.liveQuestionInclude(),
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const startedAt = new Date();

    await this.prisma.room.update({
      where: { id: roomId },
      data: {
        currentQuestionId: question.id,
        currentQuestionStartedAt: startedAt,
      },
    });

    const liveQuestion = RoomMapper.toLiveQuestion(question, startedAt);

    this.realtimeGateway.publishToRoom(roomId, {
      type: RealtimeEventType.QuestionShown,
      roomId,
      question: liveQuestion,
    });

    this.scheduleQuestionTimer(roomId, question.id, liveQuestion.endsAt);

    return liveQuestion;
  }

  private async finishRoomInternal(roomId: EntityId): Promise<LeaderboardItem[]> {
    this.clearQuestionTimer(roomId);

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { status: true },
    });

    if (!room) {
      throw new NotFoundError("Room not found");
    }

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
            currentQuestionStartedAt: null,
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

  private async hasAllActiveParticipantsAnswered(
    roomId: EntityId,
    questionId: EntityId,
  ): Promise<boolean> {
    const activeParticipantIds = this.realtimeGateway.getActiveParticipantIds(roomId);

    if (activeParticipantIds.length === 0) {
      return false;
    }

    const answers = await this.prisma.participantAnswer.findMany({
      where: {
        roomId,
        questionId,
        roomParticipantId: { in: activeParticipantIds },
      },
      select: { roomParticipantId: true },
    });
    const answeredIds = new Set(answers.map((answer) => answer.roomParticipantId));

    return activeParticipantIds.every((participantId) => answeredIds.has(participantId));
  }

  private async loadSubmissionsFromDb(
    roomId: EntityId,
    questionId: EntityId,
  ): Promise<AnswerSubmission[]> {
    const answers = await this.prisma.participantAnswer.findMany({
      where: {
        roomId,
        questionId,
      },
      include: {
        roomParticipant: {
          select: {
            displayName: true,
            user: {
              select: { email: true },
            },
          },
        },
        participantAnswerOptions: {
          select: { answerOptionId: true },
        },
      },
      orderBy: { submittedAt: "asc" },
    });

    return answers.map((answer) => ({
      displayName: answer.roomParticipant.displayName,
      email: answer.roomParticipant.user?.email ?? null,
      answerOptionIds: answer.participantAnswerOptions.map((option) => option.answerOptionId),
    }));
  }

  private async loadCorrectOptionIds(questionId: EntityId): Promise<EntityId[]> {
    const options = await this.prisma.answerOption.findMany({
      where: {
        questionId,
        isCorrect: true,
      },
      select: { id: true },
    });

    return options.map((option) => option.id);
  }

  private scheduleQuestionTimer(roomId: EntityId, questionId: EntityId, endsAt: string): void {
    this.clearQuestionTimer(roomId);

    const delayMs = Math.max(0, new Date(endsAt).getTime() - Date.now());

    const timeoutId = setTimeout(() => {
      this.trackTimerWork(this.closeQuestionAndAdvance(roomId, "timer", questionId));
    }, delayMs);

    this.questionTimers.set(roomId, { questionId, timeoutId });
  }

  private clearQuestionTimer(roomId: EntityId): void {
    const timer = this.questionTimers.get(roomId);

    if (!timer) {
      return;
    }

    clearTimeout(timer.timeoutId);
    this.questionTimers.delete(roomId);
  }

  private trackTimerWork(work: Promise<void>): void {
    if (this.disposed) {
      return;
    }

    this.inFlightTimerWork.add(work);

    void work.finally(() => {
      this.inFlightTimerWork.delete(work);
    });
  }

  private clearRevealTimer(roomId: EntityId): void {
    const timer = this.revealTimers.get(roomId);

    if (!timer) {
      return;
    }

    clearTimeout(timer.timeoutId);
    this.revealTimers.delete(roomId);
  }

  private clearClosingState(roomId: EntityId): void {
    this.clearRevealTimer(roomId);
    this.closingState.delete(roomId);
    this.hostSnapshots.delete(roomId);
  }

  private isQuestionClosing(roomId: EntityId): boolean {
    return this.closingState.has(roomId);
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
