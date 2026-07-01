import type {
  LeaderboardItemDto,
  LiveQuestionDto,
  RoomParticipantDto,
} from "@quiz/shared";
import { RealtimeEventType, SessionRole } from "@quiz/shared";

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
        email: string | null;
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
  private authFailureHandler: (() => void) | null = null;
  private roomId: string | null = null;
  private role: SessionRole | null = null;
  private roomParticipantId: string | null = null;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  onEvent(handler: EventHandler): void {
    this.handler = handler;
  }

  onConnectionChange(handler: ConnectionHandler): void {
    this.connectionHandler = handler;
  }

  onAuthFailure(handler: () => void): void {
    this.authFailureHandler = handler;
  }

  connectOrganizer(roomId: string): void {
    this.connect(roomId, SessionRole.Organizer);
  }

  connectParticipant(roomId: string, roomParticipantId: string): void {
    this.roomParticipantId = roomParticipantId;
    this.connect(roomId, SessionRole.Participant);
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
    this.authFailureHandler = null;
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private connect(roomId: string, role: SessionRole): void {
    this.disposed = false;
    this.roomId = roomId;
    this.role = role;

    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
    }

    const params = new URLSearchParams({ role });

    if (role === SessionRole.Participant && this.roomParticipantId) {
      params.set("roomParticipantId", this.roomParticipantId);
    }

    const url = `${env.wsBaseUrl}/realtime/rooms/${roomId}?${params.toString()}`;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      if (role === SessionRole.Organizer) {
        const accessToken = authTokenStorage.getAccessToken();

        if (!accessToken) {
          socket.close(4401, "No access token");
          return;
        }

        socket.send(JSON.stringify({ type: "auth", token: accessToken }));
      }

      // `wsConnected` flips to true only once the server acks with
      // {type:"connected"} - for organizers that happens after auth
      // resolves, so a raw socket handshake alone must not count as
      // "connected" (otherwise the UI looks live for up to 5s before the
      // auth result is actually known).
    };

    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(String(message.data)) as { type?: string };

        if (event?.type === "connected") {
          this.connectionHandler?.(true);
          return;
        }

        if (event && "type" in event && event.type) {
          this.handler?.(event as RoomRealtimeEvent);
        }
      } catch {
        // ignore malformed payloads
      }
    };

    socket.onclose = (event) => {
      this.connectionHandler?.(false);
      this.socket = null;

      const isAuthFailure = event.code === 4401;

      if (isAuthFailure) {
        this.authFailureHandler?.();
        return;
      }

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

      if (this.role === SessionRole.Organizer) {
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
