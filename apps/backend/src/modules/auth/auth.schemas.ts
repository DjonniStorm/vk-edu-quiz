import { z } from "zod";

import { UserRole } from "../../generated/prisma/enums";

export const registerUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum([UserRole.ORGANIZER, UserRole.PARTICIPANT]),
});

export const loginUserSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
