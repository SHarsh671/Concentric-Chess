/**
 * Integration tests for the Cloudflare Durable Object (GameObject).
 *
 * These tests run inside the workerd runtime via @cloudflare/vitest-pool-workers,
 * which provides real D1 bindings, Durable Objects, and the full CF Workers API.
 *
 * V&V coverage:
 *   §9.2.2 Game Accept Endpoint – atomicity, ownership, 409 on full game
 *   §9.2.2 Move WebSocket Handler – auth, legal/illegal moves, desync guard
 *   §9.2.2 Timeout Alarm         – correct winner, stale-alarm guard
 *   §9.2.3 Persistence & Replay  – atomic move append, replay reconstruction,
 *                                   result immutability after termination
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  env,
  SELF,
  runInDurableObject,
  runDurableObjectAlarm,
} from "cloudflare:test";
import type { GameObject } from "./index";
import type { ServerMsg } from "../shared";
import { getState } from "../shared/rules";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../shared/schema";
import { eq, asc } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Schema (applied fresh before every test)
// ---------------------------------------------------------------------------

const DROP_STMTS = [
  "DROP TABLE IF EXISTS moves",
  "DROP TABLE IF EXISTS ratings",
  "DROP TABLE IF EXISTS sessions",
  "DROP TABLE IF EXISTS games",
  "DROP TABLE IF EXISTS players",
];

const CREATE_STMTS = [
  `CREATE TABLE IF NOT EXISTS players (
    id text PRIMARY KEY,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY,
    token text UNIQUE NOT NULL,
    player_id text REFERENCES players(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS games (
    id text PRIMARY KEY,
    variant text NOT NULL,
    white_player_id text REFERENCES players(id) ON DELETE SET NULL,
    black_player_id text REFERENCES players(id) ON DELETE SET NULL,
    white_accepted boolean DEFAULT FALSE,
    black_accepted boolean DEFAULT FALSE,
    white_disconnected_at timestamp NULL,
    black_disconnected_at timestamp NULL,
    white_draw_offer boolean DEFAULT FALSE,
    black_draw_offer boolean DEFAULT FALSE,
    status text NOT NULL,
    next_move integer NOT NULL,
    last_move_at timestamp DEFAULT CURRENT_TIMESTAMP,
    white_time_left integer NULL,
    black_time_left integer NULL,
    white_rating_before integer NULL,
    white_rating_change integer NULL,
    black_rating_before integer NULL,
    black_rating_change integer NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp NULL
  )`,
  `CREATE TABLE IF NOT EXISTS moves (
    id text PRIMARY KEY,
    game_id text REFERENCES games(id) ON DELETE CASCADE,
    player_id text REFERENCES players(id) ON DELETE CASCADE,
    from_square text NOT NULL,
    to_square text NOT NULL,
    promotion text NULL,
    move_number integer NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS ratings (
    id text PRIMARY KEY,
    player_id text REFERENCES players(id) ON DELETE CASCADE,
    variant text NOT NULL,
    rating integer NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, variant)
  )`,
];

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PLAYER_WHITE = "00000000-0000-0000-0000-000000000001";
const PLAYER_BLACK = "00000000-0000-0000-0000-000000000002";
const PLAYER_OTHER = "00000000-0000-0000-0000-000000000003";
const TOKEN_WHITE = "token-white";
const TOKEN_BLACK = "token-black";
const TOKEN_OTHER = "token-other";
const GAME_ID = "aaaaaaaa-bbbb-cccc-dddd-000000000001";
const GAME_ID_2 = "aaaaaaaa-bbbb-cccc-dddd-000000000002";

const BASE_URL = "http://do.example.com";
const gameUrl = (id: string, endpoint: string) =>
  `${BASE_URL}/do/games/${id}/${endpoint}`;

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function resetDB() {
  for (const stmt of DROP_STMTS) await env.DB.exec(stmt);
  for (const stmt of CREATE_STMTS) await env.DB.prepare(stmt).run();
}

async function insertPlayer(id: string, token: string, suffix = "") {
  const tag = suffix || id.slice(-4);
  await env.DB.prepare(
    "INSERT INTO players (id, username, email, password) VALUES (?, ?, ?, ?)",
  )
    .bind(id, `user_${tag}`, `${tag}@test.com`, "hash")
    .run();
  await env.DB.prepare(
    "INSERT INTO sessions (id, token, player_id, expires_at) VALUES (?, ?, ?, datetime('now', '+7 days'))",
  )
    .bind(`sess_${tag}`, token, id)
    .run();
}

async function insertGame(
  id: string,
  opts: {
    whitePlayerId?: string | null;
    blackPlayerId?: string | null;
    whiteAccepted?: number;
    blackAccepted?: number;
    status?: string;
    nextMove?: number;
    whiteTimeLeft?: number | null;
    blackTimeLeft?: number | null;
    lastMoveAt?: string;
  } = {},
) {
  const {
    whitePlayerId = PLAYER_WHITE,
    blackPlayerId = PLAYER_BLACK,
    whiteAccepted = 1,
    blackAccepted = 1,
    status = "ongoing",
    nextMove = 1,
    whiteTimeLeft = 300_000,
    blackTimeLeft = 300_000,
    lastMoveAt = new Date().toISOString(),
  } = opts;
  await env.DB.prepare(
    `INSERT INTO games (id, variant, white_player_id, black_player_id,
       white_accepted, black_accepted, status, next_move,
       white_time_left, black_time_left, last_move_at)
     VALUES (?, 'concentric-standard', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      whitePlayerId,
      blackPlayerId,
      whiteAccepted,
      blackAccepted,
      status,
      nextMove,
      whiteTimeLeft,
      blackTimeLeft,
      lastMoveAt,
    )
    .run();
}

/** Returns messages broadcast via all fake WebSockets attached to a DO stub. */
function makeWsHarness() {
  const messages: ServerMsg[] = [];
  const fakeWs = {
    send(raw: string) {
      messages.push(JSON.parse(raw) as ServerMsg);
    },
    // Workerd uses these for cleanup but we don't need them in tests
    close() {},
    serializeAttachment() {},
  } as unknown as WebSocket;
  return { fakeWs, messages };
}

