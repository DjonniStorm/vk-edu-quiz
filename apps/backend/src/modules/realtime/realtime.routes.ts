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

export const createRealtimeRoutes = ({
  realtimeGateway,
  authContextProvider,
  prisma,
}: RealtimeRoutesDeps) => {
  const connectionIds = new WeakMap<object, string>();
  const pendingAuth = new WeakMap<object, PendingAuth>();

  const registerConnection = (
    ws: { send: (payload: string) => void; close: (code?: number, reason?: string) => void },
    wsRef: object,
    roomId: string,
    roomParticipantId: string | undefined,
    isOrganizer: boolean,
  ) => {
    const connectionId = crypto.randomUUID();
    connectionIds.set(wsRef, connectionId);

    realtimeGateway.registerConnection(
      { id: connectionId, roomId, roomParticipantId, isOrganizer },
      {
        send: (payload) => ws.send(payload),
        close: (code, reason) => ws.close(code, reason),
      },
    );
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
            pendingAuth.delete(ws);
            ws.close(4401, "Auth timeout");
          }, AUTH_TIMEOUT_MS);

          pendingAuth.set(ws, { roomId, timeoutId });

          return;
        }

        registerConnection(ws, ws, roomId, query.data.roomParticipantId, false);
      },

      message: async (ws, rawMessage) => {
        const pending = pendingAuth.get(ws);

        if (!pending) {
          return;
        }

        clearTimeout(pending.timeoutId);
        pendingAuth.delete(ws);

        let parsed: z.infer<typeof wsOrganizerAuthSchema>;

        try {
          parsed = wsOrganizerAuthSchema.parse(JSON.parse(String(rawMessage)));
        } catch {
          ws.close(4401, "Invalid auth message");

          return;
        }

        const [currentUser, room] = await Promise.all([
          authContextProvider.getCurrentUser(`Bearer ${parsed.token}`),
          prisma.room.findUnique({
            where: { id: pending.roomId },
            select: { organizerId: true },
          }),
        ]);

        if (!currentUser || !room || room.organizerId !== currentUser.id) {
          ws.close(4401, "Unauthorized organizer connection");

          return;
        }

        registerConnection(ws, ws, pending.roomId, undefined, true);
      },

      close(ws) {
        const pending = pendingAuth.get(ws);

        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingAuth.delete(ws);
        }

        const connectionId = connectionIds.get(ws);

        if (connectionId) {
          realtimeGateway.unregisterConnection(connectionId);
          connectionIds.delete(ws);
        }
      },
    });
};
