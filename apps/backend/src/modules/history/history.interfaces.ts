import type { EntityId, IsoDateString, PaginatedResult, PaginationQuery } from "../../core/types";
import type { LeaderboardItem } from "../rooms/rooms.interfaces";

export interface ParticipantQuizHistoryItem {
  roomId: EntityId;
  quizId: EntityId;
  quizTitle: string;
  score: number;
  correctAnswersCount: number;
  finishedAt: IsoDateString | null;
}

export interface OrganizerRoomHistoryItem {
  roomId: EntityId;
  quizId: EntityId;
  quizTitle: string;
  participantsCount: number;
  startedAt: IsoDateString | null;
  finishedAt: IsoDateString | null;
}

export interface RoomResults {
  roomId: EntityId;
  quizId: EntityId;
  quizTitle: string;
  leaderboard: LeaderboardItem[];
}

export interface OrganizerHistorySummary {
  completedSessions: number;
  totalParticipants: number;
  averageScore: number;
}

export interface HistoryService {
  listParticipantHistory(
    userId: EntityId,
    query?: PaginationQuery,
  ): Promise<PaginatedResult<ParticipantQuizHistoryItem>>;
  listOrganizerHistory(
    organizerId: EntityId,
    query?: PaginationQuery,
  ): Promise<PaginatedResult<OrganizerRoomHistoryItem>>;
  getOrganizerSummary(organizerId: EntityId): Promise<OrganizerHistorySummary>;
  getRoomResults(organizerId: EntityId, roomId: EntityId): Promise<RoomResults | null>;
}
