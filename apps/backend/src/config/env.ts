import "dotenv/config";

import { z } from "zod";

import type { EnvConfig } from "./env.interface";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16).default("dev-secret-change-me"),
  JWT_ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(60 * 60 * 24),
});

const getRuntimeEnv = (): Record<string, string | undefined> => {
  const runtime = globalThis as typeof globalThis & {
    Bun?: { env: Record<string, string | undefined> };
  };

  return runtime.Bun?.env ?? process.env;
};

export const getEnv = (): EnvConfig => {
  const env = envSchema.parse(getRuntimeEnv());

  return {
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    jwtAccessTokenTtlSec: env.JWT_ACCESS_TOKEN_TTL_SEC,
  };
};
