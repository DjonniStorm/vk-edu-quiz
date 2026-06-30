import { RealtimeEventType } from "@quiz/shared";

import type { EntityId } from "../../core/types";
import type {
  LeaderboardItem,
  LiveQuestion,
  RoomParticipantDetails,
} from "../rooms/rooms.interfaces";

export { RealtimeEventType } from "@quiz/shared";

export interface AnswerSubmissionEvent {
  roomParticipantId: EntityId;
  displayName: string;
  email: string | null;
  answerOptionIds: EntityId[];
}

export type RealtimeEvent =
  | { type: RealtimeEventType.RoomStarted; roomId: EntityId; question: LiveQuestion | null }
  | { type: RealtimeEventType.QuestionShown; roomId: EntityId; question: LiveQuestion }
  | { type: RealtimeEventType.ParticipantJoined; roomId: EntityId; participant: RoomParticipantDetails }
  | {
      type: RealtimeEventType.AnswerSubmitted;
      roomId: EntityId;
      answeredCount: number;
      activeParticipantCount: number;
      submission: AnswerSubmissionEvent;
    }
  | {
      type: RealtimeEventType.QuestionRevealed;
      roomId: EntityId;
      questionId: EntityId;
      correctOptionIds: EntityId[];
    }
  | { type: RealtimeEventType.LeaderboardUpdated; roomId: EntityId; leaderboard: LeaderboardItem[] }
  | { type: RealtimeEventType.RoomFinished; roomId: EntityId; leaderboard: LeaderboardItem[] };

export interface RealtimeConnection {
  id: string;
  roomId: EntityId;
  roomParticipantId?: EntityId;
  isOrganizer: boolean;
}

export interface RealtimeClient {
  send(payload: string): void;
  close(code?: number, reason?: string): void;
}

export interface RealtimeGateway {
  registerConnection(connection: RealtimeConnection, client: RealtimeClient): void;
  unregisterConnection(connectionId: string): void;
  getActiveParticipantIds(roomId: EntityId): EntityId[];
  publishToRoom(roomId: EntityId, event: RealtimeEvent): void;
  publishToOrganizer(roomId: EntityId, event: RealtimeEvent): void;
  publishToParticipant(roomParticipantId: EntityId, event: RealtimeEvent): void;
}
