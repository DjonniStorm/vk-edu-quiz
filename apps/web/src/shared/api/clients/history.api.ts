import type {
  OrganizerHistorySummaryDto,
  OrganizerRoomHistoryItemDto,
  PaginatedResult,
  PaginationQuery,
  ParticipantQuizHistoryItemDto,
  RoomResultsDto,
} from "@quiz/shared";

import { BaseApi } from "../base-api";

export type ListParticipantHistoryQuery = PaginationQuery;
export type ListOrganizerHistoryQuery = PaginationQuery;

class HistoryApi extends BaseApi {
  private static instance: HistoryApi;

  private constructor() {
    super("/history");
  }

  static getInstance(): HistoryApi {
    if (!HistoryApi.instance) {
      HistoryApi.instance = new HistoryApi();
    }

    return HistoryApi.instance;
  }

  async listParticipant(
    query: ListParticipantHistoryQuery = {},
  ): Promise<PaginatedResult<ParticipantQuizHistoryItemDto>> {
    const { data } = await this.get<PaginatedResult<ParticipantQuizHistoryItemDto>>("/participant", {
      params: query,
      meta: { level: "blocking" },
    });

    return data;
  }

  async getOrganizerSummary(): Promise<OrganizerHistorySummaryDto> {
    const { data } = await this.get<OrganizerHistorySummaryDto>("/organizer/summary", {
      meta: { level: "blocking" },
    });

    return data;
  }

  async listOrganizer(
    query: ListOrganizerHistoryQuery = {},
  ): Promise<PaginatedResult<OrganizerRoomHistoryItemDto>> {
    const { data } = await this.get<PaginatedResult<OrganizerRoomHistoryItemDto>>("/organizer", {
      params: query,
      meta: { level: "blocking" },
    });

    return data;
  }

  async getRoomResults(roomId: string): Promise<RoomResultsDto> {
    const { data } = await this.get<RoomResultsDto>(`/rooms/${roomId}/results`, {
      meta: { level: "blocking" },
    });

    return data;
  }
}

export const historyApi = HistoryApi.getInstance();
