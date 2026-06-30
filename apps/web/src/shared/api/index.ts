export { getApiErrorMessage, isCancelError, isUnauthorizedError } from "./api-error";
export { BaseApi } from "./base-api";
export { authApi, AUTH_SCOPE } from "./clients/auth.api";
export type { LoginInput, RegisterInput } from "./clients/auth.api";
export { quizzesApi } from "./clients/quizzes.api";
export type {
  CreateQuizInput,
  QuestionInput,
  QuizDetailsDto,
  QuestionDetailsDto,
  UpdateQuizInput,
} from "./clients/quizzes.api";
export { roomsApi } from "./clients/rooms.api";
export type {
  AnswerResultDto,
  CreateRoomInput,
  JoinRoomInput,
  ShowQuestionInput,
  SubmitAnswerInput,
} from "./clients/rooms.api";
export type { CurrentQuestionStateDto } from "@quiz/shared";
export { authTokenStorage, httpClient } from "./http-client";
export { loaderStore } from "./loader.store";
export type { LoaderLevel, RequestMeta } from "./loader.store";
