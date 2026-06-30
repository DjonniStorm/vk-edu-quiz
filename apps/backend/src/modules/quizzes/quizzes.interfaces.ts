import type {
  AppAnswerMode,
  AppQuizStatus,
  EntityId,
  ListQuizzesQuery,
  PaginatedResult,
} from "../../core/types";

export interface AnswerOptionInput {
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuestionInput {
  text: string;
  imageUrl?: string | null;
  answerMode: AppAnswerMode;
  orderIndex: number;
  timeLimitSec: number;
  points: number;
  answerOptions: AnswerOptionInput[];
}

export interface CreateQuizInput {
  title: string;
  description?: string | null;
  category?: string | null;
  showLeaderboardAfterQuestion?: boolean;
  allowLateJoin?: boolean;
  questions?: QuestionInput[];
}

export interface UpdateQuizInput {
  title?: string;
  description?: string | null;
  category?: string | null;
  status?: AppQuizStatus;
  showLeaderboardAfterQuestion?: boolean;
  allowLateJoin?: boolean;
}

export interface QuizListItem {
  id: EntityId;
  title: string;
  description: string | null;
  category: string | null;
  status: AppQuizStatus;
  questionsCount: number;
  estimatedDurationMinutes: number;
  hasRooms: boolean;
}

export interface QuizDetails extends QuizListItem {
  showLeaderboardAfterQuestion: boolean;
  allowLateJoin: boolean;
  questions: QuestionDetails[];
}

export interface QuestionDetails {
  id: EntityId;
  text: string;
  imageUrl: string | null;
  answerMode: AppAnswerMode;
  orderIndex: number;
  timeLimitSec: number;
  points: number;
  answerOptions: AnswerOptionDetails[];
}

export interface AnswerOptionDetails {
  id: EntityId;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizService {
  listOwnerQuizzes(ownerId: EntityId, query?: ListQuizzesQuery): Promise<PaginatedResult<QuizListItem>>;
  getOwnerQuiz(ownerId: EntityId, quizId: EntityId): Promise<QuizDetails | null>;
  createQuiz(ownerId: EntityId, input: CreateQuizInput): Promise<QuizDetails>;
  updateQuiz(ownerId: EntityId, quizId: EntityId, input: UpdateQuizInput): Promise<QuizDetails>;
  deleteQuiz(ownerId: EntityId, quizId: EntityId): Promise<void>;
  replaceQuestions(ownerId: EntityId, quizId: EntityId, questions: QuestionInput[]): Promise<QuizDetails>;
  duplicateQuiz(ownerId: EntityId, quizId: EntityId): Promise<QuizDetails>;
}
