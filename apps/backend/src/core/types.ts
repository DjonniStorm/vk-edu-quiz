import type {
  EntityId,
  IsoDateString,
  ListQuizzesQuery,
  PaginatedResult,
  PaginationQuery,
} from "@quiz/shared";
import type {
  AnswerMode,
  ParticipantStatus,
  QuizStatus,
  RoomStatus,
  UserRole,
} from "../generated/prisma/enums";

export type { EntityId, IsoDateString, ListQuizzesQuery, PaginatedResult, PaginationQuery } from "@quiz/shared";

export type AppUserRole = UserRole;
export type AppQuizStatus = QuizStatus;
export type AppAnswerMode = AnswerMode;
export type AppRoomStatus = RoomStatus;
export type AppParticipantStatus = ParticipantStatus;

export interface CurrentUser {
  id: EntityId;
  email: string;
  name: string;
  role: AppUserRole;
}

export interface RequestContext {
  currentUser?: CurrentUser;
}
