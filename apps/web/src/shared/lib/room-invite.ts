import { entityIdSchema } from "@quiz/shared";

export const parseRoomIdFromInviteInput = (input: string): string | null => {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/rooms\/([^/]+)/);

    if (match?.[1]) {
      const parsed = entityIdSchema.safeParse(match[1]);

      if (parsed.success) {
        return parsed.data;
      }
    }
  } catch {
    // not a URL — try raw UUID below
  }

  const parsed = entityIdSchema.safeParse(trimmed);

  return parsed.success ? parsed.data : null;
};
