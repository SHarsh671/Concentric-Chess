import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import type { Game, Move } from "shared";

// ---------------------------------------------------------------------------
// Hoisted mock state (must be created before vi.mock factories run)
// ---------------------------------------------------------------------------
const { capturedListenerRef, mockSend, mockSetListener, mockDisconnect } =
  vi.hoisted(() => {
    const capturedListenerRef = {
      current: null as ((msg: unknown) => void) | null,
    };
    const mockSend = vi.fn();
    const mockSetListener = vi
      .fn()
      .mockImplementation(
        (fn: ((msg: unknown) => void) | null) =>
          (capturedListenerRef.current = fn),
      );
    const mockDisconnect = vi.fn();
    return { capturedListenerRef, mockSend, mockSetListener, mockDisconnect };
  });

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// ResizeObserver is absent in jsdom
vi.stubGlobal(
  "ResizeObserver",
  vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })),
);

vi.mock("@/lib/ws", () => ({
  GameSocket: {
    getInstance: vi.fn(() => ({
      send: mockSend,
      setListener: mockSetListener,
      disconnect: mockDisconnect,
    })),
  },
}));

vi.mock("@/components/piece/board", () => ({
  default: () => <div data-testid="board-stub" />,
}));
vi.mock("@/components/piece/rules-dialog", () => ({ default: () => null }));
vi.mock("@/components/piece/spiral-rules-dialog", () => ({
  default: () => null,
}));
vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }) => <img src={src} alt={alt} width={width} height={height} />,
}));

// ---------------------------------------------------------------------------
// Import the component under test (after mocks are registered)
// ---------------------------------------------------------------------------
import GamePage from "./inner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "test-game-1",
    variant: "concentric-standard",
    whitePlayerId: "player-white",
    blackPlayerId: "player-black",
    whiteAccepted: 1,
    blackAccepted: 1,
    whiteDisconnectedAt: null,
    blackDisconnectedAt: null,
    whiteDrawOffer: 0,
    blackDrawOffer: 0,
    status: "ongoing",
    nextMove: 1,
    lastMoveAt: null,
    whiteTimeLeft: 300_000,
    blackTimeLeft: 300_000,
    whiteRatingBefore: null,
    whiteRatingChange: null,
    blackRatingBefore: null,
    blackRatingChange: null,
    createdAt: new Date().toISOString(),
    deletedAt: null,
    ...overrides,
  } as Game;
}

