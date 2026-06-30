import { QuizStatus } from "@quiz/shared";

import { LANG_KEYS } from "@/app/i18n";
import type { LangKey } from "@/app/i18n/keys";

export const QUIZ_STATUS_LABEL_KEY: Record<QuizStatus, LangKey> = {
  [QuizStatus.Draft]: LANG_KEYS.quizzes.status.draft,
  [QuizStatus.Published]: LANG_KEYS.quizzes.status.published,
  [QuizStatus.Archived]: LANG_KEYS.quizzes.status.archived,
};

export const QUIZ_STATUS_COLOR: Record<QuizStatus, string> = {
  [QuizStatus.Draft]: "yellow",
  [QuizStatus.Published]: "green",
  [QuizStatus.Archived]: "gray",
};
