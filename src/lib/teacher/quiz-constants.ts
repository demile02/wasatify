export const QUIZ_OPTION_IDS = ['a', 'b', 'c', 'd', 'e'] as const;

export type QuizOptionId = typeof QUIZ_OPTION_IDS[number];
