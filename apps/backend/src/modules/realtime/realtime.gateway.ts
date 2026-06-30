import type { EntityId } from "../../core/types";
import type {
  RealtimeClient,
  RealtimeConnection,
  RealtimeEvent,
  RealtimeGateway,
} from "./realtime.interfaces";

interface RegisteredConnection {
  connection: RealtimeConnection;
  client: RealtimeClient;
}

export class InMemoryRealtimeGateway implements RealtimeGateway {
  private readonly connectionsById = new Map<string, RegisteredConnection>();
  private readonly connectionIdsByRoomId = new Map<EntityId, Set<string>>();
  private readonly organizerConnectionIdsByRoomId = new Map<EntityId, Set<string>>();
  private readonly connectionIdsByParticipantId = new Map<EntityId, Set<string>>();

  registerConnection(connection: RealtimeConnection, client: RealtimeClient): void {
    this.unregisterConnection(connection.id);
    this.connectionsById.set(connection.id, { connection, client });
    this.addToIndex(this.connectionIdsByRoomId, connection.roomId, connection.id);

    if (connection.isOrganizer) {
      this.addToIndex(this.organizerConnectionIdsByRoomId, connection.roomId, connection.id);
    }

    if (connection.roomParticipantId) {
      this.addToIndex(
        this.connectionIdsByParticipantId,
        connection.roomParticipantId,
        connection.id,
      );
    }
  }

  unregisterConnection(connectionId: string): void {
    const registeredConnection = this.connectionsById.get(connectionId);

    if (!registeredConnection) {
      return;
    }

    const { connection } = registeredConnection;

    this.connectionsById.delete(connectionId);
    this.removeFromIndex(this.connectionIdsByRoomId, connection.roomId, connectionId);
    this.removeFromIndex(this.organizerConnectionIdsByRoomId, connection.roomId, connectionId);

    if (connection.roomParticipantId) {
      this.removeFromIndex(
        this.connectionIdsByParticipantId,
        connection.roomParticipantId,
        connectionId,
      );
    }
  }

  getActiveParticipantIds(roomId: EntityId): EntityId[] {
    const participantIds = new Set<EntityId>();

    for (const registeredConnection of this.connectionsById.values()) {
      const { connection } = registeredConnection;

      if (
        connection.roomId === roomId &&
        !connection.isOrganizer &&
        connection.roomParticipantId
      ) {
        participantIds.add(connection.roomParticipantId);
      }
    }

    return [...participantIds];
  }

  publishToRoom(roomId: EntityId, event: RealtimeEvent): void {
    this.publishToConnections(this.connectionIdsByRoomId.get(roomId), event);
  }

  publishToOrganizer(roomId: EntityId, event: RealtimeEvent): void {
    this.publishToConnections(this.organizerConnectionIdsByRoomId.get(roomId), event);
  }

  publishToParticipant(roomParticipantId: EntityId, event: RealtimeEvent): void {
    this.publishToConnections(this.connectionIdsByParticipantId.get(roomParticipantId), event);
  }

  private publishToConnections(connectionIds: Set<string> | undefined, event: RealtimeEvent): void {
    if (!connectionIds?.size) {
      return;
    }

    const payload = JSON.stringify(event);

    for (const connectionId of connectionIds) {
      const registeredConnection = this.connectionsById.get(connectionId);

      if (!registeredConnection) {
        continue;
      }

      registeredConnection.client.send(payload);
    }
  }

  private addToIndex(index: Map<EntityId, Set<string>>, key: EntityId, connectionId: string): void {
    const connectionIds = index.get(key) ?? new Set<string>();

    connectionIds.add(connectionId);
    index.set(key, connectionIds);
  }

  private removeFromIndex(index: Map<EntityId, Set<string>>, key: EntityId, connectionId: string): void {
    const connectionIds = index.get(key);

    if (!connectionIds) {
      return;
    }

    connectionIds.delete(connectionId);

    if (!connectionIds.size) {
      index.delete(key);
    }
  }
}
