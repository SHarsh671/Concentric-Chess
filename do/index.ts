import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { parse } from "cookie";
import { ClientMsg, schema, ServerMsg, sessionsTable } from "shared";
import * as t from "drizzle-orm";
import { getMovesForGame, recordMove } from "shared/moves";
import {
  computePieceState,
  generatePseudoLegalMovesForPiece,
} from "shared/concentric-rules";

export class GameObject extends DurableObject<CloudflareEnv> {
  db: DrizzleD1Database<typeof schema>;
  sockets: Map<
    WebSocket,
    {
      gameId: string;
      playerId: string;
    }
  >;

  constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env);
    this.db = drizzle(env.DB, { schema });
    this.sockets = new Map();

    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = ws.deserializeAttachment();
      if (attachment) {
        this.sockets.set(ws, { ...attachment });
      }
    });

    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  async getGame(gameId: string) {
    return this.db.query.gamesTable.findFirst({
      where: t.eq(schema.gamesTable.id, gameId),
    });
  }

  async fetch(request: Request) {
    try {
      // this is here because Wrangler just likes to raise an error sometimes if the body isn't used
      if (request.method === "POST" || request.method === "PUT") {
        await request.text();
      }
      const cookie = parse(request.headers.get("Cookie") || "");
      const gameId = request.url.match(URL_PATTERN)?.[1] as string;
      await this.ctx.storage.put("id", gameId);
      const sessionToken = cookie["session_token"] ?? "";
      const session = await this.db
        .select()
        .from(sessionsTable)
        .where(
          t.and(
            t.eq(sessionsTable.token, sessionToken),
            t.gt(sessionsTable.expiresAt, new Date().toISOString()),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]);
      if (!session) {
        return new Response("Unauthorized", { status: 401 });
      }
      const game = await this.getGame(gameId);
      if (!game) {
        return new Response("Game not found", { status: 404 });
      }
      // if (game.status !== "ongoing" || game.deletedAt !== null) {
      //   return new Response("Game is not ongoing", { status: 403 });
      // }
      if (request.url.endsWith("/ws")) {
        const upgradeHeader = request.headers.get("Upgrade");
        if (!upgradeHeader || upgradeHeader !== "websocket") {
          return new Response("Worker expected Upgrade: websocket", {
            status: 426,
          });
        }
        if (request.method !== "GET") {
          return new Response("Worker expected GET method", {
            status: 400,
          });
        }

        // reset disconnection timestamps
        if (
          session.playerId === game.whitePlayerId &&
          game.whiteDisconnectedAt
        ) {
          await this.db
            .update(schema.gamesTable)
            .set({ whiteDisconnectedAt: null })
            .where(t.eq(schema.gamesTable.id, game.id));
        }
        if (
          session.playerId === game.blackPlayerId &&
          game.blackDisconnectedAt
        ) {
          await this.db
            .update(schema.gamesTable)
            .set({ blackDisconnectedAt: null })
            .where(t.eq(schema.gamesTable.id, game.id));
        }

        const websocketPair = new WebSocketPair();
        const [client, server] = Object.values(websocketPair);

        this.ctx.acceptWebSocket(server);

        server.serializeAttachment({ gameId, playerId: session.playerId });
        this.sockets.set(server, {
          gameId,
          playerId: session.playerId,
        });

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      } else if (request.url.endsWith("/accept")) {
        const now = new Date();
        // first, check if the player is part of the game
        if (session.playerId === game.whitePlayerId) {
          await this.db
            .update(schema.gamesTable)
            .set({ whiteAccepted: 1, lastMoveAt: now.toISOString() })
            .where(t.eq(schema.gamesTable.id, game.id));
          await this.broadcastToGame(game.id, {
            type: "accepted",
            data: {
              whitePlayerId: session.playerId,
              blackPlayerId: game.blackPlayerId,
            },
          });
          return new Response("Game accepted", { status: 200 });
        }
        if (session.playerId === game.blackPlayerId) {
          await this.db
            .update(schema.gamesTable)
            .set({ blackAccepted: 1, lastMoveAt: now.toISOString() })
            .where(t.eq(schema.gamesTable.id, game.id));
          await this.broadcastToGame(game.id, {
            type: "accepted",
            data: {
              whitePlayerId: game.whitePlayerId,
              blackPlayerId: session.playerId,
            },
          });
          return new Response("Game accepted", { status: 200 });
        }
        // not an invite game, must be an open game
        if (game.blackPlayerId === null) {
          await this.db
            .update(schema.gamesTable)
            .set({
              blackPlayerId: session.playerId,
              blackAccepted: 1,
              lastMoveAt: now.toISOString(),
            })
            .where(t.eq(schema.gamesTable.id, game.id));
          await this.broadcastToGame(game.id, {
            type: "accepted",
            data: {
              whitePlayerId: game.whitePlayerId,
              blackPlayerId: session.playerId,
            },
          });
          return new Response("Game accepted", { status: 200 });
        }
        if (game.whitePlayerId === null) {
          await this.db
            .update(schema.gamesTable)
            .set({
              whitePlayerId: session.playerId,
              whiteAccepted: 1,
              lastMoveAt: now.toISOString(),
            })
            .where(t.eq(schema.gamesTable.id, game.id));
          await this.broadcastToGame(game.id, {
            type: "accepted",
            data: {
              whitePlayerId: session.playerId,
              blackPlayerId: game.blackPlayerId,
            },
          });
          return new Response("Game accepted", { status: 200 });
        }
        // not an invite game, and both sides are filled
        return new Response("Game already accepted", { status: 409 });
      } else {
        return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  async broadcastToGame(gameId: string, message: ServerMsg) {
    for (const [ws, info] of this.sockets.entries()) {
      if (info.gameId === gameId) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  async alarm(alarmInfo?: AlarmInvocationInfo): Promise<void> {
    if (!alarmInfo) {
      return;
    }
    const gameId = await this.ctx.storage.get<string>("id");
    if (!gameId) {
      return;
    }
    const game = await this.getGame(gameId);
    if (!game) {
      return;
    }
    const now = new Date();
    const sinceLastMove =
      now.getTime() - new Date(game.lastMoveAt || game.createdAt!).getTime();
    let whiteTimeLeft = game.whiteTimeLeft;
    let blackTimeLeft = game.blackTimeLeft;
    if (game.nextMove % 2 === 1 && whiteTimeLeft !== null) {
      whiteTimeLeft = whiteTimeLeft - sinceLastMove;
      if (whiteTimeLeft <= 0) {
        // white loses on time
        await this.db
          .update(schema.gamesTable)
          .set({ status: "black_win", whiteTimeLeft: 0 })
          .where(t.eq(schema.gamesTable.id, game.id));
        await this.broadcastToGame(game.id, {
          type: "game_over",
          data: { result: "black_win" },
        });
        return;
      }
    }
    if (game.nextMove % 2 === 0 && blackTimeLeft !== null) {
      blackTimeLeft = blackTimeLeft - sinceLastMove;
      if (blackTimeLeft <= 0) {
        // black loses on time
        await this.db
          .update(schema.gamesTable)
          .set({
            status: "white_win",
            blackTimeLeft: 0,
          })
          .where(t.eq(schema.gamesTable.id, game.id));
        await this.broadcastToGame(game.id, {
          type: "game_over",
          data: { result: "white_win" },
        });
        return;
      }
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const msg: ClientMsg = JSON.parse(message.toString());
    const socketInfo = this.sockets.get(ws);
    if (!socketInfo) {
      return;
    }
    const game = await this.getGame(socketInfo.gameId);
    if (!game) {
      return;
    }
    switch (msg.type) {
      case "move":
        const turn = game.nextMove % 2 === 1 ? "white" : "black";
        if (turn === msg.data.side) {
          console.log("Processing move:", msg.data);
          if (
            (msg.data.side === "white" &&
              socketInfo.playerId === game.whitePlayerId) ||
            (msg.data.side === "black" &&
              socketInfo.playerId === game.blackPlayerId)
          ) {
            console.log("Player is authorized for this move");
            // check valid move
            const moves = await getMovesForGame(this.db, game.id);
            console.log("Existing moves:", moves);
            const pieces = computePieceState(moves);
            const piece = pieces.find((p) => p.position === msg.data.from);
            if (!piece) {
              console.log("No piece at from position");
              return;
            }
            const pseudoLegalMoves = generatePseudoLegalMovesForPiece(
              piece,
              pieces,
            );
            const isValid = pseudoLegalMoves.includes(msg.data.to);
            if (!isValid) {
              console.log("Move is not valid");
              return;
            }
            const now = new Date();
            const sinceLastMove =
              now.getTime() -
              new Date(game.lastMoveAt || game.createdAt!).getTime();
            let whiteTimeLeft = game.whiteTimeLeft;
            let blackTimeLeft = game.blackTimeLeft;
            if (turn === "white" && whiteTimeLeft !== null) {
              whiteTimeLeft = whiteTimeLeft - sinceLastMove;
              if (whiteTimeLeft < 0) {
                // white loses on time, this is handled by the alarm
                return;
              }
            }
            if (turn === "black" && blackTimeLeft !== null) {
              blackTimeLeft = blackTimeLeft - sinceLastMove;
              if (blackTimeLeft < 0) {
                // black loses on time, this is handled by the alarm
                return;
              }
            }
            await this.db
              .update(schema.gamesTable)
              .set({
                nextMove: game.nextMove + 1,
                lastMoveAt: now.toISOString(),
                whiteTimeLeft,
                blackTimeLeft,
              })
              .where(t.eq(schema.gamesTable.id, game.id));
            if (turn === "white" && blackTimeLeft !== null) {
              // it was white's turn, now it's black's turn so we set an alarm for when they run out of time
              this.ctx.storage.setAlarm(Date.now() + blackTimeLeft + 10);
            } else if (turn === "black" && whiteTimeLeft !== null) {
              // it was black's turn, now it's white's turn so we set an alarm for when they run out of time
              this.ctx.storage.setAlarm(Date.now() + whiteTimeLeft + 10);
            }
            const moveId = await recordMove(this.db, {
              gameId: game.id,
              playerId: socketInfo.playerId,
              from: msg.data.from,
              to: msg.data.to,
              moveNumber: game.nextMove,
              // TODO: implement promotions
              promotion: null,
            });
            await this.broadcastToGame(game.id, {
              type: "move",
              data: {
                move: {
                  id: moveId,
                  gameId: game.id,
                  playerId: socketInfo.playerId,
                  fromSquare: msg.data.from,
                  toSquare: msg.data.to,
                  promotion: null,
                  moveNumber: game.nextMove,
                  createdAt: now.toISOString(),
                },
                nextMove: game.nextMove + 1,
                lastMoveAt: now.toISOString(),
                whiteTimeLeft,
                blackTimeLeft,
              },
            });
          }
        }
        break;
      case "resign":
        // Handle resign logic here
        break;
      case "accept":
        if (socketInfo.playerId === game.whitePlayerId) {
          await this.db
            .update(schema.gamesTable)
            .set({ whiteAccepted: 1 })
            .where(t.eq(schema.gamesTable.id, game.id));
          await this.broadcastToGame(game.id, {
            type: "accepted",
            data: {
              whitePlayerId: game.whitePlayerId,
              blackPlayerId: game.blackPlayerId,
            },
          });
        }
        if (socketInfo.playerId === game.blackPlayerId) {
          await this.db
            .update(schema.gamesTable)
            .set({ blackAccepted: 1 })
            .where(t.eq(schema.gamesTable.id, game.id));
          await this.broadcastToGame(game.id, {
            type: "accepted",
            data: {
              whitePlayerId: game.whitePlayerId,
              blackPlayerId: game.blackPlayerId,
            },
          });
        }
        break;
      case "sync_request":
        const moves = await getMovesForGame(this.db, game.id);
        await this.broadcastToGame(game.id, {
          type: "sync",
          data: {
            game,
            moves,
          },
        });
        break;
    }
  }

  async webSocketClose(
    ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean,
  ) {
    const socketInfo = this.sockets.get(ws);
    this.sockets.delete(ws);
    if (!socketInfo) {
      return;
    }
    const game = await this.getGame(socketInfo.gameId);
    if (!game) {
      return;
    }
    const now = new Date().toISOString();
    if (socketInfo.playerId === game.whitePlayerId) {
      await this.db
        .update(schema.gamesTable)
        .set({ whiteDisconnectedAt: now })
        .where(t.eq(schema.gamesTable.id, game.id));
      game.whiteDisconnectedAt = now;
    }
    if (socketInfo.playerId === game.blackPlayerId) {
      await this.db
        .update(schema.gamesTable)
        .set({ blackDisconnectedAt: now })
        .where(t.eq(schema.gamesTable.id, game.id));
      game.blackDisconnectedAt = now;
    }
    // if one player has not accepted and the other disconnects, end the game
    if (
      (game.whiteDisconnectedAt && !game.blackAccepted) ||
      (game.blackDisconnectedAt && !game.whiteAccepted)
    ) {
      await this.db
        .update(schema.gamesTable)
        .set({ deletedAt: now, status: "aborted" })
        .where(t.eq(schema.gamesTable.id, game.id));
      this.broadcastToGame(game.id, { type: "aborted" });
    }
  }
}

const URL_PATTERN = /\/games\/([a-f0-9\-]+)\//;

export default {
  fetch(request: Request, env: CloudflareEnv) {
    const gameId = request.url.match(URL_PATTERN)?.[1];
    if (!gameId) {
      return new Response("Game ID missing in URL", { status: 400 });
    }
    return env.GAME_OBJECT.getByName(gameId).fetch(request);
  },
};
