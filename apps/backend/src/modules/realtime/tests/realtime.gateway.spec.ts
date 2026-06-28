import { describe, expect, it } from "vitest";

import { InMemoryRealtimeGateway } from "../realtime.gateway";
import type { RealtimeClient, RealtimeEvent } from "../realtime.interfaces";
import { RealtimeEventType } from "../realtime.interfaces";

class CapturingRealtimeClient implements RealtimeClient {
  readonly events: RealtimeEvent[] = [];
  closedWith: { code?: number; reason?: string } | null = null;

  send(payload: string): void {
    this.events.push(JSON.parse(payload) as RealtimeEvent);
  }

  close(code?: number, reason?: string): void {
    this.closedWith = { code, reason };
  }
}

const createAnswerSubmittedEvent = (roomId: string, answeredCount: number): RealtimeEvent => ({
  type: RealtimeEventType.AnswerSubmitted,
  roomId,
  answeredCount,
});

const createRoomFinishedEvent = (roomId: string): RealtimeEvent => ({
  type: RealtimeEventType.RoomFinished,
  roomId,
  leaderboard: [],
});

describe("InMemoryRealtimeGateway", () => {
  it("отправляет события комнаты, организатора и участника нужным клиентам", () => {
    const gateway = new InMemoryRealtimeGateway();
    const roomId = crypto.randomUUID();
    const anotherRoomId = crypto.randomUUID();
    const roomParticipantId = crypto.randomUUID();
    const organizerClient = new CapturingRealtimeClient();
    const participantClient = new CapturingRealtimeClient();
    const anotherRoomClient = new CapturingRealtimeClient();

    gateway.registerConnection(
      { id: "organizer", roomId, isOrganizer: true },
      organizerClient,
    );
    gateway.registerConnection(
      { id: "participant", roomId, roomParticipantId, isOrganizer: false },
      participantClient,
    );
    gateway.registerConnection(
      { id: "another-room-participant", roomId: anotherRoomId, isOrganizer: false },
      anotherRoomClient,
    );

    gateway.publishToRoom(roomId, createAnswerSubmittedEvent(roomId, 1));
    gateway.publishToOrganizer(roomId, createAnswerSubmittedEvent(roomId, 2));
    gateway.publishToParticipant(roomParticipantId, createRoomFinishedEvent(roomId));

    expect(organizerClient.events.map((event) => event.type)).toEqual([
      RealtimeEventType.AnswerSubmitted,
      RealtimeEventType.AnswerSubmitted,
    ]);
    expect(participantClient.events.map((event) => event.type)).toEqual([
      RealtimeEventType.AnswerSubmitted,
      RealtimeEventType.RoomFinished,
    ]);
    expect(anotherRoomClient.events).toHaveLength(0);
  });

  it("удаляет соединение из всех индексов после unregister", () => {
    const gateway = new InMemoryRealtimeGateway();
    const roomId = crypto.randomUUID();
    const roomParticipantId = crypto.randomUUID();
    const client = new CapturingRealtimeClient();

    gateway.registerConnection(
      { id: "participant", roomId, roomParticipantId, isOrganizer: false },
      client,
    );
    gateway.unregisterConnection("participant");

    gateway.publishToRoom(roomId, createAnswerSubmittedEvent(roomId, 1));
    gateway.publishToParticipant(roomParticipantId, createRoomFinishedEvent(roomId));

    expect(client.events).toHaveLength(0);
  });

  it("переносит существующий connection id в новую комнату при повторной регистрации", () => {
    const gateway = new InMemoryRealtimeGateway();
    const firstRoomId = crypto.randomUUID();
    const secondRoomId = crypto.randomUUID();
    const client = new CapturingRealtimeClient();

    gateway.registerConnection({ id: "same-id", roomId: firstRoomId, isOrganizer: false }, client);
    gateway.registerConnection({ id: "same-id", roomId: secondRoomId, isOrganizer: false }, client);

    gateway.publishToRoom(firstRoomId, createAnswerSubmittedEvent(firstRoomId, 1));
    gateway.publishToRoom(secondRoomId, createAnswerSubmittedEvent(secondRoomId, 1));

    expect(client.events).toHaveLength(1);
    expect(client.events[0]?.roomId).toBe(secondRoomId);
  });
});
