import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toNotation, pieceLabel, formatWhen } from "./utils";

// ---------------------------------------------------------------------------
// toNotation – concentric variant
// ---------------------------------------------------------------------------

describe("toNotation – concentric", () => {
  // Row 1 has 1 column: r1c1 → centre → f1
  it("r1c1 → f1 (single-cell row, always centre)", () => {
    expect(toNotation("r1c1", "concentric")).toBe("f1");
  });

  // Row 2 has 3 columns: centre col = 2
  it("r2c1 → a2 (left of centre)", () => {
    expect(toNotation("r2c1", "concentric")).toBe("a2");
  });

  it("r2c2 → f2 (centre)", () => {
    expect(toNotation("r2c2", "concentric")).toBe("f2");
  });

  it("r2c3 → k2 (right of centre)", () => {
    expect(toNotation("r2c3", "concentric")).toBe("k2");
  });

  // Row 6 has 11 columns: centre col = 6
  it("r6c1 → a6 (leftmost)", () => {
    expect(toNotation("r6c1", "concentric")).toBe("a6");
  });

  it("r6c6 → f6 (centre)", () => {
    expect(toNotation("r6c6", "concentric")).toBe("f6");
  });

  it("r6c11 → k6 (rightmost)", () => {
    expect(toNotation("r6c11", "concentric")).toBe("k6");
  });

  // Row 12 mirrors row 1
  it("r12c1 → f12 (single-cell row)", () => {
    expect(toNotation("r12c1", "concentric")).toBe("f12");
  });

  // Row 7 has 11 columns (symmetric with row 6)
  it("r7c6 → f7 (centre of row 7)", () => {
    expect(toNotation("r7c6", "concentric")).toBe("f7");
  });
});

// ---------------------------------------------------------------------------
// toNotation – archimedean variant
// ---------------------------------------------------------------------------

describe("toNotation – archimedean", () => {
  // Row 1: 1 col, centre → g1
  it("r1c1 → g1 (single-cell row, always centre)", () => {
    expect(toNotation("r1c1", "archimedean")).toBe("g1");
  });

  // Row 6: 11 cols, centre col = 6
  it("r6c6 → g6 (centre of row 6)", () => {
    expect(toNotation("r6c6", "archimedean")).toBe("g6");
  });

  // Row 12: 1 col → g12
  it("r12c1 → g12 (single-cell row)", () => {
    expect(toNotation("r12c1", "archimedean")).toBe("g12");
  });

  // Left of centre in row ≤ 6 gets +1 offset compared to concentric
  it("r6c1 is left of centre, offset applied", () => {
    const result = toNotation("r6c1", "archimedean");
    // Should be a letter + "6", not the same as concentric a6
    expect(result).toMatch(/^[a-m]6$/);
    expect(result).not.toBe(toNotation("r6c1", "concentric"));
  });

  // Right of centre in row > 6 gets +1 offset
  it("r8c7 is right of centre in row 8 (> 6), offset applied", () => {
    const conc = toNotation("r8c7", "concentric");
    const arch = toNotation("r8c7", "archimedean");
    expect(arch).toMatch(/^[a-m]8$/);
    expect(arch).not.toBe(conc);
  });
});

// ---------------------------------------------------------------------------
// pieceLabel
// ---------------------------------------------------------------------------

describe("pieceLabel", () => {
  it.each([
    ["pawn", "P"],
    ["knight", "N"],
    ["bishop", "B"],
    ["rook", "R"],
    ["queen", "Q"],
    ["king", "K"],
    ["prince", "F"],
  ] as const)("%s → %s", (piece, label) => {
    expect(pieceLabel(piece)).toBe(label);
  });
});

// ---------------------------------------------------------------------------
// formatWhen
// ---------------------------------------------------------------------------

describe("formatWhen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Pin "now" to a fixed point
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns '-' for null", () => {
    expect(formatWhen(null)).toBe("-");
  });

  it("returns '-' for an invalid date string", () => {
    expect(formatWhen("not-a-date")).toBe("-");
  });

  it("returns '1 minute ago' for a very recent timestamp (< 1 min)", () => {
    const ts = new Date("2024-06-15T11:59:30Z").toISOString();
    expect(formatWhen(ts)).toBe("1 minute ago");
  });

  it("returns '5 minutes ago' for a 5-minute-old timestamp", () => {
    const ts = new Date("2024-06-15T11:55:00Z").toISOString();
    expect(formatWhen(ts)).toBe("5 minutes ago");
  });

  it("returns '1 hour ago' for a 1-hour-old timestamp", () => {
    const ts = new Date("2024-06-15T11:00:00Z").toISOString();
    expect(formatWhen(ts)).toBe("1 hour ago");
  });

  it("returns '3 hours ago' for a 3-hour-old timestamp", () => {
    const ts = new Date("2024-06-15T09:00:00Z").toISOString();
    expect(formatWhen(ts)).toBe("3 hours ago");
  });

  it("returns '1 day ago' for a 1-day-old timestamp", () => {
    const ts = new Date("2024-06-14T12:00:00Z").toISOString();
    expect(formatWhen(ts)).toBe("1 day ago");
  });

  it("returns '3 days ago' for a 3-day-old timestamp", () => {
    const ts = new Date("2024-06-12T12:00:00Z").toISOString();
    expect(formatWhen(ts)).toBe("3 days ago");
  });

  it("returns a locale date string for timestamps older than one week", () => {
    const ts = new Date("2024-06-01T12:00:00Z").toISOString();
    const result = formatWhen(ts);
    // Should look like "Jun 1, 2024"
    expect(result).toMatch(/Jun\s+1,\s+2024/);
  });

  it("uses singular 'minute' not 'minutes' for exactly 1 minute", () => {
    const ts = new Date("2024-06-15T11:59:00Z").toISOString();
    expect(formatWhen(ts)).toBe("1 minute ago");
  });

  it("uses singular 'hour' not 'hours' for exactly 1 hour", () => {
    const ts = new Date("2024-06-15T11:00:00Z").toISOString();
    expect(formatWhen(ts)).toBe("1 hour ago");
  });

  it("uses singular 'day' not 'days' for exactly 1 day", () => {
    const ts = new Date("2024-06-14T12:00:00Z").toISOString();
    expect(formatWhen(ts)).toBe("1 day ago");
  });
});
