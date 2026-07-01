import { isAxiosError } from "axios";

import i18n, { LANG_KEYS } from "@/app/i18n";
import type { LangKey } from "@/app/i18n/keys";

/**
 * Maps auth API errors to a localized message by HTTP status code instead of
 * relying on the raw (English) message returned by the backend.
 */
export const getAuthErrorMessage = (error: unknown, fallbackKey: LangKey): string => {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      return i18n.t(LANG_KEYS.auth.errors.invalidCredentials);
    }

    if (error.response?.status === 409) {
      return i18n.t(LANG_KEYS.auth.errors.emailTaken);
    }
  }

  return i18n.t(fallbackKey);
};
