import { entityIdSchema, roomCodeSchema } from "@quiz/shared";
import { customAlphabet } from "nanoid";

import type { PrismaClient } from "../../generated/prisma/client";

export const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const ROOM_CODE_LENGTH = 6;

const createRoomCode = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH);

export const generateRoomCode = (): string => createRoomCode();

export const isRoomUuid = (value: string): boolean => entityIdSchema.safeParse(value.trim()).success;

export const normalizeRoomCode = (value: string): string => value.trim().toUpperCase();

export const resolveRoomRecord = async (prisma: PrismaClient, identifier: string) => {
  const trimmed = identifier.trim();

  if (isRoomUuid(trimmed)) {
    return prisma.room.findUnique({ where: { id: trimmed } });
  }

  const code = normalizeRoomCode(trimmed);

  if (!roomCodeSchema.safeParse(code).success) {
    return null;
  }

  return prisma.room.findUnique({ where: { code } });
};
