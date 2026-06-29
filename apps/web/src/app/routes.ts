export const ROUTES = {
  main: "/",
  login: "/auth/login",
  register: "/auth/register",
  quizCreate: "/quizzes/create",
} as const;

export const AUTH_RETURN_URL_QUERY = "returnUrl";

export const buildLoginPath = (returnUrl: string) =>
  `${ROUTES.login}?${AUTH_RETURN_URL_QUERY}=${encodeURIComponent(returnUrl)}`;

export const resolveReturnUrl = (
  searchParams: URLSearchParams,
  fallback: string = ROUTES.main,
): string => {
  const value = searchParams.get(AUTH_RETURN_URL_QUERY);

  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return fallback;
};