async function attachWsToStub(
  stub: DurableObjectStub<GameObject>,
  gameId: string,
  playerId: string | null,
  fakeWs: WebSocket,
) {
  await runInDurableObject(stub, async (instance) => {
    instance.sockets.set(fakeWs, { gameId, playerId });
  });
}

function doStub(gameId: string) {
  return env.GAME_OBJECT.get(env.GAME_OBJECT.idFromName(gameId));
}

// ---------------------------------------------------------------------------
// §9.2.2 – Game Accept Endpoint
// ---------------------------------------------------------------------------

describe("Game Accept Endpoint (§9.2.2)", () => {
  beforeEach(async () => {
    await resetDB();
    await insertPlayer(PLAYER_WHITE, TOKEN_WHITE);
    await insertPlayer(PLAYER_BLACK, TOKEN_BLACK);
    await insertPlayer(PLAYER_OTHER, TOKEN_OTHER, "other");
  });

  it("returns 200 when an invited player accepts their slot", async () => {
    await insertGame(GAME_ID, { whiteAccepted: 0 });
    const res = await SELF.fetch(gameUrl(GAME_ID, "accept"), {
      method: "POST",
      headers: { Cookie: `session_token=${TOKEN_WHITE}` },
    });
    expect(res.status).toBe(200);
  });

  it("sets whiteAccepted=1 in the DB after white player accepts", async () => {
    await insertGame(GAME_ID, { whiteAccepted: 0 });
    await SELF.fetch(gameUrl(GAME_ID, "accept"), {
      method: "POST",
      headers: { Cookie: `session_token=${TOKEN_WHITE}` },
    });
    const row = await env.DB.prepare(
      "SELECT white_accepted FROM games WHERE id = ?",
    )
      .bind(GAME_ID)
      .first<{ white_accepted: number }>();
    expect(row?.white_accepted).toBe(1);
  });

  it("returns 200 when an open-queue game has its empty slot claimed", async () => {
    // Only white player is assigned; black slot is open
    await insertGame(GAME_ID, { blackPlayerId: null, blackAccepted: 0 });
    const res = await SELF.fetch(gameUrl(GAME_ID, "accept"), {
      method: "POST",
      headers: { Cookie: `session_token=${TOKEN_BLACK}` },
    });
    expect(res.status).toBe(200);
    // DB should now have PLAYER_BLACK assigned
    const row = await env.DB.prepare(
      "SELECT black_player_id FROM games WHERE id = ?",
    )
      .bind(GAME_ID)
      .first<{ black_player_id: string }>();
    expect(row?.black_player_id).toBe(PLAYER_BLACK);
  });

  it("returns 409 when the game already has both players assigned", async () => {
    // Both slots full → third player can't join
    await insertGame(GAME_ID);
    const res = await SELF.fetch(gameUrl(GAME_ID, "accept"), {
      method: "POST",
      headers: { Cookie: `session_token=${TOKEN_OTHER}` },
    });
    expect(res.status).toBe(409);
  });

  it("two concurrent accepts to the same open slot: exactly one 200, one 409", async () => {
    // Open game: white assigned, black slot is null
    await insertGame(GAME_ID, { blackPlayerId: null, blackAccepted: 0 });
    await insertGame(GAME_ID_2, { blackPlayerId: null, blackAccepted: 0 });

    // PLAYER_BLACK and PLAYER_OTHER both race to claim the black slot
    // Use the same game object (same DO instance) so the lock serialises them
    const [r1, r2] = await Promise.all([
      SELF.fetch(gameUrl(GAME_ID, "accept"), {
        method: "POST",
        headers: { Cookie: `session_token=${TOKEN_BLACK}` },
      }),
      SELF.fetch(gameUrl(GAME_ID, "accept"), {
        method: "POST",
        headers: { Cookie: `session_token=${TOKEN_OTHER}` },
      }),
    ]);
    const statuses = [r1.status, r2.status].sort((a, b) => a - b);
    expect(statuses).toEqual([200, 409]);
  });

  it("broadcasts 'accepted' message to connected clients after accept", async () => {
    await insertGame(GAME_ID, { whiteAccepted: 0 });
    const stub = doStub(GAME_ID);
    const { fakeWs, messages } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    await SELF.fetch(gameUrl(GAME_ID, "accept"), {
      method: "POST",
      headers: { Cookie: `session_token=${TOKEN_WHITE}` },
    });

    expect(messages.some((m) => m.type === "accepted")).toBe(true);
  });

  it("returns 404 when no session token is provided", async () => {
    await insertGame(GAME_ID);
    const res = await SELF.fetch(gameUrl(GAME_ID, "accept"), {
      method: "POST",
    });
    // No session → falls to the else branch → 404
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// §9.2.2 – Move WebSocket Handler
// ---------------------------------------------------------------------------

describe("Move WebSocket Handler (§9.2.2)", () => {
  beforeEach(async () => {
    await resetDB();
    await insertPlayer(PLAYER_WHITE, TOKEN_WHITE);
    await insertPlayer(PLAYER_BLACK, TOKEN_BLACK);
    await insertPlayer(PLAYER_OTHER, TOKEN_OTHER, "other");
    await insertGame(GAME_ID);
  });

  it("records a legal move in the moves table", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "white", from: "r3c1", to: "r5c2" },
        }),
      );
    });

    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .first<{ cnt: number }>();
    expect(row?.cnt).toBe(1);
  });

  it("broadcasts a move message to all connected clients after a legal move", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs, messages } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "white", from: "r3c1", to: "r5c2" },
        }),
      );
    });

    expect(messages.some((m) => m.type === "move")).toBe(true);
  });

  it("increments nextMove in the DB after a legal move", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "white", from: "r3c1", to: "r5c2" },
        }),
      );
    });

    const row = await env.DB.prepare("SELECT next_move FROM games WHERE id = ?")
      .bind(GAME_ID)
      .first<{ next_move: number }>();
    expect(row?.next_move).toBe(2); // started at 1, now 2
  });

  it("rejects an illegal move (nothing recorded in DB)", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          // Rook can't jump — r1c1 is occupied by its own pieces and this is illegal
          data: { side: "white", from: "r4c1", to: "r10c1" },
        }),
      );
    });

    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .first<{ cnt: number }>();
    expect(row?.cnt).toBe(0);
  });

  it("rejects a move for the opponent's side (authorization check)", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    // PLAYER_WHITE's socket tries to move for black
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "black", from: "r10c1", to: "r8c2" },
        }),
      );
    });

    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .first<{ cnt: number }>();
    expect(row?.cnt).toBe(0);
  });

  it("rejects a move from a spectator (no player ID in socket)", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, null /* spectator */, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "white", from: "r3c1", to: "r5c2" },
        }),
      );
    });

    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .first<{ cnt: number }>();
    expect(row?.cnt).toBe(0);
  });

  it("rejects a move when it is not the sender's turn", async () => {
    // nextMove=1 → white's turn; black player tries to move
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_BLACK, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "black", from: "r10c1", to: "r8c2" },
        }),
      );
    });

    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .first<{ cnt: number }>();
    expect(row?.cnt).toBe(0);
  });

  it("responds to sync_request with the current move list", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs, messages } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({ type: "sync_request" }),
      );
    });

    const syncMsg = messages.find((m) => m.type === "sync");
    expect(syncMsg).toBeDefined();
    expect((syncMsg as Extract<ServerMsg, { type: "sync" }>).data.moves).toEqual([]);
  });

  it("malformed JSON does not crash the handler and records no move", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    // Should not throw even though the message is not valid JSON
    await expect(
      runInDurableObject(stub, async (instance) => {
        await instance.webSocketMessage(fakeWs, "this is { not json");
      }),
    ).resolves.not.toThrow();

    const { results } = await env.DB.prepare(
      "SELECT * FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .all();
    expect(results).toHaveLength(0);
  });

  it("message with missing required fields is rejected, no move recorded", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    // Move message missing 'from' and 'to'
    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({ type: "move", data: { side: "white" } }),
      );
    });

    const { results } = await env.DB.prepare(
      "SELECT * FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .all();
    expect(results).toHaveLength(0);
  });

  it("resign message marks the game with the correct result", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs, messages } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(fakeWs, JSON.stringify({ type: "resign" }));
    });

    const row = await env.DB.prepare("SELECT status FROM games WHERE id = ?")
      .bind(GAME_ID)
      .first<{ status: string }>();
    expect(row?.status).toBe("white_resign");

    const gameOver = messages.find((m) => m.type === "game_over") as
      | Extract<ServerMsg, { type: "game_over" }>
      | undefined;
    expect(gameOver?.data.result).toBe("white_resign");
  });
});

