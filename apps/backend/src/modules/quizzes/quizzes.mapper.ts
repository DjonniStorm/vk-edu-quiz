import { AnswerMode, QuizStatus } from "../../generated/prisma/enums";
import type {
  AnswerOptionDetails,
  QuestionDetails,
  QuizDetails,
  QuizListItem,
} from "./quizzes.interfaces";

export interface QuizRecord {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: QuizStatus;
  showLeaderboardAfterQuestion: boolean;
  allowLateJoin: boolean;
  _count?: {
    questions: number;
    rooms?: number;
  };
  questions?: Pick<QuestionRecord, "timeLimitSec">[] | QuestionRecord[];
}

export interface QuestionRecord {
  id: string;
  text: string;
  answerMode: AnswerMode;
  orderIndex: number;
  timeLimitSec: number;
  points: number;
  answerOptions: AnswerOptionRecord[];
}

export interface AnswerOptionRecord {
  id: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export class QuizMapper {
  static toQuizListItem(quiz: QuizRecord): QuizListItem {
    const totalTimeLimitSec = (quiz.questions ?? []).reduce(
      (sum, question) => sum + question.timeLimitSec,
      0,
    );

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      status: quiz.status,
      questionsCount: quiz._count?.questions ?? quiz.questions?.length ?? 0,
      estimatedDurationMinutes: totalTimeLimitSec > 0 ? Math.ceil(totalTimeLimitSec / 60) : 0,
      hasRooms: (quiz._count?.rooms ?? 0) > 0,
    };
  }

  static toQuizDetails(quiz: QuizRecord): QuizDetails {
    return {
      ...this.toQuizListItem(quiz),
      showLeaderboardAfterQuestion: quiz.showLeaderboardAfterQuestion,
      allowLateJoin: quiz.allowLateJoin,
      questions: (quiz.questions ?? []).map((question) => this.toQuestionDetails(question as QuestionRecord)),
    };
  }

  static toQuestionDetails(question: QuestionRecord): QuestionDetails {
    return {
      id: question.id,
      text: question.text,
      answerMode: question.answerMode,
      orderIndex: question.orderIndex,
      timeLimitSec: question.timeLimitSec,
      points: question.points,
      answerOptions: question.answerOptions.map((option) => this.toAnswerOptionDetails(option)),
    };
  }

  static toAnswerOptionDetails(option: AnswerOptionRecord): AnswerOptionDetails {
    return {
      id: option.id,
      text: option.text,
      isCorrect: option.isCorrect,
      orderIndex: option.orderIndex,
    };
  }
}
