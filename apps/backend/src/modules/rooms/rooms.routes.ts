import { Elysia } from "elysia";

import type { AuthContextProvider } from "../../plugins/auth.interface";
import { requireCurrentUser } from "../../plugins/auth-guards";
import type { RoomService } from "./rooms.interfaces";
import {
  createRoomSchema,
  joinRoomSchema,
  leaveRoomSchema,
  showQuestionSchema,
  submitAnswerSchema,
} from "./rooms.schemas";

export interface RoomRoutesDeps {
  roomService: RoomService;
  authContextProvider: AuthContextProvider;
}

export const createRoomRoutes = ({ roomService, authContextProvider }: RoomRoutesDeps) =>
  new Elysia({ prefix: "/rooms" })
    .post("/", async ({ headers, body }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return roomService.createRoom(currentUser.id, createRoomSchema.parse(body));
    }, {
      detail: {
        tags: ["Rooms"],
        summary: "Create live room",
        description: "Organizer creates a live room for own quiz. Room id is UUID and invite URL is /rooms/:roomId.",
        security: [{ BearerAuth: [] }],
      },
    })
    .get("/:roomId", ({ params }) => roomService.getRoom(params.roomId), {
      detail: {
        tags: ["Rooms"],
        summary: "Get room summary",
      },
    })
    .post("/:roomId/join", async ({ headers, params, body }) => {
      const input = joinRoomSchema.parse(body);
      const currentUser = headers.authorization
        ? await requireCurrentUser(authContextProvider, headers.authorization)
        : null;

      return roomService.joinRoom(params.roomId, {
        ...input,
        userId: currentUser?.id ?? null,
      });
    }, {
      detail: {
        tags: ["Rooms"],
        summary: "Join room",
        description: "Guest users may join without token. Authorized joins link the account userId.",
      },
    })
    .post("/:roomId/leave", async ({ body }) => {
      const input = leaveRoomSchema.parse(body);

      await roomService.leaveRoom(input.roomParticipantId);

      return { ok: true };
    }, {
      detail: {
        tags: ["Rooms"],
        summary: "Leave room",
      },
    })
    .post("/:roomId/start", async ({ headers, params }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return roomService.startRoom(currentUser.id, params.roomId);
    }, {
      detail: {
        tags: ["Rooms"],
        summary: "Start room",
        security: [{ BearerAuth: [] }],
      },
    })
    .post("/:roomId/questions/show", async ({ headers, params, body }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);
      const input = showQuestionSchema.parse(body);

      return roomService.showQuestion(currentUser.id, params.roomId, input.questionId);
    }, {
      detail: {
        tags: ["Rooms"],
        summary: "Show question",
        security: [{ BearerAuth: [] }],
      },
    })
    .post("/:roomId/answers", ({ params, body }) =>
      roomService.submitAnswer(params.roomId, submitAnswerSchema.parse(body)),
      {
        detail: {
          tags: ["Rooms"],
          summary: "Submit participant answer",
          description: "Answer is accepted only for current active question.",
        },
      },
    )
    .get("/:roomId/leaderboard", ({ params }) => roomService.getLeaderboard(params.roomId), {
      detail: {
        tags: ["Rooms"],
        summary: "Get room leaderboard",
      },
    })
    .post("/:roomId/finish", async ({ headers, params }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return roomService.finishRoom(currentUser.id, params.roomId);
    }, {
      detail: {
        tags: ["Rooms"],
        summary: "Finish room",
        security: [{ BearerAuth: [] }],
      },
    });
