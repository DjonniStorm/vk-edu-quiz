import type { Prisma, PrismaClient } from "../generated/prisma/client";

export interface PrismaClientProvider {
  getClient(): PrismaClient;
}

export interface TransactionRunner {
  runInTransaction<TResult>(callback: (client: Prisma.TransactionClient) => Promise<TResult>): Promise<TResult>;
}
