import { z } from "zod";

import { AnswerMode } from "./enums";

export const entityIdSchema = z.uuid();

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const registerUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const loginUserSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const answerOptionInputSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
  orderIndex: z.number().int().min(0),
});

export const isHttpOrHttpsUrl = (value: string): boolean => {
  try {
    const protocol = new URL(value).protocol;

    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

export const optionalImageUrlSchema = z
  .union([
    z.string().refine(isHttpOrHttpsUrl, { message: "Image URL must use http or https" }),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

export const questionInputSchema = z.object({
  text: z.string().min(1),
  imageUrl: optionalImageUrlSchema,
  answerMode: z.enum([AnswerMode.Single, AnswerMode.Multiple]),
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

export const createRoomSchema = z.object({
  quizId: entityIdSchema,
});

export const joinRoomSchema = z.object({
  displayName: z.string().min(1),
});

export const leaveRoomSchema = z.object({
  roomParticipantId: entityIdSchema,
});

export const showQuestionSchema = z.object({
  questionId: entityIdSchema,
});

export const submitAnswerSchema = z.object({
  roomParticipantId: entityIdSchema,
  questionId: entityIdSchema,
  answerOptionIds: z.array(entityIdSchema).min(1),
  answerTimeMs: z.number().int().min(0),
});

export const currentQuestionQuerySchema = z.object({
  roomParticipantId: entityIdSchema.optional(),
});
