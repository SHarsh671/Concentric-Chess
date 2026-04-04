/**
 * Tests for the auth server actions in src/actions/auth.ts:
 *   signup, login, logout, updateUsername, updateEmail, updatePassword
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mocks ─────────────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockRedirect = vi.fn((_url: string): never => {
  throw new Error(`NEXT_REDIRECT:${_url}`);
});
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Cookie store mock
const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ set: mockCookieSet, get: mockCookieGet }),
  ),
}));

// DB mock
const mockDbQuery = vi.fn();
const mockDbInsert = vi.fn();
const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();

vi.mock("@/lib/db", () => ({
  db: vi.fn(() => ({
    query: { playersTable: { findFirst: mockDbQuery } },
    insert: mockDbInsert,
    select: mockDbSelect,
    update: mockDbUpdate,
    delete: mockDbDelete,
  })),
}));

// Auth helpers mock – validation and password operations
const mockCheckUsername = vi.fn();
const mockCheckEmail = vi.fn();
const mockCheckPassword = vi.fn();
const mockRegisterPlayer = vi.fn();
const mockLoginWithUsername = vi.fn();
const mockVerifyPassword = vi.fn();
const mockHashPassword = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/lib/auth", () => ({
  checkUsername: (...a: unknown[]) => mockCheckUsername(...a),
  checkEmail: (...a: unknown[]) => mockCheckEmail(...a),
  checkPassword: (...a: unknown[]) => mockCheckPassword(...a),
  registerPlayer: (...a: unknown[]) => mockRegisterPlayer(...a),
  loginWithUsername: (...a: unknown[]) => mockLoginWithUsername(...a),
  verifyPassword: (...a: unknown[]) => mockVerifyPassword(...a),
  hashPassword: (...a: unknown[]) => mockHashPassword(...a),
  getSession: (...a: unknown[]) => mockGetSession(...a),
}));

const { signup, login, logout, updateUsername, updateEmail, updatePassword } =
  await import("./auth");

// ── helpers ───────────────────────────────────────────────────────────────

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

async function expectRedirectTo(fn: () => Promise<unknown>, path: string) {
  try {
    await fn();
    expect.fail("Expected redirect");
  } catch (e: unknown) {
    expect((e as Error).message).toContain(`NEXT_REDIRECT:${path}`);
  }
}

// ── signup ─────────────────────────────────────────────────────────────────

describe("signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckUsername.mockResolvedValue(undefined);
    mockCheckEmail.mockResolvedValue(undefined);
    mockCheckPassword.mockResolvedValue(undefined);
    mockRegisterPlayer.mockResolvedValue({
      token: "tok",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  it("returns an error when passwords do not match", async () => {
    const result = await signup(
      null,
      fd({
        email: "a@b.com",
        username: "user",
        password: "pass1",
        "confirm-password": "pass2",
      }),
    );
    expect(result).toMatchObject({ message: /do not match/i });
  });

  it("returns a username validation error when checkUsername fails", async () => {
    mockCheckUsername.mockResolvedValue(
      "Username must be 3-20 characters long",
    );
    const result = await signup(
      null,
      fd({
        email: "a@b.com",
        username: "x",
        password: "pass",
        "confirm-password": "pass",
      }),
    );
    expect(result).toMatchObject({ message: /3.{0,10}20/ });
  });

  it("returns an email validation error when checkEmail fails", async () => {
    mockCheckEmail.mockResolvedValue("Email must be a valid email address.");
    const result = await signup(
      null,
      fd({
        email: "bad",
        username: "validuser",
        password: "pass",
        "confirm-password": "pass",
      }),
    );
    expect(result).toMatchObject({ message: /valid email/i });
  });

  it("returns a password validation error when checkPassword fails", async () => {
    mockCheckPassword.mockResolvedValue(
      "Password must be between 8 and 30 characters long.",
    );
    const result = await signup(
      null,
      fd({
        email: "a@b.com",
        username: "validuser",
        password: "short",
        "confirm-password": "short",
      }),
    );
    expect(result).toMatchObject({ message: /8.{0,10}30/ });
  });

  it("sets session cookie and redirects on success", async () => {
    await expectRedirectTo(
      () =>
        signup(
          null,
          fd({
            email: "a@b.com",
            username: "validuser",
            password: "goodpass1",
            "confirm-password": "goodpass1",
          }),
        ),
      "/",
    );
    expect(mockCookieSet).toHaveBeenCalledWith(
      "session_token",
      "tok",
      expect.any(Object),
    );
  });

  it("returns an error message when registerPlayer throws", async () => {
    mockRegisterPlayer.mockRejectedValue(new Error("DB error"));
    const result = await signup(
      null,
      fd({
        email: "a@b.com",
        username: "validuser",
        password: "goodpass1",
        "confirm-password": "goodpass1",
      }),
    );
    expect(result).toMatchObject({ message: /unexpected error/i });
  });
});

// ── login ──────────────────────────────────────────────────────────────────

describe("login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an error for invalid credentials", async () => {
    mockLoginWithUsername.mockResolvedValue(null);
    const result = await login(
      null,
      fd({ username: "user", password: "wrong" }),
    );
    expect(result).toMatchObject({ message: /invalid username or password/i });
  });

  it("sets cookie and redirects on successful login", async () => {
    mockLoginWithUsername.mockResolvedValue({
      token: "tok",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    await expectRedirectTo(
      () => login(null, fd({ username: "user", password: "correct" })),
      "/",
    );
    expect(mockCookieSet).toHaveBeenCalledWith(
      "session_token",
      "tok",
      expect.any(Object),
    );
  });

  it("returns an error message when loginWithUsername throws", async () => {
    mockLoginWithUsername.mockRejectedValue(new Error("DB error"));
    const result = await login(
      null,
      fd({ username: "user", password: "pass" }),
    );
    expect(result).toMatchObject({ message: /unexpected error/i });
  });
});

// ── logout ─────────────────────────────────────────────────────────────────

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieGet.mockReturnValue({ value: "tok" });
    mockDbDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("clears the session cookie and redirects", async () => {
    await expectRedirectTo(() => logout(), "/");
    expect(mockCookieSet).toHaveBeenCalledWith(
      "session_token",
      "",
      expect.objectContaining({ expires: expect.any(Date) }),
    );
  });

  it("returns an error message when deletion throws", async () => {
    mockDbDelete.mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error("DB error")),
    });
    const result = await logout();
    expect(result).toMatchObject({ message: /unexpected error/i });
  });
});

// ── updateUsername ─────────────────────────────────────────────────────────

describe("updateUsername", () => {
  const mockPlayer = { id: "p1", password: "hashed" };
  const mockSelectChain = () => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          then: vi.fn((cb: (r: unknown[]) => unknown) =>
            Promise.resolve(cb([mockPlayer])),
          ),
        }),
      }),
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckUsername.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ playerId: "p1", token: "tok" });
    mockVerifyPassword.mockResolvedValue(true);
    mockDbSelect.mockReturnValue(mockSelectChain());
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
  });

  it("returns username validation error when checkUsername fails", async () => {
    mockCheckUsername.mockResolvedValue(
      "Username must be 3-20 characters long",
    );
    const result = await updateUsername(
      null,
      fd({ username: "x", password: "pass" }),
    );
    expect(result).toMatchObject({ message: /3.{0,10}20/ });
  });

  it("returns an error when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await updateUsername(
      null,
      fd({ username: "newname", password: "pass" }),
    );
    expect(result).toMatchObject({ message: /logged in/i });
  });

  it("returns an error when password is wrong", async () => {
    mockVerifyPassword.mockResolvedValue(false);
    const result = await updateUsername(
      null,
      fd({ username: "newname", password: "wrong" }),
    );
    expect(result).toMatchObject({ message: /invalid password/i });
  });

  it("redirects to /settings on success", async () => {
    await expectRedirectTo(
      () =>
        updateUsername(null, fd({ username: "newname", password: "correct" })),
      "/settings",
    );
  });
});

// ── updateEmail ────────────────────────────────────────────────────────────

describe("updateEmail", () => {
  const mockPlayer = { id: "p1", password: "hashed" };
  const mockSelectChain = () => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          then: vi.fn((cb: (r: unknown[]) => unknown) =>
            Promise.resolve(cb([mockPlayer])),
          ),
        }),
      }),
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckEmail.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ playerId: "p1", token: "tok" });
    mockVerifyPassword.mockResolvedValue(true);
    mockDbSelect.mockReturnValue(mockSelectChain());
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
  });

  it("returns email validation error when checkEmail fails", async () => {
    mockCheckEmail.mockResolvedValue("Email must be a valid email address.");
    const result = await updateEmail(null, fd({ email: "bad", password: "p" }));
    expect(result).toMatchObject({ message: /valid email/i });
  });

  it("returns an error when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await updateEmail(
      null,
      fd({ email: "new@example.com", password: "pass" }),
    );
    expect(result).toMatchObject({ message: /logged in/i });
  });

  it("returns an error when password is wrong", async () => {
    mockVerifyPassword.mockResolvedValue(false);
    const result = await updateEmail(
      null,
      fd({ email: "new@example.com", password: "wrong" }),
    );
    expect(result).toMatchObject({ message: /invalid password/i });
  });

  it("redirects to /settings on success", async () => {
    await expectRedirectTo(
      () =>
        updateEmail(
          null,
          fd({ email: "new@example.com", password: "correct" }),
        ),
      "/settings",
    );
  });
});

// ── updatePassword ─────────────────────────────────────────────────────────

describe("updatePassword", () => {
  const mockPlayer = { id: "p1", password: "hashed" };
  const mockSelectChain = () => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          then: vi.fn((cb: (r: unknown[]) => unknown) =>
            Promise.resolve(cb([mockPlayer])),
          ),
        }),
      }),
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckPassword.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ playerId: "p1", token: "tok" });
    mockVerifyPassword.mockResolvedValue(true);
    mockHashPassword.mockResolvedValue("newhash");
    mockDbSelect.mockReturnValue(mockSelectChain());
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
  });

  it("returns an error when new passwords do not match", async () => {
    const result = await updatePassword(
      null,
      fd({
        password: "current",
        new_password: "newpass1",
        confirm_password: "newpass2",
      }),
    );
    expect(result).toMatchObject({ message: /do not match/i });
  });

  it("returns a password validation error when checkPassword fails", async () => {
    mockCheckPassword.mockResolvedValue(
      "Password must be between 8 and 30 characters long.",
    );
    const result = await updatePassword(
      null,
      fd({
        password: "current",
        new_password: "short",
        confirm_password: "short",
      }),
    );
    expect(result).toMatchObject({ message: /8.{0,10}30/ });
  });

  it("returns an error when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await updatePassword(
      null,
      fd({
        password: "current",
        new_password: "newpass12",
        confirm_password: "newpass12",
      }),
    );
    expect(result).toMatchObject({ message: /logged in/i });
  });

  it("returns an error when current password is wrong", async () => {
    mockVerifyPassword.mockResolvedValue(false);
    const result = await updatePassword(
      null,
      fd({
        password: "wrong",
        new_password: "newpass12",
        confirm_password: "newpass12",
      }),
    );
    expect(result).toMatchObject({ message: /invalid current password/i });
  });

  it("redirects to /settings on success", async () => {
    await expectRedirectTo(
      () =>
        updatePassword(
          null,
          fd({
            password: "current",
            new_password: "newpass12",
            confirm_password: "newpass12",
          }),
        ),
      "/settings",
    );
  });
});
