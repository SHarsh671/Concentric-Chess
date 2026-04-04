import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlayInner from "./inner";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockFormAction = vi.fn();
// Controls returned by useActionState mock – mutate between tests
let mockPending = false;
let mockState: unknown = null;

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: vi.fn((_action: unknown, _initial: unknown) => [mockState, mockFormAction, mockPending]),
  };
});

describe("PlayInner – game lobby / matchmaking view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPending = false;
    mockState = null;
  });

  afterEach(cleanup);

  it("renders both Concentric and Archimedean game type options", () => {
    render(<PlayInner isAuthenticated={false} />);
    expect(screen.getAllByText(/concentric/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/archimedean/i).length).toBeGreaterThan(0);
  });

  it("renders all four time controls", () => {
    render(<PlayInner isAuthenticated={false} />);
    expect(screen.getAllByText(/rapid/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/blitz/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/bullet/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/unlimited/i).length).toBeGreaterThan(0);
  });

  it("renders an Online play option", () => {
    render(<PlayInner isAuthenticated={false} />);
    expect(screen.getAllByText(/online/i).length).toBeGreaterThan(0);
  });

  it("renders a Local play option", () => {
    render(<PlayInner isAuthenticated={false} />);
    expect(screen.getAllByText(/local/i).length).toBeGreaterThan(0);
  });

  it("renders a play / start game button", () => {
    render(<PlayInner isAuthenticated={true} />);
    const buttons = screen.getAllByRole("button");
    const playBtn = buttons.find((b) => /start.?game|login.?to.?start/i.test(b.textContent ?? ""));
    expect(playBtn).toBeTruthy();
  });

  it("shows a sign-in prompt when the user is not authenticated and online mode is active", () => {
    render(<PlayInner isAuthenticated={false} />);
    expect(
      screen.queryAllByRole("link").some((l) => /sign.?in|log.?in|login|account/i.test(l.textContent ?? "")) ||
      screen.queryAllByText(/sign.?in|log.?in|login|account/i).length > 0
    ).toBe(true);
  });

  it("selecting Archimedean updates the displayed game type", async () => {
    const user = userEvent.setup();
    render(<PlayInner isAuthenticated={true} />);
    const archimedeanBtns = screen.getAllByText(/archimedean/i);
    const btn = archimedeanBtns.find((el) => el.closest("button"));
    expect(btn).toBeTruthy();
    await user.click(btn!.closest("button")!);
    expect(btn!.closest("button")).toHaveClass("border-black");
  });

  // §8.2.2 – loading/disabled states prevent duplicate matchmaking requests
  it("submit button is disabled while matchmaking is pending", () => {
    mockPending = true;
    render(<PlayInner isAuthenticated={true} />);
    const buttons = screen.getAllByRole("button");
    const submitBtn = buttons.find((b) => /start.?game/i.test(b.textContent ?? ""));
    expect(submitBtn).toBeTruthy();
    expect(submitBtn).toBeDisabled();
  });

  it("submit button is disabled when user is not authenticated", () => {
    render(<PlayInner isAuthenticated={false} />);
    const buttons = screen.getAllByRole("button");
    const submitBtn = buttons.find((b) => /login.?to.?start/i.test(b.textContent ?? ""));
    expect(submitBtn).toBeTruthy();
    expect(submitBtn).toBeDisabled();
  });

  // §8.2.2 – error display from server action
  it("displays an error message returned by the server action", () => {
    mockState = { error: "Invalid game variant selected." };
    render(<PlayInner isAuthenticated={true} />);
    expect(screen.getByText(/invalid game variant selected/i)).toBeTruthy();
  });
});
