import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ServerMsg } from "shared";

// ---------------------------------------------------------------------------
// Minimal WebSocket mock
// ---------------------------------------------------------------------------
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static CLOSING = 2;
  static CONNECTING = 0;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;

  sent: string[] = [];

  constructor(_url: string) {}

  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

// Keep a reference to each created instance so tests can inspect it
let latestMockSocket: MockWebSocket;
const MockWebSocketFactory = vi.fn().mockImplementation((url: string) => {
  latestMockSocket = new MockWebSocket(url);
  return latestMockSocket;
}) as unknown as typeof MockWebSocket;
(MockWebSocketFactory as unknown as typeof MockWebSocket).OPEN = MockWebSocket.OPEN;
(MockWebSocketFactory as unknown as typeof MockWebSocket).CLOSED = MockWebSocket.CLOSED;
(MockWebSocketFactory as unknown as typeof MockWebSocket).CLOSING = MockWebSocket.CLOSING;
(MockWebSocketFactory as unknown as typeof MockWebSocket).CONNECTING = MockWebSocket.CONNECTING;

vi.stubGlobal("WebSocket", MockWebSocketFactory);

// ---------------------------------------------------------------------------
// Import under test (after stubbing WebSocket)
// ---------------------------------------------------------------------------
import { GameSocket } from "./ws";

describe("GameSocket", () => {
  let socket: GameSocket;
  let mockSocket: MockWebSocket;

  beforeEach(() => {
    (MockWebSocketFactory as ReturnType<typeof vi.fn>).mockClear();
    socket = new GameSocket("test-game-id");
    mockSocket = latestMockSocket;
    mockSocket.sent = [];
    mockSocket.readyState = MockWebSocket.OPEN;
  });

  afterEach(() => {
    socket.removeInstance();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // processMessage
  // -------------------------------------------------------------------------

  describe("processMessage", () => {
    it("parses JSON and calls the registered listener", () => {
      const listener = vi.fn();
      socket.setListener(listener);

      const msg: ServerMsg = {
        type: "sync",
        data: { game: {} as never, moves: [] },
      };
      socket.processMessage(JSON.stringify(msg));

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(msg);
    });

    it("does not throw when no listener is registered", () => {
      socket.setListener(null);
      expect(() =>
        socket.processMessage(JSON.stringify({ type: "aborted" }))
      ).not.toThrow();
    });

    it("delivers the correct message type to the listener", () => {
      let received: ServerMsg | null = null;
      socket.setListener((m) => {
        received = m;
      });

      const moveMsg: ServerMsg = {
        type: "move",
        data: {
          move: {
            id: "m1",
            gameId: "g",
            playerId: "p",
            fromSquare: "r4c1",
            toSquare: "r5c1",
            promotion: null,
            moveNumber: 1,
            createdAt: null,
          },
          nextMove: 2,
          lastMoveAt: new Date().toISOString(),
          whiteTimeLeft: null,
          blackTimeLeft: null,
        },
      };
      socket.processMessage(JSON.stringify(moveMsg));
      expect(received).not.toBeNull();
      expect((received as ServerMsg).type).toBe("move");
    });

    it("delivers game_over messages to the listener", () => {
      let received: ServerMsg | null = null;
      socket.setListener((m) => { received = m; });

      const gameOverMsg: ServerMsg = {
        type: "game_over",
        data: { result: "white_win", whiteTimeLeft: 5000, blackTimeLeft: 0 },
      };
      socket.processMessage(JSON.stringify(gameOverMsg));
      expect((received as ServerMsg | null)?.type).toBe("game_over");
    });

    it("replaces the listener when setListener is called again", () => {
      const first = vi.fn();
      const second = vi.fn();
      socket.setListener(first);
      socket.setListener(second);

      socket.processMessage(JSON.stringify({ type: "aborted" }));

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledOnce();
    });

    it("clears the listener when setListener(null) is called", () => {
      const listener = vi.fn();
      socket.setListener(listener);
      socket.setListener(null);

      socket.processMessage(JSON.stringify({ type: "aborted" }));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // send – open socket
  // -------------------------------------------------------------------------

  describe("send – socket open", () => {
    it("sends the serialised message over the open socket", () => {
      socket.send({ type: "resign" });
      expect(mockSocket.sent).toContain(JSON.stringify({ type: "resign" }));
    });

    it("sends a move message with all required fields", () => {
      socket.send({
        type: "move",
        data: { side: "white", from: "r4c1", to: "r5c1" },
      });
      const payload = JSON.parse(mockSocket.sent.at(-1)!);
      expect(payload.type).toBe("move");
      expect(payload.data.side).toBe("white");
      expect(payload.data.from).toBe("r4c1");
      expect(payload.data.to).toBe("r5c1");
    });
  });

  // -------------------------------------------------------------------------
  // send – socket not ready (queuing)
  // -------------------------------------------------------------------------

  describe("send – socket not ready", () => {
    it("queues messages when the socket is not open", () => {
      // CONNECTING state: socket exists but is not yet open → queues without triggering reconnect
      mockSocket.readyState = MockWebSocket.CONNECTING;

      socket.send({ type: "resign" });

      const queue = (socket as unknown as { queue: unknown[] }).queue;
      expect(queue).toHaveLength(1);
      expect(queue[0]).toEqual({ type: "resign" });
    });

    it("deduplicates identical messages in the queue", () => {
      mockSocket.readyState = MockWebSocket.CONNECTING;

      socket.send({ type: "resign" });
      socket.send({ type: "resign" }); // duplicate

      const queue = (socket as unknown as { queue: unknown[] }).queue;
      expect(queue).toHaveLength(1);
    });

    it("queues different messages separately without deduplication", () => {
      mockSocket.readyState = MockWebSocket.CONNECTING;

      socket.send({ type: "resign" });
      socket.send({ type: "draw" });

      const queue = (socket as unknown as { queue: unknown[] }).queue;
      expect(queue).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // getInstance (singleton)
  // -------------------------------------------------------------------------

  describe("getInstance", () => {
    it("returns the same instance for the same game ID", () => {
      const a = GameSocket.getInstance("game-abc");
      const b = GameSocket.getInstance("game-abc");
      expect(a).toBe(b);
      a.removeInstance();
    });

    it("returns different instances for different game IDs", () => {
      const a = GameSocket.getInstance("game-aaa");
      const b = GameSocket.getInstance("game-bbb");
      expect(a).not.toBe(b);
      a.removeInstance();
      b.removeInstance();
    });
  });
});
