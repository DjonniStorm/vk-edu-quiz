import { entityIdSchema, roomCodeSchema } from "@quiz/shared";

const parsePathSegment = (segment: string): string | null => {
  const uuid = entityIdSchema.safeParse(segment);

  if (uuid.success) {
    return uuid.data;
  }

  const code = roomCodeSchema.safeParse(segment);

  return code.success ? code.data : null;
};

export const parseRoomInviteInput = (input: string): string | null => {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/rooms\/([^/]+)/);

    if (match?.[1]) {
      return parsePathSegment(match[1]);
    }
  } catch {
    // not a URL — try raw identifier below
  }

  return parsePathSegment(trimmed);
};

/** @deprecated Use parseRoomInviteInput */
export const parseRoomIdFromInviteInput = parseRoomInviteInput;
