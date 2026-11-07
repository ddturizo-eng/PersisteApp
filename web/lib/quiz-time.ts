import { plainText, splitInlineCode } from "@/lib/inline-code";

/**
 * Time limit per final-quiz question (REQ-35 CA1), computed from what the student must read so
 * long questions are not unfair. Conservative reading speed for technical Spanish on a phone:
 * 150 words per minute (2.5 words/s), plus extra time for each line of code or error message,
 * and inline code span, plus a fixed time to decide. Rounded up to 5 s and kept between 30 and 90 s.
 */
export const QUIZ_TIME = {
  /** Time to compare the options and decide, on top of reading. */
  thinkSeconds: 20,
  wordsPerSecond: 2.5,
  /** Code and stack traces are read token by token: extra seconds per line. */
  secondsPerCodeLine: 4,
  /** Inline code (`ps.executeQuery()`, a JDBC URL) is read character by character. */
  secondsPerInlineCode: 2,
  minSeconds: 30,
  maxSeconds: 90,
  /** Network grace the server adds before rejecting an answer as late (not shown). */
  graceSeconds: 3,
} as const;

type TimedQuestion = { context?: string; prompt: string; options: { text: string }[] };

const words = (text: string) => plainText(text).split(/\s+/).filter(Boolean).length;

/**
 * Lines of code or error output in the context: the lines after the first blank line (the
 * convention in quiz.json is «situation:\n\ncode»), or any line that looks like code.
 */
export function codeLines(context = ""): number {
  const [, ...blocks] = context.split(/\n\s*\n/);
  const afterBlank = blocks.join("\n").split("\n").filter((line) => line.trim()).length;
  return afterBlank;
}

export function readingWords(question: TimedQuestion): number {
  return words(question.context ?? "") + words(question.prompt) + question.options.reduce((sum, o) => sum + words(o.text), 0);
}

export function inlineCodeSpans(question: TimedQuestion): number {
  const texts = [question.context ?? "", question.prompt, ...question.options.map((o) => o.text)];
  return texts.reduce((sum, text) => sum + splitInlineCode(text).filter((part) => part.code).length, 0);
}

export function questionSeconds(question: TimedQuestion): number {
  const raw =
    QUIZ_TIME.thinkSeconds +
    readingWords(question) / QUIZ_TIME.wordsPerSecond +
    codeLines(question.context) * QUIZ_TIME.secondsPerCodeLine +
    inlineCodeSpans(question) * QUIZ_TIME.secondsPerInlineCode;
  const rounded = Math.ceil(raw / 5) * 5;
  return Math.min(QUIZ_TIME.maxSeconds, Math.max(QUIZ_TIME.minSeconds, rounded));
}
