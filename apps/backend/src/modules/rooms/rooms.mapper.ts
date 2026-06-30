import type { EntityId } from "../../core/types";
import type { AnswerMode, ParticipantStatus, RoomStatus } from "../../generated/prisma/enums";
import type {
  LeaderboardItem,
  LiveAnswerOption,
  LiveQuestion,
  RoomParticipantDetails,
  RoomSummary,
} from "./rooms.interfaces";

export interface RoomRecord {
  id: string;
  quizId: string;
  organizerId: string;
  status: RoomStatus;
  currentQuestionId: string | null;
}

export interface RoomParticipantRecord {
  id: string;
  userId: string | null;
  displayName: string;
  status: ParticipantStatus;
  score: number;
  correctAnswersCount: number;
  totalAnswerTimeMs: number;
}

export interface LiveQuestionRecord {
  id: string;
  text: string;
  imageUrl: string | null;
  answerMode: AnswerMode;
  orderIndex: number;
  timeLimitSec: number;
  points: number;
  answerOptions: LiveAnswerOptionRecord[];
}

export interface LiveAnswerOptionRecord {
  id: string;
  text: string;
  orderIndex: number;
}

export class RoomMapper {
  static toRoomSummary(room: RoomRecord): RoomSummary {
    return {
      id: room.id,
      quizId: room.quizId,
      organizerId: room.organizerId,
      status: room.status,
      currentQuestionId: room.currentQuestionId,
      inviteUrl: this.toInviteUrl(room.id),
    };
  }

  static toRoomParticipantDetails(participant: RoomParticipantRecord): RoomParticipantDetails {
    return {
      id: participant.id,
      userId: participant.userId,
      displayName: participant.displayName,
      status: participant.status,
      score: participant.score,
      correctAnswersCount: participant.correctAnswersCount,
      totalAnswerTimeMs: participant.totalAnswerTimeMs,
    };
  }

  static toLeaderboardItem(participant: RoomParticipantRecord): LeaderboardItem {
    return {
      roomParticipantId: participant.id,
      displayName: participant.displayName,
      score: participant.score,
      correctAnswersCount: participant.correctAnswersCount,
      totalAnswerTimeMs: participant.totalAnswerTimeMs,
    };
  }

  static toLiveQuestion(question: LiveQuestionRecord, startedAt: Date): LiveQuestion {
    const endsAt = new Date(startedAt.getTime() + question.timeLimitSec * 1000);

    return {
      id: question.id,
      text: question.text,
      imageUrl: question.imageUrl,
      answerMode: question.answerMode,
      orderIndex: question.orderIndex,
      timeLimitSec: question.timeLimitSec,
      points: question.points,
      answerOptions: question.answerOptions.map((option) => this.toLiveAnswerOption(option)),
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };
  }

  private static toLiveAnswerOption(option: LiveAnswerOptionRecord): LiveAnswerOption {
    return {
      id: option.id,
      text: option.text,
      orderIndex: option.orderIndex,
    };
  }

  private static toInviteUrl(roomId: EntityId): string {
    return `/rooms/${roomId}`;
  }
}
