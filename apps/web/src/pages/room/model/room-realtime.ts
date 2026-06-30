import type {
  LeaderboardItemDto,
  LiveQuestionDto,
  RoomParticipantDto,
} from "@quiz/shared";
import { RealtimeEventType } from "@quiz/shared";

import { authTokenStorage } from "@/shared/api/http-client";
import { env } from "@/shared/config/env";

export type RoomRealtimeEvent =
  | { type: RealtimeEventType.RoomStarted; roomId: string; question: LiveQuestionDto | null }
  | { type: RealtimeEventType.QuestionShown; roomId: string; question: LiveQuestionDto }
  | {
      type: RealtimeEventType.ParticipantJoined;
      roomId: string;
      participant: RoomParticipantDto;
    }
  | {
      type: RealtimeEventType.AnswerSubmitted;
      roomId: string;
      answeredCount: number;
      activeParticipantCount: number;
      submission: {
        roomParticipantId: string;
        displayName: string;
        answerOptionIds: string[];
      };
    }
  | {
      type: RealtimeEventType.QuestionRevealed;
      roomId: string;
      questionId: string;
      correctOptionIds: string[];
    }
  | {
      type: RealtimeEventType.LeaderboardUpdated;
      roomId: string;
      leaderboard: LeaderboardItemDto[];
    }
  | { type: RealtimeEventType.RoomFinished; roomId: string; leaderboard: LeaderboardItemDto[] };

type EventHandler = (event: RoomRealtimeEvent) => void;
type ConnectionHandler = (isConnected: boolean) => void;

const RECONNECT_DELAY_MS = 2000;

export class RoomRealtimeClient {
  private socket: WebSocket | null = null;
  private handler: EventHandler | null = null;
  private connectionHandler: ConnectionHandler | null = null;
  private roomId: string | null = null;
  private role: "organizer" | "participant" | null = null;
  private roomParticipantId: string | null = null;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  onEvent(handler: EventHandler): void {
    this.handler = handler;
  }

  onConnectionChange(handler: ConnectionHandler): void {
    this.connectionHandler = handler;
  }

  connectOrganizer(roomId: string): void {
    this.connect(roomId, "organizer");
  }

  connectParticipant(roomId: string, roomParticipantId: string): void {
    this.roomParticipantId = roomParticipantId;
    this.connect(roomId, "participant");
  }

  disconnect(): void {
    this.disposed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }

    this.roomId = null;
    this.role = null;
    this.roomParticipantId = null;
    this.handler = null;
    this.connectionHandler = null;
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private connect(roomId: string, role: "organizer" | "participant"): void {
    this.disposed = false;
    this.roomId = roomId;
    this.role = role;

    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
    }

    const params = new URLSearchParams({ role });

    if (role === "participant" && this.roomParticipantId) {
      params.set("roomParticipantId", this.roomParticipantId);
    }

    if (role === "organizer") {
      const accessToken = authTokenStorage.getAccessToken();

      if (accessToken) {
        params.set("token", accessToken);
      }
    }

    const url = `${env.wsBaseUrl}/realtime/rooms/${roomId}?${params.toString()}`;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.connectionHandler?.(true);
    };

    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(String(message.data)) as RoomRealtimeEvent;

        if ("type" in event && event.type) {
          this.handler?.(event);
        }
      } catch {
        // ignore malformed payloads
      }
    };

    socket.onclose = () => {
      this.connectionHandler?.(false);
      this.socket = null;

      if (!this.disposed && this.roomId && this.role) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.roomId || !this.role) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      if (this.disposed || !this.roomId || !this.role) {
        return;
      }

      if (this.role === "organizer") {
        this.connectOrganizer(this.roomId);
        return;
      }

      if (this.roomParticipantId) {
        this.connectParticipant(this.roomId, this.roomParticipantId);
      }
    }, RECONNECT_DELAY_MS);
  }
}

export const roomRealtimeClient = new RoomRealtimeClient();
