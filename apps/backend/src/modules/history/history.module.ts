import type { PrismaClient } from "../../generated/prisma/client";
import type { AuthContextProvider } from "../../plugins/auth.interface";
import { createHistoryRoutes } from "./history.routes";
import { HistoryServiceImpl } from "./history.service";

export interface HistoryModuleDeps {
  prisma: PrismaClient;
  authContextProvider: AuthContextProvider;
}

export const createHistoryModule = ({ prisma, authContextProvider }: HistoryModuleDeps) => {
  const historyService = new HistoryServiceImpl(prisma);
  const routes = createHistoryRoutes({ historyService, authContextProvider });

  return {
    historyService,
    routes,
  };
};
