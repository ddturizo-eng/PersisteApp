import { describe, expect, it } from "vitest";
import {
  canShowSolution,
  checkGaps,
  checkOrder,
  hintFor,
  move,
  orderPool,
  seededShuffle,
  toSentinels,
} from "@/lib/exercises";

describe("seededShuffle", () => {
  it("is deterministic for the same seed", () => {
    expect(seededShuffle([1, 2, 3, 4, 5], "a")).toEqual(seededShuffle([1, 2, 3, 4, 5], "a"));
  });

  it("never returns the original order", () => {
    for (const seed of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      expect(seededShuffle([1, 2, 3], seed)).not.toEqual([1, 2, 3]);
    }
  });
});

describe("move", () => {
  it("swaps with the neighbour and ignores moves past the ends", () => {
    expect(move(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(move(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(move(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"]);
  });
});

describe("checkOrder", () => {
  const pool = orderPool(["x", "y", "z"], ["bad"], "seed");

  it("solves only with the correct blocks in order", () => {
    const correct = ["b0", "b1", "b2"].map((id) => pool.find((b) => b.id === id)!);
    expect(checkOrder(correct, ["x", "y", "z"])).toEqual({ solved: true, inPlace: 3, hasDistractor: false });
  });

  it("treats identical lines as interchangeable", () => {
    const twins = [
      { id: "b1", text: "}" },
      { id: "b0", text: "}" },
    ];
    expect(checkOrder(twins, ["}", "}"]).solved).toBe(true);
  });

  it("never starts solved, even with identical lines", () => {
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const pool = orderPool(["a", "}", "}"], [], seed);
      expect(checkOrder(pool, ["a", "}", "}"]).solved).toBe(false);
    }
  });

  it("reports blocks in place and kept distractors", () => {
    const wrong = ["b0", "b2", "b1", "d0"].map((id) => pool.find((b) => b.id === id)!);
    expect(checkOrder(wrong, ["x", "y", "z"])).toEqual({ solved: false, inPlace: 1, hasDistractor: true });
  });
});

describe("checkGaps", () => {
  const gaps = [
    { id: 1, answers: ["prepareStatement"] },
    { id: 2, answers: ["setString"] },
  ];

  it("accepts trimmed, case-sensitive answers", () => {
    expect(checkGaps(gaps, { 1: " prepareStatement ", 2: "setString" }).solved).toBe(true);
    expect(checkGaps(gaps, { 1: "preparestatement", 2: "setString" }).results).toEqual({ 1: false, 2: true });
  });

  it("treats missing values as wrong", () => {
    expect(checkGaps(gaps, {}).solved).toBe(false);
  });
});

describe("toSentinels", () => {
  it("turns {{n}} into identifiers the highlighter keeps intact", () => {
    expect(toSentinels("ps.{{2}}(1, x)")).toBe("ps.__GAP_2__(1, x)");
  });
});

describe("hints and solution", () => {
  it("shows one more hint per failure and repeats the last", () => {
    const hints = ["uno", "dos"];
    expect(hintFor(hints, 0)).toBeUndefined();
    expect(hintFor(hints, 1)).toBe("uno");
    expect(hintFor(hints, 2)).toBe("dos");
    expect(hintFor(hints, 5)).toBe("dos");
    expect(hintFor(undefined, 3)).toBeUndefined();
  });

  it("offers the solution from the second failure", () => {
    expect(canShowSolution(1)).toBe(false);
    expect(canShowSolution(2)).toBe(true);
  });
});
