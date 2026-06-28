import { UnauthorizedError } from "../core/errors";
import type { CurrentUser } from "../core/types";
import type { PrismaClient } from "../generated/prisma/client";
import type { AuthContextProvider, AuthTokenService } from "./auth.interface";

export class BearerAuthContextProvider implements AuthContextProvider {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly tokenService: AuthTokenService,
  ) {}

  async getCurrentUser(authorizationHeader?: string): Promise<CurrentUser | null> {
    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedError("Invalid authorization header");
    }

    const payload = await this.tokenService.verify(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    return user ?? null;
  }
}
