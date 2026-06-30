import { BadRequestError, NotFoundError } from "../../core/errors";
import type { EntityId, PaginatedResult, PaginationQuery } from "../../core/types";
import type { PrismaClient } from "../../generated/prisma/client";
import { AnswerMode } from "../../generated/prisma/enums";
import type {
  CreateQuizInput,
  QuestionInput,
  QuizDetails,
  QuizListItem,
  QuizService,
  UpdateQuizInput,
} from "./quizzes.interfaces";
import { QuizMapper } from "./quizzes.mapper";

export class QuizServiceImpl implements QuizService {
  constructor(private readonly prisma: PrismaClient) {}

  async listOwnerQuizzes(
    ownerId: EntityId,
    query: PaginationQuery = {},
  ): Promise<PaginatedResult<QuizListItem>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where: { ownerId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: { questions: true, rooms: true },
          },
          questions: {
            select: { timeLimitSec: true },
          },
        },
      }),
      this.prisma.quiz.count({ where: { ownerId } }),
    ]);

    return {
      items: items.map((quiz) => QuizMapper.toQuizListItem(quiz)),
      total,
      limit,
      offset,
    };
  }

  async getOwnerQuiz(ownerId: EntityId, quizId: EntityId): Promise<QuizDetails | null> {
    const quiz = await this.findOwnerQuiz(ownerId, quizId);

    return quiz ? QuizMapper.toQuizDetails(quiz) : null;
  }

  async createQuiz(ownerId: EntityId, input: CreateQuizInput): Promise<QuizDetails> {
    const questions = input.questions ?? [];

    this.validateQuestions(questions);

    const quiz = await this.prisma.quiz.create({
      data: {
        title: input.title.trim(),
        description: input.description ?? null,
        category: input.category ?? null,
        ownerId,
        showLeaderboardAfterQuestion: input.showLeaderboardAfterQuestion ?? true,
        allowLateJoin: input.allowLateJoin ?? true,
        questions: {
          create: questions.map((question) => this.toQuestionCreateInput(question)),
        },
      },
      include: this.quizDetailsInclude(),
    });

    return QuizMapper.toQuizDetails(quiz);
  }

  async updateQuiz(ownerId: EntityId, quizId: EntityId, input: UpdateQuizInput): Promise<QuizDetails> {
    await this.ensureOwnerQuizExists(ownerId, quizId);

    const quiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.showLeaderboardAfterQuestion !== undefined
          ? { showLeaderboardAfterQuestion: input.showLeaderboardAfterQuestion }
          : {}),
        ...(input.allowLateJoin !== undefined ? { allowLateJoin: input.allowLateJoin } : {}),
      },
      include: this.quizDetailsInclude(),
    });

    return QuizMapper.toQuizDetails(quiz);
  }

  async deleteQuiz(ownerId: EntityId, quizId: EntityId): Promise<void> {
    const result = await this.prisma.quiz.deleteMany({
      where: {
        id: quizId,
        ownerId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundError("Quiz not found");
    }
  }

  async replaceQuestions(
    ownerId: EntityId,
    quizId: EntityId,
    questions: QuestionInput[],
  ): Promise<QuizDetails> {
    this.validateQuestions(questions);
    await this.ensureOwnerQuizExists(ownerId, quizId);
    await this.ensureQuizHasNoRooms(quizId);

    const quiz = await this.prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({
        where: { quizId },
      });

      return tx.quiz.update({
        where: { id: quizId },
        data: {
          questions: {
            create: questions.map((question) => this.toQuestionCreateInput(question)),
          },
        },
        include: this.quizDetailsInclude(),
      });
    });

    return QuizMapper.toQuizDetails(quiz);
  }

  async duplicateQuiz(ownerId: EntityId, quizId: EntityId): Promise<QuizDetails> {
    const source = await this.findOwnerQuiz(ownerId, quizId);

    if (!source) {
      throw new NotFoundError("Quiz not found");
    }

    const questions: QuestionInput[] = (source.questions ?? []).map((question) => ({
      text: question.text,
      answerMode: question.answerMode,
      orderIndex: question.orderIndex,
      timeLimitSec: question.timeLimitSec,
      points: question.points,
      answerOptions: question.answerOptions.map((option) => ({
        text: option.text,
        isCorrect: option.isCorrect,
        orderIndex: option.orderIndex,
      })),
    }));

    return this.createQuiz(ownerId, {
      title: `${source.title.trim()} (copy)`,
      description: source.description,
      category: source.category,
      showLeaderboardAfterQuestion: source.showLeaderboardAfterQuestion,
      allowLateJoin: source.allowLateJoin,
      questions,
    });
  }

  private async ensureOwnerQuizExists(ownerId: EntityId, quizId: EntityId): Promise<void> {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        ownerId,
      },
      select: { id: true },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }
  }

  private async ensureQuizHasNoRooms(quizId: EntityId): Promise<void> {
    const roomsCount = await this.prisma.room.count({
      where: { quizId },
    });

    if (roomsCount > 0) {
      throw new BadRequestError("Cannot replace questions for quiz with game sessions");
    }
  }

  private findOwnerQuiz(ownerId: EntityId, quizId: EntityId) {
    return this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        ownerId,
      },
      include: this.quizDetailsInclude(),
    });
  }

  private validateQuestions(questions: QuestionInput[]): void {
    this.ensureUniqueOrderIndexes(
      questions.map((question) => question.orderIndex),
      "Question orderIndex values must be unique",
    );

    for (const question of questions) {
      if (question.points <= 0) {
        throw new BadRequestError("Question points must be positive");
      }

      if (question.timeLimitSec <= 0) {
        throw new BadRequestError("Question timeLimitSec must be positive");
      }

      if (question.answerOptions.length < 2) {
        throw new BadRequestError("Question must have at least two answer options");
      }

      this.ensureUniqueOrderIndexes(
        question.answerOptions.map((option) => option.orderIndex),
        "Answer option orderIndex values must be unique",
      );

      const correctOptionsCount = question.answerOptions.filter((option) => option.isCorrect).length;

      if (question.answerMode === AnswerMode.SINGLE && correctOptionsCount !== 1) {
        throw new BadRequestError("Single choice question must have exactly one correct option");
      }

      if (question.answerMode === AnswerMode.MULTIPLE && correctOptionsCount < 1) {
        throw new BadRequestError("Multiple choice question must have at least one correct option");
      }
    }
  }

  private ensureUniqueOrderIndexes(orderIndexes: number[], message: string): void {
    if (new Set(orderIndexes).size !== orderIndexes.length) {
      throw new BadRequestError(message);
    }
  }

  private toQuestionCreateInput(question: QuestionInput) {
    return {
      text: question.text.trim(),
      answerMode: question.answerMode,
      orderIndex: question.orderIndex,
      timeLimitSec: question.timeLimitSec,
      points: question.points,
      answerOptions: {
        create: question.answerOptions.map((option) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
          orderIndex: option.orderIndex,
        })),
      },
    };
  }

  private quizDetailsInclude() {
    return {
      questions: {
        orderBy: { orderIndex: "asc" as const },
        include: {
          answerOptions: {
            orderBy: { orderIndex: "asc" as const },
          },
        },
      },
      _count: {
        select: { questions: true, rooms: true },
      },
    };
  }

}