// ---------------------------------------------------------------------------
// §9.2.2 – Timeout Alarm
// ---------------------------------------------------------------------------

describe("Timeout Alarm (§9.2.2)", () => {
  beforeEach(async () => {
    await resetDB();
    await insertPlayer(PLAYER_WHITE, TOKEN_WHITE);
    await insertPlayer(PLAYER_BLACK, TOKEN_BLACK);
  });

  it("awards the win to black when white's clock runs out", async () => {
    // White time left: 1ms, move happened 60 000ms ago → time already expired
    const lastMoveAt = new Date(Date.now() - 60_000).toISOString();
    await insertGame(GAME_ID, {
      nextMove: 1, // white to move
      whiteTimeLeft: 1,
      blackTimeLeft: 300_000,
      lastMoveAt,
    });
    const stub = doStub(GAME_ID);

    // Call the alarm handler directly inside the DO context
    await runInDurableObject(stub, async (instance, state) => {
      await state.storage.put("id", GAME_ID);
      // Pass a truthy alarmInfo to bypass the early-return guard
      await instance.alarm({ isRetry: false } as unknown as AlarmInvocationInfo);
    });

    const row = await env.DB.prepare("SELECT status FROM games WHERE id = ?")
      .bind(GAME_ID)
      .first<{ status: string }>();
    expect(row?.status).toBe("black_win");
  });

  it("awards the win to white when black's clock runs out", async () => {
    const lastMoveAt = new Date(Date.now() - 60_000).toISOString();
    await insertGame(GAME_ID, {
      nextMove: 2, // black to move (nextMove % 2 === 0)
      whiteTimeLeft: 300_000,
      blackTimeLeft: 1,
      lastMoveAt,
    });
    const stub = doStub(GAME_ID);

    await runInDurableObject(stub, async (instance, state) => {
      await state.storage.put("id", GAME_ID);
      await instance.alarm({ isRetry: false } as unknown as AlarmInvocationInfo);
    });

    const row = await env.DB.prepare("SELECT status FROM games WHERE id = ?")
      .bind(GAME_ID)
      .first<{ status: string }>();
    expect(row?.status).toBe("white_win");
  });

  it("broadcasts game_over to connected clients when alarm fires on timeout", async () => {
    const lastMoveAt = new Date(Date.now() - 60_000).toISOString();
    await insertGame(GAME_ID, {
      nextMove: 1,
      whiteTimeLeft: 1,
      blackTimeLeft: 300_000,
      lastMoveAt,
    });
    const stub = doStub(GAME_ID);
    const { fakeWs, messages } = makeWsHarness();

    // Attach ws and run alarm in one context so sockets Map is populated
    await runInDurableObject(stub, async (instance, state) => {
      await state.storage.put("id", GAME_ID);
      instance.sockets.set(fakeWs, { gameId: GAME_ID, playerId: PLAYER_WHITE });
      await instance.alarm({ isRetry: false } as unknown as AlarmInvocationInfo);
    });

    expect(messages.some((m) => m.type === "game_over")).toBe(true);
  });

  it("leaves game ongoing when alarm fires but time has not expired (stale alarm)", async () => {
    // White has plenty of time; alarm fires anyway (stale / leftover alarm)
    const lastMoveAt = new Date(Date.now() - 100).toISOString();
    await insertGame(GAME_ID, {
      nextMove: 1,
      whiteTimeLeft: 300_000,
      blackTimeLeft: 300_000,
      lastMoveAt,
    });
    const stub = doStub(GAME_ID);

    await runInDurableObject(stub, async (_instance, state) => {
      await state.storage.put("id", GAME_ID);
      await state.storage.setAlarm(Date.now());
    });
    await runDurableObjectAlarm(stub);

    const row = await env.DB.prepare("SELECT status FROM games WHERE id = ?")
      .bind(GAME_ID)
      .first<{ status: string }>();
    expect(row?.status).toBe("ongoing");
  });

  it("schedules an alarm for the opponent's remaining time after a move", async () => {
    await insertGame(GAME_ID);
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "white", from: "r3c1", to: "r5c2" },
        }),
      );
    });

    // After the move, an alarm should be scheduled
    const ran = await runDurableObjectAlarm(stub);
    // ran = true means an alarm was scheduled and fired
    expect(ran).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// §9.2.3 – Persistence & Replay
