import type { CurrentUser } from "../core/types";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: CurrentUser["role"];
}

export interface AuthTokenService {
  sign(payload: AuthTokenPayload): Promise<string>;
  verify(token: string): Promise<AuthTokenPayload>;
}

export interface AuthContextProvider {
  getCurrentUser(authorizationHeader?: string): Promise<CurrentUser | null>;
}
