import type {
  AppAnswerMode,
  AppParticipantStatus,
  AppRoomStatus,
  EntityId,
  IsoDateString,
} from "../../core/types";

export interface CreateRoomInput {
  quizId: EntityId;
}

export interface JoinRoomInput {
  userId?: EntityId | null;
  displayName: string;
}

export interface SubmitAnswerInput {
  roomParticipantId: EntityId;
  questionId: EntityId;
  answerOptionIds: EntityId[];
  answerTimeMs: number;
}

export interface RoomSummary {
  id: EntityId;
  code: string;
  quizId: EntityId;
  organizerId: EntityId;
  status: AppRoomStatus;
  currentQuestionId: EntityId | null;
  inviteUrl: string;
}

export interface RoomParticipantDetails {
  id: EntityId;
  userId: EntityId | null;
  displayName: string;
  status: AppParticipantStatus;
  score: number;
  correctAnswersCount: number;
  totalAnswerTimeMs: number;
}

export interface LiveQuestion {
  id: EntityId;
  text: string;
  imageUrl: string | null;
  answerMode: AppAnswerMode;
  orderIndex: number;
  timeLimitSec: number;
  points: number;
  answerOptions: LiveAnswerOption[];
  startedAt: IsoDateString;
  endsAt: IsoDateString;
}

export interface LiveAnswerOption {
  id: EntityId;
  text: string;
  orderIndex: number;
}

export interface LeaderboardItem {
  roomParticipantId: EntityId;
  displayName: string;
  score: number;
  correctAnswersCount: number;
  totalAnswerTimeMs: number;
}

export interface AnswerResult {
  id: EntityId;
  isCorrect: boolean;
  points: number;
}

export interface CurrentQuestionState {
  question: LiveQuestion | null;
  answeredCount: number;
  participantHasAnswered: boolean;
}

export interface AnswerSubmission {
  displayName: string;
  email: string | null;
  answerOptionIds: EntityId[];
}

export type HostQuestionPhase = "live" | "revealing";

export interface HostQuestionState {
  question: LiveQuestion | null;
  answeredCount: number;
  activeParticipantCount: number;
  submissions: AnswerSubmission[];
  phase: HostQuestionPhase;
  correctOptionIds?: EntityId[];
}

export interface HostParticipant {
  id: EntityId;
  displayName: string;
  email: string | null;
  status: AppParticipantStatus;
}

export interface RoomService {
  createRoom(organizerId: EntityId, input: CreateRoomInput): Promise<RoomSummary>;
  getRoom(identifier: string): Promise<RoomSummary | null>;
  getCurrentQuestion(
    identifier: string,
    roomParticipantId?: EntityId,
  ): Promise<CurrentQuestionState>;
  getHostState(organizerId: EntityId, identifier: string): Promise<HostQuestionState>;
  getHostParticipants(organizerId: EntityId, identifier: string): Promise<HostParticipant[]>;
  joinRoom(identifier: string, input: JoinRoomInput): Promise<RoomParticipantDetails>;
  leaveRoom(roomParticipantId: EntityId): Promise<void>;
  startRoom(organizerId: EntityId, identifier: string): Promise<LiveQuestion | null>;
  showQuestion(
    organizerId: EntityId,
    identifier: string,
    questionId: EntityId,
  ): Promise<LiveQuestion>;
  advanceQuestion(organizerId: EntityId, identifier: string): Promise<{ ok: true }>;
  submitAnswer(identifier: string, input: SubmitAnswerInput): Promise<AnswerResult>;
  getLeaderboard(identifier: string): Promise<LeaderboardItem[]>;
  finishRoom(organizerId: EntityId, identifier: string): Promise<LeaderboardItem[]>;
}
