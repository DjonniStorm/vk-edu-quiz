import i18n, { LANG_KEYS } from "@/app/i18n";
import type { LangKey } from "@/app/i18n/keys";
import { QUIZ_CATEGORY_IDS, type QuizCategoryId } from "@/shared/config/quiz-categories";

export const QUIZ_CATEGORY_LABEL_KEY: Record<QuizCategoryId, LangKey> = {
  history: LANG_KEYS.quizzes.categories.history,
  math: LANG_KEYS.quizzes.categories.math,
  geography: LANG_KEYS.quizzes.categories.geography,
  literature: LANG_KEYS.quizzes.categories.literature,
  biology: LANG_KEYS.quizzes.categories.biology,
  physics: LANG_KEYS.quizzes.categories.physics,
  chemistry: LANG_KEYS.quizzes.categories.chemistry,
  art: LANG_KEYS.quizzes.categories.art,
  music: LANG_KEYS.quizzes.categories.music,
  sport: LANG_KEYS.quizzes.categories.sport,
  it: LANG_KEYS.quizzes.categories.it,
  generalKnowledge: LANG_KEYS.quizzes.categories.generalKnowledge,
};

// Quizzes store category as a free-form string written in whatever language
// the author's UI was set to at creation time. To localize the default
// categories on display, we match the stored string against every known
// translation (both languages) of the default list, regardless of the
// current UI language. Anything that doesn't match is a custom category and
// is shown as-is.
const KNOWN_LABEL_TO_ID: Record<string, QuizCategoryId> = (() => {
  const map: Record<string, QuizCategoryId> = {};

  for (const id of QUIZ_CATEGORY_IDS) {
    const key = QUIZ_CATEGORY_LABEL_KEY[id];

    map[i18n.t(key, { lng: "ru" })] = id;
    map[i18n.t(key, { lng: "en" })] = id;
  }

  return map;
})();

export const getQuizCategoryLabel = (category: string | null | undefined): string | null => {
  const trimmed = category?.trim();

  if (!trimmed) {
    return null;
  }

  const id = KNOWN_LABEL_TO_ID[trimmed];

  return id ? i18n.t(QUIZ_CATEGORY_LABEL_KEY[id]) : trimmed;
};
