import { z } from "zod";

import { listQuizzesQuerySchema, optionalImageUrlSchema } from "@quiz/shared";

import { AnswerMode, QuizStatus } from "../../generated/prisma/enums";

export { listQuizzesQuerySchema };

export const answerOptionInputSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
  orderIndex: z.number().int().min(0),
});

export const questionInputSchema = z.object({
  text: z.string().min(1),
  imageUrl: optionalImageUrlSchema,
  answerMode: z.enum([AnswerMode.SINGLE, AnswerMode.MULTIPLE]),
  orderIndex: z.number().int().min(0),
  timeLimitSec: z.number().int().positive(),
  points: z.number().int().positive(),
  answerOptions: z.array(answerOptionInputSchema).min(2),
});

export const createQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  showLeaderboardAfterQuestion: z.boolean().optional(),
  allowLateJoin: z.boolean().optional(),
  questions: z.array(questionInputSchema).optional(),
});

export const updateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  status: z
    .enum([QuizStatus.DRAFT, QuizStatus.PUBLISHED, QuizStatus.ARCHIVED])
    .optional(),
  showLeaderboardAfterQuestion: z.boolean().optional(),
  allowLateJoin: z.boolean().optional(),
});

export const replaceQuestionsSchema = z.object({
  questions: z.array(questionInputSchema),
});
