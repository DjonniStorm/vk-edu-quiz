import type { PrismaClient } from "../../generated/prisma/client";
import type { AuthContextProvider } from "../../plugins/auth.interface";
import { InMemoryRealtimeGateway } from "./realtime.gateway";
import { createRealtimeRoutes } from "./realtime.routes";

export interface RealtimeModuleDeps {
  prisma: PrismaClient;
  authContextProvider: AuthContextProvider;
}

export const createRealtimeModule = ({ prisma, authContextProvider }: RealtimeModuleDeps) => {
  const realtimeGateway = new InMemoryRealtimeGateway();
  const routes = createRealtimeRoutes({ realtimeGateway, authContextProvider, prisma });

  return {
    realtimeGateway,
    routes,
  };
};
