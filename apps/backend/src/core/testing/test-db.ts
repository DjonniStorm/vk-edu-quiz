import { getEnv } from "../../config/env";
import { AppPrismaClientProvider } from "../../db/prisma";
import type { PrismaClient } from "../../generated/prisma/client";

let prisma: PrismaClient | null = null;

export const getTestPrismaClient = (): PrismaClient => {
  if (!prisma) {
    const databaseUrl = process.env.TEST_DATABASE_URL ?? getEnv().databaseUrl;
    const provider = new AppPrismaClientProvider(databaseUrl);

    prisma = provider.getClient();
  }

  return prisma;
};

export const disconnectTestPrismaClient = async (): Promise<void> => {
  if (!prisma) {
    return;
  }

  await prisma.$disconnect();
  prisma = null;
};

export const deleteTestUsersByEmail = async (emails: string[]): Promise<void> => {
  if (!emails.length) {
    return;
  }

  const prisma = getTestPrismaClient();
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: emails,
      },
    },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  if (!userIds.length) {
    return;
  }

  const quizzes = await prisma.quiz.findMany({
    where: {
      ownerId: {
        in: userIds,
      },
    },
    select: { id: true },
  });
  const quizIds = quizzes.map((quiz) => quiz.id);

  await prisma.room.deleteMany({
    where: {
      OR: [
        { organizerId: { in: userIds } },
        { quizId: { in: quizIds } },
      ],
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });
};
