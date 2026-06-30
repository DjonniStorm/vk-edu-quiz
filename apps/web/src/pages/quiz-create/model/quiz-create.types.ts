import type { AnswerMode } from "@quiz/shared";

export interface DraftAnswerOption {
  clientId: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface DraftQuestion {
  clientId: string;
  text: string;
  imageUrl: string;
  answerMode: AnswerMode;
  timeLimitSec: number;
  points: number;
  answerOptions: DraftAnswerOption[];
}

export interface QuizDraft {
  title: string;
  description: string;
  category: string;
  showLeaderboardAfterQuestion: boolean;
  allowLateJoin: boolean;
  questions: DraftQuestion[];
}

export const QUIZ_CREATE_STEPS = {
  basicInfo: 0,
  questions: 1,
  rules: 2,
  review: 3,
} as const;

export type QuizCreateStep = (typeof QUIZ_CREATE_STEPS)[keyof typeof QUIZ_CREATE_STEPS];

export const TIME_LIMIT_PRESETS = [15, 30, 45, 60] as const;
