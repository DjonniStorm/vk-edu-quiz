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

export interface RoomService {
  createRoom(organizerId: EntityId, input: CreateRoomInput): Promise<RoomSummary>;
  getRoom(roomId: EntityId): Promise<RoomSummary | null>;
  getCurrentQuestion(
    roomId: EntityId,
    roomParticipantId?: EntityId,
  ): Promise<CurrentQuestionState>;
  joinRoom(roomId: EntityId, input: JoinRoomInput): Promise<RoomParticipantDetails>;
  leaveRoom(roomParticipantId: EntityId): Promise<void>;
  startRoom(organizerId: EntityId, roomId: EntityId): Promise<LiveQuestion | null>;
  showQuestion(organizerId: EntityId, roomId: EntityId, questionId: EntityId): Promise<LiveQuestion>;
  submitAnswer(roomId: EntityId, input: SubmitAnswerInput): Promise<AnswerResult>;
  getLeaderboard(roomId: EntityId): Promise<LeaderboardItem[]>;
  finishRoom(organizerId: EntityId, roomId: EntityId): Promise<LeaderboardItem[]>;
}
