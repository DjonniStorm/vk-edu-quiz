import type { EnvConfig } from "../../config/env.interface";
import type { PrismaClient } from "../../generated/prisma/client";
import { BearerAuthContextProvider } from "../../plugins/auth-context.provider";
import { JwtAuthTokenService } from "../../plugins/auth-token.service";
import { createAuthRoutes } from "./auth.routes";
import { AuthServiceImpl } from "./auth.service";
import { BcryptPasswordHasher } from "./password-hasher";

export interface AuthModuleDeps {
  env: EnvConfig;
  prisma: PrismaClient;
}

export const createAuthModule = ({ env, prisma }: AuthModuleDeps) => {
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtAuthTokenService(env.jwtSecret, env.jwtAccessTokenTtlSec);
  const authService = new AuthServiceImpl(prisma, passwordHasher, tokenService);
  const authContextProvider = new BearerAuthContextProvider(prisma, tokenService);
  const routes = createAuthRoutes({ authService, authContextProvider });

  return {
    authService,
    authContextProvider,
    routes,
  };
};
