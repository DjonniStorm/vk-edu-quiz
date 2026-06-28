import { ForbiddenError, UnauthorizedError } from "../core/errors";
import type { AppUserRole, CurrentUser } from "../core/types";
import type { AuthContextProvider } from "./auth.interface";

export const requireCurrentUser = async (
  authContextProvider: AuthContextProvider,
  authorizationHeader?: string,
): Promise<CurrentUser> => {
  const currentUser = await authContextProvider.getCurrentUser(authorizationHeader);

  if (!currentUser) {
    throw new UnauthorizedError();
  }

  return currentUser;
};

export const requireRole = async (
  authContextProvider: AuthContextProvider,
  authorizationHeader: string | undefined,
  role: AppUserRole,
): Promise<CurrentUser> => {
  const currentUser = await requireCurrentUser(authContextProvider, authorizationHeader);

  if (currentUser.role !== role) {
    throw new ForbiddenError();
  }

  return currentUser;
};
