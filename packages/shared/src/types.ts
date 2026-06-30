import type {
  AnswerMode,
  ParticipantStatus,
  QuizStatus,
  RoomStatus,
  UserRole,
} from "./enums";

export type EntityId = string;
export type IsoDateString = string;

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface ListQuizzesQuery extends PaginationQuery {
  search?: string;
  status?: QuizStatus;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface CurrentUserDto {
  id: EntityId;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthTokensDto {
  accessToken: string;
}

export interface AuthResponseDto {
  user: CurrentUserDto;
  tokens: AuthTokensDto;
}

export interface LiveAnswerOptionDto {
  id: EntityId;
  text: string;
  orderIndex: number;
}

export interface LiveQuestionDto {
  id: EntityId;
  text: string;
  imageUrl: string | null;
  answerMode: AnswerMode;
  orderIndex: number;
  timeLimitSec: number;
  points: number;
  answerOptions: LiveAnswerOptionDto[];
  startedAt: IsoDateString;
  endsAt: IsoDateString;
}

export interface LeaderboardItemDto {
  roomParticipantId: EntityId;
  displayName: string;
  score: number;
  correctAnswersCount: number;
  totalAnswerTimeMs: number;
}

export interface RoomSummaryDto {
  id: EntityId;
  code: string;
  quizId: EntityId;
  organizerId: EntityId;
  status: RoomStatus;
  currentQuestionId: EntityId | null;
  inviteUrl: string;
}

export interface CurrentQuestionStateDto {
  question: LiveQuestionDto | null;
  answeredCount: number;
  participantHasAnswered: boolean;
}

export interface AnswerSubmissionDto {
  displayName: string;
  email: string | null;
  answerOptionIds: EntityId[];
}

export type HostQuestionPhase = "live" | "revealing";

export interface HostQuestionStateDto {
  question: LiveQuestionDto | null;
  answeredCount: number;
  activeParticipantCount: number;
  submissions: AnswerSubmissionDto[];
  phase: HostQuestionPhase;
  correctOptionIds?: EntityId[];
}

export interface RoomParticipantDto {
  id: EntityId;
  userId: EntityId | null;
  displayName: string;
  status: ParticipantStatus;
  score: number;
  correctAnswersCount: number;
  totalAnswerTimeMs: number;
}

export interface HostParticipantDto {
  id: EntityId;
  displayName: string;
  email: string | null;
  status: ParticipantStatus;
}

export interface QuizListItemDto {
  id: EntityId;
  title: string;
  description: string | null;
  category: string | null;
  status: QuizStatus;
  questionsCount: number;
  estimatedDurationMinutes: number;
  hasRooms: boolean;
}

export interface ParticipantQuizHistoryItemDto {
  roomId: EntityId;
  quizId: EntityId;
  quizTitle: string;
  score: number;
  correctAnswersCount: number;
  finishedAt: IsoDateString | null;
}

export interface OrganizerHistorySummaryDto {
  completedSessions: number;
  totalParticipants: number;
  averageScore: number;
}

export interface OrganizerRoomHistoryItemDto {
  roomId: EntityId;
  quizId: EntityId;
  quizTitle: string;
  participantsCount: number;
  startedAt: IsoDateString | null;
  finishedAt: IsoDateString | null;
}

export interface RoomResultsDto {
  roomId: EntityId;
  quizId: EntityId;
  quizTitle: string;
  leaderboard: LeaderboardItemDto[];
}
