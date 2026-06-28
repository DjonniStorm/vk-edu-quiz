import type { EnvConfig } from "../config/env.interface";
import type { PrismaClient } from "../generated/prisma/client";
import { createAuthModule } from "./auth/auth.module";
import { createHistoryModule } from "./history/history.module";
import { createQuizModule } from "./quizzes/quizzes.module";
import { createRealtimeModule } from "./realtime/realtime.module";
import { createRoomModule } from "./rooms/rooms.module";

export interface AppModulesDeps {
  env: EnvConfig;
  prisma: PrismaClient;
}

export const createModules = ({ env, prisma }: AppModulesDeps) => {
  const auth = createAuthModule({ env, prisma });
  const realtime = createRealtimeModule();
  const quizzes = createQuizModule({
    prisma,
    authContextProvider: auth.authContextProvider,
  });
  const rooms = createRoomModule({
    prisma,
    authContextProvider: auth.authContextProvider,
    realtimeGateway: realtime.realtimeGateway,
  });
  const history = createHistoryModule({
    prisma,
    authContextProvider: auth.authContextProvider,
  });

  return {
    auth,
    quizzes,
    rooms,
    realtime,
    history,
  };
};
