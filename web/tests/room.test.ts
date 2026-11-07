import { describe, expect, it } from "vitest";
import { isRoomCode, joinRoomInput, normalizeRoomCode, positionOf, shortName, maskDocument, displayName } from "@/lib/room";

describe("room code", () => {
  it("normalizes case, spaces and dashes", () => {
    expect(normalizeRoomCode(" abc-234 ")).toBe("ABC234");
  });

  it("rejects ambiguous characters and wrong lengths", () => {
    expect(isRoomCode("ABC234")).toBe(true);
    expect(isRoomCode("ABCD10")).toBe(false); // 1 and 0
    expect(isRoomCode("OIABCD")).toBe(false); // O and I
    expect(isRoomCode("ABC23")).toBe(false);
  });
});

describe("joinRoomInput", () => {
  it("accepts and normalizes a valid form", () => {
    const parsed = joinRoomInput.parse({ code: "abc 234", name: "  Ana   María  ", studentCode: " 1.065.123.456 " });
    expect(parsed).toEqual({ code: "ABC234", name: "Ana María", studentCode: "1065123456" });
  });

  it("reports each invalid field", () => {
    const result = joinRoomInput.safeParse({ code: "X", name: "A", studentCode: "a b" });
    expect(result.success).toBe(false);
    const fields = new Set(result.error?.issues.map((issue) => issue.path[0]));
    expect(fields).toEqual(new Set(["code", "name", "studentCode"]));
  });
});

describe("document number (REQ-28 CA2)", () => {
  it("accepts only 6 to 12 digits", () => {
    expect(joinRoomInput.shape.studentCode.safeParse("12345").success).toBe(false);
    expect(joinRoomInput.shape.studentCode.safeParse("1065-123").success).toBe(true);
    expect(joinRoomInput.shape.studentCode.safeParse("CC1065123").success).toBe(false);
    expect(joinRoomInput.shape.studentCode.safeParse("1234567890123").success).toBe(false);
  });

  it("shows only the last 4 digits", () => {
    expect(maskDocument("1065123456")).toBe("doc. …3456");
  });
});

describe("displayName", () => {
  it("shows first name and first surname on the student's own screen", () => {
    expect(displayName("Ana María Pérez Gómez")).toBe("Ana Pérez");
    expect(displayName("Ana Ávila")).toBe("Ana Ávila");
    expect(displayName("  Daniel   Turizo Chacón ")).toBe("Daniel Turizo");
    expect(displayName("Ana")).toBe("Ana");
  });
});

describe("shortName", () => {
  it("shows the first name and the initial of the second word", () => {
    expect(shortName("Daniel Turizo Pérez")).toBe("Daniel T.");
    expect(shortName("ana  ávila")).toBe("ana Á.");
    expect(shortName("Ana")).toBe("Ana");
  });
});

describe("positionOf", () => {
  const rows = [
    { participant_id: "a", score: 3, correct_seconds: 40 },
    { participant_id: "b", score: 4, correct_seconds: 90 },
    { participant_id: "c", score: 3, correct_seconds: 25 },
    { participant_id: "d", score: 3, correct_seconds: 25 },
  ];

  it("orders by score, then by less time on correct answers", () => {
    expect(positionOf(rows, "b")).toBe(1);
    expect(positionOf(rows, "a")).toBe(4);
  });

  it("gives ties the same position", () => {
    expect(positionOf(rows, "c")).toBe(2);
    expect(positionOf(rows, "d")).toBe(2);
  });

  it("returns undefined for someone outside the room", () => {
    expect(positionOf(rows, "z")).toBeUndefined();
  });
});
