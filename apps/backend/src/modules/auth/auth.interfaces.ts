import type { AppUserRole, CurrentUser, EntityId } from "../../core/types";

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
  role: AppUserRole;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResult {
  user: CurrentUser;
  tokens: AuthTokens;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}

export interface AuthService {
  register(input: RegisterUserInput): Promise<AuthResult>;
  login(input: LoginUserInput): Promise<AuthResult>;
  getCurrentUser(userId: EntityId): Promise<CurrentUser | null>;
}
