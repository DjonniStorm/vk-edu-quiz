import { Elysia } from "elysia";
import { z } from "zod";

import type { PrismaClient } from "../../generated/prisma/client";
import type { AuthContextProvider } from "../../plugins/auth.interface";
import type { RealtimeGateway } from "./realtime.interfaces";

export interface RealtimeRoutesDeps {
  realtimeGateway: RealtimeGateway;
  authContextProvider: AuthContextProvider;
  prisma: PrismaClient;
}

const realtimeConnectionQuerySchema = z
  .object({
    role: z.enum(["organizer", "participant"]).default("participant"),
    roomParticipantId: z.string().uuid().optional(),
  })
  .refine((value) => value.role === "organizer" || !!value.roomParticipantId, {
    message: "roomParticipantId is required for participant connections",
    path: ["roomParticipantId"],
  });

const wsOrganizerAuthSchema = z.object({
  type: z.literal("auth"),
  token: z.string().min(1),
});

const AUTH_TIMEOUT_MS = 5000;

interface PendingAuth {
  roomId: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

// Elysia recreates a new wrapper object for `ws` on every open/message/close
// call (https://github.com/elysiajs/elysia/issues/1716, unfixed as of 1.4.29),
// so a WeakMap keyed by `ws` cannot correlate state across hooks - lookups in
// `message`/`close` always miss what was stored in `open`. The underlying
// `ws.data` object is the actual per-connection storage Bun keeps alive for
// the socket's lifetime, so we stash our own mutable state there instead.
interface ConnectionState {
  connectionId?: string;
  pendingAuth?: PendingAuth;
}

const getConnectionState = (ws: { data: unknown }): ConnectionState =>
  ws.data as unknown as ConnectionState;

// Elysia's default WS message parser already runs `JSON.parse` on incoming
// text frames that look like JSON (leading `{`, `[`, `"`, etc.) before our
// `message` handler ever sees them, so `rawMessage` here is typically already
// a plain object - not a string. Re-stringifying + re-parsing it (the old
// `JSON.parse(String(rawMessage))` pattern) breaks because `String(object)`
// yields `"[object Object]"`, which isn't valid JSON.
const normalizeIncomingMessage = (rawMessage: unknown): unknown => {
  if (typeof rawMessage !== "string") {
    return rawMessage;
  }

  try {
    return JSON.parse(rawMessage);
  } catch {
    return rawMessage;
  }
};

export const createRealtimeRoutes = ({
  realtimeGateway,
  authContextProvider,
  prisma,
}: RealtimeRoutesDeps) => {
  const registerConnection = (
    ws: { data: unknown; send: (payload: string) => void; close: (code?: number, reason?: string) => void },
    roomId: string,
    roomParticipantId: string | undefined,
    isOrganizer: boolean,
  ) => {
    const connectionId = crypto.randomUUID();
    getConnectionState(ws).connectionId = connectionId;

    realtimeGateway.registerConnection(
      { id: connectionId, roomId, roomParticipantId, isOrganizer },
      {
        send: (payload) => ws.send(payload),
        close: (code, reason) => ws.close(code, reason),
      },
    );

    // explicit ack so the client only flips its "connected" UI state once the
    // connection is actually registered with the gateway, not just once the
    // raw socket handshake completed (organizer auth happens asynchronously
    // after open, so the socket can be "open" for a while before this fires)
    ws.send(JSON.stringify({ type: "connected" }));
  };

  return new Elysia({ prefix: "/realtime" })
    .get("/health", () => ({ status: "ok" }), {
      detail: {
        tags: ["Realtime"],
        summary: "Realtime health check",
        description:
          "WebSocket endpoint: /realtime/rooms/:roomId?role=participant&roomParticipantId=:id " +
          "or ?role=organizer (auth token sent as first message: {type:'auth',token:'...'})",
      },
    })
    .ws("/rooms/:roomId", {
      open: (ws) => {
        const roomId = ws.data.params.roomId;
        const query = realtimeConnectionQuerySchema.safeParse(ws.data.query);

        if (!query.success) {
          ws.send(
            JSON.stringify({
              error: {
                code: "VALIDATION_ERROR",
                message: "Invalid realtime connection params",
                issues: query.error.issues,
              },
            }),
          );
          ws.close(1008, "Invalid realtime connection params");

          return;
        }

        if (query.data.role === "organizer") {
          const timeoutId = setTimeout(() => {
            const state = getConnectionState(ws);

            if (state.pendingAuth) {
              state.pendingAuth = undefined;
              ws.close(4401, "Auth timeout");
            }
          }, AUTH_TIMEOUT_MS);

          getConnectionState(ws).pendingAuth = { roomId, timeoutId };

          return;
        }

        registerConnection(ws, roomId, query.data.roomParticipantId, false);
      },

      message: async (ws, rawMessage) => {
        const state = getConnectionState(ws);
        const pending = state.pendingAuth;

        if (!pending) {
          return;
        }

        clearTimeout(pending.timeoutId);
        state.pendingAuth = undefined;

        let parsed: z.infer<typeof wsOrganizerAuthSchema>;

        try {
          parsed = wsOrganizerAuthSchema.parse(normalizeIncomingMessage(rawMessage));
        } catch (error) {
          console.warn("[realtime] organizer WS auth message invalid", error);
          ws.close(4401, "Invalid auth message");

          return;
        }

        try {
          const [currentUser, room] = await Promise.all([
            authContextProvider.getCurrentUser(`Bearer ${parsed.token}`),
            prisma.room.findUnique({
              where: { id: pending.roomId },
              select: { organizerId: true },
            }),
          ]);

          if (!currentUser || !room || room.organizerId !== currentUser.id) {
            console.warn("[realtime] organizer WS auth rejected", {
              roomId: pending.roomId,
              hasCurrentUser: !!currentUser,
              currentUserId: currentUser?.id,
              hasRoom: !!room,
              roomOrganizerId: room?.organizerId,
            });
            ws.close(4401, "Unauthorized organizer connection");

            return;
          }

          registerConnection(ws, pending.roomId, undefined, true);
        } catch (error) {
          // any auth/db failure should still terminate the handshake explicitly
          // instead of leaving the socket open and unregistered forever
          console.error("[realtime] organizer WS auth threw", error);
          ws.close(4401, "Unauthorized organizer connection");
        }
      },

      close(ws) {
        const state = getConnectionState(ws);

        if (state.pendingAuth) {
          clearTimeout(state.pendingAuth.timeoutId);
          state.pendingAuth = undefined;
        }

        if (state.connectionId) {
          realtimeGateway.unregisterConnection(state.connectionId);
          state.connectionId = undefined;
        }
      },
    });
};
