/**
 * Tests for the pure validation helpers in src/lib/auth.ts:
 *   checkPassword  – fully pure (no DB)
 *   checkUsername  – regex branch is pure; DB branch is mocked
 *   checkEmail     – regex branch is pure; DB branch is mocked
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Mock DB – controlled per test
const mockFindFirst = vi.fn();
vi.mock("@/lib/db", () => ({
  db: vi.fn(() => ({
    query: {
      playersTable: {
        findFirst: mockFindFirst,
      },
    },
  })),
}));

const { checkPassword, checkUsername, checkEmail } = await import("./auth");

// ---------------------------------------------------------------------------
// checkPassword – pure function, no DB
// ---------------------------------------------------------------------------

describe("checkPassword", () => {
  it("accepts a valid password (8-30 chars)", async () => {
    expect(await checkPassword("validpass")).toBeUndefined();
  });

  it("rejects a password shorter than 8 characters", async () => {
    expect(await checkPassword("short")).toMatch(/8/);
  });

  it("rejects an empty password", async () => {
    expect(await checkPassword("")).toMatch(/8/);
  });

  it("rejects a password longer than 30 characters", async () => {
    expect(await checkPassword("a".repeat(31))).toMatch(/30/);
  });

  it("accepts a password of exactly 8 characters", async () => {
    expect(await checkPassword("exactly8")).toBeUndefined();
  });

  it("accepts a password of exactly 30 characters", async () => {
    expect(await checkPassword("a".repeat(30))).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// checkUsername – regex branch (no DB needed for format errors)
// ---------------------------------------------------------------------------

describe("checkUsername – format validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a username shorter than 3 characters", async () => {
    const result = await checkUsername("ab");
    expect(result).toMatch(/3.{0,10}20/);
  });

  it("rejects a username longer than 20 characters", async () => {
    const result = await checkUsername("a".repeat(21));
    expect(result).toMatch(/3.{0,10}20/);
  });

  it("rejects a username with spaces", async () => {
    const result = await checkUsername("bad name");
    expect(result).toBeTruthy();
  });

  it("rejects a username with special characters", async () => {
    const result = await checkUsername("bad@name!");
    expect(result).toBeTruthy();
  });

  it("accepts a valid alphanumeric username", async () => {
    mockFindFirst.mockResolvedValue(undefined); // not taken
    const result = await checkUsername("validUser123");
    expect(result).toBeUndefined();
  });

  it("accepts a username with underscores", async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const result = await checkUsername("valid_user");
    expect(result).toBeUndefined();
  });
});

describe("checkUsername – uniqueness check", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an error when the username is already taken", async () => {
    mockFindFirst.mockResolvedValue({ id: "existing-id", username: "taken" });
    const result = await checkUsername("taken");
    expect(result).toMatch(/taken/i);
  });

  it("returns undefined when the username is available", async () => {
    mockFindFirst.mockResolvedValue(undefined);
    expect(await checkUsername("available")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// checkEmail – regex branch
// ---------------------------------------------------------------------------

describe("checkEmail – format validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an email without @", async () => {
    const result = await checkEmail("notanemail");
    expect(result).toMatch(/valid email/i);
  });

  it("rejects an email without a domain", async () => {
    const result = await checkEmail("user@");
    expect(result).toMatch(/valid email/i);
  });

  it("rejects an email without a TLD", async () => {
    const result = await checkEmail("user@domain");
    expect(result).toMatch(/valid email/i);
  });

  it("accepts a well-formed email address", async () => {
    mockFindFirst.mockResolvedValue(undefined);
    expect(await checkEmail("user@example.com")).toBeUndefined();
  });
});

describe("checkEmail – uniqueness check", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an error when the email is already taken", async () => {
    mockFindFirst.mockResolvedValue({ id: "p1", email: "taken@example.com" });
    const result = await checkEmail("taken@example.com");
    expect(result).toMatch(/taken/i);
  });

  it("returns undefined when the email is available", async () => {
    mockFindFirst.mockResolvedValue(undefined);
    expect(await checkEmail("free@example.com")).toBeUndefined();
  });
});
