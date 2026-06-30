export const ROUTES = {
  main: "/",
  login: "/auth/login",
  register: "/auth/register",
  quizCreate: "/quizzes/create",
  quizEdit: "/quizzes/:quizId/edit",
  quizResults: "/quizzes/:quizId/results",
  roomPlay: "/rooms/:roomId",
  roomHost: "/rooms/:roomId/host",
} as const;

export const buildRoomPlayPath = (roomId: string) => `/rooms/${roomId}`;
export const buildRoomHostPath = (roomId: string) => `/rooms/${roomId}/host`;
export const buildQuizEditPath = (quizId: string) => `/quizzes/${quizId}/edit`;
export const buildQuizResultsPath = (quizId: string) => `/quizzes/${quizId}/results`;

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
