import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

import { UnauthorizedError } from "../core/errors";
import { UserRole } from "../generated/prisma/enums";
import type { AuthTokenPayload, AuthTokenService } from "./auth.interface";

const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  role: z.enum([UserRole.ORGANIZER, UserRole.PARTICIPANT]),
});

export class JwtAuthTokenService implements AuthTokenService {
  private readonly secret: Uint8Array;

  constructor(
    jwtSecret: string,
    private readonly accessTokenTtlSec: number,
  ) {
    this.secret = new TextEncoder().encode(jwtSecret);
  }

  sign(payload: AuthTokenPayload): Promise<string> {
    return new SignJWT({
      email: payload.email,
      role: payload.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(payload.userId)
      .setIssuedAt()
      .setExpirationTime(`${this.accessTokenTtlSec}s`)
      .sign(this.secret);
  }

  async verify(token: string): Promise<AuthTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      const parsedPayload = tokenPayloadSchema.parse(payload);

      return {
        userId: parsedPayload.sub,
        email: parsedPayload.email,
        role: parsedPayload.role,
      };
    } catch {
      throw new UnauthorizedError("Invalid auth token");
    }
  }
}
