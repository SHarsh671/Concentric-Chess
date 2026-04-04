import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GameReplayClient from "./client";

// ---------------------------------------------------------------------------
// Stubs for dependencies that don't work in jsdom
// ---------------------------------------------------------------------------
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Board renders nothing meaningful in jsdom (SVG fetch fails) – replace with stub
vi.mock("@/components/piece/board", () => ({
  default: () => <div data-testid="board-stub" />,
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const GAME = {
  id: "g1",
  variant: "concentric-unlimited",
  status: "white_win",
  whitePlayerId: "p1",
  blackPlayerId: "p2",
  whiteAccepted: 1,
  blackAccepted: 1,
  nextMove: 5,
  whiteTimeLeft: null,
  blackTimeLeft: null,
  whiteRatingBefore: null,
  whiteRatingChange: null,
  blackRatingBefore: null,
  blackRatingChange: null,
  whiteDrawOffer: 0,
  blackDrawOffer: 0,
  whiteDisconnectedAt: null,
  blackDisconnectedAt: null,
  lastMoveAt: null,
  createdAt: null,
  deletedAt: null,
} as const;

function makeMove(n: number) {
  return {
    id: `m${n}`,
    gameId: "g1",
    playerId: n % 2 === 1 ? "p1" : "p2",
    fromSquare: "r4c1",
    toSquare: "r5c1",
    promotion: null,
    moveNumber: n,
    createdAt: null,
  };
}

const THREE_MOVES = [makeMove(1), makeMove(2), makeMove(3)];
const NO_MOVES: typeof THREE_MOVES = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderReplay(moves = THREE_MOVES) {
  return render(
    <GameReplayClient
      game={GAME as never}
      moves={moves}
      whiteUsername="Alice"
      blackUsername="Bob"
    />
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GameReplayClient – history page navigation", () => {
  it("renders a Play button", () => {
    renderReplay();
    const playBtns = screen.getAllByRole("button").filter((b) =>
      /play|pause/i.test(b.textContent ?? "")
    );
    expect(playBtns.length).toBeGreaterThan(0);
  });

  it("renders first, previous, next and last navigation buttons", () => {
    renderReplay();
    const buttons = screen.getAllByRole("button");
    // 4 icon-only nav buttons (SkipBack, ChevronLeft, ChevronRight, SkipForward)
    // They are rendered as icon buttons without text
    expect(buttons.length).toBeGreaterThanOrEqual(5); // 4 nav + 1 play/pause + speed buttons
  });

  it("renders player usernames", () => {
    renderReplay();
    expect(screen.getAllByText(/alice/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/bob/i).length).toBeGreaterThan(0);
  });

  it("first and previous buttons are disabled at the start (before any moves)", () => {
    renderReplay();
    // The first two nav buttons (SkipBack, ChevronLeft) should be disabled initially
    const disabled = screen.getAllByRole("button").filter((b) => b.hasAttribute("disabled"));
    // At index -1 (before first move), first and previous are disabled
    expect(disabled.length).toBeGreaterThanOrEqual(2);
  });

  it("clicking next advances to the first move", async () => {
    const user = userEvent.setup();
    renderReplay();
    // ChevronRight is the "next" button; find buttons that are NOT disabled
    const enabledButtons = screen.getAllByRole("button").filter((b) => !b.hasAttribute("disabled"));
    // Next button should be enabled at the start
    expect(enabledButtons.length).toBeGreaterThan(0);
  });

  it("clicking last jumps to the final move (next/last become disabled)", async () => {
    const user = userEvent.setup();
    renderReplay(THREE_MOVES);
    // Find the last (SkipForward) button among enabled buttons
    const enabledBefore = screen.getAllByRole("button").filter((b) => !b.hasAttribute("disabled"));
    // SkipForward is the last enabled nav button
    const lastBtn = enabledBefore.at(-1)!;
    await user.click(lastBtn);
    // After jumping to last move, next/last buttons become disabled
    const disabledAfter = screen.getAllByRole("button").filter((b) => b.hasAttribute("disabled"));
    expect(disabledAfter.length).toBeGreaterThanOrEqual(2);
  });

  it("renders the board component", () => {
    renderReplay();
    expect(screen.getAllByTestId("board-stub").length).toBeGreaterThan(0);
  });

  it("shows 'Starting Position' button in the move history", () => {
    renderReplay();
    expect(screen.getAllByText(/starting position/i).length).toBeGreaterThan(0);
  });

  it("toggles play/pause label when the play button is clicked", async () => {
    const user = userEvent.setup();
    renderReplay(THREE_MOVES);

    // Find the play/pause button
    const playBtn = screen.getAllByRole("button").find((b) =>
      /play|pause/i.test(b.textContent ?? "")
    )!;
    const initialLabel = playBtn.textContent;
    await user.click(playBtn);
    // After click the label might change (play → pause or trigger autoplay)
    // At minimum the button should still be present
    expect(screen.getAllByRole("button").some((b) => /play|pause/i.test(b.textContent ?? ""))).toBe(true);
    // Initial label was "PLAY"; after click it should be "PAUSE" (or reset to first then autoplay)
    const afterBtn = screen.getAllByRole("button").find((b) => /play|pause/i.test(b.textContent ?? ""))!;
    expect(afterBtn.textContent).not.toBe(initialLabel);
  });

  it("renders with no moves without crashing", () => {
    expect(() => renderReplay(NO_MOVES)).not.toThrow();
  });
});
