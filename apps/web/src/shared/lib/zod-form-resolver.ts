import type { ZodType } from "zod";

import i18n, { LANG_KEYS } from "@/app/i18n";

interface GenericZodIssue {
  code: string;
  path: PropertyKey[];
  minimum?: unknown;
}

const messageForIssue = (issue: GenericZodIssue): string => {
  switch (issue.code) {
    case "invalid_format":
    case "invalid_string":
      return i18n.t(LANG_KEYS.validation.invalidEmail);
    case "too_small": {
      const minimum = typeof issue.minimum === "number" ? issue.minimum : 0;

      return i18n.t(minimum > 1 ? LANG_KEYS.validation.tooShort : LANG_KEYS.validation.required);
    }
    default:
      return i18n.t(LANG_KEYS.validation.invalid);
  }
};

/**
 * Zod resolver for Mantine forms that maps generic Zod issue codes to
 * localized messages instead of relying on Zod's built-in (English-only) text.
 */
export const localizedZodResolver = <T>(schema: ZodType<T>) => {
  return (values: T): Record<string, string> => {
    const result = schema.safeParse(values);

    if (result.success) {
      return {};
    }

    const errors: Record<string, string> = {};

    for (const issue of result.error.issues as GenericZodIssue[]) {
      const path = issue.path.join(".");

      if (!errors[path]) {
        errors[path] = messageForIssue(issue);
      }
    }

    return errors;
  };
};
