import type { EntityId, PaginatedResult, PaginationQuery } from "../../core/types";
import type { PrismaClient } from "../../generated/prisma/client";
import { RoomStatus } from "../../generated/prisma/enums";
import type {
  HistoryService,
  OrganizerHistorySummary,
  OrganizerRoomHistoryItem,
  ParticipantQuizHistoryItem,
  RoomResults,
} from "./history.interfaces";
import { HistoryMapper } from "./history.mapper";

export class HistoryServiceImpl implements HistoryService {
  constructor(private readonly prisma: PrismaClient) {}

  async listParticipantHistory(
    userId: EntityId,
    query: PaginationQuery = {},
  ): Promise<PaginatedResult<ParticipantQuizHistoryItem>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const where = {
      userId,
      room: {
        status: RoomStatus.FINISHED,
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.roomParticipant.findMany({
        where,
        orderBy: {
          room: {
            finishedAt: "desc",
          },
        },
        skip: offset,
        take: limit,
        select: {
          score: true,
          correctAnswersCount: true,
          room: {
            select: {
              id: true,
              quizId: true,
              finishedAt: true,
              quiz: {
                select: { title: true },
              },
            },
          },
        },
      }),
      this.prisma.roomParticipant.count({ where }),
    ]);

    return {
      items: items.map((item) => HistoryMapper.toParticipantHistoryItem(item)),
      total,
      limit,
      offset,
    };
  }

  async listOrganizerHistory(
    organizerId: EntityId,
    query: PaginationQuery = {},
  ): Promise<PaginatedResult<OrganizerRoomHistoryItem>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const where = {
      organizerId,
      status: RoomStatus.FINISHED,
    };

    const [items, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        orderBy: { finishedAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          quizId: true,
          startedAt: true,
          finishedAt: true,
          quiz: {
            select: { title: true },
          },
          _count: {
            select: { roomParticipants: true },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    return {
      items: items.map((item) => HistoryMapper.toOrganizerHistoryItem(item)),
      total,
      limit,
      offset,
    };
  }

  async getOrganizerSummary(organizerId: EntityId): Promise<OrganizerHistorySummary> {
    const completedSessions = await this.prisma.room.count({
      where: {
        organizerId,
        status: RoomStatus.FINISHED,
      },
    });

    const participantStats = await this.prisma.roomParticipant.aggregate({
      where: {
        room: {
          organizerId,
          status: RoomStatus.FINISHED,
        },
      },
      _count: { _all: true },
      _avg: { score: true },
    });

    return {
      completedSessions,
      totalParticipants: participantStats._count._all,
      averageScore: participantStats._avg.score ?? 0,
    };
  }

  async getRoomResults(organizerId: EntityId, roomId: EntityId): Promise<RoomResults | null> {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        organizerId,
        status: RoomStatus.FINISHED,
      },
      select: {
        id: true,
        quizId: true,
        quiz: {
          select: { title: true },
        },
      },
    });

    if (!room) {
      return null;
    }

    const participants = await this.prisma.roomParticipant.findMany({
      where: { roomId },
      orderBy: [
        { score: "desc" },
        { totalAnswerTimeMs: "asc" },
        { joinedAt: "asc" },
      ],
      select: {
        id: true,
        displayName: true,
        score: true,
        correctAnswersCount: true,
        totalAnswerTimeMs: true,
      },
    });
    const leaderboard = participants.map((participant) => ({
      roomParticipantId: participant.id,
      displayName: participant.displayName,
      score: participant.score,
      correctAnswersCount: participant.correctAnswersCount,
      totalAnswerTimeMs: participant.totalAnswerTimeMs,
    }));

    return HistoryMapper.toRoomResults(room, leaderboard);
  }
}
