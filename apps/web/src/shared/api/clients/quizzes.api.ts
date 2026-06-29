import type { AnswerMode, QuizStatus } from "@quiz/shared";
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
  answerMode: AnswerMode;
  orderIndex: number;
  timeLimitSec: number;
  points: number;
  answerOptions: AnswerOptionDetailsDto[];
}

export interface QuizDetailsDto {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: QuizStatus;
  questionsCount: number;
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
}

export const quizzesApi = QuizzesApi.getInstance();
