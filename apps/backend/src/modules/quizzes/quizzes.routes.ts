import { Elysia } from "elysia";

import type { AuthContextProvider } from "../../plugins/auth.interface";
import { requireCurrentUser } from "../../plugins/auth-guards";
import type { QuizService } from "./quizzes.interfaces";
import {
  createQuizSchema,
  paginationQuerySchema,
  replaceQuestionsSchema,
  updateQuizSchema,
} from "./quizzes.schemas";

export interface QuizRoutesDeps {
  quizService: QuizService;
  authContextProvider: AuthContextProvider;
}

export const createQuizRoutes = ({ quizService, authContextProvider }: QuizRoutesDeps) =>
  new Elysia({ prefix: "/quizzes" })
    .get("/", async ({ headers, query }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return quizService.listOwnerQuizzes(currentUser.id, paginationQuerySchema.parse(query));
    }, {
      detail: {
        tags: ["Quizzes"],
        summary: "List organizer quizzes",
        security: [{ BearerAuth: [] }],
      },
    })
    .post("/", async ({ headers, body }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return quizService.createQuiz(currentUser.id, createQuizSchema.parse(body));
    }, {
      detail: {
        tags: ["Quizzes"],
        summary: "Create quiz",
        security: [{ BearerAuth: [] }],
      },
    })
    .get("/:quizId", async ({ headers, params }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return quizService.getOwnerQuiz(currentUser.id, params.quizId);
    }, {
      detail: {
        tags: ["Quizzes"],
        summary: "Get quiz details",
        security: [{ BearerAuth: [] }],
      },
    })
    .patch("/:quizId", async ({ headers, params, body }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      return quizService.updateQuiz(currentUser.id, params.quizId, updateQuizSchema.parse(body));
    }, {
      detail: {
        tags: ["Quizzes"],
        summary: "Update quiz metadata",
        security: [{ BearerAuth: [] }],
      },
    })
    .delete("/:quizId", async ({ headers, params }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);

      await quizService.deleteQuiz(currentUser.id, params.quizId);

      return { ok: true };
    }, {
      detail: {
        tags: ["Quizzes"],
        summary: "Delete quiz",
        security: [{ BearerAuth: [] }],
      },
    })
    .put("/:quizId/questions", async ({ headers, params, body }) => {
      const currentUser = await requireCurrentUser(authContextProvider, headers.authorization);
      const input = replaceQuestionsSchema.parse(body);

      return quizService.replaceQuestions(currentUser.id, params.quizId, input.questions);
    }, {
      detail: {
        tags: ["Quizzes"],
        summary: "Replace quiz questions",
        security: [{ BearerAuth: [] }],
      },
    });
