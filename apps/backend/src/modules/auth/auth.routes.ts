import { Elysia } from "elysia";

import { UnauthorizedError } from "../../core/errors";
import type { AuthContextProvider } from "../../plugins/auth.interface";
import type { AuthService } from "./auth.interfaces";
import { loginUserSchema, registerUserSchema } from "./auth.schemas";

export interface AuthRoutesDeps {
  authService: AuthService;
  authContextProvider: AuthContextProvider;
}

export const createAuthRoutes = ({
  authService,
  authContextProvider,
}: AuthRoutesDeps) =>
  new Elysia({ prefix: "/auth" })
    .post(
      "/register",
      ({ body }) => authService.register(registerUserSchema.parse(body)),
      {
        detail: {
          tags: ["Auth"],
          summary: "Register user",
          description: "Creates a User account with role User and returns JWT access token.",
        },
      },
    )
    .post(
      "/login",
      ({ body }) => authService.login(loginUserSchema.parse(body)),
      {
        detail: {
          tags: ["Auth"],
          summary: "Login by email",
          description:
            "Authenticates by email and password and returns JWT access token.",
        },
      },
    )
    .get(
      "/me",
      async ({ headers }) => {
        const currentUser = await authContextProvider.getCurrentUser(
          headers.authorization,
        );

        if (!currentUser) {
          throw new UnauthorizedError();
        }

        return { user: currentUser };
      },
      {
        detail: {
          tags: ["Auth"],
          summary: "Get current user",
          security: [{ BearerAuth: [] }],
        },
      },
    );
