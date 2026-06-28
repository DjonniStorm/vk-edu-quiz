import type { LeaderboardItem } from "../rooms/rooms.interfaces";
import type {
  OrganizerRoomHistoryItem,
  ParticipantQuizHistoryItem,
  RoomResults,
} from "./history.interfaces";

export interface ParticipantHistoryRecord {
  room: {
    id: string;
    quizId: string;
    finishedAt: Date | null;
    quiz: {
      title: string;
    };
  };
  score: number;
  correctAnswersCount: number;
}

export interface OrganizerHistoryRecord {
  id: string;
  quizId: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  quiz: {
    title: string;
  };
  _count: {
    roomParticipants: number;
  };
}

export interface RoomResultsRecord {
  id: string;
  quizId: string;
  quiz: {
    title: string;
  };
}

export class HistoryMapper {
  static toParticipantHistoryItem(record: ParticipantHistoryRecord): ParticipantQuizHistoryItem {
    return {
      roomId: record.room.id,
      quizId: record.room.quizId,
      quizTitle: record.room.quiz.title,
      score: record.score,
      correctAnswersCount: record.correctAnswersCount,
      finishedAt: record.room.finishedAt?.toISOString() ?? null,
    };
  }

  static toOrganizerHistoryItem(record: OrganizerHistoryRecord): OrganizerRoomHistoryItem {
    return {
      roomId: record.id,
      quizId: record.quizId,
      quizTitle: record.quiz.title,
      participantsCount: record._count.roomParticipants,
      startedAt: record.startedAt?.toISOString() ?? null,
      finishedAt: record.finishedAt?.toISOString() ?? null,
    };
  }

  static toRoomResults(record: RoomResultsRecord, leaderboard: LeaderboardItem[]): RoomResults {
    return {
      roomId: record.id,
      quizId: record.quizId,
      quizTitle: record.quiz.title,
      leaderboard,
    };
  }
}
