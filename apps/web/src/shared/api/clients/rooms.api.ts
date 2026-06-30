import type {
  CurrentQuestionStateDto,
  LeaderboardItemDto,
  LiveQuestionDto,
  RoomParticipantDto,
  RoomSummaryDto,
} from "@quiz/shared";

import { BaseApi } from "../base-api";

export interface CreateRoomInput {
  quizId: string;
}

export interface JoinRoomInput {
  displayName: string;
}

export interface ShowQuestionInput {
  questionId: string;
}

export interface SubmitAnswerInput {
  roomParticipantId: string;
  questionId: string;
  answerOptionIds: string[];
  answerTimeMs: number;
}

export interface AnswerResultDto {
  id: string;
  isCorrect: boolean;
  points: number;
}

class RoomsApi extends BaseApi {
  private static instance: RoomsApi;

  private constructor() {
    super("/rooms");
  }

  static getInstance(): RoomsApi {
    if (!RoomsApi.instance) {
      RoomsApi.instance = new RoomsApi();
    }

    return RoomsApi.instance;
  }

  async create(input: CreateRoomInput): Promise<RoomSummaryDto> {
    const { data } = await this.post<RoomSummaryDto>("/", input, {
      meta: { level: "blocking" },
    });

    return data;
  }

  async getRoom(roomId: string): Promise<RoomSummaryDto | null> {
    const { data } = await this.get<RoomSummaryDto | null>(`/${roomId}`, {
      meta: { level: "blocking" },
    });

    return data;
  }

  async getCurrentQuestion(
    roomId: string,
    roomParticipantId?: string,
  ): Promise<CurrentQuestionStateDto> {
    const { data } = await this.get<CurrentQuestionStateDto>(`/${roomId}/current-question`, {
      params: roomParticipantId ? { roomParticipantId } : undefined,
      meta: { level: "non-blocking" },
    });

    return data;
  }

  async join(roomId: string, input: JoinRoomInput): Promise<RoomParticipantDto> {
    const { data } = await this.post<RoomParticipantDto>(`/${roomId}/join`, input, {
      meta: { level: "blocking" },
    });

    return data;
  }

  async start(roomId: string): Promise<LiveQuestionDto | null> {
    const { data } = await this.post<LiveQuestionDto | null>(`/${roomId}/start`, undefined, {
      meta: { level: "blocking" },
    });

    return data;
  }

  async showQuestion(roomId: string, input: ShowQuestionInput): Promise<LiveQuestionDto> {
    const { data } = await this.post<LiveQuestionDto>(
      `/${roomId}/questions/show`,
      input,
      { meta: { level: "blocking" } },
    );

    return data;
  }

  async submitAnswer(roomId: string, input: SubmitAnswerInput): Promise<AnswerResultDto> {
    const { data } = await this.post<AnswerResultDto>(`/${roomId}/answers`, input, {
      meta: { level: "blocking" },
    });

    return data;
  }

  async getLeaderboard(roomId: string): Promise<LeaderboardItemDto[]> {
    const { data } = await this.get<LeaderboardItemDto[]>(`/${roomId}/leaderboard`, {
      meta: { level: "non-blocking" },
    });

    return data;
  }

  async finish(roomId: string): Promise<LeaderboardItemDto[]> {
    const { data } = await this.post<LeaderboardItemDto[]>(`/${roomId}/finish`, undefined, {
      meta: { level: "blocking" },
    });

    return data;
  }
}

export const roomsApi = RoomsApi.getInstance();
