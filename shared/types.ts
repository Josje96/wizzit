// Types shared between the content tooling and the Vue app.

/**
 * opentdb:      Open Trivia DB (opentdb.com), CC BY-SA 4.0
 * opentriviaqa: OpenTriviaQA (github.com/uberspot/OpenTriviaQA), CC BY-SA 4.0
 * original:     written for Wizzit
 */
export type QuestionSource = "opentdb" | "opentriviaqa" | "original";

/** One question as served to the app in a daily set file. */
export interface DailyQuestion {
  id: number;
  category: string;
  prompt: string;
  /** Answer choices in display order (already shuffled). */
  choices: string[];
  /** Index into `choices` of the correct answer. */
  answerIndex: number;
  /** Short "why" shown after answering. Optional for imported trivia. */
  explanation?: string;
  source: QuestionSource;
}

/** Contents of /daily/YYYY-MM-DD.json */
export interface DailySet {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  questions: DailyQuestion[];
}

// ---------- Question flags (player feedback) ----------

export const FLAG_REASONS = {
  "wrong-answer": "The answer is wrong",
  confusing: "Confusing or unclear",
  obscure: "Too obscure",
  typo: "Typo or formatting",
  offensive: "Offensive or inappropriate",
  other: "Something else",
} as const;

export type FlagReason = keyof typeof FLAG_REASONS;

export const MAX_FLAG_COMMENT = 500;

/** POST /api/flags body. Anonymous: no user identity is sent or stored. */
export interface FlagSubmission {
  date: string;
  flags: { questionId: number; reason: FlagReason; comment?: string }[];
}

export const QUESTIONS_PER_DAY = 10;
export const SECONDS_PER_QUESTION = 10;
