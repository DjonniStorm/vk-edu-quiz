export const QUIZ_CATEGORY_IDS = [
  "history",
  "math",
  "geography",
  "literature",
  "biology",
  "physics",
  "chemistry",
  "art",
  "music",
  "sport",
  "it",
  "generalKnowledge",
] as const;

export type QuizCategoryId = (typeof QUIZ_CATEGORY_IDS)[number];