// ---------------------------------------------------------------------------

describe("Persistence & Replay (§9.2.3)", () => {
  beforeEach(async () => {
    await resetDB();
    await insertPlayer(PLAYER_WHITE, TOKEN_WHITE);
    await insertPlayer(PLAYER_BLACK, TOKEN_BLACK);
    await insertGame(GAME_ID);
  });

  it("records exactly one move row per accepted legal move", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    // Make one legal white move
    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "white", from: "r3c1", to: "r5c2" },
        }),
      );
    });

    const { results } = await env.DB.prepare(
      "SELECT * FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .all();
    expect(results).toHaveLength(1);
    expect(results[0].from_square).toBe("r3c1");
    expect(results[0].to_square).toBe("r5c2");
    expect(results[0].move_number).toBe(1);
  });

  it("replaying persisted moves reconstructs the same board state as after live play", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    // White move 1
    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "white", from: "r3c1", to: "r5c2" },
        }),
      );
    });

    const { fakeWs: wsBlack } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_BLACK, wsBlack);

    // Black move 2
    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        wsBlack,
        JSON.stringify({
          type: "move",
          data: { side: "black", from: "r10c1", to: "r8c2" },
        }),
      );
    });

    // Fetch persisted moves from DB using drizzle so column names are camelCased
    const db = drizzle(env.DB, { schema });
    const moves = await db.query.movesTable.findMany({
      where: eq(schema.movesTable.gameId, GAME_ID),
      orderBy: [asc(schema.movesTable.moveNumber)],
    });

    // Replay via the rules engine should produce the same board state
    const replayedState = getState("concentric-standard", moves);
    expect(replayedState.board.has("r5c2")).toBe(true); // white knight at destination
    expect(replayedState.board.has("r3c1")).toBe(false); // origin cleared
    expect(replayedState.board.has("r8c2")).toBe(true); // black knight at destination
    expect(replayedState.board.has("r10c1")).toBe(false); // origin cleared
  });

  it("rejects a move after the game has ended (result immutability)", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    // White resigns → game ends
    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(fakeWs, JSON.stringify({ type: "resign" }));
    });

    // Now try to make a move on the finished game
    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(
        fakeWs,
        JSON.stringify({
          type: "move",
          data: { side: "white", from: "r3c1", to: "r5c2" },
        }),
      );
    });

    // Still exactly zero moves (resign doesn't create a move record; subsequent move is blocked)
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .first<{ cnt: number }>();
    expect(row?.cnt).toBe(0);
  });

  it("does not record a duplicate move if the same move is sent twice", async () => {
    const stub = doStub(GAME_ID);
    const { fakeWs } = makeWsHarness();
    await attachWsToStub(stub, GAME_ID, PLAYER_WHITE, fakeWs);

    const moveMsg = JSON.stringify({
      type: "move",
      data: { side: "white", from: "r3c1", to: "r5c2" },
    });

    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(fakeWs, moveMsg);
    });
    // The second send: nextMove is now 2, but side is still "white" → rejected (it's black's turn)
    await runInDurableObject(stub, async (instance) => {
      await instance.webSocketMessage(fakeWs, moveMsg);
    });

    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM moves WHERE game_id = ?",
    )
      .bind(GAME_ID)
      .first<{ cnt: number }>();
    // Only one move recorded — the second was rejected because it was black's turn
    expect(row?.cnt).toBe(1);
  });
});
