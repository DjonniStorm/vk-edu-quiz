import type { EntityId } from "../types";
import { UserRole, type UserRole as UserRoleType } from "../../generated/prisma/enums";
import { getTestPrismaClient } from "./test-db";
import { createTestEmail } from "./test-ids";

export interface TestUser {
  id: EntityId;
  email: string;
}

export const createTestUser = async (
  prefix: string,
  role: UserRoleType = UserRole.User,
): Promise<TestUser> => {
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

export const createTestAdmin = (prefix: string): Promise<TestUser> =>
  createTestUser(prefix, UserRole.Admin);
