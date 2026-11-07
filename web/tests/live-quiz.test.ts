import { describe, expect, it } from "vitest";
import { bandFor, bandOf, isLate, questionOrderFor, quizPhase, remainingMs } from "@/lib/live-quiz";

describe("quizPhase (design §12.2)", () => {
  it("is waiting, open or closed", () => {
    expect(quizPhase({ quiz_opened_at: null, quiz_closed_at: null })).toBe("waiting");
    expect(quizPhase({ quiz_opened_at: "2026-11-09T13:00:00Z", quiz_closed_at: null })).toBe("open");
    expect(quizPhase({ quiz_opened_at: "2026-11-09T13:00:00Z", quiz_closed_at: "2026-11-09T13:15:00Z" })).toBe("closed");
  });
});

describe("questionOrderFor (REQ-29 CA7)", () => {
  const ids = Array.from({ length: 10 }, (_, i) => `q${i}`);

  it("keeps every question and is stable for the same student", () => {
    const order = questionOrderFor(ids, "student-a");
    expect([...order].sort()).toEqual([...ids].sort());
    expect(questionOrderFor(ids, "student-a")).toEqual(order);
  });

  it("differs between students", () => {
    expect(questionOrderFor(ids, "student-a")).not.toEqual(questionOrderFor(ids, "student-b"));
  });
});

describe("server timing (REQ-35 CA2)", () => {
  const shown = new Date("2026-11-09T13:00:00Z");
  const at = (seconds: number) => new Date(shown.getTime() + seconds * 1000);

  it("counts down with the server clock and never goes negative", () => {
    expect(remainingMs(shown, 45, at(10))).toBe(35_000);
    expect(remainingMs(shown, 45, at(50))).toBe(0);
    expect(remainingMs(shown, 45, at(-1))).toBe(45_000);
  });

  it("accepts answers within the 3 s network grace only", () => {
    expect(isLate(shown, 45, at(47))).toBe(false);
    expect(isLate(shown, 45, at(49))).toBe(true);
  });
});

describe("bands (REQ-29 CA5)", () => {
  it("maps positions to bands", () => {
    expect(bandOf(1, 30)).toBe("top10");
    expect(bandOf(3, 30)).toBe("top10");
    expect(bandOf(4, 30)).toBe("top25");
    expect(bandOf(15, 30)).toBe("upperHalf");
    expect(bandOf(16, 30)).toBe("keepPracticing");
    expect(bandOf(1, 1)).toBe("top10");
  });

  it("uses the ranking order with shared ties", () => {
    const rows = [
      { participant_id: "a", score: 8, correct_seconds: 200 },
      { participant_id: "b", score: 8, correct_seconds: 200 },
      { participant_id: "c", score: 5, correct_seconds: 100 },
      { participant_id: "d", score: 2, correct_seconds: 50 },
    ];
    expect(bandFor(rows, "b")).toBe("top10");
    // 3rd of 4 is in the lower half.
    expect(bandFor(rows, "c")).toBe("keepPracticing");
    expect(bandFor(rows, "d")).toBe("keepPracticing");
    expect(bandFor(rows, "x")).toBeUndefined();
  });
});
