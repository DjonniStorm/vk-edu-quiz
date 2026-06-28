import { Elysia } from "elysia";
import { z } from "zod";

import type { RealtimeGateway } from "./realtime.interfaces";

export interface RealtimeRoutesDeps {
  realtimeGateway: RealtimeGateway;
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

export const createRealtimeRoutes = ({ realtimeGateway }: RealtimeRoutesDeps) => {
  const connectionIds = new WeakMap<object, string>();

  return new Elysia({ prefix: "/realtime" })
    .get("/health", () => ({ status: "ok" }), {
      detail: {
        tags: ["Realtime"],
        summary: "Realtime health check",
        description: "WebSocket endpoint: /realtime/rooms/:roomId?role=participant&roomParticipantId=:id",
      },
    })
    .ws("/rooms/:roomId", {
      open(ws) {
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

        const connectionId = crypto.randomUUID();
        connectionIds.set(ws, connectionId);

        realtimeGateway.registerConnection(
          {
            id: connectionId,
            roomId,
            roomParticipantId: query.data.roomParticipantId,
            isOrganizer: query.data.role === "organizer",
          },
          {
            send: (payload) => {
              ws.send(payload);
            },
            close: (code, reason) => {
              ws.close(code, reason);
            },
          },
        );
      },
      close(ws) {
        const connectionId = connectionIds.get(ws);

        if (connectionId) {
          realtimeGateway.unregisterConnection(connectionId);
          connectionIds.delete(ws);
        }
      },
    });
};
