import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { parse } from "cookie";
import {
  ClientMsg,
  GameVariant,
  schema,
  ServerMsg,
  sessionsTable,
} from "../shared";
import * as t from "drizzle-orm";
import { getMovesForGame, recordMove } from "shared/moves";
import {
  getBoardStatusFromState,
  getLegalMovesFromState,
  getPromotionOptionsForMove,
  getState,
  updateStateWithMove,
} from "shared/rules";

export class GameObject extends DurableObject<CloudflareEnv> {
  db: DrizzleD1Database<typeof schema>;
  sockets: Map<
    WebSocket,
    {
      gameId: string;
      playerId: string | null;
      lastWhiteDrawAt: string | null;
      lastBlackDrawAt: string | null;
    }
  >;
  lock: Lock = new Lock();

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
    await this.lock.acquire();
    try {
      // this is here because Wrangler just likes to raise an error sometimes if the body isn't used
      if (request.method === "POST" || request.method === "PUT") {
        await request.text();
      }
      const cookie = parse(request.headers.get("Cookie") || "");
      const gameId = request.url.match(URL_PATTERN)?.[1] as string;
      await this.ctx.storage.put("id", gameId);
      const sessionToken = cookie["session_token"] ?? "";
      const sessions = await this.db
        .select()
        .from(sessionsTable)
        .where(
          t.and(
            t.eq(sessionsTable.token, sessionToken),
            t.gt(sessionsTable.expiresAt, new Date().toISOString()),
          ),
        )
        .limit(1);
      const session = sessions.length > 0 ? sessions[0] : null;
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
          session &&
          session.playerId === game.whitePlayerId &&
          game.whiteDisconnectedAt
        ) {
          await this.db
            .update(schema.gamesTable)
            .set({ whiteDisconnectedAt: null })
            .where(t.eq(schema.gamesTable.id, game.id));
        }
        if (
          session &&
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

        server.serializeAttachment({
          gameId,
          playerId: session?.playerId || null,
        });
        this.sockets.set(server, {
          gameId,
          playerId: session?.playerId || null,
          lastBlackDrawAt: null,
          lastWhiteDrawAt: null,
        });

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      } else if (request.url.endsWith("/accept") && session) {
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
              lastMoveAt: now.toISOString(),
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
              lastMoveAt: now.toISOString(),
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
              lastMoveAt: now.toISOString(),
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
              lastMoveAt: now.toISOString(),
            },
          });
          return new Response("Game accepted", { status: 200 });
        }
        // not an invite game, and both sides are filled
        return new Response("Game already accepted", { status: 409 });
      } else if (request.url.endsWith("/abort") && session) {
        // in this case, we want to check if the game is still in queue and abort it
        const now = new Date();
        if (
          game.status === "ongoing" &&
          game.deletedAt === null &&
          ((game.whitePlayerId === session.playerId &&
            game.blackPlayerId === null) ||
            (game.blackPlayerId === session.playerId &&
              game.whitePlayerId === null))
        ) {
          await this.db
            .update(schema.gamesTable)
            .set({ status: "aborted", deletedAt: now.toISOString() })
            .where(t.eq(schema.gamesTable.id, game.id));
          await this.broadcastToGame(game.id, { type: "aborted" });
          return new Response("Game aborted", { status: 200 });
        }
        return new Response("Game cannot be aborted", { status: 403 });
      } else {
        return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      return new Response("Internal Server Error", { status: 500 });
    } finally {
      this.lock.release();
    }
  }

  private terminalResultFromPosition(
    positionState: "ongoing" | "check" | "checkmate" | "stalemate" | "draw",
    sideToMove: "wht" | "blk",
  ): { status: "white_win" | "black_win" | "draw" } | null {
    if (positionState === "checkmate") {
      return sideToMove === "wht"
        ? { status: "black_win" }
        : { status: "white_win" };
    }
    if (positionState === "stalemate" || positionState === "draw") {
      return { status: "draw" };
    }
    return null;
  }

  async broadcastToGame(gameId: string, message: ServerMsg) {
    for (const [ws, info] of this.sockets.entries()) {
      if (info.gameId === gameId) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  private async finishGameWithClock(
    gameId: string,
    update: {
      status:
        | "white_win"
        | "black_win"
        | "draw"
        | "white_resign"
        | "black_resign";
      whiteTimeLeft?: number | null;
      blackTimeLeft?: number | null;
    },
  ) {
    await this.db
      .update(schema.gamesTable)
      .set(update)
      .where(t.eq(schema.gamesTable.id, gameId));
    await this.broadcastToGame(gameId, {
      type: "game_over",
      data: {
        result: update.status,
        whiteTimeLeft:
          update.whiteTimeLeft === undefined ? null : update.whiteTimeLeft,
        blackTimeLeft:
          update.blackTimeLeft === undefined ? null : update.blackTimeLeft,
      },
    });
  }

  async alarm(alarmInfo?: AlarmInvocationInfo): Promise<void> {
    await this.lock.acquire();
    try {
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
      if (
        game.whitePlayerId === game.blackPlayerId &&
        game.blackDisconnectedAt &&
        game.status === "ongoing"
      ) {
        await this.db
          .update(schema.gamesTable)
          .set({ deletedAt: now.toISOString(), status: "aborted" })
          .where(t.eq(schema.gamesTable.id, game.id));
        await this.broadcastToGame(game.id, { type: "aborted" });
        return;
      }
      if (
        (game.whiteDisconnectedAt && !game.blackAccepted) ||
        (game.blackDisconnectedAt && !game.whiteAccepted)
      ) {
        await this.db
          .update(schema.gamesTable)
          .set({ deletedAt: now.toISOString(), status: "aborted" })
          .where(t.eq(schema.gamesTable.id, game.id));
        await this.broadcastToGame(game.id, { type: "aborted" });
      }
      if (game.lastMoveAt === null) {
        return;
      }
      const sinceLastMove = now.getTime() - new Date(game.lastMoveAt).getTime();
      let whiteTimeLeft = game.whiteTimeLeft;
      let blackTimeLeft = game.blackTimeLeft;
      if (game.nextMove % 2 === 1 && whiteTimeLeft !== null) {
        whiteTimeLeft = whiteTimeLeft - sinceLastMove;
        if (whiteTimeLeft <= 0) {
          // white loses on time
          await this.finishGameWithClock(game.id, {
            status: "black_win",
            whiteTimeLeft: 0,
            blackTimeLeft: blackTimeLeft ?? null,
          });
          return;
        }
      }
      if (game.nextMove % 2 === 0 && blackTimeLeft !== null) {
        blackTimeLeft = blackTimeLeft - sinceLastMove;
        if (blackTimeLeft <= 0) {
          // black loses on time
          await this.finishGameWithClock(game.id, {
            status: "white_win",
            whiteTimeLeft: whiteTimeLeft ?? null,
            blackTimeLeft: 0,
          });
          return;
        }
      }
    } finally {
      this.lock.release();
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    await this.lock.acquire();
    try {
      let msg: ClientMsg;
      try {
        msg = JSON.parse(message.toString());
      } catch {
        // Malformed JSON – ignore silently, do not crash the handler
        return;
      }
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
          if (!socketInfo.playerId) {
            break;
          }
          const turn = game.nextMove % 2 === 1 ? "white" : "black";
          console.log("It's", turn, "turn");
          if (
            turn === msg.data.side &&
            game.status === "ongoing" &&
            msg.data.from != msg.data.to
          ) {
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
              const state = getState(game.variant as GameVariant, moves);
              const piece = state.board.get(msg.data.from);
              if (!piece) {
                console.log("No piece at from position");
                return;
              }
              if (
                (piece.color == "wht" && turn == "black") ||
                (piece.color == "blk" && turn == "white")
              ) {
                console.log("Piece at from position does not belong to player");
                return;
              }
              const legalMoves = getLegalMovesFromState(state, msg.data.from);
              const isValid = legalMoves.includes(msg.data.to);
              if (!isValid) {
                console.log("Move is not valid");
                return;
              }
              const promotionOptions = getPromotionOptionsForMove(
                piece.type,
                piece.color,
                msg.data.to,
              );
              if (promotionOptions.length > 0) {
                if (
                  !msg.data.promotion ||
                  !promotionOptions.includes(msg.data.promotion)
                ) {
                  console.log("Promotion is required and must be valid");
                  return;
                }
              } else if (msg.data.promotion) {
                console.log("Promotion is not allowed for this move");
                return;
              }
              const promotion = msg.data.promotion ?? null;
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
              const moveId = await recordMove(this.db, {
                gameId: game.id,
                playerId: socketInfo.playerId,
                from: msg.data.from,
                to: msg.data.to,
                moveNumber: game.nextMove,
                promotion,
              });
              const move = {
                id: moveId,
                gameId: game.id,
                playerId: socketInfo.playerId,
                fromSquare: msg.data.from,
                toSquare: msg.data.to,
                promotion,
                moveNumber: game.nextMove,
                createdAt: now.toISOString(),
              };
              const movesAfter = [...moves, move];
              const nextSide = turn === "white" ? "blk" : "wht";
              updateStateWithMove(
                state,
                move.fromSquare,
                move.toSquare,
                move.promotion,
              );
              const positionState = getBoardStatusFromState(
                state,
                movesAfter,
                nextSide,
              );
              const terminal = this.terminalResultFromPosition(
                positionState,
                nextSide,
              );

              await this.db
                .update(schema.gamesTable)
                .set({
                  nextMove: game.nextMove + 1,
                  lastMoveAt: now.toISOString(),
                  whiteTimeLeft,
                  blackTimeLeft,
                  status: terminal ? terminal.status : game.status,
                })
                .where(t.eq(schema.gamesTable.id, game.id));
              if (!terminal) {
                if (turn === "white" && blackTimeLeft !== null) {
                  // it was white's turn, now it's black's turn so we set an alarm for when they run out of time
                  this.ctx.storage.setAlarm(Date.now() + blackTimeLeft + 10);
                } else if (turn === "black" && whiteTimeLeft !== null) {
                  // it was black's turn, now it's white's turn so we set an alarm for when they run out of time
                  this.ctx.storage.setAlarm(Date.now() + whiteTimeLeft + 10);
                }
              }
              await this.broadcastToGame(game.id, {
                type: "move",
                data: {
                  move,
                  nextMove: game.nextMove + 1,
                  lastMoveAt: now.toISOString(),
                  whiteTimeLeft,
                  blackTimeLeft,
                },
              });
              if (terminal) {
                await this.broadcastToGame(game.id, {
                  type: "game_over",
                  data: {
                    result: terminal.status,
                    whiteTimeLeft: whiteTimeLeft ?? null,
                    blackTimeLeft: blackTimeLeft ?? null,
                  },
                });
              }
            }
          }
          break;
        case "accept":
          if (!socketInfo.playerId) {
            break;
          }
          if (
            socketInfo.playerId === game.whitePlayerId &&
            !game.whiteAccepted
          ) {
            await this.db
              .update(schema.gamesTable)
              .set({ whiteAccepted: 1, lastMoveAt: new Date().toISOString() })
              .where(t.eq(schema.gamesTable.id, game.id));
            await this.broadcastToGame(game.id, {
              type: "accepted",
              data: {
                whitePlayerId: game.whitePlayerId,
                blackPlayerId: game.blackPlayerId,
              },
            });
          }
          if (
            socketInfo.playerId === game.blackPlayerId &&
            !game.blackAccepted
          ) {
            await this.db
              .update(schema.gamesTable)
              .set({ blackAccepted: 1, lastMoveAt: new Date().toISOString() })
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
        case "resign":
          if (!socketInfo.playerId) {
            break;
          }
          if (
            socketInfo.playerId !== game.whitePlayerId &&
            socketInfo.playerId !== game.blackPlayerId
          ) {
            return;
          }
          if (game.status !== "ongoing") {
            return;
          }
          // if this is a local game, the current turn resigns
          // otherwise it's the player who sent the message
          const side =
            game.whitePlayerId === game.blackPlayerId
              ? game.nextMove % 2 === 1
                ? "white"
                : "black"
              : socketInfo.playerId === game.whitePlayerId
              ? "white"
              : "black";
          const now = new Date();
          const elapsed =
            now.getTime() -
            new Date(game.lastMoveAt || game.createdAt!).getTime();
          const whiteTimeLeft =
            game.nextMove % 2 === 1 && game.whiteTimeLeft !== null
              ? Math.max(0, game.whiteTimeLeft - elapsed)
              : game.whiteTimeLeft;
          const blackTimeLeft =
            game.nextMove % 2 === 0 && game.blackTimeLeft !== null
              ? Math.max(0, game.blackTimeLeft - elapsed)
              : game.blackTimeLeft;
          await this.finishGameWithClock(game.id, {
            status: side === "white" ? "white_resign" : "black_resign",
            whiteTimeLeft,
            blackTimeLeft,
          });
          break;
        case "draw":
          if (!socketInfo.playerId) {
            break;
          }
          if (
            socketInfo.playerId !== game.whitePlayerId &&
            socketInfo.playerId !== game.blackPlayerId
          ) {
            return;
          }
          if (game.status !== "ongoing") {
            return;
          }
          if (game.whitePlayerId === game.blackPlayerId) {
            const now = new Date();
            const elapsed =
              now.getTime() -
              new Date(game.lastMoveAt || game.createdAt!).getTime();
            const whiteTimeLeft =
              game.nextMove % 2 === 1 && game.whiteTimeLeft !== null
                ? Math.max(0, game.whiteTimeLeft - elapsed)
                : game.whiteTimeLeft;
            const blackTimeLeft =
              game.nextMove % 2 === 0 && game.blackTimeLeft !== null
                ? Math.max(0, game.blackTimeLeft - elapsed)
                : game.blackTimeLeft;
            await this.finishGameWithClock(game.id, {
              status: "draw",
              whiteTimeLeft,
              blackTimeLeft,
            });
          } else {
            const now = new Date();
            if (
              (game.whitePlayerId === socketInfo.playerId &&
                game.blackDrawOffer) ||
              (game.blackPlayerId === socketInfo.playerId &&
                game.whiteDrawOffer)
            ) {
              const elapsed =
                now.getTime() -
                new Date(game.lastMoveAt || game.createdAt!).getTime();
              const whiteTimeLeft =
                game.nextMove % 2 === 1 && game.whiteTimeLeft !== null
                  ? Math.max(0, game.whiteTimeLeft - elapsed)
                  : game.whiteTimeLeft;
              const blackTimeLeft =
                game.nextMove % 2 === 0 && game.blackTimeLeft !== null
                  ? Math.max(0, game.blackTimeLeft - elapsed)
                  : game.blackTimeLeft;
              await this.db
                .update(schema.gamesTable)
                .set({
                  status: "draw",
                  whiteDrawOffer: 1,
                  blackDrawOffer: 1,
                  whiteTimeLeft,
                  blackTimeLeft,
                })
                .where(t.eq(schema.gamesTable.id, game.id));
              await this.broadcastToGame(game.id, {
                type: "game_over",
                data: {
                  result: "draw",
                  whiteTimeLeft: whiteTimeLeft ?? null,
                  blackTimeLeft: blackTimeLeft ?? null,
                },
              });
            } else if (game.whitePlayerId === socketInfo.playerId) {
              if (
                socketInfo.lastWhiteDrawAt &&
                socketInfo.lastWhiteDrawAt > game.lastMoveAt!
              ) {
                // rate limit to 1 per move
                await this.broadcastToGame(game.id, {
                  type: "draw_rate_limit",
                  data: { side: "white" },
                });
                return;
              }
              socketInfo.lastWhiteDrawAt = new Date().toISOString();
              await this.db
                .update(schema.gamesTable)
                .set({ whiteDrawOffer: game.whiteDrawOffer ? 0 : 1 })
                .where(t.eq(schema.gamesTable.id, game.id));
              await this.broadcastToGame(game.id, {
                type: "draw_offer",
                data: {
                  whiteDrawOffer: game.whiteDrawOffer ? 0 : 1,
                  blackDrawOffer: game.blackDrawOffer || 0,
                },
              });
            } else if (game.blackPlayerId === socketInfo.playerId) {
              if (
                socketInfo.lastBlackDrawAt &&
                socketInfo.lastBlackDrawAt > game.lastMoveAt!
              ) {
                // rate limit to 1 per move
                await this.broadcastToGame(game.id, {
                  type: "draw_rate_limit",
                  data: { side: "black" },
                });
                return;
              }
              socketInfo.lastBlackDrawAt = new Date().toISOString();
              await this.db
                .update(schema.gamesTable)
                .set({ blackDrawOffer: game.blackDrawOffer ? 0 : 1 })
                .where(t.eq(schema.gamesTable.id, game.id));
              await this.broadcastToGame(game.id, {
                type: "draw_offer",
                data: {
                  blackDrawOffer: game.blackDrawOffer ? 0 : 1,
                  whiteDrawOffer: game.whiteDrawOffer || 0,
                },
              });
            }
          }
          break;
        case "draw_reject":
          if (!socketInfo.playerId) {
            break;
          }
          if (
            socketInfo.playerId !== game.whitePlayerId &&
            socketInfo.playerId !== game.blackPlayerId
          ) {
            return;
          }
          if (game.status !== "ongoing") {
            return;
          }
          await this.db
            .update(schema.gamesTable)
            .set({ whiteDrawOffer: 0, blackDrawOffer: 0 })
            .where(t.eq(schema.gamesTable.id, game.id));
          await this.broadcastToGame(game.id, {
            type: "draw_reject",
          });
          break;
      }
    } finally {
      this.lock.release();
    }
  }

  async webSocketClose(ws: WebSocket) {
    await this.lock.acquire();
    try {
      const socketInfo = this.sockets.get(ws);
      this.sockets.delete(ws);
      if (!socketInfo) {
        return;
      }
      const game = await this.getGame(socketInfo.gameId);
      if (!game) {
        return;
      }
      const isLastSocketForPlayer = ![...this.sockets.values()].some(
        (info) =>
          info.gameId === socketInfo.gameId &&
          info.playerId === socketInfo.playerId,
      );
      if (!isLastSocketForPlayer) {
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
        this.ctx.storage.setAlarm(Date.now() + 30000); // 30 seconds to reconnect
      }
      if (
        game.whitePlayerId === game.blackPlayerId &&
        game.whiteDisconnectedAt
      ) {
        console.log("Local game disconnected, setting alarm to abort");
        this.ctx.storage.setAlarm(Date.now() + 30000); // 30 seconds to reconnect
      }
    } finally {
      this.lock.release();
    }
  }
}

const URL_PATTERN = /\/games\/([a-f0-9\-]+)\//;

const exports = {
  fetch(request: Request, env: CloudflareEnv) {
    const gameId = request.url.match(URL_PATTERN)?.[1];
    if (!gameId) {
      return new Response("Game ID missing in URL", { status: 400 });
    }
    return env.GAME_OBJECT.getByName(gameId).fetch(request);
  },
};
export default exports;

class Lock {
  private locked: boolean = false;
  private waiting: Array<() => void> = [];

  async acquire() {
    if (this.locked) {
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
  }

  release() {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      if (resolve) {
        resolve();
      }
    } else {
      this.locked = false;
    }
  }
}
