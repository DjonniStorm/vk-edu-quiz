import type { PrismaClient } from "../../generated/prisma/client";
import type { AuthContextProvider } from "../../plugins/auth.interface";
import type { RealtimeGateway } from "../realtime/realtime.interfaces";
import { createRoomRoutes } from "./rooms.routes";
import { RoomServiceImpl } from "./rooms.service";

export interface RoomModuleDeps {
  prisma: PrismaClient;
  authContextProvider: AuthContextProvider;
  realtimeGateway: RealtimeGateway;
}

export const createRoomModule = ({ prisma, authContextProvider, realtimeGateway }: RoomModuleDeps) => {
  const roomService = new RoomServiceImpl(prisma, realtimeGateway);
  const routes = createRoomRoutes({ roomService, authContextProvider });

  return {
    roomService,
    routes,
  };
};
