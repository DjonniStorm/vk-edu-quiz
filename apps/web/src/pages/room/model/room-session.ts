export interface RoomParticipantSession {
  roomParticipantId: string;
  displayName: string;
}

const buildStorageKey = (roomId: string) => `vk-edu-quiz-room-participant:${roomId}`;

export const roomSessionStorage = {
  get(roomId: string): RoomParticipantSession | null {
    const raw = sessionStorage.getItem(buildStorageKey(roomId));

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as RoomParticipantSession;
    } catch {
      return null;
    }
  },

  set(roomId: string, session: RoomParticipantSession): void {
    sessionStorage.setItem(buildStorageKey(roomId), JSON.stringify(session));
  },

  clear(roomId: string): void {
    sessionStorage.removeItem(buildStorageKey(roomId));
  },
};
