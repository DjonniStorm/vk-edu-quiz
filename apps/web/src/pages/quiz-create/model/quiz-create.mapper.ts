import type { CreateQuizInput, QuestionInput } from "@/shared/api/clients/quizzes.api";

import type { DraftQuestion, QuizDraft } from "./quiz-create.types";

const mapQuestion = (question: DraftQuestion, orderIndex: number): QuestionInput => ({
  text: question.text.trim(),
  answerMode: question.answerMode,
  orderIndex,
  timeLimitSec: question.timeLimitSec,
  points: question.points,
  answerOptions: question.answerOptions.map((option, optionIndex) => ({
    text: option.text.trim(),
    isCorrect: option.isCorrect,
    orderIndex: optionIndex,
  })),
});

export const mapDraftToCreateInput = (draft: QuizDraft): CreateQuizInput => ({
  title: draft.title.trim(),
  description: draft.description.trim() || null,
  category: draft.category.trim() || null,
  showLeaderboardAfterQuestion: draft.showLeaderboardAfterQuestion,
  allowLateJoin: draft.allowLateJoin,
  questions: draft.questions.map(mapQuestion),
});

export const mapDraftToQuestionsInput = (draft: QuizDraft): QuestionInput[] =>
  draft.questions.map(mapQuestion);

export const mapDraftToUpdateInput = (draft: QuizDraft) => ({
  title: draft.title.trim(),
  description: draft.description.trim() || null,
  category: draft.category.trim() || null,
  showLeaderboardAfterQuestion: draft.showLeaderboardAfterQuestion,
  allowLateJoin: draft.allowLateJoin,
});
