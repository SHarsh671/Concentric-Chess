/**
 * §9.2.5 – Matchmaking / Game Creation (Next.js Server Actions)
 *
 * Tests the `play` server action: auth guard, variant validation, mode
 * validation, invite flow (player-not-found), and queue / local branching.
 *
 * We mock the DB and auth at the boundary so the pure logic is exercised
 * without a real database or Cloudflare runtime.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mocks ─────────────────────────────────────────────────────────────────

// next/navigation redirect throws a NEXT_REDIRECT error in tests; just mock it.
const mockRedirect = vi.fn((_url: string): never => {
  throw new Error(`NEXT_REDIRECT:${_url}`);
});
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

// Mock server-only so the import doesn't explode outside Next.js
vi.mock("server-only", () => ({}));

// Cookie lib used to build headers
vi.mock("cookie", () => ({
  serialize: vi.fn((_name: string, value: string) => `session_token=${value}`),
}));

// Stub the db() call – insert resolves by default
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue(undefined),
});
const mockSelect = vi.fn();
vi.mock("@/lib/db", () => ({
  db: vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
  })),
}));

// Stub global fetch for /accept calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Stub crypto.randomUUID
vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "test-game-uuid") });

// Stub Math.random to always return < 0.5 (white = session player)
const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);

// Auth mock – controlled per test
const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({ getSession: mockGetSession }));

// ── helpers ───────────────────────────────────────────────────────────────

/** Build a FormData for the play action */
function fd(
  variant = "concentric-rapid",
  mode = "online",
  username = "",
): FormData {
  const f = new FormData();
  f.set("variant", variant);
  f.set("mode", mode);
  if (username) f.set("username", username);
  return f;
}

/** Expect a redirect to the given path */
async function expectRedirect(fn: () => Promise<unknown>, toPath: string) {
  try {
    await fn();
    expect.fail("Expected redirect to throw");
  } catch (e: unknown) {
    expect((e as Error).message).toContain(`NEXT_REDIRECT:${toPath}`);
  }
}

// ── import action under test ──────────────────────────────────────────────

// Dynamic import so mocks are installed first
const { play } = await import("./play");

// ── tests ─────────────────────────────────────────────────────────────────

describe("play server action – auth guard (§9.2.5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an error when the user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await play(null, fd());
    expect(result).toMatchObject({
      error: expect.stringMatching(/logged in/i),
    });
  });

  it("does not touch the database when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    await play(null, fd());
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("play server action – input validation (§9.2.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ playerId: "player-1", token: "tok" });
  });

  it("returns an error for an invalid game variant", async () => {
    const result = await play(null, fd("not-a-variant", "online"));
    expect(result).toMatchObject({
      error: expect.stringMatching(/invalid game variant/i),
    });
  });

  it("returns an error for an invalid mode", async () => {
    const result = await play(
      null,
      fd("concentric-rapid", "invalid-mode" as "online"),
    );
    expect(result).toMatchObject({
      error: expect.stringMatching(/invalid game mode/i),
    });
  });
});

describe("play server action – invite flow (§9.2.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ playerId: "player-1", token: "tok" });
  });

  it("returns an error when the specified username does not exist", async () => {
    // DB select returns empty array (player not found)
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            then: vi.fn((cb: (r: unknown[]) => unknown) =>
              Promise.resolve(cb([])),
            ),
          }),
        }),
      }),
    });

    const result = await play(
      null,
      fd("concentric-rapid", "online", "unknownuser"),
    );
    expect(result).toMatchObject({
      error: expect.stringMatching(/not found/i),
    });
  });

  it("redirects to the game page when an invited player is found", async () => {
    // DB select returns a matching player
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            then: vi.fn((cb: (r: unknown[]) => unknown) =>
              Promise.resolve(cb([{ id: "player-2", username: "alice" }])),
            ),
          }),
        }),
      }),
    });
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    await expectRedirect(
      () => play(null, fd("concentric-rapid", "online", "alice")),
      "/games/test-game-uuid",
    );
  });
});

describe("play server action – local mode (§9.2.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ playerId: "player-1", token: "tok" });
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    mathRandomSpy.mockReturnValue(0.1);
  });

  it("creates a local game and redirects to it", async () => {
    await expectRedirect(
      () => play(null, fd("concentric-rapid", "local")),
      "/games/test-game-uuid",
    );
  });

  it("inserts one game row for a local game", async () => {
    try {
      await play(null, fd("concentric-rapid", "local"));
    } catch {
      // redirect throws
    }
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});

describe("play server action – random queue (§9.2.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ playerId: "player-1", token: "tok" });
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("creates a new queue game and redirects when no waiting game exists", async () => {
    // First select = no existing game in own queue; second select = no waiting game
    mockSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              then: vi.fn((cb: (r: unknown[]) => unknown) =>
                Promise.resolve(cb([])),
              ),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              then: vi.fn((cb: (r: unknown[]) => unknown) =>
                Promise.resolve(cb([])),
              ),
            }),
          }),
        }),
      });

    await expectRedirect(
      () => play(null, fd("concentric-rapid", "online")),
      "/games/test-game-uuid",
    );
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("joins a waiting game (via /accept) and redirects when one exists", async () => {
    mockSelect
      // existing own queue → none
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              then: vi.fn((cb: (r: unknown[]) => unknown) =>
                Promise.resolve(cb([])),
              ),
            }),
          }),
        }),
      })
      // waiting game → found
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              then: vi.fn((cb: (r: unknown[]) => unknown) =>
                Promise.resolve(cb([{ id: "waiting-game-id" }])),
              ),
            }),
          }),
        }),
      });

    // /accept returns 200 → redirect
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    await expectRedirect(
      () => play(null, fd("concentric-rapid", "online")),
      "/games/waiting-game-id",
    );
    // Should not create a new game
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
