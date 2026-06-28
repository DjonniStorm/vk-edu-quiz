import type { EntityId } from "../types";
import type { UserRole } from "../../generated/prisma/enums";
import { getTestPrismaClient } from "./test-db";
import { createTestEmail } from "./test-ids";

export interface TestUser {
  id: EntityId;
  email: string;
}

export const createTestUser = async (prefix: string, role: UserRole): Promise<TestUser> => {
  const email = createTestEmail(prefix);
  const user = await getTestPrismaClient().user.create({
    data: {
      email,
      name: `${prefix} user`,
      passwordHash: "test-password-hash",
      role,
    },
    select: {
      id: true,
      email: true,
    },
  });

  return user;
};
