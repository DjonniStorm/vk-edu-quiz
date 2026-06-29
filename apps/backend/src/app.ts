import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { ZodError } from "zod";

import type { EnvConfig } from "./config/env.interface";
import { AppError, ErrorCode } from "./core/errors";
import { AppPrismaClientProvider } from "./db/prisma";
import { swaggerDocs } from "./docs/swagger";
import { createModules } from "./modules";

export const createApp = (env: EnvConfig) => {
  const prismaProvider = new AppPrismaClientProvider(env.databaseUrl);
  const modules = createModules({
    env,
    prisma: prismaProvider.getClient(),
  });

  return new Elysia()
    .use(
      cors({
        origin: "*",
      }),
    )
    .use(swaggerDocs())
    .onError(({ error, set }) => {
      if (error instanceof AppError) {
        set.status = error.statusCode;

        return {
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      if (error instanceof ZodError) {
        set.status = 400;

        return {
          error: {
            code: ErrorCode.ValidationError,
            message: "Validation error",
            issues: error.issues,
          },
        };
      }

      console.error(error);
      set.status = 500;

      return {
        error: {
          code: ErrorCode.InternalServerError,
          message: "Internal server error",
        },
      };
    })
    .get("/", () => ({ name: "vk-edu-quiz-backend", status: "ok" }), {
      detail: {
        tags: ["System"],
        summary: "Service metadata",
      },
    })
    .get("/health", () => ({ status: "ok" }), {
      detail: {
        tags: ["System"],
        summary: "Health check",
      },
    })
    .use(modules.auth.routes)
    .use(modules.quizzes.routes)
    .use(modules.rooms.routes)
    .use(modules.realtime.routes)
    .use(modules.history.routes);
};
