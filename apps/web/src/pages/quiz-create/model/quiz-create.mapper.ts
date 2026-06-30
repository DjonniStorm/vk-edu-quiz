import type { CreateQuizInput, QuestionInput, QuizDetailsDto } from "@/shared/api/clients/quizzes.api";

import type { DraftQuestion, QuizDraft } from "./quiz-create.types";

const mapQuestion = (question: DraftQuestion, orderIndex: number): QuestionInput => {
  const trimmedImageUrl = question.imageUrl.trim();

  return {
    text: question.text.trim(),
    imageUrl: trimmedImageUrl || null,
    answerMode: question.answerMode,
    orderIndex,
    timeLimitSec: question.timeLimitSec,
    points: question.points,
    answerOptions: question.answerOptions.map((option, optionIndex) => ({
      text: option.text.trim(),
      isCorrect: option.isCorrect,
      orderIndex: optionIndex,
    })),
  };
};

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

export const mapQuizDetailsToDraft = (dto: QuizDetailsDto): QuizDraft => ({
  title: dto.title,
  description: dto.description ?? "",
  category: dto.category ?? "",
  showLeaderboardAfterQuestion: dto.showLeaderboardAfterQuestion,
  allowLateJoin: dto.allowLateJoin,
  questions: dto.questions
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(
      (question): DraftQuestion => ({
        clientId: question.id,
        text: question.text,
        imageUrl: question.imageUrl ?? "",
        answerMode: question.answerMode,
        timeLimitSec: question.timeLimitSec,
        points: question.points,
        answerOptions: question.answerOptions
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((option) => ({
            clientId: option.id,
            text: option.text,
            isCorrect: option.isCorrect,
            orderIndex: option.orderIndex,
          })),
      }),
    ),
});
