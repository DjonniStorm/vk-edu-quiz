import { Elysia } from "elysia";

import type { AuthContextProvider } from "../../plugins/auth.interface";
import { requireCurrentUser } from "../../plugins/auth-guards";
import type { HistoryService } from "./history.interfaces";
import { historyPaginationQuerySchema } from "./history.schemas";

export interface HistoryRoutesDeps {
  historyService: HistoryService;
  authContextProvider: AuthContextProvider;
}

export const createHistoryRoutes = ({ historyService, authContextProvider }: HistoryRoutesDeps) =>
  new Elysia({ prefix: "/history" })
    .get("/participant", async ({ headers, query }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return historyService.listParticipantHistory(
        currentUser.id,
        historyPaginationQuerySchema.parse(query),
      );
    }, {
      detail: {
        tags: ["History"],
        summary: "List participant history",
        security: [{ BearerAuth: [] }],
      },
    })
    .get("/organizer", async ({ headers, query }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return historyService.listOrganizerHistory(
        currentUser.id,
        historyPaginationQuerySchema.parse(query),
      );
    }, {
      detail: {
        tags: ["History"],
        summary: "List organizer room history",
        security: [{ BearerAuth: [] }],
      },
    })
    .get("/rooms/:roomId/results", async ({ headers, params }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return historyService.getRoomResults(currentUser.id, params.roomId);
    }, {
      detail: {
        tags: ["History"],
        summary: "Get room results",
        security: [{ BearerAuth: [] }],
      },
    });
