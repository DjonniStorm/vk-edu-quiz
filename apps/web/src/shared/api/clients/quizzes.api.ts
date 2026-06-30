import type { AnswerMode, PaginatedResult, QuizStatus } from "@quiz/shared";
import type { createQuizSchema, questionInputSchema } from "@quiz/shared";
import type { z } from "zod";

import { BaseApi } from "../base-api";

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;

export interface AnswerOptionDetailsDto {
  id: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuestionDetailsDto {
  id: string;
  text: string;
  imageUrl: string | null;
  answerMode: AnswerMode;
  orderIndex: number;
  timeLimitSec: number;
  points: number;
  answerOptions: AnswerOptionDetailsDto[];
}

export interface QuizListItemDto {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: QuizStatus;
  questionsCount: number;
  estimatedDurationMinutes: number;
  hasRooms: boolean;
}

export interface QuizDetailsDto extends QuizListItemDto {
  showLeaderboardAfterQuestion: boolean;
  allowLateJoin: boolean;
  questions: QuestionDetailsDto[];
}

export interface UpdateQuizInput {
  title?: string;
  description?: string | null;
  category?: string | null;
  status?: QuizStatus;
  showLeaderboardAfterQuestion?: boolean;
  allowLateJoin?: boolean;
}

export interface ListQuizzesQuery {
  limit?: number;
  offset?: number;
}

class QuizzesApi extends BaseApi {
  private static instance: QuizzesApi;

  private constructor() {
    super("/quizzes");
  }

  static getInstance(): QuizzesApi {
    if (!QuizzesApi.instance) {
      QuizzesApi.instance = new QuizzesApi();
    }

    return QuizzesApi.instance;
  }

  async create(input: CreateQuizInput): Promise<QuizDetailsDto> {
    const { data } = await this.post<QuizDetailsDto>("/", input, {
      meta: { level: "blocking" },
    });

    return data;
  }

  async update(quizId: string, input: UpdateQuizInput): Promise<QuizDetailsDto> {
    const { data } = await this.patch<QuizDetailsDto>(`/${quizId}`, input, {
      meta: { level: "blocking" },
    });

    return data;
  }

  async replaceQuestions(quizId: string, questions: QuestionInput[]): Promise<QuizDetailsDto> {
    const { data } = await this.put<QuizDetailsDto>(
      `/${quizId}/questions`,
      { questions },
      { meta: { level: "blocking" } },
    );

    return data;
  }

  async getQuiz(quizId: string): Promise<QuizDetailsDto> {
    const { data } = await this.get<QuizDetailsDto>(`/${quizId}`, {
      meta: { level: "blocking" },
    });

    return data;
  }

  async duplicate(quizId: string): Promise<QuizDetailsDto> {
    const { data } = await this.post<QuizDetailsDto>(`/${quizId}/duplicate`, {}, {
      meta: { level: "blocking" },
    });

    return data;
  }

  async list(query: ListQuizzesQuery = {}): Promise<PaginatedResult<QuizListItemDto>> {
    const { data } = await this.get<PaginatedResult<QuizListItemDto>>("/", {
      params: query,
      meta: { level: "blocking" },
    });

    return data;
  }
}

export const quizzesApi = QuizzesApi.getInstance();
