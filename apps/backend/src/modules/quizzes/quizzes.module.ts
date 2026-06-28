import type { PrismaClient } from "../../generated/prisma/client";
import type { AuthContextProvider } from "../../plugins/auth.interface";
import { createQuizRoutes } from "./quizzes.routes";
import { QuizServiceImpl } from "./quizzes.service";

export interface QuizModuleDeps {
  prisma: PrismaClient;
  authContextProvider: AuthContextProvider;
}

export const createQuizModule = ({ prisma, authContextProvider }: QuizModuleDeps) => {
  const quizService = new QuizServiceImpl(prisma);
  const routes = createQuizRoutes({ quizService, authContextProvider });

  return {
    quizService,
    routes,
  };
};
