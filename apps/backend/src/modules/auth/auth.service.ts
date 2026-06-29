import { ConflictError, UnauthorizedError } from "../../core/errors";
import type { CurrentUser, EntityId } from "../../core/types";
import type { PrismaClient } from "../../generated/prisma/client";
import { UserRole } from "../../generated/prisma/enums";
import type { AuthTokenService } from "../../plugins/auth.interface";
import type {
  AuthResult,
  AuthService,
  LoginUserInput,
  PasswordHasher,
  RegisterUserInput,
} from "./auth.interfaces";

export class AuthServiceImpl implements AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: AuthTokenService,
  ) {}

  async register(input: RegisterUserInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name.trim(),
        role: UserRole.User,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return this.buildAuthResult(user);
  }

  async login(input: LoginUserInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValidPassword = await this.passwordHasher.verify(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return this.buildAuthResult(user);
  }

  async getCurrentUser(userId: EntityId): Promise<CurrentUser | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  private async buildAuthResult(user: CurrentUser): Promise<AuthResult> {
    const accessToken = await this.tokenService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      tokens: { accessToken },
    };
  }
}
