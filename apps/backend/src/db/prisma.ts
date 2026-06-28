import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "../generated/prisma/client";
import type { PrismaClientProvider, TransactionRunner } from "./prisma.interface";

export class AppPrismaClientProvider implements PrismaClientProvider, TransactionRunner {
  private readonly client: PrismaClient;

  constructor(databaseUrl: string) {
    const adapter = new PrismaPg(databaseUrl);
    this.client = new PrismaClient({ adapter });
  }

  getClient(): PrismaClient {
    return this.client;
  }

  runInTransaction<TResult>(
    callback: (client: Prisma.TransactionClient) => Promise<TResult>,
  ): Promise<TResult> {
    return this.client.$transaction(callback);
  }
}