function renderGame(game: Game, moves: Move[] = [], playerId?: string) {
  return render(
    <GamePage
      game={game}
      moves={moves}
      playerId={playerId}
      whiteUsername="Alice"
      blackUsername="Bob"
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GamePage – live game view", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockDisconnect.mockClear();
    mockSetListener.mockClear();
    capturedListenerRef.current = null;
  });

  afterEach(cleanup);

  // ── Waiting / invite screens ─────────────────────────────────────────────

  describe("waiting screens", () => {
    it("shows 'Waiting for Opponent' when neither player has accepted", () => {
      renderGame(
        makeGame({
          whitePlayerId: "player-white",
          blackPlayerId: null,
          whiteAccepted: 1,
          blackAccepted: 0,
        }),
        [],
        "player-white",
      );
      expect(screen.getByText(/waiting for opponent/i)).toBeInTheDocument();
    });

    it("shows 'Challenge Received' when this player has not accepted an invite", () => {
      renderGame(makeGame({ whiteAccepted: 0 }), [], "player-white");
      expect(screen.getByText(/challenge received/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /accept game/i }),
      ).toBeInTheDocument();
    });

    it("accepts the game when 'Accept Game' button is clicked", () => {
      renderGame(makeGame({ whiteAccepted: 0 }), [], "player-white");
      screen.getAllByRole("button", { name: /accept game/i })[0].click();
      expect(mockSend).toHaveBeenCalledWith({ type: "accept" });
    });
  });

  // ── Game-over / tactical banners ─────────────────────────────────────────

  describe("status banners", () => {
    it("shows a White Wins banner when status is white_win", () => {
      renderGame(makeGame({ status: "white_win" }));
      expect(screen.getByText(/white wins/i)).toBeInTheDocument();
    });

    it("shows a Black Wins banner when status is black_win", () => {
      renderGame(makeGame({ status: "black_win" }));
      expect(screen.getByText(/black wins/i)).toBeInTheDocument();
    });

    it("shows 'White Resigned — Black Wins' when status is white_resign", () => {
      renderGame(makeGame({ status: "white_resign" }));
      expect(screen.getByText(/white resigned/i)).toBeInTheDocument();
    });

    it("shows 'Black Resigned — White Wins' when status is black_resign", () => {
      renderGame(makeGame({ status: "black_resign" }));
      expect(screen.getByText(/black resigned/i)).toBeInTheDocument();
    });

    it("shows 'Game Drawn' banner when status is draw", () => {
      renderGame(makeGame({ status: "draw" }));
      expect(screen.getByText(/game drawn/i)).toBeInTheDocument();
    });

    it("shows no game-over banner when the game is ongoing", () => {
      renderGame(makeGame({ status: "ongoing" }));
      expect(
        screen.queryByText(
          /♔ white wins|♚ black wins|white resigned|black resigned|game drawn/i,
        ),
      ).not.toBeInTheDocument();
    });
  });

  // ── Spectator vs player (§8 Live Game Board) ────────────────────────────

  describe("spectator vs player", () => {
    it("shows Draw and Resign buttons for a player in an ongoing game", () => {
      renderGame(makeGame(), [], "player-white");
      expect(
        screen.getAllByRole("button", { name: /draw/i }).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("button", { name: /resign/i }).length,
      ).toBeGreaterThan(0);
    });

    it("hides Draw and Resign buttons for a spectator", () => {
      renderGame(makeGame(), [], undefined);
      expect(
        screen.queryByRole("button", { name: /resign/i }),
      ).not.toBeInTheDocument();
    });

    it("hides action buttons when the game is already over", () => {
      renderGame(makeGame({ status: "white_win" }), [], "player-white");
      expect(
        screen.queryByRole("button", { name: /resign/i }),
      ).not.toBeInTheDocument();
    });

    it("renders the board component", () => {
      renderGame(makeGame(), [], "player-white");
      expect(screen.getAllByTestId("board-stub").length).toBeGreaterThan(0);
    });

    it("displays both player usernames", () => {
      renderGame(makeGame(), [], "player-white");
      expect(screen.getAllByText(/alice/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/bob/i).length).toBeGreaterThan(0);
    });
  });

  // ── Draw offer prompt ────────────────────────────────────────────────────

  describe("draw offers (§8 Real-Time Feedback)", () => {
    it("shows draw offer prompt when the opponent has offered a draw", () => {
      // player is white; opponent is black → blackDrawOffer=1 means opponent offered
      renderGame(makeGame({ blackDrawOffer: 1 }), [], "player-white");
      expect(
        screen.getAllByText(/opponent offers a draw/i).length,
      ).toBeGreaterThan(0);
    });

    it("shows Accept and Decline buttons in the draw offer prompt", () => {
      renderGame(makeGame({ blackDrawOffer: 1 }), [], "player-white");
      expect(
        screen.getAllByRole("button", { name: /accept/i }).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("button", { name: /decline/i }).length,
      ).toBeGreaterThan(0);
    });

    it("shows 'Draw Offered' indicator when this player has offered a draw", () => {
      // player is white; whiteDrawOffer=1 means this player offered
      renderGame(makeGame({ whiteDrawOffer: 1 }), [], "player-white");
      expect(screen.getAllByText(/draw offered/i).length).toBeGreaterThan(0);
    });
  });

  // ── WebSocket message handling (§8.2.3 / §9.2.4 desync) ─────────────────

  describe("WebSocket message handling", () => {
    it("updates the game-over banner when a game_over message is received", () => {
      renderGame(makeGame(), [], "player-white");
      act(() => {
        capturedListenerRef.current!({
          type: "game_over",
          data: {
            result: "white_win",
            whiteTimeLeft: 200_000,
            blackTimeLeft: 300_000,
          },
        });
      });
      expect(screen.getByText(/white wins/i)).toBeInTheDocument();
    });

    it("sends sync_request when a move arrives out of order (desync guard)", () => {
      renderGame(makeGame({ nextMove: 3 }), [], "player-white");
      act(() => {
        capturedListenerRef.current!({
          type: "move",
          data: {
            move: {
              id: "m1",
              gameId: "test-game-1",
              moveNumber: 5,
              fromSquare: "r3c1",
              toSquare: "r5c2",
              promotion: null,
              whiteTimeLeft: 300_000,
              blackTimeLeft: 300_000,
              createdAt: new Date().toISOString(),
            },
            nextMove: 6,
            lastMoveAt: new Date().toISOString(),
            whiteTimeLeft: 300_000,
            blackTimeLeft: 300_000,
          },
        });
      });
      expect(mockSend).toHaveBeenCalledWith({ type: "sync_request" });
    });

    it("replaces game state when a sync message is received", () => {
      renderGame(makeGame(), [], "player-white");
      act(() => {
        capturedListenerRef.current!({
          type: "sync",
          data: {
            game: makeGame({ status: "black_win" }),
            moves: [],
          },
        });
      });
      expect(screen.getByText(/black wins/i)).toBeInTheDocument();
    });
  });

  // ── Timer display ────────────────────────────────────────────────────────

  describe("timer display (§8 Timers & Feedback)", () => {
    it("shows ∞ when the time control is unlimited (null time)", () => {
      renderGame(
        makeGame({ whiteTimeLeft: null, blackTimeLeft: null }),
        [],
        "player-white",
      );
      expect(screen.getAllByText("∞").length).toBeGreaterThan(0);
    });

    it("shows formatted time MM:SS for timed games", () => {
      // 5 minutes = 300 000 ms → "5:00"
      renderGame(
        makeGame({ whiteTimeLeft: 300_000, blackTimeLeft: 300_000 }),
        [],
        "player-white",
      );
      expect(screen.getAllByText("5:00").length).toBeGreaterThan(0);
    });
  });
});
