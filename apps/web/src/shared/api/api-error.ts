import axios, { isAxiosError } from "axios";

interface ApiErrorBody {
  error?: {
    message?: string;
    code?: string;
  };
}

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.error?.message;

    if (message) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const isUnauthorizedError = (error: unknown): boolean => {
  return isAxiosError(error) && error.response?.status === 401;
};

export const isCancelError = (error: unknown): boolean => axios.isCancel(error);
